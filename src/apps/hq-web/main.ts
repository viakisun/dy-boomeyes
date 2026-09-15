// 본사 안전관리자 WEB (아카이브 서피스 B2) — 자사 전 현장과 거기 투입된 호기를 본다.
// 소유주 앱에서 전국 지도·보유 장비·요청 배정을 뺐다. 읽기 전용 — 직접 처리 불가.
// 아직 없는 것: 확인 요청(B2 고유 동작)과 보고 모드. docs/APPS.md 참고.
import '../../style.css';
import * as map from '../../shared/map/site-map';
import { badgeText, bindShell, setUnitMode, startApp } from '../../shared/app-shell';
import { renderCameraGrid } from '../../shared/camera/camera-view';
import { $ } from '../../shared/dom';
import { renderBreadcrumb } from '../../shared/panels/breadcrumb';
import { sitePanel } from '../../shared/panels/site-panel';
import { renderStatusBar } from '../../shared/panels/status-bar';
import { unitPanel } from '../../shared/panels/unit-panel';
import { currentCompany, currentSite, currentUnit, loadEverything, server, unreadAlertCount, view } from './store';
import { siteListPanel } from './views/site-list';

/* ---------- 화면 전환 ---------- */

const renderAlertBadge = () => ($('#nbadge').textContent = badgeText(unreadAlertCount()));

function render() {
  const site = currentSite();
  renderAlertBadge();
  renderBreadcrumb(currentCompany(), site, currentUnit());

  if (!site) {
    // 이 건설사 이름으로 잡히는 현장이 없다
    $('#band').classList.add('hide');
    $('#wall').hidden = true;
    $('#card').innerHTML =
      `<header><h2>현장 없음</h2></header>` +
      `<div class="body"><div class="row"><div><div class="sub">` +
      `${currentCompany()} 로 등록된 현장이 없습니다.</div></div></div></div>`;
    map.hideMap();
    return;
  }

  const atUnit = view.level === 'unit';
  renderStatusBar(site.units, site.status === 'store' ? '보관 장비' : '투입 호기');
  setUnitMode(atUnit);

  const card = $('#card');
  card.classList.add('wide');
  card.classList.toggle('unit', atUnit);
  if (atUnit) {
    card.innerHTML = unitPanel(currentUnit()!, site);
    map.hideMap();
    renderCameraGrid(currentUnit()!);
  } else {
    card.innerHTML = sitePanel(site, null);
    map.showSite(site);
  }
}

/** 현장이 여럿이면 목록과 지도를 함께 보여 준다. 지도는 소유주의 전국 화면을 우리 현장으로 좁힌 것이다. */
function showSiteList() {
  renderAlertBadge();
  const card = $('#card');
  card.classList.remove('wide', 'unit');
  card.innerHTML = siteListPanel();
  $('#band').classList.add('hide');
  $('#wall').hidden = true;
  document.body.className = '';
  $('#map').removeAttribute('style');
  $('#crumb').innerHTML = `<b>${currentCompany()}</b>`;
  map.showNation(server.sites);
}

/* ---------- 인라인 핸들러가 부르는 것들 ---------- */

function openSite(siteId: string) {
  view.siteId = siteId;
  view.level = 'site';
  view.unitNumber = null;
  view.openCamera = null;
  $('#fullv').hidden = true;
  render();
}

function openUnit(siteId: string, unitNumber: number) {
  view.siteId = siteId;
  view.level = 'unit';
  view.unitNumber = unitNumber;
  view.openCamera = null;
  $('#fullv').hidden = true;
  render();
}

// 생성 HTML이 onclick="openSite('songdo')" 꼴로 부른다 — 모듈 스코프라 전역에 얹어 준다.
// 인라인 핸들러가 부르는 이름은 반드시 여기 있어야 한다. 빠지면 클릭이 조용히 죽는다.
// window에 얹는 것뿐이라 여기서는 any가 불가피하다.
const shell = bindShell({
  currentUnit,
  view,
  alerts: () => server.alerts,
  readAlerts: view.readAlerts,
  render,
});

Object.assign(window as any, { ...shell, openRoot: showSiteList, openSite, openUnit, showSiteList });

/* ---------- 부팅 ---------- */

map.onPick(openSite, openUnit);
map.loadCountryOutline();

startApp(loadEverything, () => {
  if (server.sites.length > 1) showSiteList();
  else render();
});
