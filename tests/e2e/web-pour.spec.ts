// [B1-02] 인스펙터 타설량 · [B4-07] 누적 타설 분모 (specs/pour-metrics AC-1 · AC-4 · AC-5)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-02] 인스펙터 타설량 12h — 기본 선택 CPB-003: 막대 12 · 합계 31 m³ · 가동률 82% · 누적 3,910 · DISC-055 근거 [FR-039] [FR-002]', async ({
  page,
}) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  const aside = page.locator('aside[aria-label="장비 상세"]');
  const fig = aside.getByRole('figure', { name: '타설량 12h' });
  await expect(fig).toContainText('합계 31 m³');
  await expect(fig).toContainText('가동률 82%');
  await expect(fig.getByRole('row')).toHaveCount(13); // 헤더 + 12버킷(sr-only 표)
  await expect(fig.getByRole('rowheader', { name: '10시' })).toHaveCount(1); // KST — 컴포넌트는 시각을 모른다(fmtHour)
  const ref = aside.locator('[data-ref="DISC-055"]');
  await expect(ref).toContainText('누적 3,910 m³');
  await expect(ref).toContainText('0.0123 m²');
});

// AC-5 — 전부 0(정비 중 CPB-005 · SITE-002)은 관제(전 현장) 인스펙터에서: 0 m³ · 0%이지 미연동이 아니다. 캡처 세션(safety01)은 SITE-001뿐이라 A1-05로는 열 수 없다(AC-15)
test('[B1-02] 정비 중 CPB-005 — 타설량 12h 합계 0 m³ · 가동률 0% · 미연동 아님 [FR-039] [FR-034]', async ({ page }) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  await page.locator('.be-marker[data-state="maintenance"]').click(); // 5호기
  await expect(page.getByText('CPB-005 · 5호기')).toBeVisible();
  const aside = page.locator('aside[aria-label="장비 상세"]');
  const fig = aside.getByRole('figure', { name: '타설량 12h' });
  await expect(fig).toContainText('합계 0 m³');
  await expect(fig).toContainText('가동률 0%');
  await expect(aside.getByText('타설량 미연동')).toHaveCount(0);
});

test('[B4-07] 누적 타설 진행 막대 분모 = 참고 기준 3,000 m³(단독 폐기 기준 아님) [FR-032] [FR-039]', async ({
  page,
}) => {
  await page.goto('/b4/parts?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-07']}"]`)).toBeVisible();
  await expect(page.getByRole('progressbar').first()).toHaveAttribute(
    'aria-valuetext',
    /\/ 3000 m³\(참고 기준 · 단독 폐기 기준 아님\)/,
  );
});
