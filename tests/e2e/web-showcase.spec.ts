// [B1-07] 쇼케이스 (specs/owner-showcase AC-1~3 · 장면 10)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-07] 화면 루트 다크 강제(문서 루트 아님) · 지표 4 · 카메라 월 라이브 · 마스킹(김*장 · 010-****-0001) · DISC-031 표기 · 처리 액션 없음 [FR-023] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/showcase?state=show&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-07']}"]`)).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  const box = page.locator('[data-showcase]');
  await expect(box).toHaveAttribute('data-theme', 'dark');
  await expect(box).toHaveAttribute('role', 'document');
  await expect(box.getByText('D+63', { exact: true })).toBeVisible(); // 현장 카드 문구에도 D+63이 있다 // 대전 B 개설 2026-05-01 → 고정 시각 2026-07-03
  await expect(box).toContainText('점검 제출률');
  await expect(box).toContainText('서류 완비율');
  await expect(box).toContainText('24시간 알림');
  await expect(box.locator('[data-wall] button[aria-label*="카메라"]')).toHaveCount(8); // SITE-001 3×2 + SITE-002 2×1(P-LITE)
  await expect(box).toContainText('김*장');
  await expect(box).not.toContainText('김현장');
  await expect(box).toContainText('010-****-0001');
  await expect(box).not.toContainText('DISC-'); // 정책 근거는 화면 밖(data-ref)
  await expect(box.locator('[data-watermark]')).toHaveAttribute('data-ref', /DISC-031/);
  await expect(box.locator('button:not([aria-label*="카메라"])')).toHaveCount(0); // 처리·편집 액션 없음(타일만)
  await expect(box.locator('a')).toHaveCount(0);
});

test('[B1-07] control01 로그인 → 대시보드 "쇼케이스" → B1-07 → Esc → B1-02 · 클릭으로도 복귀 [FR-023]', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByText('control01', { exact: true }).click();
  await page.getByRole('button', { name: '쇼케이스' }).click();
  await expect(page.locator(`[data-scr="${SCR['B1-07']}"]`)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  await page.getByRole('button', { name: '쇼케이스' }).click();
  await expect(page.locator(`[data-scr="${SCR['B1-07']}"]`)).toBeVisible();
  await page.locator('[data-showcase] [data-watermark]').click();
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
});
