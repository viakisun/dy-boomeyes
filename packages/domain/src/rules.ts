// 운영 규칙 상수 — 원천 ssot entities.rules ("에스컬레이션 · 알림")
import type { Device } from './types';
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

/** 텔레메트리 수신 임계 — NFR-009 "기준값 협의" 전 목업 기준안 10분 (참고자료 v5.0 §10) */
export const TELEMETRY_STALE_MS = 10 * 60 * 1000;
export type TelemetryStatus = 'ok' | 'stale' | 'offline';
/** 수신 상태 — LTE 두절이면 offline, 마지막 수신이 임계를 넘으면 stale (FR-034: 옛 값을 정상처럼 두지 않는다) */
export function telemetryStatus(t: Pick<Device['telemetry'], 'at' | 'lte'>, now: Date): TelemetryStatus {
  if (t.lte === 'lost') return 'offline';
  return now.getTime() - Date.parse(t.at) > TELEMETRY_STALE_MS ? 'stale' : 'ok';
}
