// [A1-01] [A2-01] [A3-01] [A4-01] 앱 로그인 → 앱 첫 화면 (specs/shell-auth AC-5)
import { expect, test } from '@playwright/test';
import { APP_HOME_OF } from '../../packages/domain/src/session';
import { routeOf } from '../../packages/domain/src/routes';

const SURFACES = [
  { surface: 'a1', scr: 'A1-01', role: 'site-safety' },
  { surface: 'a2', scr: 'A2-01', role: 'driver' },
  { surface: 'a3', scr: 'A3-01', role: 'hq-safety' },
  { surface: 'a4', scr: 'A4-01', role: 'owner' },
] as const;

for (const { surface, scr, role } of SURFACES) {
  test(`[${scr}] ${surface} 로그인 → ${APP_HOME_OF[role]} [FR-001]`, async ({ page }) => {
    await page.goto(`/${surface}/login`);
    await expect(page.locator(`[data-scr="${scr}"]`)).toBeVisible();
    await page.getByRole('button', { name: '입장' }).click();
    const home = APP_HOME_OF[role];
    if (!home) throw new Error(`APP_HOME_OF 없음: ${role}`);
    await expect(page).toHaveURL(new RegExp(`${routeOf(home)}(\\?|$)`));
  });
}

test('[FR-024] 미로그인 앱 접근은 표면 로그인으로 보낸다', async ({ page }) => {
  await page.goto(routeOf('A1-02'));
  await expect(page).toHaveURL(/\/a1\/login$/);
});
