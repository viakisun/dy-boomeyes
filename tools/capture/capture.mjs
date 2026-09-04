// capture.mjs — ssot 화면 레지스트리 기반 캡처 (QA §3). 빌드된 앱을 vite preview로 띄우고 라우트×상태 전수 촬영.
//   node tools/capture/capture.mjs [--wave N] [--only B1-02,B0-01] [--web http://...] [--pwa http://...] [--no-serve]
// 출력 shots/<code-lower>-<state>.png · 시각 고정(meta.fixed_clock) · Math.random 고정 · 애니메이션 off
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ssot = JSON.parse(readFileSync(join(ROOT, 'packages/domain/src/generated/ssot.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const WAVE = Number(opt('--wave', ssot.meta.current_wave));
const ONLY = opt('--only', '') ? opt('--only').split(',') : null;
const PORTS = { web: 4173, pwa: 4174 };
const BASE = { web: opt('--web', `http://localhost:${PORTS.web}`), pwa: opt('--pwa', `http://localhost:${PORTS.pwa}`) };
const OUT = join(ROOT, 'shots');
mkdirSync(OUT, { recursive: true });
const PARAMS = {
  '[case]': 'C-105',
  '[device]': 'CPB-003',
  '[site]': 'SITE-001',
  '[camera]': 'CAM-3-2',
  '[event]': 'EV-001',
};
const surfaces = Object.fromEntries(ssot.screens.surfaces.map((s) => [s.id, s.app]));
const screens = ssot.screens.screens.filter((s) => s.wave <= WAVE && (!ONLY || ONLY.includes(s.id)));

async function waitHttp(url, ms = 30_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`서버 응답 없음 ${url}`);
}
const servers = [];
if (!args.includes('--no-serve'))
  for (const app of ['web', 'pwa']) {
    if (!existsSync(join(ROOT, 'apps', app, 'build'))) throw new Error(`apps/${app}/build 없음 — 먼저 pnpm build`);
    servers.push(
      spawn('pnpm', ['--filter', `@boomeyes/${app}`, 'preview', '--port', String(PORTS[app]), '--strictPort'], {
        cwd: ROOT,
        stdio: 'ignore',
      }),
    );
    await waitHttp(BASE[app]);
  }
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2, locale: 'ko-KR', reducedMotion: 'reduce' });
await ctx.addInitScript((iso) => {
  const fixed = new Date(iso).getTime();
  const D = Date;
  const P = new Proxy(D, {
    construct(t, a) {
      return a.length ? new D(...a) : new D(fixed);
    },
    get(t, k) {
      return k === 'now' ? () => fixed : Reflect.get(t, k);
    },
  });
  globalThis.Date = P;
  Math.random = () => 0.42;
}, ssot.meta.fixed_clock);
let n = 0,
  fail = 0;
for (const s of screens) {
  const app = surfaces[s.surface];
  const phone = app === 'pwa';
  for (const st of s.states) {
    const route = s.route.replace(/\[[a-z]+\]/g, (m) => PARAMS[m] ?? 'X');
    const url = `${BASE[app]}${route}${route.includes('?') ? '&' : '?'}state=${st.id}&capture=1`;
    const name = `${s.id.toLowerCase()}-${st.id}`;
    const page = await ctx.newPage();
    await page.setViewportSize(phone ? { width: 440, height: 900 } : { width: 1280, height: 842 });
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector(`[data-scr="${s.id}"]`, { timeout: 10_000 });
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
      if (await page.$('.be-map')) await page.waitForSelector('[data-map-ready]', { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(300);
      const dialog = await page.$('dialog[open][data-capture-dialog], [data-capture-dialog]:not(dialog)');
      const frame = await page.$('[data-capture-frame]');
      const target = dialog ?? (phone ? frame : null);
      if (target) await target.screenshot({ path: join(OUT, `${name}.png`) });
      else await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: !phone });
      n++;
      console.log('ok', name);
    } catch (e) {
      fail++;
      console.log('FAIL', name, String(e.message).split('\n')[0]);
    }
    await page.close();
  }
}
await browser.close();
for (const p of servers) p.kill();
console.log(`${fail ? '✗' : '✓'} capture: ${n} shots · fail ${fail} → shots/`);
process.exit(fail ? 1 : 0);
