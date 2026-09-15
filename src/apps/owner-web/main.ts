// 소유주 운영 WEB (아카이브 서피스 B1) — 부팅, 화면 전환, 인라인 핸들러 배선.
// 화면은 store.server를 읽고, 바꾸는 것은 shared/api를 거친다.
import '../../style.css';
import * as api from '../../shared/api';
import * as map from '../../shared/map/site-map';
import { badgeText, bindShell, setUnitMode, startApp } from '../../shared/app-shell';
import { renderCameraGrid } from '../../shared/camera/camera-view';
import { $ } from '../../shared/dom';
import { describe, showNotice } from '../../shared/notice';
import {
  allUnitsWithSite,
  currentRequest,
  currentSite,
  currentUnit,
  loadCandidates,
  loadEverything,
  newRequestCount,
  reloadRequests,
  server,
  unreadAlertCount,
  view,
} from './store';
import type { Level, SortKey, Tab } from './store';
import { renderBreadcrumb } from '../../shared/panels/breadcrumb';
import { sitePanel } from '../../shared/panels/site-panel';
import { renderStatusBar } from '../../shared/panels/status-bar';
import { unitPanel } from '../../shared/panels/unit-panel';
import { nationPanel } from './views/nation-panel';
import { renderFleet } from './views/fleet';
import { renderRequests } from './views/requests';

/* ---------- 화면 전환 ---------- */

function render() {
  document
    .querySelectorAll<HTMLElement>('.rail .nav')
    .forEach(b => b.classList.toggle('on', b.dataset.tab === view.tab));
  const showingFleet = view.tab === 'fleet';
  const showingRequests = view.tab === 'requests';
  const showingMap = view.tab === 'ops';
  $('#fleet').hidden = !showingFleet;
  $('#req').hidden = !showingRequests;
  $('#card').hidden = !showingMap;
  $('#map').style.visibility = showingMap ? '' : 'hidden';
  $('#rbadge').textContent = badgeText(newRequestCount());
  $('#nbadge').textContent = badgeText(unreadAlertCount());

  if (!showingMap) {
    $('#band').classList.add('hide');
    $('#wall').hidden = true;
    document.body.className = '';
    if (showingRequests) {
      const request = currentRequest();
      $('#crumb').innerHTML = request
        ? `<button onclick="closeRequest()">요청</button><span class="sep">›</span><b>${request.siteName}</b>`
        : '<b>요청</b>';
      renderRequests();
    } else {
      $('#crumb').innerHTML = '<b>보유 장비</b>';
      renderFleet();
    }
    return;
  }

  const atNation = view.level === 'nation';
  renderBreadcrumb('전국', atNation ? null : currentSite(), currentUnit());
  const units = view.level === 'nation' ? allUnitsWithSite().map(r => r.unit) : currentSite()!.units;
  const totalLabel =
    view.level === 'nation' ? '보유 장비' : currentSite()!.status === 'store' ? '보관 장비' : '투입 호기';
  renderStatusBar(units, totalLabel);
  renderSidePanel();
  const atUnit = view.level === 'unit';
  setUnitMode(atUnit);

  const site = currentSite();
  if (view.level === 'nation') map.showNation(server.sites);
  else if (view.level === 'site') map.showSite(site!);
  else {
    map.hideMap();
    renderCameraGrid(currentUnit()!);
  }
}

function renderSidePanel() {
  const card = $('#card');
  const site = currentSite();
  if (view.level === 'nation') {
    card.classList.remove('wide', 'unit');
    card.innerHTML = nationPanel();
    return;
  }
  card.classList.add('wide');
  card.classList.remove('unit');
  if (view.level === 'site') {
    const toFleet = `<a href="#" onclick="openTab('fleet');return false">보유 장비에서 보기</a>`;
    card.innerHTML = sitePanel(site!, view.unitNumber, toFleet);
    return;
  }
  card.classList.add('unit');
  card.innerHTML = unitPanel(currentUnit()!, site!);
}

/* ---------- 이동 ---------- */

function goTo(level: Level, siteId?: string, unitNumber?: number) {
  view.tab = 'ops';
  view.level = level;
  view.siteId = siteId ?? view.siteId;
  view.unitNumber = unitNumber ?? null;
  view.openCamera = null;
  $('#fullv').hidden = true;
  render();
}
const openNation = () => goTo('nation');
const openSite = (siteId: string) => goTo('site', siteId);
const openUnit = (siteId: string, unitNumber: number) => goTo('unit', siteId, unitNumber);

function openTab(tab: Tab) {
  view.tab = tab;
  if (tab !== 'requests') closeRequest();
  if (tab !== 'ops') {
    view.level = 'nation';
    view.unitNumber = null;
  }
  render();
}

/* ---------- 요청 배정 ---------- */

async function openRequest(id: string) {
  view.requestId = id;
  view.draftCodes = [];
  view.candidates = [];
  render();
  try {
    await loadCandidates();
  } catch (error) {
    showNotice(describe(error));
  }
  render();
}

function closeRequest() {
  view.requestId = null;
  view.draftCodes = [];
  view.candidates = [];
}

function toggleAssign(code: string) {
  const request = currentRequest();
  if (!request || request.status !== 'new') return;
  const at = view.draftCodes.indexOf(code);
  if (at >= 0) view.draftCodes.splice(at, 1);
  else if (view.draftCodes.length < request.neededCount) view.draftCodes.push(code);
  renderRequests();
}

// 배정 확정 — 여기까지가 범위다. 운송·설치·가동·종료 전이는 만들지 않는다.
async function confirmAssignment() {
  const request = currentRequest();
  if (!request || view.submitting) return;
  if (view.draftCodes.length !== request.neededCount) return;
  view.submitting = true;
  renderRequests();
  try {
    await api.assignRequest(request.id, view.draftCodes);
    await reloadRequests();
    closeRequest();
    showNotice(`${request.siteName} 에 ${request.neededCount}대를 배정했습니다.`, 'ok');
  } catch (error) {
    showNotice(describe(error));
    // 서버가 거절했으면 화면이 뒤처져 있다 — 다시 받아 맞춘다.
    await reloadRequests().catch(() => {});
  } finally {
    view.submitting = false;
    render();
  }
}

/* ---------- 보유 장비 표 ---------- */

const FLEET_KEYS = ['query', 'statusFilter', 'siteFilter', 'contractFilter', 'sortBy', 'groupBySite'] as const;
type FleetKey = (typeof FLEET_KEYS)[number];

/** 표만 다시 그린다 — 지도와 카드는 건드리지 않는다. */
function setFleetFilter(key: FleetKey, value: string | boolean, keepFocus = false) {
  if (key === 'groupBySite') view.groupBySite = Boolean(value);
  else if (key === 'sortBy') view.sortBy = value as SortKey;
  else view[key] = String(value);
  renderFleet();
  if (keepFocus) $('#fq').focus();
}

// 생성 HTML이 onclick="openTab('ops')" 꼴로 부른다 — 모듈 스코프라 전역에 얹어 준다.
// 인라인 핸들러가 부르는 이름은 반드시 여기 있어야 한다. 빠지면 클릭이 조용히 죽는다.
// window에 얹는 것뿐이라 여기서는 any가 불가피하다.
const shell = bindShell({
  currentUnit,
  view,
  alerts: () => server.alerts,
  readAlerts: view.readAlerts,
  render,
});

Object.assign(window as any, {
  ...shell,
  openRoot: openNation,
  openSite,
  openUnit,
  openTab,
  openRequest,
  closeRequest,
  toggleAssign,
  confirmAssignment,
  setFleetFilter,
  view,
});

/* ---------- 부팅 ---------- */

map.onPick(openSite, openUnit);
map.loadCountryOutline();

startApp(loadEverything, render);
