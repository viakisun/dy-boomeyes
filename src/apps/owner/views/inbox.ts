// 알림 드롭다운 — 서버가 만든 알림을 보여 주고, 읽음은 화면에만 남긴다.
import { $ } from '../../../shared/dom';
import { server, unreadAlertCount, view } from '../store';
import type { Alert } from '../../../shared/types';

function alertRow(alert: Alert): string {
  const jump =
    alert.unitNumber != null ? `openUnit('${alert.siteId}',${alert.unitNumber})` : `openSite('${alert.siteId}')`;
  const head = alert.unitNumber != null ? `${alert.unitNumber}호기 ` : '';
  const detail = alert.unitNumber != null ? `${alert.siteName} · ${alert.detail}` : alert.detail;
  return (
    `<div class="ev ${alert.kind} ${view.readAlerts.has(alert.id) ? 'read' : ''}" ` +
    `onclick="markAlertRead('${alert.id}');${jump}">` +
    `<span class="d"></span>` +
    `<div><div class="nm">${head}<span>${alert.title}</span></div>` +
    `<div class="sub">${detail}</div></div>` +
    `<span class="t">${alert.at}</span></div>`
  );
}

export function renderInbox() {
  $('#inbox').innerHTML =
    `<header><h2>알림<small>미확인 ${unreadAlertCount()}</small></h2>` +
    `<button onclick="markAllAlertsRead()">모두 읽음</button></header>` +
    `<div class="list">${server.alerts.map(alertRow).join('')}</div>` +
    `<footer>읽음은 확인 표시입니다. 장비 문제의 해소는 상태가 정상으로 바뀔 때 기록됩니다.</footer>`;
}
