// PWA 알림(ADR-009 · specs/notifications) — 권한 상태 · 요청은 사용자 행동(종 아이콘 → 시트)에서만 · 표시는 SW registration.showNotification(dev는 new Notification 폴백)
import type { PushPayload } from '@boomeyes/domain';

export type PushPermission = 'unsupported' | 'default' | 'granted' | 'denied';
const supported = () => typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
const read = (): PushPermission => (supported() ? (Notification.permission as PushPermission) : 'unsupported');
export const push = $state<{ permission: PushPermission }>({ permission: read() });

/** 권한 요청 — 자동 프롬프트 금지(ADR-009 Rules). headless 브라우저는 자동 거부한다 */
export async function requestPush(): Promise<PushPermission> {
  if (!supported()) return (push.permission = 'unsupported');
  push.permission = (await Notification.requestPermission()) as PushPermission;
  return push.permission;
}

/** 실시간 알림 → 기기 알림. granted가 아니면 아무것도 하지 않는다(인앱 배지·토스트는 별도) */
export async function notify(p: PushPayload): Promise<boolean> {
  if (push.permission !== 'granted') return false;
  const options = { body: p.body, tag: p.tag, data: { url: p.url } };
  const reg = await navigator.serviceWorker.getRegistration(); // ready는 dev(SW 미등록)에서 영원히 대기한다
  if (reg) await reg.showNotification(p.title, options);
  else new Notification(p.title, options); // dev 폴백
  return true;
}
