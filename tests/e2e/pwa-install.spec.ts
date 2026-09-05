// PWA 설치(specs/shell-auth AC-7): manifest · 아이콘 · 서비스 워커 등록 · 오프라인 새로고침에도 셸 렌더
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-01] manifest 링크·필드(name · icons 3 · standalone · theme_color) · 아이콘 응답 200 [FR-001]', async ({
  page,
  request,
}) => {
  await page.goto('/a1/login');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toMatch(/manifest\.webmanifest$/);
  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('BoomEyes 현장');
  expect(m.display).toBe('standalone');
  expect(m.theme_color).toBe('#0d2877');
  expect(m.icons).toHaveLength(3);
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0d2877');
});

test('[A2-01] 서비스 워커 등록 → 오프라인 새로고침에도 로그인 셸 렌더 [FR-001] [FR-024]', async ({ page, context }) => {
  await page.goto('/a2/login');
  await expect(page.locator(`[data-scr="${SCR['A2-01']}"]`)).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready); // 등록·활성(프리캐시 완료)
  await page.reload(); // 이 페이지가 SW의 제어를 받게
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(`[data-scr="${SCR['A2-01']}"]`)).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
});
