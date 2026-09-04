// axe — serious/critical 0 (QA 게이트 6). 대상: 웨이브 0 화면
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES: [string, string][] = [
  ['B0-01', '/login'],
  ['B1-02', '/b1/dash?state=dash&capture=1'],
  ['B1-02M', '/b1/dash?state=dash&capture=1&cam=CAM-3-2'],
];

for (const [scr, url] of PAGES) {
  test(`[${scr}] axe serious/critical 0`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator(`[data-scr="${scr}"]`).first()).toBeVisible(); // 모달은 루트·다이얼로그 둘 다 표시
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
    const bad = result.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
    expect(bad).toEqual([]);
  });
}
