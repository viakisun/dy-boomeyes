// 현장 단계 좌측 카드 — 호기 목록과 접어 둔 계약·담당자.
import { COLOR, ORDER, UNIT_MSG } from '../ui';
import { state } from '../store';
import type { Site, Unit } from '../types';

function unitRow(s: Site, u: Unit): string {
  const aiN = u.ai.filter(e => e.lvl === 'warn').length;
  const code = `<span style="font:400 11px var(--mono);color:var(--ink3);margin-left:4px">${u.code}</span>`;
  return (
    `<div class="row ${state.unitNum === u.num ? 'on' : ''}" data-unit="${u.num}" onclick="go('unit','${s.id}',${u.num})">` +
    `<div><div class="nm">${u.num}호기 ${code}${aiN ? `<span class="aichip">AI ${aiN}</span>` : ''}</div>` +
    `<div class="sub"><em style="color:${COLOR[u.st]}">${UNIT_MSG[u.st]}</em></div></div>` +
    `<div class="cnt ${u.st === 'late' ? 'late' : ''}">${u.recv.replace('마지막 수신 ', '')}</div></div>`
  );
}

/** 계약과 담당자는 현장마다 고정이라 카드 맨 아래 한 줄로 접어 둔다. */
export function contractFold(s: Site): string {
  if (s.st === 'store') return '';
  return (
    `<details><summary><span>${s.builder} · 종료까지 D-${s.dday} · ${s.mgr} ☏</span><span class="chev"></span></summary>` +
    `<div class="sec" style="border-bottom:0">` +
    `<div class="dates"><span>${s.start}</span><span>${s.end}</span></div>` +
    `<div class="bar"><i style="width:${s.prog * 100}%"></i><b style="left:${s.prog * 100}%"></b></div>` +
    `<div class="call"><button onclick="call('${s.tel}')">☏ ${s.mgr} · ${s.tel}</button>` +
    `<button class="ic" title="복사" onclick="copyTel(this,'${s.tel}')">⧉</button></div>` +
    `</div></details>`
  );
}

export function siteCard(s: Site): string {
  const units = [...s.units].sort((a, b) => ORDER[a.st] - ORDER[b.st] || a.num - b.num);
  return (
    `<header><h2>호기<small>${units.length}대</small></h2>` +
    `<a href="#" onclick="goTab('fleet');return false">보유 장비에서 보기</a></header>` +
    `<div class="body">${units.map(u => unitRow(s, u)).join('')}</div>${contractFold(s)}`
  );
}
