// 지도 — 전국 현장 배지, 현장 안 호기 핀, 겹침 밀어내기, 이름표 자리 찾기.
// 저장소를 모른다. 보여 줄 것을 인자로 받고, 고른 것을 콜백으로 알린다.
// 시안이 고른 Leaflet + OSM.de 타일 + world-atlas 국경선을 그대로 쓴다.
import { $ } from '../dom';
import { NEEDS_ATTENTION, STATUS_LABEL } from '../labels';
import type { Site } from '../types';

// Leaflet과 topojson은 CDN 전역이다 — 타입 패키지를 받지 않는다.
declare const L: any, topojson: any;

/** 현장 단계의 고정 줌. 목업 데이터가 호기 좌표를 이 줌 기준으로 만든다. */
const SITE_ZOOM = 17;
/** 배지끼리 이만큼은 떨어뜨린다(px) */
const BADGE_GAP = 38;
/** 밀어낸 배지를 제자리로 당기는 힘 */
const PULL_BACK = 0.05;
/** 이보다 멀리 밀렸으면 원래 자리까지 선을 긋는다(px) */
const LEADER_LINE_FROM = 6;

const map = L.map('map', {
  zoomControl: true,
  attributionControl: true,
  minZoom: 6,
  maxZoom: 19,
  fadeAnimation: false,
  zoomAnimation: true,
  zoomSnap: 0.25,
  zoomDelta: 0.5,
});
map.zoomControl.setPosition('bottomright');

const streetTiles = L.layerGroup([
  L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors',
  }),
]);
const nationLayer = L.layerGroup().addTo(map);
const siteLayer = L.layerGroup();
let countryOutline: any = null;

/** 서버 데이터에 Leaflet 객체를 얹지 않으려고 따로 둔다 */
const siteMarkers = new Map<string, any>();
/** 지금 무엇을 보여 주는 중인가 — 배지 재배치는 전국일 때만 한다 */
let mode: 'nation' | 'site' | 'hidden' = 'nation';
let shownSites: Site[] = [];

let pickSite: (siteId: string) => void = () => {};
let pickUnit: (siteId: string, unitNumber: number) => void = () => {};

export function onPick(site: typeof pickSite, unit: typeof pickUnit) {
  pickSite = site;
  pickUnit = unit;
}

/** 국경선은 장식이다 — 못 받아도 지도는 쓸 수 있으므로 조용히 넘긴다. */
export function loadCountryOutline() {
  return fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json')
    .then(r => r.json())
    .then(topo => {
      countryOutline = L.geoJSON(topojson.feature(topo, topo.objects.countries), {
        style: (f: any) =>
          f.id === '410'
            ? { fillColor: '#FFFFFF', fillOpacity: 1, color: '#9FB0BA', weight: 1.2 }
            : { fillColor: '#F1F4F6', fillOpacity: 1, color: '#D5DDE2', weight: 0.8 },
        interactive: false,
      });
      if (mode === 'nation') countryOutline.addTo(map);
    })
    .catch(() => {
      // 국경선 없이도 배지와 타일은 그대로 보인다.
    });
}

function buildNationMarkers(sites: Site[]) {
  nationLayer.clearLayers();
  siteMarkers.clear();
  for (const site of sites) {
    const needsAttention = NEEDS_ATTENTION.includes(site.status);
    const badge = needsAttention
      ? `<span class="s">${STATUS_LABEL[site.status]}</span>`
      : site.status === 'store'
        ? '<span class="s">보관</span>'
        : '';
    const priority = needsAttention ? 0 : site.status === 'store' ? 2 : 1;
    const icon = L.divIcon({
      html:
        `<div class="mk ${site.status}" data-site="${site.id}" data-pri="${priority}">` +
        `<div class="pt"></div><div class="ld"></div>` +
        `<div class="grp"><div class="bd">${site.unitCount}</div>` +
        `<div class="lb">${site.name}${badge}</div></div></div>`,
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const marker = L.marker([site.lat, site.lon], {
      icon,
      zIndexOffset: needsAttention ? 1000 : 0,
      title: site.name,
    }).addTo(nationLayer);
    marker.on('click', () => pickSite(site.id));
    siteMarkers.set(site.id, marker);
  }
}

function buildUnitPins(site: Site) {
  siteLayer.clearLayers();
  for (const unit of site.units) {
    const icon = L.divIcon({
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      html:
        `<div class="um ${unit.status}" data-unit="${unit.number}">` +
        `<div class="pill"><i></i>${unit.number}호기</div><div class="dot"></div></div>`,
    });
    L.marker([unit.lat, unit.lon], {
      icon,
      title: unit.number + '호기',
      zIndexOffset: unit.status === 'run' ? 0 : 500,
    })
      .addTo(siteLayer)
      .on('click', () => pickUnit(site.id, unit.number));
  }
}

/** 가까이 붙은 배지를 밀어내고, 제자리로 당기는 힘을 함께 준다. */
function placeBadges() {
  if (mode !== 'nation') return;
  const points = shownSites.map(site => {
    const p = map.latLngToLayerPoint([site.lat, site.lon]);
    return { site, homeX: p.x, homeY: p.y, x: p.x, y: p.y };
  });
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i],
          b = points[j];
        let dx = b.x - a.x,
          dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        if (distance < BADGE_GAP) {
          const push = (BADGE_GAP - distance) / 2;
          dx /= distance;
          dy /= distance;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
          moved = true;
        }
      }
    for (const p of points) {
      p.x += (p.homeX - p.x) * PULL_BACK;
      p.y += (p.homeY - p.y) * PULL_BACK;
    }
    if (!moved) break;
  }
  for (const p of points) {
    const el = siteMarkers.get(p.site.id)?.getElement()?.querySelector('.mk');
    if (!el) continue;
    const dx = p.x - p.homeX,
      dy = p.y - p.homeY,
      shift = Math.hypot(dx, dy);
    el.querySelector('.grp').style.transform = `translate(${dx}px,${dy}px)`;
    const shifted = shift > LEADER_LINE_FROM;
    el.classList.toggle('shifted', shifted);
    if (shifted) {
      const leader = el.querySelector('.ld');
      leader.style.width = Math.max(0, shift - 15) + 'px';
      leader.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    }
  }
}

/** 이름표를 배지 둘레 자리 중 겹치지 않는 곳에 둔다. 확인이 급한 현장(pri 0)이 먼저 자리를 잡는다. */
function placeLabels() {
  if (mode !== 'nation') return;
  const markers = [...document.querySelectorAll<HTMLElement>('.mk')].sort(
    (a, b) => Number(a.dataset.pri) - Number(b.dataset.pri),
  );
  // .bd·.lb는 buildNationMarkers가 넣은 것이라 반드시 있다.
  const taken = markers.map(m => m.querySelector('.bd')!.getBoundingClientRect());
  const overlaps = (r: DOMRect) =>
    taken.some(t => r.left < t.right + 2 && r.right > t.left - 2 && r.top < t.bottom + 2 && r.bottom > t.top - 2);
  const overlapArea = (r: DOMRect) =>
    taken.reduce(
      (sum, t) =>
        sum +
        Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left)) *
          Math.max(0, Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top)),
      0,
    );
  // 오른쪽·왼쪽·위·오른아래·왼아래 순으로 시도한다
  const SLOTS = ['', 'pr', 'pl', 'pa', 'pbr', 'pbl'];
  for (const marker of markers) {
    const label = marker.querySelector('.lb')!;
    let placed: { slot: string; rect: DOMRect } | null = null;
    let leastBad: { slot: string; rect: DOMRect; area: number } | null = null;
    for (const slot of SLOTS) {
      label.className = 'lb' + (slot ? ' ' + slot : '');
      const rect = label.getBoundingClientRect();
      const area = overlapArea(rect);
      if (!leastBad || area < leastBad.area) leastBad = { slot, rect, area };
      if (!overlaps(rect)) {
        placed = { slot, rect };
        break;
      }
    }
    // 급한 현장은 겹치더라도 가장 덜 겹치는 자리에 보여 준다
    if (!placed && marker.dataset.pri === '0') placed = leastBad;
    if (placed) {
      label.className = 'lb' + (placed.slot ? ' ' + placed.slot : '');
      taken.push(placed.rect);
    } else label.className = 'lb hide';
  }
}

map.on('zoomend moveend', () => {
  placeBadges();
  placeLabels();
});

/** 좌측 카드가 가리지 않는 영역의 폭 */
const freeWidthLeft = () => $('#card').getBoundingClientRect().right - $('#map').getBoundingClientRect().left;

export function showNation(sites: Site[]) {
  mode = 'nation';
  shownSites = sites;
  buildNationMarkers(sites);
  const mapEl = $('#map');
  mapEl.classList.remove('site');
  siteLayer.remove();
  streetTiles.remove();
  if (countryOutline) countryOutline.addTo(map);
  nationLayer.addTo(map);
  map.invalidateSize({ animate: false });
  map.fitBounds(
    [
      [34.4, 126.2],
      [38.3, 129.5],
    ],
    { paddingTopLeft: [freeWidthLeft() + 30, 70], paddingBottomRight: [40, 30], animate: false },
  );
  placeBadges();
  placeLabels();
}

export function showSite(site: Site) {
  mode = 'site';
  const mapEl = $('#map');
  mapEl.classList.add('site');
  nationLayer.remove();
  if (countryOutline) countryOutline.remove();
  streetTiles.addTo(map);
  buildUnitPins(site);
  siteLayer.addTo(map);
  map.invalidateSize({ animate: false });
  // 좌측 카드가 가리지 않는 영역 한가운데로 현장을 옮긴다.
  const bounds = L.latLngBounds(site.units.map(u => [u.lat, u.lon]));
  const focus = bounds.getCenter();
  map.setView(focus, SITE_ZOOM, { animate: false });
  const left = freeWidthLeft();
  const free = { x: left + 30, y: 90, width: mapEl.clientWidth - left - 70, height: mapEl.clientHeight - 130 };
  const point = map.latLngToContainerPoint(focus);
  map.panBy([point.x - (free.x + free.width / 2), point.y - (free.y + free.height / 2)], { animate: false });
}

/** 호기 단계 — 카메라 벽이 지도를 대신한다. */
export function hideMap() {
  mode = 'hidden';
  const mapEl = $('#map');
  mapEl.classList.add('site');
  nationLayer.remove();
  siteLayer.remove();
  streetTiles.remove();
  mapEl.style.display = 'none';
}
