// 상단 크럼과 상태 띠 — 어느 단계에서나 같은 자리에 있는 것들.
import { $, LABEL } from '../ui';
import { allUnits, curSite, curUnit, state } from '../store';
import type { Status, Unit } from '../types';

export function renderCrumb() {
  const s = curSite(),
    u = curUnit();
  let h = state.level === 'nation' ? `<b>전국</b>` : `<button onclick="go('nation')">전국</button>`;
  if (s && state.level !== 'nation')
    h +=
      state.level === 'site'
        ? `<span class="sep">›</span><b>${s.name}</b>`
        : `<span class="sep">›</span><button onclick="go('site','${s.id}')">${s.name}</button>`;
  if (u && state.level === 'unit') h += `<span class="sep">›</span><b>${u.num}호기</b>`;
  $('#crumb').innerHTML = h;
}

export function renderBand() {
  const s = curSite();
  const units: Unit[] = state.level === 'nation' ? allUnits().map(r => r.u) : s!.units;
  const c = (st: Status) => units.filter(u => u.st === st).length;
  const head = state.level === 'nation' ? '보유 장비' : s!.st === 'store' ? '보관 장비' : '투입 호기';
  const cells: [string, number, string][] = [
    ['total', units.length, head],
    ['', c('run'), '가동 중'],
    ['fault', c('fault'), LABEL.fault],
    ['check', c('check'), LABEL.check],
    ['late', c('late'), LABEL.late],
    ['dim', c('store'), LABEL.store],
  ];
  $('#band').innerHTML = cells
    .filter(([k, n]) => k === 'total' || k === '' || n > 0)
    .map(([k, n, l]) => `<div class="cell ${k}"><b>${n}</b>${l}</div>`)
    .join('');
}
