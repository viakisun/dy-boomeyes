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

test('[A2-02] 오프라인 → 셸 배너 · 체크인 보류(비활성) · 복구 → 활성 [FR-013]', async ({ page }) => {
  await login(page);
  const checkin = page.getByRole('button', { name: '출근 체크인' });
  await expect(checkin).toBeEnabled();
  await page.context().setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: '오프라인' })).toBeVisible();
  await expect(checkin).toBeDisabled();
  await page.context().setOffline(false);
  await expect(page.getByRole('status').filter({ hasText: '오프라인' })).toHaveCount(0);
  await expect(checkin).toBeEnabled();
});

test('[A2-03] 오프라인 → 점검 제출 보류(비활성) · 복구 → 활성 [FR-014]', async ({ page }) => {
  await page.goto('/a2/today/inspect?state=inspect&capture=1'); // 체크인 후 픽스처
  const submit = page.getByRole('button', { name: '점검 제출' });
  await expect(submit).toBeEnabled();
  await page.context().setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: '오프라인' })).toBeVisible();
  await expect(submit).toBeDisabled();
  await page.context().setOffline(false);
  await expect(submit).toBeEnabled();
});
