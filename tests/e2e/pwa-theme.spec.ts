// 다크 렌더(shell-auth AC-6, PWA): ?theme=dark → PwaShell 다크 토큰 · 시스템 다크(prefers-color-scheme)를 강제 없이 따름 · 다크 axe 0
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const tokens = JSON.parse(readFileSync(new URL('../../packages/tokens/dist/DY.tokens.json', import.meta.url), 'utf8'));
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const CANVAS = {
  light: rgb(tokens.modes['light.comfortable']['sys.color.bg.canvas']),
  dark: rgb(tokens.modes['dark.comfortable']['sys.color.bg.canvas']),
};
const frameBg = (page: import('@playwright/test').Page) =>
  page.locator('[data-capture-frame]').evaluate((el) => getComputedStyle(el).backgroundColor);

test('[A2-02] ?theme=dark → PwaShell이 다크 토큰으로 렌더 · axe serious/critical 0 [FR-001]', async ({ page }) => {
  await page.goto('/a2/today?state=today&capture=1&theme=dark');
  await expect(page.locator(`[data-scr="${SCR['A2-02']}"]`)).toBeVisible();
  await expect(page.getByRole('button', { name: '출근 체크인' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await frameBg(page)).toBe(CANVAS.dark);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
  const bad = result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
  expect(bad).toEqual([]);
});

test.describe('시스템 다크', () => {
  test.use({ colorScheme: 'dark' });
  test('[A1-02] prefers-color-scheme: dark → data-theme 없이 다크 토큰 적용(강제 없음) [FR-001]', async ({ page }) => {
    await page.goto('/a1/inbox?state=inbox&capture=1');
    await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    expect(await frameBg(page)).toBe(CANVAS.dark);
  });
});

test('[A1-02] 시스템 라이트 → 라이트 canvas (PWA에는 토글이 없다) [FR-001]', async ({ page }) => {
  await page.goto('/a1/inbox?state=inbox&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  await expect(page.getByRole('button', { name: /모드/ })).toHaveCount(0);
  expect(await frameBg(page)).toBe(CANVAS.light);
});
