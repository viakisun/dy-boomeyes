// demo-scripts 장면 재생(웹): 장면 1 타임라인 · 장면 4 진행 · 장면 6 1시간 경과 · 장면 8 진입 · 장면 바 (specs/demo-scripts AC-1 AC-4 AC-5 AC-6 AC-7)
import { expect, test } from '@playwright/test';
import { CURRENT_WAVE, SCR } from '../../packages/domain/src/generated/ids';

const root = (scr: string) => `[data-scr="${scr}"]`;

test('[B1-02] 장면 1: 진입 시 CPB-003 정상 → 타임라인 E-021 긴급 알림 → 토스트·표 최상단·마커 fault [FR-011] [FR-002] [FR-003]', async ({
  page,
}) => {
  await page.goto('/b1/dash?scene=1');
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  await page.locator('.be-map[data-ready]').waitFor({ timeout: 20_000 });
  await expect(page.locator('.be-marker[data-state="fault"]')).toHaveCount(0); // 상황 발생 전
  await expect(page.locator('table tbody tr').filter({ hasText: 'CPB-003' })).toHaveCount(0);
  await expect(page.getByRole('status').first()).toContainText('380V 전압 이상', { timeout: 10_000 }); // 대본 3s
  await expect(page.locator('.be-marker[data-state="fault"]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('table tbody tr').first()).toContainText('CPB-003');
  await expect(page.locator('[data-demo-bar]')).toContainText('장면 1/11');
  await expect(page.locator('[data-demo-bar]')).toContainText(`wave ${CURRENT_WAVE} · mock`); // 웨이브·mock 표기는 장면 바에서만
});

test('[B1-03] 장면 4: C-105 접수됨으로 진입 · ?case=C-105 패널 진행 중 [FR-017] [FR-006]', async ({ page }) => {
  await page.goto('/b1/inbox?scene=4&case=C-105');
  await expect(page.locator(root(SCR['B1-03']))).toBeVisible();
  const panel = page.getByRole('region', { name: '알림에서 열린 업무' });
  await expect(panel).toContainText('C-105');
  await expect(panel).toContainText('진행 중');
  await expect(page.locator('[data-demo-bar]')).toContainText('장면 4/11');
  await expect(page.locator('[data-demo-bar]')).toContainText('원격 진단·배정');
});

test('[B1-04] 장면 6: 55분 방치 → 에스컬레이션 없음 → "1시간 경과" → CPB-004 최상단 · 통보 대상 본사·관제 [FR-010]', async ({
  page,
}) => {
  await page.goto('/b1/escalation?scene=6');
  await expect(page.locator(root(SCR['B1-04']))).toBeVisible();
  await expect(page.getByText('에스컬레이션된 업무가 없습니다')).toBeVisible();
  await page.locator('[data-demo-bar]').getByRole('button', { name: '1시간 경과' }).click();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2); // C-104(1h55m) · C-105(1h00m20s)
  await expect(rows.first()).toContainText('CPB-004');
  await expect(rows.first()).toContainText('건설사 본사 · 관제');
});

test('[B4-02] 장면 바 "근거" 토글: 부제 data-ref(FR-020)가 칩으로 보인다 · 화면 문자열에는 ID 없음 [FR-024]', async ({
  page,
}) => {
  await page.goto('/b4/protocols?scene=8');
  await expect(page.locator(root(SCR['B4-02']))).toBeVisible();
  const sub = page.locator('[data-ref="FR-020"]');
  await expect(sub).toBeVisible();
  await expect(sub).not.toContainText('FR-020');
  const chip = () => sub.evaluate((el) => getComputedStyle(el, '::after').content);
  expect(await chip()).toBe('none');
  await page.locator('[data-demo-bar]').getByRole('button', { name: '근거' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-demo-refs', '');
  expect(await chip()).toContain('FR-020');
  await page.locator('[data-demo-bar]').getByRole('button', { name: '근거' }).click();
  expect(await chip()).toBe('none');
});

test('[B4-02] 장면 8: ops01 세션으로 프로토콜 화면 진입 · 장면 바 이전(장면 7 A2 앱)/다음(장면 9) [FR-020] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b4/protocols?scene=8');
  await expect(page.locator(root(SCR['B4-02']))).toBeVisible();
  await expect(page.getByText('cpb.v0.1').first()).toBeVisible();
  const bar = page.locator('[data-demo-bar]');
  await expect(bar).toContainText('장면 8/11');
  await expect(page.locator('[data-demo-bar]')).toContainText('확장성');
  await expect(bar.getByRole('link', { name: '← 이전' })).toHaveAttribute('href', /4174\/a2\/docs\?scene=7$/);
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveAttribute('href', /\/b1\/leases\?scene=9$/);
});

test('[B1-02] 장면 바: 장면 1 → 다음은 장면 2(A2 앱 절대 URL) · 이전 없음 · 장면 없는 화면엔 바 없음 [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/dash?scene=1');
  const bar = page.locator('[data-demo-bar]');
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveAttribute('href', /4174\/a2\/today\?scene=2$/);
  await expect(bar.getByRole('link', { name: '← 이전' })).toHaveCount(0);
  await page.goto('/b1/dash?state=dash&capture=1');
  await expect(page.locator('[data-demo-bar]')).toHaveCount(0);
});

test('[B1-06] 장면 9: owner01 세션 · LS-001 D-27 최상단 · 재배치 계획 → relocated · 장면 바 다음(장면 10) [FR-019] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/leases?scene=9');
  await expect(page.locator(root(SCR['B1-06']))).toBeVisible();
  const bar = page.locator('[data-demo-bar]');
  await expect(bar).toContainText('장면 9/11');
  await expect(bar).toContainText('사업 가치');
  await expect(page.locator('table tbody tr').first()).toContainText('D-27');
  const form = page.getByRole('form', { name: '재배치 계획' });
  await form.getByLabel('재배치 대상 현장').selectOption('SITE-002');
  await form.getByRole('button', { name: '재배치 계획' }).click();
  await expect(page.locator('table tbody tr').first()).toContainText('재배치');
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveAttribute('href', /scene=10$/);
});

test('[B1-07] 장면 10: 쇼케이스에서 시작(control 대체 세션) · 다크 강제 · 장면 바 10/11 · 이전(장면 9) · 다음(장면 11) [FR-023] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/showcase?scene=10');
  await expect(page.locator(root(SCR['B1-07']))).toBeVisible();
  await expect(page.locator('[data-showcase]')).toHaveAttribute('data-theme', 'dark');
  const bar = page.locator('[data-demo-bar]');
  await expect(bar).toContainText('장면 10/11');
  await expect(bar).toContainText('쇼케이스');
  await expect(bar.getByRole('link', { name: '← 이전' })).toHaveAttribute('href', /\/b1\/leases\?scene=9$/);
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveAttribute('href', /\/b1\/dash\?scene=11$/);
});

test('[B1-02] 장면 11: 쌓인 데이터 — CPB-003 인스펙터 타설량 12h · 가동률 82% · 3상 결상 · 장면 바 11/11 · 이전(장면 10) [FR-039] [FR-040] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/dash?scene=11');
  await expect(page.locator(root(SCR['B1-02']))).toBeVisible();
  await expect(page.getByText('차사장')).toBeVisible(); // 장면 11 계정 owner01 — 소유주가 주인공(ADR-012)
  const bar = page.locator('[data-demo-bar]');
  await expect(bar).toContainText('장면 11/11');
  await expect(bar).toContainText('쌓인 데이터');
  const aside = page.locator('aside[aria-label="장비 상세"]');
  await expect(aside).toContainText('CPB-003 · 3호기');
  await expect(aside.getByRole('figure', { name: '타설량 12h' })).toContainText('가동률 82%');
  await expect(aside.locator('dl[aria-label="텔레메트리"]')).toContainText('결상');
  await expect(bar.getByRole('link', { name: '← 이전' })).toHaveAttribute('href', /\/b1\/showcase\?scene=10$/);
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveCount(0);
});
