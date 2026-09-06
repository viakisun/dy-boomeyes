// [A2-02] 오늘 · [A2-03] 일일점검 · [A2-04] 내 장비 — 운전자 하루 (specs/driver-daily AC-1~AC-5)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const login = async (page: import('@playwright/test').Page) => {
  await page.goto('/a2/login');
  await page.getByRole('button', { name: '입장' }).click();
  await expect(page.locator(`[data-scr="${SCR['A2-02']}"]`)).toBeVisible();
};

test('[A2-02] driver03 오늘: 배정 CPB-003 · 미체크인 · E-021 알림 · 촬영 중 · 동의 배지 [FR-013] [FR-011] [FR-031]', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByRole('link', { name: /배정 장비 CPB-003/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '출근 체크인' })).toBeVisible();
  await expect(page.getByText('● 촬영 중')).toBeVisible();
  await expect(page.getByText('영상 동의 ✓')).toBeVisible();
  await expect(page.getByText('음성 동의 ✗')).toBeVisible();
  await expect(page.getByRole('button', { name: /E-021/ }).first()).toBeVisible();
});

test('[A2-02] 반경 밖 체크인 거부 → 반경 안 체크인 → 근무 중 · 체크아웃 [FR-013]', async ({ page }) => {
  await login(page);
  await page.goto('/a2/today?gps=out');
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.getByRole('dialog')).toContainText('현장 반경 밖');
  await page.getByRole('button', { name: '닫기' }).click();
  await page.goto('/a2/today');
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.getByRole('status').filter({ hasText: '출근 체크인 완료' })).toBeVisible(); // Banner도 role=status
  await expect(page.getByText(/근무 중/)).toBeVisible();
  await page.getByRole('button', { name: '퇴근 체크아웃' }).click();
  await expect(page.getByText(/^퇴근 /)).toBeVisible();
});

test('[A2-02] 알림 열람 → 대응 안내 · 확인 [FR-011] [FR-006]', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /E-021/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('대응 안내');
  await expect(dialog).toContainText('380V 전압 이상');
  await dialog.getByRole('button', { name: '확인' }).click();
  await expect(dialog).toHaveCount(0);
});

test('[A2-03] 체크인 후 5항목 제출 → 제출 완료 · 오늘 배너 success [FR-014]', async ({ page }) => {
  await page.goto('/a2/today/inspect?state=inspect&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-03']}"]`)).toBeVisible();
  const boxes = page.getByRole('checkbox');
  await expect(boxes).toHaveCount(5);
  for (let i = 0; i < 4; i++) await boxes.nth(i).check();
  await expect(page.getByText('이상 1건')).toBeVisible();
  await page.getByRole('button', { name: '점검 제출' }).click();
  await expect(page.getByText('제출 완료', { exact: true })).toBeVisible(); // 토스트('일일점검 제출 완료')와 구분
  await expect(page.getByText('이상 1건')).toBeVisible();
});

test('[A2-03] 미체크인이면 제출 불가 안내 [FR-014]', async ({ page }) => {
  await login(page); // 로그인 직후 = 미체크인
  await page.goto('/a2/today/inspect');
  await expect(page.getByText('출근 체크인 후에 점검을 제출할 수 있습니다')).toBeVisible();
  await expect(page.getByRole('button', { name: '점검 제출' })).toBeDisabled();
});

test('[A2-04] 내 장비: 342V 이상 · E-021 · 수송관 62% 정상 · 필터 92% 임계 접근 [FR-002] [FR-007]', async ({
  page,
}) => {
  await page.goto('/a2/device?state=mydev&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-04']}"]`)).toBeVisible();
  await expect(page.getByText('342V · 이상')).toBeVisible();
  await expect(page.getByRole('meter', { name: '수송관 도달률' })).toHaveAttribute('aria-valuetext', '62% 정상');
  await expect(page.getByRole('meter', { name: '필터 도달률' })).toHaveAttribute('aria-valuetext', '92% 임계 접근');
  await expect(page.getByText('AI 판단 불가')).toHaveCount(0); // CPB-003 채널은 라이브·스냅샷
});

// 오프라인 제출 큐(specs/driver-daily AC-6 · ADR-010) — 셸 배너 문구는 QA §2의 셋(오프라인 · 동기 대기 n건 · 전송 실패 n건)
const card = (page: import('@playwright/test').Page) => page.locator('section[aria-label="출근"]');

test('[A2-02] 오프라인 체크인 → 카드 "동기 대기" · 배너 "동기 대기 1건" → 복구 → 전송 · 근무 중 [FR-037] [FR-013]', async ({
  page,
}) => {
  await login(page);
  await page.context().setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: '오프라인' })).toBeVisible();
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(card(page)).toContainText('동기 대기');
  await expect(page.getByRole('status').filter({ hasText: '동기 대기 1건' })).toBeVisible();
  await page.context().setOffline(false);
  await expect(card(page)).toContainText('근무 중', { timeout: 10_000 });
  await expect(page.getByRole('status').filter({ hasText: '동기 대기' })).toHaveCount(0);
});

test('[A2-02] ?net=off 체크인 → 새로고침 후에도 큐 유지(IndexedDB) → net 정상 진입 시 자동 전송 [FR-037] [NFR-016]', async ({
  page,
}) => {
  await login(page);
  await page.goto('/a2/today?net=off');
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.getByRole('status').filter({ hasText: '동기 대기 1건' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: '동기 대기 1건' })).toBeVisible();
  await expect(card(page)).toContainText('동기 대기');
  await page.goto('/a2/today');
  await expect(card(page)).toContainText('근무 중', { timeout: 10_000 });
});

test('[A2-02] ?net=fail 체크인 → 백오프 5회 → "전송 실패 1건" · 재시도 → 근무 중 [NFR-016]', async ({ page }) => {
  await login(page);
  await page.goto('/a2/today?net=fail');
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.locator('[data-outbox="failed"]')).toContainText('전송 실패 1건', { timeout: 20_000 }); // 토스트도 role=status → 배너로 범위
  await page.goto('/a2/today'); // 새 db · net 정상 — failed는 자동 재전송 대상이 아니다
  await expect(page.locator('[data-outbox="failed"]')).toContainText('전송 실패 1건');
  await page.getByRole('button', { name: '재시도' }).click();
  await expect(card(page)).toContainText('근무 중', { timeout: 10_000 });
});

test('[A2-03] 체크인 뒤 오프라인 점검 제출 → "제출 — 동기 대기" · 배너 → 복구 → 제출 완료 [FR-037] [FR-014]', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(card(page)).toContainText('근무 중');
  await page.getByRole('button', { name: '점검하기' }).click(); // 앱 내 이동 — mock db 유지
  await expect(page.locator(`[data-scr="${SCR['A2-03']}"]`)).toBeVisible();
  await page.context().setOffline(true);
  const boxes = page.getByRole('checkbox');
  for (let i = 0; i < 5; i++) await boxes.nth(i).check();
  await page.getByRole('button', { name: '점검 제출' }).click();
  await expect(page.getByText('제출 — 동기 대기')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '동기 대기 1건' })).toBeVisible();
  await page.context().setOffline(false);
  await expect(page.getByText('제출 완료', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('status').filter({ hasText: '동기 대기' })).toHaveCount(0);
});
