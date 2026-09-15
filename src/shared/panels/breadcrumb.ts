// 크럼 — 「뿌리 › 현장 › 호기」. 뿌리가 무엇인지만 역할마다 다르다.
// 핸들러 이름을 문자열로 받지 않는다 — 그러면 검사기가 못 보고 조용히 죽는다.
// 뿌리로 돌아가는 동작은 앱마다 openRoot() 로 얹는다.
import { $ } from '../dom';
import type { Site, Unit } from '../types';

export function renderBreadcrumb(rootLabel: string, site: Site | null, unit: Unit | null) {
  const atRoot = !site;
  const parts = [atRoot ? `<b>${rootLabel}</b>` : `<button onclick="openRoot()">${rootLabel}</button>`];
  if (site)
    parts.push(
      unit
        ? `<span class="sep">›</span><button onclick="openSite('${site.id}')">${site.name}</button>`
        : `<span class="sep">›</span><b>${site.name}</b>`,
    );
  if (unit) parts.push(`<span class="sep">›</span><b>${unit.number}호기</b>`);
  $('#crumb').innerHTML = parts.join('');
}
