import { describe, expect, it } from 'vitest';
import { MACHINES } from './generated/ids';
import { canTransition, nextStates, transition } from './machines';

describe('[ENT-06] task 상태기계', () => {
  it('new → assigned → in-progress → done', () => {
    expect(transition('task', 'new', 'assigned')).toBe('assigned');
    expect(transition('task', 'assigned', 'in-progress')).toBe('in-progress');
    expect(transition('task', 'in-progress', 'done')).toBe('done');
  });
  it('[FR-010] 미접수 → escalated, done에서 되돌아가지 않는다', () => {
    expect(canTransition('task', 'new', 'escalated')).toBe(true);
    expect(canTransition('task', 'done', 'new')).toBe(false);
  });
});
describe('[ENT-02] equipment 상태기계', () => {
  it('[FR-002] 어느 상태에서든 offline(LWT)', () => {
    for (const s of MACHINES.equipment.states) expect(canTransition('equipment', s, 'offline')).toBe(true);
  });
  it('fault → maintenance', () => expect(nextStates('equipment', 'fault')).toContain('maintenance'));
});
describe('[ENT-04] camera 상태기계', () => {
  it('[FR-034] 어느 상태에서든 ai-unavailable, offline은 live로 복구', () => {
    expect(canTransition('camera', 'live', 'ai-unavailable')).toBe(true);
    expect(canTransition('camera', 'offline', 'live')).toBe(true);
  });
});
describe('[ENT-16] part 상태기계', () => {
  it('[FR-032] registered → … → discarded', () => {
    let s: 'registered' | 'installed' | 'inspected' | 'due' | 'replaced' | 'discarded' = 'registered';
    for (const to of ['installed', 'inspected', 'due', 'replaced', 'discarded'] as const) s = transition('part', s, to);
    expect(s).toBe('discarded');
  });
});
