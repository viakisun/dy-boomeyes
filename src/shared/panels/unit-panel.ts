// 호기 단계 좌측 카드 — 상태, 운전자, 실시간 수신값, 접어 둔 AI·소모품·현장·서류.
import { AI_CAMERA_INDEX } from '../camera/camera-view';
import { shortLastSeen } from '../format';
import { STATUS_LABEL, STATUS_NOTE } from '../labels';
import type { Document, Part, Site, Unit } from '../types';

/** 마모품이 한계에 닿았나 / 10 %p 안으로 다가왔나 */
const isWornOut = (p: Part) => p.kind === 'wear' && p.wornPercent >= p.limitPercent;
const isWearingOut = (p: Part) => p.kind === 'wear' && p.wornPercent >= p.limitPercent - 10;
/** 주기품은 90일을 가득으로 보고 남은 날을 잰다 */
const CYCLE_FULL_DAYS = 90;
/** 급한 순으로 — 마모품은 한계까지의 비율, 주기품은 남은 날의 비율 */
const urgency = (p: Part) => (p.kind === 'wear' ? p.wornPercent / p.limitPercent : 1 - p.daysLeft / CYCLE_FULL_DAYS);

const value = (text: string, unit: string, tone = '') =>
  `<span class="val"><b class="${tone}">${text}</b><small>${unit}</small></span>`;

/** 실시간 장비 정보 — 항목 구성은 가정이고, 실제 CPB 수신 목록으로 바뀐다. */
function telemetryRows(unit: Unit): string {
  const silent = unit.status === 'store' || unit.status === 'late';
  const none = value('—', '');
  const rows: [string, string][] = [
    ['공급 전압', unit.status === 'fault' ? value('198', 'V', 'bad') : silent ? none : value('221', 'V')],
    ['유압', silent ? none : value(unit.status === 'fault' ? '0' : '186', 'bar')],
    ['유온', silent ? none : value('54', '°C')],
    ['붐 선회각', silent ? none : value('132', '°')],
    ['오늘 타설', silent ? none : value('142', 'm³')],
    ['가동 시간', silent ? none : value('6:12', 'h')],
  ];
  return rows.map(([label, v]) => `<div><span>${label}</span>${v}</div>`).join('');
}

function partBar(part: Part): string {
  if (part.kind === 'wear') {
    const tone = isWornOut(part) ? 'bad' : isWearingOut(part) ? 'soon' : '';
    return (
      `<div class="part ${tone}"><span class="nm">${part.name}</span>` +
      `<span class="bar"><i style="width:${part.wornPercent}%"></i>` +
      `<em style="left:${part.limitPercent}%"></em></span>` +
      `<span class="v">${part.wornPercent}%</span></div>`
    );
  }
  const tone = part.daysLeft <= 7 ? 'bad' : part.daysLeft <= 14 ? 'soon' : '';
  const filled = Math.max(4, 100 - (part.daysLeft / CYCLE_FULL_DAYS) * 100);
  return (
    `<div class="part ${tone}"><span class="nm">${part.name}</span>` +
    `<span class="bar days"><i style="width:${filled}%"></i></span>` +
    `<span class="v">D-${part.daysLeft}</span></div>`
  );
}

const partSummary = (part: Part) =>
  part.kind === 'wear' ? `${part.name} ${part.wornPercent}%` : `${part.name} D-${part.daysLeft}`;

const documentLinks = (docs: Document[]) =>
  `<div class="docs">${docs
    .map(d => `<a href="#" onclick="return false">${d.name} <span>PDF · ${d.issuedOn}</span></a>`)
    .join('')}</div>`;

function statusLine(unit: Unit): string {
  const label = unit.status === 'run' ? '정상 가동' : STATUS_LABEL[unit.status];
  const why =
    unit.status === 'fault' || unit.status === 'check' ? `<span class="why">${STATUS_NOTE[unit.status]}</span>` : '';
  const since = unit.status === 'fault' ? '08:41부터' : unit.status === 'check' ? '기한 9. 20.' : '';
  return (
    `<div class="st ${unit.status}"><i></i><b>${label}</b>${why}` +
    `${since ? `<span class="when">${since}</span>` : ''}</div>`
  );
}

function driverLine(unit: Unit): string {
  if (unit.status === 'store') return '';
  const d = unit.driver;
  return (
    `<div class="drv"><span class="lb">오늘 운전자</span><b>${d.name}</b>` +
    `<span class="sh2">07:00–19:00</span><span class="lic">${d.license} · ~${d.licenseUntil}</span></div>`
  );
}

function aiBanner(unit: Unit): string {
  const first = unit.aiEvents.find(e => e.level === 'warn');
  if (!first) return '';
  return (
    `<div class="aiev" onclick="openCamera(${AI_CAMERA_INDEX})"><span class="tag">AI</span><b>${first.title}</b>` +
    `<span class="d">${first.detail}</span><span class="t">${first.at}</span></div>`
  );
}

function aiSection(unit: Unit): string {
  if (!unit.aiEvents.length) return '';
  const warnCount = unit.aiEvents.filter(e => e.level === 'warn').length;
  const hint = `오늘 ${unit.aiEvents.length}건${warnCount ? ' · 경고 ' + warnCount : ''}`;
  const rows = unit.aiEvents
    .map(
      e =>
        `<div onclick="openCamera(${AI_CAMERA_INDEX})"><span class="t">${e.at}</span>` +
        `<span><b class="${e.level}">${e.title}</b><br>` +
        `<span class="dd">${e.detail} · AI CCTV</span></span></div>`,
    )
    .join('');
  return (
    `<details class="fold"><summary><span>AI 이벤트</span>` +
    `<span class="hint ${warnCount ? 'bad' : ''}">${hint}</span><span class="chev"></span></summary>` +
    `<div class="evl">${rows}</div></details>`
  );
}

function partsSection(unit: Unit): string {
  const parts = [...unit.parts].sort((a, b) => urgency(b) - urgency(a));
  const worst = parts[0];
  const tone = isWornOut(worst) ? 'bad' : isWearingOut(worst) ? 'soon' : '';
  const hint = `${partSummary(worst)} · ${unit.parts.length}종`;
  return (
    `<details class="fold" ${isWearingOut(worst) ? 'open' : ''}><summary><span>소모품</span>` +
    `<span class="hint ${tone}">${hint}</span><span class="chev"></span></summary>` +
    `<div class="parts">${parts.map(partBar).join('')}</div></details>`
  );
}

function siteSection(unit: Unit, site: Site): string {
  return (
    `<details class="fold"><summary><span>현장 정보</span>` +
    `<span class="hint">${site.builder} · D-${site.daysToEnd}</span><span class="chev"></span></summary>` +
    `<dl class="kv"><dt>현장</dt><dd>${site.name}</dd>` +
    `<dt>계약</dt><dd>${site.contractStart} – ${site.contractEnd}</dd>` +
    `<dt>설치일</dt><dd>${unit.installedOn}</dd>` +
    `<dt>담당자</dt><dd>${site.manager} · ` +
    `<a href="tel:${site.managerTel}">${site.managerTel}</a></dd></dl></details>`
  );
}

function documentSection(unit: Unit): string {
  const driverDocs: Document[] = [
    { name: unit.driver.license, issuedOn: unit.driver.licenseUntil.slice(0, 8) },
    { name: '안전보건교육 이수증', issuedOn: '2026-03' },
    { name: '건강검진 결과', issuedOn: '2026-02' },
    { name: '고용·보험 확인서', issuedOn: '2026-01' },
  ];
  const driverBlock =
    unit.status === 'store'
      ? ''
      : `<div class="dgrp">운전자 서류 · ${unit.driver.name}</div>${documentLinks(driverDocs)}`;
  return (
    `<details class="fold"><summary><span>서류</span>` +
    `<span class="hint">차량 ${unit.documents.length}건 · 운전자 ${driverDocs.length}건</span>` +
    `<span class="chev"></span></summary>` +
    `<div style="padding:0 18px 14px"><div class="dgrp">차량 서류</div>` +
    `${documentLinks(unit.documents)}${driverBlock}</div></details>`
  );
}

export function unitPanel(unit: Unit, site: Site): string {
  const lastSeen = unit.status === 'store' ? '없음' : shortLastSeen(unit.lastSeen);
  return (
    `<div class="stat">` +
    `<div class="h"><b>${unit.number}호기</b><span>${unit.code}</span>` +
    `<span class="rx">수신 ${lastSeen}</span></div>` +
    statusLine(unit) +
    `</div>` +
    driverLine(unit) +
    aiBanner(unit) +
    `<div class="body">` +
    `<div class="sec"><h3 class="sh">실시간 장비 정보</h3>` +
    `<div class="tele">${telemetryRows(unit)}</div></div>` +
    aiSection(unit) +
    partsSection(unit) +
    siteSection(unit, site) +
    documentSection(unit) +
    `</div>`
  );
}
