// ramps.mjs — 색조 앵커(hex) → 12단 OKLCH 램프(light/dark) 생성. 단계 의미(Radix 관례):
//  1 앱 바탕 · 2 미묘한 바탕 · 3 컨트롤 배경 · 4 hover · 5 active/selected · 6 미묘한 테두리 · 7 테두리 · 8 강조 테두리/hover 테두리
//  9 solid(브랜드·상태 원색) · 10 solid hover · 11 저대비 텍스트(≥4.5:1) · 12 고대비 텍스트
import { hexToLch, lchToHex, contrast } from './oklch.mjs';
const LADDER = {
  light: {
    L: [0.995, 0.982, 0.958, 0.93, 0.897, 0.857, 0.79, 0.64, 0.5, 0.45, 0.42, 0.27],
    C: [0.04, 0.09, 0.18, 0.27, 0.36, 0.46, 0.58, 0.75, 1, 1, 0.85, 0.5],
  },
  dark: {
    L: [0.17, 0.2, 0.24, 0.28, 0.32, 0.36, 0.42, 0.48, 0.52, 0.58, 0.8, 0.95],
    C: [0.15, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 1, 1, 0.75, 0.3],
  },
};
const NEUTRAL_L = {
  light: [0.995, 0.985, 0.965, 0.94, 0.915, 0.885, 0.8, 0.7, 0.62, 0.56, 0.5, 0.22],
  dark: [0.16, 0.19, 0.225, 0.26, 0.3, 0.345, 0.42, 0.5, 0.58, 0.64, 0.8, 0.96],
};
export const THEMES = ['light', 'dark'];
export function buildRamps(config, brand) {
  const hues = config.hues.map((h) =>
    h.role === 'accent' && brand.accent
      ? {
          ...h,
          name: brand.accent.hue ?? h.name,
          anchor: brand.accent.anchor ?? h.anchor,
          pins: brand.accent.pins ?? h.pins,
          ladder: brand.accent.ladder ?? h.ladder,
        }
      : h,
  );
  const out = { light: {}, dark: {}, onSolid: { light: {}, dark: {} }, meta: {} };
  const byName = Object.fromEntries(hues.map((h) => [h.name, h]));
  for (const hue of hues) {
    const src = hue.hueFrom
      ? hue.hueFrom === 'accent'
        ? hues.find((h) => h.role === 'accent')
        : byName[hue.hueFrom]
      : hue;
    const [, aC, aH] = hexToLch(src.anchor);
    const H = hue.hue ?? aH;
    const Cmax = hue.chroma ?? (hue.neutral ? 0.008 : aC);
    out.meta[hue.name] = { anchor: src.anchor, hue: +H.toFixed(1), chroma: +Cmax.toFixed(3), role: hue.role ?? null };
    for (const theme of THEMES) {
      const ramp = {};
      for (let i = 1; i <= 12; i++) {
        const L = hue.ladder?.[theme]?.[i] ?? (hue.neutral ? NEUTRAL_L[theme][i - 1] : LADDER[theme].L[i - 1]);
        const C = hue.neutral ? Cmax : Cmax * LADDER[theme].C[i - 1];
        ramp[i] = lchToHex([L, C, H]);
      }
      for (const [k, v] of Object.entries(hue.pins?.[theme] ?? {})) ramp[k] = v.toLowerCase();
      out[theme][hue.name] = ramp;
    }
  }
  // solid 위 텍스트: 흰색 vs 어두운 중립 중 대비 높은 쪽
  for (const theme of THEMES)
    for (const [name, ramp] of Object.entries(out[theme])) {
      const dark = out.light.neutral[12];
      const step = byName[name]?.solidStep ?? 9; // solid로 쓰는 단계(중립은 11)
      out.onSolid[theme][name] = contrast('#ffffff', ramp[step]) >= contrast(dark, ramp[step]) ? '#ffffff' : dark;
    }
  return out;
}
