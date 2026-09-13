// 종 알림 패널의 자료 통로 — 셸(헤더)과 워크스페이스(스냅샷 보유)를 잇는다.
//
// 셸은 스냅샷을 갖지 않는다. 셸에 api를 따로 주면 스냅샷을 두 번 불러 시뮬레이션 중 헤더와
// 본문의 시각이 어긋난다. 그래서 워크스페이스가 읽은 것을 위로 올린다.
//
// 통로는 **셸**이 연다. children 스니펫으로 들어온 컴포넌트도 실행 시점의 부모는 셸이라 컨텍스트가 닿는다
// (앱 레이아웃에서 여는 안도 시도했으나 이득이 없어 되돌렸다).
// 스냅샷은 셸이 뜬 뒤에 도착하므로 이 값은 처음엔 비어 있다 — 읽는 쪽은 그 순간을 견뎌야 한다.
import { getContext, setContext } from 'svelte';
import type { OwnerAlert, OwnerDevice } from '@boomeyes/domain';

export interface OwnerBell {
  alerts: OwnerAlert[];
  devices: Pick<OwnerDevice, 'id' | 'unit' | 'site'>[];
  /** DemoClock 기준 시각 — 상대 시각 표시에 쓴다 */
  now: string;
}
const KEY = Symbol('owner-bell');

/** 셸에서 한 번 부른다. 워크스페이스가 채우기 전에는 빈 상태다. */
export function provideBell(): OwnerBell {
  const value = $state<OwnerBell>({ alerts: [], devices: [], now: '' });
  setContext(KEY, value);
  return value;
}
/** 워크스페이스에서 부른다. 셸 밖(캡처·시연 진입 등)에서는 undefined다. */
export const bellSlot = (): OwnerBell | undefined => getContext<OwnerBell | undefined>(KEY);
