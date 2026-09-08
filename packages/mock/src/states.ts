// 상태 픽스처 — ssot/screens.yaml states[].id 별 시드 변형. 키 = `${code}:${state}`. 없으면 기본 시드.
import { INSPECTION_ITEMS } from '@boomeyes/domain';
import { clock, DAY, H, MIN } from './clock';
import type { Db } from './seed';

export type Fixture = (db: Db) => Db;

export const FIXTURES: Record<string, Fixture> = {
  // 영상: 모달은 AI 채널에 복구 후 누락분 재전송 표시 · 모니터는 오프라인/AI 판단 불가/흐림 채널을 한 화면에 (video-basics AC-1 · AC-5)
  'B1-02M:cam': (db) => ({
    ...db,
    cameras: db.cameras.map((c) =>
      c.id === 'CAM-3-2' ? { ...c, backfill: { segments: 3, since: clock.minus(40 * MIN) } } : c,
    ),
  }),
  'A1-04:monitor': (db) => ({
    ...db,
    cameras: db.cameras.map((c) =>
      c.id === 'CAM-1-1'
        ? { ...c, state: 'offline' as const, health: 'lost' as const }
        : c.id === 'CAM-2-1'
          ? { ...c, health: 'blurry' as const }
          : c.id === 'CAM-3-2'
            ? { ...c, health: 'view-changed' as const } // 시야 변경 → 판단 유보(FR-034 · v5.0 §11)
            : c,
    ),
  }),
  'A1-05:dev': (db) => db,
  // 수신 임계 초과(NFR-009 기준안 10분) + 단선 미연동 — '미수신 · 마지막 HH:MM' · '미연동' 표기(FR-034)
  'A1-05:stale': (db) => ({
    ...db,
    devices: db.devices.map((d) =>
      d.id === 'CPB-003'
        ? { ...d, telemetry: { ...d.telemetry, at: clock.minus(25 * MIN), unlinked: ['harness' as const] } }
        : d,
    ),
  }),
  // 현장 프로파일 AX-1 P-LITE(1채널 · 저장 서버만): SITE-001을 P-LITE로 — A1-04 타일 1채널 · A1-05 소스 탭 서버만 (video-basics AC-4 · PWA 측 검증)
  'A1-04:plite': (db) => ({
    ...db,
    sites: db.sites.map((s) => (s.id === 'SITE-001' ? { ...s, videoProfile: 'P-LITE' as const } : s)),
  }),
  'A1-05:plite': (db) => ({
    ...db,
    sites: db.sites.map((s) => (s.id === 'SITE-001' ? { ...s, videoProfile: 'P-LITE' as const } : s)),
  }),
  // 현장 신고(FR-038 제안) — A1-04 시트는 URL이 연다(?state=report → +page.ts) · B1-03은 C-107 시드
  'A1-04:report': (db) => db,
  'B1-03:report': (db) => ({
    ...db,
    cases: [
      {
        id: 'C-107',
        kind: 'report' as const,
        title: '현장 신고 — 작업자 상태 이상 · CPB-003',
        deviceId: 'CPB-003',
        siteId: 'SITE-001',
        state: 'new' as const,
        severity: 'critical' as const,
        assigneeId: null,
        dueAt: clock.minus(-2 * H),
        createdAt: clock.minus(3 * MIN),
        history: [
          { at: clock.minus(3 * MIN), by: 'safety01', action: '신고', note: '호스 옆 작업자 쓰러짐 — 영상 확인 요청' },
        ],
        report: { type: 'worker' as const, cameraId: 'CAM-3-2', videoAt: clock.minus(3 * MIN) },
      },
      ...db.cases,
    ],
    alerts: [
      {
        id: 'AL-F01',
        deviceId: 'CPB-003',
        kind: 'report' as const,
        severity: 'critical' as const,
        message: 'CPB-003 현장 신고 — 작업자 상태 이상 (safety01)',
        at: clock.minus(3 * MIN),
        acked: false,
        caseId: 'C-107',
        cameraId: 'CAM-3-2',
      },
      ...db.alerts,
    ],
  }),
  'A1-02:filter': (db) => db, // 필터 칩은 URL이 결정 — 시드 동일
  'A1-02:push': (db) => db, // 알림 권한 시트 — 레이아웃이 ?state=push로 연다(ADR-009), 시드 동일
  // task-escalation W2: A1-08 완료 시트(C-105 접수됨·정비 호출 후) · A3 본사(hq01 2현장)
  'A1-08:sheet': (db) => ({
    ...db,
    cases: db.cases.map((c) =>
      c.id === 'C-105'
        ? {
            ...c,
            state: 'in-progress' as const,
            assigneeId: 'safety01',
            history: [
              ...c.history,
              { at: clock.minus(5 * MIN), by: 'safety01', action: '접수' },
              { at: clock.minus(2 * MIN), by: 'safety01', action: '정비 담당 호출', note: 'maint01 통보' },
            ],
          }
        : c,
    ),
  }),
  // 서류 검토 업무가 접수 전(new)이면 A1-03은 접수 → 승인/반려 2단계 (documents AC-3)
  'A1-03:docnew': (db) => ({
    ...db,
    cases: db.cases.map((c) =>
      c.id === 'C-106'
        ? {
            ...c,
            state: 'new' as const,

            createdAt: clock.minus(20 * MIN),
            history: [{ at: clock.minus(20 * MIN), by: 'ops01', action: '제출' }],
          }
        : c,
    ),
  }),
  // 화면 검수 backlog 7 — 반려 시트(?sheet=review)는 C-106 기본 시드(접수됨·서류 검토 대기)로 이미 열 수 있어 데이터 변형 불필요. capture.mjs의 STATE_PARAMS·STATE_QUERY가 [case]=C-106·sheet=review를 채운다
  'A1-03:review': (db) => db,
  'A3-02:sites': (db) => db,
  'A3-05:inbox': (db) => db,
  // video-basics W2: 본사 열람 — A1-04 monitor와 같은 카메라 변형(오프라인·흐림)
  'A3-04:dev': (db) => FIXTURES['A1-04:monitor']!(db),
  'B2-03:site': (db) => db,
  // documents(W2): A2-05 · B1-05 · B4-06 — 시드 그대로(DOC-001 D-27 · DOC-004 검토 중 · DOC-005 반려 · DOC-006 승인). queued는 아웃박스 시드(+layout.ts QUEUED · ADR-010)
  'A2-05:docs': (db) => db,
  'A2-05:queued': (db) => db,
  'B1-05:docs': (db) => db,
  'B4-06:docs': (db) => db,
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
  'A2-02:queued': (db) => db, // 큐 항목은 db가 아니라 아웃박스에 시드 — apps/pwa +layout.ts QUEUED(ADR-010)
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
  // A3-03 normal: 대전 B(SITE-002) 장비를 정상으로 — 이상 0 렌더 (sites-assets-leases AC-7)
  'A3-03:normal': (db) => ({
    ...db,
    devices: db.devices.map((d) =>
      d.siteId === 'SITE-002'
        ? {
            ...d,
            state: 'normal' as const,
            telemetry: { ...d.telemetry, lte: 'connected' as const, errorCode: null, at: clock.iso() },
          }
        : d,
    ),
  }),
  'B4-02:proto': (db) => db,
  'B4-05:rules': (db) => db,
  // 화면 검수 backlog 5 — 시드 alerts 8건이 전부 enabled:true라 "꺼짐" 렌더가 캡처된 적이 없었다. 통신 두절 1건만 꺼서 재현
  'B4-05:off': (db) => ({
    ...db,
    rules: { ...db.rules, alerts: db.rules.alerts.map((a) => (a.kind === 'comm' ? { ...a, enabled: false } : a)) },
  }),
  // sites-assets-leases(W2 B5): 마스터 — 시드 그대로(현장 2 · 장비 5 · 계정 7)
  'B4-03:assets': (db) => db,
  'B4-04:users': (db) => db,
  // sites-assets-leases(W2 B6): 임대 계약(LS-001 D-27 expiring 최상단) · 본사 지도(hq 2현장 · 장비 5) — 시드 그대로
  'B1-06:lease': (db) => db,
  'B2-02:work': (db) => db,
  // sites-assets-leases(W2 B7): 메뉴·현장 정보 — 시드 그대로(apply는 화면이 ?state=apply를 읽어 시트를 연다)
  'A1-07:menu': (db) => db,
  'A1-07:apply': (db) => db,
  'A2-06:menu': (db) => db,
  'A3-03:site': (db) => db,
  // records-reports(W2 B8): 출근·점검 시드가 비어 있어 기록 픽스처가 오늘 출근(driver03 −2h)·점검 제출(−1h)을 채운다 (AC-1 4종 칩)
  'A1-06:rec': (db) => withDaily(db),
  'A3-06:rec': (db) => withDaily(db),
  // 보고 모드: 30일 창에만 드는 SITE-002 완료 업무(20일 전) · 서류(CPB-004 제작증) · 점검(10일 전) — 7일/30일 차이가 보이게
  'B2-04:report': (db) => {
    const d = withDaily(db);
    return {
      ...d,
      cases: [
        ...d.cases,
        {
          id: 'C-090',
          kind: 'inspection',
          title: '일일점검 미제출 — CPB-004',
          deviceId: 'CPB-004',
          siteId: 'SITE-002',
          state: 'done',
          severity: 'info',
          assigneeId: 'safety01',
          dueAt: clock.minus(19 * DAY),
          createdAt: clock.minus(20 * DAY),
          history: [
            { at: clock.minus(20 * DAY), by: 'system', action: '발행' },
            { at: clock.minus(19 * DAY), by: 'safety01', action: '완료 확인', note: '점검 제출 확인' },
          ],
        },
      ],
      docs: [
        ...d.docs,
        {
          id: 'DOC-007',
          kind: 'cert',
          subject: 'CPB-004 제작증',
          subjectId: 'CPB-004',
          siteId: 'SITE-002',
          state: 'valid',
          expiresAt: null,
          submittedAt: clock.minus(15 * DAY),
          history: [{ at: clock.minus(15 * DAY), by: 'ops01', action: '등록' }],
        },
      ],
      inspections: [
        ...d.inspections,
        {
          id: 'INS-CPB-004-old',
          userId: 'driver03',
          deviceId: 'CPB-004',
          date: clock.minus(10 * DAY).slice(0, 10),
          items: INSPECTION_ITEMS.map((x) => ({ ...x, ok: true })),
          submittedAt: clock.minus(10 * DAY),
        },
      ],
    };
  },
  // equipment-parts(W2 B9): 자리+ — 시드 그대로(P-001~005 · P-004 due · 재고 5)
  'B4-07:default': (db) => db,
  'B4-08:default': (db) => db,
  'A1-11:default': (db) => db,
  'A2-09:default': (db) => db,
  // event-replay(W2 B10): EV-001 시드 그대로
  'B1-08:default': (db) => db,
  // 영상 확보 상태(ENT-19) — 업로드 대기(사건 상태는 그대로)
  'B1-08:pending': (db) => ({
    ...db,
    events: db.events.map((e) => (e.id === 'EV-001' ? { ...e, evidence: 'pending' as const } : e)),
  }),
  // owner-showcase(W2 B11): 시드 집계 그대로(무사고 D+ = 현장 개설일 기준)
  'B1-07:show': (db) => db,
};
/** 오늘 출근·점검 1건씩(driver03 · CPB-003) — 기록 4종이 모두 보이게 */
function withDaily(db: Db): Db {
  return {
    ...db,
    attendance: [...db.attendance, checkedIn(db)],
    inspections: [
      ...db.inspections,
      {
        id: 'INS-driver03',
        userId: 'driver03',
        deviceId: 'CPB-003',
        date: clock.iso().slice(0, 10),
        items: INSPECTION_ITEMS.map((x) => ({ ...x, ok: true })),
        submittedAt: clock.minus(H),
      },
    ],
  };
}

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
