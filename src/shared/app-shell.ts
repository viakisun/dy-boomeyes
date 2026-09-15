// 역할 앱이 똑같이 하는 것들 — 카메라 조작, 알림 드롭다운, 연락, 창·키보드·호버.
// 두 앱이 같은 줄을 100줄 넘게 베끼고 있어서 한곳으로 모았다.
// 앱마다 다른 것(무슨 호기를 보고 있나, 알림이 무엇인가, 다시 그리기)은 인자로 받는다.
import { fitCameraGrid, renderFullscreen } from './camera/camera-view';
import { $ } from './dom';
import { hideStartupFailure, showNotice, showStartupFailure } from './notice';
import { renderInbox } from './panels/inbox';
import type { Alert, Unit } from './types';

export interface ShellHost {
  /** 지금 보고 있는 호기 — 없으면 null */
  currentUnit(): Unit | null;
  /** 전체 화면으로 연 카메라 번호를 담은 곳 — 앱의 view 객체를 그대로 넘긴다 */
  view: { openCamera: number | null };
  alerts(): Alert[];
  readAlerts: Set<string>;
  /** 상태가 바뀌어 화면을 다시 그려야 할 때 */
  render(): void;
}

/** 공통 동작을 배선하고, 인라인 핸들러가 부를 이름들을 돌려준다. */
export function bindShell(host: ShellHost) {
  const openCamera = (index: number) => {
    host.view.openCamera = index;
    renderFullscreen(host.currentUnit(), index);
  };
  const closeCamera = () => {
    host.view.openCamera = null;
    renderFullscreen(host.currentUnit(), null);
  };

  function toggleInbox(open?: boolean) {
    const el = $('#inbox');
    el.hidden = open != null ? !open : !el.hidden;
    if (!el.hidden) renderInbox(host.alerts(), host.readAlerts);
  }
  const markAlertRead = (id: string) => {
    host.readAlerts.add(id);
    toggleInbox(false);
  };
  const markAllAlertsRead = () => {
    host.alerts().forEach(a => host.readAlerts.add(a.id));
    renderInbox(host.alerts(), host.readAlerts);
    host.render();
  };

  const dial = (tel: string) => (location.href = 'tel:' + tel);
  const copyTel = (button: HTMLElement, tel: string) => {
    navigator.clipboard.writeText(tel).catch(() => showNotice('복사하지 못했습니다.'));
    button.textContent = '✓';
    setTimeout(() => (button.textContent = '⧉'), 1200);
  };

  new ResizeObserver(() => fitCameraGrid(host.currentUnit())).observe($('#wall'));
  addEventListener('resize', () => host.render());

  document.addEventListener('keydown', e => {
    const unit = host.currentUnit();
    const open = host.view.openCamera;
    if (open == null || !unit) return;
    const count = unit.cameras.length;
    if (e.key === 'Escape') closeCamera();
    if (e.key === 'ArrowLeft') openCamera((open + count - 1) % count);
    if (e.key === 'ArrowRight') openCamera((open + 1) % count);
  });

  document.addEventListener('click', e => {
    if (!(e.target as Element).closest('#inbox, #bell')) $('#inbox').hidden = true;
  });

  // 지도와 목록에 같은 현장·호기가 나온다. 한쪽에 올리면 양쪽이 같이 밝아진다.
  const highlight = (key: string, value: string, on: boolean) =>
    document.querySelectorAll(`[data-${key}="${value}"]`).forEach(el => el.classList.toggle('hl', on));
  const onHover = (on: boolean) => (e: Event) => {
    const target = (e.target as Element).closest<HTMLElement>('[data-site],[data-unit]');
    if (!target) return;
    if (target.dataset.site) highlight('site', target.dataset.site, on);
    if (target.dataset.unit) highlight('unit', target.dataset.unit, on);
  };
  document.addEventListener('mouseover', onHover(true));
  document.addEventListener('mouseout', onHover(false));

  return { openCamera, closeCamera, toggleInbox, markAlertRead, markAllAlertsRead, dial, copyTel };
}

/** 0이면 배지를 비운다 — 빈 문자열이라야 CSS가 점을 숨긴다 */
export const badgeText = (n: number) => (n ? String(n) : '');

/** 호기 단계는 지도 대신 카메라 벽이다. 띠·본문 클래스·벽 표시가 함께 움직인다. */
export function setUnitMode(atUnit: boolean) {
  $('#band').classList.toggle('hide', atUnit);
  document.body.className = atUnit ? 'vB' : '';
  if (!atUnit) $('#map').removeAttribute('style');
  $('#wall').hidden = !atUnit;
}

/** 부팅 — 실패하면 덮개를 띄우고 「다시 시도」로 같은 절차를 되돌린다. */
export async function startApp(load: () => Promise<void>, ready: () => void) {
  try {
    await load();
    hideStartupFailure();
    ready();
  } catch (error) {
    showStartupFailure(error, () => startApp(load, ready));
  }
}
