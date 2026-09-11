/** 기간 진행 — PeriodBar의 순수 계산. now는 DemoClock(data.at). */
const DAY = 86_400_000;
export function periodProgress(
  start: string,
  end: string,
  now: string,
): { pct: number; state: 'before' | 'during' | 'after'; remainingDays: number } {
  const s = Date.parse(start);
  const e = Date.parse(end);
  const n = Date.parse(now);
  const remainingDays = Math.round((e - n) / DAY);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return { pct: 0, state: 'before', remainingDays };
  if (n < s) return { pct: 0, state: 'before', remainingDays };
  if (n > e) return { pct: 100, state: 'after', remainingDays };
  return { pct: Math.round(((n - s) / (e - s)) * 100), state: 'during', remainingDays };
}
/** 마커 위치(%) — 기간 밖이면 null */
export function periodPosition(at: string, start: string, end: string): number | null {
  const s = Date.parse(start);
  const e = Date.parse(end);
  const a = Date.parse(at);
  if (!Number.isFinite(a) || e <= s || a < s || a > e) return null;
  return Math.round(((a - s) / (e - s)) * 100);
}
