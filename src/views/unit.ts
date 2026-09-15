// 호기 단계 — 좌측 상세 카드, 카메라 벽, 전체 화면 뷰어.
import { $, AI_OVERLAY, CAMVIEW, LABEL, SCENE, UNIT_MSG, shortRecv } from '../ui';
import { curUnit, state } from '../store';
import type { Part, Site, Unit } from '../types';

/* ---------- 좌측 카드 ---------- */

const tv = (val: string, unit: string, cls = '') =>
  `<span class="val"><b class="${cls}">${val}</b><small>${unit}</small></span>`;

/** 실시간 장비 정보 — 항목 구성은 가정이고, 실제 CPB 수신 목록으로 바뀐다. */
function telemetry(u: Unit): string {
  const off = u.st === 'store' || u.st === 'late';
  const rows: [string, string][] = [
    ['공급 전압', u.st === 'fault' ? tv('198', 'V', 'bad') : off ? tv('—', '') : tv('221', 'V')],
    ['유압', off ? tv('—', '') : tv(u.st === 'fault' ? '0' : '186', 'bar')],
    ['유온', off ? tv('—', '') : tv('54', '°C')],
    ['붐 선회각', off ? tv('—', '') : tv('132', '°')],
    ['오늘 타설', off ? tv('—', '') : tv('142', 'm³')],
    ['가동 시간', off ? tv('—', '') : tv('6:12', 'h')],
  ];
  return rows.map(([k, v]) => `<div><span>${k}</span>${v}</div>`).join('');
}

const partRow = (p: Part) =>
  p[1] === 'wear'
    ? // 마모품: 현재 마모율 p[2]와 교체 한계 p[3]
      `<div class="part ${p[2] >= p[3]! ? 'bad' : p[2] >= p[3]! - 10 ? 'soon' : ''}">` +
      `<span class="nm">${p[0]}</span>` +
      `<span class="bar"><i style="width:${p[2]}%"></i><em style="left:${p[3]}%"></em></span>` +
      `<span class="v">${p[2]}%</span></div>`
    : // 주기품: 남은 일수 p[2], 90일을 가득으로 본다
      `<div class="part ${p[2] <= 7 ? 'bad' : p[2] <= 14 ? 'soon' : ''}">` +
      `<span class="nm">${p[0]}</span>` +
      `<span class="bar days"><i style="width:${Math.max(4, 100 - (p[2] / 90) * 100)}%"></i></span>` +
      `<span class="v">D-${p[2]}</span></div>`;

const docLinks = (docs: [string, string][]) =>
  `<div class="docs">${docs.map(d => `<a href="#" onclick="return false">${d[0]} <span>PDF · ${d[1]}</span></a>`).join('')}</div>`;

export function unitCard(u: Unit, s: Site): string {
  const since = u.st === 'fault' ? '08:41부터' : u.st === 'check' ? '기한 9. 20.' : '';
  const stLabel = u.st === 'run' ? '정상 가동' : LABEL[u.st];
  const stWhy = u.st === 'fault' || u.st === 'check' ? `<span class="why">${UNIT_MSG[u.st]}</span>` : '';
  const stWhen = since ? `<span class="when">${since}</span>` : '';

  // 급한 순으로 — 마모품은 한계까지, 주기품은 90일을 가득으로 본다
  const score = (p: Part) => (p[1] === 'wear' ? p[2] / p[3]! : 1 - p[2] / 90);
  const parts = [...u.parts].sort((a, b) => score(b) - score(a));
  const top = parts[0];
  const wearHit = top[1] === 'wear' && top[2] >= top[3]!;
  const wearNear = top[1] === 'wear' && top[2] >= top[3]! - 10;
  const topHint = `${top[0]} ${top[1] === 'wear' ? top[2] + '%' : 'D-' + top[2]} · ${u.parts.length}종`;

  const warns = u.ai.filter(e => e.lvl === 'warn').length;
  const driverRow =
    u.st === 'store'
      ? ''
      : `<div class="drv"><span class="lb">오늘 운전자</span><b>${u.driver[0]}</b>` +
        `<span class="sh2">07:00–19:00</span><span class="lic">${u.driver[1]} · ~${u.driver[2]}</span></div>`;
  const aiBanner = warns
    ? `<div class="aiev" onclick="openFull(5)"><span class="tag">AI</span><b>${u.ai[0].type}</b>` +
      `<span class="d">${u.ai[0].detail}</span><span class="t">${u.ai[0].t}</span></div>`
    : '';
  const aiFold = u.ai.length
    ? `<details class="fold"><summary><span>AI 이벤트</span>` +
      `<span class="hint ${warns ? 'bad' : ''}">오늘 ${u.ai.length}건${warns ? ' · 경고 ' + warns : ''}</span>` +
      `<span class="chev"></span></summary>` +
      `<div class="evl">${u.ai
        .map(
          e =>
            `<div onclick="openFull(5)"><span class="t">${e.t}</span>` +
            `<span><b class="${e.lvl}">${e.type}</b><br><span class="dd">${e.detail} · AI CCTV</span></span></div>`,
        )
        .join('')}</div></details>`
    : '';
  const driverDocs =
    u.st === 'store'
      ? ''
      : `<div class="dgrp">운전자 서류 · ${u.driver[0]}</div>` +
        docLinks([
          [u.driver[1], u.driver[2].slice(0, 8)],
          ['안전보건교육 이수증', '2026-03'],
          ['건강검진 결과', '2026-02'],
          ['고용·보험 확인서', '2026-01'],
        ]);

  return (
    `<div class="stat">` +
    `<div class="h"><b>${u.num}호기</b><span>${u.code}</span>` +
    `<span class="rx">수신 ${u.st === 'store' ? '없음' : shortRecv(u.recv)}</span></div>` +
    `<div class="st ${u.st}"><i></i><b>${stLabel}</b>${stWhy}${stWhen}</div></div>` +
    driverRow +
    aiBanner +
    `<div class="body">` +
    `<div class="sec"><h3 class="sh">실시간 장비 정보</h3><div class="tele">${telemetry(u)}</div></div>` +
    aiFold +
    `<details class="fold" ${wearNear ? 'open' : ''}><summary><span>소모품</span>` +
    `<span class="hint ${wearHit ? 'bad' : wearNear ? 'soon' : ''}">${topHint}</span><span class="chev"></span></summary>` +
    `<div class="parts">${parts.map(partRow).join('')}</div></details>` +
    `<details class="fold"><summary><span>현장 정보</span>` +
    `<span class="hint">${s.builder} · D-${s.dday}</span><span class="chev"></span></summary>` +
    `<dl class="kv"><dt>현장</dt><dd>${s.name}</dd>` +
    `<dt>계약</dt><dd>${s.start} – ${s.end}</dd>` +
    `<dt>설치일</dt><dd>${u.install}</dd>` +
    `<dt>담당자</dt><dd>${s.mgr} · <a href="tel:${s.tel}">${s.tel}</a></dd></dl></details>` +
    `<details class="fold"><summary><span>서류</span>` +
    `<span class="hint">차량 ${u.docs.length}건 · 운전자 4건</span><span class="chev"></span></summary>` +
    `<div style="padding:0 18px 14px"><div class="dgrp">차량 서류</div>${docLinks(u.docs)}${driverDocs}</div></details>` +
    `</div>`
  );
}

/* ---------- 카메라 벽 ---------- */

const feedHtml = (u: Unit, i: number) => {
  const c = u.cams[i];
  const ev = c[0] === 'ai' ? u.ai.filter(e => e.lvl === 'warn').length : 0;
  return (
    `<div class="feed ${c[0]} ${ev ? 'alert' : ''}" data-cam="${i}" ` +
    `style="background-image:url(${SCENE});background-size:${CAMVIEW[i]}" onclick="openFull(${i})">` +
    `<span class="live"><i></i>${c[1]}</span>` +
    (ev ? `<span class="evb">이벤트 ${ev}</span>` : '') +
    (c[0] === 'ai' ? AI_OVERLAY : '') +
    `<span class="ts">10:42:0${i}</span><span class="exp">⤢</span></div>`
  );
};

export function renderWall() {
  const u = curUnit()!;
  $('#wall').innerHTML = u.cams.map((_c, i) => feedHtml(u, i)).join('');
  fitWall();
}

/** 벽 안에 16:9 타일이 가장 크게 들어가는 열 수(3 또는 2)를 고른다. */
export function fitWall() {
  const w = $('#wall');
  if (w.hidden) return;
  const u = curUnit();
  if (!u) return;
  const n = u.cams.length,
    gap = 12,
    W = w.clientWidth,
    H = w.clientHeight;
  let best: { cols: number; tw: number } | null = null;
  for (const cols of [3, 2]) {
    const rows = Math.ceil(n / cols);
    let tw = (W - gap * (cols - 1)) / cols,
      th = (tw * 9) / 16;
    if (rows * th + gap * (rows - 1) > H) {
      th = (H - gap * (rows - 1)) / rows;
      tw = (th * 16) / 9;
    }
    if (!best || tw > best.tw) best = { cols, tw };
  }
  w.style.gridTemplateColumns = `repeat(${best!.cols}, ${Math.floor(best!.tw)}px)`;
}

/* ---------- 전체 화면 뷰어 ---------- */

export function renderFull() {
  const el = $('#fullv'),
    u = curUnit();
  if (state.full == null || !u) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const i = state.full,
    c = u.cams[i],
    n = u.cams.length;
  const today = new Date().toLocaleDateString('ko-KR');
  const thumb = (cc: [string, string], k: number) =>
    `<button class="${k === i ? 'on' : ''} ${cc[0]}" ` +
    `style="background-image:url(${SCENE});background-size:${CAMVIEW[k]}" ` +
    `onclick="openFull(${k})"><span>${cc[1]}</span></button>`;
  el.hidden = false;
  el.innerHTML =
    `<div class="fv-top"><span class="fv-name"><i></i>LIVE · ${u.num}호기 · ${c[1]}</span>` +
    `<span class="fv-time">${today} 10:42:0${i}</span>` +
    `<button class="fv-x" onclick="closeFull()" aria-label="닫기">×</button></div>` +
    `<div class="fv-stage">` +
    `<button class="fv-nav l" onclick="openFull(${(i + n - 1) % n})">‹</button>` +
    `<div class="fv-video ${c[0]}"><div class="fv-frame" style="background-image:url(${SCENE})">` +
    `${c[0] === 'ai' ? AI_OVERLAY : ''}</div></div>` +
    `<button class="fv-nav r" onclick="openFull(${(i + 1) % n})">›</button></div>` +
    `<div class="fv-strip">${u.cams.map(thumb).join('')}</div>`;
}
