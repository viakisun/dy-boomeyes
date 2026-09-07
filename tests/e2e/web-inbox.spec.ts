// [B1-03] 수신함 승인/반려 · [B1-04] 에스컬레이션 (specs/task-escalation AC-6 · AC-7)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-03] 신청 5 · 기본 선택 RQ-003 · 승인 → 상태 갱신 · 반려는 사유 필수 [FR-017] [FR-018]', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('control01', { exact: true }).click();
  await page.goto('/b1/inbox');
  await expect(page.locator(`[data-scr="${SCR['B1-03']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(5);
  const aside = page.getByRole('complementary', { name: '신청 상세' });
  await expect(aside).toContainText('RQ-003');
  await page.getByRole('button', { name: '반려' }).click();
  await expect(page.getByRole('status').first()).toContainText('반려 사유');
  await page.getByRole('button', { name: '승인' }).click();
  await expect(page.getByRole('status').filter({ hasText: '승인 — RQ-003' })).toBeVisible();
  await expect(rows.first()).toContainText('승인');
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('승인');
});

test('[B1-03] ?case=C-105 → 알림에서 열린 업무 패널 · 접수 [FR-011]', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('control01', { exact: true }).click();
  await page.goto('/b1/inbox?case=C-105');
  const panel = page.getByRole('region', { name: '알림에서 열린 업무' });
  await expect(panel.locator('[data-evidence="partial"]')).toContainText('영상 일부 확보'); // C-105 → EV-001(ENT-19)
  await expect(panel).toContainText('C-105');
  await panel.getByRole('button', { name: '접수' }).click();
  await expect(page.getByRole('status').first()).toContainText('접수 — C-105');
  await expect(panel).toContainText('진행 중');
});

test('[B1-04] esc 픽스처: 1h 초과 2건 · 통보 대상 본사·관제 · 관제에서 접수 [FR-010]', async ({ page }) => {
  await page.goto('/b1/escalation?state=esc&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-04']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('건설사 본사 · 관제');
  await expect(rows.first()).toContainText('임계 초과');
  await page.getByRole('button', { name: '관제에서 접수' }).click();
  await expect(rows).toHaveCount(1);
});
