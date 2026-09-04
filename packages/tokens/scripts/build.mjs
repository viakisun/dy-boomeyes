// build.mjs — 브랜드별 dist/<brand>.tokens.css · <brand>.theme.css · <brand>.tokens.json · <brand>-design.md 생성 (검사 실패 시 exit 1, 산출물은 생성)
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepare, loadBrands, ROOT, DIST } from './prepare.mjs';
import { runChecks } from './check.mjs';
import { renderDoc } from './doc.mjs';
import { cssVar, cssValue, themeName } from './css.mjs';
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
function varLines(p, r) {
  if (r.$type === 'typography') {
    const v = r.value,
      base = cssVar(p),
      fam = cssValue('fontFamily', v.fontFamily);
    return [
      `${base}-font-family: ${fam};`,
      `${base}-font-size: ${v.fontSize};`,
      `${base}-font-weight: ${v.fontWeight};`,
      `${base}-line-height: ${v.lineHeight};`,
      `${base}-letter-spacing: ${v.letterSpacing};`,
      `${base}: ${v.fontWeight} ${v.fontSize}/${v.lineHeight} ${fam};`,
    ];
  }
  return [`${cssVar(p)}: ${cssValue(r.$type, r.value)};`];
}
const block = (sel, lines, ind = '  ') => [`${sel} {`, ...lines.map((l) => ind + l), '}'].join('\n');
function emitCss(ctx) {
  const base = ctx.modes['light.comfortable'];
  const all = [...base].flatMap(([p, r]) => varLines(p, r));
  const diff = (a, b) =>
    [...b]
      .filter(([p, r]) => JSON.stringify(r.value) !== JSON.stringify(a.get(p).value))
      .flatMap(([p, r]) => varLines(p, r));
  const dark = diff(base, ctx.modes['dark.comfortable']);
  const compact = diff(base, ctx.modes['light.compact']);
  return [
    `/* GENERATED — @boomeyes/tokens ${pkg.version} · brand ${ctx.brand.id} ${ctx.brand.version} · 원천 packages/tokens/src · 수기 수정 금지 */`,
    `/* 테마: :root = light · [data-theme="dark"] · prefers-color-scheme(명시 없을 때) | 밀도: :root = comfortable(PWA) · [data-density="compact"](웹) */`,
    block(':root', all),
    block('[data-theme="dark"]', dark),
    `@media (prefers-color-scheme: dark) {\n${block('  :root:not([data-theme="light"])', dark, '    ')}\n}`,
    block('[data-density="compact"]', compact),
    '',
  ].join('\n\n');
}
function emitTheme(ctx) {
  const base = ctx.modes['light.comfortable'];
  const lines = [];
  for (const [p, r] of base) {
    const n = themeName(p);
    if (!n) continue;
    if (r.$type === 'typography') {
      const v = cssVar(p);
      lines.push(
        `${n}: var(${v}-font-size);`,
        `${n}--line-height: var(${v}-line-height);`,
        `${n}--font-weight: var(${v}-font-weight);`,
        `${n}--letter-spacing: var(${v}-letter-spacing);`,
      );
      continue;
    }
    lines.push(`${n}: var(${cssVar(p)});`);
  }
  const bps = [...base]
    .filter(([p]) => p.startsWith('sys.layout.breakpoint.'))
    .map(([p, r]) => `--breakpoint-${p.split('.').pop()}: ${r.value};`);
  return [
    `/* GENERATED — Tailwind v4 theme · brand ${ctx.brand.id}. 앱 CSS에서 @import 한 줄로 사용. */`,
    `@import './${ctx.brand.id}.tokens.css';`,
    block('@theme', [
      '--color-*: initial;',
      '--spacing: initial;',
      '--font-*: initial;',
      '--text-*: initial;',
      '--font-weight-*: initial;',
      '--radius-*: initial;',
      '--shadow-*: initial;',
      '--ease-*: initial;',
      '--breakpoint-*: initial;',
      ...bps,
    ]),
    block('@theme inline', lines),
    '',
  ].join('\n\n');
}
function emitJson(ctx) {
  const out = { brand: ctx.brand.id, version: pkg.version, modes: {}, tokens: {} };
  for (const [m, map] of Object.entries(ctx.modes))
    out.modes[m] = Object.fromEntries([...map].map(([p, r]) => [p, r.value]));
  for (const [p, t] of ctx.flat)
    out.tokens[p] = {
      $type: t.$type,
      $description: t.$description ?? null,
      $value: t.$value,
      css: cssVar(p),
      tailwind: themeName(p),
    };
  return out;
}
mkdirSync(DIST, { recursive: true });
let failed = false;
for (const brand of loadBrands()) {
  const ctx = prepare(brand);
  const report = runChecks(ctx.flat, ctx.modes);
  if (report.errors.length) {
    failed = true;
    console.error(`✗ ${brand.id}: ${report.errors.length} errors`);
    for (const e of report.errors) console.error('  - ' + e);
  }
  writeFileSync(join(DIST, `${brand.id}.tokens.css`), emitCss(ctx));
  writeFileSync(join(DIST, `${brand.id}.theme.css`), emitTheme(ctx));
  writeFileSync(join(DIST, `${brand.id}.tokens.json`), JSON.stringify(emitJson(ctx), null, 2) + '\n');
  writeFileSync(join(DIST, `${brand.id}-design.md`), renderDoc(ctx, report, pkg));
  console.log(
    `${report.errors.length ? '✗' : '✓'} ${brand.id}: tokens ${ctx.flat.size} · contrast ${report.contrast.filter((r) => r.ok).length}/${report.contrast.length} → dist/${brand.id}.{tokens.css,theme.css,tokens.json} · ${brand.id}-design.md`,
  );
}
process.exitCode = failed ? 1 : 0;
