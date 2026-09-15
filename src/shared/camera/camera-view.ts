// 카메라 — 6분할 벽과 전체 화면 뷰어. 소유주·건설사·안전관리자가 같은 화면을 본다.
// 저장소를 모른다. 보여 줄 호기와 열려 있는 카메라 번호를 인자로 받는다.
import { $ } from '../dom';
import { today } from '../format';
import type { Camera, Unit } from '../types';

/** 시연 장면 한 장을 여섯 카메라가 저마다 다르게 잡은 것처럼 보이게 한다 */
const SCENE_IMAGE = 'screens/cpb-scene.png';
const SCENE_FRAMING = [
  'cover; background-position:15% 35%',
  'cover; background-position:70% 45%',
  'cover; background-position:100% 60%',
  'cover; background-position:50% 40%',
  'cover; background-position:0% 70%',
  'cover; background-position:60% 50%',
];
/** AI CCTV는 늘 마지막 칸이다 */
export const AI_CAMERA_INDEX = 5;

// AI CCTV 위에 겹치는 판정 상자 셋 — 좌표는 시안 그대로다.
const AI_OVERLAY =
  `<div class="det p" style="left:86%;top:56%;width:8%;height:32%"><span>작업자 · 4.2 m</span></div>` +
  `<div class="det t" style="left:78%;top:42%;width:8%;height:12%"><span>붐 끝 · 타설 중</span></div>` +
  `<div class="det z" style="left:54%;top:60%;width:42%;height:34%"><span>접근 주의 구역</span></div>`;

const scene = (index: number) => `background-image:url(${SCENE_IMAGE});background-size:${SCENE_FRAMING[index]}`;

function tileHtml(unit: Unit, index: number): string {
  const camera = unit.cameras[index];
  const warnCount = camera.kind === 'ai' ? unit.aiEvents.filter(e => e.level === 'warn').length : 0;
  return (
    `<div class="feed ${camera.kind} ${warnCount ? 'alert' : ''}" data-cam="${index}" ` +
    `style="${scene(index)}" onclick="openCamera(${index})">` +
    `<span class="live"><i></i>${camera.name}</span>` +
    (warnCount ? `<span class="evb">이벤트 ${warnCount}</span>` : '') +
    (camera.kind === 'ai' ? AI_OVERLAY : '') +
    `<span class="ts">10:42:0${index}</span><span class="exp">⤢</span></div>`
  );
}

export function renderCameraGrid(unit: Unit) {
  $('#wall').innerHTML = unit.cameras.map((_c, i) => tileHtml(unit, i)).join('');
  fitCameraGrid(unit);
}

/** 벽 안에 16:9 타일이 가장 크게 들어가는 열 수(3 또는 2)를 고른다. */
export function fitCameraGrid(unit: Unit | null) {
  const wall = $('#wall');
  if (wall.hidden || !unit) return;
  const GAP = 12;
  const count = unit.cameras.length;
  const width = wall.clientWidth,
    height = wall.clientHeight;
  let best: { columns: number; tileWidth: number } | null = null;
  for (const columns of [3, 2]) {
    const rows = Math.ceil(count / columns);
    let tileWidth = (width - GAP * (columns - 1)) / columns;
    let tileHeight = (tileWidth * 9) / 16;
    if (rows * tileHeight + GAP * (rows - 1) > height) {
      tileHeight = (height - GAP * (rows - 1)) / rows;
      tileWidth = (tileHeight * 16) / 9;
    }
    if (!best || tileWidth > best.tileWidth) best = { columns, tileWidth };
  }
  wall.style.gridTemplateColumns = `repeat(${best!.columns}, ${Math.floor(best!.tileWidth)}px)`;
}

export function renderFullscreen(unit: Unit | null, openIndex: number | null) {
  const view = $('#fullv');
  if (openIndex == null || !unit) {
    view.hidden = true;
    view.innerHTML = '';
    return;
  }
  const camera = unit.cameras[openIndex];
  const count = unit.cameras.length;
  const thumbnail = (c: Camera, i: number) =>
    `<button class="${i === openIndex ? 'on' : ''} ${c.kind}" style="${scene(i)}" ` +
    `onclick="openCamera(${i})"><span>${c.name}</span></button>`;
  view.hidden = false;
  view.innerHTML =
    `<div class="fv-top"><span class="fv-name"><i></i>LIVE · ${unit.number}호기 · ${camera.name}</span>` +
    `<span class="fv-time">${today()} 10:42:0${openIndex}</span>` +
    `<button class="fv-x" onclick="closeCamera()" aria-label="닫기">×</button></div>` +
    `<div class="fv-stage">` +
    `<button class="fv-nav l" onclick="openCamera(${(openIndex + count - 1) % count})">‹</button>` +
    `<div class="fv-video ${camera.kind}">` +
    `<div class="fv-frame" style="background-image:url(${SCENE_IMAGE})">` +
    `${camera.kind === 'ai' ? AI_OVERLAY : ''}</div></div>` +
    `<button class="fv-nav r" onclick="openCamera(${(openIndex + 1) % count})">›</button></div>` +
    `<div class="fv-strip">${unit.cameras.map(thumbnail).join('')}</div>`;
}
