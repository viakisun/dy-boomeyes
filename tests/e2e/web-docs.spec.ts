// [B1-05] 서류 현황 · [B4-06] 서류 관리 (specs/documents AC-4 · AC-5)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-05] 완비율·만료 임박 · 표 · 인스펙터 이력·요청 회신 링크 · 등록/승인 액션 없음 [FR-016] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/docs?state=docs&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-05']}"]`)).toBeVisible();
  await expect(page.getByText('만료 임박·반려')).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(6);
  await expect(rows.first()).toContainText('DOC-001'); // 만료 빠른 순
  const aside = page.getByRole('complementary', { name: '서류 상세' });
  await expect(aside).toContainText('DOC-001');
  await expect(aside.getByRole('link', { name: /요청 회신 — RQ-003/ })).toBeVisible();
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('만료 임박 D-30');
  await expect(page.getByRole('button', { name: /승인|반려|등록/ })).toHaveCount(0);
  await rows.nth(1).click();
  await expect(page).toHaveURL(/doc=DOC-/);
});

test('[B4-06] 5유형 등록 → valid · 만료 D-10이면 expiring · 목록·인스펙터 [FR-016]', async ({ page }) => {
  await page.goto('/b4/docs?state=docs&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-06']}"]`)).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(6);
  await page.getByRole('tab', { name: '등록' }).click();
  const form = page.getByRole('form', { name: '서류 등록' });
  await form.getByLabel('유형').selectOption('ndt');
  await form.getByLabel('대상').selectOption('CPB-001');
  await form.getByLabel('서류명').fill('CPB-001 비파괴 검사 성적서');
  await form.getByLabel('유효기간(만료일)').fill('2026-07-13'); // 고정 시각 7/3 + 10일 → expiring
  await form.getByRole('button', { name: '등록' }).click();
  await expect(page.getByRole('status').first()).toContainText('등록 — DOC-007 만료 임박');
  await expect(page.locator('table tbody tr')).toHaveCount(7);
  await expect(page.getByRole('complementary', { name: '서류 상세' })).toContainText('DOC-007');
});
