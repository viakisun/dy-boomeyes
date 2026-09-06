// [B1-02] 관제 대시보드 · [B1-02M] 카메라 모달 골격 (specs/control-dashboard AC-1 · AC-2 · AC-5)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const DASH = '/b1/dash?state=dash&capture=1'; // capture=1: 시각 고정 + 데모 세션 합성(셸 렌더)
const root = (scr: string) => `[data-scr="${scr}"]`;

test('[B1-02] 지도 마커 5 · 상태 5종 · 클릭 → 인스펙터 [FR-003] [FR-002]', async ({ page }) => {
  await page.goto(DASH);
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  await page.locator('.be-map[data-ready]').waitFor({ timeout: 20_000 });
  const markers = page.locator('.be-marker');
  await expect(markers).toHaveCount(5);
  const states = await markers.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.state).sort());
  expect(states).toEqual(['caution', 'fault', 'maintenance', 'normal', 'offline']);
  await expect(page.locator('.be-marker[data-state="offline"]')).toHaveAttribute('aria-label', '4호기 — offline');
  await page.locator('.be-marker[data-state="offline"]').click();
  await expect(page.getByText('CPB-004 · 4호기')).toBeVisible();
});

test('[B1-02] KPI 4 · 이상 장비 표 최상단 E-021(CPB-003) [FR-002] [FR-006]', async ({ page }) => {
  await page.goto(DASH);
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  for (const label of ['가동', '주의', '고장·E-코드', '통신 두절'])
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toContainText('CPB-003');
  await expect(rows.first()).toContainText('E-021');
});

test('[B1-02] 셸 안에서 렌더 · 고정 시각 KST [FR-024]', async ({ page }) => {
  await page.goto(DASH);
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  await expect(page.getByText('7. 3. 오전 10:42')).toBeVisible();
});

test('[B1-02M] ?cam= 모달 열림 · Esc 닫힘 [FR-004]', async ({ page }) => {
  await page.goto(`${DASH}&cam=CAM-3-2`);
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(root(SCR['B1-02M']))).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/cam=/);
});

test('[B1-02] mock realtime 알림 도착 → 피드 상단·토스트 · 클릭 → 업무 C-105 [FR-011]', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('control01', { exact: true }).click(); // capture 없이 — realtime이 켜진 실제 흐름
  await expect(page).toHaveURL(/\/b1\/dash/);
  const rows = page.locator('ul[aria-label="알림"] li');
  await expect(rows).toHaveCount(8);
  await expect(rows).toHaveCount(9, { timeout: 10_000 }); // 대본 첫 알림 6s
  await expect(page.getByRole('status').first()).toContainText('CPB-003 호스 주변 인원 접근');
  await expect(rows.first().locator('a')).toHaveAttribute('href', /\/b1\/inbox\?case=C-105$/);
  await rows.first().locator('a').click();
  await expect(page).toHaveURL(/\/b1\/inbox\?case=C-105$/);
});

test('[B1-02M] 라이브/스냅샷 전환 · P-SD 소스 탭(서버·SD, NVR 없음) · 누락분 재전송 · bbox · SD 회수 [FR-004] [FR-005] [FR-034]', async ({
  page,
}) => {
  await page.goto('/b1/dash?state=cam&capture=1&cam=CAM-3-2');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  const player = dialog.locator('[data-camera="CAM-3-2"]');
  await expect(player).toHaveAttribute('data-mode', 'snapshot'); // AI 채널 기본 스냅샷
  await expect(player.locator('img[alt*="스냅샷"]')).toBeVisible();
  await dialog.getByRole('button', { name: '라이브', exact: true }).click();
  await expect(player.locator('video')).toHaveCount(1);
  await expect(player.locator('video')).toHaveAttribute('src', /boom.*\.mp4/);
  await expect(dialog.getByRole('tab', { name: '서버 녹화' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'SD 녹화' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: /NVR/ })).toHaveCount(0);
  await expect(dialog.getByText(/누락분 재전송 3세그먼트/)).toBeVisible();
  await expect(player.locator('svg[data-bbox] rect')).toHaveCount(1);
  await dialog.getByRole('tab', { name: 'SD 녹화' }).click();
  await expect(dialog.getByRole('list', { name: '저장 영상 목록' }).locator('li')).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: 'SD 구간 회수 요청' })).toBeVisible();
});

test('[B1-02] 현장 프로파일 AX-1 — P-LITE 현장(5호기) 선택 시 카메라 월 1채널, P-SD(3호기)는 2채널 [FR-004] [FR-005]', async ({
  page,
}) => {
  await page.goto(DASH);
  await page.locator('.be-map[data-ready]').waitFor({ timeout: 20_000 });
  const wall = page.locator('[data-wall]');
  await expect(wall.locator('button[aria-label*="카메라"]')).toHaveCount(2); // 기본 선택 3호기(SITE-001 · P-SD)
  await page.locator('.be-marker[data-state="maintenance"]').click(); // 5호기 · SITE-002 · P-LITE
  await expect(page.getByText('CPB-005 · 5호기')).toBeVisible();
  await expect(wall.locator('button[aria-label*="카메라"]')).toHaveCount(1);
  await expect(wall.locator('button[aria-label*="일반 카메라"]')).toHaveCount(1);
  await expect(page.getByText('5호기 1채널')).toBeVisible(); // 헤더 채널 수 = 타일 수
});

test('[B1-02M] P-LITE 현장의 AI 채널(CAM-5-2)은 딥링크로도 열리지 않는다 · 일반 채널(CAM-5-1)은 칩 1개 [FR-005]', async ({
  page,
}) => {
  await page.goto('/b1/dash?state=cam&capture=1&cam=CAM-5-2');
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.goto('/b1/dash?state=cam&capture=1&cam=CAM-5-1');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /전방|붐 끝/ })).toHaveCount(1);
  await expect(dialog.getByRole('tab', { name: '서버 녹화' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'SD 녹화' })).toHaveCount(0);
});

test('[B1-02] 셸에는 웨이브·mock 표기가 없다 — 시연 장면 바에서만 (DY-design §12.1-7) [FR-024]', async ({ page }) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  await expect(page.getByText(/wave \d+ · mock/)).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: '주 내비게이션' })).toContainText('운영사 관제 WEB'); // 사이드바 그룹 = 표면 이름(코드 B1 아님)
});
