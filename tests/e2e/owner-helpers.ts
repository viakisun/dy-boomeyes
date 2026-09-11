import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export type OwnerApp = 'web' | 'pwa';
// Independent expected routes and seed facts from owner-experience/design.md; do not import HOME_OF or selectors from UI.
export const OWNER_PATHS = {
  web: {
    entry: '/login?demo=owner',
    overview: '/b1/dash',
    fleet: '/b1/fleet',
    detail: '/b1/fleet/CPB-001',
    video: '/b1/fleet/CPB-001/video',
    documents: '/b1/docs',
    alerts: '/b1/alerts',
  },
  pwa: {
    entry: '/a4/login',
    overview: '/a4/overview',
    fleet: '/a4/fleet',
    detail: '/a4/fleet/CPB-001',
    video: '/a4/fleet/CPB-001/video',
    documents: '/a4/docs',
    alerts: '/a4/alerts',
  },
} as const;
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
