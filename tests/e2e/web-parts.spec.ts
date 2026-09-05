// [B4-07] 부품 대장 · [B4-08] 점검·교체 이력 (specs/equipment-parts AC-1 · AC-4 · W2 구조)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B4-07] 부품 5 · 상태 pill(P-004 교체 대상) · 인스펙터 이력(실측 3.1mm 불) · 발주·재고 편집 비활성 · DISC-038 배너 · 재고 5 [FR-032]', async ({
  page,
}) => {
  await page.goto('/b4/parts?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-07']}"]`)).toBeVisible();
  await expect(page.locator('[data-banner="threshold"]')).toContainText('OEM 기준 미확정(DISC-038)');
  const rows = page.locator('table').first().locator('tbody tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.filter({ hasText: 'P-004' })).toContainText('교체 대상');
  await expect(rows.filter({ hasText: 'P-002' })).toContainText('점검됨');
  const aside = page.getByRole('complementary', { name: '부품 상세' });
  await expect(aside).toContainText('P-004 · DY-GSK-125'); // due 부품 기본 선택
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('점검 · 실측 3.1mm · 불');
  await rows.filter({ hasText: 'P-001' }).click();
  await expect(page).toHaveURL(/part=P-001/);
  await expect(aside).toContainText('직관·이송배관');
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('장착');
  await expect(page.getByRole('button', { name: /발주 — 2단계/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /재고 편집 — 2단계/ })).toBeDisabled();
  await expect(page.locator('table').nth(1).locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('table').nth(1)).toContainText('안전재고 이하'); // DY-EH-125 1/1
  await expect(page.getByRole('progressbar').first()).toHaveAttribute('aria-valuetext', /m³/);
  await expect(page.getByRole('link', { name: '점검·교체 이력 ›' })).toHaveAttribute('href', /\/b4\/parts\/history$/);
});

test('[B4-08] 이력 3(시각 역순) · 구분 칩 점검 2 · 행 선택 → 실측·합불·보조지표 [FR-032]', async ({ page }) => {
  await page.goto('/b4/parts/history?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-08']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('P-004'); // 2일 전 점검이 최신
  await expect(rows.first()).toContainText('불');
  const chips = page.getByRole('group', { name: '구분' });
  await chips.getByRole('button', { name: /^점검/ }).click();
  await expect(page).toHaveURL(/kind=inspect/);
  await expect(rows).toHaveCount(2);
  await rows.nth(1).click();
  const aside = page.getByRole('complementary', { name: '이력 상세' });
  await expect(aside).toContainText('P-002');
  await expect(aside).toContainText('5.2 mm (기준 6 mm)');
  await expect(aside).toContainText('합 (입력자 판정');
  await expect(aside).toContainText('보조지표');
  await expect(page.getByRole('button', { name: /수정|삭제/ })).toHaveCount(0);
});
