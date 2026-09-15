// 알림 드롭다운 — 서버가 만든 알림 목록을 보여 주고, 읽음은 화면에만 남긴다.
import { $ } from '../ui';
import { db, state } from '../store';
import type { Alert } from '../types';

export const unreadCount = () => db.alerts.filter(a => !state.read.has(a.id)).length;

function row(a: Alert): string {
  const jump = a.unitNum != null ? `go('unit','${a.siteId}',${a.unitNum})` : `go('site','${a.siteId}')`;
  const head = a.unitNum != null ? `${a.unitNum}호기 ` : '';
  const sub = a.unitNum != null ? `${a.siteName} · ${a.sub}` : a.sub;
  return (
    `<div class="ev ${a.kind} ${state.read.has(a.id) ? 'read' : ''}" onclick="readAlert('${a.id}');${jump}">` +
    `<span class="d"></span>` +
    `<div><div class="nm">${head}<span>${a.title}</span></div><div class="sub">${sub}</div></div>` +
    `<span class="t">${a.t}</span></div>`
  );
}

export function renderInbox() {
  $('#inbox').innerHTML =
    `<header><h2>알림<small>미확인 ${unreadCount()}</small></h2>` +
    `<button onclick="readAllAlerts()">모두 읽음</button></header>` +
    `<div class="list">${db.alerts.map(row).join('')}</div>` +
    `<footer>읽음은 확인 표시입니다. 장비 문제의 해소는 상태가 정상으로 바뀔 때 기록됩니다.</footer>`;
}
