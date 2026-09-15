// 알림 드롭다운 — 서버가 만든 알림을 보여 준다. 읽음은 앱이 들고 있는 집합에 남는다.
import { $ } from '../dom';
import type { Alert } from '../types';

function alertRow(alert: Alert, read: Set<string>): string {
  const jump =
    alert.unitNumber != null ? `openUnit('${alert.siteId}',${alert.unitNumber})` : `openSite('${alert.siteId}')`;
  const head = alert.unitNumber != null ? `${alert.unitNumber}호기 ` : '';
  const detail = alert.unitNumber != null ? `${alert.siteName} · ${alert.detail}` : alert.detail;
  return (
    `<div class="ev ${alert.kind} ${read.has(alert.id) ? 'read' : ''}" ` +
    `onclick="markAlertRead('${alert.id}');${jump}">` +
    `<span class="d"></span>` +
    `<div><div class="nm">${head}<span>${alert.title}</span></div>` +
    `<div class="sub">${detail}</div></div>` +
    `<span class="t">${alert.at}</span></div>`
  );
}

export function renderInbox(alerts: Alert[], read: Set<string>) {
  const unread = alerts.filter(a => !read.has(a.id)).length;
  $('#inbox').innerHTML =
    `<header><h2>알림<small>미확인 ${unread}</small></h2>` +
    `<button onclick="markAllAlertsRead()">모두 읽음</button></header>` +
    `<div class="list">${alerts.map(a => alertRow(a, read)).join('')}</div>` +
    `<footer>읽음은 확인 표시입니다. 장비 문제의 해소는 상태가 정상으로 바뀔 때 기록됩니다.</footer>`;
}
