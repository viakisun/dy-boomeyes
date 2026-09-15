// 요청 — 목록과 상세(후보 고르기·배정 확정).
// 후보는 서버가 고른다. 화면은 고른 것을 draftCodes에 담아 두었다가 확정할 때 한 번 보낸다.
import { $ } from '../../../shared/dom';
import { shortLastSeen } from '../../../shared/format';
import { REQUEST_LABEL } from '../../../shared/labels';
import { currentRequest, newRequestCount, server, view } from '../store';
import type { Candidate, EquipmentRequest, RequestStatus } from '../../../shared/types';

/** 목록에 보여 주는 차례 */
const STATUS_ORDER: Record<RequestStatus, number> = { new: 0, assign: 1, ship: 2, run: 3, done: 4 };
/** 이 안에 계약이 끝나는 현장의 호기를 「곧 나온다」로 센다 */
const AVAILABLE_SOON_DAYS = 90;
/** 차량 서류가 이 수보다 적으면 「서류 미비」 */
const MIN_DOCUMENTS = 4;

function requestList(): string {
  const rows = [...server.requests].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const assigning = server.requests.filter(r => r.status === 'assign').length;
  const storage = server.sites.find(s => s.status === 'store');
  const inStorage = storage ? storage.units.length : 0;
  const freeingSoon = server.sites
    .filter(s => s.status !== 'store' && s.daysToEnd <= AVAILABLE_SOON_DAYS)
    .reduce((sum, s) => sum + s.units.length, 0);
  const row = (r: EquipmentRequest) =>
    `<tr class="u" onclick="openRequest('${r.id}')">` +
    `<td class="mono">${r.id}</td>` +
    `<td class="site">${r.siteName}<small>${r.region} · ${r.builder} · ${r.manager}</small></td>` +
    `<td class="mono">${r.neededFrom}<span class="sub">– ${r.neededTo}</span></td>` +
    `<td class="r"><b>${r.neededCount}</b>대</td>` +
    `<td><span class="rst ${r.status}">${REQUEST_LABEL[r.status]}</span></td>` +
    `<td class="mono">${r.receivedAt}</td></tr>`;
  return (
    `<div class="ftop"><h2 class="rh">현장 요청</h2>` +
    `<span class="rsub">현장 안전관리자가 보낸 CPB 요청을 받아 호기를 배정합니다</span></div>` +
    `<div class="fmeta"><span><b>${newRequestCount()}건</b> 새 요청 · 배정 중 <b>${assigning}건</b></span>` +
    `<span class="cnts"><span>보관 가용 <b>${inStorage}대</b></span>` +
    `<span>90일 내 종료 <b>${freeingSoon}대</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    `<th>요청</th><th>현장</th><th>기간</th><th class="r">대수</th><th>상태</th><th>접수</th>` +
    `</tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>`
  );
}

/** 왜 이 호기를 쓸 수 있는지 — 보관 중이거나 계약이 곧 끝나거나 */
const availability = (c: Candidate) =>
  c.inStorage
    ? `<b class="ok">보관 중</b><span>${c.siteName}</span>`
    : `<b>D-${c.daysToEnd} 종료</b><span>${c.siteName} · ${c.contractEnd}</span>`;

/** 배정 전에 짚어야 할 것 */
const caution = (c: Candidate) => {
  if (c.status === 'check') return '<span class="chip part">점검 필요</span>';
  if (c.status === 'store' && c.lastSeen === '수신 없음') return '<span class="chip">단말기 미장착</span>';
  if (c.documentCount < MIN_DOCUMENTS) return '<span class="chip">서류 미비</span>';
  return '';
};

function requestDetail(request: EquipmentRequest): string {
  const editable = request.status === 'new';
  const picked = editable ? view.draftCodes : request.assignedCodes;
  const candidates = view.candidates;
  const byCode = new Map(candidates.map(c => [c.code, c]));
  const inStorage = candidates.filter(c => c.inStorage).length;
  const complete = picked.length === request.neededCount;

  const pickedChip = (code: string) => {
    const c = byCode.get(code);
    const remove = editable ? `<button onclick="toggleAssign('${code}')">×</button>` : '';
    return `<div>${c ? c.unitNumber + '호기 ' : ''}<span class="mono-s">${code}</span>${remove}</div>`;
  };
  const pickedList = picked.length
    ? `<div class="pl">${picked.map(pickedChip).join('')}</div>`
    : '<p class="empty-s">우측 후보에서 호기를 고르세요</p>';

  const confirmLabel = view.submitting ? '보내는 중…' : editable ? '배정 확정 · 회신' : '배정 완료';
  const confirmDisabled = complete && editable && !view.submitting ? '' : 'disabled';

  const candidateRow = (c: Candidate) =>
    `<tr class="${picked.includes(c.code) ? 'sel' : ''}">` +
    `<td class="unit"><b>${c.unitNumber}호기</b><span>${c.code}</span></td>` +
    `<td class="avail">${availability(c)}</td>` +
    `<td class="mono">${c.inStorage ? '수신 없음' : shortLastSeen(c.lastSeen)}</td>` +
    `<td>${caution(c)}</td>` +
    `<td class="r"><button class="pickb ${picked.includes(c.code) ? 'on' : ''}" ` +
    `onclick="toggleAssign('${c.code}')" ${editable ? '' : 'disabled'}>` +
    `${picked.includes(c.code) ? '배정됨' : '배정'}</button></td></tr>`;

  return (
    `<div class="rdetail"><aside class="rcard">` +
    `<div class="rhead"><div class="mono-s">${request.id} · ${request.receivedAt} 접수</div>` +
    `<h2>${request.siteName}</h2><div class="addr">${request.region} · ${request.builder}</div></div>` +
    `<div class="rsec"><dl class="kv">` +
    `<dt>요청 기간</dt><dd>${request.neededFrom} – ${request.neededTo}</dd>` +
    `<dt>필요 대수</dt><dd>${request.neededCount}대</dd>` +
    `<dt>사양</dt><dd>${request.spec}</dd>` +
    `<dt>안전관리자</dt><dd>${request.manager} · ` +
    `<a href="tel:${request.managerTel}">${request.managerTel}</a></dd></dl></div>` +
    `<div class="rsec pick"><h3 class="sh">배정 ` +
    `<span>${picked.length} / ${request.neededCount}대</span></h3>` +
    pickedList +
    `<button class="confirm" onclick="confirmAssignment()" ${confirmDisabled}>${confirmLabel}</button>` +
    `</div></aside>` +
    `<div class="rlist">` +
    `<div class="fmeta"><span><b>${candidates.length}대</b> 후보 · ` +
    `요청 시작 ${request.neededFrom} 기준</span>` +
    `<span class="cnts"><span>보관 <b>${inStorage}</b></span>` +
    `<span>종료 임박 <b>${candidates.length - inStorage}</b></span></span></div>` +
    `<div class="ftbl"><table><thead><tr>` +
    `<th>호기</th><th>가용 근거</th><th>마지막 수신</th><th>확인 사항</th><th class="r">배정</th>` +
    `</tr></thead><tbody>${candidates.map(candidateRow).join('')}</tbody></table></div></div></div>`
  );
}

export function renderRequests() {
  const request = currentRequest();
  $('#req').innerHTML = request ? requestDetail(request) : requestList();
}
