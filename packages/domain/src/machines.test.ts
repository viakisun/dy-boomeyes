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

describe('[ENT-10] lease · [ENT-20] request 상태기계', () => {
  it('lease: active → expiring → relocated | ended · active → ended · relocated는 종단', () => {
    expect(transition('lease', 'active', 'expiring')).toBe('expiring');
    expect(transition('lease', 'expiring', 'relocated')).toBe('relocated');
    expect(transition('lease', 'expiring', 'ended')).toBe('ended');
    expect(transition('lease', 'active', 'ended')).toBe('ended');
    expect(canTransition('lease', 'active', 'relocated')).toBe(false);
    expect(nextStates('lease', 'relocated')).toEqual([]);
  });
  it('request: submitted → review → approved | rejected → submitted(재제출)', () => {
    expect(transition('request', 'submitted', 'review')).toBe('review');
    expect(transition('request', 'review', 'rejected')).toBe('rejected');
    expect(transition('request', 'rejected', 'submitted')).toBe('submitted');
    expect(canTransition('request', 'submitted', 'approved')).toBe(false);
    expect(() => transition('request', 'approved', 'review')).toThrow('전이 불가');
  });
});
