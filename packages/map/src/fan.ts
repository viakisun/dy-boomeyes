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

/**
 * 원형 마커의 겹침을 푼다 — 중심 거리가 `min`이 될 때까지 서로 밀어내고, 매 회 원래 좌표로
 * 조금씩 되당긴다(시안 «운영 현황 목업»의 방식). 상자가 아니라 거리로 밀기 때문에 라벨 길이가
 * 배치를 바꾸지 않고, 되당김이 있어 밀린 마커가 실제 좌표 근처에 머문다.
 * 결정적이다 — 같은 입력이면 같은 오프셋(캡처·시험이 흔들리지 않는다).
 */
export function spreadCircles(
  points: readonly { id: string; x: number; y: number }[],
  min: number,
  iterations = 80,
  pull = 0.05,
): Map<string, { x: number; y: number }> {
  const pos = [...points]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((p) => ({ id: p.id, x0: p.x, x: p.x, y0: p.y, y: p.y }));
  for (let n = 0; n < iterations; n++) {
    // 되당김이 먼저, 밀어내기가 나중 — 순서를 뒤집으면 마지막 되당김이 간격을 min 밑으로 다시 줄인다
    for (const p of pos) {
      p.x += (p.x0 - p.x) * pull;
      p.y += (p.y0 - p.y) * pull;
    }
    let moved = false;
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) {
        const a = pos[i]!;
        const b = pos[j]!;
        const dx = b.x - a.x;
        let dy = b.y - a.y;
        // 완전히 겹친 두 점은 밀 방향이 없다 — id 순서로 가른다(난수를 쓰면 캡처가 흔들린다)
        if (dx === 0 && dy === 0) dy = j % 2 === 0 ? 0.01 : -0.01;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= min) continue;
        const push = (min - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
        moved = true;
      }
    if (!moved) break;
  }
  return new Map(pos.map((p) => [p.id, { x: p.x - p.x0, y: p.y - p.y0 }]));
}
