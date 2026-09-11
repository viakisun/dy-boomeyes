import { ownerHref, ownerPath, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
import { FOCUS } from '../lib/cx';

export const ownerControl = (app: OwnerApp) =>
  `${FOCUS} min-h-size-touch-min ${app === 'pwa' ? 'min-h-size-control-md' : ''}`;
export const ownerLink = (app: OwnerApp) =>
  `${ownerControl(app)} inline-flex items-center justify-center gap-inline-sm rounded-control px-inset-md py-inset-sm text-body-md text-accent-fg hover:bg-accent-bg`;

export function ownerDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '날짜 미등록'
    : date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function equipmentCondition(device: OwnerDevice) {
  if (device.fault) return { label: device.fault, tone: 'danger' as const };
  if (device.inspection) return { label: device.inspection, tone: 'warning' as const };
  if (device.connection === 'stale') return { label: '수신 지연', tone: 'warning' as const };
  if (device.connection === 'detached') return { label: '단말기 미장착', tone: 'neutral' as const };
  if (device.connection === 'unintegrated') return { label: '미연동', tone: 'neutral' as const };
  return { label: '이상 신호 없음', tone: 'neutral' as const };
}

/** 외부·다른 앱 경로는 복귀 대상으로 사용하지 않는다. */
export function fleetReturn(url: URL, app: OwnerApp) {
  const fallback = ownerHref(url, 'fleet', app);
  const value = url.searchParams.get('return');
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const target = new URL(value, url.origin);
    return target.origin === url.origin && target.pathname === ownerPath('fleet', app)
      ? target.pathname + target.search + target.hash
      : fallback;
  } catch {
    return fallback;
  }
}

export function listReturn(url: URL) {
  const target = new URL(url);
  target.searchParams.delete('return');
  if (typeof document !== 'undefined') {
    const scroller = document.querySelector<HTMLElement>('[data-owner-scroll]');
    const top = Math.max(scroller?.scrollTop ?? 0, window.scrollY);
    target.searchParams.set('scroll', String(Math.round(top)));
  }
  return target.pathname + target.search;
}
