// tokens.mjs — src/{ref,sys,cmp}/*.json 로드 · 평탄화 · 모드(테마×밀도)별 해석
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export const THEMES = ['light', 'dark'];
export const DENSITIES = ['comfortable', 'compact'];
const MODE_KEYS = new Set([...THEMES, ...DENSITIES]);
export const LAYERS = ['ref', 'sys', 'cmp'];
export function loadTree(srcDir) {
  const tree = { ref: {}, sys: {}, cmp: {} };
  for (const layer of LAYERS) {
    const dir = join(srcDir, layer);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)
      .filter((f) => f.endsWith('.json') && !f.endsWith('.config.json'))
      .sort())
      deepMerge(tree[layer], JSON.parse(readFileSync(join(dir, f), 'utf8')));
  }
  return tree;
}
export function deepMerge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !('$value' in v) &&
      a[k] &&
      typeof a[k] === 'object' &&
      !('$value' in a[k])
    )
      deepMerge(a[k], v);
    else a[k] = v;
  }
}
export function flatten(tree) {
  const out = new Map();
  (function walk(n, p) {
    for (const [k, v] of Object.entries(n)) {
      if (k.startsWith('$')) continue;
      if (v && typeof v === 'object' && '$value' in v) out.set([...p, k].join('.'), v);
      else if (v && typeof v === 'object') walk(v, [...p, k]);
    }
  })(tree, []);
  return out;
}
export const isModeObj = (v) =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v).length > 0 &&
  Object.keys(v).every((k) => MODE_KEYS.has(k));
export function pickMode(v, mode) {
  if (!isModeObj(v)) return v;
  const k = Object.keys(v).find((k) => k === mode.theme || k === mode.density);
  if (k === undefined) throw new Error(`mode key missing for ${JSON.stringify(mode)} in ${JSON.stringify(v)}`);
  return v[k];
}
export function resolveAll(flat, mode) {
  const out = new Map();
  const res = (v, depth, trail) => {
    if (depth > 24) throw new Error('alias loop ' + trail.join(' > '));
    v = pickMode(v, mode);
    if (typeof v === 'string') {
      const m = /^\{([^}]+)\}$/.exec(v);
      if (m) {
        const t = flat.get(m[1]);
        if (!t) throw new Error(`unresolved alias {${m[1]}} at ${trail.join(' > ')}`);
        return res(t.$value, depth + 1, [...trail, m[1]]);
      }
      return v;
    }
    if (Array.isArray(v)) return v.map((x) => res(x, depth + 1, trail));
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, res(x, depth + 1, [...trail, k])]));
    return v;
  };
  for (const [p, t] of flat) out.set(p, { $type: t.$type, value: res(t.$value, 0, [p]), token: t });
  return out;
}
/** 값이 참조하는 별칭 경로 목록(직접) */
export function aliasesOf(v) {
  const out = [];
  (function walk(x) {
    if (typeof x === 'string') {
      const m = /^\{([^}]+)\}$/.exec(x);
      if (m) out.push(m[1]);
    } else if (x && typeof x === 'object') for (const y of Object.values(x)) walk(y);
  })(v);
  return out;
}
