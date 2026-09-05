// 운영 규칙 상수 — 원천 ssot entities.rules ("에스컬레이션 · 알림")
/** 중대 업무 미접수 에스컬레이션 임계 — "임계 1시간(협의)" (DISC-036 확정 전 기본값) */
export const ESCALATE_AFTER_MS = 60 * 60 * 1000;

/** 출근 체크인 현장 반경(m) — 시드 상수, SSOT 미정(DISC 후보) */
export const CHECKIN_RADIUS_M = 200;

/** 일일점검 항목 5 — DISC-033(일일점검 기준) 확정 전 임시 */
export const INSPECTION_ITEMS: readonly { id: string; label: string }[] = [
  { id: 'oil', label: '유압 오일 · 누유' },
  { id: 'boom', label: '붐 핀 · 와이어 · 호스' },
  { id: 'pipe', label: '수송관 · 클램프 체결' },
  { id: 'outrigger', label: '아웃트리거 · 지반' },
  { id: 'estop', label: '비상정지 · 경광등' },
];

/** 두 좌표 사이 거리(m) — 하버사인 */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
