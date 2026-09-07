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
  await expect(page.locator('[data-faulty="true"]').filter({ hasText: /^정상$/ })).toHaveCount(0);
  await expect(page.locator('[data-camera="CAM-3-1"] [data-faulty="false"]')).toContainText('LIVE');
  await expect(page.locator('[data-profile="P-SD"]')).toHaveText('2채널'); // 프로파일 코드 대신 채널 수(§12)
});

test('[A1-04] AI 이벤트 도착 → 배너 · CAM-3-2 타일 bbox [FR-028] [FR-004]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/monitor');
  await expect(page.locator(`[data-scr="${SCR['A1-04']}"]`)).toBeVisible();
  await expect(page.getByText(/AI 이벤트 · CPB-003 호스 주변 인원 접근/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-camera="CAM-3-2"] svg[data-bbox] rect')).toHaveCount(1);
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
  await expect(page.getByText('구간 회수 가능').first()).toBeVisible();
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
