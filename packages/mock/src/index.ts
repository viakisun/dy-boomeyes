// @boomeyes/mock — 앱 조립 지점(+layout.ts)에서만 import (ADR-002). 화면은 ApiClient 인터페이스만 본다.
import { FIXED_CLOCK, SCREENS, type ScrId } from '@boomeyes/domain';
import { createMockApi } from './api';
import { clock } from './clock';
import { seed } from './seed';
import { applyState } from './states';

export { clock, H, MIN, DAY } from './clock';
export { seed, type Db } from './seed';
export { createMockApi } from './api';
export { FIXTURES, applyState } from './states';

export interface MockOptions {
  screen?: ScrId;
  state?: string | null;
  capture?: boolean;
  latencyMs?: number;
}

/** 화면 진입 시 호출: capture면 시각 고정, 상태 픽스처 적용 후 ApiClient 생성 */
export function bootMock(opts: MockOptions = {}) {
  if (opts.capture) clock.freeze(FIXED_CLOCK);
  else clock.reset();
  let db = seed();
  if (opts.screen) db = applyState(db, opts.screen, opts.state ?? SCREENS[opts.screen].default);
  return createMockApi(db, { latencyMs: opts.capture ? 0 : (opts.latencyMs ?? 120) });
}

/** URL 쿼리 → MockOptions (`?state=` `?capture=1`) */
export function optionsFromUrl(url: URL, screen?: ScrId): MockOptions {
  return { screen, state: url.searchParams.get('state'), capture: url.searchParams.get('capture') === '1' };
}
