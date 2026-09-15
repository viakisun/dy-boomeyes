// 현장 단계 좌측 카드 — 호기 목록과 접어 둔 계약·담당자.
import { STATUS_COLOR, STATUS_NOTE, STATUS_ORDER } from '../../../shared/labels';
import { view } from '../store';
import type { Site, Unit } from '../../../shared/types';

function unitRow(site: Site, unit: Unit): string {
  const warnCount = unit.aiEvents.filter(e => e.level === 'warn').length;
  const code = `<span style="font:400 11px var(--mono);color:var(--ink3);margin-left:4px">${unit.code}</span>`;
  return (
    `<div class="row ${view.unitNumber === unit.number ? 'on' : ''}" data-unit="${unit.number}" ` +
    `onclick="openUnit('${site.id}',${unit.number})">` +
    `<div><div class="nm">${unit.number}호기 ${code}` +
    `${warnCount ? `<span class="aichip">AI ${warnCount}</span>` : ''}</div>` +
    `<div class="sub"><em style="color:${STATUS_COLOR[unit.status]}">${STATUS_NOTE[unit.status]}</em></div></div>` +
    `<div class="cnt ${unit.status === 'late' ? 'late' : ''}">` +
    `${unit.lastSeen.replace('마지막 수신 ', '')}</div></div>`
  );
}

/** 계약과 담당자는 현장마다 고정이라 카드 맨 아래 한 줄로 접어 둔다. */
export function contractSection(site: Site): string {
  if (site.status === 'store') return '';
  const percent = site.progress * 100;
  return (
    `<details><summary><span>${site.builder} · 종료까지 D-${site.daysToEnd} · ${site.manager} ☏</span>` +
    `<span class="chev"></span></summary>` +
    `<div class="sec" style="border-bottom:0">` +
    `<div class="dates"><span>${site.contractStart}</span><span>${site.contractEnd}</span></div>` +
    `<div class="bar"><i style="width:${percent}%"></i><b style="left:${percent}%"></b></div>` +
    `<div class="call"><button onclick="dial('${site.managerTel}')">☏ ${site.manager} · ${site.managerTel}</button>` +
    `<button class="ic" title="복사" onclick="copyTel(this,'${site.managerTel}')">⧉</button></div>` +
    `</div></details>`
  );
}

export function sitePanel(site: Site): string {
  const units = [...site.units].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.number - b.number);
  return (
    `<header><h2>호기<small>${units.length}대</small></h2>` +
    `<a href="#" onclick="openTab('fleet');return false">보유 장비에서 보기</a></header>` +
    `<div class="body">${units.map(u => unitRow(site, u)).join('')}</div>${contractSection(site)}`
  );
}
