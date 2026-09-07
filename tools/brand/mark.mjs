// tools/brand/mark.mjs — BoomEyes 마크 생성기 (DY-design §13)
// 정육각 조리개(6엽) + 붐(2링크 · 관절 2 · 수직 링크 · 호스 팁)을 채움 패스로 만들어
// packages/tokens/src/logo.json의 mark · glyph · lockup을 쓴다. wordmark는 tools/brand/wordmark.py가 쓴다.
// 실행: node tools/brand/mark.mjs  (brand:generate = wordmark.py → mark.mjs)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve('packages/tokens/src/logo.json');

// ── 기하 파라미터 (64×64 박스, 좌표 단위 = viewBox 유닛)
const BOX = 64;
const HEX = { cx: 29, cy: 38, r: 23 }; // 꼭짓점 위 정육각
const IRIS = { hole: 8.5, twist: 20, gap: 2.4 }; // 중앙 육각 구멍 반지름 · 엽 비틀림(°) · 엽 사이 틈
const BOOM = { w: 6, w3: 5, joint: 4.2, hole: 1.7 }; // 링크 굵기 · 수직 링크 굵기 · 관절 반지름 · 관절 구멍
const GLYPH = { ring: 2.6, dot: 4.2 }; // glyph: 육각 링 두께 · 중앙 원

const rad = (d) => (d * Math.PI) / 180;
const n2 = (v) => {
  const s = (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};
const P = (x, y) => `${n2(x)} ${n2(y)}`;
const poly = (pts) => `M${pts.map(([x, y]) => P(x, y)).join('L')}Z`;
const circle = (cx, cy, r) => `M${P(cx - r, cy)}A${P(r, r)} 0 1 0 ${P(cx + r, cy)}A${P(r, r)} 0 1 0 ${P(cx - r, cy)}Z`;
// 반시계 원(구멍용 — 시계 원과 합치면 nonzero에서 비는 구멍)
const circleCCW = (cx, cy, r) =>
  `M${P(cx - r, cy)}A${P(r, r)} 0 1 1 ${P(cx + r, cy)}A${P(r, r)} 0 1 1 ${P(cx - r, cy)}Z`;

/** 정육각 꼭짓점 — 각도 -90°(위)부터 시계 방향 */
const hexPts = (cx, cy, r, twist = 0) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = rad(-90 + 60 * i + twist);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/** 두 직선(p + t·d)의 교점 */
function intersect([p1, d1], [p2, d2]) {
  const det = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / det;
  return [p1[0] + d1[0] * t, p1[1] + d1[1] * t];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => mul(a, 1 / len(a));
const perp = (a) => [-a[1], a[0]];

/** 6엽 조리개 — 바깥 육각 변 V_i→V_{i+1}과 안쪽(비튼) 육각 변 W_i→W_{i+1} 사이의 사각형, 옆선은 틈의 절반만큼 안쪽으로 */
function irisBlades() {
  const V = hexPts(HEX.cx, HEX.cy, HEX.r);
  const W = hexPts(HEX.cx, HEX.cy, IRIS.hole, IRIS.twist);
  const C = [HEX.cx, HEX.cy];
  const blades = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const outer = [V[i], sub(V[j], V[i])];
    const inner = [W[i], sub(W[j], W[i])];
    // 옆선 V_i→W_i · V_j→W_j 를 엽 안쪽으로 gap/2 평행 이동 (안쪽 = 엽의 중심 방향)
    const mid = mul(add(add(V[i], V[j]), add(W[i], W[j])), 0.25);
    const side = (a, b) => {
      const d = unit(sub(b, a));
      let n = perp(d);
      if (dot(n, sub(mid, a)) < 0) n = mul(n, -1);
      return [add(a, mul(n, IRIS.gap / 2)), d];
    };
    const sA = side(V[i], W[i]);
    const sB = side(V[j], W[j]);
    blades.push(poly([intersect(sA, outer), intersect(sB, outer), intersect(sB, inner), intersect(sA, inner)]));
  }
  void C;
  return blades;
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

/** 굵기 w의 선분을 사각형으로(끝은 둥근 관절 원이 덮는다) */
function bar(a, b, w) {
  const d = unit(sub(b, a));
  const n = mul(perp(d), w / 2);
  return poly([add(a, n), add(b, n), sub(b, n), sub(a, n)]);
}

/** 붐 — 링크 1은 육각 상단 좌측 변에 평행하게 바깥으로 띄워 달리고, 꼭짓점을 지나 관절 1 → 관절 2 → 수직 링크 → 호스 팁 */
function boom() {
  const V = hexPts(HEX.cx, HEX.cy, HEX.r);
  const top = V[0];
  const ul = V[5];
  const e = unit(sub(top, ul)); // 상단 좌측 변 방향(오른쪽 위)
  const nOut = mul(unit([-e[1], e[0]]), -1); // 바깥 법선(위 왼쪽)
  const off = BOOM.w / 2 + 1.6; // 변에서 링크 중심선까지
  const start = add(add(ul, mul(e, 3)), mul(nOut, off));
  const j1 = add(add(top, mul(e, 8)), mul(nOut, off)); // 꼭짓점을 8 지나서 관절 1
  const j2 = [j1[0] + 20.5, j1[1] + 12.4]; // 관절 2 — 오른쪽 아래(상단 우측 변과 나란히, 위로 띄움)
  const j3 = [j2[0], j2[1] + 13.5]; // 수직 링크 끝
  const paths = [
    bar(start, j1, BOOM.w),
    circle(start[0], start[1], BOOM.w / 2),
    bar(j1, j2, BOOM.w),
    bar(j2, j3, BOOM.w3),
    // 호스 팁 — 테이퍼 사다리꼴 + 짧은 끝단
    poly([
      [j3[0] - BOOM.w3 / 2, j3[1]],
      [j3[0] + BOOM.w3 / 2, j3[1]],
      [j3[0] + 1.6, j3[1] + 9],
      [j3[0] - 1.6, j3[1] + 9],
    ]),
    poly([
      [j3[0] - 1.2, j3[1] + 9],
      [j3[0] + 1.2, j3[1] + 9],
      [j3[0] + 1.2, j3[1] + 13],
      [j3[0] - 1.2, j3[1] + 13],
    ]),
    // 관절 — 원 + 반시계 구멍(nonzero → 빈 구멍)
    circle(j1[0], j1[1], BOOM.joint) + circleCCW(j1[0], j1[1], BOOM.hole),
    circle(j2[0], j2[1], BOOM.joint) + circleCCW(j2[0], j2[1], BOOM.hole),
  ];
  return { paths, extent: { top: j1[1] - BOOM.joint, right: j2[0] + BOOM.joint, bottom: j3[1] + 13 } };
}

/** glyph — 육각 링(바깥 시계 + 안쪽 반시계) + 중앙 원, 붐은 같은 것 */
function glyphInk() {
  const outer = hexPts(HEX.cx, HEX.cy, HEX.r);
  const inner = hexPts(HEX.cx, HEX.cy, HEX.r - GLYPH.ring).reverse();
  return [poly(outer) + poly(inner), circle(HEX.cx, HEX.cy, GLYPH.dot)];
}

// ── 조립
const bm = boom();
const mark = { viewBox: `0 0 ${BOX} ${BOX}`, ink: irisBlades(), accent: bm.paths };
const glyph = { viewBox: `0 0 ${BOX} ${BOX}`, ink: glyphInk(), accent: bm.paths };
for (const [k, v] of Object.entries(bm.extent))
  if (v < 0 || v > BOX) throw new Error(`boom ${k}=${n2(v)} 가 64 박스를 벗어남`);

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const wordmark = prev.wordmark;
let lockup = null;
if (wordmark) {
  // lockup = mark + 여백(마크 높이 1/4 = 16) + wordmark(같은 64 높이 좌표계, x만 평행 이동)
  const dx = BOX + 16;
  // fontTools SVGPathPen은 절대 명령만 낸다: M L H V Q C Z — x 좌표(짝수 번째 · H)만 dx 이동
  const shift = (d) =>
    d.replace(/([MLHVQCZ])([^MLHVQCZ]*)/g, (_, c, nums) => {
      if (c === 'Z' || c === 'V') return c + nums;
      const xs = nums.trim().split(/\s+/);
      if (c === 'H') return `H${n2(+xs[0] + dx)}`;
      return c + xs.map((v, i) => (i % 2 === 0 ? n2(+v + dx) : n2(+v))).join(' ');
    });
  const w = Number(wordmark.viewBox.split(' ')[2]);
  lockup = {
    viewBox: `0 0 ${n2(dx + w)} ${BOX}`,
    ink: [...mark.ink, ...wordmark.ink.map(shift)],
    accent: [...mark.accent, ...wordmark.accent.map(shift)],
  };
}

const out = {
  $comment:
    'BoomEyes 브랜드 마크 원천 — tools/brand/mark.mjs(mark·glyph·lockup)와 tools/brand/wordmark.py(wordmark)가 생성. 손으로 고치지 않는다. ink = currentColor · accent = 붐·Eyes (DY-design §13)',
  version: 1,
  text: wordmark?.text ?? 'BoomEyes',
  font: wordmark?.font ?? null,
  mark,
  glyph,
  ...(wordmark ? { wordmark } : {}),
  ...(lockup ? { lockup } : {}),
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
const size = Buffer.byteLength(JSON.stringify(out));
console.log(
  `✓ brand: mark(ink ${mark.ink.length} · accent ${mark.accent.length}) · glyph · ${wordmark ? `wordmark(${wordmark.viewBox}) · lockup(${lockup.viewBox})` : 'wordmark 없음 — wordmark.py 먼저'} → logo.json ${size}B`,
);
