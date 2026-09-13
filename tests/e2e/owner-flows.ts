import AxeBuilder from '@axe-core/playwright';
import {
  test,
  expect,
  startOwner,
  testSession,
  ownerHost,
  noOverflow,
  OWNER_PATHS,
  OWNER_UNBUILT,
  openAlerts,
  openDocuments,
  type OwnerApp,
} from './owner-helpers';

const PNG = 'apps/pwa/static/icons/icon-192.png';

export function ownerFlows(app: OwnerApp) {
  const paths = OWNER_PATHS[app];
  // 지도 준비·단계 표식은 타일 로드(현장 줌 17)를 기다린다 — 캡처 도구와 같은 20초
  const MAP = { timeout: 20_000 } as const;
  test('[B0-01] [FR-001] [AC-O01] login form rejects wrong credentials and accepts the demo owner account', async ({
    page,
  }) => {
    await page.goto(paths.entry);
    const form = page.getByRole('button', { name: '로그인', exact: true });
    await page.getByLabel('아이디').fill('owner01');
    await page.getByLabel('비밀번호', { exact: true }).fill('wrong');
    await form.click();
    await expect(page.getByRole('alert')).toContainText('아이디 또는 비밀번호');
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.session'))).toBeNull();
    await page.getByLabel('비밀번호', { exact: true }).fill('boomeyes');
    await form.click();
    await expect(page).toHaveURL(new RegExp(`${paths.overview.replaceAll('/', '\\/')}(?:\\?|$)`));
    await expect(ownerHost(page, 'overview')).toHaveAttribute('data-owner-role', 'owner');
  });
  test('[B1-02] [FR-024] [AC-O01] actual owner entry, working menus and the alert bell', async ({ page }) => {
    await page.goto(paths.entry);
    await expect(page.getByRole('button', { name: '데모 계정으로 로그인', exact: true })).toBeVisible();
    for (const account of ['control01', 'ops01', 'maint01', 'owner01'])
      await expect(page.getByText(account, { exact: true })).toHaveCount(0);
    await startOwner(page, app);
    // 메뉴는 운영 현황 · 보유 장비 둘이다 — 이상·점검과 장비 서류는 종 패널과 호기 화면으로 내려갔다
    const expected = [
      ['보유 장비', 'fleet'],
      ['운영 현황', 'overview'],
    ] as const;
    for (const [label, view] of expected) {
      await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
      await expect(ownerHost(page, view)).toBeVisible();
    }
    await openAlerts(page);
    await expect(ownerHost(page, 'alerts')).toBeVisible();
    await openDocuments(page);
    await expect(ownerHost(page, 'documents')).toBeVisible();
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await expect(page.getByRole('button', { name: '데모 계정으로 로그인', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.session'))).toBeNull();
  });

  test('[B1-02] [FR-024] [AC-O02] [AC-O03] [AC-O15] search → same device contract/contact → return keeps filter', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    const search = page.getByLabel('호기·현장 검색', { exact: true });
    await search.fill('마포');
    await page.getByLabel('상태', { exact: true }).selectOption('deployed');
    // 웹은 표의 행, PWA는 카드 — 둘 다 data-device를 지닌다
    const devices = ownerHost(page, 'fleet').locator('[data-device]');
    await expect(devices).toHaveCount(5); // 마포 현장 호기 1·6·7·8·9
    const device = devices.first();
    await expect(device).toHaveAttribute('data-device', 'CPB-001');
    await device.click();
    const detail = ownerHost(page, 'detail');
    await expect(detail).toContainText('CPB-001');
    for (const fact of ['마포 주상복합 신축', '한빛건설', '김현장', '010-0000-0000'])
      await expect(detail).toContainText(fact);
    await expect(detail).toContainText(/2026[.\-/년 ]+0?6/);
    await expect(detail).toContainText(/2026[.\-/년 ]+0?9/);
    await page.getByRole('link', { name: '장비 목록으로', exact: true }).click();
    await expect(search).toHaveValue('마포');
    await expect(page.getByLabel('상태', { exact: true })).toHaveValue('deployed');
    await expect(devices).toHaveCount(5);
    await page.reload();
    await expect(search).toHaveValue('마포');
    await expect(device).toHaveAttribute('data-device', 'CPB-001');
    await search.fill('5호기');
    await page.getByLabel('상태', { exact: true }).selectOption('stored');
    await expect(devices).toHaveCount(1); // 보관 17대 중 '5호기'는 5호기뿐(85·95는 투입)
    await expect(device).toContainText('보관');
    await expect(device).toHaveAttribute('data-device', 'CPB-005');
    await expect(device).not.toContainText('즉시 투입 가능');
  });

  // 시안의 계약 — 요청을 받아 후보(보관 + 종료 임박)에서 호기를 배정한다(«확정 2026-09-12» · FR-026)
  test('[B1-02] [FR-026] [AC-O07] request assignment fills N/N and writes the lease onto the unit', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.getByRole('navigation').getByRole('link', { name: '계약', exact: true }).click();
    const screen = page.locator('[data-owner-requests]');
    await expect(screen).toBeVisible();
    await expect(screen.locator('[data-request]')).toHaveCount(6);
    // 낼 수 있는 호기가 없는 요청 — 보유 기종이 32m뿐이라 40m 사양은 후보가 0이다
    await screen.locator('[data-request="REQ-006"]').click();
    await expect(page).toHaveURL(/request=REQ-006/);
    await expect(screen.locator('[data-candidate]')).toHaveCount(0);
    await expect(screen).toContainText('이 기간에 낼 수 있는 호기가 없습니다');
    await screen.getByRole('button', { name: '요청 목록', exact: true }).click();
    // 접수된 요청 — 후보는 보관 + 종료 임박에서 나오고 N/N을 채워야 확정할 수 있다
    await screen.locator('[data-request="REQ-001"]').click();
    await expect(screen.locator('[data-assign-count]')).toHaveText('0 / 3대');
    const confirm = screen.getByRole('button', { name: '배정 확정 · 회신', exact: true });
    await expect(confirm).toBeDisabled();
    const candidates = screen.locator('[data-candidate]');
    await expect(candidates.first()).toBeVisible();
    const picks: string[] = [];
    for (let i = 0; i < 3; i++) {
      const row = candidates.nth(i);
      picks.push((await row.getAttribute('data-candidate'))!);
      await row.getByRole('button', { name: '배정', exact: true }).click();
    }
    await expect(screen.locator('[data-assign-count]')).toHaveText('3 / 3대');
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByRole('status').filter({ hasText: '배정을 회신했습니다' })).toBeVisible();
    // 확정은 요청 상태와 호기 계약을 함께 바꾼다 — 보유 장비가 같은 자료를 읽는다
    await screen.getByRole('button', { name: '요청 목록', exact: true }).click();
    await expect(screen.locator('[data-request="REQ-001"]')).toContainText('운송·설치');
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await page.getByLabel('호기·현장 검색', { exact: true }).fill('대성건설');
    const fleet = ownerHost(page, 'fleet');
    for (const id of picks) await expect(fleet.locator(`[data-device="${id}"]`)).toHaveCount(1);
  });

  // 시안의 보유 장비 — 표 하나 · 검색 1 · 필터 3축 · 현장별 묶어 보기(«확정 2026-09-12»)
  test('[B1-02] [FR-025] [AC-O07] fleet sorts by header, filters on three axes and groups by site', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    const fleet = ownerHost(page, 'fleet');
    const rows = fleet.locator('[data-device]');
    const table = fleet.getByRole('table');
    // 기본 정렬은 확인 필요 우선 — 고장이 맨 위다(호기 번호가 아니다)
    await expect(rows.first()).toHaveAttribute('data-device', 'CPB-002');
    if (app === 'web') {
      // 웹은 표 · 머리글을 눌러 정렬한다
      await expect(table).toHaveCount(1);
      await expect(page.getByLabel('정렬', { exact: true })).toHaveCount(0);
      const unit = table.getByRole('columnheader', { name: '호기' });
      await unit.getByRole('button').click();
      await expect(unit).toHaveAttribute('aria-sort', 'ascending');
      await expect(rows.first()).toHaveAttribute('data-device', 'CPB-001');
      await unit.getByRole('button').click();
      await expect(unit).toHaveAttribute('aria-sort', 'descending');
      await expect(rows.first()).toHaveAttribute('data-device', 'CPB-121');
    } else {
      // PWA는 카드 리스트를 유지한다(사용자 결정) — 표를 쓰지 않고 정렬은 선택 상자다
      await expect(table).toHaveCount(0);
      await page.getByLabel('정렬', { exact: true }).selectOption('unit');
      await expect(rows.first()).toHaveAttribute('data-device', 'CPB-001');
    }
    // 세 축 — 현장 · 계약 종료 · 상태. 축은 함께 걸린다
    await page.getByLabel('현장', { exact: true }).selectOption({ label: '마포 주상복합 신축' });
    await expect(rows).toHaveCount(5);
    await expect(fleet.getByRole('status')).toHaveText('전체 120대 중 5대 표시');
    await page.getByLabel('현장', { exact: true }).selectOption('all');
    await page.getByLabel('계약 종료', { exact: true }).selectOption('30');
    const soon = await rows.count();
    expect(soon).toBeGreaterThan(0);
    // 30일 안에 끝나는 계약만 남았다 — 남은 일수 표시(웹은 주의 칩, PWA는 카드의 D-n)와 필터가 같은 값을 쓴다
    for (const row of await rows.all()) await expect(row).toContainText(/D[-+]\d+|오늘|종료됨/);
    await page.getByLabel('계약 종료', { exact: true }).selectOption('90');
    expect(await rows.count()).toBeGreaterThanOrEqual(soon);
    await page.getByLabel('상태', { exact: true }).selectOption('stored');
    await expect(rows).toHaveCount(0); // 보관 장비에는 진행 중인 계약이 없다
    await expect(fleet.getByRole('status')).toHaveText('전체 120대 중 0대 표시');
    // 초기화 → 묶어 보기
    await page.getByRole('button', { name: '검색·필터 초기화', exact: true }).click();
    await expect(rows).toHaveCount(120);
    await page.getByRole('switch', { name: '현장별 묶어 보기', exact: true }).click();
    await expect(page).toHaveURL(/group=1/);
    const groups = fleet.locator('[data-fleet-group]');
    await expect(groups).toHaveCount(13);
    await expect(groups.first()).toContainText('대');
    await expect(rows).toHaveCount(120);
  });

  test('[B1-02] [FR-024] [AC-O04] [AC-O07] inventory axes and distinct affected devices', async ({ page }) => {
    await startOwner(page, app);
    const summary = page.locator('[data-owner-summary]');
    await expect(summary).toHaveAttribute('data-total', '120');
    await expect(summary).toHaveAttribute('data-deployed', '103');
    await expect(summary).toHaveAttribute('data-stored', '17');
    await expect(summary).toHaveAttribute('data-unknown', '0');
    await expect(ownerHost(page)).toContainText(/6대/);
    await page.goto(`${paths.overview}?capture=1&state=boundaries`);
    await expect(summary).toHaveAttribute('data-total', '120');
    await expect(summary).toHaveAttribute('data-deployed', '102');
    await expect(summary).toHaveAttribute('data-stored', '17');
    await expect(summary).toHaveAttribute('data-unknown', '1');
    // CPB-002 has both voltage and inspection alerts; inventory remains 120.
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(120);
  });

  test('[B1-02] [FR-024] [AC-O07] overview shows three of seven alerts and opens all seven', async ({ page }) => {
    await startOwner(page, app);
    await page.goto(`${paths.overview}?capture=1&state=boundaries`);
    const overview = ownerHost(page, 'overview');
    const preview = overview.getByRole('list', { name: '우선 확인 알림', exact: true });
    await expect(preview.getByRole('listitem')).toHaveCount(3);
    await expect(overview).toContainText('전체 알림 7건 중 3건 표시');
    await expect(overview.getByRole('heading', { name: '확인이 필요한 장비 6대', exact: true })).toBeVisible();
    // Connection alerts sort last, so CPB-004 must remain reachable outside the overview limit.
    await expect(preview.locator('[data-device="CPB-004"]')).toHaveCount(0);
    await overview.getByRole('link', { name: '알림 전체 보기', exact: true }).click();
    const alerts = ownerHost(page, 'alerts').getByRole('region', { name: '알림 목록', exact: true });
    await expect(alerts).toContainText('표시 7건 / 전체 7건');
    await expect(alerts.locator('[data-alert]')).toHaveCount(7);
    await expect(alerts.locator('[data-alert="CPB-004-STALE"]')).toBeVisible();
  });

  test('[B1-02] [FR-024] [AC-O07] overview lists 13 sites of 120 devices and opens the complete fleet', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.overview}?capture=1&state=large`);
    const overview = ownerHost(page, 'overview');
    const sites = overview.getByRole('list', { name: '현장 목록', exact: true });
    await expect(sites.getByRole('listitem')).toHaveCount(13);
    await expect(sites.locator('[data-site="SITE-MAPO"]')).toContainText('5대');
    await expect(overview).toContainText('전체 120대 · 13개 현장');
    await overview.getByRole('link', { name: '전체 장비 보기', exact: true }).click();
    const fleet = ownerHost(page, 'fleet');
    await expect(fleet.getByRole('status')).toHaveText('전체 120대 중 120대 표시');
    const devices = fleet.locator('[data-device]');
    await expect(devices).toHaveCount(120);
    await expect(fleet.locator('[data-device="CPB-121"]')).toHaveCount(1);
    await expect(fleet.locator('[data-device="CPB-101"]')).toHaveCount(0);
  });

  test('[B1-02] [FR-024] [AC-O08] [AC-O13] drilldown nation → site → unit plays live tile, survives reload and returns', async ({
    page,
  }) => {
    await startOwner(page, app);
    const overview = ownerHost(page, 'overview');
    const map = overview.locator('.be-map');
    await expect(map).toHaveAttribute('data-map-level', 'nation', MAP);
    await expect(page.getByRole('navigation', { name: '현황 경로', exact: true })).toContainText('전국');
    // nation → site: the site row drives the URL, the map re-arms at site level with the five Mapo units
    await overview.getByRole('list', { name: '현장 목록', exact: true }).locator('[data-site="SITE-MAPO"]').click();
    await expect(page).toHaveURL(/site=SITE-MAPO/);
    await expect(map).toHaveAttribute('data-map-level', 'site', MAP);
    await expect(map).toHaveAttribute('data-map-ready', '', MAP);
    await expect(map.locator('.be-marker')).toHaveCount(5);
    await expect(overview.getByRole('heading', { name: '마포 주상복합 신축', exact: true })).toBeFocused();
    await expect(overview.getByRole('list', { name: '현장 호기', exact: true }).locator('[data-device]')).toHaveCount(
      5,
    );
    // site → unit: the unit card opens the unit panel with a playing live tile
    await overview.getByRole('list', { name: '현장 호기', exact: true }).locator('[data-device="CPB-001"]').click();
    await expect(page).toHaveURL(/site=SITE-MAPO&device=CPB-001/);
    // 호기 단계는 지도 자리에 카메라 벽이 들어간다 — 그 단계에는 지도가 없다(시안 «확정 2026-09-12»)
    await expect(overview.locator('.be-map')).toHaveCount(0);
    const wall = overview.locator('[data-owner-cameras="CPB-001"]');
    await expect(wall).toBeVisible();
    await expect(overview.getByRole('heading', { name: '1호기', exact: true })).toBeFocused();
    // 벽이 살아 있는지만 본다 — 여섯이 「동시에」 재생되는지는 성능 성질이라 단언하면 취약해진다
    // (PWA는 시트가 아래를 가리므로 보이는지로도 판정하지 않는다)
    const videos = wall.locator('[data-live-tile] video');
    await expect(videos.first()).toBeAttached();
    await expect.poll(() => videos.evaluateAll((list) => list.some((v) => !(v as HTMLVideoElement).paused))).toBe(true);
    for (const fact of ['김현장', '380 V', '한빛건설', '1호기 제작증']) await expect(overview).toContainText(fact);
    // reload keeps the level from the URL
    await page.reload();
    await expect(ownerHost(page, 'overview').locator('[data-owner-cameras="CPB-001"]')).toBeVisible();
    // back returns one level and stops the tiles; the crumb returns to the nation
    await page.goBack();
    await expect(ownerHost(page, 'overview').locator('.be-map')).toHaveAttribute('data-map-level', 'site', MAP);
    await expect(page.locator('[data-live-tile] video')).toHaveCount(0);
    await page.getByRole('navigation', { name: '현황 경로', exact: true }).getByRole('link', { name: '전국' }).click();
    await expect(ownerHost(page, 'overview').locator('.be-map')).toHaveAttribute('data-map-level', 'nation', MAP);
    await expect(page).not.toHaveURL(/site=/);
  });

  // 타일을 누르면 전체 화면(시안 «확정 2026-09-12» · PWA 사용자 결정 «탭하면 전체 화면»)
  test('[B1-02] [FR-042] [AC-O05] camera tile opens the full-screen viewer and returns focus', async ({ page }) => {
    await startOwner(page, app);
    await page.goto(`${paths.overview}?site=SITE-MAPO&device=CPB-001`);
    const opener = page.getByRole('button', { name: '1호기 바디캠 A 전체 화면', exact: true });
    await expect(opener).toBeVisible();
    await opener.click();
    const viewer = page.locator('[data-camera-viewer="CPB-001"]');
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole('heading', { name: '1호기 바디캠 A', exact: true })).toBeVisible();
    // 필름 띠는 여섯 대를 모두 담고 현재 카메라를 표시한다
    const strip = viewer.getByRole('list', { name: '카메라 목록', exact: true }).getByRole('button');
    await expect(strip).toHaveCount(6);
    await expect(strip.first()).toHaveAttribute('aria-current', 'true');
    // ← → 로 카메라를 옮긴다(맨 앞에서 ←는 맨 뒤로 감긴다)
    await page.keyboard.press('ArrowRight');
    await expect(viewer.getByRole('heading', { name: '1호기 바디캠 B', exact: true })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(viewer.getByRole('heading', { name: '1호기 AI CCTV', exact: true })).toBeVisible();
    await expect(strip.last()).toHaveAttribute('aria-current', 'true');
    // 띠에서 직접 고른다
    await strip.nth(3).click();
    await expect(viewer.getByRole('heading', { name: '1호기 CCTV 1', exact: true })).toBeVisible();
    // Esc로 닫히고(모달 <dialog>) 연 타일로 포커스가 돌아온다
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-camera-viewer]')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  // 시안의 호기 화면 — 상태 · 오늘 운전자 · AI 경고 · 지표 6 · 접기(«확정 2026-09-12»)
  test('[B1-02] [FR-044] [AC-O05] unit panel shows driver, AI warning, six metrics and folded groups', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.overview}?site=SITE-MAPO&device=CPB-001`);
    const panel = page.locator('[data-device="CPB-001"]').first();
    await expect(panel).toBeVisible();

    // 오늘 운전자 한 줄 — 이름과 전화(현장 담당자 전화와 섞이지 않게 그 줄 안에서 찾는다)
    const driverLine = panel
      .locator('p')
      .filter({ hasText: /오늘 운전자/ })
      .first();
    await expect(driverLine).toBeVisible();
    await expect(driverLine.getByRole('link', { name: /^010-/ })).toBeVisible();

    // AI 경고 배너는 그 시각 배정 운전자를 함께 보인다
    const warning = panel
      .getByRole('status')
      .filter({ hasText: /붐 하부 인원 감지/ })
      .first();
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('운전자');

    // 지표 6 — 값이 있거나 「미연동」이다
    for (const label of ['공급 전압', '유압', '유온', '붐 선회각', '오늘 타설', '가동 시간'])
      await expect(panel.getByText(label, { exact: true })).toBeVisible();

    // 접기는 눌러야 열린다 — 지표와 경고가 먼저 읽혀야 한다
    const parts = panel.locator('[data-fold="마모·교체 부품"]');
    await expect(parts).toHaveCount(1);
    await expect(parts.getByText('수송관', { exact: true })).toBeHidden();
    await parts.getByRole('group').or(parts.locator('summary')).first().click();
    await expect(parts.getByText('수송관', { exact: true })).toBeVisible();
  });

  // 알림은 좌측 메뉴에서 내려와 헤더의 종으로 들어왔다(시안 «결정 2026-09-12»).
  // 메뉴에 이상·점검이 남아 있으면 두 자리에 같은 것이 생긴다 — 그것까지 함께 막는다.
  test('[B1-02] [FR-006] [AC-O06] header bell opens alerts, closes by Escape and returns focus', async ({ page }) => {
    await startOwner(page, app);
    const nav = page.getByRole('navigation', { name: '소유주 메뉴' });
    await expect(nav.getByRole('link', { name: '이상·점검' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: '장비 서류' })).toHaveCount(0);

    const bell = page.getByRole('button', { name: /^알림/ });
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    const panel = page.locator('[data-owner-bell]');
    await expect(panel).toHaveCount(0);

    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    // 미확인 수가 제목과 배지에 같게 나온다
    await expect(panel.getByRole('heading', { name: '알림', exact: true })).toBeVisible();
    // 스냅샷은 셸이 뜬 뒤에 도착한다 — 한 번 읽는 count()는 경합한다(재시도하는 단언을 쓴다)
    const cards = panel.locator('[data-alert]');
    await expect(cards.first()).toBeVisible();
    await expect(panel.getByRole('link', { name: '알림 전체 보기' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(bell).toBeFocused();
  });

  // 원천에 등록됐지만 아직 만들지 않은 화면은 「표식이 붙은 안내 화면」이어야 한다.
  // 표식(data-stub)만 붙여 두고 아무도 그 경로를 밟지 않으면 형식적 안전장치에 그친다 —
  // 이 검사가 owner 세션으로 등록된 화면 목적을 전부 열어 실제로 확인한다(4차 리뷰 지적).
  test('[B1-02] [FR-025] every registered owner view renders a real body or a marked placeholder', async ({ page }) => {
    await startOwner(page, app);
    const views = Object.keys(paths).filter((v) => v !== 'entry');
    expect(views.length).toBeGreaterThan(6);
    for (const view of views) {
      await page.goto(paths[view as keyof typeof paths]);
      const host = ownerHost(page);
      await expect(host, `${view}: 소유주 화면이 떠야 한다`).toBeVisible();
      await expect(host, `${view}: 같은 목적으로 렌더돼야 한다`).toHaveAttribute('data-owner-view', view);
      if ((OWNER_UNBUILT as readonly string[]).includes(view)) {
        await expect(host, `${view}: 미구현 화면은 표식을 가져야 한다`).toHaveAttribute('data-stub', '');
        await expect(host.getByText('준비 중인 화면입니다', { exact: true })).toBeVisible();
      } else {
        await expect(host, `${view}: 구현된 화면에 표식이 남아 있다`).not.toHaveAttribute('data-stub', '');
        await expect(host.getByText('준비 중인 화면입니다', { exact: true })).toHaveCount(0);
      }
    }
  });
  test('[A4-07] [FR-024] [AC-O13] [AC-O16] map sheet snaps collapsed → half → expanded by button, keyboard and drag', async ({
    page,
  }) => {
    await startOwner(page, app);
    const overview = ownerHost(page, 'overview');
    const sheet = overview.locator('[data-map-sheet]');
    if (app === 'web') {
      // 웹은 시트 없이 부유 패널 — 같은 제목의 검사는 "시트가 없다"까지(web/pwa 패리티 계약)
      await expect(sheet).toHaveCount(0);
      await expect(overview.getByRole('complementary', { name: '현황 패널', exact: true })).toBeVisible();
      return;
    }
    {
      // 전국 단계는 지도가 주인공 — 시트는 접힘으로 시작
      await expect(sheet).toHaveAttribute('data-snap', 'collapsed');
      await expect(overview.locator('.be-map')).toHaveAttribute('data-map-ready', '', MAP);
      // 펼치기 버튼 → half, 접기 → collapsed
      await sheet.getByRole('button', { name: '시트 펼치기', exact: true }).last().click();
      await expect(sheet).toHaveAttribute('data-snap', 'half');
      await sheet.getByRole('button', { name: '시트 접기', exact: true }).last().click();
      await expect(sheet).toHaveAttribute('data-snap', 'collapsed');
      // 손잡이 키보드: ArrowUp ×2 → expanded, End → collapsed, Home → expanded
      const handle = sheet.getByRole('button', { name: /시트 (펼치기|접기)/ }).first();
      await handle.focus();
      await page.keyboard.press('ArrowUp');
      await expect(sheet).toHaveAttribute('data-snap', 'half');
      await page.keyboard.press('ArrowUp');
      await expect(sheet).toHaveAttribute('data-snap', 'expanded');
      await expect(handle).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('End');
      await expect(sheet).toHaveAttribute('data-snap', 'collapsed');
      await page.keyboard.press('Home');
      await expect(sheet).toHaveAttribute('data-snap', 'expanded');
      // 드래그: 손잡이를 아래로 60px 끌어 놓으면 한 단 내려간다.
      // mouse.*는 기다리지 않는다 — Home으로 올라간 시트가 아직 움직이는 동안 잰 상자는 이미 틀린 좌표다.
      // hover는 요소가 멈출 때까지 기다린다(그 다음에 재야 손잡이를 실제로 잡는다).
      await handle.hover();
      const box = (await handle.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60, { steps: 5 });
      await page.mouse.up();
      await expect(sheet).toHaveAttribute('data-snap', 'half');
      // 접힌 시트에서 지도 마커를 고르면 시트가 half로 올라오며 현장 단계가 열린다
      await sheet.getByRole('button', { name: '시트 접기', exact: true }).last().click();
      await expect(sheet).toHaveAttribute('data-snap', 'collapsed');
      await overview.getByRole('list', { name: '현장 목록', exact: true }).locator('[data-site="SITE-MAPO"]').click();
      await expect(page).toHaveURL(/site=SITE-MAPO/);
      await expect(sheet).toHaveAttribute('data-snap', 'half');
      await expect(overview.locator('.be-map')).toHaveAttribute('data-map-level', 'site', MAP);
    }
  });

  test('[B1-02] [FR-024] [AC-O15] activity simulation is off by default, runs with ?sim=1, and the shell toggle remembers it', async ({
    page,
  }) => {
    await startOwner(page, app);
    const host = ownerHost(page, 'overview');
    // 기본 off: 6.5초(틱 5초) 동안 기준 시각·확인 필요 대수가 그대로
    await expect(host).toHaveAttribute('data-owner-sim', '0');
    await expect(host).toHaveAttribute('data-owner-clock', /\d{4}-/); // 스냅샷이 실린 뒤에 기준 시각을 읽는다
    const clock = await host.getAttribute('data-owner-clock');
    await page.waitForTimeout(6500);
    expect(await host.getAttribute('data-owner-clock')).toBe(clock);
    await expect(host.getByRole('heading', { name: '확인이 필요한 장비 6대', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '활동 시뮬레이션 켜기', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // ?sim=1: 첫 틱(5초)에 반드시 알림 한 건 → 확인 필요 대수가 6에서 바뀌고 기준 시각이 전진한다
    await page.goto(`${paths.overview}?sim=1`);
    await expect(ownerHost(page, 'overview')).toHaveAttribute('data-owner-sim', '1');
    await expect(ownerHost(page, 'overview')).toContainText('시뮬레이션 진행 중');
    await expect(
      ownerHost(page, 'overview').getByRole('heading', { name: /확인이 필요한 장비 (?!6대)\d+대/ }),
    ).toBeVisible({
      timeout: 15_000,
    });
    expect(await ownerHost(page, 'overview').getAttribute('data-owner-clock')).not.toBe(clock);
    // 셸 토글: 끄면 ?sim=0 + localStorage, 켜면 다시 1 — 이동해도 유지된다
    await page.getByRole('button', { name: '활동 시뮬레이션 끄기', exact: true }).click();
    await expect(page).toHaveURL(/sim=0/);
    await expect(ownerHost(page, 'overview')).toHaveAttribute('data-owner-sim', '0');
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.owner.sim'))).toBe('0');
    await page.getByRole('button', { name: '활동 시뮬레이션 켜기', exact: true }).click();
    await expect(page).toHaveURL(/sim=1/);
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.owner.sim'))).toBe('1');
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await expect(ownerHost(page, 'fleet')).toHaveAttribute('data-owner-sim', '1');
    // 캡처 모드는 항상 off
    await page.goto(`${paths.overview}?capture=1&state=owner&sim=1`);
    await expect(ownerHost(page, 'overview')).toHaveAttribute('data-owner-sim', '0');
  });

  test('[B1-02] [FR-024] [AC-O13] nation map aggregates seven regions; a region pill zooms to its sites and the chip returns', async ({
    page,
  }) => {
    await startOwner(page, app);
    const overview = ownerHost(page, 'overview');
    const map = overview.locator('.be-map');
    await expect(map).toHaveAttribute('data-map-ready', '', MAP);
    await expect(map.locator('.be-marker')).toHaveCount(7);
    await expect(overview.locator('[data-owner-stage]')).toHaveAttribute('data-owner-map-mode', 'regions');
    // 정상 지역은 작은 점, 이상이 있는 지역만 상태색 원 — 무게가 심각도를 따른다
    await expect(map.locator('.be-marker[data-kind="region"][data-state="normal"]')).toHaveCount(3);
    await map.getByRole('button', { name: /^서울 · 현장 1곳/ }).click();
    await expect(overview.locator('[data-owner-stage]')).toHaveAttribute('data-owner-map-mode', 'sites');
    await expect(map.locator('.be-marker[data-kind="site"]')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: '현황 경로', exact: true })).toContainText('서울');
    await expect(overview.getByRole('list', { name: '현장 목록', exact: true }).locator('[data-site]')).toHaveCount(1);
    if (app === 'pwa') await overview.getByRole('button', { name: '시트 펼치기', exact: true }).last().click();
    await overview.getByRole('button', { name: '전국으로', exact: true }).click();
    await expect(overview.locator('[data-owner-stage]')).toHaveAttribute('data-owner-map-mode', 'regions');
    await expect(map.locator('.be-marker')).toHaveCount(7);
  });

  test('[B1-02] [FR-024] [AC-O12] [AC-O13] unknown site or foreign unit in the URL falls back to a valid level', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.overview}?site=SITE-NOPE&device=CPB-001`);
    await expect(ownerHost(page, 'overview').locator('.be-map')).toHaveAttribute('data-map-level', 'nation', MAP);
    await page.goto(`${paths.overview}?site=SITE-MAPO&device=CPB-101`);
    const overview = ownerHost(page, 'overview');
    await expect(overview.locator('.be-map')).toHaveAttribute('data-map-level', 'site', MAP);
    await expect(overview.locator('[data-live-tile]')).toHaveCount(0);
    for (const hidden of ['두번째건설', '타사 담당자', '다른 회사 전용 현장'])
      await expect(overview).not.toContainText(hidden);
  });

  for (const material of ['documents', 'video'] as const) {
    test(`[B1-02] [FR-024] [AC-O03] [AC-O15] filtered fleet → ${material} → detail → fleet preserves context`, async ({
      page,
    }) => {
      await startOwner(page, app);
      await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
      await page.getByLabel('호기·현장 검색', { exact: true }).fill('마포');
      await page.getByLabel('상태', { exact: true }).selectOption('deployed');
      await ownerHost(page, 'fleet').locator('[data-device="CPB-001"]').click();
      const detail = ownerHost(page, 'detail');
      await expect(detail).toContainText('CPB-001');
      await detail.getByRole('link', { name: material === 'documents' ? /장비 서류/ : /현장 영상/ }).click();
      if (material === 'documents') {
        await page.getByRole('button', { name: '1호기 제작증 열기', exact: true }).click();
        await expect(page.locator('[data-document-viewer]')).toHaveAttribute('data-doc', 'CPB-001-CERT');
        await expect(page.locator('[data-document-viewer] img')).toBeVisible();
      } else {
        await page.getByRole('button', { name: '마스트 설치', exact: true }).click();
        await page.getByRole('button', { name: '가동일 저장', exact: true }).click();
        await expect(page.locator('[data-camera="CPB-001-body-a"]')).toHaveAttribute('data-mode', 'recorded');
        await expect(page.locator('[data-camera="CPB-001-body-a"] video')).toBeVisible();
      }
      await page.getByRole('button', { name: '장비 상세로', exact: true }).click();
      await expect(detail).toContainText('CPB-001');
      await detail.getByRole('link', { name: '장비 목록으로', exact: true }).click();
      await expect(page.getByLabel('호기·현장 검색', { exact: true })).toHaveValue('마포');
      await expect(page.getByLabel('상태', { exact: true })).toHaveValue('deployed');
      await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(5);
      await expect(ownerHost(page, 'fleet').locator('[data-device]').first()).toHaveAttribute('data-device', 'CPB-001');
    });
  }

  test('[B1-02] [FR-024] [AC-O06] [AC-O08] [AC-O12] conflicting purpose and device queries cannot show unrelated content', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.video}?purpose=pour&camera=CPB-001-body-a`);
    await expect(ownerHost(page, 'video').getByRole('alert')).toBeVisible();
    await expect(ownerHost(page, 'video').locator('video')).toHaveCount(0);
    await expect(ownerHost(page, 'video').locator('[data-camera="CPB-001-body-a"]')).toHaveCount(0);
    await page.goto(`${paths.alerts}?device=CPB-002&alert=CPB-003-INSP-DUE`);
    await expect(ownerHost(page, 'alerts')).toBeVisible();
    await expect(ownerHost(page, 'alerts').locator('[data-alert="CPB-002-FAULT"]')).toBeVisible();
    await expect(page.getByRole('region', { name: '선택한 알림 상세', exact: true })).toHaveCount(0);
    await expect(ownerHost(page, 'alerts')).not.toContainText('박현장');
    await expect(ownerHost(page, 'alerts').locator('[data-alert="CPB-003-INSP-DUE"]')).toHaveCount(0);
  });

  test('[B1-02] [FR-024] [AC-O05] [AC-O14] stale, detached, missing contracts and telemetry stay distinct', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(paths.detail.replace('CPB-001', 'CPB-004'));
    await expect(ownerHost(page, 'detail')).toContainText('수신 지연');
    await expect(ownerHost(page, 'detail')).toContainText(/08:22|8:22/);
    await page.goto(paths.detail.replace('CPB-001', 'CPB-005'));
    await expect(ownerHost(page, 'detail')).toContainText('단말기 미장착');
    await expect(ownerHost(page, 'detail')).not.toContainText('0 V');
    await page.goto(`${paths.detail}?capture=1&state=boundaries`);
    await expect(ownerHost(page, 'detail')).toContainText('미연동');
    await expect(ownerHost(page, 'detail')).toContainText(/미등록|등록된 계약|계약 없음/);
    await expect(ownerHost(page, 'detail')).toContainText(/배치 미확인/);
    await expect(ownerHost(page, 'detail')).not.toContainText('0 V');
  });

  test('[B1-02] [FR-024] [AC-O12] A cannot browse another owner device, document, camera or alert', async ({
    page,
  }) => {
    await startOwner(page, app);
    for (const path of [
      paths.fleet,
      paths.detail.replace('CPB-001', 'CPB-101'),
      `${paths.documents}?device=CPB-101&doc=CPB-101-CERT`,
      `${paths.video}?camera=CPB-101-cctv-1`,
      `${paths.alerts}?alert=CPB-101-FAULT`,
    ]) {
      await page.goto(path);
      const host = ownerHost(page);
      await expect(host).toBeVisible();
      for (const hidden of ['두번째건설', '타사 담당자', '다른 회사 전용 현장'])
        await expect(host).not.toContainText(hidden);
      await expect(
        host.locator(
          '[data-device="CPB-101"], [data-doc="CPB-101-CERT"], [data-camera="CPB-101-cctv-1"], [data-alert="CPB-101-FAULT"]',
        ),
      ).toHaveCount(0);
    }
  });

  test('[B1-02] [FR-024] [AC-O12] B context has only its independently seeded device', async ({ page, context }) => {
    await testSession(context, 'OWN-002');
    await page.goto(paths.fleet);
    const devices = ownerHost(page, 'fleet').locator('[data-device]');
    await expect(devices).toHaveCount(1);
    await expect(devices).toHaveAttribute('data-device', 'CPB-101');
    await devices.click();
    await expect(ownerHost(page, 'detail')).toContainText('두번째건설');
    await expect(ownerHost(page, 'detail')).toContainText('타사 담당자');
    await expect(ownerHost(page, 'detail')).not.toContainText('김현장');
  });

  for (const ownerId of [undefined, '']) {
    test(`[B1-02] [FR-024] [AC-O12] ownerId ${ownerId === undefined ? 'missing' : 'empty'} fails closed`, async ({
      page,
      context,
    }) => {
      await testSession(context, ownerId);
      await page.goto(paths.fleet);
      await expect(page.getByText(/다시 시작|접근 권한|데모 계정으로 로그인/).first()).toBeVisible();
      await expect(page.locator('[data-device]')).toHaveCount(0);
      await expect(page.getByText('김현장')).toHaveCount(0);
    });
  }

  test('[B1-02] [FR-024] [AC-O14] empty and retryable read failure have honest states', async ({ page }) => {
    await startOwner(page, app);
    await page.goto(`${paths.fleet}?capture=1&state=empty`);
    await expect(ownerHost(page, 'fleet')).toContainText(/장비가 없습니다|등록된 장비|보유 장비가/);
    await expect(page.locator('[data-device]')).toHaveCount(0);
    await page.goto(`${paths.fleet}?capture=1&state=error`);
    await expect(page.getByRole('button', { name: /다시 시도/ })).toBeVisible();
    await expect(page.locator('[data-device]')).toHaveCount(0);
    await page.getByRole('button', { name: /다시 시도/ }).click();
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(120);
  });

  test('[B1-02] [FR-024] [AC-O06] [AC-O15] reading alert preserves fault and correct device context', async ({
    page,
  }) => {
    await startOwner(page, app);
    await openAlerts(page);
    await page.locator('[data-alert="CPB-002-FAULT"]').click();
    await expect(ownerHost(page, 'alerts')).toContainText('공급 전압 저하');
    await expect(ownerHost(page, 'alerts')).toContainText('이현장');
    await expect(page.getByRole('button', { name: '승인', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: /읽음/ }).click();
    await expect(ownerHost(page, 'alerts')).toContainText('공급 전압 저하');
    await page.getByRole('link', { name: /장비 상세/ }).click();
    await expect(ownerHost(page, 'detail')).toContainText('CPB-002');
    await expect(ownerHost(page, 'detail')).toContainText('공급 전압 저하');
  });

  test('[B1-02] [FR-024] [AC-O08] [AC-O09] real clip advances and recorded clip ends at stated duration', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(paths.video);
    const host = ownerHost(page, 'video');
    await expect(host).toContainText('타설 위치');
    await expect(host).toContainText('마스트 설치');
    await expect(page.getByRole('button', { name: /원격 제어|장비 정지/ })).toHaveCount(0);
    await page.getByRole('button', { name: '가동일 저장', exact: true }).click();
    const video = host.locator('video').first();
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
    expect(await video.evaluate((v) => (v as HTMLVideoElement).duration)).toBeCloseTo(6, 0);
    expect(await video.evaluate((v) => (v as HTMLVideoElement).loop)).toBe(false);
    await video.evaluate((element) => {
      const v = element as HTMLVideoElement;
      v.currentTime = 0;
      return v.play();
    });
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0.2);
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).ended), { timeout: 9_000 }).toBe(true);
    await page.getByRole('button', { name: '스냅샷', exact: true }).click();
    await expect(host.locator('video')).toHaveCount(0);
    await expect(host.locator('[data-mode="snapshot"] img')).toBeVisible();
    await page.getByRole('button', { name: '실시간 예시', exact: true }).click();
    await expect(video).toBeVisible();
    await video.evaluate((element) => (element as HTMLVideoElement).play());
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1);
    const removedVideo = await video.elementHandle();
    await page.getByRole('button', { name: '장비 상세로', exact: true }).click();
    await expect(page.locator('video')).toHaveCount(0);
    expect(removedVideo).not.toBeNull();
    await expect.poll(() => removedVideo!.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
    await removedVideo!.dispose();
  });

  test('[B1-02] [FR-024] [AC-O01] [AC-O12] protected entry and presentation query cannot change a session', async ({
    page,
    context,
  }) => {
    await page.goto(paths.fleet);
    await expect(page.getByRole('button', { name: '데모 계정으로 로그인', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.session'))).toBeNull();
    await testSession(context, 'OWN-002');
    await page.goto(paths.entry);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'))).toMatchObject({
      role: 'owner',
      ownerId: 'OWN-002',
    });
  });

  test('[B1-02] [FR-024] [AC-O15] ordinary state query does not replace live owner data', async ({ page }) => {
    await startOwner(page, app);
    await page.goto(`${paths.fleet}?state=empty`);
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(120);
    await expect(ownerHost(page, 'fleet')).toHaveAttribute('data-owner-dataset', 'owner');
  });

  test('[B1-02] [FR-024] [AC-O11] [AC-O14] wrong file and offline attachment never create success', async ({
    page,
    context,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    await input.setInputFiles('apps/pwa/static/robots.txt');
    await expect(page.getByRole('button', { name: '첨부 확정', exact: true })).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '시연 파일을 첨부했습니다' })).toHaveCount(0);
    await input.setInputFiles(PNG);
    const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
    await expect(dialog).toBeVisible();
    await context.setOffline(true);
    await expect(dialog.getByRole('button', { name: '첨부 확정', exact: true })).toBeDisabled();
    await expect(page.getByText(/오프라인에서는 첨부|연결 후 다시/).first()).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '시연 파일을 첨부했습니다' })).toHaveCount(0);
    await context.setOffline(false);
  });

  test('[B1-02] [FR-024] [AC-O13] [AC-O16] attachment keyboard close returns focus and rotation keeps actions', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    await input.focus();
    await input.setInputFiles(PNG);
    await expect(page.getByRole('dialog', { name: '첨부 미리보기', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '첨부 미리보기', exact: true })).toHaveCount(0);
    await expect(input).toBeFocused();
    await page.setViewportSize({ width: 800, height: 390 });
    await noOverflow(page);
    await expect(page.getByLabel('시연 파일 선택', { exact: true })).toBeVisible();
  });

  test('[B1-02] [FR-024] [AC-O10] correct equipment original actually loads and viewer can return', async ({
    page,
    request,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    await page.getByRole('button', { name: '1호기 제작증 열기', exact: true }).click();
    const viewer = page.locator('[data-document-viewer]');
    await expect(viewer).toHaveAttribute('data-doc', 'CPB-001-CERT');
    const original = viewer.getByRole('img', { name: /CPB-001.*제작증.*원문/ });
    await expect(original).toBeVisible();
    await expect.poll(() => original.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(300);
    const link = viewer.getByRole('link', { name: /원문.*열기/ });
    const url = await link.getAttribute('href');
    expect(url).toBeTruthy();
    const response = await request.get(url!);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
    await page.getByRole('button', { name: '서류 목록으로', exact: true }).click();
    await page.getByRole('button', { name: '1호기 비파괴 검사 성적서 열기', exact: true }).click();
    await expect(viewer).toHaveAttribute('data-doc', 'CPB-001-INSP');
    await expect(viewer.getByRole('img', { name: /CPB-001.*비파괴.*원문/ })).toBeVisible();
  });

  test('[B1-02] [FR-024] [AC-O11] [AC-O15] attachment cancel, confirmation, navigation and refresh scope', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    // A real decodable 192px image, independent from equipment source documents.
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    await input.setInputFiles(PNG);
    const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '취소', exact: true }).click();
    await expect(page.getByRole('button', { name: /icon-192/ })).toHaveCount(0);
    await input.setInputFiles(PNG);
    await dialog.getByRole('button', { name: '첨부 확정', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: '시연 파일을 첨부했습니다' })).toBeVisible();
    await expect(ownerHost(page, 'documents')).toContainText('icon-192.png');
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await openDocuments(page);
    await expect(ownerHost(page, 'documents')).toContainText('icon-192.png');
    await page.reload();
    await expect(ownerHost(page, 'documents')).not.toContainText('icon-192.png');
  });

  const LEVELS = { 'overview-site': 'site=SITE-MAPO', 'overview-unit': 'site=SITE-MAPO&device=CPB-001' } as const;
  for (const theme of ['light', 'dark']) {
    for (const target of [
      'entry',
      'overview',
      'overview-site',
      'overview-unit',
      'fleet',
      'detail',
      'video',
      'documents',
      'alerts',
    ] as const) {
      const view = target.startsWith('overview') ? 'overview' : target;
      test(`[B1-02] [FR-024] [AC-O13] [AC-O16] ${target} ${theme} responsive accessibility`, async ({ page }) => {
        await page.setViewportSize(app === 'web' ? { width: 390, height: 800 } : { width: 375, height: 800 });
        if (view !== 'entry') await startOwner(page, app);
        const separator = paths[view].includes('?') ? '&' : '?';
        const level = target in LEVELS ? `&${LEVELS[target as keyof typeof LEVELS]}` : '';
        await page.goto(`${paths[view]}${separator}capture=1&state=owner&theme=${theme}${level}`);
        await expect(ownerHost(page, view)).toBeVisible();
        // 호기 단계는 지도 대신 카메라 벽이다 — 기다릴 대상이 다르다
        if (target === 'overview-unit') await expect(page.locator('[data-owner-cameras]')).toBeVisible();
        else if (target in LEVELS) await expect(page.locator('.be-map')).toHaveAttribute('data-map-ready', '', MAP);
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
        await noOverflow(page);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
        expect(
          result.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      });
    }
  }
}
