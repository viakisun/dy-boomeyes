// 브랜드 마크(shell-auth AC-8 · DY-design §13): 로그인 두 톤 lockup · 앱바 글리프는 장식(aria-hidden) · apple-touch-icon 링크
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-01] 로그인 두 톤 lockup(role=img "BoomEyes") · 가칭 문구 없음 · apple-touch-icon 링크·응답 200 [FR-001]', async ({
  page,
  request,
}) => {
  await page.goto('/a1/login');
  await expect(page.locator(`[data-scr="${SCR['A1-01']}"]`)).toBeVisible();
  const logo = page.getByRole('img', { name: 'BoomEyes' });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('data-logo', 'lockup');
  await expect(logo).toHaveAttribute('data-color', 'true');
  await expect(page.getByText('BoomEyes(가칭)')).toHaveCount(0);
  const touch = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(touch).toMatch(/apple-touch-icon\.png$/);
  expect((await request.get(touch!)).ok()).toBe(true);
});

test('[A1-02] 앱바 글리프는 장식(aria-hidden) · 제목 h1 유지 · 셸에 이름 있는 마크 없음 [FR-001]', async ({ page }) => {
  await page.goto('/a1/inbox?capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const header = page.locator('header').first();
  const glyph = header.locator('[data-logo="glyph"]');
  await expect(glyph).toHaveCount(1);
  await expect(glyph).toHaveAttribute('aria-hidden', 'true');
  await expect(header.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await expect(page.getByRole('img', { name: 'BoomEyes' })).toHaveCount(0);
});
