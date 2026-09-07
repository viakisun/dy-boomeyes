// 브랜드 마크(shell-auth AC-8 · DY-design §13): 로그인 두 톤 lockup · 사이드바 단색 lockup → 접힘 glyph(폭 = sidebar.collapsed) · favicon 200
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const tokens = JSON.parse(readFileSync(new URL('../../packages/tokens/dist/DY.tokens.json', import.meta.url), 'utf8'));
const COLLAPSED = parseInt(tokens.modes['light.compact']['sys.layout.sidebar.collapsed'], 10); // 56px

test('[B0-01] 로그인 두 톤 lockup(role=img "BoomEyes") · 가칭 문구 없음 · favicon.svg/png 200 [FR-001]', async ({
  page,
  request,
}) => {
  await page.goto('/login');
  await expect(page.locator(`[data-scr="${SCR['B0-01']}"]`)).toBeVisible();
  const logo = page.getByRole('img', { name: 'BoomEyes' });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('data-logo', 'lockup');
  await expect(logo).toHaveAttribute('data-color', 'true');
  await expect(page.getByText('BoomEyes(가칭)')).toHaveCount(0); // 가칭 근거는 data-ref(DISC-021)로만
  for (const href of ['/favicon.svg', '/favicon.png']) expect((await request.get(href)).ok()).toBe(true);
});

test('[B1-02] 사이드바 브랜드 링크 "BoomEyes 홈" = 단색 lockup · 접기 → glyph · aside 폭 = sidebar.collapsed · 글리프/토글 세로 적층 [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-02']}"]`)).toBeVisible();
  const aside = page.getByRole('complementary', { name: '주 내비게이션' });
  const link = aside.getByRole('link', { name: 'BoomEyes 홈' });
  await expect(link.locator('[data-logo="lockup"]')).toHaveCount(1);
  await expect(link.locator('[data-color]')).toHaveCount(0); // 셸은 단색(§13)
  await aside.getByRole('button', { name: '사이드바 접기' }).click();
  await expect(link.locator('[data-logo="glyph"]')).toHaveCount(1);
  expect(Math.round((await aside.boundingBox())!.width)).toBe(COLLAPSED);
  const g = (await link.boundingBox())!;
  const b = (await aside.getByRole('button', { name: '사이드바 펼치기' }).boundingBox())!;
  expect(g.x + g.width).toBeLessThanOrEqual(COLLAPSED + 1); // 글리프가 56 안에 든다
  expect(b.y).toBeGreaterThanOrEqual(g.y + g.height - 1); // 토글은 글리프 아래(겹침 없음)
});
