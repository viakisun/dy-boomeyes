// 실패를 화면에 드러낸다. 콘솔에만 남기면 사용자는 아무 일도 없었다고 여긴다.
import { $ } from './dom';
import { HttpError } from './http-error';

/** status별로 사람이 읽을 문구를 고른다 */
export function describe(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 0) return '서버에 닿지 못했습니다. 연결을 확인해 주세요.';
    if (error.status === 404) return '찾을 수 없습니다. 목록을 새로 고쳐 주세요.';
    if (error.status === 409) return '다른 곳에서 먼저 처리됐습니다. 목록을 새로 고쳐 주세요.';
    if (error.status === 400) return '보낸 내용이 올바르지 않습니다.';
    if (error.status >= 500) return '서버에 문제가 있습니다. 잠시 뒤 다시 시도해 주세요.';
  }
  return '처리하지 못했습니다.';
}

let hideTimer = 0;

/** 잠깐 떴다 사라지는 알림 */
export function showNotice(message: string, tone: 'error' | 'ok' = 'error') {
  const el = $('#notice');
  el.className = 'notice ' + tone;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => (el.hidden = true), 5000);
}

/** 앱이 아예 뜨지 못했을 때 — 다시 시도 단추와 함께 화면을 덮는다 */
export function showStartupFailure(error: unknown, retry: () => void) {
  const el = $('#startup');
  el.innerHTML =
    `<div><h1>화면을 불러오지 못했습니다</h1>` +
    `<p>${describe(error)}</p>` +
    `<button type="button">다시 시도</button></div>`;
  el.querySelector('button')!.addEventListener('click', retry);
  el.hidden = false;
}

export const hideStartupFailure = () => ($('#startup').hidden = true);
