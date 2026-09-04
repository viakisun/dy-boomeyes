// [B1-02] 관제 대시보드 · [B1-02M] 카메라 모달 골격 (specs/control-dashboard AC-1 · AC-2 · AC-5)
import { expect, test } from '@playwright/test';

const DASH = '/b1/dash?state=dash&capture=1'; // capture=1: 시각 고정 + 로그인 가드 우회(mock)

test('[B1-02] 지도 마커 5 · 상태 5종 · 클릭 → 인스펙터 [FR-003] [FR-002]', async ({ page }) => {
  await page.goto(DASH);
  await expect(page.locator('[data-scr="B1-02"]')).toBeVisible();
  await page.locator('.be-map[data-ready]').waitFor({ timeout: 20_000 });
  const markers = page.locator('.be-marker');
  await expect(markers).toHaveCount(5);
  const states = await markers.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.state).sort());
  expect(states).toEqual(['caution', 'fault', 'maintenance', 'normal', 'offline']);
  await page.locator('.be-marker[data-state="offline"]').click();
  await expect(page.getByText('CPB-004 · 4호기')).toBeVisible();
});

test('[B1-02] KPI 4 · 이상 장비 표 최상단 E-021(CPB-003) [FR-002] [FR-006]', async ({ page }) => {
  await page.goto(DASH);
  await expect(page.locator('[data-scr="B1-02"]')).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toContainText('CPB-003');
  await expect(rows.first()).toContainText('E-021');
  await expect(page.getByText('통신 두절', { exact: true })).toBeVisible();
});

test('[B1-02M] ?cam= 모달 열림 · Esc 닫힘 [FR-004]', async ({ page }) => {
  await page.goto(`${DASH}&cam=CAM-3-2`);
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-scr="B1-02M"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/cam=/);
});
