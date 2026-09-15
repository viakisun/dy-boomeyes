// 보유 장비 — 검색·필터·정렬·현장별 묶기.
import { $, LABEL, ORDER, SEARCH_ICON, UNIT_MSG, WARN_ST, shortRecv } from '../ui';
import { allUnits, db, state } from '../store';
import type { Site, Status, Unit } from '../types';

type Row = { u: Unit; s: Site };

const partWarn = (u: Unit) => u.parts.filter(p => (p[1] === 'wear' ? p[2] >= p[3]! - 10 : p[2] <= 14)).length;
const aiWarn = (u: Unit) => u.ai.filter(e => e.lvl === 'warn').length;

const SORTERS: Record<string, (a: Row, b: Row) => number> = {
  attn: (a, b) =>
    ORDER[a.u.st] - ORDER[b.u.st] || aiWarn(b.u) + partWarn(b.u) - (aiWarn(a.u) + partWarn(a.u)) || a.u.num - b.u.num,
  num: (a, b) => a.u.num - b.u.num,
  site: (a, b) => a.s.name.localeCompare(b.s.name, 'ko') || a.u.num - b.u.num,
  exp: (a, b) => (a.s.st === 'store' ? 9999 : a.s.dday) - (b.s.st === 'store' ? 9999 : b.s.dday) || a.u.num - b.u.num,
};

const ST_OPTS: [string, string][] = [
  ['all', '상태 전체'],
  ['attn', '확인 필요'],
  ['fault', '고장'],
  ['check', '점검'],
  ['late', '수신 지연'],
  ['run', '정상'],
  ['store', '보관'],
];
const EXP_OPTS: [string, string][] = [
  ['all', '계약 종료 전체'],
  ['30', '30일 이내'],
  ['60', '60일 이내'],
  ['90', '90일 이내'],
];

const select = (key: string, opts: [string, string][], cur: string, head = '') =>
  `<select onchange="setFleet('${key}',this.value)">${head}${opts
    .map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`)
    .join('')}</select>`;

function keep({ u, s }: Row, q: string): boolean {
  if (q && !`${u.num}호기 ${u.code} ${s.name} ${s.region} ${s.builder}`.toLowerCase().includes(q)) return false;
  if (state.fst === 'attn' ? !WARN_ST.includes(u.st) : state.fst !== 'all' && u.st !== state.fst) return false;
  if (state.fsite !== 'all' && s.id !== state.fsite) return false;
  if (state.fexp !== 'all' && (s.st === 'store' || s.dday > +state.fexp)) return false;
  return true;
}

function tr({ u, s }: Row, grouped: boolean): string {
  const soon = s.st !== 'store' && s.dday <= 30;
  const chips = [
    aiWarn(u) ? `<span class="chip ai">AI ${aiWarn(u)}</span>` : '',
    partWarn(u) ? `<span class="chip part">소모품 ${partWarn(u)}</span>` : '',
    u.docs.length < 4 ? `<span class="chip">서류 미비</span>` : '',
  ].join('');
  const siteCell = grouped
    ? ''
    : `<td class="site">${s.name}<small>${s.region}${s.st !== 'store' ? ' · ' + s.builder : ''}</small></td>`;
  return (
    `<tr class="u" onclick="go('unit','${s.id}',${u.num})">` +
    `<td class="unit"><b>${u.num}호기</b><span>${u.code}</span></td>` +
    siteCell +
    `<td class="st"><b class="${u.st}">${LABEL[u.st]}</b>` +
    `${u.st !== 'run' && u.st !== 'late' ? `<span>${UNIT_MSG[u.st]}</span>` : ''}</td>` +
    `<td class="mono ${u.st === 'late' ? 'late' : ''}">${u.st === 'store' ? '수신 없음' : shortRecv(u.recv)}</td>` +
    `<td class="mono r ${soon ? 'soon' : ''}">` +
    `${s.st === 'store' ? '—' : `D-${s.dday}<span class="sub">${s.end}</span>`}</td>` +
    `<td>${chips}</td></tr>`
  );
}

function tbody(rows: Row[]): string {
  if (!rows.length) return `<tr><td colspan="6" class="empty">조건에 맞는 장비가 없습니다</td></tr>`;
  if (!state.group) return rows.map(r => tr(r, false)).join('');
  const bySite = new Map<string, Row[]>();
  for (const r of rows) {
    if (!bySite.has(r.s.id)) bySite.set(r.s.id, []);
    bySite.get(r.s.id)!.push(r);
  }
  return [...bySite.values()]
    .map(rs => {
      const s = rs[0].s;
      const note = s.st === 'store' ? '보관소' : 'D-' + s.dday;
      return (
        `<tr class="g"><td colspan="5">${s.name}<span>${rs.length}대 · ${note}</span></td></tr>` +
        rs.map(r => tr(r, true)).join('')
      );
    })
    .join('');
}

export function renderFleet() {
  const all = allUnits();
  const q = state.q.trim().toLowerCase();
  const rows = all.filter(r => keep(r, q)).sort(SORTERS[state.sort]);
  const inUse = all.filter(({ u }) => u.st !== 'store').length;
  const attn = { fault: 0, check: 0, late: 0 } as Record<Status, number>;
  for (const { u } of all) if (attn[u.st] != null) attn[u.st]++;

  const th = (k: string, label: string, cls = '') =>
    `<th class="${cls} ${state.sort === k ? 'on' : ''}" onclick="setFleet('sort','${k}')">${label}</th>`;
  const siteOpts = db.sites.map(s => [s.id, s.name] as [string, string]);

  $('#fleet').innerHTML =
    `<div class="ftop">` +
    `<label class="search">${SEARCH_ICON}` +
    `<input id="fq" placeholder="호기, CPB 코드, 현장, 건설사" value="${state.q.replace(/"/g, '&quot;')}" ` +
    `oninput="setFleet('q',this.value,true)"></label>` +
    select('fst', ST_OPTS, state.fst) +
    select('fsite', siteOpts, state.fsite, `<option value="all">현장 전체</option>`) +
    select('fexp', EXP_OPTS, state.fexp) +
    `<button class="tog ${state.group ? 'on' : ''}" onclick="setFleet('group',!state.group)">현장별 보기</button>` +
    `</div>` +
    `<div class="fmeta"><span><b>${all.length}대</b> 중 <b>${rows.length}대</b> 표시</span>` +
    `<span class="cnts"><span>투입 <b>${inUse}</b></span>` +
    `<span class="fault">고장 <b>${attn.fault}</b></span>` +
    `<span class="check">점검 <b>${attn.check}</b></span>` +
    `<span class="late">지연 <b>${attn.late}</b></span>` +
    `<span>보관 <b>${all.length - inUse}</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    th('num', '호기') +
    (state.group ? '' : th('site', '현장')) +
    th('attn', '상태') +
    `<th>마지막 수신</th>` +
    th('exp', '계약 종료', 'r') +
    `<th>주의</th></tr></thead>` +
    `<tbody>${tbody(rows)}</tbody></table></div>`;
}
