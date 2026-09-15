// 건설사 앱 — 자기 현장과 거기 투입된 호기만 본다.
// 소유주 앱에서 전국 지도·보유 장비·요청 배정을 뺀 것이다. 화면 조각은 shared/panels를 같이 쓴다.
import '../../style.css';
import * as map from '../../shared/map/site-map';
import { fitCameraGrid, renderCameraGrid, renderFullscreen } from '../../shared/camera/camera-view';
import { $ } from '../../shared/dom';
import { hideStartupFailure, showNotice, showStartupFailure } from '../../shared/notice';
import { renderInbox } from '../../shared/panels/inbox';
import { sitePanel } from '../../shared/panels/site-panel';
import { renderStatusBar } from '../../shared/panels/status-bar';
import { unitPanel } from '../../shared/panels/unit-panel';
import { currentBuilder, currentSite, currentUnit, loadEverything, server, unreadAlertCount, view } from './store';
import { siteListPanel } from './views/site-list';

/* ---------- 화면 전환 ---------- */

/** 0이면 배지를 비운다 — 빈 문자열이라야 CSS가 점을 숨긴다 */
function renderAlertBadge() {
  const n = unreadAlertCount();
  $('#nbadge').textContent = n ? String(n) : '';
}

function render() {
  const site = currentSite();
  renderAlertBadge();
  renderBreadcrumb();

  if (!site) {
    // 이 건설사 이름으로 잡히는 현장이 없다
    $('#band').classList.add('hide');
    $('#wall').hidden = true;
    $('#card').innerHTML =
      `<header><h2>현장 없음</h2></header>` +
      `<div class="body"><div class="row"><div><div class="sub">` +
      `${currentBuilder()} 로 등록된 현장이 없습니다.</div></div></div></div>`;
    map.hideMap();
    return;
  }

  const atUnit = view.level === 'unit';
  renderStatusBar(site.units, site.status === 'store' ? '보관 장비' : '투입 호기');
  $('#band').classList.toggle('hide', atUnit);
  document.body.className = atUnit ? 'vB' : '';
  if (!atUnit) $('#map').removeAttribute('style');
  $('#wall').hidden = !atUnit;

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

function renderBreadcrumb() {
  const site = currentSite(),
    unit = currentUnit();
  const parts = [`<b>${currentBuilder()}</b>`];
  if (site)
    parts.push(
      view.level === 'site'
        ? `<span class="sep">›</span><b>${site.name}</b>`
        : `<span class="sep">›</span><button onclick="openSite('${site.id}')">${site.name}</button>`,
    );
  if (unit && view.level === 'unit') parts.push(`<span class="sep">›</span><b>${unit.number}호기</b>`);
  $('#crumb').innerHTML = parts.join('');
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
  $('#crumb').innerHTML = `<b>${currentBuilder()}</b>`;
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

const openCamera = (index: number) => {
  view.openCamera = index;
  renderFullscreen(currentUnit(), index);
};
const closeCamera = () => {
  view.openCamera = null;
  renderFullscreen(currentUnit(), null);
};

function toggleInbox(open?: boolean) {
  const el = $('#inbox');
  el.hidden = open != null ? !open : !el.hidden;
  if (!el.hidden) renderInbox(server.alerts, view.readAlerts);
}
const markAlertRead = (id: string) => {
  view.readAlerts.add(id);
  toggleInbox(false);
};
const markAllAlertsRead = () => {
  server.alerts.forEach(a => view.readAlerts.add(a.id));
  renderInbox(server.alerts, view.readAlerts);
  render();
};

const dial = (tel: string) => (location.href = 'tel:' + tel);
const copyTel = (button: HTMLElement, tel: string) => {
  navigator.clipboard.writeText(tel).catch(() => showNotice('복사하지 못했습니다.'));
  button.textContent = '✓';
  setTimeout(() => (button.textContent = '⧉'), 1200);
};

// 생성 HTML이 onclick="openSite('songdo')" 꼴로 부른다 — 모듈 스코프라 전역에 얹어 준다.
// 인라인 핸들러가 부르는 이름은 반드시 여기 있어야 한다. 빠지면 클릭이 조용히 죽는다.
// window에 얹는 것뿐이라 여기서는 any가 불가피하다.
Object.assign(window as any, {
  openSite,
  openUnit,
  showSiteList,
  openCamera,
  closeCamera,
  toggleInbox,
  markAlertRead,
  markAllAlertsRead,
  dial,
  copyTel,
});

/* ---------- 창·키보드 ---------- */

new ResizeObserver(() => fitCameraGrid(currentUnit())).observe($('#wall'));
addEventListener('resize', () => render());

document.addEventListener('keydown', e => {
  const unit = currentUnit();
  if (view.openCamera == null || !unit) return;
  const count = unit.cameras.length;
  if (e.key === 'Escape') closeCamera();
  if (e.key === 'ArrowLeft') openCamera((view.openCamera + count - 1) % count);
  if (e.key === 'ArrowRight') openCamera((view.openCamera + 1) % count);
});

document.addEventListener('click', e => {
  if (!(e.target as Element).closest('#inbox, #bell')) $('#inbox').hidden = true;
});

// 지도와 목록에 같은 현장·호기가 나온다. 한쪽에 올리면 양쪽이 같이 밝아진다.
const highlight = (key: string, value: string, on: boolean) =>
  document.querySelectorAll(`[data-${key}="${value}"]`).forEach(el => el.classList.toggle('hl', on));
const onHover = (on: boolean) => (e: Event) => {
  const target = (e.target as Element).closest<HTMLElement>('[data-site],[data-unit]');
  if (!target) return;
  if (target.dataset.site) highlight('site', target.dataset.site, on);
  if (target.dataset.unit) highlight('unit', target.dataset.unit, on);
};
document.addEventListener('mouseover', onHover(true));
document.addEventListener('mouseout', onHover(false));

/* ---------- 부팅 ---------- */

map.onPick(openSite, openUnit);
map.loadCountryOutline();

async function start() {
  try {
    await loadEverything();
    hideStartupFailure();
    if (server.sites.length > 1) showSiteList();
    else render();
  } catch (error) {
    showStartupFailure(error, start);
  }
}
start();
