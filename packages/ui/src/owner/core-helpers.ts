import { ownerHref, ownerPath, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
import { FOCUS } from '../lib/cx';

export const ownerControl = () => `${FOCUS} min-h-size-touch-min min-h-size-control-md`;
export const ownerLink = () =>
  `${ownerControl()} inline-flex items-center justify-center gap-inline-sm rounded-control px-inset-md py-inset-sm text-body-md text-accent-fg hover:bg-accent-bg`;

/** 계약·운전자는 한 갈래다 — 메뉴는 셋뿐이므로 명단은 계약 화면 옆에서 연다(시안 «확정 2026-09-12»). */
export const OWNER_CONTRACT_TABS = [
  { view: 'requests', label: '요청' },
  { view: 'drivers', label: '운전자' },
  { view: 'driver-docs', label: '운전자 서류' },
] as const;

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
  // 정상은 success — 이상만 색을 갖는 화면에서 '정상'이 읽히지 않았다(2026-09-12 결정 · ADR-014 · 원칙 4 개정)
  return { label: '이상 신호 없음', tone: 'success' as const };
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

import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import Radio from '@lucide/svelte/icons/radio';
import UserRoundSearch from '@lucide/svelte/icons/user-round-search';
import Wrench from '@lucide/svelte/icons/wrench';
import CalendarClock from '@lucide/svelte/icons/calendar-clock';
import IdCard from '@lucide/svelte/icons/id-card';
/** 알림 종류 → 아이콘(lucide) — AlertCard · 알림 상세 헤더 */
export const OWNER_ALERT_ICON = {
  fault: TriangleAlert,
  inspection: ClipboardCheck,
  connection: Radio,
  ai: UserRoundSearch,
  part: Wrench,
  lease: CalendarClock,
  license: IdCard,
} as const;
/** 장비의 대표 스틸 — 수신 중인 카메라 poster가 있을 때만(없으면 IconTile) */
export const devicePoster = (cameras: { deviceId: string; available: boolean; poster: string }[], deviceId: string) =>
  cameras.find((c) => c.deviceId === deviceId && c.available)?.poster ?? null;
