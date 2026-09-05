// @boomeyes/mock — 앱 조립 지점(+layout.ts)에서만 import (ADR-002). 화면은 ApiClient 인터페이스만 본다.
import { FIXED_CLOCK, SCREENS, type RoleId, type ScrId, type Session } from '@boomeyes/domain';
import { createMockApi } from './api';
import { clock } from './clock';
import { demoUsers, seed } from './seed';
import { applyState } from './states';

export { clock, H, MIN, DAY } from './clock';
export { seed, demoUsers, type Db } from './seed';
export { createMockRealtime } from './realtime';
export { createMockApi } from './api';
export { FIXTURES, applyState } from './states';

export interface MockOptions {
  screen?: ScrId;
  state?: string | null;
  capture?: boolean;
  latencyMs?: number;
}

// 브라우저에서는 세션 동안 db를 유지한다 — 화면 이동·invalidateAll마다 재시드하면 접수·승인이 사라진다.
// 키 = capture 여부 + 명시된 ?state= 픽스처(화면별). 픽스처 없는 실사용 흐름은 키 'live'로 하나의 db를 공유한다. Vitest(node)는 항상 새 db.
let cache: { key: string; api: ReturnType<typeof createMockApi> } | null = null;
export function resetMock() {
  cache = null;
}

/** 화면 진입 시 호출: capture면 시각 고정, 상태 픽스처 적용 후 ApiClient 생성(브라우저는 키별 재사용) */
export function bootMock(opts: MockOptions = {}) {
  if (opts.capture) clock.freeze(FIXED_CLOCK);
  else clock.reset();
  const key = opts.state
    ? `${opts.capture ? 'capture' : 'live'}|${opts.screen}|${opts.state}`
    : opts.capture
      ? 'capture'
      : 'live';
  const browser = typeof window !== 'undefined';
  if (browser && cache?.key === key) return cache.api;
  let db = seed();
  if (opts.screen) db = applyState(db, opts.screen, opts.state ?? SCREENS[opts.screen].default);
  const api = createMockApi(db, { latencyMs: opts.capture ? 0 : (opts.latencyMs ?? 120) });
  if (browser) cache = { key, api };
  return api;
}

/** capture 모드: 로그인 없이 셸까지 그리기 위한 세션 합성 (저장하지 않음 · 가드 우회는 W3 전 제거) */
export function demoSession(role: RoleId): Session | null {
  const u = demoUsers().find((x) => x.role === role);
  return u ? { userId: u.id, role: u.role, display: u.display, org: u.org } : null;
}

/** URL 쿼리 → MockOptions (`?state=` `?capture=1`) */
export function optionsFromUrl(url: URL, screen?: ScrId): MockOptions {
  return { screen, state: url.searchParams.get('state'), capture: url.searchParams.get('capture') === '1' };
}
