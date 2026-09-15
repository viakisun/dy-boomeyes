// 상단 크럼 — 전국 › 현장 › 호기.
import { $ } from '../../../shared/dom';
import { currentSite, currentUnit, view } from '../store';

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
