// [A1-02] 업무함 · [A1-03] 업무 상세 — 접수 흐름 (specs/task-escalation AC-1 · AC-2 · AC-3 · AC-8)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-02] safety01 업무 4 중 미처리 3 · 고장·이상 칩 2 · 정렬 최상단 C-105 [FR-008] [FR-009] [FR-024]', async ({
  page,
}) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const items = page.locator('ul[aria-label="업무"] li');
  await expect(items).toHaveCount(3);
  await expect(items.first()).toContainText('C-105');
  await expect(items.first()).toContainText('신규');
  await page.getByRole('tab', { name: /고장·이상/ }).click();
  await expect(page).toHaveURL(/filter=fault/);
  await expect(items).toHaveCount(2);
  await page.getByRole('tab', { name: /전체/ }).click();
  await expect(items).toHaveCount(4);
  await expect(page.getByText('C-104')).toHaveCount(0); // SITE-002 업무는 안 보인다
});

test('[A1-03] C-105 접수 → in-progress · 이력 · 완료 확인 · 정비 호출 [FR-008] [FR-006]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.locator('ul[aria-label="업무"] li a').first().click();
  await expect(page).toHaveURL(/\/a1\/inbox\/C-105$/);
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible();
  await expect(page.getByText('E-021', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: '정비 담당 호출' }).click();
  await expect(page.getByRole('status').first()).toContainText('정비 담당 호출');
  await page.getByRole('button', { name: '접수', exact: true }).click();
  await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('접수');
  await expect(page.getByRole('button', { name: '완료 확인' })).toBeVisible();
});
