// 화면 좌표에서 겹치는 마커를 픽셀 오프셋으로 펼친다 — 좌표는 그대로, 시각만 분리. 확대해 실제 간격이 벌어지면 자연히 풀린다(클러스터링은 W1+).
export const FAN_PX = 56;
export type FanAxis = 'x' | 'y';

/** id → 픽셀 오프셋. near px 안에 겹치는 점을 묶고, 묶음 안에서 id 순으로 축(axis) 방향 대칭 배치 */
export function fanOffsets(
  points: readonly { id: string; x: number; y: number }[],
  step = FAN_PX,
  near = 24,
  axis: FanAxis = 'x',
): Map<string, { x: number; y: number }> {
  const clusters: { x: number; y: number; ids: string[] }[] = [];
  for (const p of [...points].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    const c = clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) <= near);
    if (c) c.ids.push(p.id);
    else clusters.push({ x: p.x, y: p.y, ids: [p.id] });
  }
  const off = new Map<string, { x: number; y: number }>();
  for (const c of clusters)
    c.ids.forEach((id, i) => {
      const d = (i - (c.ids.length - 1) / 2) * step;
      off.set(id, axis === 'x' ? { x: d, y: 0 } : { x: 0, y: d });
    });
  return off;
}

/** 알약(현장·지역)처럼 폭이 넓은 마커의 상자 겹침을 푼다 — 겹치는 쌍마다 덜 밀어도 되는 축(세로 우선, 옆으로 나란하면 가로)으로 반씩, 결정적 반복. id → {x,y} 오프셋 */
export function resolveOverlaps(
  points: readonly { id: string; x: number; y: number }[],
  size: { w: number; h: number },
  iterations = 8,
): Map<string, { x: number; y: number }> {
  const pos = [...points]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((p) => ({ id: p.id, x0: p.x, x: p.x, y0: p.y, y: p.y }));
  for (let n = 0; n < iterations; n++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i]!;
        const b = pos[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) >= size.w || Math.abs(dy) >= size.h) continue;
        const overlapX = size.w - Math.abs(dx);
        const overlapY = size.h - Math.abs(dy);
        if (overlapY <= overlapX) {
          const push = overlapY / 2;
          a.y -= dy >= 0 ? push : -push;
          b.y += dy >= 0 ? push : -push;
        } else {
          const push = overlapX / 2;
          a.x -= dx >= 0 ? push : -push;
          b.x += dx >= 0 ? push : -push;
        }
        moved = true;
      }
    if (!moved) break;
  }
  return new Map(pos.map((p) => [p.id, { x: p.x - p.x0, y: p.y - p.y0 }]));
}
