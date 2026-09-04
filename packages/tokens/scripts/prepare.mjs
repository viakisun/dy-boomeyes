// prepare.mjs — 브랜드별 토큰 트리 구성(램프 주입) → 평탄화 → 모드별 해석
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRamps } from './ramps.mjs';
import { loadTree, flatten, resolveAll, THEMES, DENSITIES } from './tokens.mjs';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = join(ROOT, 'src');
export const DIST = join(ROOT, 'dist');
const STEP_DESC = {
  1: '앱 바탕',
  2: '미묘한 바탕',
  3: '컨트롤 배경',
  4: '컨트롤 hover',
  5: '컨트롤 active·selected',
  6: '미묘한 테두리',
  7: '테두리',
  8: '강조 테두리·hover 테두리',
  9: 'solid(원색)',
  10: 'solid hover',
  11: '저대비 텍스트(≥4.5:1)',
  12: '고대비 텍스트',
};
export function loadBrands() {
  return readdirSync(join(SRC, 'brands'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(SRC, 'brands', f), 'utf8')));
}
export function prepare(brand) {
  const tree = loadTree(SRC);
  const cfg = JSON.parse(readFileSync(join(SRC, 'ref', 'color.config.json'), 'utf8'));
  const ramps = buildRamps(cfg, brand);
  const accentHue = brand.accent?.hue ?? cfg.hues.find((h) => h.role === 'accent').name;
  tree.ref.color ??= {};
  for (const [hue, ramp] of Object.entries(ramps.light)) {
    tree.ref.color[hue] = {};
    for (let i = 1; i <= 12; i++)
      tree.ref.color[hue][i] = {
        $type: 'color',
        $value: { light: ramp[i], dark: ramps.dark[hue][i] },
        $description: STEP_DESC[i],
      };
  }
  tree.ref.color.on = {};
  for (const hue of Object.keys(ramps.light))
    tree.ref.color.on[hue] = {
      $type: 'color',
      $value: { light: ramps.onSolid.light[hue], dark: ramps.onSolid.dark[hue] },
      $description: `${hue} solid(9) 위 텍스트`,
    };
  tree.ref.color.on.accent = {
    $type: 'color',
    $value: `{ref.color.on.${accentHue}}`,
    $description: '액센트 solid 위 텍스트',
  };
  tree.ref.color.accent = {};
  for (let i = 1; i <= 12; i++)
    tree.ref.color.accent[i] = {
      $type: 'color',
      $value: `{ref.color.${accentHue}.${i}}`,
      $description: `브랜드 액센트 = ${accentHue} ${i}`,
    };
  tree.ref.color.alpha = {};
  for (const base of ['black', 'white'])
    for (const a of [4, 8, 12, 16, 24, 40, 60, 80])
      tree.ref.color.alpha[`${base}-${a}`] = {
        $type: 'color',
        $value:
          (base === 'black' ? '#000000' : '#ffffff') +
          Math.round((a / 100) * 255)
            .toString(16)
            .padStart(2, '0'),
        $description: `${base} ${a}% — 오버레이·반투명 테두리`,
      };
  const flat = flatten(tree);
  const modes = {};
  for (const theme of THEMES)
    for (const density of DENSITIES) modes[`${theme}.${density}`] = resolveAll(flat, { theme, density });
  return { brand, tree, flat, modes, ramps, accentHue, cfg };
}
