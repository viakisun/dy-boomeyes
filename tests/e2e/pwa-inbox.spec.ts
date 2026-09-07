// [A1-02] 업무함 · [A1-03] 업무 상세 — 접수 흐름 (specs/task-escalation AC-1 · AC-2 · AC-3 · AC-8)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-02] safety01 업무 5 중 미처리 4 · 고장·이상 칩 2 · 정렬 최상단 C-105 [FR-008] [FR-009] [FR-024]', async ({
  page,
}) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const items = page.locator('ul[aria-label="업무"] li');
  await expect(items).toHaveCount(4);
  await expect(items.first()).toContainText('C-105');
  await expect(items.first()).toContainText('신규');
  await page.getByRole('tab', { name: /고장·이상/ }).click();
  await expect(page).toHaveURL(/filter=fault/);
  await expect(items).toHaveCount(2);
  await page.getByRole('tab', { name: /전체/ }).click();
  await expect(items).toHaveCount(5);
  await expect(page.getByText('C-104')).toHaveCount(0); // SITE-002 업무는 안 보인다
});

test('[A1-03] C-105 접수 → in-progress · 이력 · 완료 확인 · 정비 호출 [FR-008] [FR-006]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.locator('ul[aria-label="업무"] li a').first().click();
  await expect(page).toHaveURL(/\/a1\/inbox\/C-105$/);
  await expect(page.locator('[data-evidence="partial"]')).toContainText('영상 일부 확보'); // EV-001 연결(ENT-19)
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible();
  await expect(page.getByText('E-021', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: '정비 담당 호출' }).click();
  await expect(page.getByRole('status').first()).toContainText('정비 담당 호출');
  await page.getByRole('button', { name: '접수', exact: true }).click();
  await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('접수');
  await expect(page.getByRole('button', { name: '완료 확인' })).toBeVisible();
});

test('[A1-08] 완료 처리 시트: 접수 후 완료 확인 → ?sheet=complete 시트 → 조치 내용 필수 → done · 이력 note · 시트는 A1-03 위 [FR-008]', async ({
  page,
}) => {
  // 실사용 흐름(live) — capture 모드는 화면 코드별 db 캐시라 모달(A1-08)↔부모(A1-03) 이동 시 db가 바뀐다(QA §3)
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/inbox/C-105');
  await page.getByRole('button', { name: '접수', exact: true }).click();
  await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '완료 확인' }).click();
  await expect(page).toHaveURL(/sheet=complete/);
  await expect(page.locator(`[data-scr="${SCR['A1-08']}"]`).first()).toBeVisible();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toContainText('완료 처리');
  await expect(sheet.getByRole('button', { name: '완료 확인' })).toBeDisabled(); // 조치 내용 필수
  await sheet.getByLabel('조치 내용(필수)').fill('전압 릴레이 교체');
  await sheet.getByRole('button', { name: '완료 확인' }).click();
  await expect(page).toHaveURL(/\/a1\/inbox\/C-105$/); // 시트 닫힘
  await expect(page.getByText('완료 상태 — 할 일이 없습니다')).toBeVisible(); // in-progress → done
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('전압 릴레이 교체');
});

test('[A1-02] realtime 알림 도착 → 앱바 배지 · 토스트 · 배지 탭 → 업무 C-105 [FR-011]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const badge = page.getByRole('link', { name: /새 알림/ });
  await expect(badge).toBeVisible({ timeout: 10_000 }); // 대본 첫 알림 6s
  await expect(badge).toContainText('1');
  await expect(page.getByRole('status').first()).toContainText('CPB-003 호스 주변 인원 접근');
  await badge.click();
  await expect(page).toHaveURL(/\/a1\/inbox\/C-105$/);
});
