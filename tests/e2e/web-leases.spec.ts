// [B1-06] 임대 계약 · [B2-02] 본사 지도 (specs/sites-assets-leases AC-3 · AC-4)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-06] LS-001 D-27 만료 임박 최상단 · 재배치 계획(SITE-002 · 메모) → relocated · 이력 · 대상 현장 · active는 폼 없음 [FR-019] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/leases?state=lease&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-06']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('LS-001');
  await expect(rows.first()).toContainText('D-27');
  await expect(rows.first()).toContainText('만료 임박');
  const aside = page.getByRole('complementary', { name: '계약 상세' });
  await expect(aside).toContainText('LS-001');
  await expect(aside).toContainText('김현장'); // 현장 안전관리자 — 홍보 연계
  const form = aside.getByRole('form', { name: '재배치 계획' });
  await form.getByLabel('재배치 대상 현장').selectOption('SITE-002');
  await form.getByLabel('메모').fill('10월 대전 B 이동');
  await form.getByRole('button', { name: '재배치 계획' }).click();
  await expect(page.getByRole('status').filter({ hasText: '재배치 계획 — LS-001 → 대전 B 물류센터' })).toBeVisible();
  await expect(rows.first()).toContainText('재배치');
  await expect(rows.first()).toContainText('→ 대전 B 물류센터');
  await expect(aside).toContainText('재배치 계획 확정 — 대전 B 물류센터');
  await expect(aside.locator('ol[aria-label="이력"] li').first()).toContainText('재배치 계획 — 대전 B 물류센터');
  await expect(aside.getByRole('button', { name: '재배치 계획' })).toHaveCount(0);
  await rows.nth(1).click();
  await expect(page).toHaveURL(/lease=LS-002/);
  await expect(aside).toContainText('계약 중');
  await expect(aside.getByRole('button', { name: '재배치 계획' })).toHaveCount(0); // active → relocated 전이 없음
});

test('[B2-02] hq01 로그인 → 본사 지도: 마커 5 · 현장 카드 2 · 처리 버튼 없음 · 보고 모드 링크 · 카드 → B2-03 [FR-003] [FR-022] [FR-024]', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByText('hq01', { exact: true }).click();
  await expect(page).toHaveURL(/\/b2\/map(\?|$)/);
  await expect(page.locator(`[data-scr="${SCR['B2-02']}"]`)).toBeVisible();
  await expect(page.locator('.be-map[data-ready]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.be-marker')).toHaveCount(5);
  await expect(page.locator('.be-marker[data-state="offline"]')).toHaveCount(1); // CPB-004 대전
  const cards = page.locator('ul[aria-label="현장 목록"] [data-site]');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('이상 2'); // SITE-001: 주의 · 고장
  await expect(page.getByRole('button', { name: /^접수|^완료|확인 요청/ })).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('link', { name: '보고 모드' })).toHaveAttribute(
    'href',
    /\/b2\/report$/,
  ); // 사이드바에도 같은 링크가 있다
  await page.locator('[data-site="SITE-002"]').click();
  await expect(page).toHaveURL(/\/b2\/sites\/SITE-002$/);
  await expect(page.locator(`[data-scr="${SCR['B2-03']}"]`)).toBeVisible();
  await expect(page.locator('[data-profile="P-LITE"]')).toHaveText('1채널');
});
