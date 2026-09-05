// axe(PWA) — serious/critical 0 (QA 게이트 6)
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const PAGES: { scr: string; url: string; ready: (page: Page) => Promise<void> }[] = [
  {
    scr: SCR['A1-01'],
    url: '/a1/login',
    ready: (p) => expect(p.getByText('safety01', { exact: false })).toBeVisible(),
  },
  {
    scr: SCR['A1-02'],
    url: '/a1/inbox?state=inbox&capture=1',
    ready: (p) => expect(p.locator('ul[aria-label="업무"] li')).toHaveCount(3),
  },
  {
    scr: SCR['A1-03'],
    url: '/a1/inbox/C-105?state=case&capture=1',
    ready: (p) => expect(p.getByRole('button', { name: '접수', exact: true })).toBeVisible(),
  },
  {
    scr: SCR['A2-02'],
    url: '/a2/today?state=today&capture=1',
    ready: (p) => expect(p.getByRole('button', { name: '출근 체크인' })).toBeVisible(),
  },
  {
    scr: SCR['A2-03'],
    url: '/a2/today/inspect?state=inspect&capture=1',
    ready: (p) => expect(p.getByRole('checkbox')).toHaveCount(5),
  },
  {
    scr: SCR['A2-04'],
    url: '/a2/device?state=mydev&capture=1',
    ready: (p) => expect(p.getByRole('meter', { name: '필터 도달률' })).toBeVisible(),
  },
  {
    scr: SCR['A1-04'],
    url: '/a1/monitor?state=monitor&capture=1',
    ready: (p) => expect(p.getByText('AI 판단 불가').first()).toBeVisible(),
  },
  {
    scr: SCR['A1-05'],
    url: '/a1/monitor/CPB-003?state=dev&capture=1',
    ready: (p) => expect(p.getByText('E-021').first()).toBeVisible(),
  },
];

for (const { scr, url, ready } of PAGES) {
  test(`[${scr}] axe serious/critical 0`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator(`[data-scr="${scr}"]`).first()).toBeVisible();
    await ready(page);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
    const bad = result.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
    expect(bad).toEqual([]);
  });
}
