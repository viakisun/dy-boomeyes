// @boomeyes/mock — 앱 조립 지점(+layout.ts)에서만 import (ADR-002). 화면은 ApiClient 인터페이스만 본다.
import { FIXED_CLOCK, SCREENS, type RoleId, type ScrId, type Session } from '@boomeyes/domain';
import { createMockApi } from './api';
import { clock } from './clock';
import { demoUsers, seed } from './seed';
import { applyState } from './states';
import { SCENE_FIXTURES } from './demo';

export { clock, H, MIN, DAY } from './clock';
export { seed, demoUsers, type Db } from './seed';
export { createMockRealtime } from './realtime';
export { createMockMedia } from './media';
export { createMockApi } from './api';
export { FIXTURES, applyState } from './states';
export { SCENES, sceneOf, SCENE_FIXTURES, createSceneRealtime, type DemoScene } from './demo';

export interface MockOptions {
  screen?: ScrId;
  state?: string | null;
  capture?: boolean;
  latencyMs?: number;
  /** 시연 장면(?scene=N) — 장면 픽스처 + 계정 세션 + 타임라인 (specs/demo-scripts) */
  scene?: number | null;
}

// 브라우저에서는 세션 동안 db를 유지한다 — 화면 이동·invalidateAll마다 재시드하면 접수·승인이 사라진다.
// 키 = capture 여부 + 명시된 ?state= 픽스처(화면별). 픽스처 없는 실사용 흐름은 키 'live'로 하나의 db를 공유한다. Vitest(node)는 항상 새 db.
let cache: { key: string; api: ReturnType<typeof createMockApi> } | null = null;
// 활성 시연 장면 — ?scene=N으로 들어온 뒤 앱 내 이동(쿼리 없음)에서도 장면 db·장면 바를 유지한다. ?state=/?capture=/resetMock이면 해제
let active: number | null = null;
export const activeScene = () => active;
export function resetMock() {
  cache = null;
  active = null;
  clock.reset();
}

/** 화면 진입 시 호출: capture면 시각 고정, 상태 픽스처 적용 후 ApiClient 생성(브라우저는 키별 재사용) */
export function bootMock(opts: MockOptions = {}) {
  if (opts.capture) clock.freeze(FIXED_CLOCK);
  else clock.unfreeze(); // 고정만 해제 — jump() 오프셋(장면 6 "1시간 경과")은 invalidateAll을 지나도 유지, resetMock이 초기화
  if (opts.scene) active = opts.scene;
  else if (opts.state || opts.capture) {
    if (active !== null) clock.reset(); // 장면 해제 — "1시간 경과" 오프셋이 픽스처로 새지 않게
    active = null;
  }
  const scene = opts.scene ?? active;
  const key = scene
    ? `scene|${scene}`
    : opts.state
      ? `${opts.capture ? 'capture' : 'live'}|${opts.screen}|${opts.state}`
      : opts.capture
        ? 'capture'
        : 'live';
  const browser = typeof window !== 'undefined';
  if (browser && cache?.key === key) return cache.api;
  let db = seed();
  // 화면 기본 픽스처는 capture(캡처·e2e)에서만 — 실사용 흐름(live)은 순수 시드(예: A2-03 기본 'inspect'가 체크인을 만들면 안 된다)
  const state = opts.state ?? (opts.capture && opts.screen ? SCREENS[opts.screen].default : null);
  if (scene)
    db = SCENE_FIXTURES[scene]?.(db) ?? db; // 장면이 우선 — ?state= 와 조합하지 않는다
  else if (opts.screen && state) db = applyState(db, opts.screen, state);
  const api = createMockApi(db, { latencyMs: opts.capture ? 0 : (opts.latencyMs ?? 120) });
  if (browser) cache = { key, api };
  return api;
}

/** capture 모드: 로그인 없이 셸까지 그리기 위한 세션 합성 (저장하지 않음 · 가드 우회는 W3 전 제거) */
export function demoSession(role: RoleId): Session | null {
  const u = demoUsers().find((x) => x.role === role);
  return u ? { userId: u.id, role: u.role, display: u.display, org: u.org } : null;
}

/** 데모 계정(login = users[].id)의 세션 합성 — ?scene= 진입용 (저장하지 않음 · 가드 우회는 W3 전 제거) */
export function demoSessionFor(login: string): Session | null {
  const u = demoUsers().find((x) => x.id === login);
  return u ? { userId: u.id, role: u.role, display: u.display, org: u.org } : null;
}

/** URL 쿼리 → MockOptions (`?state=` `?capture=1` `?scene=N`) */
export function optionsFromUrl(url: URL, screen?: ScrId): MockOptions {
  const n = Number(url.searchParams.get('scene'));
  return {
    screen,
    state: url.searchParams.get('state'),
    capture: url.searchParams.get('capture') === '1',
    scene: Number.isInteger(n) && n >= 1 && n <= 10 ? n : null,
  };
}
