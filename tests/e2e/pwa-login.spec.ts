// [A1-01] [A2-01] [A3-01] [A4-01] 앱 로그인 → 앱 첫 화면 (specs/shell-auth AC-1 · AC-4 · AC-5)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

// 기대 라우트는 spec AC-1 표에서 그대로
const SURFACES = [
  { surface: 'a1', scr: SCR['A1-01'], role: 'site-safety', home: '/a1/inbox' },
  { surface: 'a2', scr: SCR['A2-01'], role: 'driver', home: '/a2/today' },
  { surface: 'a3', scr: SCR['A3-01'], role: 'hq-safety', home: '/a3/sites' },
  { surface: 'a4', scr: SCR['A4-01'], role: 'owner', home: '/a4/fleet' },
] as const;
const at = (path: string) => new RegExp(`${path.replace(/\//g, '\\/')}(\\?|$)`);

for (const { surface, scr, role, home } of SURFACES) {
  test(`[${scr}] ${surface} ${role} 로그인 → ${home} [FR-001]`, async ({ page }) => {
    await page.goto(`/${surface}/login`);
    await expect(page.locator(`[data-scr="${scr}"]`)).toBeVisible();
    await page.getByRole('button', { name: '입장' }).click();
    await expect(page).toHaveURL(at(home));
    // PwaShell(AC-4): 앱바 로그아웃 · 하단 내비
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
}

test('[FR-024] 미로그인 앱 접근은 표면 로그인으로 보낸다', async ({ page }) => {
  await page.goto('/a1/inbox');
  await expect(page).toHaveURL(/\/a1\/login$/);
});
