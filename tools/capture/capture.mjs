// capture.mjs — ssot 화면 레지스트리 기반 캡처 (QA §3). 빌드된 앱을 vite preview로 띄우고 라우트×상태 전수 촬영.
//   node tools/capture/capture.mjs [--wave N] [--only B1-02,B0-01] [--dark] [--web http://...] [--pwa http://...] [--no-serve]
// 출력 shots/<code-lower>-<state>.png · 시각 고정은 앱 DemoClock(?capture=1) · 애니메이션 off
// --dark: 화면 기본 상태를 ?theme=dark(루트 data-theme)로 한 번 더 찍는다 → <code-lower>-<state>-dark.png (shell-auth AC-6)
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
const DARK = args.includes('--dark');
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
// 상태 픽스처가 다른 개체를 다루면 여기서 파라미터를 바꾼다 (docnew = C-106 서류 검토 업무)
const STATE_PARAMS = { 'A1-03:docnew': { '[case]': 'C-106' } };
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
process.on('exit', () => {
  for (const p of servers) p.kill();
});
const browser = await chromium.launch();
const ctx = await browser.newContext({
  deviceScaleFactor: 2,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  reducedMotion: 'reduce',
});
// 시각·난수 고정은 앱의 DemoClock(?capture=1)이 담당한다 — 브라우저 Date 프록시는 MapLibre 로드를 막는다
let n = 0,
  fail = 0;
for (const s of screens) {
  const app = surfaces[s.surface];
  const phone = app === 'pwa';
  for (const st of s.states) {
    const route = s.route.replace(/\[[a-z]+\]/g, (m) => STATE_PARAMS[`${s.id}:${st.id}`]?.[m] ?? PARAMS[m] ?? 'X');
    const base = `${BASE[app]}${route}${route.includes('?') ? '&' : '?'}state=${st.id}&capture=1`;
    const name0 = `${s.id.toLowerCase()}-${st.id}`;
    const variants = [{ url: base, name: name0 }];
    if (DARK && st.id === s.default) variants.push({ url: `${base}&theme=dark`, name: `${name0}-dark` });
    for (const { url, name } of variants) {
      const page = await ctx.newPage();
      await page.setViewportSize(phone ? { width: 440, height: 900 } : { width: 1280, height: 842 });
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector(`[data-scr="${s.id}"]`, { timeout: 10_000 });
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
        if (await page.$('.be-map')) await page.waitForSelector('[data-map-ready]', { timeout: 20_000 }); // 타임아웃 = FAIL (빈 지도를 녹색으로 세지 않는다)
        await page.waitForTimeout(300);
        const dialog = await page.$('dialog[open][data-capture-dialog], [data-capture-dialog]:not(dialog)');
        const frame = await page.$('[data-capture-frame]');
        const target = dialog ?? (phone ? frame : null);
        if (phone && frame && !dialog) {
          // 긴 앱 화면: sticky 하단 내비가 뷰포트 바닥(문서 중간)에 찍히지 않도록 뷰포트를 문서 높이로
          const h = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
          if (h > 900) {
            await page.setViewportSize({ width: 440, height: h });
            await page.waitForTimeout(200);
          }
        }
        if (target) await target.screenshot({ path: join(OUT, `${name}.png`) });
        else if (phone) await page.screenshot({ path: join(OUT, `${name}.png`) });
        else {
          // fullPage(captureBeyondViewport)는 WebGL 캔버스 서브트리(타일·DOM 마커)를 간헐적으로 비운 채 찍는다 → 뷰포트를 문서 높이로 늘려 일반 촬영
          // 셸이 있으면 스크롤 컨테이너는 <main>(h-dvh 안) — main 내용 높이 + 상단 오프셋만큼 뷰포트를 키운다
          const h = await page.evaluate(() => {
            const m = document.querySelector('main');
            const doc = document.documentElement.scrollHeight;
            return m ? Math.max(doc, Math.ceil(m.getBoundingClientRect().top + m.scrollHeight)) : doc;
          });
          await page.setViewportSize({ width: 1280, height: Math.max(842, h) });
          await page.waitForTimeout(300);
          await page.screenshot({ path: join(OUT, `${name}.png`) });
        }
        n++;
        console.log('ok', name);
      } catch (e) {
        fail++;
        console.log('FAIL', name, String(e.message).split('\n')[0]);
      }
      await page.close();
    }
  }
}
await browser.close();
for (const p of servers) p.kill();
console.log(`${fail ? '✗' : '✓'} capture: ${n} shots · fail ${fail} → shots/`);
process.exit(fail ? 1 : 0);
