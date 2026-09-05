// [A3-02] 현장 목록(본사) · [A3-05] 업무(열람) — hq01 스코프 2현장 · 처리 권한 없음(DISC-015) (specs/task-escalation AC-10 · AC-11)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const login = async (page: import('@playwright/test').Page) => {
  await page.goto('/a3/login');
  await page.getByRole('button', { name: '입장' }).click();
  await expect(page.locator(`[data-scr="${SCR['A3-02']}"]`)).toBeVisible();
};

test('[A3-02] hq01 현장 2 카드 · 요약 pill(장비·이상·미처리·에스컬레이션) · 카드 → 현장 상세 링크 [FR-022] [FR-010] [FR-024]', async ({
  page,
}) => {
  await login(page);
  const cards = page.locator('ul[aria-label="현장"] li');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('한빛 초등학교');
  await expect(cards.first()).toContainText('이상 2'); // CPB-002 caution · CPB-003 fault
  await expect(cards.nth(1)).toContainText('에스컬레이션 1'); // C-104 (SITE-002)
  await expect(page.getByRole('link', { name: /대전 B 물류센터 현장 상세/ })).toHaveAttribute(
    'href',
    /\/a3\/sites\/SITE-002$/,
  );
  await expect(page.getByRole('button', { name: /접수|완료/ })).toHaveCount(0);
});

test('[A3-05] 전 현장 업무 통합 · 에스컬레이션 칩 · 접수/완료 없음 · 확인 요청 → 이력·토스트 [FR-022] [FR-024]', async ({
  page,
}) => {
  await login(page);
  await page.goto('/a3/tasks');
  await expect(page.locator(`[data-scr="${SCR['A3-05']}"]`)).toBeVisible();
  const items = page.locator('ul[aria-label="업무"] li');
  await expect(items).toHaveCount(5); // 미처리: C-101 C-103 C-104 C-105 C-106
  await expect(page.getByText('C-104')).toBeVisible(); // SITE-002 업무도 본사는 본다
  await expect(page.getByRole('button', { name: '접수', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '완료 확인' })).toHaveCount(0);
  await page.getByRole('tab', { name: /에스컬레이션/ }).click();
  await expect(items).toHaveCount(1);
  await items.first().getByRole('button', { name: '확인 요청' }).click();
  await expect(page.getByRole('status').first()).toContainText('확인 요청 — C-104');
});
