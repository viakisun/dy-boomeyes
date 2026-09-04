// 상태기계 — 전이 표는 generated/ids.ts MACHINES (원천 ssot/entities.yaml machines)
import { MACHINES } from './generated/ids';

export type MachineName = keyof typeof MACHINES;
export type StateOf<M extends MachineName> = (typeof MACHINES)[M]['states'][number];

/** 전이 가능 여부 — `*`는 모든 상태에서 허용 */
export function canTransition<M extends MachineName>(machine: M, from: StateOf<M>, to: StateOf<M>): boolean {
  return (MACHINES[machine].transitions as readonly (readonly [string, string])[]).some(
    ([f, t]) => (f === '*' || f === from) && t === to,
  );
}

/** 전이 실행 — 불가하면 Error */
export function transition<M extends MachineName>(machine: M, from: StateOf<M>, to: StateOf<M>): StateOf<M> {
  if (!canTransition(machine, from, to))
    throw new Error(`${String(machine)}: ${String(from)} → ${String(to)} 전이 불가`);
  return to;
}

export const nextStates = <M extends MachineName>(machine: M, from: StateOf<M>): StateOf<M>[] =>
  (MACHINES[machine].transitions as readonly (readonly [string, string])[])
    .filter(([f]) => f === '*' || f === from)
    .map(([, t]) => t as StateOf<M>);
