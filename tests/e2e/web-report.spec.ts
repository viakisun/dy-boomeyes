// [B2-04] 보고 모드 (specs/records-reports AC-4)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B2-04] hq 현장별 요약 6지표 · 7일 → 30일(SITE-002 업무 0/1 → 1/2 · 서류 100%) · PDF 비활성 · 처리 액션 없음 [FR-023] [FR-022] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b2/report?state=report&capture=1');
  const doc = page.locator(`[data-scr="${SCR['B2-04']}"]`);
  await expect(doc).toBeVisible();
  await expect(doc).toHaveAttribute('role', 'document');
  await expect(page.locator('[data-site]')).toHaveCount(2);
  const s2 = page.locator('[data-site="SITE-002"]');
  await expect(s2).toContainText('0/1건');
  await expect(s2).toContainText('에스컬레이션');
  await expect(page.getByRole('button', { name: /PDF 내보내기/ })).toBeDisabled();
  await page.getByRole('tab', { name: '30일' }).click();
  await expect(page).toHaveURL(/days=30/);
  await expect(s2).toContainText('1/2건');
  await expect(s2.getByText('서류 1건')).toBeVisible();
  await expect(page.locator('[data-site="SITE-001"]')).toContainText('이상 2');
  await expect(page.getByRole('button', { name: /^접수|^완료|확인 요청/ })).toHaveCount(0);
});

test('[B2-04] hq01 로그인 → 보고 모드 → Esc → 본사 지도(B2-02) [FR-022] [FR-024]', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('hq01', { exact: true }).click();
  await page.getByRole('main').getByRole('link', { name: '보고 모드' }).click();
  await expect(page.locator(`[data-scr="${SCR['B2-04']}"]`)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/b2\/map(\?|$)/);
  await expect(page.locator(`[data-scr="${SCR['B2-02']}"]`)).toBeVisible();
});
