// 자사 현장 목록 — 소유주의 전국 목록 자리에 온다. 한 건설사는 현장이 몇 곳뿐이다.
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '../../../shared/labels';
import { server, view } from '../store';
import type { Site } from '../../../shared/types';

const row = (site: Site) => {
  const attention = site.units.filter(u => STATUS_ORDER[u.status] < STATUS_ORDER.run).length;
  const note = site.statusNote ?? `${site.units.length}대 가동 중`;
  return (
    `<div class="row ${view.siteId === site.id ? 'on' : ''}" data-site="${site.id}" ` +
    `onclick="openSite('${site.id}')">` +
    `<div><div class="nm">${site.name}</div>` +
    `<div class="sub"><em style="color:${STATUS_COLOR[site.status]}">${STATUS_LABEL[site.status]}</em>` +
    ` · ${note}</div></div>` +
    `<div class="cnt${attention ? ' late' : ''}">${site.units.length}대</div></div>`
  );
};

export function siteListPanel(): string {
  const sites = [...server.sites].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const units = server.sites.reduce((sum, s) => sum + s.units.length, 0);
  return (
    `<header><h2>우리 현장<small>${sites.length}곳 · ${units}대</small></h2></header>` +
    `<div class="body">${sites.map(row).join('')}</div>`
  );
}
