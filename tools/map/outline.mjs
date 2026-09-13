#!/usr/bin/env node
// 전국 단계 경계선 지도의 원천 데이터 생성 — 손으로 돌린다(네트워크 필요, 게이트 아님).
//
//   node tools/map/outline.mjs
//
// 원천: world-atlas 2.0.2 countries-50m.json(Natural Earth 1:50m, public domain).
// 한반도 주변 상자로 잘라 5개국(한국·북한·일본·중국·러시아)만 남기고 좌표를 3자리로 줄인다
// — 전국 배율(줌 7)에서 그 이상은 화면에 나타나지 않는다. 결과는 packages/map/src/korea-region.json.
import { writeFileSync } from 'node:fs';
const SRC = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json';
const OUT = new URL('../../packages/map/src/korea-region.json', import.meta.url);
const BOX = { w: 119, s: 28, e: 142, n: 46 };
const MIN_AREA = 0.0006; // 도² ≈ 6 km² — 전국 배율에서 한 점에도 못 미치는 섬

const topo = await fetch(SRC).then((r) => r.json());
const {
  scale: [sx, sy],
  translate: [tx, ty],
} = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});
// TopoJSON 호 인덱스 → 좌표 고리. 음수는 그 호를 뒤집어 쓴다는 뜻(~i).
const ringOf = (idx) => {
  const out = [];
  for (const i of idx) {
    const arc = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    out.push(...(out.length ? arc.slice(1) : arc));
  }
  return out;
};
const inside = (p, edge) =>
  edge === 'w' ? p[0] >= BOX.w : edge === 'e' ? p[0] <= BOX.e : edge === 's' ? p[1] >= BOX.s : p[1] <= BOX.n;
const cut = (a, b, edge) => {
  const [v, i] = edge === 'w' ? [BOX.w, 0] : edge === 'e' ? [BOX.e, 0] : edge === 's' ? [BOX.s, 1] : [BOX.n, 1];
  const t = (v - a[i]) / (b[i] - a[i]);
  return i === 0 ? [v, a[1] + t * (b[1] - a[1])] : [a[0] + t * (b[0] - a[0]), v];
};
// Sutherland–Hodgman — 직사각형은 볼록이라 네 변을 차례로 잘라도 고리가 깨지지 않는다.
const clip = (ring) => {
  let poly = ring;
  for (const edge of ['w', 'e', 's', 'n']) {
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[(i + poly.length - 1) % poly.length];
      const b = poly[i];
      const ai = inside(a, edge);
      const bi = inside(b, edge);
      if (bi) {
        if (!ai) next.push(cut(a, b, edge));
        next.push(b);
      } else if (ai) next.push(cut(a, b, edge));
    }
    poly = next;
    if (!poly.length) return [];
  }
  return poly;
};
const round = (ring) => {
  const out = [];
  for (const [x, y] of ring) {
    const p = [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];
    if (!out.length || out.at(-1)[0] !== p[0] || out.at(-1)[1] !== p[1]) out.push(p);
  }
  if (out.length && (out[0][0] !== out.at(-1)[0] || out[0][1] !== out.at(-1)[1])) out.push(out[0]);
  return out.length >= 4 ? out : null;
};
const area = (ring) => {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a) / 2;
};
const features = [];
for (const geom of topo.objects.countries.geometries) {
  const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.type === 'MultiPolygon' ? geom.arcs : [];
  const kept = [];
  for (const poly of polys) {
    const rings = poly.map((r) => round(clip(ringOf(r)))).filter((r) => r && area(r) >= MIN_AREA);
    if (rings.length) kept.push(rings);
  }
  if (kept.length)
    features.push({
      type: 'Feature',
      id: geom.id,
      properties: { iso: geom.id, name: geom.properties?.name ?? '' },
      geometry: { type: 'MultiPolygon', coordinates: kept },
    });
}
const fc = { type: 'FeatureCollection', features };
writeFileSync(OUT, JSON.stringify(fc) + '\n');
console.log(
  `✓ map outline: ${features.length}개국(${features.map((f) => f.properties.name).join(' · ')}) · ${Math.round(JSON.stringify(fc).length / 1024)} KB → packages/map/src/korea-region.json`,
);
