// [B0-01] 역할 카드 로그인 · 라우트 가드 (specs/shell-auth AC-1 · AC-2 · AC-3)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

// 기대 라우트는 spec AC-1 표에서 그대로 — 구현 상수(HOME_OF)를 읽지 않는다
const WEB: { role: string; login: string; home: string }[] = [
  { role: 'control', login: 'control01', home: '/b1/dash' },
  { role: 'hq-safety', login: 'hq01', home: '/b2/map' },
  { role: 'site-safety', login: 'safety01', home: '/b3/console' },
  { role: 'ops-admin', login: 'ops01', home: '/b4/protocols' },
  { role: 'maintenance', login: 'maint01', home: '/b1/escalation' },
];
const at = (path: string) => new RegExp(`${path.replace(/\//g, '\\/')}(\\?|$)`);

test.describe('[B0-01] 역할 카드 로그인', () => {
  for (const { role, login, home } of WEB) {
    test(`[FR-001] ${role} 카드 → 첫 화면 ${home}`, async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator(`[data-scr="${SCR['B0-01']}"]`)).toBeVisible();
      await page.getByText(login, { exact: true }).click();
      await expect(page).toHaveURL(at(home));
      // WebShell(AC-3): 로그아웃 액션 · 사이드바 내비게이션이 보인다
      await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });
  }

  test('[FR-024] 미로그인 접근은 /login?next= 로 보낸다', async ({ page }) => {
    await page.goto('/b1/dash');
    await expect(page).toHaveURL(/\/login\?next=%2Fb1%2Fdash/);
  });

  test('[FR-024] 권한 밖 화면은 403 안내 + 첫 화면으로', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('control01', { exact: true }).click();
    await expect(page).toHaveURL(at('/b1/dash'));
    await page.goto('/b4/protocols');
    await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();
    await page.getByRole('button', { name: '첫 화면으로' }).click();
    await expect(page).toHaveURL(at('/b1/dash'));
  });
});
