// 운영 현황 — 부팅, 화면 전환, 인라인 핸들러 배선.
// 화면은 store.db를 읽고, 바꾸는 것은 api를 거친다.
import './style.css';
import * as api from './api';
import * as map from './map';
import { $ } from './ui';
import { curReq, curSite, curUnit, db, loadAll, loadCandidates, loadRequests, state } from './store';
import { renderBand, renderCrumb } from './views/chrome';
import { nationCard } from './views/nation';
import { siteCard } from './views/site';
import { fitWall, renderFull, renderWall, unitCard } from './views/unit';
import { renderFleet } from './views/fleet';
import { renderReq } from './views/requests';
import { renderInbox, unreadCount } from './views/inbox';

/* ---------- 화면 전환 ---------- */

function render() {
  document
    .querySelectorAll<HTMLElement>('.rail .nav')
    .forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
  const fleet = state.tab === 'fleet',
    req = state.tab === 'req';
  $('#fleet').hidden = !fleet;
  $('#req').hidden = !req;
  $('#card').hidden = fleet || req;
  $('#map').style.visibility = fleet || req ? 'hidden' : '';
  // 0이면 배지를 비운다 — 빈 문자열이라야 CSS가 점을 숨긴다
  const badge = (n: number) => (n ? String(n) : '');
  $('#rbadge').textContent = badge(db.requests.filter(r => r.st === 'new').length);
  $('#nbadge').textContent = badge(unreadCount());

  if (fleet || req) {
    $('#band').classList.add('hide');
    $('#wall').hidden = true;
    document.body.className = '';
    if (req) {
      const r = curReq();
      $('#crumb').innerHTML = r
        ? `<button onclick="closeReq()">요청</button><span class="sep">›</span><b>${r.site}</b>`
        : '<b>요청</b>';
      renderReq();
    } else {
      $('#crumb').innerHTML = '<b>보유 장비</b>';
      renderFleet();
    }
    return;
  }

  renderCrumb();
  renderBand();
  renderCard();
  const isUnit = state.level === 'unit';
  $('#band').classList.toggle('hide', isUnit);
  document.body.className = isUnit ? 'vB' : '';
  if (!isUnit) $('#map').removeAttribute('style');
  $('#wall').hidden = !isUnit;
  if (isUnit) renderWall();
  map.showLevel(curSite());
}

function renderCard() {
  const card = $('#card'),
    s = curSite();
  if (state.level === 'nation') {
    card.classList.remove('wide', 'unit');
    card.innerHTML = nationCard();
    return;
  }
  card.classList.add('wide');
  card.classList.remove('unit');
  if (state.level === 'site') {
    card.innerHTML = siteCard(s!);
    return;
  }
  card.classList.add('unit');
  card.innerHTML = unitCard(curUnit()!, s!);
}

/* ---------- 인라인 핸들러가 부르는 것들 ---------- */

function goTab(t: typeof state.tab) {
  state.tab = t;
  if (t !== 'req') closeReq();
  if (t !== 'ops') {
    state.level = 'nation';
    state.unitNum = null;
  }
  render();
}

function go(level: typeof state.level, siteId?: string, unitNum?: number) {
  state.tab = 'ops';
  state.level = level;
  state.siteId = siteId ?? state.siteId;
  state.unitNum = unitNum ?? null;
  state.full = null;
  $('#fullv').hidden = true;
  render();
}

const openFull = (i: number) => {
  state.full = i;
  renderFull();
};
const closeFull = () => {
  state.full = null;
  renderFull();
};

function toggleInbox(force?: boolean) {
  const el = $('#inbox');
  el.hidden = force != null ? !force : !el.hidden;
  if (!el.hidden) renderInbox();
}
const readAlert = (id: string) => {
  state.read.add(id);
  toggleInbox(false);
};
const readAllAlerts = () => {
  db.alerts.forEach(a => state.read.add(a.id));
  renderInbox();
  render();
};

async function openReq(id: string) {
  state.reqId = id;
  state.draft = [];
  await loadCandidates();
  render();
}
function closeReq() {
  state.reqId = null;
  state.draft = [];
  state.cands = [];
}

function togglePick(code: string) {
  const r = curReq();
  if (!r || r.st !== 'new') return;
  const i = state.draft.indexOf(code);
  if (i >= 0) state.draft.splice(i, 1);
  else if (state.draft.length < r.n) state.draft.push(code);
  renderReq();
}

// 배정 확정 — 여기까지가 범위다. 운송·설치·가동·종료 전이는 만들지 않는다.
async function confirmReq() {
  const r = curReq();
  if (!r || state.draft.length !== r.n) return;
  await api.assignRequest(r.id, state.draft);
  await loadRequests();
  closeReq();
  render();
}

/** 보유 장비의 검색·필터·정렬·묶기. 표만 다시 그린다. */
type FleetKey = 'q' | 'fst' | 'fsite' | 'fexp' | 'sort' | 'group';
function setFleet(key: FleetKey, value: string | boolean, keepFocus = false) {
  (state[key] as string | boolean) = value;
  renderFleet();
  if (keepFocus) $('#fq').focus();
}

const call = (tel: string) => (location.href = 'tel:' + tel);
const copyTel = (el: HTMLElement, tel: string) => {
  navigator.clipboard.writeText(tel);
  el.textContent = '✓';
  setTimeout(() => (el.textContent = '⧉'), 1200);
};

// 생성 HTML이 onclick="goTab('ops')" 꼴로 부른다 — 모듈 스코프라 전역에 얹어 준다.
// window에 얹는 것뿐이라 여기서는 any가 불가피하다.
// 인라인 핸들러가 부르는 이름은 반드시 여기 있어야 한다. 빠지면 클릭이 조용히 죽는다.
Object.assign(window as any, {
  go,
  goTab,
  openFull,
  closeFull,
  toggleInbox,
  readAlert,
  readAllAlerts,
  openReq,
  closeReq,
  togglePick,
  confirmReq,
  setFleet,
  call,
  copyTel,
  state,
});

/* ---------- 창·키보드 ---------- */

new ResizeObserver(() => fitWall()).observe($('#wall'));
addEventListener('resize', () => render());

document.addEventListener('keydown', e => {
  const u = curUnit();
  if (state.full == null || !u) return;
  const n = u.cams.length;
  if (e.key === 'Escape') closeFull();
  if (e.key === 'ArrowLeft') openFull((state.full + n - 1) % n);
  if (e.key === 'ArrowRight') openFull((state.full + 1) % n);
});

document.addEventListener('click', e => {
  if (!(e.target as Element).closest('#inbox, #bell')) $('#inbox').hidden = true;
});

// 지도와 목록에 같은 현장·호기가 나온다. 한쪽에 올리면 양쪽이 같이 밝아진다.
const sync = (key: string, val: string, on: boolean) =>
  document.querySelectorAll(`[data-${key}="${val}"]`).forEach(el => el.classList.toggle('hl', on));
const hover = (on: boolean) => (e: Event) => {
  const t = (e.target as Element).closest<HTMLElement>('[data-site],[data-unit]');
  if (!t) return;
  if (t.dataset.site) sync('site', t.dataset.site, on);
  if (t.dataset.unit) sync('unit', t.dataset.unit, on);
};
document.addEventListener('mouseover', hover(true));
document.addEventListener('mouseout', hover(false));

/* ---------- 부팅 ---------- */

map.onPick(
  id => go('site', id),
  (siteId, num) => go('unit', siteId, num),
);

loadAll().then(() => {
  map.buildNationMarkers(db.sites);
  render();
});
