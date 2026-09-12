// Validate owner evidence without treating screenshots as human visual acceptance.
// node tools/owner/check.mjs --captures path/to/manifest.json [--e2e path/to/playwright.json]
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import { ownerViews } from './views.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const errors = [];
const requireThat = (ok, message) => {
  if (!ok) errors.push(message);
};
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const source = parse(readFileSync(join(ROOT, 'ssot/screens.yaml'), 'utf8'));
// 구현된 소유주 화면 목적만 증거 대상이다 — tools/owner/views.mjs가 원천에서 판정한다
const views = ownerViews(ROOT, source);
requireThat(!!value('--captures') || !!value('--e2e'), 'Pass --captures and/or --e2e evidence paths');
let captures = 0,
  tests = 0;
if (value('--captures')) {
  const path = resolve(ROOT, value('--captures'));
  const result = read(path);
  const sizes = {
    web: ['1280x842', '1024x842', '768x842', '390x800'],
    pwa: ['375x800', '390x800', '430x900', '768x1024'],
  };
  // 운영 현황은 드릴다운 3단계(전국 · 현장 · 호기)를 각각 캡처한다 — (목적 + 2단계) × 2앱 × 4폭 × 2테마
  const required = views.flatMap((v) =>
    (v.view === 'overview' ? ['', '-site', '-unit'] : ['']).flatMap((level) =>
      ['web', 'pwa'].flatMap((app) =>
        sizes[app].flatMap((size) => ['light', 'dark'].map((theme) => `${app}-${v.view}${level}-${size}-${theme}`)),
      ),
    ),
  );
  requireThat(
    result.scope === 'full' && result.status === 'automated-capture-pass' && result.exitCode === 0,
    'Capture result must be a full successful automated run',
  );
  // 조합 수는 구현된 화면 목적에서 파생한다 — 화면이 늘면 이 수도 함께 늘고, 수기 갱신이 필요 없다
  const total = required.length;
  requireThat(
    result.requiredCount === total && result.expectedCount === total && result.actualCount === total,
    `Expected/actual capture counts must all be ${total}`,
  );
  requireThat(
    result.registryHash ===
      createHash('sha256')
        .update(readFileSync(join(ROOT, 'ssot/screens.yaml')))
        .digest('hex'),
    'Capture registry differs from the current source',
  );
  requireThat(
    /^[a-f0-9]{40}$/.test(result.sourceSha ?? '') && /^[a-f0-9]{64}$/.test(result.workingTreeHash ?? ''),
    'Missing source SHA or working tree content hash',
  );
  const git = (...command) => execFileSync('git', command, { cwd: ROOT, encoding: 'utf8' }).trim();
  const currentSha = git('rev-parse', 'HEAD');
  const diff = execFileSync('git', ['diff', 'HEAD', '--', '.', ':!docs/design/evidence'], { cwd: ROOT });
  const untracked = git('ls-files', '--others', '--exclude-standard')
    .split('\n')
    .filter((file) => file && !file.startsWith('docs/design/evidence/'));
  const hasher = createHash('sha256').update(diff);
  for (const file of untracked.sort()) hasher.update(file).update(readFileSync(join(ROOT, file)));
  requireThat(result.sourceSha === currentSha, `Capture HEAD mismatch: ${result.sourceSha} != ${currentSha}`);
  requireThat(
    result.workingTreeHash === hasher.digest('hex'),
    'Capture working tree content differs from current tracked/untracked source',
  );
  const seen = new Set();
  for (const shot of result.shots ?? []) {
    captures++;
    requireThat(required.includes(shot.key) && !seen.has(shot.key), `Unexpected/duplicate capture ${shot.key}`);
    seen.add(shot.key);
    const view = views.find((v) => v.view === shot.view);
    requireThat(view?.[shot.app] === shot.code, `Wrong screen ID ${shot.key}`);
    requireThat(shot.ok === true && shot.status === 'automated-capture-pass', `Failed capture ${shot.key}`);
    requireThat(
      shot.view === 'entry'
        ? shot.role === 'anonymous' && !shot.ownerId
        : shot.role === 'owner' &&
            shot.renderedRole === 'owner' &&
            shot.ownerId === 'OWN-001' &&
            shot.dataset === 'owner',
      `Wrong role/dataset ${shot.key}`,
    );
    requireThat(
      Array.isArray(shot.pageErrors) &&
        shot.pageErrors.length === 0 &&
        Array.isArray(shot.consoleErrors) &&
        shot.consoleErrors.length === 0,
      `Runtime errors/missing report ${shot.key}`,
    );
    const image = resolve(dirname(path), shot.file ?? '');
    const present = existsSync(image) && !!shot.file;
    requireThat(present, `Missing PNG ${shot.key}`);
    if (present) {
      const png = readFileSync(image);
      requireThat(png.length >= 24 && png.subarray(1, 4).toString() === 'PNG', `Invalid PNG ${shot.key}`);
      if (png.length >= 24)
        requireThat(
          png.readUInt32BE(16) === shot.width && png.readUInt32BE(20) === shot.height,
          `Wrong capture dimensions ${shot.key}`,
        );
      requireThat(createHash('sha256').update(png).digest('hex') === shot.sha256, `PNG content mismatch ${shot.key}`);
    }
    if (shot.theme === 'light' && shot.width === (shot.app === 'web' ? 1280 : 390)) {
      const full = resolve(dirname(path), shot.fullFile ?? '');
      const present = !!shot.fullFile && existsSync(full);
      requireThat(present, `Missing full content capture ${shot.key}`);
      if (present) {
        const png = readFileSync(full);
        requireThat(
          png.length >= 24 &&
            png.readUInt32BE(16) === shot.width &&
            png.readUInt32BE(20) === shot.fullHeight &&
            shot.fullHeight >= shot.height,
          `Wrong full capture dimensions ${shot.key}`,
        );
        requireThat(
          createHash('sha256').update(png).digest('hex') === shot.fullSha256,
          `Full PNG content mismatch ${shot.key}`,
        );
      }
    }
  }
  for (const key of required) requireThat(seen.has(key), `Missing required capture ${key}`);
  requireThat(captures === total, `Capture manifest must contain exactly ${total} rows`);
}
if (value('--e2e')) {
  const report = read(value('--e2e'));
  const collect = (suite) => [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(collect)];
  const specs = (report.suites ?? []).flatMap(collect).filter((s) => /owner/.test(s.file ?? ''));
  requireThat(specs.length > 0, 'Zero owner tests in Playwright report');
  const applications = {
    web: { count: 0, coverage: new Set(), titles: new Set() },
    pwa: { count: 0, coverage: new Set(), titles: new Set() },
  };
  const discovered = JSON.parse(
    execFileSync('pnpm', ['exec', 'playwright', 'test', '--list', '--reporter=json'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }),
  );
  const expected = { web: new Set(), pwa: new Set() };
  for (const spec of (discovered.suites ?? []).flatMap(collect).filter((s) => /owner/.test(s.file ?? '')))
    for (const test of spec.tests ?? []) expected[test.projectName]?.add(spec.title);
  const required = (value('--require-ac') ?? '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16').split(',');
  for (const spec of specs) {
    for (const test of spec.tests ?? []) {
      tests++;
      const app = applications[test.projectName];
      requireThat(!!app, `Unknown owner test project: ${test.projectName}`);
      if (app) {
        app.count++;
        requireThat(!app.titles.has(spec.title), `Duplicate owner test in ${test.projectName}: ${spec.title}`);
        app.titles.add(spec.title);
        for (const match of spec.title.matchAll(/\[AC-O(\d{2})\]/g)) app.coverage.add(match[1]);
      }
      requireThat(
        test.expectedStatus === 'passed' &&
          test.status === 'expected' &&
          test.results?.length > 0 &&
          test.results.every((r) => r.status === 'passed'),
        `Failed/skipped/flaky owner test: ${spec.title}`,
      );
    }
  }
  requireThat(tests > 0, 'Zero executed owner tests');
  for (const [name, app] of Object.entries(applications)) {
    requireThat(app.count > 0, `Zero executed owner tests for ${name}`);
    requireThat(
      expected[name].size > 0 && app.count === expected[name].size,
      `${name} owner execution count ${app.count} differs from current discovery ${expected[name].size}`,
    );
    for (const title of expected[name])
      requireThat(app.titles.has(title), `${name} required owner test missing: ${title}`);
    for (const title of app.titles)
      requireThat(expected[name].has(title), `${name} obsolete/unregistered owner test: ${title}`);
    for (const ac of required) requireThat(app.coverage.has(ac), `No ${name} owner test mapped to AC-O${ac}`);
    console.log(`owner ${name}: executed ${app.count} · AC coverage ${[...app.coverage].sort().join(',')}`);
  }
  requireThat(applications.web.count === applications.pwa.count, 'WEB/PWA owner test counts differ');
  for (const title of applications.web.titles)
    requireThat(applications.pwa.titles.has(title), `PWA counterpart missing: ${title}`);
  for (const title of applications.pwa.titles)
    requireThat(applications.web.titles.has(title), `WEB counterpart missing: ${title}`);
  requireThat(
    !report.errors?.length && !report.stats?.unexpected && !report.stats?.skipped && !report.stats?.flaky,
    'Playwright report has errors, unexpected results, skipped tests or flakes',
  );
}
for (const error of errors) console.error(`FAIL ${error}`);
console.log(
  `owner evidence: captures ${captures} · executed owner tests ${tests} · errors ${errors.length} · visual/customer review remains separate`,
);
process.exit(errors.length ? 1 : 0);
