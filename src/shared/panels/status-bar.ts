// 상태 띠 — 보여 줄 호기 묶음을 받아 상태별로 센다. 어느 역할이든 같은 어휘로 읽는다.
import { $ } from '../dom';
import { STATUS_LABEL } from '../labels';
import type { EquipmentStatus, Unit } from '../types';

export function renderStatusBar(units: Unit[], totalLabel: string) {
  const count = (status: EquipmentStatus) => units.filter(u => u.status === status).length;
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
