// Owner exception evidence. Uses existing preview servers only; never starts/stops servers.
// node tools/capture/owner-exceptions.mjs --output docs/design/evidence/<run>/exceptions
// --list does no browser work. --only <case,...> records partial evidence and exits 2.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium, expect as playwrightExpect } from '@playwright/test';
import { PNG } from 'pngjs';
import { parse } from 'yaml';
import { ownerViews } from '../owner/views.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const expect = playwrightExpect.configure({ timeout: 15_000 });
const args = process.argv.slice(2);
const option = (key, fallback) => {
  const index = args.indexOf(key);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${key} requires a value`);
  return args[index + 1];
};
if (args.includes('--help')) {
  console.log(
    'owner-exceptions: --output <directory> [--web http://localhost:4173] [--pwa http://localhost:4174] [--only <case,...>] [--list]. Existing servers only.',
  );
  process.exit(0);
}
const registry = parse(readFileSync(join(ROOT, 'ssot/screens.yaml'), 'utf8'));
const fixedClock = parse(readFileSync(join(ROOT, 'ssot/meta.yaml'), 'utf8')).fixed_clock;
// 구현된 화면만 — 계약·운전자는 아직 예외 시나리오가 없다(tools/owner/views.mjs가 판정)
const views = ownerViews(ROOT, registry);
const CASES = [
  { id: 'empty-fleet', view: 'fleet', state: 'empty', frames: ['empty'], ac: ['AC-O14'] },
  { id: 'read-retry', view: 'fleet', state: 'error', frames: ['failed', 'recovered'], ac: ['AC-O14'] },
  // 호기 화면은 현황의 호기 단계 하나다(2026-09-14) — 현장과 호기는 짝이어야 열린다
  {
    id: 'missing-unit',
    view: 'overview',
    state: 'boundaries',
    query: { site: 'SITE-MAPO', device: 'CPB-001' },
    frames: ['missing'],
    ac: ['AC-O05', 'AC-O14'],
  },
  {
    id: 'stale-unit',
    view: 'overview',
    query: { site: 'SITE-DAEJEON', device: 'CPB-004' },
    frames: ['stale'],
    ac: ['AC-O05'],
  },
  {
    id: 'detached-unit',
    view: 'overview',
    query: { site: 'SITE-YONGIN', device: 'CPB-005' },
    frames: ['detached'],
    ac: ['AC-O05'],
  },
  {
    id: 'multiple-alerts',
    view: 'alerts',
    state: 'boundaries',
    query: { device: 'CPB-002', alert: 'CPB-002-FAULT' },
    frames: ['multiple'],
    ac: ['AC-O06', 'AC-O07'],
  },
  {
    id: 'offline-unit',
    view: 'overview',
    query: { site: 'SITE-DAEJEON', device: 'CPB-004' },
    frames: ['offline'],
    ac: ['AC-O05', 'AC-O14'],
  },
  { id: 'pdf-preview', view: 'documents', query: { device: 'CPB-001' }, frames: ['dialog'], ac: ['AC-O10', 'AC-O11'] },
  {
    id: 'foreign-document',
    view: 'documents',
    query: { device: 'CPB-001', doc: 'CPB-101-CERT' },
    frames: ['denied'],
    ac: ['AC-O12'],
  },
  { id: 'foreign-camera', view: 'video', query: { camera: 'CPB-101-pour' }, frames: ['denied'], ac: ['AC-O12'] },
  {
    id: 'document-network',
    view: 'documents',
    query: { device: 'CPB-001', doc: 'CPB-001-CERT' },
    frames: ['failed', 'recovered'],
    ac: ['AC-O10', 'AC-O14'],
  },
  { id: 'video-network', view: 'video', frames: ['failed', 'recovered'], ac: ['AC-O09', 'AC-O14'] },
  // 전국은 타일 없는 국경 지도라 네트워크 장애가 나지 않는다 — 장애는 타일을 쓰는 현장 단계에서 본다
  {
    id: 'map-network',
    view: 'overview',
    query: { site: 'SITE-MAPO' },
    frames: ['failed', 'recovered'],
    ac: ['AC-O13', 'AC-O14'],
  },
  { id: 'overview-site', view: 'overview', query: { site: 'SITE-MAPO' }, frames: ['site'], ac: ['AC-O13'] },
  // 계약·운전자(P7·P8) — screens.yaml이 선언한 상태가 실제로 그려지는지 본다
  { id: 'empty-requests', view: 'requests', state: 'empty', frames: ['empty'], ac: ['AC-O14'] },
  {
    id: 'no-candidates',
    view: 'requests',
    query: { request: 'REQ-006' },
    frames: ['none'],
    ac: ['AC-O07', 'AC-O14'],
  },
  { id: 'driver-expiring', view: 'drivers', frames: ['expiring'], ac: ['AC-O07'] },
  { id: 'driver-docs-missing', view: 'driver-docs', frames: ['missing'], ac: ['AC-O07'] },
  {
    id: 'overview-unit',
    view: 'overview',
    query: { site: 'SITE-MAPO', device: 'CPB-001' },
    frames: ['unit'],
    ac: ['AC-O08', 'AC-O13'],
  },
];
const BASE = { web: option('--web', 'http://localhost:4173'), pwa: option('--pwa', 'http://localhost:4174') };
const SIZES = { web: { width: 1280, height: 842 }, pwa: { width: 390, height: 800 } };
const all = ['web', 'pwa'].flatMap((app) =>
  CASES.map((scenario) => {
    const source = views.find((view) => view.view === scenario.view);
    const screen = registry.screens.find((screen) => screen.id === source?.[app]);
    if (!screen || !screen.roles.includes('owner'))
      throw new Error(`Missing owner source screen: ${app}/${scenario.view}`);
    return {
      ...scenario,
      app,
      label: source.label,
      code: screen.id,
      route: screen.route,
      state: scenario.state ?? 'owner',
      key: `${app}-${scenario.id}`,
      ...SIZES[app],
    };
  }),
);
const requested = option('--only', '').split(',').filter(Boolean);
for (const id of requested) if (!CASES.some((scenario) => scenario.id === id)) throw new Error(`Unknown case: ${id}`);
const selected = all.filter((scenario) => !requested.length || requested.includes(scenario.id));
const requiredFrames = all.reduce((total, scenario) => total + scenario.frames.length, 0);
const expectedFrames = selected.reduce((total, scenario) => total + scenario.frames.length, 0);
// 지킬 값은 개수가 아니라 실체다 — all.length는 정의상 CASES.length × 앱 2개이므로
// 그 둘을 비교하면 동어반복이다(5차 리뷰 지적). 실제로 사고가 나는 지점만 단언한다:
//  ① 시나리오 id 중복 — 캡처 키(`${app}-${id}`)가 겹쳐 서로를 덮어쓴다
//  ② frames가 빈 시나리오 — 아무것도 찍지 않고 조용히 통과한다
//  ③ 프레임 이름 중복 — 같은 파일명을 두 번 써서 한 장이 사라진다
//  ④ 수용 기준 누락 — 시나리오를 지우면 그 AC의 예외 증거가 조용히 없어진다.
//     REQUIRED_AC는 개수가 아니라 의미 목록이므로, 시나리오를 지울 때 여기도 의식적으로 고쳐야 한다.
const REQUIRED_AC = [
  'AC-O05',
  'AC-O06',
  'AC-O07',
  'AC-O08',
  'AC-O09',
  'AC-O10',
  'AC-O11',
  'AC-O12',
  'AC-O13',
  'AC-O14',
];
const duplicated = [...new Set(CASES.map((c) => c.id))].length !== CASES.length;
const frameless = CASES.filter((c) => !c.frames?.length).map((c) => c.id);
const dupFrames = CASES.filter((c) => new Set(c.frames ?? []).size !== (c.frames ?? []).length).map((c) => c.id);
const covered = new Set(CASES.flatMap((c) => c.ac ?? []));
const uncovered = REQUIRED_AC.filter((ac) => !covered.has(ac));
if (
  duplicated ||
  frameless.length ||
  dupFrames.length ||
  uncovered.length ||
  !all.length ||
  new Set(all.map((x) => x.key)).size !== all.length
)
  throw new Error(
    `예외 시나리오 정의 오류 — id 중복 ${duplicated} · 프레임 없음 [${frameless.join(', ')}] · 프레임 중복 [${dupFrames.join(', ')}] · 증거 없는 수용 기준 [${uncovered.join(', ')}] · 실행 ${all.length}건`,
  );
if (!selected.length) throw new Error('선택된 시나리오가 없다');
if (args.includes('--list')) {
  console.log(
    JSON.stringify(
      {
        requiredCases: all.length,
        requiredFrames,
        selectedCases: selected.length,
        expectedFrames,
        complete: selected.length === all.length,
        scenarios: selected,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const fingerprint = () => {
  const git = (...command) => execFileSync('git', command, { cwd: ROOT, encoding: 'utf8' }).trim();
  const diff = execFileSync('git', ['diff', 'HEAD', '--', '.', ':!docs/design/evidence'], { cwd: ROOT });
  const digest = createHash('sha256').update(diff);
  for (const name of git('ls-files', '--others', '--exclude-standard')
    .split('\n')
    .filter((name) => name && !name.startsWith('docs/design/evidence/'))
    .sort())
    digest.update(name).update(readFileSync(join(ROOT, name)));
  return {
    sourceSha: git('rev-parse', 'HEAD'),
    workingTreeHash: digest.digest('hex'),
    registryHash: sha256(join(ROOT, 'ssot/screens.yaml')),
  };
};
const initialSource = fingerprint();
const stamp = new Date().toISOString().replaceAll(':', '-');
const OUT = resolve(
  ROOT,
  option('--output', `docs/design/evidence/owner-exceptions-${initialSource.sourceSha.slice(0, 8)}-${stamp}`),
);
if (existsSync(OUT)) throw new Error(`Output already exists: ${OUT}`);
if (OUT.startsWith(`${ROOT}/`) && !OUT.startsWith(`${ROOT}/docs/design/evidence/`))
  throw new Error('In-checkout evidence must be under docs/design/evidence to preserve the source fingerprint');
mkdirSync(OUT, { recursive: true });
const manifest = {
  task: 'OD-13',
  ...initialSource,
  command: ['node', 'tools/capture/owner-exceptions.mjs', ...args],
  createdAt: new Date().toISOString(),
  scope: selected.length === all.length ? 'full' : 'partial',
  requiredCases: all.length,
  expectedCases: selected.length,
  actualCases: 0,
  requiredCount: requiredFrames,
  expectedCount: expectedFrames,
  actualCount: 0,
  theme: 'light',
  status: 'running',
  visualReview: 'pending',
  customerReview: 'not-performed',
  environment: {
    node: process.version,
    platform: process.platform,
    playwright: createRequire(import.meta.url)('playwright/package.json').version,
    locale: 'ko-KR',
    timezone: 'Asia/Seoul',
    dpr: 1,
    serviceWorkers: 'block',
  },
  cases: [],
  shots: [],
};
const write = () => writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const htmlEscape = (text) => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const pictureReady = async (image) => {
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 700 && node.naturalHeight > 1000))
    .toBe(true);
};
const videoReady = async (page) => {
  const player = page.locator('[data-owner-view="video"] video');
  await expect(player).toBeVisible();
  await expect.poll(() => player.evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
  // Capture mode starts paused; an actual user control must start this clip.
  if (await player.evaluate((video) => video.paused))
    await page.getByRole('button', { name: '재생', exact: true }).click();
  await expect.poll(() => player.evaluate((video) => video.currentTime)).toBeGreaterThan(0.2);
  check(
    Math.abs((await player.evaluate((video) => video.duration)) - 6) < 0.1,
    'Expected the actual six-second sample',
  );
  await page.getByRole('button', { name: '일시정지', exact: true }).click();
  return player;
};
let browser;
write();
try {
  for (const app of ['web', 'pwa']) {
    check(
      (await fetch(BASE[app], { signal: AbortSignal.timeout(2500) })).ok,
      `Caller-owned preview is unavailable: ${BASE[app]}`,
    );
  }
  browser = await chromium.launch();
  manifest.environment.chromium = browser.version();
  for (const scenario of selected) {
    const context = await browser.newContext({
      viewport: SIZES[scenario.app],
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      colorScheme: 'light',
      reducedMotion: 'reduce',
      isMobile: scenario.app === 'pwa',
      hasTouch: scenario.app === 'pwa',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    const pageErrors = [],
      consoleErrors = [],
      failedRequests = [],
      responses = [],
      injected = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() });
    });
    page.on('requestfailed', (request) =>
      failedRequests.push({ url: request.url(), error: request.failure()?.errorText }),
    );
    page.on('response', (response) => responses.push({ url: response.url(), status: response.status() }));
    const result = {
      key: scenario.key,
      app: scenario.app,
      scenario: scenario.id,
      ac: scenario.ac,
      code: scenario.code,
      state: scenario.state,
      frames: [],
      pageErrors,
      consoleErrors,
      failedRequests,
      injectedRequests: injected,
      status: 'running',
    };
    const host = page.locator(`[data-owner-view="${scenario.view}"]`);
    let outagePattern;
    if (scenario.id === 'document-network') outagePattern = /\/cpb-001-certificate[^/]*\.png(?:\?|$)/;
    if (scenario.id === 'video-network') outagePattern = /\.mp4(?:\?|$)/;
    if (scenario.id === 'map-network') outagePattern = /\/gl\/positron-gl-style\/style\.json(?:\?|$)/;
    const outage = async (route) => {
      injected.push({ url: route.request().url(), status: 503, at: new Date().toISOString() });
      await route.fulfill({
        status: 503,
        contentType: 'text/plain',
        headers: { 'cache-control': 'no-store' },
        body: 'Intentional owner exception capture outage',
      });
    };
    if (outagePattern) await page.route(outagePattern, outage);
    const classified = () => {
      const intentional = (url) => injected.some((record) => record.url === url);
      const expectedConsole = (record) =>
        intentional(record.location.url) ||
        injected.some((entry) => record.text.includes(entry.url)) ||
        (scenario.id === 'offline-unit' && record.text.includes('ERR_INTERNET_DISCONNECTED'));
      return {
        expectedConsoleErrors: consoleErrors.filter(expectedConsole),
        unexpectedConsoleErrors: consoleErrors.filter(
          (record) => !expectedConsole(record) && !record.text.includes('ERR_ABORTED'),
        ),
        expectedRequestFailures: failedRequests.filter(
          (record) =>
            intentional(record.url) ||
            record.error?.includes('ERR_ABORTED') ||
            (scenario.id === 'offline-unit' && record.error?.includes('ERR_INTERNET_DISCONNECTED')),
        ),
        unexpectedRequestFailures: failedRequests.filter(
          (record) =>
            !intentional(record.url) &&
            !record.error?.includes('ERR_ABORTED') &&
            !(scenario.id === 'offline-unit' && record.error?.includes('ERR_INTERNET_DISCONNECTED')),
        ),
      };
    };
    const capture = async (phase, { focus, full = false, media } = {}) => {
      check(scenario.frames.includes(phase), `Undeclared evidence frame: ${phase}`);
      await expect(host).toBeVisible();
      await expect(page.locator(`[data-scr="${scenario.code}"]`).first()).toBeVisible();
      check((await page.locator('[data-stub]').count()) === 0, 'Stub screen is not evidence');
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      if (focus) await focus.scrollIntoViewIfNeeded();
      const user = await page.evaluate(() => JSON.parse(localStorage.getItem('boomeyes.session') ?? 'null'));
      check(
        user?.role === 'owner' && user?.ownerId === 'OWN-001' && user?.userId === 'owner01',
        'Expected actual owner CTA session',
      );
      const dataset = await host.getAttribute('data-owner-dataset');
      const clock = await host.getAttribute('data-owner-clock');
      const readingError = scenario.id === 'read-retry' && phase === 'failed';
      check(
        readingError
          ? dataset === null
          : dataset === (['empty', 'boundaries'].includes(scenario.state) ? scenario.state : 'owner'),
        'Unexpected exception dataset',
      );
      check(readingError ? clock === null : clock === fixedClock, 'Unexpected exception clock');
      const geometry = await page.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        mainWidth: document.querySelector('main')?.clientWidth,
        mainScrollWidth: document.querySelector('main')?.scrollWidth,
        scrollY,
      }));
      check(
        geometry.pageWidth <= geometry.width + 1 &&
          (!geometry.mainWidth || geometry.mainScrollWidth <= geometry.mainWidth + 1),
        'Horizontal overflow in exception state',
      );
      const diagnostics = classified();
      check(pageErrors.length === 0, `Unexpected page errors: ${pageErrors.join(' | ')}`);
      check(
        diagnostics.unexpectedConsoleErrors.length === 0 && diagnostics.unexpectedRequestFailures.length === 0,
        `Unexpected runtime/network errors: ${JSON.stringify(diagnostics)}`,
      );
      const file = `${scenario.key}-${phase}.png`;
      await page.screenshot({ path: join(OUT, file) });
      const shot = {
        key: `${scenario.key}-${phase}`,
        scenario: scenario.id,
        phase,
        view: scenario.view,
        app: scenario.app,
        code: scenario.code,
        ac: scenario.ac,
        state: scenario.state,
        theme: 'light',
        role: user.role,
        ownerId: user.ownerId,
        dataset,
        clock,
        url: page.url(),
        file,
        sha256: sha256(join(OUT, file)),
        geometry,
        media,
        diagnostics,
        ok: true,
        status: 'automated-capture-pass',
      };
      if (full) {
        const height = await page.evaluate(() =>
          Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        );
        if (height > scenario.height && height <= 6400) {
          await page.setViewportSize({ width: scenario.width, height });
          await page.evaluate(() => scrollTo(0, 0));
          await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
          shot.fullFile = `${scenario.key}-${phase}-full.png`;
          shot.fullViewport = { width: scenario.width, height };
          await page.screenshot({ path: join(OUT, shot.fullFile) });
          shot.fullSha256 = sha256(join(OUT, shot.fullFile));
          await page.setViewportSize(SIZES[scenario.app]);
        }
      }
      manifest.shots.push(shot);
      result.frames.push(phase);
      manifest.actualCount++;
      write();
      console.log(`ok ${shot.key}`);
    };
    try {
      const entry = views.find((view) => view.view === 'entry');
      const entryScreen = registry.screens.find((screen) => screen.id === entry[scenario.app]);
      const entryUrl = new URL(entryScreen.route, BASE[scenario.app]);
      if (scenario.app === 'web') entryUrl.searchParams.set('demo', 'owner');
      await page.goto(entryUrl.href, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: '데모 계정으로 로그인', exact: true }).click();
      await expect(page.locator('[data-owner-view="overview"]')).toBeVisible();
      const target = new URL(scenario.route.replace('[device]', scenario.device ?? 'CPB-001'), BASE[scenario.app]);
      for (const [key, value] of Object.entries({
        capture: '1',
        state: scenario.state,
        theme: 'light',
        ...scenario.query,
      }))
        target.searchParams.set(key, value);
      await page.goto(target.href, { waitUntil: 'domcontentloaded' });
      await expect(host).toBeVisible();
      if (scenario.id === 'empty-fleet') {
        await expect(host).toContainText('등록된 보유 장비가 없습니다');
        await expect(host.locator('[data-device]')).toHaveCount(0);
        await capture('empty');
      } else if (scenario.id === 'read-retry') {
        await expect(host.getByRole('alert')).toBeVisible();
        await expect(host.locator('[data-device]')).toHaveCount(0);
        await capture('failed');
        await host.getByRole('button', { name: '다시 시도', exact: true }).click();
        await expect(host.locator('[data-device]')).toHaveCount(120);
        await capture('recovered', { full: true });
      } else if (scenario.id === 'missing-unit') {
        for (const text of ['미연동', '계약 정보 미등록', '배치 미확인']) await expect(host).toContainText(text);
        // 값이 없을 때 0으로 보이지 말 것 — 「380 V」의 끝자리에 걸리지 않게 경계를 준다
        await expect(host).not.toContainText(/\b0 V/);
        await capture('missing', { focus: host.getByRole('region', { name: '장비 상태', exact: true }), full: true });
      } else if (scenario.id === 'stale-unit' || scenario.id === 'detached-unit' || scenario.id === 'offline-unit') {
        const status = host.getByRole('region', { name: '장비 상태', exact: true });
        if (scenario.id === 'detached-unit') {
          await expect(status).toContainText('단말기 미장착');
          await expect(status).toContainText('수신 기록 없음');
          await expect(status).not.toContainText(/\b0 V/);
          await capture('detached', { focus: status, full: true });
        } else {
          for (const text of ['수신 지연', '마지막 수신값', '380']) await expect(status).toContainText(text);
          await expect(status).toContainText(/마지막 수신.*0?8:22/);
          if (scenario.id === 'offline-unit') {
            // 오프라인 전후가 같은지는 같은 방식으로 읽어 견준다(KeyValueList의 dt/dd 줄바꿈)
            const read = () => status.innerText();
            const before = await read();
            await context.setOffline(true);
            await expect(
              page.getByRole('status').filter({ hasText: '오프라인 · 마지막으로 불러온 화면입니다.' }),
            ).toBeVisible();
            await expect.poll(read).toBe(before);
            await capture('offline', { focus: status, full: true });
            await context.setOffline(false);
          } else await capture('stale', { focus: status, full: true });
        }
      } else if (scenario.id === 'multiple-alerts') {
        // 한 호기가 여러 알림을 가질 수 있다 — 종류가 늘어도 「장비 한 대」라는 사실은 그대로다
        const rows = host.locator('button[data-alert]');
        check((await rows.count()) > 1, 'A device with several alerts must list more than one');
        await expect(host.locator('[data-alert="CPB-002-FAULT"]')).toBeVisible();
        await expect(host.locator('[data-alert="CPB-002-INSP-DUE"]')).toBeVisible();
        for (const row of await rows.all()) await expect(row).toContainText('2호기');
        await expect(host.getByRole('region', { name: '선택한 알림 상세', exact: true })).toContainText('이현장');
        await capture('multiple', { full: true });
      } else if (scenario.id === 'pdf-preview') {
        await page
          .getByLabel('시연 파일 선택', { exact: true })
          .setInputFiles(join(ROOT, 'packages/mock/src/assets/owner/cpb-001-certificate.pdf'));
        const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
        await expect(dialog).toBeVisible();
        await pictureReady(dialog.getByRole('img'));
        await expect(dialog.getByRole('button', { name: '첨부 확정', exact: true })).toBeEnabled();
        await capture('dialog');
        await dialog.getByRole('button', { name: '취소', exact: true }).click();
      } else if (scenario.id === 'foreign-document' || scenario.id === 'foreign-camera') {
        await expect(host.getByRole('alert')).toContainText(
          scenario.id === 'foreign-document'
            ? '선택한 장비의 서류를 찾을 수 없습니다.'
            : '이 장비의 영상에 접근할 수 없습니다.',
        );
        await expect(host.locator('[data-document-viewer], [data-camera], video')).toHaveCount(0);
        for (const text of ['두번째건설', '타사 담당자', '다른 회사 전용 현장'])
          await expect(host).not.toContainText(text);
        await capture('denied', { full: true });
      } else if (scenario.id === 'overview-site') {
        const map = host.locator('.be-map');
        await expect(map).toHaveAttribute('data-map-level', 'site');
        await expect(map).toHaveAttribute('data-map-ready', '');
        await expect(map.locator('.be-marker')).toHaveCount(5);
        await expect(host.getByRole('list', { name: '현장 호기', exact: true }).locator('[data-device]')).toHaveCount(
          5,
        );
        await expect(host.getByRole('heading', { name: '마포 주상복합 신축', exact: true })).toBeVisible();
        await capture('site', { full: true });
      } else if (scenario.id === 'overview-unit') {
        // 호기 단계에는 지도가 없다 — 그 자리를 카메라 벽이 대신한다(시안 «확정 2026-09-12»)
        await expect(host.locator('.be-map')).toHaveCount(0);
        const wall = host.locator('[data-owner-cameras="CPB-001"]');
        await expect(wall).toBeVisible();
        const tile = wall.locator('[data-live-tile] video').first();
        await expect(tile).toBeAttached();
        const tiles = await wall.locator('[data-live-tile] video').count();
        check(tiles > 1, `Camera wall must hold more than one tile (got ${tiles})`);
        check(
          await wall.locator('[data-live-tile] video').evaluateAll((list) => list.every((v) => v.paused)),
          'Camera wall must not autoplay in capture mode',
        );
        for (const text of ['1호기', '김현장', '380 V', '고장코드', '1호기 제작증'])
          await expect(host).toContainText(text);
        await capture('unit', {
          focus: wall,
          full: true,
          media: await tile.evaluate((video) => ({ readyState: video.readyState, paused: video.paused })),
        });
      } else if (scenario.id === 'empty-requests') {
        await expect(host).toContainText('대기 중인 요청이 없습니다');
        await expect(host.locator('[data-request]')).toHaveCount(0);
        await capture('empty');
      } else if (scenario.id === 'no-candidates') {
        // 보유 기종이 32m뿐이라 40m 사양은 후보가 0이다 — 「낼 수 있는 호기 없음」이 자료에서 나온다
        await expect(host).toContainText('이 기간에 낼 수 있는 호기가 없습니다');
        await expect(host.locator('[data-candidate]')).toHaveCount(0);
        await expect(host.getByRole('button', { name: '배정 확정 · 회신', exact: true })).toBeDisabled();
        await capture('none', { full: true });
      } else if (scenario.id === 'driver-expiring') {
        // 자격 만료 임박은 명단에서 바로 읽힌다
        await expect(host.locator('[data-driver]')).toHaveCount(6);
        await expect(host.locator('[data-driver="DRV-004"]')).toContainText(/D-\d+/);
        await capture('expiring', { full: true });
      } else if (scenario.id === 'driver-docs-missing') {
        // 없는 서류는 빈칸이 아니라 「미비」다
        await expect(host.locator('[data-doc-state="missing"]')).toHaveCount(1);
        await expect(host.locator('[data-doc-state="expiring"]')).toHaveCount(2);
        await capture('missing', { full: true });
      } else if (scenario.id === 'document-network') {
        const viewer = host.locator('[data-document-viewer]');
        await expect(viewer.getByRole('alert')).toContainText('원문을 불러오지 못했습니다.');
        check(injected.length > 0, 'Document outage was not injected');
        await capture('failed', { focus: viewer, full: true });
        await page.unroute(outagePattern, outage);
        await viewer.getByRole('button', { name: '다시 불러오기', exact: true }).click();
        await pictureReady(viewer.getByRole('img'));
        await expect(viewer).toHaveAttribute('data-doc', 'CPB-001-CERT');
        await capture('recovered', { focus: viewer, full: true });
      } else if (scenario.id === 'video-network') {
        await expect(host.getByRole('alert')).toContainText('영상을 불러오지 못했습니다');
        check(injected.length > 0, 'Video outage was not injected');
        await capture('failed');
        await page.unroute(outagePattern, outage);
        const player = await (async () => {
          await host.getByRole('button', { name: '영상 다시 불러오기', exact: true }).click();
          return videoReady(page);
        })();
        await capture('recovered', {
          focus: player,
          full: true,
          media: await player.evaluate((video) => ({
            duration: video.duration,
            currentTime: video.currentTime,
            readyState: video.readyState,
            paused: video.paused,
          })),
        });
      } else if (scenario.id === 'map-network') {
        const map = host.locator('.be-map');
        await expect(host.locator('[data-map-error]')).toContainText('지도를 불러오지 못했습니다');
        check(injected.length > 0, 'Map outage was not injected');
        check((await map.boundingBox())?.height > 200, 'Map must occupy more than 200 pixels in the exception view');
        // 지도가 없어도 현장 호기 목록은 그대로 — 위치 정보는 목록에서 확인할 수 있다
        await expect(host.getByRole('list', { name: '현장 호기', exact: true }).locator('[data-device]')).toHaveCount(
          5,
        );
        await capture('failed', { focus: host.locator('[data-map-error]'), full: true });
        // 같은 장애에서 전국으로 올라가면 지도가 그려진다 — 국경은 저장소 안 자료라 네트워크가 필요 없다
        await host
          .getByRole('navigation', { name: '현황 경로', exact: true })
          .getByRole('link', { name: '전국' })
          .click();
        await expect(host.locator('[data-map-error]')).toHaveCount(0);
        await expect(map).toHaveAttribute('data-map-level', 'nation');
        await expect(map.locator('.be-marker')).toHaveCount(
          Number(await host.locator('[data-owner-sites]').getAttribute('data-owner-sites')),
        );
        await page.unroute(outagePattern, outage);
        // 카드는 확인이 필요한 현장부터 보인다 — 정상인 마포에 닿으려면 전체를 펼친다
        const allSites = host.getByRole('button', { name: /^전체 \d+개 현장$/ });
        if (await allSites.count()) await allSites.first().click();
        await host.getByRole('list', { name: '현장 목록', exact: true }).locator('[data-site="SITE-MAPO"]').click();
        await expect(host.locator('[data-map-error]')).toHaveCount(0);
        await expect(map.locator('.be-marker')).toHaveCount(5);
        await expect(map).toHaveAttribute('data-map-ready', '');
        await expect(map).toHaveAttribute('data-map-level', 'site');
        await expect
          .poll(
            () =>
              responses.filter((response) => response.status === 200 && /\.(pbf|mvt)(?:\?|$)/.test(response.url))
                .length,
          )
          .toBeGreaterThan(0);
        await map.scrollIntoViewIfNeeded();
        const mapFile = `${scenario.key}-tiles.png`;
        await map.screenshot({ path: join(OUT, mapFile) });
        const pixels = PNG.sync.read(readFileSync(join(OUT, mapFile)));
        let sum = 0,
          squares = 0,
          count = 0;
        for (let index = 0; index < pixels.data.length; index += 4) {
          const value = (pixels.data[index] + pixels.data[index + 1] + pixels.data[index + 2]) / 3;
          sum += value;
          squares += value * value;
          count++;
        }
        const deviation = Math.sqrt(squares / count - (sum / count) ** 2);
        check(deviation > 14, `Map pixels may be blank (standard deviation ${deviation})`);
        const media = {
          markerCount: 5,
          mapHeight: (await map.boundingBox()).height,
          mapFile,
          mapSha256: sha256(join(OUT, mapFile)),
          pixelStandardDeviation: deviation,
          successfulTileRequests: responses.filter(
            (response) => response.status === 200 && /\.(pbf|mvt)(?:\?|$)/.test(response.url),
          ).length,
        };
        await capture('recovered', { focus: map, full: true, media });
      }
      check(
        result.frames.length === scenario.frames.length && new Set(result.frames).size === scenario.frames.length,
        'Exception capture frames are incomplete',
      );
      result.status = 'automated-capture-pass';
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      result.failureFile = `${scenario.key}-diagnostic.png`;
      await page.screenshot({ path: join(OUT, result.failureFile) }).catch(() => {});
      if (existsSync(join(OUT, result.failureFile))) result.failureSha256 = sha256(join(OUT, result.failureFile));
      console.log(`FAIL ${scenario.key}: ${error.message}`);
    } finally {
      await context.close();
      Object.assign(result, classified());
      if (
        result.status === 'automated-capture-pass' &&
        (pageErrors.length || result.unexpectedConsoleErrors.length || result.unexpectedRequestFailures.length)
      ) {
        result.status = 'failed';
        result.error = 'Unexpected error arrived after the last capture frame';
      }
      manifest.cases.push(result);
      manifest.actualCases++;
      write();
    }
  }
  const finalSource = fingerprint();
  check(
    Object.keys(initialSource).every((key) => finalSource[key] === initialSource[key]),
    'Source changed during exception capture',
  );
  const failed = manifest.cases.filter((scenario) => scenario.status !== 'automated-capture-pass').length;
  const missing = manifest.actualCount !== expectedFrames || manifest.actualCases !== selected.length;
  manifest.status = failed || missing ? 'failed' : manifest.scope === 'partial' ? 'partial' : 'automated-capture-pass';
  manifest.exitCode = failed || missing ? 1 : manifest.scope === 'partial' ? 2 : 0;
  console.log(
    `owner exceptions: ${manifest.actualCases}/${all.length} cases, ${manifest.actualCount}/${requiredFrames} frames, failed ${failed}; visual review pending → ${OUT}`,
  );
} catch (error) {
  manifest.status = 'failed';
  manifest.error = error.message;
  manifest.exitCode = 1;
  console.error(error.message);
} finally {
  manifest.finishedAt = new Date().toISOString();
  write();
  const rows = manifest.shots
    .map(
      (shot) =>
        `<article><h2>${htmlEscape(shot.key)}</h2><p>${htmlEscape(shot.code)} · ${htmlEscape(shot.state)} · ${htmlEscape(shot.role)} · ${htmlEscape(shot.clock)}</p><a href="${shot.file}"><img src="${shot.file}" alt="${htmlEscape(shot.key)}"></a>${shot.fullFile ? `<p><a href="${shot.fullFile}">전체 높이 캡처</a></p>` : ''}</article>`,
    )
    .join('');
  writeFileSync(
    join(OUT, 'index.html'),
    `<!doctype html><html lang="ko"><meta charset="utf-8"><title>소유주 예외 화면 검토</title><style>body{font:16px system-ui;background:#eee;padding:24px}article{background:white;padding:24px;margin:24px 0}img{max-width:100%;height:auto}h2,p{overflow-wrap:anywhere}</style><h1>소유주 예외 화면 · ${manifest.actualCount}/${requiredFrames}</h1><p>${htmlEscape(manifest.status)} · 시각 검토 대기 · 실제 고객 확인 미실시</p>${rows}</html>`,
  );
  await browser?.close();
  process.exitCode = manifest.exitCode ?? 1;
}
