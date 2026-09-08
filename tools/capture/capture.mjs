// capture.mjs — ssot 화면 레지스트리 기반 캡처 (QA §3). 빌드된 앱을 vite preview로 띄우고 라우트×상태 전수 촬영.
//   node tools/capture/capture.mjs [--wave N] [--only B1-02,B0-01] [--dark] [--strict] [--web http://...] [--pwa http://...] [--no-serve]
//   --baseline | --current: 시각 회귀(ADR-008 A) 프리셋 — DPR 1 · 기본 상태만 · 라이트 · shots/baseline | shots/current + MANIFEST.json(렌더 환경) + <name>.json(지도·비디오 마스크)
// 출력 shots/<code-lower>-<state>.png · 시각 고정은 앱 DemoClock(?capture=1) · 애니메이션 off
// --dark: 화면 기본 상태를 ?theme=dark(루트 data-theme)로 한 번 더 찍는다 → <code-lower>-<state>-dark.png (shell-auth AC-6)
// --strict: 캐치올 자리 화면(루트 [data-stub] · "준비 중인 화면입니다")을 FAIL로 센다 — 웨이브 Exit 게이트(자리 0, W2). 없으면 stub로 세기만 한다
// 출력 디렉터리에 manifest.json(장별 code · state · file · app · dark · default · dpr · width · height · ok)을 남긴다 — tools/docs-gen(ADR-011)이 읽는다
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pwVersion = createRequire(import.meta.url)('playwright/package.json').version;
const ssot = JSON.parse(readFileSync(join(ROOT, 'packages/domain/src/generated/ssot.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const WAVE = Number(opt('--wave', ssot.meta.current_wave));
const ONLY = opt('--only', '') ? opt('--only').split(',') : null;
const PRESET = args.includes('--baseline') ? 'baseline' : args.includes('--current') ? 'current' : null;
const DARK = !PRESET && args.includes('--dark');
const STRICT = args.includes('--strict');
const DPR = PRESET ? 1 : Number(opt('--dpr', 2));
const PORTS = { web: 4173, pwa: 4174 };
const BASE = { web: opt('--web', `http://localhost:${PORTS.web}`), pwa: opt('--pwa', `http://localhost:${PORTS.pwa}`) };
const OUT = PRESET ? join(ROOT, 'shots', PRESET) : join(ROOT, 'shots');
mkdirSync(OUT, { recursive: true });
const MASK_SELECTORS = ['.be-map', 'video']; // 타일·재생 프레임은 결정적이지 않다 → 비교에서 제외
const PARAMS = {
  '[case]': 'C-105',
  '[device]': 'CPB-003',
  '[site]': 'SITE-001',
  '[camera]': 'CAM-3-2',
  '[event]': 'EV-001',
};
// 상태 픽스처가 다른 개체를 다루면 여기서 파라미터를 바꾼다 (docnew = C-106 서류 검토 업무)
const STATE_PARAMS = {
  'A1-03:docnew': { '[case]': 'C-106' },
  'A1-03:review': { '[case]': 'C-106' },
  'A3-03:normal': { '[site]': 'SITE-002' },
};
// 같은 data-scr를 공유하는 상태가 state= 외에 추가 쿼리(예: 시트 오픈)가 필요할 때만 채운다(화면 검수 backlog 7)
const STATE_QUERY = { 'A1-03:review': 'sheet=review' };
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
// preview 서버는 pnpm → vite 두 프로세스 — pnpm만 죽이면 vite가 고아로 남아 다음 캡처가 옛 서버를 잡는다(SOP 고아 preview). detached 그룹으로 띄우고 그룹째 죽인다
const servers = [];
const stopServers = () => {
  for (const p of servers) {
    try {
      process.kill(-p.pid, 'SIGTERM');
    } catch {
      p.kill();
    }
  }
};
const isUp = async (url) => {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
};
async function waitDown(url, ms = 10_000) {
  const t0 = Date.now();
  do {
    if (!(await isUp(url))) return true;
    await new Promise((r) => setTimeout(r, 200));
  } while (Date.now() - t0 < ms);
  return false;
}
if (!args.includes('--no-serve'))
  for (const app of ['web', 'pwa']) {
    if (!existsSync(join(ROOT, 'apps', app, 'build'))) throw new Error(`apps/${app}/build 없음 — 먼저 pnpm build`);
    if (await isUp(BASE[app]))
      throw new Error(
        `${BASE[app]} 에 이미 리스너가 있다 — 고아 preview 서버를 먼저 정리(lsof -nP -iTCP:${PORTS[app]} -sTCP:LISTEN)`,
      );
    servers.push(
      spawn('pnpm', ['--filter', `@boomeyes/${app}`, 'preview', '--port', String(PORTS[app]), '--strictPort'], {
        cwd: ROOT,
        stdio: 'ignore',
        detached: true,
      }),
    );
    await waitHttp(BASE[app]);
  }
process.on('exit', stopServers);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  deviceScaleFactor: DPR,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  reducedMotion: 'reduce',
});
// 시각·난수 고정은 앱의 DemoClock(?capture=1)이 담당한다 — 브라우저 Date 프록시는 MapLibre 로드를 막는다
let n = 0,
  fail = 0,
  stub = 0;
const manifest = []; // shots/manifest.json — 문서 생성기(tools/docs-gen)가 소비하는 캡처 계약(ADR-011)
const pngSize = (p) => {
  const b = readFileSync(p);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};
/** 마스크 사이드카 — 스크린샷 원점(origin) 기준 CSS px × DPR 사각형 */
async function writeMasks(page, name, origin) {
  const rects = await page.$$eval(MASK_SELECTORS.join(','), (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  const masks = rects
    .filter((r) => r.w > 0 && r.h > 0)
    .map((r) => ({ x: (r.x - origin.x) * DPR, y: (r.y - origin.y) * DPR, w: r.w * DPR, h: r.h * DPR }));
  if (masks.length) writeFileSync(join(OUT, `${name}.json`), JSON.stringify({ masks }));
}
for (const s of screens) {
  const app = surfaces[s.surface];
  const phone = app === 'pwa';
  for (const st of PRESET ? s.states.filter((x) => x.id === s.default) : s.states) {
    const route = s.route.replace(/\[[a-z]+\]/g, (m) => STATE_PARAMS[`${s.id}:${st.id}`]?.[m] ?? PARAMS[m] ?? 'X');
    const extra = STATE_QUERY[`${s.id}:${st.id}`];
    const base = `${BASE[app]}${route}${route.includes('?') ? '&' : '?'}state=${st.id}&capture=1${extra ? `&${extra}` : ''}`;
    const name0 = `${s.id.toLowerCase()}-${st.id}`;
    const variants = [{ url: base, name: name0 }];
    if (DARK && st.id === s.default) variants.push({ url: `${base}&theme=dark`, name: `${name0}-dark` });
    for (const { url, name } of variants) {
      const page = await ctx.newPage();
      await page.setViewportSize(phone ? { width: 440, height: 900 } : { width: 1280, height: 842 });
      try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForSelector(`[data-scr="${s.id}"]`, { timeout: 10_000 });
        // 자리 화면(캐치올 EmptyState) — data-scr는 캐치올도 붙이므로 루트 data-stub로 판별한다
        if (await page.locator('[data-stub]').count()) {
          stub++;
          if (STRICT) throw new Error('자리 화면 — 실 라우트 없음([data-stub] 캐치올)');
          console.log('stub', name);
        }
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
        if (target) {
          if (PRESET) await writeMasks(page, name, (await target.boundingBox()) ?? { x: 0, y: 0 });
          await target.screenshot({ path: join(OUT, `${name}.png`) });
        } else if (phone) {
          if (PRESET) await writeMasks(page, name, { x: 0, y: 0 });
          await page.screenshot({ path: join(OUT, `${name}.png`) });
        } else {
          // fullPage(captureBeyondViewport)는 WebGL 캔버스 서브트리(타일·DOM 마커)를 간헐적으로 비운 채 찍는다 → 뷰포트를 문서 높이로 늘려 일반 촬영
          // 셸이 있으면 스크롤 컨테이너는 <main>(h-dvh 안) — main 내용 높이 + 상단 오프셋만큼 뷰포트를 키운다
          const h = await page.evaluate(() => {
            const m = document.querySelector('main');
            const doc = document.documentElement.scrollHeight;
            return m ? Math.max(doc, Math.ceil(m.getBoundingClientRect().top + m.scrollHeight)) : doc;
          });
          await page.setViewportSize({ width: 1280, height: Math.max(842, h) });
          await page.waitForTimeout(300);
          if (PRESET) await writeMasks(page, name, { x: 0, y: 0 });
          await page.screenshot({ path: join(OUT, `${name}.png`) });
        }
        n++;
        console.log('ok', name);
        manifest.push({
          code: s.id,
          state: st.id,
          file: `${name}.png`,
          app,
          dark: name.endsWith('-dark'),
          default: st.id === s.default,
          dpr: DPR,
          ok: true,
          ...pngSize(join(OUT, `${name}.png`)),
        });
      } catch (e) {
        fail++;
        console.log('FAIL', name, String(e.message).split('\n')[0]);
        manifest.push({
          code: s.id,
          state: st.id,
          file: `${name}.png`,
          app,
          dark: name.endsWith('-dark'),
          default: st.id === s.default,
          dpr: DPR,
          ok: false,
          error: String(e.message).split('\n')[0],
        });
      }
      await page.close();
    }
  }
}
// 프리셋(baseline/current) 디렉터리에는 쓰지 않는다 — MANIFEST.json(렌더 환경)과 macOS 대소문자 충돌로 항상 수정 상태가 됐다 · 문서 생성기는 shots/manifest.json만 읽는다
if (!PRESET)
  writeFileSync(
    join(OUT, 'manifest.json'),
    JSON.stringify({ wave: WAVE, dpr: DPR, dark: DARK, strict: STRICT, shots: manifest }, null, 2) + '\n',
  );
if (PRESET)
  writeFileSync(
    join(OUT, 'MANIFEST.json'),
    JSON.stringify(
      {
        preset: PRESET,
        platform: process.platform,
        playwright: pwVersion,
        chromium: browser.version(),
        dpr: DPR,
        wave: WAVE,
        shots: n,
      },
      null,
      2,
    ) + '\n',
  );
await browser.close();
stopServers();
if (servers.length)
  for (const app of ['web', 'pwa'])
    if (!(await waitDown(BASE[app]))) console.log(`△ ${BASE[app]} 서버가 아직 살아 있다`);
console.log(
  `${fail ? '✗' : '✓'} capture: ${n} shots · fail ${fail} · 자리 ${stub}${STRICT ? ' (strict)' : ''} → shots/${PRESET ? PRESET + '/' : ''}`,
);
process.exit(fail ? 1 : 0);
