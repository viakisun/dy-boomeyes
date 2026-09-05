// 연결 상태 — navigator.onLine + window online/offline 이벤트 (오프라인 배너 · 제출 보류). 화면은 `connectivity.online`만 읽는다
export const connectivity = $state({ online: typeof navigator === 'undefined' ? true : navigator.onLine });
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => (connectivity.online = true));
  window.addEventListener('offline', () => (connectivity.online = false));
}
