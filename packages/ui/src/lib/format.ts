// 표시 포맷 — 시간대는 Asia/Seoul 고정 (QA §3: 캡처·e2e가 러너 TZ에 좌우되지 않게)
const TZ = 'Asia/Seoul';
const DAY = 86_400_000;

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    timeZone: TZ,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

/** 기한 라벨 — 오늘 · D-n(남음) · D+n(초과). 자정 기준이 아니라 24h 단위 반올림 */
export function dueLabel(dueAt: string, now: Date): { label: string; overdue: boolean } {
  const diff = Math.round((Date.parse(dueAt) - now.getTime()) / DAY);
  if (diff === 0) return { label: '오늘', overdue: false };
  return diff > 0 ? { label: `D-${diff}`, overdue: false } : { label: `D+${-diff}`, overdue: true };
}

/** 경과 시간 — 1h 32m · 45m · 3d 2h */
export function elapsedLabel(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${mm}m`;
  return `${mm}m`;
}
