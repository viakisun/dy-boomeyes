// 화면이 함께 쓰는 표시용 상수와 조각. 서버 데이터가 아니다.
import type { Status } from './types';

export const $ = (sel: string): any => document.querySelector(sel);

export const LABEL: Record<Status, string> = {
  fault: '고장',
  check: '점검',
  late: '수신 지연',
  run: '정상',
  store: '보관',
};
export const COLOR: Record<Status, string> = {
  fault: 'var(--fault)',
  check: 'var(--check)',
  late: 'var(--late)',
  run: 'var(--run)',
  store: 'var(--store)',
};
export const UNIT_MSG: Record<Status, string> = {
  fault: '공급 전압 저하',
  check: '수송관 점검 시기 도래',
  late: '마지막 수신 7. 3. 오전 08:22',
  run: '이상 신호 없음',
  store: '단말기 미장착',
};
export const REQ_ST = { new: '요청 접수', assign: '배정 중', ship: '운송·설치', run: '가동', done: '종료' };
/** 확인이 필요한 순서 — 표 정렬과 목록에 함께 쓴다 */
export const ORDER: Record<Status, number> = { fault: 0, check: 1, late: 2, run: 3, store: 4 };
export const WARN_ST: Status[] = ['fault', 'check', 'late'];

/** 시연 장면 한 장을 여섯 카메라가 저마다 다르게 잡은 것처럼 보이게 한다 */
export const SCENE = 'screens/cpb-scene.png';
export const CAMVIEW = [
  'cover; background-position:15% 35%',
  'cover; background-position:70% 45%',
  'cover; background-position:100% 60%',
  'cover; background-position:50% 40%',
  'cover; background-position:0% 70%',
  'cover; background-position:60% 50%',
];

export const SEARCH_ICON = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;

// AI CCTV 위에 겹치는 판정 상자 셋 — 좌표는 시안 그대로다.
export const AI_OVERLAY =
  `<div class="det p" style="left:86%;top:56%;width:8%;height:32%"><span>작업자 · 4.2 m</span></div>` +
  `<div class="det t" style="left:78%;top:42%;width:8%;height:12%"><span>붐 끝 · 타설 중</span></div>` +
  `<div class="det z" style="left:54%;top:60%;width:42%;height:34%"><span>접근 주의 구역</span></div>`;

/** 「마지막 수신 7. 3. 오전 08:22」처럼 온 문구에서 접두를 떼어 표에 넣는다 */
export const shortRecv = (s: string) => s.replace('마지막 수신 ', '').replace(' 수신', '');
