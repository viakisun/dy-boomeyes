// Leaflet 지도 — 전국 마커, 현장 호기 핀, 겹침 밀어내기, 이름표 자리 찾기.
// 시안이 고른 Leaflet + OSM.de 타일 + world-atlas 국경선을 그대로 쓴다.
import { $, LABEL, WARN_ST } from './ui';
import { db, state } from './store';
import type { Site } from './types';

declare const L: any, topojson: any;

/** 현장 단계의 고정 줌. 시드가 호기 좌표를 이 줌 기준으로 만든다. */
export const SITE_Z = 17;

export const map = L.map('map', {
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

let vectorLayer: any = null;
// 현장·호기 단계의 거리 지도(OSM 커뮤니티 타일)
const tiles = L.layerGroup([
  L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors',
  }),
]);
const nationLayer = L.layerGroup().addTo(map);
const siteLayer = L.layerGroup();
/** 현장 id → 마커. 서버에서 받은 데이터에 Leaflet 객체를 얹지 않으려고 따로 둔다. */
const markers = new Map<string, any>();

/** 클릭했을 때 어디로 갈지는 main이 정한다 */
let onSite: (id: string) => void = () => {};
let onUnit: (siteId: string, num: number) => void = () => {};
export function onPick(site: typeof onSite, unit: typeof onUnit) {
  onSite = site;
  onUnit = unit;
}

fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json')
  .then(r => r.json())
  .then(topo => {
    const fc = topojson.feature(topo, topo.objects.countries);
    vectorLayer = L.geoJSON(fc, {
      style: (f: any) =>
        f.id === '410'
          ? { fillColor: '#FFFFFF', fillOpacity: 1, color: '#9FB0BA', weight: 1.2 }
          : { fillColor: '#F1F4F6', fillOpacity: 1, color: '#D5DDE2', weight: 0.8 },
      interactive: false,
    });
    if (state.level === 'nation') vectorLayer.addTo(map);
  });

export function buildNationMarkers(sites: Site[]) {
  nationLayer.clearLayers();
  markers.clear();
  for (const s of sites) {
    const warn = WARN_ST.includes(s.st);
    const status = warn
      ? `<span class="s">${LABEL[s.st]}</span>`
      : s.st === 'store'
        ? '<span class="s">보관</span>'
        : '';
    const html =
      `<div class="pt"></div><div class="ld"></div>` +
      `<div class="grp"><div class="bd">${s.n}</div><div class="lb">${s.name}${status}</div></div>`;
    const icon = L.divIcon({
      html: `<div class="mk ${s.st}" data-site="${s.id}" data-pri="${warn ? 0 : s.st === 'store' ? 2 : 1}">${html}</div>`,
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const m = L.marker([s.lat, s.lon], { icon, zIndexOffset: warn ? 1000 : 0, title: s.name }).addTo(nationLayer);
    m.on('click', () => onSite(s.id));
    markers.set(s.id, m);
  }
}

function buildSiteLayer(s: Site) {
  siteLayer.clearLayers();
  for (const u of s.units) {
    const icon = L.divIcon({
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      html: `<div class="um ${u.st}" data-unit="${u.num}"><div class="pill"><i></i>${u.num}호기</div><div class="dot"></div></div>`,
    });
    const m = L.marker([u.lat, u.lon], {
      icon,
      title: u.num + '호기',
      zIndexOffset: u.st === 'run' ? 0 : 500,
    }).addTo(siteLayer);
    m.on('click', () => onUnit(s.id, u.num));
  }
}

function fitNation() {
  const left = $('#card').getBoundingClientRect().right - $('#map').getBoundingClientRect().left;
  map.fitBounds(
    [
      [34.4, 126.2],
      [38.3, 129.5],
    ],
    { paddingTopLeft: [left + 30, 70], paddingBottomRight: [40, 30], animate: false },
  );
  placeBadges();
  placeLabels();
}

/** 가까이 붙은 현장 배지를 최소 간격만큼 밀어내고, 제자리로 당기는 힘을 함께 준다. */
function placeBadges() {
  if (state.level !== 'nation') return;
  const pts = db.sites.map(s => {
    const p = map.latLngToLayerPoint([s.lat, s.lon]);
    return { s, ox: p.x, oy: p.y, x: p.x, y: p.y };
  });
  const MIN = 38;
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i],
          b = pts[j];
        let dx = b.x - a.x,
          dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < MIN) {
          const push = (MIN - d) / 2;
          dx /= d;
          dy /= d;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
          moved = true;
        }
      }
    for (const p of pts) {
      p.x += (p.ox - p.x) * 0.05;
      p.y += (p.oy - p.y) * 0.05;
    }
    if (!moved) break;
  }
  for (const p of pts) {
    const el = markers.get(p.s.id)?.getElement()?.querySelector('.mk');
    if (!el) continue;
    const dx = p.x - p.ox,
      dy = p.y - p.oy,
      len = Math.hypot(dx, dy);
    el.querySelector('.grp').style.transform = `translate(${dx}px,${dy}px)`;
    const shifted = len > 6;
    el.classList.toggle('shifted', shifted);
    if (shifted) {
      const ld = el.querySelector('.ld');
      ld.style.width = Math.max(0, len - 15) + 'px';
      ld.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    }
  }
}

/** 이름표를 배지 주변 자리 중 겹치지 않는 곳에 둔다. 확인이 필요한 현장(pri 0)이 먼저 자리를 잡는다. */
function placeLabels() {
  if (state.level !== 'nation') return;
  const mks: any[] = [...(document.querySelectorAll('.mk') as any)].sort((a, b) => a.dataset.pri - b.dataset.pri);
  const taken = mks.map(m => m.querySelector('.bd').getBoundingClientRect());
  const hit = (r: any) =>
    taken.some(t => r.left < t.right + 2 && r.right > t.left - 2 && r.top < t.bottom + 2 && r.bottom > t.top - 2);
  const overlap = (r: any) =>
    taken.reduce(
      (a, t) =>
        a +
        Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left)) *
          Math.max(0, Math.min(r.bottom, t.bottom) - Math.max(r.top, t.top)),
      0,
    );
  for (const m of mks) {
    const lb = m.querySelector('.lb');
    let placed = null,
      fallback = null;
    for (const p of ['', 'pr', 'pl', 'pa', 'pbr', 'pbl']) {
      lb.className = 'lb' + (p ? ' ' + p : '');
      const r = lb.getBoundingClientRect();
      const o = overlap(r);
      if (!fallback || o < fallback.o) fallback = { p, r, o };
      if (!hit(r)) {
        placed = { p, r };
        break;
      }
    }
    if (!placed && m.dataset.pri === '0') placed = fallback;
    if (placed) {
      lb.className = 'lb' + (placed.p ? ' ' + placed.p : '');
      taken.push(placed.r);
    } else lb.className = 'lb hide';
  }
}

map.on('zoomend moveend', () => {
  placeBadges();
  placeLabels();
});

/** 화면 단계에 맞춰 레이어와 화각을 맞춘다. */
export function showLevel(s: Site | null) {
  map.invalidateSize({ animate: false });
  const mapEl = $('#map');
  if (state.level === 'nation') {
    mapEl.classList.remove('site');
    siteLayer.remove();
    tiles.remove();
    if (vectorLayer) vectorLayer.addTo(map);
    nationLayer.addTo(map);
    fitNation();
    return;
  }
  if (state.level === 'unit') {
    // 호기 단계는 카메라 벽이 지도를 대신한다.
    mapEl.classList.add('site');
    nationLayer.remove();
    siteLayer.remove();
    tiles.remove();
    mapEl.style.display = 'none';
    return;
  }
  mapEl.classList.add('site');
  nationLayer.remove();
  if (vectorLayer) vectorLayer.remove();
  tiles.addTo(map);
  buildSiteLayer(s!);
  siteLayer.addTo(map);
  // 좌측 카드가 가리지 않는 영역 한가운데로 현장을 옮긴다.
  const b = L.latLngBounds(s!.units.map(u => [u.lat, u.lon]));
  const left = $('#card').getBoundingClientRect().right - mapEl.getBoundingClientRect().left;
  const focus = b.getCenter();
  map.setView(focus, SITE_Z, { animate: false });
  const free = { x: left + 30, y: 90, w: mapEl.clientWidth - left - 70, h: mapEl.clientHeight - 130 };
  const p = map.latLngToContainerPoint(focus);
  map.panBy([p.x - (free.x + free.w / 2), p.y - (free.y + free.h / 2)], { animate: false });
}
