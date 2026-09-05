// Playwright e2e — 빌드된 앱(apps/*/build)을 vite preview로 띄워 검사한다 (QA 게이트 6). 순서: pnpm build → pnpm e2e
import { defineConfig } from '@playwright/test';

const WEB = 'http://localhost:4173';
const PWA = 'http://localhost:4174';
const preview = (app: string, port: number) => `pnpm --filter @boomeyes/${app} preview --port ${port} --strictPort`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { locale: 'ko-KR', timezoneId: 'Asia/Seoul', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'web', testMatch: /web-.*\.spec\.ts/, use: { baseURL: WEB, viewport: { width: 1280, height: 842 } } },
    {
      name: 'pwa',
      testMatch: /pwa-.*\.spec\.ts/,
      use: { baseURL: PWA, viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    { command: preview('web', 4173), url: WEB, reuseExistingServer: !process.env.CI, timeout: 30_000 },
    { command: preview('pwa', 4174), url: PWA, reuseExistingServer: !process.env.CI, timeout: 30_000 },
  ],
});
