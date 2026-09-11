import AxeBuilder from '@axe-core/playwright';
import {
  test,
  expect,
  startOwner,
  testSession,
  ownerHost,
  noOverflow,
  OWNER_PATHS,
  type OwnerApp,
} from './owner-helpers';

const PNG = 'apps/pwa/static/icons/icon-192.png';

export function ownerFlows(app: OwnerApp) {
  const paths = OWNER_PATHS[app];
  test('[B1-02] [FR-024] [AC-O01] actual owner entry and four working menus', async ({ page }) => {
    await page.goto(paths.entry);
    await expect(page.getByRole('button', { name: '데모 시작하기', exact: true })).toBeVisible();
    for (const account of ['control01', 'ops01', 'maint01', 'owner01'])
      await expect(page.getByText(account, { exact: true })).toHaveCount(0);
    await startOwner(page, app);
    const expected = [
      ['보유 장비', 'fleet'],
      ['이상·점검', 'alerts'],
      ['장비 서류', 'documents'],
      ['운영 현황', 'overview'],
    ] as const;
    for (const [label, view] of expected) {
      await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
      await expect(ownerHost(page, view)).toBeVisible();
    }
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await expect(page.getByRole('button', { name: '데모 시작하기', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.session'))).toBeNull();
  });

  test('[B1-02] [FR-024] [AC-O02] [AC-O03] [AC-O15] search → same device contract/contact → return keeps filter', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    const search = page.getByLabel('호기·현장 검색', { exact: true });
    await search.fill('마포');
    await page.getByLabel('배치 필터', { exact: true }).selectOption('deployed');
    const device = ownerHost(page, 'fleet').locator('[data-device]');
    await expect(device).toHaveCount(1);
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
    await expect(page.getByLabel('배치 필터', { exact: true })).toHaveValue('deployed');
    await expect(device).toHaveCount(1);
    await page.reload();
    await expect(search).toHaveValue('마포');
    await expect(device).toHaveAttribute('data-device', 'CPB-001');
    await search.fill('');
    await page.getByLabel('배치 필터', { exact: true }).selectOption('stored');
    await expect(device).toHaveCount(1);
    await expect(device).toContainText('보관');
    await expect(device).toHaveAttribute('data-device', 'CPB-005');
    await expect(device).not.toContainText('즉시 투입 가능');
  });

  test('[B1-02] [FR-024] [AC-O04] [AC-O07] inventory axes and distinct affected devices', async ({ page }) => {
    await startOwner(page, app);
    const summary = page.locator('[data-owner-summary]');
    await expect(summary).toHaveAttribute('data-total', '5');
    await expect(summary).toHaveAttribute('data-deployed', '4');
    await expect(summary).toHaveAttribute('data-stored', '1');
    await expect(summary).toHaveAttribute('data-unknown', '0');
    await expect(ownerHost(page)).toContainText(/3대/);
    await page.goto(`${paths.overview}?capture=1&state=boundaries`);
    await expect(summary).toHaveAttribute('data-total', '5');
    await expect(summary).toHaveAttribute('data-deployed', '3');
    await expect(summary).toHaveAttribute('data-stored', '1');
    await expect(summary).toHaveAttribute('data-unknown', '1');
    // CPB-002 has both voltage and inspection alerts; inventory remains five.
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(5);
  });

  for (const material of ['documents', 'video'] as const) {
    test(`[B1-02] [FR-024] [AC-O03] [AC-O15] filtered fleet → ${material} → detail → fleet preserves context`, async ({
      page,
    }) => {
      await startOwner(page, app);
      await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
      await page.getByLabel('호기·현장 검색', { exact: true }).fill('마포');
      await page.getByLabel('배치 필터', { exact: true }).selectOption('deployed');
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
        await expect(page.locator('[data-camera="CPB-001-install"]')).toHaveAttribute('data-mode', 'recorded');
        await expect(page.locator('[data-camera="CPB-001-install"] video')).toBeVisible();
      }
      await page.getByRole('button', { name: '장비 상세로', exact: true }).click();
      await expect(detail).toContainText('CPB-001');
      await detail.getByRole('link', { name: '장비 목록으로', exact: true }).click();
      await expect(page.getByLabel('호기·현장 검색', { exact: true })).toHaveValue('마포');
      await expect(page.getByLabel('배치 필터', { exact: true })).toHaveValue('deployed');
      await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(1);
      await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveAttribute('data-device', 'CPB-001');
    });
  }

  test('[B1-02] [FR-024] [AC-O06] [AC-O08] [AC-O12] conflicting purpose and device queries cannot show unrelated content', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.video}?purpose=pour&camera=CPB-001-install`);
    await expect(ownerHost(page, 'video').getByRole('alert')).toBeVisible();
    await expect(ownerHost(page, 'video').locator('video')).toHaveCount(0);
    await expect(ownerHost(page, 'video').locator('[data-camera="CPB-001-install"]')).toHaveCount(0);
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
      `${paths.video}?camera=CPB-101-pour`,
      `${paths.alerts}?alert=CPB-101-FAULT`,
    ]) {
      await page.goto(path);
      const host = ownerHost(page);
      await expect(host).toBeVisible();
      for (const hidden of ['두번째건설', '타사 담당자', '다른 회사 전용 현장'])
        await expect(host).not.toContainText(hidden);
      await expect(
        host.locator(
          '[data-device="CPB-101"], [data-doc="CPB-101-CERT"], [data-camera="CPB-101-pour"], [data-alert="CPB-101-FAULT"]',
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
      await expect(page.getByText(/다시 시작|접근 권한|데모 시작하기/).first()).toBeVisible();
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
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(5);
  });

  test('[B1-02] [FR-024] [AC-O06] [AC-O15] reading alert preserves fault and correct device context', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.getByRole('navigation').getByRole('link', { name: '이상·점검', exact: true }).click();
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
    await expect(page.getByRole('button', { name: '데모 시작하기', exact: true })).toBeVisible();
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
    await expect(ownerHost(page, 'fleet').locator('[data-device]')).toHaveCount(5);
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
    await page.getByRole('navigation').getByRole('link', { name: '장비 서류', exact: true }).click();
    await expect(ownerHost(page, 'documents')).toContainText('icon-192.png');
    await page.reload();
    await expect(ownerHost(page, 'documents')).not.toContainText('icon-192.png');
  });

  for (const theme of ['light', 'dark']) {
    for (const view of ['entry', 'overview', 'fleet', 'detail', 'video', 'documents', 'alerts'] as const) {
      test(`[B1-02] [FR-024] [AC-O13] [AC-O16] ${view} ${theme} responsive accessibility`, async ({ page }) => {
        await page.setViewportSize(app === 'web' ? { width: 390, height: 800 } : { width: 375, height: 800 });
        if (view !== 'entry') await startOwner(page, app);
        const separator = paths[view].includes('?') ? '&' : '?';
        await page.goto(`${paths[view]}${separator}capture=1&state=owner&theme=${theme}`);
        await expect(ownerHost(page, view)).toBeVisible();
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
