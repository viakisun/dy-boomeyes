// demo-scripts — 시연 장면 재생(specs/demo-scripts · docs/DEMO.md §5). 장면 정의는 ssot.json scenarios.demo에서 파생한다(손 목록 없음)
import ssot from '@boomeyes/domain/generated/ssot.json';
import { SCREENS, type Alert, type RealtimeClient, type ScrId } from '@boomeyes/domain';
import type { createMockApi } from './api';
import { clock, MIN } from './clock';
import type { Db } from './seed';
import type { Fixture } from './states';

export interface DemoScene {
  scene: number;
  title: string;
  screens: ScrId[];
  /** demo[].fixture.account — 장면 진입 시 이 계정의 세션을 합성한다 */
  account: string;
  /** 첫 화면 라우트(파라미터는 fixture로 치환) */
  entry: string;
  app: 'web' | 'pwa';
}
type DemoRow = { scene: number; title: string; screens: string[]; fixture: Record<string, string> };
export const SCENES: DemoScene[] = (ssot.scenarios.demo as unknown as DemoRow[]).map((d) => {
  const first = d.screens[0] as ScrId;
  const s = SCREENS[first];
  const entry = s.route.replace('[case]', d.fixture.case ?? 'C-105').replace('[device]', d.fixture.device ?? 'CPB-003');
  return {
    scene: d.scene,
    title: d.title,
    screens: d.screens as ScrId[],
    account: d.fixture.account ?? 'control01',
    entry,
    app: s.app,
  };
});
export const sceneOf = (n: number | null | undefined): DemoScene | null => SCENES.find((s) => s.scene === n) ?? null;

const accepted = (db: Db, by: string): Db => ({
  ...db,
  cases: db.cases.map((c) =>
    c.id === 'C-105'
      ? {
          ...c,
          state: 'in-progress' as const,
          assigneeId: by,
          history: [...c.history, { at: clock.minus(5 * MIN), by, action: '접수' }],
        }
      : c,
  ),
});
const called = (db: Db, by: string): Db => ({
  ...db,
  cases: db.cases.map((c) =>
    c.id === 'C-105'
      ? {
          ...c,
          history: [...c.history, { at: clock.minus(2 * MIN), by, action: '정비 담당 호출', note: 'maint01 통보' }],
        }
      : c,
  ),
});
/** 장면 픽스처(순수) — 1: "상황 발생 전"(타임라인이 E-021을 만든다) · 4·5: C-105 진행 · 6: CPB-004 55분 방치(1시간 경과로 에스컬레이션) · 9: 임대 계약 시드 */
export const SCENE_FIXTURES: Record<number, Fixture> = {
  1: (db) => ({
    ...db,
    devices: db.devices.map((d) =>
      d.id === 'CPB-003'
        ? {
            ...d,
            state: 'normal' as const,
            telemetry: { ...d.telemetry, voltage: 381, voltageStatus: 'normal' as const, errorCode: null },
          }
        : d,
    ),
    alerts: db.alerts.filter((a) => a.caseId !== 'C-105'),
    cases: db.cases.filter((c) => c.id !== 'C-105'),
  }),
  4: (db) => accepted(db, 'control01'),
  5: (db) => called(accepted(db, 'safety01'), 'safety01'),
  6: (db) => ({
    ...db,
    cases: db.cases.map((c) =>
      c.id === 'C-104'
        ? {
            ...c,
            state: 'new' as const,
            assigneeId: null,
            createdAt: clock.minus(55 * MIN),
            history: [{ at: clock.minus(55 * MIN), by: 'system', action: '발행 — 통신 두절 (LWT 재수신 없음)' }],
          }
        : c,
    ),
  }),
  // 9: 사업 가치 — 시드 그대로(LS-001 D-27 expiring이 B1-06 최상단, 재배치는 화면에서)
  9: (db) => db,
  // 10: 쇼케이스 — 시드 그대로(entry /b1/showcase · 계정 safety01은 레이아웃이 control로 대체)
  10: (db) => db,
};

/** 장면 1 타임라인: firstMs 뒤 E-021 발생 — db 변형(CPB-003 fault · 알림 · C-105) 후 alert.raised 1회. 다른 장면은 발행하지 않는다(결정성) */
export function createSceneRealtime(
  scene: number,
  api: ReturnType<typeof createMockApi>,
  opts: { firstMs?: number } = {},
): RealtimeClient {
  const { firstMs = 3_000 } = opts;
  return {
    subscribe(handler) {
      if (scene !== 1 || typeof window === 'undefined') return () => {};
      const t = setTimeout(() => {
        const db = api.db;
        const now = clock.iso();
        const d = db.devices.find((x) => x.id === 'CPB-003');
        if (d) {
          d.state = 'fault';
          d.telemetry = { ...d.telemetry, at: now, voltage: 342, voltageStatus: 'abnormal', errorCode: 'E-021' };
        }
        if (!db.cases.some((c) => c.id === 'C-105'))
          db.cases.push({
            id: 'C-105',
            kind: 'fault',
            title: '전압 이상 E-021 — CPB-003',
            deviceId: 'CPB-003',
            siteId: d?.siteId ?? 'SITE-001',
            state: 'new',
            severity: 'critical',
            assigneeId: null,
            dueAt: now,
            createdAt: now,
            history: [{ at: now, by: 'system', action: '발행 — E-021 380V 전압 이상' }],
          });
        const alert: Alert = {
          id: 'AL-D01',
          deviceId: 'CPB-003',
          kind: 'voltage',
          severity: 'critical',
          message: 'CPB-003 380V 전압 이상 (E-021) — 342V',
          at: now,
          acked: false,
          caseId: 'C-105',
        };
        db.alerts.unshift(alert);
        handler({ type: 'alert.raised', alert });
      }, firstMs);
      return () => clearTimeout(t);
    },
  };
}
