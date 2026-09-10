// [A1-04] 현장 모니터 · [A1-05] 장비 상세 — 영상·헬스·서류·저장 영상 (specs/video-basics AC-1 · AC-2 · AC-3 · AC-5 · AC-6)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-04] 장비 3 × 2채널 · 오프라인/AI 판단 불가/흐림은 "정상"이 아니다 · 프로파일 P-SD [FR-004] [FR-034]', async ({
  page,
}) => {
  await page.goto('/a1/monitor?state=monitor&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.locator('[data-camera]')).toHaveCount(6);
  await expect(page.locator('[data-camera="CAM-1-1"] [data-health="lost"]')).toContainText('수신 끊김');
  await expect(page.locator('[data-camera="CAM-2-2"] [data-faulty="true"]')).toContainText('AI 판단 불가');
  await expect(page.locator('[data-camera="CAM-2-1"] [data-faulty="true"]')).toContainText('흐림');
  await expect(page.locator('[data-camera="CAM-3-2"] [data-health="view-changed"]')).toContainText('판단 유보'); // 시야 변경 ≠ 장애(FR-034)
  await expect(page.locator('[data-camera="CAM-3-2"]').getByText('판단 유보', { exact: true })).toBeVisible();
  await expect(page.locator('[data-faulty="true"]').filter({ hasText: /^정상$/ })).toHaveCount(0);
  await expect(page.locator('[data-camera="CAM-3-1"] [data-faulty="false"]')).toContainText('LIVE');
  await expect(page.locator('[data-profile="P-SD"]')).toHaveText('2채널'); // 프로파일 코드 대신 채널 수(§12)
  // 타일 배경은 삽화 스틸(평시 — 알람 그래픽 없음) · 수신 없음 타일은 스틸 없음
  await expect(page.locator('[data-camera="CAM-3-1"] img[data-still="front"]')).toHaveCount(1);
  await expect(page.locator('[data-camera="CAM-3-2"] img[data-still="boom"]')).toHaveCount(1);
  await expect(page.locator('[data-camera="CAM-1-1"] img[data-still]')).toHaveCount(0);
});

test('[A1-04] AI 이벤트 도착 → 배너 · CAM-3-2 타일 bbox [FR-028] [FR-004]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/monitor');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.getByText(/AI 이벤트 · CPB-003 호스 주변 인원 접근/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-camera="CAM-3-2"] svg[data-bbox] rect')).toHaveCount(1);
  await expect(page.locator('[data-camera="CAM-3-2"] img[data-still="boom-person"]')).toHaveCount(1); // bbox와 같은 장면
  await expect(page.locator('[data-camera="CAM-3-1"] svg[data-bbox]')).toHaveCount(0);
});

test('[A1-04] 바디캠 탭 자리(P-SD 옵션 A) [FR-030]', async ({ page }) => {
  await page.goto('/a1/monitor?state=monitor&capture=1');
  await page.getByRole('tab', { name: '바디캠' }).click();
  await expect(page.getByText('바디캠 영상은 준비 중입니다')).toBeVisible();
});

test('[A1-05] CPB-003 상세: 342V · E-021 · 도달률 · 서류 완비율 · D-27 · 저장 영상 서버/SD [FR-002] [FR-007] [FR-016] [FR-005]', async ({
  page,
}) => {
  await page.goto('/a1/monitor/CPB-003?state=dev&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toBeVisible();
  await expect(page.getByText('342V · 이상')).toBeVisible();
  await expect(page.getByText('E-021', { exact: false }).first()).toBeVisible();
  await page.getByRole('tab', { name: '부품' }).click(); // 상단 탭 4(상태 · 서류 · 영상 · 부품) — 기본은 상태
  await expect(page.getByRole('meter', { name: '수송관 도달률' })).toHaveAttribute('aria-valuetext', '62% 정상');
  await page.getByRole('tab', { name: '서류' }).click();
  await expect(page.getByText(/완비율 \d+%/)).toBeVisible();
  await expect(page.getByText(/박기사 교육 이수증 · 만료 임박 · D-27/)).toBeVisible();
  await page.getByRole('tab', { name: '영상' }).click();
  await expect(page.locator('[data-mount="last-rigid"]')).toContainText('마지막 강체·경사 시야'); // AI 채널 장착 위치(ENT-04)
  await expect(page).toHaveURL(/tab=video/);
  await expect(page.getByRole('tab', { name: '서버' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'SD' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'NVR' })).toHaveCount(0);
  await expect(page.getByRole('list', { name: '저장 영상 목록' }).locator('li')).toHaveCount(3);
  await page.getByRole('tab', { name: 'SD' }).click();
  await expect(page.getByRole('list', { name: '저장 영상 목록' }).locator('li')).toHaveCount(2);
  // 회수 표기는 프로파일 성격이 아니라 그 구간의 상태다 — 서버로 올라온 최신 구간은 바로 재생, 나머지가 "구간 회수 필요"(IF-007)
  await expect(page.getByText('구간 회수 필요')).toHaveCount(1);
});

test('[A1-04] plite 픽스처(SITE-001 P-LITE): 장비 3 × 1채널 — AI 채널 숨김 · 프로파일 P-LITE [FR-004] [FR-005]', async ({
  page,
}) => {
  await page.goto('/a1/monitor?state=plite&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.locator('[data-camera]')).toHaveCount(3);
  await expect(page.locator('[data-camera="CAM-3-2"]')).toHaveCount(0);
  await expect(page.locator('[data-profile="P-LITE"]')).toHaveText('1채널');
});

test('[A1-05] plite 픽스처: CPB-003 채널 1(일반만) · 저장 소스 탭 서버만(SD·NVR 없음) [FR-005]', async ({ page }) => {
  await page.goto('/a1/monitor/CPB-003?state=plite&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toBeVisible();
  await page.getByRole('tab', { name: '영상' }).click();
  await expect(page.locator('[data-camera]')).toHaveCount(1);
  await expect(page.getByRole('tab', { name: '서버' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'SD' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'NVR' })).toHaveCount(0);
});

test('[A3-04] hq01 장비 열람(SITE-001): 타일 6 · 헬스 배지(A1-04와 동일 변형) · 처리 액션 없음 · 열람 전용 [FR-004] [FR-034] [FR-022]', async ({
  page,
}) => {
  await page.goto('/a3/sites/SITE-001/devices?state=dev&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A3-04']}"]`)).toBeVisible();
  await expect(page.locator('[data-camera]')).toHaveCount(6);
  await expect(page.locator('[data-camera="CAM-1-1"] [data-health="lost"]')).toContainText('수신 끊김');
  await expect(page.locator('[data-camera="CAM-2-2"] [data-faulty="true"]')).toContainText('AI 판단 불가');
  await expect(page.locator('[data-profile="P-SD"]')).toHaveText('2채널');
  await expect(page.getByText('열람 전용')).toBeVisible();
  await expect(page.getByRole('button', { name: /접수|완료|호출/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /호기 ›/ })).toHaveCount(0); // A3에는 장비 상세 링크 없음
});

test('[A1-05] stale 픽스처: 수신 임계 초과 → "미수신 · 마지막" warning 텍스트 · 단선 "미연동" · 정상 표시 없음 [FR-034] [FR-002]', async ({
  page,
}) => {
  await page.goto('/a1/monitor/CPB-003?state=stale&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toBeVisible();
  await expect(page.locator('[data-telemetry-status="stale"]')).toContainText('미수신 · 마지막');
  const strip = page.locator('dl[aria-label="텔레메트리"]');
  await expect(strip.locator('[data-unlinked]')).toHaveText('미연동');
  await expect(strip.getByText('정상', { exact: true })).toHaveCount(0);
  await expect(page.getByText('342V · 이상')).toBeVisible(); // 마지막 값은 남긴다
});

test('[A1-04] 현장 신고: 신고 → 시트(유형·내용·카메라·영상 시점) → 업무 C-107 + 알림 → A1-02 업무함에 현장 신고 [FR-038] [FR-008]', async ({
  page,
}) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/monitor');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await page.getByRole('button', { name: '신고', exact: true }).click();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toContainText('현장 신고');
  await sheet.getByLabel('장비').selectOption('CPB-003');
  await sheet.getByLabel('유형').selectOption('worker');
  await sheet.getByLabel('카메라').selectOption('CAM-3-2');
  await sheet.getByLabel('내용').fill('호스 옆 작업자 쓰러짐 — 영상 확인 요청');
  await sheet.getByRole('button', { name: '신고', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /신고 — C-\d+ · 업무함에 등록/ })).toBeVisible();
  await expect(sheet).toHaveCount(0);
  // 전체 로드(page.goto)는 mock db를 새로 만든다(QA §3) — 앱 내 링크로 이동
  await page.getByRole('navigation', { name: '하단 내비게이션' }).getByRole('link', { name: '업무' }).click();
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const item = page.locator('ul[aria-label="업무"] li').filter({ hasText: '현장 신고 — 작업자 상태 이상' });
  await expect(item.first()).toBeVisible();
  await item.first().getByRole('link').first().click();
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible();
  await expect(page.getByRole('region', { name: '신고' })).toContainText('작업자 상태 이상 · CAM-3-2 · 영상 시점');
  await expect(page.getByRole('region', { name: '이력' })).toContainText('신고');
});

test('[A1-04] 타일 터치 → ?cam= 시트에 라이브 대체 재생 · 채널 전환 · Esc로 닫히고 쿼리 유지 [FR-004] [FR-034]', async ({
  page,
}) => {
  await page.goto('/a1/monitor?state=live&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.locator('[data-camera]')).toHaveCount(6); // 닫힌 시트는 타일 개수를 늘리지 않는다
  await page.locator('[data-camera="CAM-3-1"] button').first().click();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/cam=CAM-3-1/);
  // 시트 안에서만 찾는다 — 같은 data-camera가 타일에도 있다
  await expect(page.locator('[data-cam-sheet] video')).toHaveAttribute('src', /front.*\.mp4/);
  await expect(page.locator('[data-cam-sheet] [data-camera="CAM-3-1"]')).toHaveCount(1);
  await page.locator('[data-cam-sheet]').getByRole('button', { name: 'AI · 붐 끝' }).click();
  await expect(page).toHaveURL(/cam=CAM-3-2/);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('[data-cam-sheet]')).toHaveCount(0); // 닫히면 영상이 DOM에서 사라진다
  await expect(page).not.toHaveURL(/cam=/);
  await expect(page).toHaveURL(/state=live/); // 다른 쿼리 유지 — mock db 캐시 키
  await expect(page).toHaveURL(/capture=1/);
});

test('[A1-04] P-LITE 1채널: AI 채널 ?cam= 딥링크는 열리지 않는다 [FR-004] [FR-005]', async ({ page }) => {
  await page.goto('/a1/monitor?state=plite&capture=1&cam=CAM-3-2');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.locator('dialog[open][data-bottom-sheet]')).toHaveCount(0);
  await expect(page.locator('[data-cam-sheet]')).toHaveCount(0);
});

test('[A1-05] 영상 탭 카메라 타일 → 시트 재생 [FR-004]', async ({ page }) => {
  await page.goto('/a1/monitor/CPB-003?state=dev&capture=1&tab=video');
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toBeVisible();
  await page.locator('[data-camera="CAM-3-1"] button').first().click();
  await expect(page.locator('dialog[open][data-bottom-sheet]')).toBeVisible();
  await expect(page.locator('[data-cam-sheet] video')).toHaveAttribute('src', /front.*\.mp4/);
  await expect(page).toHaveURL(/state=dev/);
});

test('[A1-05] 저장 영상 재생 → 카메라 시트에 클립 · 목록 길이가 실제 길이 [FR-005]', async ({ page }) => {
  await page.goto('/a1/monitor/CPB-003?state=dev&capture=1&tab=video');
  const list = page.getByRole('list', { name: '저장 영상 목록' });
  await expect(list.locator('li').first()).toContainText('6초');
  await list.locator('li').first().getByRole('button', { name: '재생' }).click();
  await expect(page.locator('dialog[open][data-bottom-sheet]')).toBeVisible();
  const player = page.locator('[data-cam-sheet] [data-camera]');
  await expect(player).toHaveAttribute('data-frame', 'clip');
  await expect(player.locator('video')).toHaveAttribute('src', /front.*\.mp4/);
});

test('[A1-05] 내 현장 밖 장비(SITE-002 CPB-004)는 딥링크로도 열리지 않는다 [FR-004] [FR-022]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/monitor/CPB-004?cam=CAM-4-1'); // safety01은 SITE-001만 담당
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toHaveCount(0);
  await expect(page.locator('[data-cam-sheet]')).toHaveCount(0);
  await expect(page.getByText('장비 CPB-004 없음')).toBeVisible();
});
