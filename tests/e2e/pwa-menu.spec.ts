// [A1-07] 메뉴·현장 정보 + 신청 시트 · [A2-06] 메뉴·현장 정보(운전자) (specs/sites-assets-leases AC-5 · AC-6)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-07] 현장 기본정보 · 내 신청 3 · 현장 개설 신청 시트 → 제출 → RQ-006 검토 중(수신함 등록) [FR-017] [FR-018]', async ({
  page,
}) => {
  await page.goto('/a1/menu?state=menu&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-07']}"]`)).toBeVisible();
  const info = page.locator('dl[aria-label="현장 기본정보"]');
  await expect(info).toContainText('전라북도 전주시');
  await expect(info).toContainText('2026-03-01 ~ 2026-12-31');
  await expect(info).toContainText('김현장');
  await expect(page.locator('[data-profile="P-SD"]')).toHaveText('2채널');
  const mine = page.locator('ul[aria-label="내 신청"] li');
  await expect(mine).toHaveCount(3); // safety01: RQ-003 · RQ-004 · RQ-005
  await page.getByRole('button', { name: '현장 개설 신청' }).click();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toContainText('현장 개설 신청');
  await sheet.getByLabel('현장명').fill('한빛 초등학교 2공구');
  await sheet.getByLabel('주소').fill('전주시 덕진구');
  await sheet.getByLabel('기간 시작').fill('2026-10-01');
  await sheet.getByLabel('기간 종료').fill('2027-03-31');
  await sheet.getByRole('button', { name: '제출' }).click();
  await expect(page.getByRole('status').filter({ hasText: '신청 — RQ-006 검토 중' })).toBeVisible();
  await expect(sheet).toHaveCount(0);
  await expect(mine).toHaveCount(4);
  await expect(mine.first()).toContainText('RQ-006');
  await expect(mine.first()).toContainText('한빛 초등학교 2공구 개설 신청');
  await expect(mine.first()).toContainText('검토 중');
  await expect(mine.first()).toContainText('2026-10-01~2027-03-31');
});

test('[A1-07] apply 픽스처는 신청 시트가 열린 채 시작 · 장비 배정 종류 전환 [FR-017]', async ({ page }) => {
  await page.goto('/a1/menu?state=apply&capture=1');
  const sheet = page.locator('dialog[open][data-bottom-sheet][data-capture-dialog]');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel('현장명')).toBeVisible();
  await sheet.getByLabel('신청 종류').selectOption('device-assign');
  await expect(sheet.getByLabel('필요 대수')).toHaveValue('2');
  await sheet.getByRole('button', { name: '닫기' }).click();
  await expect(sheet).toHaveCount(0);
});

test('[A2-06] driver03 배정 현장 기본정보 · 배정 장비 CPB-003 · 동의 요약(영상 ✓ 음성 ✗ 위치 ✓) · 앱 정보 · 편집 액션 없음 [FR-018] [FR-031]', async ({
  page,
}) => {
  await page.goto('/a2/menu?state=menu&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-06']}"]`)).toBeVisible();
  const info = page.locator('dl[aria-label="현장 기본정보"]');
  await expect(page.getByRole('heading', { name: '한빛 초등학교 건설 현장' })).toBeVisible();
  await expect(info).toContainText('SITE-001 · G/S 건설');
  await expect(info).toContainText('2026-03-01 ~ 2026-12-31');
  await expect(info).toContainText('정정비 · 010-0000-0009');
  await expect(page.locator('[data-device="CPB-003"]')).toContainText('CPB-003 · 3호기');
  const consent = page.locator('[aria-label="동의 항목"]');
  await expect(consent).toContainText('영상 동의 ✓');
  await expect(consent).toContainText('음성 동의 ✗');
  await expect(consent).toContainText('위치 동의 ✓');
  await expect(page.getByText(/BoomEyes 운전자 앱 v\d+\.\d+\.\d+/)).toBeVisible(); // 앱 정보 = 계정 · 역할 · 버전
  await expect(page.getByText(/wave \d+ · mock/)).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('button')).toHaveCount(0); // 편집·제출 액션 없음
});
