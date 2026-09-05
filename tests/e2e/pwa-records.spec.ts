// [A1-06] 기록 · [A3-06] 기록(본사) (specs/records-reports AC-1 · AC-3)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-06] 업무·점검·출근·서류 이력 한 타임라인(시각 역순) · 유형 칩 · 수정·삭제 없음 [FR-012]', async ({
  page,
}) => {
  await page.goto('/a1/records?state=rec&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-06']}"]`)).toBeVisible();
  const rows = page.locator('ol[aria-label="기록"] li');
  await expect(rows.first()).toContainText('발행 — E-021'); // C-105 20초 전 — 최신이 위
  const chips = page.getByRole('group', { name: '유형' });
  await expect(chips.getByRole('button', { name: /^업무/ })).toContainText('7');
  await expect(chips.getByRole('button', { name: /^점검/ })).toContainText('1');
  await expect(chips.getByRole('button', { name: /^출근/ })).toContainText('1');
  await expect(chips.getByRole('button', { name: /^서류/ })).toContainText('5');
  await chips.getByRole('button', { name: /^점검/ }).click();
  await expect(page).toHaveURL(/kind=inspection/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('일일점검 제출 — CPB-003 (5/5 정상)');
  await expect(rows.first()).toContainText('점검'); // 유형 배지
  await chips.getByRole('button', { name: /^출근/ }).click();
  await expect(rows.first()).toContainText('출근 체크인 — CPB-003');
  await expect(page.getByRole('button', { name: /수정|삭제|편집/ })).toHaveCount(0);
});

test('[A3-06] hq01 두 현장 기록 · 현장 칩으로 구분(대전 B = C-104 발행·에스컬레이션) · 처리 액션 없음 [FR-022] [FR-012]', async ({
  page,
}) => {
  await page.goto('/a3/records?state=rec&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A3-06']}"]`)).toBeVisible();
  const rows = page.locator('ol[aria-label="기록"] li');
  await expect(rows.first()).toContainText('한빛 초등학교 건설 현장'); // 현장 배지
  const sites = page.getByRole('group', { name: '현장' });
  await sites.getByRole('button', { name: /대전 B 물류센터/ }).click();
  await expect(page).toHaveURL(/site=SITE-002/);
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('에스컬레이션');
  await expect(rows.nth(1)).toContainText('발행');
  await expect(page.getByRole('button', { name: /접수|완료|확인 요청/ })).toHaveCount(0);
});
