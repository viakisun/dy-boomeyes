// [A1-02] PWA 알림(specs/notifications AC-1 · AC-2 · AC-3 · ADR-009) — 권한 시트 · granted면 SW showNotification · 딥링크 data.url
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

// headless shell은 알림 권한을 항상 거부한다(grantPermissions 무효) → 이 파일은 전체 크로미움(channel: 'chromium', playwright install chromium에 포함)으로 돈다. channel은 워커 범위라 파일 단위 use
test.use({ channel: 'chromium' });

test('[A1-02] ?state=push 시트: 권한 default 문구 · axe 0 · "알림 켜기" → headless 자동 거부 → denied 안내 [FR-011]', async ({
  page,
}) => {
  await page.goto('/a1/inbox?state=push&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-02']}"]`)).toBeVisible();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toContainText('권한이 필요합니다');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'best-practice']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  await sheet.getByRole('button', { name: '알림 켜기' }).click();
  await expect(sheet).toContainText('브라우저 설정에서'); // headless는 requestPermission을 자동 거부한다
  await expect(sheet.getByRole('button', { name: '알림 켜기' })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: '허용되지 않았습니다' })).toBeVisible();
});

test('[A1-02] 권한 granted + SW 제어 → 장면 1 알림 도착 → 기기 알림 1(제목 · tag · data.url = /a1/inbox/C-105) · 종 "알림 켜짐" [FR-011] [FR-010]', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['notifications']);
  await page.goto('/a1/inbox?scene=1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // SW 제어 + 장면 타임라인 재시작(3초 뒤 E-021)
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: '알림 켜짐' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '380V 전압 이상' })).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const reg = await navigator.serviceWorker.ready;
          return (await reg.getNotifications()).map((n) => ({
            title: n.title,
            tag: n.tag,
            url: (n.data as { url?: string } | null)?.url,
          }));
        }),
      { timeout: 5_000 },
    )
    .toEqual([{ title: 'CPB-003 · 전압', tag: 'C-105', url: '/a1/inbox/C-105' }]);
});
