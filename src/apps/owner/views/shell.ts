// 화면 껍데기 — 어느 단계에서나 같은 자리에 있는 크럼과 상태 띠.
import { $ } from '../../../shared/dom';
import { STATUS_LABEL } from '../../../shared/labels';
import { allUnitsWithSite, currentSite, currentUnit, view } from '../store';
import type { EquipmentStatus, Unit } from '../../../shared/types';

export function renderBreadcrumb() {
  const site = currentSite(),
    unit = currentUnit();
  const parts = [view.level === 'nation' ? `<b>전국</b>` : `<button onclick="openNation()">전국</button>`];
  if (site && view.level !== 'nation')
    parts.push(
      view.level === 'site'
        ? `<span class="sep">›</span><b>${site.name}</b>`
        : `<span class="sep">›</span><button onclick="openSite('${site.id}')">${site.name}</button>`,
    );
  if (unit && view.level === 'unit') parts.push(`<span class="sep">›</span><b>${unit.number}호기</b>`);
  $('#crumb').innerHTML = parts.join('');
}

export function renderStatusBar() {
  const site = currentSite();
  const units: Unit[] = view.level === 'nation' ? allUnitsWithSite().map(r => r.unit) : site!.units;
  const count = (status: EquipmentStatus) => units.filter(u => u.status === status).length;
  const totalLabel = view.level === 'nation' ? '보유 장비' : site!.status === 'store' ? '보관 장비' : '투입 호기';
  const cells: [string, number, string][] = [
    ['total', units.length, totalLabel],
    ['', count('run'), '가동 중'],
    ['fault', count('fault'), STATUS_LABEL.fault],
    ['check', count('check'), STATUS_LABEL.check],
    ['late', count('late'), STATUS_LABEL.late],
    ['dim', count('store'), STATUS_LABEL.store],
  ];
  // 총계와 가동 중은 0이어도 보여 준다. 나머지는 있을 때만.
  $('#band').innerHTML = cells
    .filter(([key, n]) => key === 'total' || key === '' || n > 0)
    .map(([key, n, label]) => `<div class="cell ${key}"><b>${n}</b>${label}</div>`)
    .join('');
}
