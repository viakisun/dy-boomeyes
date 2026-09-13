import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export type OwnerApp = 'web' | 'pwa';
// Independent expected routes and seed facts from owner-experience/design.md; do not import HOME_OF or selectors from UI.
export const OWNER_PATHS = {
  web: {
    entry: '/login?demo=owner',
    overview: '/b1/dash',
    fleet: '/b1/fleet',
    video: '/b1/fleet/CPB-001/video',
    documents: '/b1/docs',
    alerts: '/b1/alerts',
    requests: '/b1/requests',
    lease: '/b1/leases',
    drivers: '/b1/drivers',
    'driver-docs': '/b1/drivers/docs',
  },
  pwa: {
    entry: '/a4/login',
    overview: '/a4/overview',
    fleet: '/a4/fleet',
    video: '/a4/fleet/CPB-001/video',
    documents: '/a4/docs',
    alerts: '/a4/alerts',
    requests: '/a4/requests',
    lease: '/a4/leases',
    drivers: '/a4/drivers',
    'driver-docs': '/a4/drivers/docs',
  },
} as const;
// owner_demo에 등록됐지만 아직 만들지 않은 화면 목적(ssot/meta.yaml owner_demo_wave 위).
// 여기 적힌 것은 「표식이 붙은 안내 화면」이어야 하고, 나머지는 실제 본문이어야 한다.
export const OWNER_UNBUILT = ['lease'] as const;

/** 호기 화면은 현황의 호기 단계 하나다(시안 «확정 2026-09-12») — 현장과 호기는 짝이어야 한다. */
export const unitPath = (app: OwnerApp, site: string, device: string, extra = '') =>
  `${OWNER_PATHS[app].overview}?site=${site}&device=${device}${extra}`;
/** 시드가 정한 짝 — 여기 적힌 것 말고 다른 조합은 ownerLevel이 현장 단계로 물린다. */
export const UNIT = {
  'CPB-001': 'SITE-MAPO',
  'CPB-002': 'SITE-SONGDO',
  'CPB-004': 'SITE-DAEJEON',
  'CPB-005': 'SITE-YONGIN',
} as const;

/** 알림은 좌측 메뉴에서 내려와 헤더의 종으로 들어왔다(시안 «결정 2026-09-12»). */
export async function openAlerts(page: Page) {
  await page.getByRole('button', { name: /^알림/ }).click();
  await page.locator('[data-owner-bell]').getByRole('link', { name: '알림 전체 보기' }).click();
}
/** 전국 카드는 확인이 필요한 현장부터 보인다(시안 «확정 2026-09-12») — 정상 현장에 닿으려면 펼친다. */
export async function openAllSites(page: Page) {
  const all = page.getByRole('button', { name: /^전체 \d+개 현장$/ });
  if (await all.count()) await all.first().click();
}

/** 장비 서류도 메뉴에서 내려왔다 — 서류는 호기에 속하므로 보유 장비 → 호기 화면 → 서류로 연다.
 *  goto는 전체 새로고침이라 메모리에 있는 시연 첨부가 사라진다 — 실제 사용자 경로를 그대로 따른다. */
export async function openDocuments(page: Page, device = 'CPB-001') {
  await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
  await page.locator(`[data-device="${device}"]`).first().click();
  // 호기 화면의 차량 서류는 문서별 링크다 — 첫 장을 열면 그 호기의 서류 화면이 열린다
  await page.getByRole('list', { name: '관련 서류', exact: true }).getByRole('link').first().click();
}
export const test = base.extend<{ ownerRuntime: void }>({
  ownerRuntime: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      const failures: { url: string; reason?: string }[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) =>
        failures.push({ url: request.url(), reason: request.failure()?.errorText }),
      );
      await use();
      await testInfo.attach('owner-runtime.json', {
        body: JSON.stringify({ pageErrors: errors, failedRequests: failures }, null, 2),
        contentType: 'application/json',
      });
      expect(errors, 'Uncaught errors must not silently interrupt owner tasks').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
export const ownerHost = (page: Page, view?: string) =>
  page.locator(view ? `[data-owner-view="${view}"]` : '[data-owner-view]').first();
export async function startOwner(page: Page, app: OwnerApp) {
  await page.goto(OWNER_PATHS[app].entry);
  await page.getByRole('button', { name: '데모 계정으로 로그인', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${OWNER_PATHS[app].overview.replaceAll('/', '\\/')}(?:\\?|$)`));
  await expect(ownerHost(page, 'overview')).toHaveAttribute('data-owner-role', 'owner');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'))).toMatchObject({
    userId: 'owner01',
    role: 'owner',
    ownerId: 'OWN-001',
  });
  expect(new URL(page.url()).searchParams.has('capture')).toBe(false);
  expect(new URL(page.url()).searchParams.has('scene')).toBe(false);
}
export async function testSession(context: BrowserContext, ownerId?: string, role = 'owner') {
  // Explicit mock session preparation for B/invalid-session tests; never public URL privilege switching.
  await context.addInitScript(
    ({ ownerId, role }) => {
      localStorage.setItem(
        'boomeyes.session',
        JSON.stringify({
          userId: ownerId === 'OWN-002' ? 'owner02' : 'owner01',
          role,
          display: '검증 계정',
          org: '검증 소유주',
          ...(ownerId === undefined ? {} : { ownerId }),
        }),
      );
    },
    { ownerId, role },
  );
}
export async function noOverflow(page: Page) {
  const size = await page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      viewport: innerWidth,
      page: document.documentElement.scrollWidth,
      main: main?.clientWidth,
      content: main?.scrollWidth,
    };
  });
  expect(size.page).toBeLessThanOrEqual(size.viewport + 1);
  if (size.main && size.content) expect(size.content).toBeLessThanOrEqual(size.main + 1);
}
