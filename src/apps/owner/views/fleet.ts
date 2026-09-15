// 보유 장비 — 검색·필터·정렬·현장별 묶기.
import { $, attr } from '../../../shared/dom';
import { shortLastSeen } from '../../../shared/format';
import { NEEDS_ATTENTION, STATUS_LABEL, STATUS_NOTE, STATUS_ORDER } from '../../../shared/labels';
import { allUnitsWithSite, server, view } from '../store';
import type { EquipmentStatus, Site, Unit } from '../../../shared/types';
import type { SortKey } from '../store';

type Row = { unit: Unit; site: Site };

/** 계약이 이 안에 끝나면 표에서 눈에 띄게 한다 */
const ENDING_SOON_DAYS = 30;
/** 차량 서류가 이 수보다 적으면 「서류 미비」 */
const MIN_DOCUMENTS = 4;

const partWarnings = (u: Unit) =>
  u.parts.filter(p => (p.kind === 'wear' ? p.wornPercent >= p.limitPercent - 10 : p.daysLeft <= 14)).length;
const aiWarnings = (u: Unit) => u.aiEvents.filter(e => e.level === 'warn').length;
const totalWarnings = (u: Unit) => aiWarnings(u) + partWarnings(u);
/** 보관 중인 호기는 계약 종료가 없으므로 맨 뒤로 */
const endRank = (s: Site) => (s.status === 'store' ? Number.MAX_SAFE_INTEGER : s.daysToEnd);

const SORTERS: Record<SortKey, (a: Row, b: Row) => number> = {
  attention: (a, b) =>
    STATUS_ORDER[a.unit.status] - STATUS_ORDER[b.unit.status] ||
    totalWarnings(b.unit) - totalWarnings(a.unit) ||
    a.unit.number - b.unit.number,
  number: (a, b) => a.unit.number - b.unit.number,
  site: (a, b) => a.site.name.localeCompare(b.site.name, 'ko') || a.unit.number - b.unit.number,
  contractEnd: (a, b) => endRank(a.site) - endRank(b.site) || a.unit.number - b.unit.number,
};

const STATUS_OPTIONS: [string, string][] = [
  ['all', '상태 전체'],
  ['attention', '확인 필요'],
  ['fault', '고장'],
  ['check', '점검'],
  ['late', '수신 지연'],
  ['run', '정상'],
  ['store', '보관'],
];
const CONTRACT_OPTIONS: [string, string][] = [
  ['all', '계약 종료 전체'],
  ['30', '30일 이내'],
  ['60', '60일 이내'],
  ['90', '90일 이내'],
];

const dropdown = (key: string, options: [string, string][], selected: string, first = '') =>
  `<select onchange="setFleetFilter('${key}',this.value)">${first}${options
    .map(([v, label]) => `<option value="${v}" ${selected === v ? 'selected' : ''}>${label}</option>`)
    .join('')}</select>`;

function matchesFilters({ unit, site }: Row, query: string): boolean {
  const haystack = `${unit.number}호기 ${unit.code} ${site.name} ${site.region} ${site.builder}`.toLowerCase();
  if (query && !haystack.includes(query)) return false;
  if (view.statusFilter === 'attention') {
    if (!NEEDS_ATTENTION.includes(unit.status)) return false;
  } else if (view.statusFilter !== 'all' && unit.status !== view.statusFilter) return false;
  if (view.siteFilter !== 'all' && site.id !== view.siteFilter) return false;
  if (view.contractFilter !== 'all' && (site.status === 'store' || site.daysToEnd > +view.contractFilter)) return false;
  return true;
}

function unitRow({ unit, site }: Row, grouped: boolean): string {
  const endingSoon = site.status !== 'store' && site.daysToEnd <= ENDING_SOON_DAYS;
  const chips = [
    aiWarnings(unit) ? `<span class="chip ai">AI ${aiWarnings(unit)}</span>` : '',
    partWarnings(unit) ? `<span class="chip part">소모품 ${partWarnings(unit)}</span>` : '',
    unit.documents.length < MIN_DOCUMENTS ? `<span class="chip">서류 미비</span>` : '',
  ].join('');
  const siteCell = grouped
    ? ''
    : `<td class="site">${site.name}` +
      `<small>${site.region}${site.status !== 'store' ? ' · ' + site.builder : ''}</small></td>`;
  const note = unit.status !== 'run' && unit.status !== 'late' ? `<span>${STATUS_NOTE[unit.status]}</span>` : '';
  const contract = site.status === 'store' ? '—' : `D-${site.daysToEnd}<span class="sub">${site.contractEnd}</span>`;
  return (
    `<tr class="u" onclick="openUnit('${site.id}',${unit.number})">` +
    `<td class="unit"><b>${unit.number}호기</b><span>${unit.code}</span></td>` +
    siteCell +
    `<td class="st"><b class="${unit.status}">${STATUS_LABEL[unit.status]}</b>${note}</td>` +
    `<td class="mono ${unit.status === 'late' ? 'late' : ''}">` +
    `${unit.status === 'store' ? '수신 없음' : shortLastSeen(unit.lastSeen)}</td>` +
    `<td class="mono r ${endingSoon ? 'soon' : ''}">${contract}</td>` +
    `<td>${chips}</td></tr>`
  );
}

function tableBody(rows: Row[]): string {
  if (!rows.length) return `<tr><td colspan="6" class="empty">조건에 맞는 장비가 없습니다</td></tr>`;
  if (!view.groupBySite) return rows.map(r => unitRow(r, false)).join('');
  const bySite = new Map<string, Row[]>();
  for (const row of rows) {
    if (!bySite.has(row.site.id)) bySite.set(row.site.id, []);
    bySite.get(row.site.id)!.push(row);
  }
  return [...bySite.values()]
    .map(group => {
      const site = group[0].site;
      const note = site.status === 'store' ? '보관소' : 'D-' + site.daysToEnd;
      return (
        `<tr class="g"><td colspan="5">${site.name}<span>${group.length}대 · ${note}</span></td></tr>` +
        group.map(r => unitRow(r, true)).join('')
      );
    })
    .join('');
}

const SEARCH_ICON = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;

export function renderFleet() {
  const all = allUnitsWithSite();
  const query = view.query.trim().toLowerCase();
  const rows = all.filter(r => matchesFilters(r, query)).sort(SORTERS[view.sortBy]);
  const deployed = all.filter(({ unit }) => unit.status !== 'store').length;
  const attention = { fault: 0, check: 0, late: 0 } as Record<EquipmentStatus, number>;
  for (const { unit } of all) if (attention[unit.status] != null) attention[unit.status]++;

  const sortableHeader = (key: SortKey, label: string, align = '') =>
    `<th class="${align} ${view.sortBy === key ? 'on' : ''}" ` +
    `onclick="setFleetFilter('sortBy','${key}')">${label}</th>`;
  const siteOptions = server.sites.map(s => [s.id, s.name] as [string, string]);

  $('#fleet').innerHTML =
    `<div class="ftop">` +
    `<label class="search">${SEARCH_ICON}` +
    `<input id="fq" placeholder="호기, CPB 코드, 현장, 건설사" value="${attr(view.query)}" ` +
    `oninput="setFleetFilter('query',this.value,true)"></label>` +
    dropdown('statusFilter', STATUS_OPTIONS, view.statusFilter) +
    dropdown('siteFilter', siteOptions, view.siteFilter, `<option value="all">현장 전체</option>`) +
    dropdown('contractFilter', CONTRACT_OPTIONS, view.contractFilter) +
    `<button class="tog ${view.groupBySite ? 'on' : ''}" ` +
    `onclick="setFleetFilter('groupBySite',!view.groupBySite)">현장별 보기</button>` +
    `</div>` +
    `<div class="fmeta"><span><b>${all.length}대</b> 중 <b>${rows.length}대</b> 표시</span>` +
    `<span class="cnts"><span>투입 <b>${deployed}</b></span>` +
    `<span class="fault">고장 <b>${attention.fault}</b></span>` +
    `<span class="check">점검 <b>${attention.check}</b></span>` +
    `<span class="late">지연 <b>${attention.late}</b></span>` +
    `<span>보관 <b>${all.length - deployed}</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    sortableHeader('number', '호기') +
    (view.groupBySite ? '' : sortableHeader('site', '현장')) +
    sortableHeader('attention', '상태') +
    `<th>마지막 수신</th>` +
    sortableHeader('contractEnd', '계약 종료', 'r') +
    `<th>주의</th></tr></thead>` +
    `<tbody>${tableBody(rows)}</tbody></table></div>`;
}
