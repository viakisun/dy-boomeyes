// 전국 단계 좌측 카드 — 확인이 필요한 현장 목록.
import { NEEDS_ATTENTION, STATUS_COLOR, STATUS_LABEL } from '../../../shared/labels';
import { server } from '../store';
import type { Site } from '../../../shared/types';

const siteRow = (site: Site) =>
  `<div class="row" data-site="${site.id}" onclick="openSite('${site.id}')">` +
  `<div><div class="nm">${site.name}</div>` +
  `<div class="sub"><em style="color:${STATUS_COLOR[site.status]}">${STATUS_LABEL[site.status]}</em>` +
  ` · ${site.statusNote}</div></div>` +
  `<div class="cnt">${site.unitCount}대</div></div>`;

export function nationPanel(): string {
  const sites = server.sites.filter(s => NEEDS_ATTENTION.includes(s.status));
  const unitCount = server.sites.flatMap(s => s.units).filter(u => NEEDS_ATTENTION.includes(u.status)).length;
  return (
    `<header><h2>확인 필요<small>${sites.length}개 현장 · ${unitCount}대</small></h2>` +
    `<a href="#" onclick="openTab('fleet');return false">전체 ${server.sites.length}개 현장</a></header>` +
    `<div class="body">${sites.map(siteRow).join('')}</div>`
  );
}
