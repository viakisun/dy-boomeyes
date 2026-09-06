// 내비 아이콘 — 화면 ID → lucide 컴포넌트 (DY-design §11.5 매핑). Record<ScrId, …>라 화면이 늘면 여기서 컴파일 오류로 드러난다
import type { Component } from 'svelte';
import type { ScrId } from '@boomeyes/domain';
import Bell from '@lucide/svelte/icons/bell';
import CalendarCheck from '@lucide/svelte/icons/calendar-check';
import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
import ClipboardList from '@lucide/svelte/icons/clipboard-list';
import FileCodeCorner from '@lucide/svelte/icons/file-code-corner';
import FilePenLine from '@lucide/svelte/icons/file-pen-line';
import FileText from '@lucide/svelte/icons/file-text';
import Inbox from '@lucide/svelte/icons/inbox';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import LogIn from '@lucide/svelte/icons/log-in';
import MapIcon from '@lucide/svelte/icons/map';
import MapPin from '@lucide/svelte/icons/map-pin';
import Menu from '@lucide/svelte/icons/menu';
import Monitor from '@lucide/svelte/icons/monitor';
import Presentation from '@lucide/svelte/icons/presentation';
import RotateCcwClock from '@lucide/svelte/icons/rotate-ccw-clock';
import ScrollText from '@lucide/svelte/icons/scroll-text';
import Siren from '@lucide/svelte/icons/siren';
import Truck from '@lucide/svelte/icons/truck';
import Users from '@lucide/svelte/icons/users';
import Wrench from '@lucide/svelte/icons/wrench';

export const NAV_ICON: Record<ScrId, Component> = {
  // A1 현장 안전관리자
  'A1-01': LogIn,
  'A1-02': Inbox,
  'A1-03': ClipboardList,
  'A1-04': Monitor,
  'A1-05': Truck,
  'A1-06': ScrollText,
  'A1-07': Menu,
  'A1-08': ClipboardList,
  'A1-11': ClipboardCheck,
  // A2 운전자
  'A2-01': LogIn,
  'A2-02': CalendarCheck,
  'A2-03': ClipboardCheck,
  'A2-04': Truck,
  'A2-05': FileText,
  'A2-06': Menu,
  'A2-09': Wrench,
  // A3 본사 안전관리자
  'A3-01': LogIn,
  'A3-02': MapPin,
  'A3-03': MapPin,
  'A3-04': Monitor,
  'A3-05': ClipboardList,
  'A3-06': ScrollText,
  // A4 사업주
  'A4-01': LogIn,
  'A4-02': Truck,
  'A4-03': Inbox,
  'A4-04': Users,
  'A4-05': FilePenLine,
  'A4-06': FileText,
  // B0 로그인
  'B0-01': LogIn,
  // B1 운영사 관제
  'B1-02': LayoutDashboard,
  'B1-02M': Monitor,
  'B1-03': Inbox,
  'B1-04': Siren,
  'B1-05': FileText,
  'B1-06': FilePenLine,
  'B1-07': Presentation,
  'B1-08': RotateCcwClock,
  // B2 건설사 본사
  'B2-02': MapIcon,
  'B2-03': MapPin,
  'B2-04': Presentation,
  // B3 현장 안전관리자 웹
  'B3-02': Monitor,
  'B3-03': ClipboardList,
  'B3-04': FileText,
  'B3-05': ScrollText,
  'B3-06': Presentation,
  'B3-07': Wrench,
  // B4 관리자
  'B4-02': FileCodeCorner,
  'B4-03': Truck,
  'B4-04': Users,
  'B4-05': Bell,
  'B4-06': FileText,
  'B4-07': Wrench,
  'B4-08': ClipboardCheck,
};
