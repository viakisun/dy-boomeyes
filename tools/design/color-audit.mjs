// color-audit.mjs — 화면별 점·색 사용량을 DOM에서 센다 (DY-design §0-4 색 예산 · W2.5 D9). 빌드 뒤 실행: node tools/design/color-audit.mjs [--json] [--no-serve]
//   dots = size-size-indicator(상태 점) · glyph = "●" 텍스트 · markers = 지도 마커 · bg = 톤 배경 요소(pill·배너·타일) · fg = 톤 텍스트만인 요소 · hues = 사용된 색상 계열(neutral 제외)
//   예산: 화면당 hues ≤ 3(accent · warning · danger) · dots는 LIVE·REC·촬영 중만 — 초과는 △로 표시(보고용, exit 0)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ssot = JSON.parse(readFileSync(resolve(ROOT, 'packages/domain/src/generated/ssot.json'), 'utf8'));
const APP = Object.fromEntries(ssot.screens.surfaces.map((s) => [s.id, s.app]));
const PARAMS = { '[case]': 'C-105', '[device]': 'CPB-003', '[site]': 'SITE-001', '[event]': 'EV-001' };
const WAVE = ssot.meta?.current_wave ?? 2;
const screens = ssot.screens.screens.filter((s) => s.wave <= WAVE);
const JSON_OUT = process.argv.includes('--json');
const SERVE = !process.argv.includes('--no-serve');
const srv = SERVE
  ? ['web', 'pwa'].map((a, i) =>
      spawn('pnpm', ['--filter', `@boomeyes/${a}`, 'preview', '--port', String(4173 + i), '--strictPort'], {
        cwd: ROOT,
        stdio: 'ignore',
        detached: true,
      }),
    )
  : [];
process.on('exit', () =>
  srv.forEach((p) => {
    try {
      process.kill(-p.pid);
    } catch {
      /* 이미 종료 */
    }
  }),
);
if (SERVE) await new Promise((r) => setTimeout(r, 4500));
const b = await chromium.launch();
const rows = [];
for (const s of screens) {
  const app = APP[s.surface];
  const base = app === 'web' ? 'http://localhost:4173' : 'http://localhost:4174';
  const route = s.route.replace(/\[[a-z]+\]/g, (m) => PARAMS[m] ?? 'X');
  const url = base + route + (route.includes('?') ? '&' : '?') + `state=${s.default}&capture=1`;
  const ctx = await b.newContext({
    viewport: app === 'web' ? { width: 1280, height: 900 } : { width: 390, height: 844 },
  });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 30000 });
    await p.locator('[data-scr]').first().waitFor({ timeout: 20000 });
    await p.waitForTimeout(app === 'web' ? 2500 : 1200);
    const m = await p.evaluate(() => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      const TONES = ['accent', 'info', 'success', 'warning', 'danger', 'progress', 'neutral'];
      const all = [...document.querySelectorAll('body *')].filter(vis);
      const dots = all.filter(
        (el) => el.classList.contains('size-size-indicator') && el.classList.contains('rounded-pill'),
      ).length;
      const glyph = all.filter((el) => el.children.length === 0 && /●/.test(el.textContent || '')).length;
      const markers = document.querySelectorAll('.be-marker').length;
      const bgBy = {},
        fgBy = {};
      let bgN = 0,
        fgN = 0;
      for (const el of all) {
        const cls = [...el.classList];
        let bgTone = null,
          fgTone = null;
        for (const t of TONES) {
          if (cls.some((c) => c === `bg-${t}` || c === `bg-${t}-bg` || c === `bg-${t}-bg-subtle`)) bgTone = t;
          if (cls.some((c) => c === `text-${t}-fg` || c === `text-${t}-fg-strong`)) fgTone = t;
        }
        if (bgTone) {
          bgN++;
          bgBy[bgTone] = (bgBy[bgTone] || 0) + 1;
        } else if (fgTone) {
          fgN++;
          fgBy[fgTone] = (fgBy[fgTone] || 0) + 1;
        }
      }
      const hues = [...new Set([...Object.keys(bgBy), ...Object.keys(fgBy)].filter((t) => t !== 'neutral'))];
      return {
        dots,
        glyph,
        markers,
        bgN,
        fgN,
        bgBy,
        fgBy,
        hues,
        text: all.filter((el) => el.children.length === 0 && (el.textContent || '').trim()).length,
      };
    });
    rows.push({ id: s.id, name: s.name, app, ...m });
  } catch (e) {
    rows.push({ id: s.id, name: s.name, app, error: String(e).slice(0, 80) });
  }
  await ctx.close();
}
await b.close();
srv.forEach((p) => {
  try {
    process.kill(-p.pid);
  } catch {
    /* 이미 종료 */
  }
});
const ok = rows.filter((r) => !r.error);
const f = (o) =>
  Object.entries(o || {})
    .map(([k, v]) => `${k.slice(0, 3)}${v}`)
    .join(' ');
const over = ok.filter((r) => r.hues.length > 3);
if (JSON_OUT) console.log(JSON.stringify({ rows, over: over.map((r) => r.id) }, null, 1));
else {
  console.log('code    | dots glyph mark | bg(by tone)                          | fg-only(by tone)            | hues');
  for (const r of rows) {
    if (r.error) {
      console.log(`${r.id.padEnd(7)} | ERROR ${r.error}`);
      continue;
    }
    console.log(
      `${r.id.padEnd(7)} | ${String(r.dots).padStart(4)} ${String(r.glyph).padStart(5)} ${String(r.markers).padStart(4)} | ${String(r.bgN).padStart(3)} ${f(r.bgBy).padEnd(32)} | ${String(r.fgN).padStart(3)} ${f(r.fgBy).padEnd(24)} | ${r.hues.length}${r.hues.length > 3 ? ' △' : ''}`,
    );
  }
  const sum = (k) => ok.reduce((a, r) => a + r[k], 0);
  const tot = {};
  for (const r of ok) for (const [k, v] of Object.entries(r.bgBy)) tot[k] = (tot[k] || 0) + v;
  const totf = {};
  for (const r of ok) for (const [k, v] of Object.entries(r.fgBy)) totf[k] = (totf[k] || 0) + v;
  console.log(
    `${over.length ? '△' : '✓'} color-audit: ${ok.length}화면 · 점 ${sum('dots')} · ● ${sum('glyph')} · 마커 ${sum('markers')} · 색 배경 ${sum('bgN')}(${f(tot)}) · 색 텍스트 ${sum('fgN')}(${f(totf)}) · 텍스트 요소 ${sum('text')} · 색상 계열 4+ 화면 ${over.length}(${over.map((r) => r.id).join(' ')})`,
  );
}
