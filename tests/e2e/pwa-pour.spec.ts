// [A1-05] 부품 탭 타설량 · [A2-04] 오늘 타설량·가동률 (specs/pour-metrics AC-2 · AC-3)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-05] 부품 탭 타설량 — CPB-003: 누적 3,910 · 24시간 165 · 오늘 31 · 가동률 82% · 막대 24 [FR-039] [FR-032]', async ({
  page,
}) => {
  await page.goto('/a1/monitor/CPB-003?state=dev&capture=1&tab=parts');
  await expect(page.locator(`[data-scr="${SCR['A1-05']}"]`)).toBeVisible();
  const sec = page.getByRole('region', { name: '타설량' });
  await expect(sec).toContainText('3,910 m³');
  await expect(sec).toContainText('165 m³');
  await expect(sec).toContainText('31 m³');
  await expect(sec).toContainText('82%');
  await expect(sec.getByRole('figure', { name: '타설량 24h' }).getByRole('row')).toHaveCount(25); // 헤더 + 24
});

test('[A2-04] 오늘 타설량 31 m³ · 가동률 82%(선형) · 차트 없음 [FR-039] [FR-007]', async ({ page }) => {
  await page.goto('/a2/device?state=mydev&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-04']}"]`)).toBeVisible();
  const sec = page.getByRole('region', { name: '타설량' });
  await expect(sec).toContainText('31 m³');
  await expect(sec.getByRole('progressbar')).toHaveAttribute('aria-valuetext', /82%/);
  await expect(sec.getByRole('figure')).toHaveCount(0);
});
