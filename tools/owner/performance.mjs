// Local owner UI budget, not a production/network SLA. Caller owns both preview servers.
// node tools/owner/performance.mjs --output /tmp/owner-performance.json [--web URL] [--pwa URL]
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpus, platform, release, totalmem } from 'node:os';
import { chromium, expect } from '@playwright/test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const option = (key, fallback) => {
  const index = args.indexOf(key);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${key} requires a value`);
  return args[index + 1];
};
const OUT = resolve(option('--output', '/tmp/owner-performance.json'));
if (existsSync(OUT)) throw new Error(`Report exists: ${OUT}; choose a fresh --output`);
const config = {
  web: {
    base: option('--web', 'http://localhost:4173'),
    entry: '/login?demo=owner',
    home: '/b1/dash',
    fleet: '/b1/fleet',
    viewport: { width: 1280, height: 842 },
  },
  pwa: {
    base: option('--pwa', 'http://localhost:4174'),
    entry: '/a4/login',
    home: '/a4/overview',
    fleet: '/a4/fleet',
    viewport: { width: 390, height: 800 },
  },
};
const quantile = (samples, percentile) =>
  [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * percentile) - 1];
const summarize = (samples, budgetMs) => ({
  count: samples.length,
  p50: quantile(samples, 0.5),
  p95: quantile(samples, 0.95),
  budgetMs,
  pass: samples.length === 20 && quantile(samples, 0.95) <= budgetMs,
});
const report = {
  task: 'OD-13',
  verification: 'VT-10',
  sourceSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
  command: ['node', 'tools/owner/performance.mjs', ...args],
  startedAt: new Date().toISOString(),
  environment: {
    os: platform(),
    release: release(),
    node: process.version,
    cpu: cpus()[0]?.model,
    cores: cpus().length,
    totalMemoryBytes: totalmem(),
    playwright: createRequire(import.meta.url)('playwright/package.json').version,
    timezone: 'Asia/Seoul',
    locale: 'ko-KR',
    dpr: 1,
  },
  conditions: {
    dataset: 'large',
    expectedDevices: 120,
    capture: true,
    warmups: 5,
    measured: 20,
    searchFilterBudgetMs: 300,
    detailBudgetMs: 1000,
    measurement: 'Browser input/change/click event to matching DOM plus next animation frame',
    networkExcluded: 'External map tiles and real device/media transport',
    sort: 'No sort UI exists; search and deployment-filter measured separately',
    resourceRepeat: 'Not repeated here; actual playback/end and removed-player pause are covered by owner e2e',
  },
  status: 'running',
  apps: {},
};
const write = () => writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
write();
let browser;
async function arm(page, selector, event, expected) {
  await page.evaluate(
    ({ selector, event, expected }) => {
      window.__ownerMeasure?.cleanup?.();
      const state = { started: null, elapsed: null, cleanup: () => {} };
      window.__ownerMeasure = state;
      const matches = () => {
        if (expected.kind === 'fleet')
          return document.querySelectorAll('[data-owner-view="fleet"] [data-device]').length === expected.count;
        const detail = document.querySelector('[data-owner-view="detail"]');
        return detail?.textContent.includes('CPB-001') && detail.textContent.includes('김현장');
      };
      const finish = () => {
        if (state.started === null || state.elapsed !== null || !matches()) return;
        requestAnimationFrame(() => {
          if (state.elapsed !== null || !matches()) return;
          state.elapsed = performance.now() - state.started;
          state.cleanup();
        });
      };
      const listener = (e) => {
        if (!(e.target instanceof Element) || !e.target.closest(selector)) return;
        state.started = performance.now();
        finish();
      };
      const observer = new MutationObserver(finish);
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
      document.addEventListener(event, listener, true);
      state.cleanup = () => {
        observer.disconnect();
        document.removeEventListener(event, listener, true);
      };
    },
    { selector, event, expected },
  );
}
async function elapsed(page) {
  await page.waitForFunction(() => Number.isFinite(window.__ownerMeasure?.elapsed), null, { timeout: 5000 });
  return page.evaluate(() => window.__ownerMeasure.elapsed);
}
try {
  browser = await chromium.launch();
  report.environment.chromium = browser.version();
  for (const [app, settings] of Object.entries(config)) {
    const context = await browser.newContext({
      viewport: settings.viewport,
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      reducedMotion: 'reduce',
      isMobile: app === 'pwa',
      hasTouch: app === 'pwa',
    });
    const page = await context.newPage();
    const result = {
      viewport: settings.viewport,
      base: settings.base,
      dataset: 'large',
      pageErrors: [],
      failedRequests: [],
      warmups: { search: [], filter: [], detail: [] },
      samples: { search: [], filter: [], detail: [] },
      summary: {},
      status: 'running',
    };
    report.apps[app] = result;
    page.on('pageerror', (e) => result.pageErrors.push(e.message));
    page.on('requestfailed', (request) =>
      result.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }),
    );
    try {
      await page.goto(new URL(settings.entry, settings.base).href);
      await page.getByRole('button', { name: '데모 시작하기', exact: true }).click();
      await page.waitForURL((url) => url.pathname === settings.home);
      const session = await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'));
      if (session?.role !== 'owner' || session?.ownerId !== 'OWN-001')
        throw new Error('Actual owner CTA session missing');
      await page.goto(new URL(`${settings.fleet}?capture=1&state=large`, settings.base).href);
      await expect(page.locator('[data-owner-view="fleet"]')).toHaveAttribute('data-owner-dataset', 'large');
      const rows = page.locator('[data-owner-view="fleet"] [data-device]');
      await expect(rows).toHaveCount(120);
      await page.evaluate(() => document.fonts.ready);
      const search = page.getByLabel('호기·현장 검색', { exact: true });
      const filter = page.getByLabel('배치 필터', { exact: true });
      const queries = [
        { query: 'CPB-001', count: 1 },
        { query: 'CPB-', count: 120 },
        { query: 'CPB-005', count: 1 },
        { query: 'no-matching-owner-device', count: 0 },
      ];
      const filters = [
        { filter: 'stored', count: 1 },
        { filter: 'all', count: 120 },
        { filter: 'deployed', count: 119 },
        { filter: 'all', count: 120 },
      ];
      for (let i = 0; i < 25; i++) {
        const item = queries[i % queries.length];
        await arm(page, '#owner-fleet-query', 'input', { kind: 'fleet', count: item.count });
        await search.fill(item.query);
        const ms = await elapsed(page);
        await expect(rows).toHaveCount(item.count);
        (i < 5 ? result.warmups.search : result.samples.search).push(ms);
      }
      await search.fill('');
      await expect(rows).toHaveCount(120);
      for (let i = 0; i < 25; i++) {
        const item = filters[i % filters.length];
        await arm(page, '#owner-fleet-filter', 'change', { kind: 'fleet', count: item.count });
        await filter.selectOption(item.filter);
        const ms = await elapsed(page);
        await expect(rows).toHaveCount(item.count);
        (i < 5 ? result.warmups.filter : result.samples.filter).push(ms);
      }
      await filter.selectOption('all');
      await expect(rows).toHaveCount(120);
      await search.fill('CPB-001');
      await expect(rows).toHaveCount(1);
      for (let i = 0; i < 25; i++) {
        await arm(page, '[data-device="CPB-001"]', 'click', { kind: 'detail' });
        await rows.click();
        const ms = await elapsed(page);
        (i < 5 ? result.warmups.detail : result.samples.detail).push(ms);
        await page.getByRole('link', { name: '장비 목록으로', exact: true }).click();
        await expect(rows).toHaveCount(1);
        await expect(search).toHaveValue('CPB-001');
      }
      result.summary = {
        search: summarize(result.samples.search, 300),
        filter: summarize(result.samples.filter, 300),
        detail: summarize(result.samples.detail, 1000),
      };
      const localFailures = result.failedRequests.filter(
        (r) => r.url.startsWith(settings.base) && !r.reason?.includes('ERR_ABORTED'),
      );
      result.status =
        Object.values(result.summary).every((x) => x.pass) &&
        result.pageErrors.length === 0 &&
        localFailures.length === 0
          ? 'passed'
          : 'failed';
      console.log(
        `${app}: search p95 ${result.summary.search.p95.toFixed(1)}ms · filter p95 ${result.summary.filter.p95.toFixed(1)}ms · detail p95 ${result.summary.detail.p95.toFixed(1)}ms · ${result.status}`,
      );
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      console.error(`${app}: ${error.message}`);
    } finally {
      await context.close();
      write();
    }
  }
  report.status =
    Object.keys(report.apps).length === 2 && Object.values(report.apps).every((app) => app.status === 'passed')
      ? 'passed'
      : 'failed';
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
} finally {
  report.finishedAt = new Date().toISOString();
  report.exitCode = report.status === 'passed' ? 0 : 1;
  await browser?.close();
  write();
  console.log(`owner performance: ${report.status} → ${OUT}`);
  process.exitCode = report.exitCode;
}
