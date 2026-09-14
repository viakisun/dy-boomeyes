// 운영 현황 — Claude Design 「운영 현황 목업.html」을 파일로 나눈 것. 로직은 시안 그대로다.
import './style.css';
import { SITES, SITE_Z, LABEL, COLOR, UNIT_MSG, UNIT_TITLE, CAMVIEW, DOCS, REQS, REQ_ST, ll } from './data';

declare const L: any, topojson: any;

/* ---------- state ---------- */
const state: any = { level: 'nation', site: null, unit: null, cam: 0, mode: '실시간', layout: 'B', viewer: true, tab: 'ops', q: '', fst: 'all', fsite: 'all', fexp: 'all', sort: 'attn', group: false };
const $ = (sel: string): any => document.querySelector(sel);
const map = L.map('map', { zoomControl: true, attributionControl: true, minZoom: 6, maxZoom: 19, fadeAnimation: false, zoomAnimation: true, zoomSnap: 0.25, zoomDelta: 0.5 });
map.zoomControl.setPosition('bottomright');
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json').then(r => r.json()).then(topo => {
  const fc = topojson.feature(topo, topo.objects.countries);
  vectorLayer = L.geoJSON(fc, { style: f => f.id === '410'
    ? { fillColor: '#FFFFFF', fillOpacity: 1, color: '#9FB0BA', weight: 1.2 }
    : { fillColor: '#F1F4F6', fillOpacity: 1, color: '#D5DDE2', weight: .8 }, interactive: false });
  if (state.level === 'nation') vectorLayer.addTo(map);
});
let vectorLayer = null;
// Street basemap for site/unit levels (OSM community tiles, desaturated to match the UI)
const tiles = L.layerGroup([
  L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' })
]);
const nationLayer = L.layerGroup().addTo(map);
const siteLayer = L.layerGroup();

function goTab(t) { state.tab = t; if (t !== 'req') state.req = null; if (t !== 'ops') { state.level = 'nation'; state.unit = null; } render(); }
function go(level, site?, unit?) {
  state.tab = 'ops';
  state.level = level; state.site = site ?? state.site; if (unit !== state.unit) state.cam = 0; state.unit = unit ?? null; state.full = null; $('#fullv').hidden = true;
  render();
}

/* ---------- render ---------- */
function render() {
  document.querySelectorAll('.rail .nav').forEach(b => b.classList.toggle('on', (b as any).dataset.tab === state.tab));
  const fleet = state.tab === 'fleet', req = state.tab === 'req';
  $('#fleet').hidden = !fleet; $('#req').hidden = !req; $('#card').hidden = fleet || req; $('#map').style.visibility = (fleet || req) ? 'hidden' : '';
  $('#rbadge').textContent = REQS.filter(r => r.st === 'new').length || '';
  $('#nbadge').textContent = inboxEvents().filter(e => !state.read.has(e.title + (e.u ? e.u.code : e.s.id))).length || '';
  if (req) { $('#band').classList.add('hide'); $('#wall').hidden = true; document.body.className = ''; $('#crumb').innerHTML = state.req ? `<button onclick="state.req=null;render()">요청</button><span class="sep">›</span><b>${state.req.site}</b>` : '<b>요청</b>'; renderReq(); return; }
  if (fleet) { $('#band').classList.add('hide'); $('#wall').hidden = true; document.body.className = ''; $('#crumb').innerHTML = '<b>보유 장비</b>'; renderFleet(); return; }
  renderCrumb(); renderBand(); renderCard();
  $('#band').classList.toggle('hide', state.level === 'unit');
  const isUnit = state.level === 'unit', v: string = isUnit ? 'B' : 'A';
  document.body.className = 'v' + v;
  if (v !== 'B') { $('#map').removeAttribute('style'); }
  $('#wall').hidden = v !== 'B';
  if (v === 'B') renderWall();
  map.invalidateSize({ animate: false });
  const mapEl = $('#map');
  if (state.level === 'nation') {
    mapEl.classList.remove('site'); siteLayer.remove(); tiles.remove(); if (vectorLayer) vectorLayer.addTo(map); nationLayer.addTo(map);
    fitNation();
  } else if (v === 'B') {
    mapEl.classList.add('site'); nationLayer.remove(); siteLayer.remove(); tiles.remove(); mapEl.style.display = 'none';
  } else {
    mapEl.classList.add('site'); nationLayer.remove(); if (vectorLayer) vectorLayer.remove(); tiles.addTo(map); buildSiteLayer(); siteLayer.addTo(map);
    const s = state.site, b = L.latLngBounds(s.units.map(u => ll(s, u.d)));
    const left = $('#card').getBoundingClientRect().right - mapEl.getBoundingClientRect().left;
    const focus = state.level === 'unit' ? L.latLng(ll(s, state.unit.d)) : b.getCenter();
    map.setView(focus, SITE_Z, { animate: false });
    const free = { x: left + 30, y: state.level === 'unit' ? 30 : 90, w: mapEl.clientWidth - left - 70, h: mapEl.clientHeight - (state.level === 'unit' ? 60 : 130) - (v === 'C' ? 140 : 0) };
    const p = map.latLngToContainerPoint(focus);
    map.panBy([p.x - (free.x + free.w / 2) + (state.level === 'unit' ? -70 : 0), p.y - (free.y + free.h / 2)], { animate: false });
    document.querySelectorAll('.um').forEach(el => el.classList.toggle('on', state.unit && (el as any).dataset.unit === String(state.unit.num)));
  }
}

  $('#variant')?.addEventListener('click', e => { const b = (e.target as any).closest('button'); if (b) { state.layout = b.dataset.v; render(); } });
const AI_OVERLAY = `<div class="det p" style="left:86%;top:56%;width:8%;height:32%"><span>작업자 · 4.2 m</span></div><div class="det t" style="left:78%;top:42%;width:8%;height:12%"><span>붐 끝 · 타설 중</span></div><div class="det z" style="left:54%;top:60%;width:42%;height:34%"><span>접근 주의 구역</span></div>`;
const feedHtml = (u, i) => { const c = u.cams[i]; const ev = c[0] === 'ai' ? u.ai.filter(e => e.lvl === 'warn').length : 0; return `<div class="feed ${c[0]} ${i === state.cam ? 'on' : ''} ${ev ? 'alert' : ''}" data-cam="${i}" style="background-image:url(screens/cpb-scene.png);background-size:${CAMVIEW[i]}" onclick="openFull(${i})"><span class="live"><i></i>${c[1]}</span>${ev ? `<span class="evb">이벤트 ${ev}</span>` : ''}${c[0] === 'ai' ? AI_OVERLAY : ''}<span class="ts">10:42:0${i}</span><span class="exp">⤢</span></div>`; };
function renderWall() { const u = state.unit; $('#wall').innerHTML = u.cams.map((c, i) => feedHtml(u, i)).join(''); fitWall(); }
// Pick the column count (3 or 2) that gives the largest 16:9 tiles inside the wall area.
function fitWall() {
  const w = $('#wall'); if (w.hidden) return; const n = state.unit.cams.length, gap = 12, W = w.clientWidth, H = w.clientHeight; let best = null;
  for (const cols of [3, 2]) { const rows = Math.ceil(n / cols); let tw = (W - gap * (cols - 1)) / cols, th = tw * 9 / 16; if (rows * th + gap * (rows - 1) > H) { th = (H - gap * (rows - 1)) / rows; tw = th * 16 / 9; } if (!best || tw > best.tw) best = { cols, tw }; }
  w.style.gridTemplateColumns = `repeat(${best.cols}, ${Math.floor(best.tw)}px)`;
}
new ResizeObserver(() => fitWall()).observe($('#wall'));
function openFull(i) { state.full = i; renderFull(); }
function closeFull() { state.full = null; renderFull(); }
function renderFull() {
  const el = $('#fullv'), u = state.unit;
  if (state.full == null || !u) { el.hidden = true; el.innerHTML = ''; return; }
  const i = state.full, c = u.cams[i], n = u.cams.length;
  el.hidden = false;
  el.innerHTML = `
    <div class="fv-top"><span class="fv-name"><i></i>LIVE · ${u.num}호기 · ${c[1]}</span><span class="fv-time">${new Date().toLocaleDateString('ko-KR')} 10:42:0${i}</span><button class="fv-x" onclick="closeFull()" aria-label="닫기">×</button></div>
    <div class="fv-stage">
      <button class="fv-nav l" onclick="openFull(${(i + n - 1) % n})">‹</button>
      <div class="fv-video ${c[0]}"><div class="fv-frame" style="background-image:url(screens/cpb-scene.png)">${c[0] === 'ai' ? AI_OVERLAY : ''}</div></div>
      <button class="fv-nav r" onclick="openFull(${(i + 1) % n})">›</button>
    </div>
    <div class="fv-strip">${u.cams.map((cc, k) => `<button class="${k === i ? 'on' : ''} ${cc[0]}" style="background-image:url(screens/cpb-scene.png);background-size:${CAMVIEW[k]}" onclick="openFull(${k})"><span>${cc[1]}</span></button>`).join('')}</div>`;
}
document.addEventListener('keydown', e => { if (state.full == null) return; if (e.key === 'Escape') closeFull(); if (e.key === 'ArrowLeft') openFull((state.full + state.unit.cams.length - 1) % state.unit.cams.length); if (e.key === 'ArrowRight') openFull((state.full + 1) % state.unit.cams.length); });
function renderDock() {
  const u = state.unit, i = state.cam, c = u.cams[i];
  $('#dock').innerHTML = u.cams.map((c, i) => feedHtml(u, i)).join('') + (state.viewer ? `<div class="viewer ${c[0]}" style="background-image:url(screens/cpb-scene.png);background-size:${CAMVIEW[i]}"><span class="live"><i></i>LIVE · ${c[1]}</span>${c[0] === 'ai' ? AI_OVERLAY : ''}<button class="x" onclick="state.viewer=false;render()">×</button></div>` : '');
}

function placeMini() { return; }
new ResizeObserver(() => placeMini()).observe($('#card'));
new MutationObserver(() => requestAnimationFrame(placeMini)).observe($('#card'), { childList: true, subtree: true, attributes: true });
function renderCrumb() {
  const s = state.site, u = state.unit;
  let h = state.level === 'nation' ? `<b>전국</b>` : `<button onclick="go('nation')">전국</button>`;
  if (s && state.level !== 'nation') h += state.level === 'site' ? `<span class="sep">›</span><b>${s.name}</b>` : `<span class="sep">›</span><button onclick="go('site')">${s.name}</button>`;
  if (u && state.level === 'unit') h += `<span class="sep">›</span><b>${u.num}호기</b>`;
  $('#crumb').innerHTML = h;
}

function renderBand() {
  const units = state.level === 'nation' ? SITES.flatMap(s => s.units) : state.site.units;
  const c = (st) => units.filter(u => u.st === st).length;
  const cells = [['total', units.length, state.level === 'nation' ? '보유 장비' : state.site.st === 'store' ? '보관 장비' : '투입 호기'], ['', c('run'), '가동 중'], ['fault', c('fault'), '고장'], ['check', c('check'), '점검'], ['late', c('late'), '수신 지연'], ['dim', c('store'), '보관']];
  $('#band').innerHTML = cells.filter(([k, n]) => k === 'total' || k === '' || n > 0).map(([k, n, l]) => `<div class="cell ${k}"><b>${n}</b>${l}</div>`).join('');
}

/* ---------- inbox panel (bell) ---------- */
function inboxEvents() {
  const ev = [];
  for (const s of SITES) for (const u of s.units) {
    if (u.st === 'fault') ev.push({ k: 'fault', t: '08:41', s, u, title: '고장', sub: UNIT_MSG.fault });
    if (u.st === 'late') ev.push({ k: 'late', t: '7. 3. 08:22', s, u, title: '수신 지연', sub: '마지막 수신 이후 응답 없음' });
    if (u.st === 'check') ev.push({ k: 'check', t: '어제', s, u, title: '점검 시기', sub: UNIT_MSG.check + ' · 기한 9. 20.' });
    for (const e of (u.ai || []).filter(e => e.lvl === 'warn')) ev.push({ k: 'ai', t: e.t.slice(0, 5), s, u, title: 'AI · ' + e.type, sub: e.detail });
    for (const p of u.parts) if (p[1] === 'wear' && p[2] >= p[3]) ev.push({ k: 'check', t: '오늘', s, u, title: '소모품 한계', sub: `${p[0]} ${p[2]}% · 교체 기준 ${p[3]}%` });
  }
  for (const s of SITES) if (s.st !== 'store' && s.dday <= 35) ev.push({ k: 'exp', t: `D-${s.dday}`, s, u: null, title: '계약 종료 임박', sub: `${s.name} · ${s.units.length}대 · ${s.end}` });
  return ev;
}
state.read = new Set();
function toggleInbox(force) { const el = $('#inbox'); el.hidden = force != null ? !force : !el.hidden; if (!el.hidden) renderInbox(); }
function renderInbox() {
  const ev = inboxEvents(), unread = ev.filter(e => !state.read.has(e.title + (e.u ? e.u.code : e.s.id)));
  $('#inbox').innerHTML = `<header><h2>알림<small>미확인 ${unread.length}</small></h2><button onclick="inboxEvents().forEach(e=>state.read.add(e.title+(e.u?e.u.code:e.s.id)));renderInbox();render()">모두 읽음</button></header>
    <div class="list">${ev.map((e, i) => { const id = e.title + (e.u ? e.u.code : e.s.id); return `<div class="ev ${e.k} ${state.read.has(id) ? 'read' : ''}" onclick="state.read.add('${id.replace(/'/g, '')}');toggleInbox(false);${e.u ? `go('unit', SITES.find(x=>x.id==='${e.s.id}'), SITES.find(x=>x.id==='${e.s.id}').units.find(x=>x.num===${e.u.num}))` : `go('site', SITES.find(x=>x.id==='${e.s.id}'))`}">
      <span class="d"></span><div><div class="nm">${e.u ? e.u.num + '호기 ' : ''}<span>${e.title}</span></div><div class="sub">${e.u ? e.s.name + ' · ' : ''}${e.sub}</div></div><span class="t">${e.t}</span></div>`; }).join('')}</div>
    <footer>읽음은 확인 표시입니다. 장비 문제의 해소는 상태가 정상으로 바뀜 때 기록됩니다.</footer>`;
}
document.addEventListener('click', e => { if (!(e.target as any).closest('#inbox, #bell')) $('#inbox').hidden = true; });

/* ---------- contracts / requests ---------- */
function renderReq() {
  const el = $('#req');
  if (!state.req) {
    const order = { new: 0, assign: 1, ship: 2, run: 3, done: 4 };
    const rows = [...REQS].sort((a, b) => order[a.st] - order[b.st]);
    el.innerHTML = `
      <div class="ftop"><h2 class="rh">현장 요청</h2><span class="rsub">현장 안전관리자가 보낸 CPB 요청을 받아 호기를 배정합니다</span></div>
      <div class="fmeta"><span><b>${REQS.filter(r => r.st === 'new').length}건</b> 새 요청 · 배정 중 <b>${REQS.filter(r => r.st === 'assign').length}건</b></span>
        <span class="cnts"><span>보관 가용 <b>${SITES.find(s => s.st === 'store').units.length}대</b></span><span>90일 내 종료 <b>${SITES.filter(s => s.st !== 'store' && s.dday <= 90).reduce((a, s) => a + s.units.length, 0)}대</b></span></span></div>
      <div class="ftbl"><table>
        <thead><tr><th>요청</th><th>현장</th><th>기간</th><th class="r">대수</th><th>상태</th><th>접수</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="u" onclick="state.req=REQS.find(x=>x.id==='${r.id}');render()">
          <td class="mono">${r.id}</td>
          <td class="site">${r.site}<small>${r.region} · ${r.builder} · ${r.mgr}</small></td>
          <td class="mono">${r.from}<span class="sub">– ${r.to}</span></td>
          <td class="r"><b>${r.n}</b>대</td>
          <td><span class="rst ${r.st}">${REQ_ST[r.st]}</span></td>
          <td class="mono">${r.at}</td></tr>`).join('')}</tbody></table></div>`;
    return;
  }
  const r = state.req;
  const picked = r.picked || (r.picked = []);
  // Candidates: units in storage, plus units whose site contract ends before the requested start.
  const cands = SITES.flatMap(s => s.units.map(u => ({ u, s })))
    .filter(({ u, s }) => s.st === 'store' || (s.st !== 'store' && s.dday <= 60))
    .filter(({ u }) => !['fault'].includes(u.st))
    .sort((a, b) => (a.s.st === 'store' ? 0 : 1) - (b.s.st === 'store' ? 0 : 1) || a.s.dday - b.s.dday);
  const why = ({ u, s }) => s.st === 'store'
    ? `<b class="ok">보관 중</b><span>${s.name}</span>`
    : `<b>D-${s.dday} 종료</b><span>${s.name} · ${s.end}</span>`;
  const risk = ({ u, s }) => u.st === 'check' ? '<span class="chip part">점검 필요</span>' : u.st === 'store' && u.recv === '수신 없음' ? '<span class="chip">단말기 미장착</span>' : u.docs.length < 4 ? '<span class="chip">서류 미비</span>' : '';
  el.innerHTML = `
    <div class="rdetail">
      <aside class="rcard">
        <div class="rhead"><div class="mono-s">${r.id} · ${r.at} 접수</div><h2>${r.site}</h2><div class="addr">${r.region} · ${r.builder}</div></div>
        <div class="rsec"><dl class="kv"><dt>요청 기간</dt><dd>${r.from} – ${r.to}</dd><dt>필요 대수</dt><dd>${r.n}대</dd><dt>사양</dt><dd>${r.spec}</dd><dt>안전관리자</dt><dd>${r.mgr} · <a href="#" onclick="return false">${r.tel}</a></dd></dl></div>
        <div class="rsec pick">
          <h3 class="sh">배정 <span>${picked.length} / ${r.n}대</span></h3>
          ${picked.length ? `<div class="pl">${picked.map(k => { const c = cands.find(x => x.u.code === k); return `<div>${c.u.num}호기 <span class="mono-s">${c.u.code}</span><button onclick="togglePick('${k}')">×</button></div>`; }).join('')}</div>` : '<p class="empty-s">우측 후보에서 호기를 고르세요</p>'}
          <button class="confirm" ${picked.length === r.n ? '' : 'disabled'}>배정 확정 · 회신</button>
        </div>
      </aside>
      <div class="rlist">
        <div class="fmeta"><span><b>${cands.length}대</b> 후보 · 요청 시작 ${r.from} 기준</span><span class="cnts"><span>보관 <b>${cands.filter(c => c.s.st === 'store').length}</b></span><span>종료 임박 <b>${cands.filter(c => c.s.st !== 'store').length}</b></span></span></div>
        <div class="ftbl"><table>
          <thead><tr><th>호기</th><th>가용 근거</th><th>마지막 수신</th><th>확인 사항</th><th class="r">배정</th></tr></thead>
          <tbody>${cands.map(c => `<tr class="${picked.includes(c.u.code) ? 'sel' : ''}">
            <td class="unit"><b>${c.u.num}호기</b><span>${c.u.code}</span></td>
            <td class="avail">${why(c)}</td>
            <td class="mono">${c.u.st === 'store' ? '수신 없음' : c.u.recv.replace(' 수신', '')}</td>
            <td>${risk(c)}</td>
            <td class="r"><button class="pickb ${picked.includes(c.u.code) ? 'on' : ''}" onclick="togglePick('${c.u.code}')">${picked.includes(c.u.code) ? '배정됨' : '배정'}</button></td></tr>`).join('')}</tbody></table></div>
      </div>
    </div>`;
}
function togglePick(code) {
  const r = state.req, p = r.picked || (r.picked = []);
  const i = p.indexOf(code);
  if (i >= 0) p.splice(i, 1); else if (p.length < r.n) p.push(code);
  renderReq();
}

/* ---------- fleet table ---------- */
const ORDER = {fault:0, check:1, late:2, run:3, store:4};
function renderFleet() {
  const el = $('#fleet');
  const all = SITES.flatMap(s => s.units.map(u => ({ u, s })));
  const q = state.q.trim().toLowerCase();
  let rows = all.filter(({ u, s }) => {
    if (q && !(`${u.num}호기 ${u.code} ${s.name} ${s.region} ${s.builder}`.toLowerCase().includes(q))) return false;
    if (state.fst === 'attn' ? !['fault','check','late'].includes(u.st) : state.fst !== 'all' && u.st !== state.fst) return false;
    if (state.fsite !== 'all' && s.id !== state.fsite) return false;
    if (state.fexp !== 'all' && (s.st === 'store' || s.dday > +state.fexp)) return false;
    return true;
  });
  const attnN = { fault: 0, check: 0, late: 0 }; all.forEach(({ u }) => { if (attnN[u.st] != null) attnN[u.st]++; });
  const partWarn = u => u.parts.filter(p => p[1] === 'wear' ? p[2] >= p[3] - 10 : p[2] <= 14).length;
  const aiWarn = u => (u.ai || []).filter(e => e.lvl === 'warn').length;
  const sorters = {
    attn: (a, b) => ORDER[a.u.st] - ORDER[b.u.st] || (aiWarn(b.u) + partWarn(b.u)) - (aiWarn(a.u) + partWarn(a.u)) || a.u.num - b.u.num,
    num: (a, b) => a.u.num - b.u.num,
    site: (a, b) => a.s.name.localeCompare(b.s.name, 'ko') || a.u.num - b.u.num,
    exp: (a, b) => (a.s.st === 'store' ? 9999 : a.s.dday) - (b.s.st === 'store' ? 9999 : b.s.dday) || a.u.num - b.u.num,
  };
  rows.sort(sorters[state.sort]);
  const sites = [...new Map(SITES.map(s => [s.id, s])).values()];
  const th = (k, label, cls?) => `<th class="${cls || ''} ${state.sort === k ? 'on' : ''}" onclick="state.sort='${k}';renderFleet()">${label}</th>`;
  const tr = ({ u, s }, grouped) => {
    const soon = s.st !== 'store' && s.dday <= 30;
    const chips = [aiWarn(u) ? `<span class="chip ai">AI ${aiWarn(u)}</span>` : '', partWarn(u) ? `<span class="chip part">소모품 ${partWarn(u)}</span>` : '', u.docs.length < 4 ? `<span class="chip">서류 미비</span>` : ''].join('');
    return `<tr class="u" onclick="go('unit', SITES.find(x=>x.id==='${s.id}'), SITES.find(x=>x.id==='${s.id}').units.find(x=>x.num===${u.num}))">
      <td class="unit"><b>${u.num}호기</b><span>${u.code}</span></td>
      ${grouped ? '' : `<td class="site">${s.name}<small>${s.region}${s.st !== 'store' ? ' · ' + s.builder : ''}</small></td>`}
      <td class="st"><b class="${u.st}">${LABEL[u.st]}</b>${u.st !== 'run' && u.st !== 'late' ? `<span>${UNIT_MSG[u.st]}</span>` : ''}</td>
      <td class="mono ${u.st === 'late' ? 'late' : ''}">${u.st === 'store' ? '수신 없음' : u.recv.replace('마지막 수신 ', '').replace(' 수신', '')}</td>
      <td class="mono r ${soon ? 'soon' : ''}">${s.st === 'store' ? '—' : `D-${s.dday}<span class="sub">${s.end}</span>`}</td>
      <td>${chips}</td></tr>`;
  };
  let body;
  if (!rows.length) body = `<tr><td colspan="6" class="empty">조건에 맞는 장비가 없습니다</td></tr>`;
  else if (state.group) {
    const bySite = new Map(); rows.forEach(r => { if (!bySite.has(r.s.id)) bySite.set(r.s.id, []); bySite.get(r.s.id).push(r); });
    body = [...bySite.entries()].map(([id, rs]) => `<tr class="g"><td colspan="5">${rs[0].s.name}<span>${rs.length}대 · ${rs[0].s.st === 'store' ? '보관소' : 'D-' + rs[0].s.dday}</span></td></tr>` + rs.map(r => tr(r, true)).join('')).join('');
  } else body = rows.map(r => tr(r, false)).join('');
  el.innerHTML = `
    <div class="ftop">
      <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="fq" placeholder="호기, CPB 코드, 현장, 건설사" value="${state.q.replace(/"/g, '&quot;')}" oninput="state.q=this.value;renderFleet();document.getElementById('fq').focus()"></label>
      <select onchange="state.fst=this.value;renderFleet()">${[['all','상태 전체'],['attn','확인 필요'],['fault','고장'],['check','점검'],['late','수신 지연'],['run','정상'],['store','보관']].map(([v, l]) => `<option value="${v}" ${state.fst === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select onchange="state.fsite=this.value;renderFleet()"><option value="all">현장 전체</option>${sites.map(s => `<option value="${s.id}" ${state.fsite === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
      <select onchange="state.fexp=this.value;renderFleet()">${[['all','계약 종료 전체'],['30','30일 이내'],['60','60일 이내'],['90','90일 이내']].map(([v, l]) => `<option value="${v}" ${state.fexp === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="tog ${state.group ? 'on' : ''}" onclick="state.group=!state.group;renderFleet()">현장별 보기</button>
    </div>
    <div class="fmeta"><span><b>${all.length}대</b> 중 <b>${rows.length}대</b> 표시</span>
      <span class="cnts"><span>투입 <b>${all.filter(r => r.u.st !== 'store').length}</b></span><span class="fault">고장 <b>${attnN.fault}</b></span><span class="check">점검 <b>${attnN.check}</b></span><span class="late">지연 <b>${attnN.late}</b></span><span>보관 <b>${all.filter(r => r.u.st === 'store').length}</b></span></span></div>
    <div class="ftbl"><table>
      <thead><tr>${th('num', '호기')}${state.group ? '' : th('site', '현장')}${th('attn', '상태')}<th>마지막 수신</th>${th('exp', '계약 종료', 'r')}<th>주의</th></tr></thead>
      <tbody>${body}</tbody></table></div>`;
}

/* ---------- national layer ---------- */
function renderCard() {
  const card = $('#card');
  const warnSt = ['fault','check','late'];
  if (state.level === 'nation') {
    card.classList.remove('wide', 'unit');
    const warn = SITES.filter(s => warnSt.includes(s.st));
    card.innerHTML = `<header><h2>확인 필요<small>${warn.length}개 현장 · ${SITES.flatMap(s => s.units).filter(u => warnSt.includes(u.st)).length}대</small></h2><a href="#" onclick="return false">전체 ${SITES.length}개 현장</a></header>
      <div class="body">${warn.map(s => `<div class="row" data-site="${s.id}" onclick="go('site', SITES.find(x=>x.id==='${s.id}'))">
        <div><div class="nm">${s.name}</div><div class="sub"><em style="color:${COLOR[s.st]}">${LABEL[s.st]}</em> · ${s.note}</div></div><div class="cnt">${s.n}대</div></div>`).join('')}</div>`;
    return;
  }
  card.classList.add('wide'); card.classList.remove('unit');
  const s = state.site;
  // Contract and site contact are static per site: one folded line at the bottom.
  const contract = s.st === 'store' ? '' : `<details><summary><span>${s.builder} · 종료까지 D-${s.dday} · ${s.mgr} ☏</span><span class="chev"></span></summary>
      <div class="sec" style="border-bottom:0">
        <div class="dates"><span>${s.start}</span><span>${s.end}</span></div>
        <div class="bar"><i style="width:${s.prog*100}%"></i><b style="left:${s.prog*100}%"></b></div>
        <div class="call"><button>☏ ${s.mgr} · 010-0000-0000</button><button class="ic" title="복사">⧉</button></div>
      </div></details>`;
  if (state.level === 'site') {
    const order = {fault:0, check:1, late:2, run:3, store:4};
    const units = [...s.units].sort((a,b) => order[a.st]-order[b.st] || a.num-b.num);
    card.innerHTML = `<header><h2>호기<small>${units.length}대</small></h2><a href="#" onclick="return false">보유 장비에서 보기</a></header>
      <div class="body">${units.map(u => unitRow(u)).join('')}</div>${contract}`;
    return;
  }
  const u = state.unit;
  card.classList.add('unit');
  const warn = warnSt.includes(u.st);
  const since = u.st === 'fault' ? '08:41부터' : u.st === 'check' ? '기한 9. 20.' : '';
  card.innerHTML = unitCard(u, s, warn, since);
}
function unitCard(u, s, warn, since) {
  const live = u.st === 'store' || u.st === 'late';
  const tv = (val, unit, cls?) => `<span class="val"><b class="${cls || ''}">${val}</b><small>${unit}</small></span>`;
  // Live telemetry — assumed field set, to be replaced by the real CPB data list.
  const tele = [
    ['공급 전압', u.st === 'fault' ? tv('198', 'V', 'bad') : live ? tv('—', '') : tv('221', 'V')],
    ['유압', live ? tv('—', '') : tv(u.st === 'fault' ? '0' : '186', 'bar')],
    ['유온', live ? tv('—', '') : tv('54', '°C')],
    ['붐 선회각', live ? tv('—', '') : tv('132', '°')],
    ['오늘 타설', live ? tv('—', '') : tv('142', 'm³')],
    ['가동 시간', live ? tv('—', '') : tv('6:12', 'h')],
  ];
  const score = p => p[1] === 'wear' ? p[2] / p[3] : 1 - p[2] / 90;
  const parts = [...u.parts].sort((a, b) => score(b) - score(a));
  const partRow = p => p[1] === 'wear'
    ? `<div class="part ${p[2] >= p[3] ? 'bad' : p[2] >= p[3] - 10 ? 'soon' : ''}"><span class="nm">${p[0]}</span><span class="bar"><i style="width:${p[2]}%"></i><em style="left:${p[3]}%"></em></span><span class="v">${p[2]}%</span></div>`
    : `<div class="part ${p[2] <= 7 ? 'bad' : p[2] <= 14 ? 'soon' : ''}"><span class="nm">${p[0]}</span><span class="bar days"><i style="width:${Math.max(4, 100 - p[2] / 90 * 100)}%"></i></span><span class="v">D-${p[2]}</span></div>`;
  const recv = u.st === 'store' ? '없음' : u.recv.replace('마지막 수신 ', '').replace(' 수신', '');
  return `
    <div class="stat">
      <div class="h"><b>${u.num}호기</b><span>${u.code}</span><span class="rx">수신 ${recv}</span></div>
      <div class="st ${u.st}"><i></i><b>${LABEL[u.st] === '정상' ? '정상 가동' : LABEL[u.st]}</b>${u.st === 'fault' || u.st === 'check' ? `<span class="why">${UNIT_MSG[u.st]}</span>` : ''}${since ? `<span class="when">${since}</span>` : ''}</div>
    </div>
    ${u.st !== 'store' ? `<div class="drv"><span class="lb">오늘 운전자</span><b>${u.driver[0]}</b><span class="sh2">07:00–19:00</span><span class="lic">${u.driver[1]} · ~${u.driver[2]}</span></div>` : ''}
    ${u.ai.some(e => e.lvl === 'warn') ? `<div class="aiev" onclick="openFull(5)"><span class="tag">AI</span><b>${u.ai[0].type}</b><span class="d">${u.ai[0].detail}</span><span class="t">${u.ai[0].t}</span></div>` : ''}
    <div class="body">
      <div class="sec"><h3 class="sh">실시간 장비 정보</h3>
        <div class="tele">${tele.map(([k, v]) => `<div><span>${k}</span>${v}</div>`).join('')}</div></div>
      ${u.ai.length ? `<details class="fold"><summary><span>AI 이벤트</span><span class="hint ${u.ai.some(e => e.lvl === 'warn') ? 'bad' : ''}">오늘 ${u.ai.length}건${u.ai.some(e => e.lvl === 'warn') ? ' · 경고 ' + u.ai.filter(e => e.lvl === 'warn').length : ''}</span><span class="chev"></span></summary>
        <div class="evl">${u.ai.map(e => `<div onclick="openFull(5)"><span class="t">${e.t}</span><span><b class="${e.lvl}">${e.type}</b><br><span class="dd">${e.detail} · AI CCTV</span></span></div>`).join('')}</div></details>` : ''}
      <details class="fold" ${parts[0][1] === 'wear' && parts[0][2] >= parts[0][3] - 10 ? 'open' : ''}><summary><span>소모품</span><span class="hint ${parts[0][1] === 'wear' && parts[0][2] >= parts[0][3] ? 'bad' : parts[0][1] === 'wear' && parts[0][2] >= parts[0][3] - 10 ? 'soon' : ''}">${parts[0][0]} ${parts[0][1] === 'wear' ? parts[0][2] + '%' : 'D-' + parts[0][2]} · ${u.parts.length}종</span><span class="chev"></span></summary>
        <div class="parts">${parts.map(partRow).join('')}</div></details>
      <details class="fold"><summary><span>현장 정보</span><span class="hint">${s.builder} · D-${s.dday}</span><span class="chev"></span></summary>
        <dl class="kv"><dt>현장</dt><dd>${s.name}</dd><dt>계약</dt><dd>${s.start} – ${s.end}</dd><dt>설치일</dt><dd>${u.install}</dd><dt>담당자</dt><dd>${s.mgr} · <a href="#" onclick="return false">010-0000-0000</a></dd></dl></details>
      <details class="fold"><summary><span>서류</span><span class="hint">차량 ${u.docs.length}건 · 운전자 4건</span><span class="chev"></span></summary>
        <div style="padding:0 18px 14px">
          <div class="dgrp">차량 서류</div>
          <div class="docs">${u.docs.map(d => `<a href="#" onclick="return false">${d[0]} <span>PDF · ${d[1]}</span></a>`).join('')}</div>
          ${u.st !== 'store' ? `<div class="dgrp">운전자 서류 · ${u.driver[0]}</div>
          <div class="docs">${[[u.driver[1], u.driver[2].slice(0, 8)], ['안전보건교육 이수증', '2026-03'], ['건강검진 결과', '2026-02'], ['고용·보험 확인서', '2026-01']].map(d => `<a href="#" onclick="return false">${d[0]} <span>PDF · ${d[1]}</span></a>`).join('')}</div>` : ''}
        </div></details>
    </div>`;
}
function unitRow(u) {
  const s = state.site;
  const aiN = u.ai ? u.ai.filter(e => e.lvl === 'warn').length : 0;
  return `<div class="row ${state.unit && state.unit.num === u.num ? 'on' : ''}" data-unit="${u.num}" onclick="go('unit', state.site, state.site.units.find(x=>x.num===${u.num}))">
    <div><div class="nm">${u.num}호기 <span style="font:400 11px var(--mono);color:var(--ink3);margin-left:4px">${u.code}</span>${aiN ? `<span class="aichip">AI ${aiN}</span>` : ''}</div>
    <div class="sub"><em style="color:${COLOR[u.st]}">${UNIT_MSG[u.st]}</em></div></div>
    <div class="cnt ${u.st === 'late' ? 'late' : ''}">${u.recv.replace('마지막 수신 ', '')}</div></div>`;
}
function fitNation() {
  const left = $('#card').getBoundingClientRect().right - $('#map').getBoundingClientRect().left;
  map.fitBounds([[34.4, 126.2], [38.3, 129.5]], { paddingTopLeft: [left + 30, 70], paddingBottomRight: [40, 30], animate: false });
  placeBadges(); placeLabels();
}
for (const s of SITES) {
  const warn = ['fault','check','late'].includes(s.st);
  const status = warn ? `<span class="s">${LABEL[s.st]}</span>` : s.st === 'store' ? '<span class="s">보관</span>' : '';
  const html = `<div class="pt"></div><div class="ld"></div><div class="grp"><div class="bd">${s.n}</div><div class="lb">${s.name}${status}</div></div>`;
  const icon = L.divIcon({ html: `<div class="mk ${s.st}" data-site="${s.id}" data-pri="${warn ? 0 : s.st === 'store' ? 2 : 1}">${html}</div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
  s.marker = L.marker([s.lat, s.lon], { icon, zIndexOffset: warn ? 1000 : 0, title: s.name }).addTo(nationLayer);
  s.marker.on('click', () => go('site', s));
}
function placeBadges() {
  if (state.level !== 'nation') return;
  const pts = SITES.map(s => { const p = map.latLngToLayerPoint([s.lat, s.lon]); return { s, ox:p.x, oy:p.y, x:p.x, y:p.y }; });
  const MIN = 38;
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) for (let j = i+1; j < pts.length; j++) {
      const a = pts[i], b = pts[j]; let dx = b.x-a.x, dy = b.y-a.y; let d = Math.hypot(dx,dy) || 0.01;
      if (d < MIN) { const push = (MIN-d)/2; dx/=d; dy/=d; a.x-=dx*push; a.y-=dy*push; b.x+=dx*push; b.y+=dy*push; moved = true; }
    }
    for (const p of pts) { p.x += (p.ox-p.x)*0.05; p.y += (p.oy-p.y)*0.05; }
    if (!moved) break;
  }
  for (const p of pts) {
    const el = p.s.marker.getElement()?.querySelector('.mk'); if (!el) continue;
    const dx = p.x-p.ox, dy = p.y-p.oy, len = Math.hypot(dx,dy);
    el.querySelector('.grp').style.transform = `translate(${dx}px,${dy}px)`;
    const shifted = len > 6; el.classList.toggle('shifted', shifted);
    if (shifted) { const ld = el.querySelector('.ld'); ld.style.width = Math.max(0, len-15)+'px'; ld.style.transform = `rotate(${Math.atan2(dy,dx)}rad)`; }
  }
}
function placeLabels() {
  if (state.level !== 'nation') return;
  const mks: any[] = [...document.querySelectorAll('.mk') as any].sort((a,b)=>a.dataset.pri-b.dataset.pri);
  const taken = mks.map(m => m.querySelector('.bd').getBoundingClientRect());
  const hit = (r) => taken.some(t => r.left < t.right+2 && r.right > t.left-2 && r.top < t.bottom+2 && r.bottom > t.top-2);
  const overlap = (r) => taken.reduce((a,t) => a + Math.max(0, Math.min(r.right,t.right)-Math.max(r.left,t.left)) * Math.max(0, Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)), 0);
  for (const m of mks) {
    const lb = m.querySelector('.lb'); let placed = null, fallback = null;
    for (const p of ['', 'pr', 'pl', 'pa', 'pbr', 'pbl']) { lb.className = 'lb' + (p ? ' ' + p : ''); const r = lb.getBoundingClientRect(); const o = overlap(r); if (!fallback || o < fallback.o) fallback = { p, r, o }; if (!hit(r)) { placed = { p, r }; break; } }
    if (!placed && m.dataset.pri === '0') placed = fallback;
    if (placed) { lb.className = 'lb' + (placed.p ? ' ' + placed.p : ''); taken.push(placed.r); } else lb.className = 'lb hide';
  }
}
map.on('zoomend moveend', () => { placeBadges(); placeLabels(); });

/* ---------- site layer: unit pills on the street map ---------- */
function buildSiteLayer() {
  siteLayer.clearLayers();
  const s = state.site;
  for (const u of s.units) {
    const icon = L.divIcon({ className: '', iconSize: [0,0], iconAnchor: [0,0], html: `<div class="um ${u.st}" data-unit="${u.num}"><div class="pill"><i></i>${u.num}호기</div><div class="dot"></div></div>` });
    const m = L.marker(ll(s, u.d), { icon, title: u.num + '호기', zIndexOffset: u.st === 'run' ? 0 : 500 }).addTo(siteLayer);
    m.on('click', () => go('unit', s, u));
  }
}

/* ---------- hover sync ---------- */
const sync = (key, val, on) => document.querySelectorAll(`[data-${key}="${val}"]`).forEach(el => el.classList.toggle('hl', on));
document.addEventListener('mouseover', e => { const t = (e.target as any).closest('[data-site],[data-unit]'); if (!t) return; if (t.dataset.site) sync('site', t.dataset.site, true); if (t.dataset.unit) sync('unit', t.dataset.unit, true); });
document.addEventListener('mouseout',  e => { const t = (e.target as any).closest('[data-site],[data-unit]'); if (!t) return; if (t.dataset.site) sync('site', t.dataset.site, false); if (t.dataset.unit) sync('unit', t.dataset.unit, false); });
addEventListener('resize', () => render());

// 생성 HTML이 onclick="goTab('ops')" 꼴로 부른다 — 모듈 스코프라 전역에 얹어 준다.
// 이벤트 위임으로 바꾸지 않는다: 마크업이 시안과 달라지고 코드가 는다.
Object.assign(window as any, {
  goTab, go, openFull, closeFull, toggleInbox, togglePick,
  render, renderFleet, renderInbox, inboxEvents, state,
});

render();
