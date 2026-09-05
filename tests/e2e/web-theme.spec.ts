// 다크 렌더(shell-auth AC-6): ?theme=dark → 루트 data-theme · 셸 배경 = 다크 canvas 토큰 · 탑바 토글이 localStorage에 유지 · 다크 axe 0
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const tokens = JSON.parse(readFileSync(new URL('../../packages/tokens/dist/DY.tokens.json', import.meta.url), 'utf8'));
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const CANVAS = {
  light: rgb(tokens.modes['light.compact']['sys.color.bg.canvas']),
  dark: rgb(tokens.modes['dark.compact']['sys.color.bg.canvas']),
};
const shellBg = (page: import('@playwright/test').Page) =>
  page
    .locator('main')
    .evaluate((m) => getComputedStyle(m.parentElement!.parentElement!.parentElement!).backgroundColor);

test('[B0-01] ?theme=dark → 루트 data-theme=dark · 로그인 화면 배경이 다크 canvas [FR-024]', async ({ page }) => {
  await page.goto('/login?theme=dark');
  await expect(page.locator(`[data-scr="${SCR['B0-01']}"]`)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('html').evaluate((h) => getComputedStyle(h).backgroundColor)).toBe(CANVAS.dark);
});

test('[B1-02] ?theme=dark → WebShell이 다크 토큰으로 렌더 · axe serious/critical 0 [FR-024]', async ({ page }) => {
  await page.goto('/b1/dash?state=dash&capture=1&theme=dark');
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  await expect(page.locator('.be-marker')).toHaveCount(5);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await shellBg(page)).toBe(CANVAS.dark);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
  const bad = result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
  expect(bad).toEqual([]);
});

test('[B1-02] 탑바 테마 토글 → data-theme 전환 · 새로고침 후 유지(localStorage) · 라이트 복귀 [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
  expect(await shellBg(page)).toBe(CANVAS.light);
  await page.getByRole('button', { name: '다크 모드' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await shellBg(page)).toBe(CANVAS.dark);
  await page.reload();
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); // app.html이 첫 페인트 전에 적용
  await page.getByRole('button', { name: '라이트 모드' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await shellBg(page)).toBe(CANVAS.light);
});
