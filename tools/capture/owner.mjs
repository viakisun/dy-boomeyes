// Owner captures: actual CTA session, source registry, 112 mandatory viewport/theme combinations.
// --list performs no browser/server work. --only <view,SCR> produces partial evidence (exit 2).
// --reuse-server uses caller-owned servers and never stops them. Default refuses occupied ports.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { parse } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const option = (key, fallback) => {
  const index = args.indexOf(key);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${key} requires a value`);
  return args[index + 1];
};
const source = parse(readFileSync(join(ROOT, 'ssot/screens.yaml'), 'utf8'));
const views = source.owner_demo;
const expectedViews = ['entry', 'overview', 'fleet', 'detail', 'video', 'documents', 'alerts'];
if (
  !Array.isArray(views) ||
  views.length !== 7 ||
  expectedViews.some((v) => views.filter((x) => x.view === v).length !== 1)
)
  throw new Error('owner_demo must declare each of the seven required views exactly once');
const sizes = {
  web: [
    [1280, 842],
    [1024, 842],
    [768, 842],
    [390, 800],
  ],
  pwa: [
    [375, 800],
    [390, 800],
    [430, 900],
    [768, 1024],
  ],
};
const selection = option('--only', '').split(',').filter(Boolean);
const all = views.flatMap((view) =>
  ['web', 'pwa'].flatMap((app) => {
    const screen = source.screens.find((s) => s.id === view[app]);
    if (!screen || !screen.roles.includes('owner')) throw new Error(`Owner screen missing or wrong role: ${view[app]}`);
    // 운영 현황은 드릴다운 3단계(전국 · 현장 · 호기)를 각각 캡처한다 — 7종 + 2단계 = 9 × 2앱 × 4폭 × 2테마 = 144
    const levels = view.view === 'overview' ? ['nation', 'site', 'unit'] : [undefined];
    return levels.flatMap((level) =>
      sizes[app].flatMap(([width, height]) =>
        ['light', 'dark'].map((theme) => ({
          view: view.view,
          label: view.label,
          code: screen.id,
          app,
          route: screen.route,
          state: 'owner',
          level,
          query:
            level === 'site' ? { site: 'SITE-MAPO' } : level === 'unit' ? { site: 'SITE-MAPO', device: 'CPB-001' } : {},
          width,
          height,
          theme,
          wave: screen.wave,
          key: `${app}-${view.view}${level && level !== 'nation' ? `-${level}` : ''}-${width}x${height}-${theme}`,
        })),
      ),
    );
  }),
);
export const OWNER_CAPTURE_COUNT = 144;
if (all.length !== OWNER_CAPTURE_COUNT || new Set(all.map((x) => x.key)).size !== OWNER_CAPTURE_COUNT)
  throw new Error(`Expected exactly ${OWNER_CAPTURE_COUNT} unique combinations`);
for (const item of selection)
  if (!all.some((x) => x.view === item || x.code === item)) throw new Error(`Unknown --only target: ${item}`);
const selected = all.filter((x) => !selection.length || selection.includes(x.view) || selection.includes(x.code));
if (!selected.length) throw new Error('Zero captures selected');
if (args.includes('--list')) {
  console.log(
    JSON.stringify(
      {
        requiredCount: all.length,
        selectedCount: selected.length,
        complete: selected.length === all.length,
        combinations: selected,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const git = (...command) => execFileSync('git', command, { cwd: ROOT, encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
const diff = execFileSync('git', ['diff', 'HEAD', '--', '.', ':!docs/design/evidence'], { cwd: ROOT });
const untracked = git('ls-files', '--others', '--exclude-standard')
  .split('\n')
  .filter((x) => x && !x.startsWith('docs/design/evidence/'));
const hasher = createHash('sha256').update(diff);
for (const path of untracked.sort()) hasher.update(path).update(readFileSync(join(ROOT, path)));
const workingTreeHash = hasher.digest('hex');
const stamp = new Date().toISOString().replaceAll(':', '-');
const OUT = resolve(ROOT, option('--output', `docs/design/evidence/owner-implementation-${sha.slice(0, 8)}-${stamp}`));
if (existsSync(join(OUT, 'manifest.json'))) throw new Error(`Evidence already exists: ${OUT}; choose a new --output`);
mkdirSync(OUT, { recursive: true });
const BASE = { web: option('--web', 'http://localhost:4173'), pwa: option('--pwa', 'http://localhost:4174') };
const ports = { web: 4173, pwa: 4174 };
const servers = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reachable = async (url) => {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(1500) })).ok;
  } catch {
    return false;
  }
};
const stop = () => {
  for (const server of servers) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill();
    }
  }
};
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(130);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(143);
});
const check = (truth, message) => {
  if (!truth) throw new Error(message);
};
const entryPath = (app) => (app === 'web' ? '/login?demo=owner' : '/a4/login');
const urlFor = (row) => {
  const url = new URL(
    row.view === 'entry' ? entryPath(row.app) : row.route.replace('[device]', 'CPB-001'),
    BASE[row.app],
  );
  url.searchParams.set('capture', '1');
  url.searchParams.set('state', row.state);
  url.searchParams.set('theme', row.theme);
  for (const [key, value] of Object.entries(row.query ?? {})) url.searchParams.set(key, value);
  return url.href;
};
const manifest = {
  task: 'OD-03',
  ac: ['AC-O13', 'AC-O16', 'AC-O18'],
  sourceSha: sha,
  workingTreeHash,
  registryHash: createHash('sha256')
    .update(readFileSync(join(ROOT, 'ssot/screens.yaml')))
    .digest('hex'),
  command: ['node', 'tools/capture/owner.mjs', ...args],
  createdAt: new Date().toISOString(),
  environment: {
    platform: process.platform,
    node: process.version,
    playwright: createRequire(import.meta.url)('playwright/package.json').version,
    locale: 'ko-KR',
    timezone: 'Asia/Seoul',
    dpr: 1,
  },
  requiredCount: all.length,
  expectedCount: selected.length,
  actualCount: 0,
  scope: selected.length === all.length ? 'full' : 'partial',
  maxWave: Math.max(...all.map((x) => x.wave)),
  status: 'running',
  visualReview: 'pending',
  shots: [],
};
const write = () => writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
write();
try {
  for (const app of ['web', 'pwa']) {
    if (args.includes('--reuse-server')) {
      check(await reachable(BASE[app]), `No caller-owned server at ${BASE[app]}`);
    } else {
      check(
        !(await reachable(BASE[app])),
        `Port occupied: ${BASE[app]}. Stop only your own server or use --reuse-server.`,
      );
      check(existsSync(join(ROOT, 'apps', app, 'build')), `Build missing: apps/${app}/build`);
      check(BASE[app] === `http://localhost:${ports[app]}`, '--web/--pwa custom hosts require --reuse-server');
      const server = spawn(
        'pnpm',
        ['--filter', `@boomeyes/${app}`, 'preview', '--port', String(ports[app]), '--strictPort'],
        { cwd: ROOT, stdio: 'ignore', detached: true },
      );
      servers.push(server);
      let ready = false;
      for (let i = 0; i < 100 && !ready; i++) {
        ready = await reachable(BASE[app]);
        if (!ready) await sleep(300);
      }
      check(ready, `Preview startup failed: ${app}`);
    }
  }
  browser = await chromium.launch();
  manifest.environment.chromium = browser.version();
  for (const row of selected) {
    const context = await browser.newContext({
      viewport: { width: row.width, height: row.height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      reducedMotion: 'reduce',
      isMobile: row.app === 'pwa',
      hasTouch: row.app === 'pwa',
    });
    const page = await context.newPage();
    const errors = [],
      consoleErrors = [],
      failedRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText }),
    );
    const result = {
      ...row,
      url: urlFor(row),
      file: `${row.key}.png`,
      ok: false,
      role: null,
      ownerId: null,
      dataset: null,
      pageErrors: errors,
      consoleErrors,
      failedRequests,
    };
    try {
      if (row.view !== 'entry') {
        await page.goto(new URL(entryPath(row.app), BASE[row.app]).href);
        await page.getByRole('button', { name: '데모 계정으로 로그인', exact: true }).click();
        await page.waitForURL((url) => url.pathname === (row.app === 'web' ? '/b1/dash' : '/a4/overview'));
        const user = await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'));
        check(
          user?.role === 'owner' && user?.ownerId === 'OWN-001' && user?.userId === 'owner01',
          'Actual owner CTA did not establish the required session',
        );
      }
      await page.goto(result.url, { waitUntil: 'domcontentloaded' });
      const host = page.locator(`[data-owner-view="${row.view}"]`);
      await host.waitFor({ state: 'visible' });
      await page.locator(`[data-scr="${row.code}"]`).first().waitFor({ state: 'visible' });
      check((await page.locator('[data-stub]').count()) === 0, 'Stub route is not an implemented screen');
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      const user = await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'));
      result.role = user?.role ?? 'anonymous';
      result.ownerId = user?.ownerId ?? null;
      result.dataset = await host.getAttribute('data-owner-dataset');
      result.renderedRole = await host.getAttribute('data-owner-role');
      result.clock = await host.getAttribute('data-owner-clock');
      check(row.view === 'entry' ? !user : user?.role === 'owner' && user?.ownerId === 'OWN-001', 'Session mismatch');
      check(row.view === 'entry' || result.renderedRole === 'owner', 'Rendered owner role is missing or wrong');
      check(row.view === 'entry' || result.dataset === 'owner', 'Owner dataset is missing or wrong');
      check((await page.locator('html').getAttribute('data-theme')) === row.theme, 'Theme mismatch');
      if (await page.locator('.be-map').count()) {
        const map = page.locator('.be-map');
        // 준비 표식은 카메라 이동마다 다시 세워진다 — 단계 속성까지 같이 기다린다(현황 nation/site/unit · 상세 unit)
        const mapLevel = row.level ?? (row.view === 'detail' ? 'unit' : null);
        await page
          .locator(mapLevel ? `[data-map-ready][data-map-level="${mapLevel}"]` : '[data-map-ready]')
          .waitFor({ timeout: 20_000 });
        result.map = await map.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return {
            width: box.width,
            height: box.height,
            markers: element.querySelectorAll('.be-marker').length,
            level: element.getAttribute('data-map-level'),
            mode: element.closest('[data-owner-stage]')?.getAttribute('data-owner-map-mode') ?? null,
          };
        });
        check(result.map.width >= 200 && result.map.height >= 200, 'Map has no usable visible area');
        // 상세 1 · 전국은 현장 13(넓은 지도) 또는 지역 7(좁은 지도) · 현장·호기 단계는 마포 호기 5
        const expectedMarkers =
          row.view === 'detail' ? 1 : row.level === 'nation' ? (result.map.mode === 'regions' ? 7 : 13) : 5;
        check(
          row.level !== 'nation' || ['sites', 'regions'].includes(result.map.mode),
          `Nation map mode must be sites or regions (got ${result.map.mode})`,
        );
        check(result.map.markers === expectedMarkers, `Map must show ${expectedMarkers} owned equipment marker(s)`);
        check((await page.locator('[data-map-error]').count()) === 0, 'Map tiles failed');
        await map.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
        result.map.targets = await map.locator('.be-marker').evaluateAll((markers) =>
          markers.map((marker) => {
            const box = marker.getBoundingClientRect();
            return {
              label: marker.textContent,
              width: box.width,
              height: box.height,
              reachable: [...marker.children].every((part) => {
                const b = part.getBoundingClientRect();
                if (b.width === 0 && b.height === 0) return true; // 렌더되지 않는 자식은 표적이 아니다
                return marker.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
              }),
            };
          }),
        );
        const targetSize = row.app === 'pwa' ? 48 : 44;
        check(
          result.map.targets.every(
            (target) => target.reachable && target.width >= targetSize && target.height >= targetSize,
          ),
          'Map targets overlap or are too small',
        );
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      if (row.level === 'unit') {
        // 호기 단계: 실시간 영상 타일이 있고 캡처에서는 자동 재생하지 않는다(포스터 프레임이 결정적)
        const tile = page.locator('[data-live-tile] video');
        await tile.waitFor({ state: 'visible' });
        check(
          await tile.evaluate((v) => v.paused && !!v.poster),
          'Live tile must stay paused on its poster in capture',
        );
        check(
          (await page.locator('[data-owner-view="overview"] [data-device="CPB-001"]').count()) > 0,
          'Unit panel missing',
        );
      }
      if (row.view === 'documents') {
        await page.locator('[data-document-viewer] img').first().waitFor({ state: 'visible' });
        await page.waitForFunction(() =>
          [...document.querySelectorAll('[data-document-viewer] img')].some((el) => el.complete && el.naturalWidth > 0),
        );
      }
      if (row.view === 'video')
        await page.waitForFunction(() => [...document.querySelectorAll('video')].some((el) => el.readyState >= 2));
      result.geometry = await page.evaluate(() => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        mainWidth: document.querySelector('main')?.clientWidth ?? null,
        mainScrollWidth: document.querySelector('main')?.scrollWidth ?? null,
      }));
      check(
        result.geometry.documentWidth <= row.width + 1,
        `Horizontal page overflow ${result.geometry.documentWidth} > ${row.width}`,
      );
      check(
        !result.geometry.mainWidth || result.geometry.mainScrollWidth <= result.geometry.mainWidth + 1,
        'Main content overflows horizontally',
      );
      check(
        errors.length === 0 && consoleErrors.length === 0,
        `Runtime errors: ${[...errors, ...consoleErrors].join(' | ')}`,
      );
      const unexpected = failedRequests.filter((r) => !r.error?.includes('ERR_ABORTED'));
      check(unexpected.length === 0, `Unexpected request failures: ${JSON.stringify(unexpected)}`);
      await page.screenshot({ path: join(OUT, result.file) });
      result.sha256 = createHash('sha256')
        .update(readFileSync(join(OUT, result.file)))
        .digest('hex');
      // 첫 화면 144조합과 별도로, 대표 PC/폰 라이트의 전체 내용을 남긴다(현황은 3단계 모두).
      // fullPage가 WebGL을 비우는 SOP를 피하기 위해 실제 viewport 높이를 늘린다.
      if (row.theme === 'light' && row.width === (row.app === 'web' ? 1280 : 390)) {
        result.fullFile = `${row.key}-full.png`;
        result.fullHeight = await page.evaluate(() => Math.max(innerHeight, document.documentElement.scrollHeight));
        await page.setViewportSize({ width: row.width, height: result.fullHeight });
        await page.waitForTimeout(250);
        await page.screenshot({ path: join(OUT, result.fullFile) });
        result.fullSha256 = createHash('sha256')
          .update(readFileSync(join(OUT, result.fullFile)))
          .digest('hex');
      }
      result.ok = true;
      result.status = 'automated-capture-pass';
      console.log(`ok ${row.key}`);
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      await page.screenshot({ path: join(OUT, `${row.key}-failure.png`) }).catch(() => {});
      console.log(`FAIL ${row.key}: ${error.message}`);
    } finally {
      manifest.shots.push(result);
      manifest.actualCount++;
      write();
      await context.close();
    }
  }
  const failed = manifest.shots.filter((x) => !x.ok).length;
  manifest.status = failed ? 'failed' : manifest.scope === 'partial' ? 'partial' : 'automated-capture-pass';
  manifest.exitCode = failed ? 1 : manifest.scope === 'partial' ? 2 : 0;
  console.log(
    `owner capture: ${manifest.actualCount}/${manifest.requiredCount} required · selected ${manifest.expectedCount} · failed ${failed} · visual review pending → ${OUT}`,
  );
  process.exitCode = manifest.exitCode;
} catch (error) {
  manifest.status = 'failed';
  manifest.error = error.message;
  manifest.exitCode = 1;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  manifest.finishedAt = new Date().toISOString();
  write();
  await browser?.close();
  stop();
}
