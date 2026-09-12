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
