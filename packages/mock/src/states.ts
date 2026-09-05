// 상태 픽스처 — ssot/screens.yaml states[].id 별 시드 변형. 키 = `${code}:${state}`. 없으면 기본 시드.
import { INSPECTION_ITEMS } from '@boomeyes/domain';
import { clock, H, MIN } from './clock';
import type { Db } from './seed';

export type Fixture = (db: Db) => Db;

export const FIXTURES: Record<string, Fixture> = {
  'B1-02:show': (db) => db, // 쇼케이스 진입 전 = 기본
  'B1-02:quiet': (db) => ({
    ...db,
    devices: db.devices.map((d) => ({
      ...d,
      state: 'normal',
      telemetry: { ...d.telemetry, errorCode: null, voltageStatus: 'normal', lte: 'connected' },
    })),
    alerts: [],
    cases: db.cases.filter((c) => c.state === 'done'),
  }),
  'B1-02M:cam': (db) => db,
  'A1-02:filter': (db) => db, // 필터 칩은 URL이 결정 — 시드 동일
  'B1-03:inbox': (db) => db,
  // 에스컬레이션 화면: C-105를 65분 전 발행으로 두면 escalations()가 escalated로 전이한다 (AC-7)
  'B1-04:esc': (db) => ({
    ...db,
    cases: db.cases.map((c) =>
      c.id === 'C-105'
        ? {
            ...c,
            createdAt: clock.minus(65 * MIN),
            history: [{ at: clock.minus(65 * MIN), by: 'system', action: '발행 — E-021 380V 전압 이상' }],
          }
        : c,
    ),
  }),
  // driver-daily(A2) — 출근 2h 전 · 점검 제출은 inspected만 · mydev는 필터 도달률 92%(임계 접근)
  'A2-02:checked': (db) => ({ ...db, attendance: [checkedIn(db)] }),
  'A2-03:inspect': (db) => ({ ...db, attendance: [checkedIn(db)] }),
  'A2-03:inspected': (db) => ({
    ...db,
    attendance: [checkedIn(db)],
    inspections: [
      {
        id: 'INS-driver03',
        userId: 'driver03',
        deviceId: 'CPB-003',
        date: clock.iso().slice(0, 10),
        items: INSPECTION_ITEMS.map((x) => ({ ...x, ok: true })),
        submittedAt: clock.minus(90 * MIN),
      },
    ],
  }),
  'A2-04:mydev': (db) => ({
    ...db,
    devices: db.devices.map((d) =>
      d.id === 'CPB-003' ? { ...d, telemetry: { ...d.telemetry, filterRatio: 0.92 } } : d,
    ),
  }),
  'A3-03:normal': (db) => db,
  'B4-02:proto': (db) => db,
  'B4-05:rules': (db) => db,
};

function checkedIn(db: Db) {
  const site = db.sites.find((s) => s.id === 'SITE-001');
  return {
    userId: 'driver03',
    deviceId: 'CPB-003',
    siteId: 'SITE-001',
    checkinAt: clock.minus(2 * H),
    checkoutAt: null,
    lat: site?.lat,
    lng: site?.lng,
  };
}

export function applyState(db: Db, code: string, state: string | null): Db {
  if (!state) return db;
  const f = FIXTURES[`${code}:${state}`];
  return f ? f(db) : db;
}
