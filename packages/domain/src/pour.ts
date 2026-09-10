// 타설량 산출(FR-039) — DISC-055 확정 전 기준안. 상수·산식은 이 파일 1곳(화면은 숫자를 갖지 않는다).
// 모델: 서버 집계 시간 버킷(ADR-013) — 원시 타수·Δt는 싣지 않는다. 시각 산술은 UTC ms만(setHours 금지 · 캡처 결정성).
import type { PourBucket, PourSeries } from './types';

/** 수송관 D125 내경(m) — 규격별 단면적 기준값은 DISC-055 ask */
export const PIPE_D125_M = 0.125;
/** 단면적 A = π(D/2)² ≈ 0.01227 m² (경진대회 자료 "A≈0.0123") */
export const PIPE_AREA_M2 = Math.PI * (PIPE_D125_M / 2) ** 2;
/** 진동 센서 S1–S2 간 거리 L(m) — 가정값, 실차 적용(STEP4) 시 확정 */
export const SENSOR_GAP_M = 1.5;
/** 집계 버킷 = 1시간 */
export const BUCKET_MS = 3_600_000;
/** 가동률 분모 — 작업 시간대 KST 07~17시 버킷(11개/일). 야간 0은 가동률에 넣지 않는다(기준안) */
export const WORK_WINDOW = { tzOffsetH: 9, fromH: 7, toH: 18 } as const;

/** 유속 v = L/Δt (m/s) — Δt: S1→S2 통과 시간(초) */
export const pourVelocity = (dtSec: number) => SENSOR_GAP_M / dtSec;
/** 순간 토출량 Q = v×A (m³/h) */
export const pourRateM3h = (dtSec: number) => pourVelocity(dtSec) * PIPE_AREA_M2 * 3600;

/** 버킷 시작 — UTC 정시 내림. KST 오프셋이 정수 시간이라 KST 정시와 같다 */
export function bucketStart(at: string | Date, bucketMs = BUCKET_MS): string {
  const t = typeof at === 'string' ? Date.parse(at) : at.getTime();
  return new Date(Math.floor(t / bucketMs) * bucketMs).toISOString();
}
/** 버킷이 작업 시간대(KST)인가 — 시간대 API 없이 정수 산술 */
export function inWorkWindow(at: string): boolean {
  const h = (new Date(at).getUTCHours() + WORK_WINDOW.tzOffsetH) % 24;
  return h >= WORK_WINDOW.fromH && h < WORK_WINDOW.toH;
}
/** 합계(소수 1자리)·가동률(소수 3자리) — 가동률 = 타설 버킷(m3>0) ÷ 작업 시간대 버킷, 분모 0이면 0 */
export function pourSummary(buckets: PourBucket[]): { totalM3: number; utilization: number } {
  const totalM3 = Math.round(buckets.reduce((s, b) => s + b.m3, 0) * 10) / 10;
  const work = buckets.filter((b) => inWorkWindow(b.at));
  const active = work.filter((b) => b.m3 > 0).length;
  return { totalM3, utilization: work.length ? Math.round((active / work.length) * 1000) / 1000 : 0 };
}
/** 시계열 조립 — now가 속한 버킷까지 최근 m3.length개(오래된 것부터). m3는 호출부 리터럴(시드 결정성) */
export function pourSeries(now: string | Date, m3: number[], extra: { cumulativeM3: number }): PourSeries {
  const end = Date.parse(bucketStart(now));
  const buckets = m3.map((v, i) => ({ at: new Date(end - (m3.length - 1 - i) * BUCKET_MS).toISOString(), m3: v }));
  return {
    basis: {
      pipeDiaMm: PIPE_D125_M * 1000,
      areaM2: Math.round(PIPE_AREA_M2 * 1e4) / 1e4,
      sensorGapM: SENSOR_GAP_M,
      bucketMs: BUCKET_MS,
    },
    buckets,
    ...pourSummary(buckets),
    cumulativeM3: extra.cumulativeM3,
  };
}
