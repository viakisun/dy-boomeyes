// tools/brand/build.mjs — 브랜드 정적 자산 빌드 (DY-design §13)
// logo.json(패스) + DY.tokens.css(색)에서 favicon(SVG·PNG) · PWA 아이콘(192/512/maskable/apple-touch) · 문서용 lockup SVG를 만든다.
// 색은 토큰에서 읽는다 — 이 스크립트 밖(앱 코드)에는 hex가 없다. 렌더는 저장소의 Playwright Chromium.
// 실행: pnpm brand:build [--proof <png>]  (logo.json · accent 토큰이 바뀌면 다시 실행 · PNG는 verify diff 게이트 밖)
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const logo = JSON.parse(readFileSync(resolve('packages/tokens/src/logo.json'), 'utf8'));
const css = readFileSync(resolve('packages/tokens/dist/DY.tokens.css'), 'utf8');

/** CSS 블록에서 변수 값 — light = :root, dark = [data-theme="dark"] */
function vars(selector) {
  const i = css.indexOf(`${selector} {`);
  if (i < 0) throw new Error(`tokens.css에 ${selector} 블록이 없다`);
  const block = css.slice(i, css.indexOf('}', i));
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const L = vars(':root');
const D = vars('[data-theme="dark"]');
const pick = (v, k) => {
  if (!v[k]) throw new Error(`토큰 없음: --${k}`);
  return v[k];
};
const C = {
  light: {
    ink: pick(L, 'sys-color-fg-default'),
    accent: pick(L, 'sys-color-accent-fg'),
    canvas: pick(L, 'sys-color-bg-canvas'),
  },
  dark: {
    ink: pick(D, 'sys-color-fg-default'),
    accent: pick(D, 'sys-color-accent-fg'),
    canvas: pick(D, 'sys-color-bg-canvas'),
  },
  icon: {
    ground: pick(L, 'sys-color-accent-solid'),
    ink: pick(L, 'sys-color-accent-on-solid'),
    accent: pick(L, 'ref-color-accent-7'),
  },
};

// 독립 SVG 파일은 클래스(+prefers-color-scheme) · HTML에 인라인되는 것은 fill 속성(문서 안 <style> 충돌 방지)
const paths = (v, ink, accent) =>
  [
    ...v.ink.map((d) => (ink ? `<path fill="${ink}" d="${d}"/>` : `<path class="be-logo-ink" d="${d}"/>`)),
    ...v.accent.map((d) => (accent ? `<path fill="${accent}" d="${d}"/>` : `<path class="be-logo-accent" d="${d}"/>`)),
  ].join('');
const styleOf = (ink, accent) => `.be-logo-ink{fill:${ink}}.be-logo-accent{fill:${accent}}`;

/** 독립 SVG 파일 — 라이트/다크(prefers-color-scheme) 값 내장 */
function svgFile(variant, { light, dark, width, height }) {
  const v = logo[variant];
  const [, , vw, vh] = v.viewBox.split(' ');
  const size = width ? ` width="${width}" height="${height ?? Math.round((width * vh) / vw)}"` : '';
  const style = dark
    ? `${styleOf(light.ink, light.accent)}@media (prefers-color-scheme: dark){${styleOf(dark.ink, dark.accent)}}`
    : styleOf(light.ink, light.accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${v.viewBox}"${size} role="img" aria-label="${logo.text}"><style>${style}</style>${paths(v)}</svg>\n`;
}

/** 아이콘 — 바탕(accent.solid) 위 흰 마크, 붐은 accent.7 · box = 마크가 차지하는 변의 비율 */
function iconSvg(size, box, { rounded = false } = {}) {
  const v = logo.mark;
  const s = (size * box) / 64;
  const off = (size - size * box) / 2;
  const r = rounded ? size * 0.2 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${C.icon.ground}"/><g transform="translate(${off} ${off}) scale(${s})">${paths(v, C.icon.ink, C.icon.accent)}</g></svg>`;
}

const outputs = [];
function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  outputs.push(file);
}

// ── SVG 파일
for (const app of ['web', 'pwa'])
  write(`apps/${app}/static/favicon.svg`, svgFile('glyph', { light: C.light, dark: C.dark }));
write('docs/brand/lockup.svg', svgFile('lockup', { light: C.light, height: 64 }));
write('docs/brand/lockup-dark.svg', svgFile('lockup', { light: C.dark, height: 64 }));
write(
  'docs/brand/lockup-on-navy.svg',
  svgFile('lockup', { light: { ink: C.icon.ink, accent: C.icon.accent }, height: 64 }),
);

// ── PNG (Chromium)
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function png(file, svg, size, { transparent = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${transparent ? 'transparent' : C.icon.ground}">${svg}</body></html>`,
  );
  const buf = await page.locator('svg').screenshot({ omitBackground: transparent, type: 'png' });
  write(file, buf);
}
// maskable: 마크 박스 ≤ 56% — 반지름 40% 안전 원 안에 모서리까지 들어간다(스크립트 단언)
const MASK_BOX = 0.56;
const cornerR = (MASK_BOX / 2) * Math.SQRT2;
if (cornerR > 0.4) throw new Error(`maskable 마크 박스 ${MASK_BOX}: 모서리 반지름 ${cornerR.toFixed(3)} > 0.4`);
await png('apps/pwa/static/icons/icon-192.png', iconSvg(192, 0.7), 192);
await png('apps/pwa/static/icons/icon-512.png', iconSvg(512, 0.7), 512);
await png('apps/pwa/static/icons/icon-512-maskable.png', iconSvg(512, MASK_BOX), 512);
await png('apps/pwa/static/icons/apple-touch-icon.png', iconSvg(180, 0.7), 180);
for (const app of ['web', 'pwa'])
  await png(`apps/${app}/static/favicon.png`, svgFile('glyph', { light: C.light, width: 32 }), 32, {
    transparent: true,
  });

// ── 검토용 콘택트 시트(--proof <png>): 라이트/다크 lockup · mark 64/32 · glyph 24/16 · 아이콘
const proofAt = process.argv.indexOf('--proof');
if (proofAt > 0) {
  const file = process.argv[proofAt + 1];
  const cell = (bg, color, inner) =>
    `<div style="background:${bg};color:${color};padding:24px;display:flex;gap:24px;align-items:center;flex-wrap:wrap;font:12px sans-serif">${inner}</div>`;
  const inline = (variant, h, accent) =>
    `<svg viewBox="${logo[variant].viewBox}" height="${h}" style="display:block">${paths(logo[variant], 'currentColor', accent ?? 'currentColor')}</svg>`;
  const row = (t, accent) =>
    cell(
      t.canvas,
      t.ink,
      [
        inline('lockup', 40, accent),
        inline('lockup', 24),
        inline('mark', 64, accent),
        inline('mark', 32, accent),
        inline('glyph', 24),
        inline('glyph', 16),
        inline('glyph', 16, accent),
        `<span>ink ${t.ink} · accent ${accent ?? 'mono'}</span>`,
      ].join(''),
    );
  const html = `<!doctype html><body style="margin:0;width:900px">${row(C.light, C.light.accent)}${row(C.dark, C.dark.accent)}${cell('#888', '#fff', [iconSvg(96, 0.7, { rounded: true }), iconSvg(96, MASK_BOX), `<img src="data:image/svg+xml;utf8,${encodeURIComponent(svgFile('glyph', { light: C.light, width: 32 }))}" width="32" height="32" style="background:#fff">`].join(''))}</body>`;
  await page.setViewportSize({ width: 900, height: 420 });
  await page.setContent(html);
  const buf = await page.screenshot({ fullPage: true, type: 'png' });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  console.log(`proof → ${file}`);
}
await browser.close();

for (const f of outputs) {
  const kb = (statSync(f).size / 1024).toFixed(1);
  console.log(`  ${f} ${kb}KB`);
}
console.log(
  `✓ brand: ${outputs.length} files · ground ${C.icon.ground} · ink ${C.light.ink}/${C.dark.ink} · accent ${C.light.accent}/${C.dark.accent}`,
);
