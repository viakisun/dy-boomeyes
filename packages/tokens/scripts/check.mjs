// check.mjs — 명명 문법 · 계층 규칙 · 모드 차원 · WCAG 대비 검사. `node scripts/check.mjs`로 단독 실행 가능.
import { contrast } from './oklch.mjs';
import { aliasesOf, THEMES } from './tokens.mjs';
const SEG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATEGORIES = {
  ref: ['color', 'space', 'size', 'radius', 'border', 'shadow', 'font', 'motion'],
  sys: ['color', 'type', 'space', 'size', 'layout', 'radius', 'border', 'shadow', 'motion', 'z', 'opacity'],
  cmp: null,
};
const SYS_COLOR =
  /^sys\.color\.(bg|fg|border|accent|focus|media|status\.(info|success|warning|danger|progress|neutral)|domain\.[a-z-]+\.[a-z-]+)(\.[a-z0-9-]+)*$/;
const STATE_SUFFIX = /-(hover|active|selected|disabled|focus|strong|subtle|raised|sunken)$/;
export const TONES = ['info', 'success', 'warning', 'danger', 'progress', 'neutral'];
export function runChecks(flat, modes) {
  const errors = [],
    warnings = [];
  for (const [p, t] of flat) {
    const segs = p.split('.');
    const [layer, cat] = segs;
    if (!['ref', 'sys', 'cmp'].includes(layer)) errors.push(`layer: ${p}`);
    if (segs.some((s) => !SEG.test(s))) errors.push(`segment grammar(소문자·숫자·하이픈만): ${p}`);
    if (CATEGORIES[layer] && !CATEGORIES[layer].includes(cat))
      errors.push(`category '${cat}' not allowed in ${layer}: ${p}`);
    if (layer === 'sys' && cat === 'color' && !SYS_COLOR.test(p)) errors.push(`sys.color grammar: ${p}`);
    if (!t.$type) errors.push(`missing $type: ${p}`);
    if (layer === 'ref' && cat === 'color' && !['alpha', 'on'].includes(segs[2]) && !(+segs[3] >= 1 && +segs[3] <= 12))
      errors.push(`ref.color step must be 1..12: ${p}`);
    if (layer === 'sys' && cat === 'color' && /\.(hover|active)$/.test(p))
      errors.push(`state must be suffix with '-' (e.g. ui-hover), not a segment: ${p}`);
    for (const a of aliasesOf(t.$value)) {
      const al = a.split('.')[0];
      if (layer === 'ref' && !(cat === 'color' && (segs[2] === 'accent' || (segs[2] === 'on' && segs[3] === 'accent'))))
        errors.push(`ref must not alias: ${p} → ${a}`);
      if (layer === 'cmp' && al === 'ref') errors.push(`cmp must alias sys only (no ref): ${p} → ${a}`);
      if (layer === 'sys' && al === 'cmp') errors.push(`sys must not alias cmp: ${p} → ${a}`);
      if (!flat.has(a)) errors.push(`unresolved alias ${a} in ${p}`);
    }
  }
  const v = (m, p) => JSON.stringify(modes[m].get(p)?.value);
  for (const p of flat.keys()) {
    const dTheme = v('light.comfortable', p) !== v('dark.comfortable', p);
    const dDens = v('light.comfortable', p) !== v('light.compact', p);
    if (dTheme && dDens) errors.push(`token depends on both theme and density: ${p}`);
  }
  const PAIRS = [
    ['sys.color.fg.default', 'sys.color.bg.canvas', 7],
    ['sys.color.fg.default', 'sys.color.bg.surface', 7],
    ['sys.color.fg.default', 'sys.color.bg.ui', 4.5],
    ['sys.color.fg.default', 'sys.color.bg.selected', 4.5],
    ['sys.color.fg.muted', 'sys.color.bg.canvas', 4.5],
    ['sys.color.fg.muted', 'sys.color.bg.surface', 4.5],
    ['sys.color.fg.subtle', 'sys.color.bg.canvas', 3],
    ['sys.color.fg.muted', 'sys.color.bg.surface-sunken', 4.5],
    ['sys.color.fg.muted', 'sys.color.bg.selected', 4.5],
    ['sys.color.fg.default', 'sys.color.bg.selected', 7],
    ['sys.color.fg.link', 'sys.color.bg.canvas', 4.5],
    ['sys.color.fg.on-inverse', 'sys.color.bg.inverse', 4.5],
    ['sys.color.accent.fg', 'sys.color.bg.canvas', 4.5],
    ['sys.color.accent.fg', 'sys.color.accent.bg', 4.5],
    ['sys.color.accent.on-solid', 'sys.color.accent.solid', 4.5],
    ['sys.color.border.emphasis', 'sys.color.bg.canvas', 3],
    ['sys.color.focus.ring', 'sys.color.bg.canvas', 3],
  ];
  for (const tone of TONES)
    PAIRS.push(
      [`sys.color.status.${tone}.fg`, 'sys.color.bg.canvas', 4.5],
      [`sys.color.status.${tone}.fg`, 'sys.color.bg.surface', 4.5], // Stat 라벨 톤 색 · 카드 표면 위 pill 텍스트 (W2.5 D8)
      [`sys.color.status.${tone}.fg`, `sys.color.status.${tone}.bg`, 4.5],
      [`sys.color.status.${tone}.on-solid`, `sys.color.status.${tone}.solid`, 4.5],
      [`sys.color.status.${tone}.solid`, 'sys.color.bg.canvas', 3, `sys.color.status.${tone}.border-strong`],
    );
  const rows = [];
  for (const theme of THEMES) {
    const m = modes[`${theme}.comfortable`];
    for (const pair of PAIRS) {
      let [fg, bg, min, alt] = pair;
      if (alt && m.get(fg.replace(/\.solid$/, '.on-solid'))?.value !== '#ffffff') fg = alt; // 밝은 solid(어두운 텍스트)는 경계(border-strong)로 3:1 판정
      const a = m.get(fg)?.value,
        b = m.get(bg)?.value;
      if (!a || !b) {
        errors.push(`contrast pair missing ${fg} / ${bg}`);
        continue;
      }
      const r = contrast(a.slice(0, 7), b.slice(0, 7));
      rows.push({ theme, fg, bg, ratio: +r.toFixed(2), min, ok: r >= min });
      if (r < min) errors.push(`contrast ${theme}: ${fg} on ${bg} = ${r.toFixed(2)} < ${min}`);
    }
  }
  return { errors, warnings, contrast: rows };
}
if (process.argv[1] && process.argv[1].endsWith('check.mjs')) {
  const { prepare, loadBrands } = await import('./prepare.mjs');
  let failed = false;
  for (const brand of loadBrands()) {
    const ctx = prepare(brand);
    const r = runChecks(ctx.flat, ctx.modes);
    console.log(
      `${r.errors.length ? '✗' : '✓'} ${brand.id}: tokens ${ctx.flat.size} · errors ${r.errors.length} · contrast ${r.contrast.filter((x) => x.ok).length}/${r.contrast.length}`,
    );
    for (const e of r.errors) console.log('  - ' + e);
    if (r.errors.length) failed = true;
  }
  process.exitCode = failed ? 1 : 0;
}
