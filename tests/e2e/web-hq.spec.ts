// [B2-03] 현장 상세(본사 웹) — hq01 스코프 · 장비 카드 · 2채널 카메라 월(P-SD) · 처리 버튼 없음 · 확인 요청 → 이력 (specs/video-basics AC-8 · DISC-015)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B2-03] SITE-001 장비 3 · 카메라 월 6채널(P-SD 2채널) · 접수/완료 없음 · 확인 요청 → 이력·토스트 [FR-004] [FR-022] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b2/sites/SITE-001?state=site&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B2-03']}"]`)).toBeVisible();
  await expect(page.locator('[data-device]')).toHaveCount(3);
  await expect(page.locator('[data-device="CPB-003"]')).toContainText('고장');
  await expect(page.locator('[data-device="CPB-003"]')).toContainText('E-021');
  const wall = page.locator('[data-wall]');
  await expect(wall.locator('button[aria-label*="카메라"]')).toHaveCount(6);
  await expect(page.getByRole('button', { name: /^접수|^완료/ })).toHaveCount(0);
  const aside = page.getByRole('complementary', { name: '미처리 업무' });
  await expect(aside.locator('ul[aria-label="업무"] li')).toHaveCount(4); // C-101 C-103 C-105 C-106
  await aside.getByRole('button', { name: /확인 요청 — C-105/ }).click();
  await expect(page.getByRole('status').first()).toContainText('확인 요청 — C-105');
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('확인 요청');
});

test('[B2-03] P-LITE 현장(SITE-002)은 1채널 월 · 없는 현장은 404 [FR-005] [FR-022]', async ({ page }) => {
  await page.goto('/b2/sites/SITE-002?state=site&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B2-03']}"]`)).toBeVisible();
  await expect(page.locator('[data-profile="P-LITE"]')).toHaveText('1채널'); // 프로파일 코드 대신 채널 수
  await expect(page.locator('[data-wall] button[aria-label*="카메라"]')).toHaveCount(2); // CPB-004 · CPB-005 일반 채널만
  await page.goto('/b2/sites/SITE-999?state=site&capture=1');
  await expect(page.getByText('현장 SITE-999 없음')).toBeVisible();
});
