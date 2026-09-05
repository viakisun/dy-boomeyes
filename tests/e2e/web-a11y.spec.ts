// axe — serious/critical 0 (QA 게이트 6). 대상: 웨이브 0 화면. 비동기 콘텐츠(계정 · 마커)가 뜬 뒤 검사한다
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const markersReady = async (page: Page) => expect(page.locator('.be-marker')).toHaveCount(5);
const PAGES: { scr: string; url: string; ready: (page: Page) => Promise<void> }[] = [
  { scr: SCR['B0-01'], url: '/login', ready: (p) => expect(p.getByText('control01', { exact: true })).toBeVisible() },
  { scr: SCR['B1-02'], url: '/b1/dash?state=dash&capture=1', ready: markersReady },
  { scr: SCR['B1-02M'], url: '/b1/dash?state=dash&capture=1&cam=CAM-3-2', ready: markersReady },
  {
    scr: SCR['B1-03'],
    url: '/b1/inbox?state=inbox&capture=1',
    ready: (p) => expect(p.getByText('RQ-003', { exact: false }).first()).toBeVisible(),
  },
  {
    scr: SCR['B1-04'],
    url: '/b1/escalation?state=esc&capture=1',
    ready: (p) => expect(p.getByText('C-105', { exact: false }).first()).toBeVisible(),
  },
  {
    scr: SCR['B2-03'],
    url: '/b2/sites/SITE-001?state=site&capture=1',
    ready: (p) => expect(p.locator('[data-wall] button[aria-label*="카메라"]')).toHaveCount(6),
  },
  {
    scr: SCR['B1-05'],
    url: '/b1/docs?state=docs&capture=1',
    ready: (p) => expect(p.locator('table tbody tr')).toHaveCount(6),
  },
  {
    scr: SCR['B4-03'],
    url: '/b4/assets?state=assets&capture=1',
    ready: (p) => expect(p.locator('table tbody tr')).toHaveCount(5),
  },
  {
    scr: SCR['B4-04'],
    url: '/b4/users?state=users&capture=1',
    ready: (p) => expect(p.locator('table tbody tr')).toHaveCount(7),
  },
  {
    scr: SCR['B4-06'],
    url: '/b4/docs?state=docs&capture=1',
    ready: (p) => expect(p.locator('table tbody tr')).toHaveCount(6),
  },
  {
    scr: SCR['B4-02'],
    url: '/b4/protocols?state=proto&capture=1',
    ready: (p) => expect(p.getByText('cpb.v0.1').first()).toBeVisible(),
  },
  {
    scr: SCR['B4-05'],
    url: '/b4/rules?state=rules&capture=1',
    ready: (p) => expect(p.getByText('수송관 도달률').first()).toBeVisible(),
  },
];

for (const { scr, url, ready } of PAGES) {
  test(`[${scr}] axe serious/critical 0`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator(`[data-scr="${scr}"]`).first()).toBeVisible(); // 모달은 루트·다이얼로그 둘 다 표시
    await ready(page);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
    const bad = result.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`);
    expect(bad).toEqual([]);
  });
}
