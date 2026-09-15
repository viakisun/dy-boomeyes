// 요청 — 목록과 상세(후보 고르기·배정 확정).
// 후보는 서버가 고른다. 화면은 고른 것을 draft에 담아 두었다가 확정할 때 한 번 보낸다.
import { $, ORDER, REQ_ST, shortRecv } from '../ui';
import { curReq, db, state } from '../store';
import type { Candidate, Request } from '../types';

const REQ_ORDER: Record<string, number> = { new: 0, assign: 1, ship: 2, run: 3, done: 4 };

function list(): string {
  const rows = [...db.requests].sort((a, b) => REQ_ORDER[a.st] - REQ_ORDER[b.st]);
  const count = (st: string) => db.requests.filter(r => r.st === st).length;
  const store = db.sites.find(s => s.st === 'store');
  const stored = store ? store.units.length : 0;
  const endingSoon = db.sites.filter(s => s.st !== 'store' && s.dday <= 90).reduce((a, s) => a + s.units.length, 0);
  const row = (r: Request) =>
    `<tr class="u" onclick="openReq('${r.id}')">` +
    `<td class="mono">${r.id}</td>` +
    `<td class="site">${r.site}<small>${r.region} · ${r.builder} · ${r.mgr}</small></td>` +
    `<td class="mono">${r.from}<span class="sub">– ${r.to}</span></td>` +
    `<td class="r"><b>${r.n}</b>대</td>` +
    `<td><span class="rst ${r.st}">${REQ_ST[r.st]}</span></td>` +
    `<td class="mono">${r.at}</td></tr>`;
  return (
    `<div class="ftop"><h2 class="rh">현장 요청</h2>` +
    `<span class="rsub">현장 안전관리자가 보낸 CPB 요청을 받아 호기를 배정합니다</span></div>` +
    `<div class="fmeta"><span><b>${count('new')}건</b> 새 요청 · 배정 중 <b>${count('assign')}건</b></span>` +
    `<span class="cnts"><span>보관 가용 <b>${stored}대</b></span>` +
    `<span>90일 내 종료 <b>${endingSoon}대</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    `<th>요청</th><th>현장</th><th>기간</th><th class="r">대수</th><th>상태</th><th>접수</th>` +
    `</tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>`
  );
}

/** 왜 이 호기를 쓸 수 있는지 — 보관 중이거나 계약이 곧 끝나거나 */
const why = (c: Candidate) =>
  c.stored
    ? `<b class="ok">보관 중</b><span>${c.siteName}</span>`
    : `<b>D-${c.dday} 종료</b><span>${c.siteName} · ${c.siteEnd}</span>`;

/** 배정 전에 짚어야 할 것 */
const risk = (c: Candidate) =>
  c.st === 'check'
    ? '<span class="chip part">점검 필요</span>'
    : c.st === 'store' && c.recv === '수신 없음'
      ? '<span class="chip">단말기 미장착</span>'
      : c.docs < 4
        ? '<span class="chip">서류 미비</span>'
        : '';

function detail(r: Request): string {
  const cands = state.cands;
  const picked = r.st === 'new' ? state.draft : r.picked;
  const byCode = new Map(cands.map(c => [c.code, c]));
  const nStored = cands.filter(c => c.stored).length;
  const editable = r.st === 'new';

  const chip = (code: string) => {
    const c = byCode.get(code);
    const num = c ? c.num + '호기 ' : '';
    const x = editable ? `<button onclick="togglePick('${code}')">×</button>` : '';
    return `<div>${num}<span class="mono-s">${code}</span>${x}</div>`;
  };
  const pickList = picked.length
    ? `<div class="pl">${picked.map(chip).join('')}</div>`
    : '<p class="empty-s">우측 후보에서 호기를 고르세요</p>';

  const candRow = (c: Candidate) =>
    `<tr class="${picked.includes(c.code) ? 'sel' : ''}">` +
    `<td class="unit"><b>${c.num}호기</b><span>${c.code}</span></td>` +
    `<td class="avail">${why(c)}</td>` +
    `<td class="mono">${c.stored ? '수신 없음' : shortRecv(c.recv)}</td>` +
    `<td>${risk(c)}</td>` +
    `<td class="r"><button class="pickb ${picked.includes(c.code) ? 'on' : ''}" ` +
    `onclick="togglePick('${c.code}')" ${editable ? '' : 'disabled'}>` +
    `${picked.includes(c.code) ? '배정됨' : '배정'}</button></td></tr>`;

  return (
    `<div class="rdetail"><aside class="rcard">` +
    `<div class="rhead"><div class="mono-s">${r.id} · ${r.at} 접수</div>` +
    `<h2>${r.site}</h2><div class="addr">${r.region} · ${r.builder}</div></div>` +
    `<div class="rsec"><dl class="kv"><dt>요청 기간</dt><dd>${r.from} – ${r.to}</dd>` +
    `<dt>필요 대수</dt><dd>${r.n}대</dd>` +
    `<dt>사양</dt><dd>${r.spec}</dd>` +
    `<dt>안전관리자</dt><dd>${r.mgr} · <a href="#" onclick="return false">${r.tel}</a></dd></dl></div>` +
    `<div class="rsec pick"><h3 class="sh">배정 <span>${picked.length} / ${r.n}대</span></h3>` +
    pickList +
    `<button class="confirm" onclick="confirmReq()" ` +
    `${picked.length === r.n && editable ? '' : 'disabled'}>` +
    `${editable ? '배정 확정 · 회신' : '배정 완료'}</button></div></aside>` +
    `<div class="rlist">` +
    `<div class="fmeta"><span><b>${cands.length}대</b> 후보 · 요청 시작 ${r.from} 기준</span>` +
    `<span class="cnts"><span>보관 <b>${nStored}</b></span>` +
    `<span>종료 임박 <b>${cands.length - nStored}</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    `<th>호기</th><th>가용 근거</th><th>마지막 수신</th><th>확인 사항</th><th class="r">배정</th>` +
    `</tr></thead><tbody>${cands.map(candRow).join('')}</tbody></table></div></div></div>`
  );
}

export function renderReq() {
  const r = curReq();
  $('#req').innerHTML = r ? detail(r) : list();
}

export { ORDER };
