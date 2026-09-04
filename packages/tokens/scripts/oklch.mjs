// oklch.mjs — sRGB ↔ OKLab/OKLCH 변환 · 색역 매핑 · WCAG 대비 (의존성 없음)
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}
export const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('');
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
export function rgbToOklab([r, g, b]) {
  const [R, G, B] = [r, g, b].map(toLin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function oklabToLinear([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
export const linearToRgb = (lin) => lin.map((c) => toSrgb(Math.max(0, Math.min(1, c))));
export const oklabToLch = ([L, a, b]) => [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
export const lchToOklab = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
export const hexToLch = (hex) => oklabToLch(rgbToOklab(hexToRgb(hex)));
const inGamut = (lin) => lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
/** OKLCH → hex. 색역 밖이면 L·H 고정, C만 줄여 매핑. */
export function lchToHex([L, C, H]) {
  let lin = oklabToLinear(lchToOklab([L, C, H]));
  if (inGamut(lin)) return rgbToHex(linearToRgb(lin));
  let lo = 0, hi = C;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; lin = oklabToLinear(lchToOklab([L, mid, H])); if (inGamut(lin)) lo = mid; else hi = mid; }
  return rgbToHex(linearToRgb(oklabToLinear(lchToOklab([L, lo, H]))));
}
export function luminance(hex) { const [r, g, b] = hexToRgb(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
export function contrast(a, b) { const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }
export const fmtLch = (hex) => { const [L, C, H] = hexToLch(hex); return `L${(L * 100).toFixed(0)} C${C.toFixed(3)} H${H.toFixed(0)}`; };
