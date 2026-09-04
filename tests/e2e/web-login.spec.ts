// [B0-01] 역할 카드 로그인 · 라우트 가드 (specs/shell-auth AC-1 · AC-2 · AC-3)
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { HOME_OF } from '../../packages/domain/src/session';
import { routeOf } from '../../packages/domain/src/routes';

const ssot = JSON.parse(
  readFileSync(new URL('../../packages/domain/src/generated/ssot.json', import.meta.url), 'utf8'),
);
const login = (role: string): string => ssot.roles.roles.find((r: { id: string }) => r.id === role).demo_account.login;
const WEB_ROLES = ['control', 'hq-safety', 'site-safety', 'ops-admin'] as const;

test.describe('[B0-01] 역할 카드 로그인', () => {
  for (const role of WEB_ROLES) {
    test(`[FR-001] ${role} 카드 → 첫 화면 ${HOME_OF[role]}`, async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('[data-scr="B0-01"]')).toBeVisible();
      await page.getByText(login(role), { exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${routeOf(HOME_OF[role])}(\\?|$)`));
      // WebShell(AC-3): 로그아웃 액션이 보인다
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
    });
  }

  test('[FR-024] 미로그인 접근은 /login?next= 로 보낸다', async ({ page }) => {
    await page.goto('/b1/dash');
    await expect(page).toHaveURL(/\/login\?next=%2Fb1%2Fdash/);
  });

  test('[FR-024] 권한 밖 화면은 403 안내 + 첫 화면으로', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(login('control'), { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${routeOf('B1-02')}(\\?|$)`));
    await page.goto(routeOf('B4-02'));
    await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '첫 화면으로' }).click();
    await expect(page).toHaveURL(new RegExp(`${routeOf('B1-02')}(\\?|$)`));
  });
});
