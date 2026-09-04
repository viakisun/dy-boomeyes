// DemoClock — 목업 시각. capture 모드면 FIXED_CLOCK 고정, 데모에서는 jump()로 "1시간 경과" 등 점프 (장면 6)
import { FIXED_CLOCK } from '@boomeyes/domain';

let offsetMs = 0;
let frozen: number | null = null;

export const clock = {
  now(): Date { return new Date(frozen ?? Date.now() + offsetMs); },
  iso(): string { return clock.now().toISOString(); },
  freeze(at: string | Date = FIXED_CLOCK) { frozen = new Date(at).getTime(); },
  unfreeze() { frozen = null; },
  jump(ms: number) { if (frozen !== null) frozen += ms; else offsetMs += ms; },
  reset() { frozen = null; offsetMs = 0; },
  minus(ms: number): string { return new Date(clock.now().getTime() - ms).toISOString(); },
};
export const H = 3_600_000, MIN = 60_000, DAY = 86_400_000;
