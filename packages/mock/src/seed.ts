// 시드 — 데모 픽스처(INTENT §7 · docs/DEMO.md): CPB-003 E-021 전압 이상 · CPB-004 통신 두절 · C-105 · D-27 임대 · 교육 이수증
import ssot from '@boomeyes/domain/generated/ssot.json';
import { CPB_V0_1, pourSeries } from '@boomeyes/domain';
import { STILL_BBOX } from '@boomeyes/video/assets';
import type {
  Alert,
  Attendance,
  Camera,
  Case,
  Consent,
  Device,
  Doc,
  Inspection,
  Lease,
  Owner,
  Part,
  PartEvent,
  ProtocolVersion,
  ReplayEvent,
  Request,
  RuleSet,
  Stock,
  SampleTest,
  Site,
  User,
} from '@boomeyes/domain';
import { clock, DAY, H, MIN } from './clock';

export interface Db {
  users: User[];
  sites: Site[];
  owners: Owner[];
  devices: Device[];
  cameras: Camera[];
  alerts: Alert[];
  cases: Case[];
  requests: Request[];
  attendance: Attendance[];
  inspections: Inspection[];
  consents: Consent[];
  protocols: ProtocolVersion[];
  samples: SampleTest[];
  rules: RuleSet;
  docs: Doc[];
  leases: Lease[];
  /** ENT-16~18 마모·교체 부품(W2 구조) */
  parts: Part[];
  partEvents: PartEvent[];
  stock: Stock[];
  /** ENT-19 이벤트 복기 스텁(W2) */
  events: ReplayEvent[];
}

/** 데모 계정 7 — ssot roles.demo_account (capture 모드 세션 합성에도 쓴다) */
export function demoUsers(): User[] {
  return (
    ssot.roles.roles as { id: User['role']; demo_account: { login: string; display: string }; org: string }[]
  ).map((r) => ({
    id: r.demo_account.login,
    role: r.id,
    display: r.demo_account.display,
    org: r.org,
    siteIds:
      r.id === 'site-safety' || r.id === 'driver' ? ['SITE-001'] : r.id === 'hq-safety' ? ['SITE-001', 'SITE-002'] : [],
    deviceId: r.id === 'driver' ? 'CPB-003' : undefined,
    phone: r.id === 'maintenance' ? '010-0000-0009' : undefined,
  }));
}

export function seed(): Db {
  const now = clock.now();
  const t = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const users: User[] = demoUsers();
  const owners: Owner[] = [{ id: 'OWN-001', name: '차사장 중기', contact: '010-0000-0001' }];
  const sites: Site[] = [
    {
      id: 'SITE-001',
      name: '한빛 초등학교 건설 현장',
      address: '전라북도 전주시 덕진구 팔복1동 127-3',
      company: 'G/S 건설',
      lat: 35.8469,
      lng: 127.1128,
      videoProfile: 'P-SD',
      safetyUserId: 'safety01',
      period: { from: '2026-03-01', to: '2026-12-31' },
    },
    {
      id: 'SITE-002',
      name: '대전 B 물류센터',
      address: '대전광역시 유성구 관평동 1359',
      company: 'G/S 건설',
      lat: 36.4239,
      lng: 127.3917,
      videoProfile: 'P-LITE',
      safetyUserId: 'safety01',
      period: { from: '2026-05-01', to: '2027-02-28' },
    },
  ];
  const dev = (
    n: number,
    siteId: string,
    state: Device['state'],
    lat: number,
    lng: number,
    extra: Partial<Device['telemetry']> = {},
  ): Device => ({
    id: `CPB-${String(n).padStart(3, '0')}`,
    unitNo: n,
    siteId,
    ownerId: 'OWN-001',
    state,
    lat,
    lng,
    telemetry: {
      at: t(30_000),
      voltage: 381,
      voltageStatus: 'normal',
      harness: 'ok',
      lte: 'connected',
      gpsFix: true,
      errorCode: null,
      pipeRatio: 0.62,
      filterRatio: 0.48,
      boomAngle: 54,
      // 3상 계측(FR-040 · IF-020) — 기본은 균형 정상. 상별 값은 DISC-056 확정 전 목업 기준안
      power: { volts: { r: 381, s: 380, t: 382 }, fault: 'none', motorReady: true },
      ...extra,
    },
  });
  const devices: Device[] = [
    dev(1, 'SITE-001', 'normal', 35.8471, 127.1131),
    dev(2, 'SITE-001', 'caution', 35.8466, 127.1122, { pipeRatio: 0.96 }),
    dev(3, 'SITE-001', 'fault', 35.8474, 127.1119, {
      voltage: 342,
      voltageStatus: 'abnormal',
      errorCode: 'E-021',
      at: t(20_000),
      // 342V의 원인 = S상 결상(시연 장면 11 서사) — 대표 전압은 남기고 상별 실측을 붙인다
      power: { volts: { r: 381, s: 118, t: 379 }, fault: 'loss', motorReady: false },
    }),
    dev(4, 'SITE-002', 'offline', 36.4241, 127.392, { lte: 'lost', at: t(2 * H + 5 * MIN) }),
    dev(5, 'SITE-002', 'maintenance', 36.4236, 127.3912, { boomAngle: 0, unlinked: ['harness', 'power'] }), // 정비 중 — 단선·3상 계측 미연동(FR-034 표기 예)
  ];
  const cameras: Camera[] = devices.flatMap((d) => [
    {
      id: `CAM-${d.unitNo}-1`,
      deviceId: d.id,
      kind: 'general',
      mount: 'body-joint1',
      state: d.state === 'offline' ? 'offline' : 'live',
      ingest: 'E1',
      live: 'L1',
      recording: 'server',
      retentionDays: 7,
      snapshotAt: t(6_000),
    },
    {
      id: `CAM-${d.unitNo}-2`,
      deviceId: d.id,
      kind: 'ai',
      mount: 'last-rigid',
      state: d.state === 'offline' ? 'offline' : d.unitNo === 2 ? 'ai-unavailable' : 'snapshot',
      ingest: 'E1',
      live: 'L1',
      recording: 'sd',
      retentionDays: 7,
      snapshotAt: t(8_000),
    },
  ]);
  const cases: Case[] = [
    {
      id: 'C-101',
      kind: 'doc',
      title: '운전자 교육 이수증 검토',
      deviceId: null,
      siteId: 'SITE-001',
      state: 'assigned',
      severity: 'info',
      assigneeId: 'safety01',
      dueAt: t(-2 * DAY),
      createdAt: t(2 * DAY),
      history: [{ at: t(2 * DAY), by: 'driver03', action: '제출' }],
    },
    {
      id: 'C-102',
      kind: 'inspection',
      title: '일일점검 미제출 — CPB-002',
      deviceId: 'CPB-002',
      siteId: 'SITE-001',
      state: 'done',
      severity: 'warning',
      assigneeId: 'safety01',
      dueAt: t(DAY),
      createdAt: t(3 * DAY),
      history: [
        { at: t(3 * DAY), by: 'system', action: '발행' },
        { at: t(DAY), by: 'safety01', action: '완료 확인', note: '재제출 확인' },
      ],
    },
    {
      id: 'C-103',
      kind: 'fault',
      title: '수송관 도달률 96% — CPB-002',
      deviceId: 'CPB-002',
      siteId: 'SITE-001',
      state: 'in-progress',
      severity: 'warning',
      assigneeId: 'safety01',
      dueAt: t(-DAY),
      createdAt: t(6 * H),
      history: [
        { at: t(6 * H), by: 'system', action: '발행' },
        { at: t(5 * H), by: 'safety01', action: '접수' },
      ],
    },
    {
      id: 'C-104',
      kind: 'comm',
      title: '통신 두절 2시간 — CPB-004',
      deviceId: 'CPB-004',
      siteId: 'SITE-002',
      state: 'escalated',
      severity: 'critical',
      assigneeId: null,
      dueAt: t(H + 5 * MIN),
      createdAt: t(2 * H + 5 * MIN),
      history: [
        { at: t(2 * H + 5 * MIN), by: 'system', action: '발행' },
        { at: t(65 * MIN), by: 'system', action: '에스컬레이션 — 1h 미접수, 본사 통보' },
      ],
    },
    {
      id: 'C-105',
      kind: 'fault',
      title: '전압 이상 E-021 — CPB-003',
      deviceId: 'CPB-003',
      siteId: 'SITE-001',
      state: 'new',
      severity: 'critical',
      assigneeId: null,
      dueAt: t(-H),
      createdAt: t(20_000),
      history: [{ at: t(20_000), by: 'system', action: '발행 — E-021 380V 전압 이상' }],
      eventId: 'EV-001',
    },
    {
      id: 'C-106',
      kind: 'doc',
      title: 'CPB-002 비파괴 검사 성적서 검토',
      deviceId: 'CPB-002',
      siteId: 'SITE-001',
      state: 'assigned', // 배정됨 — 1h 에스컬레이션 대상(new) 아님
      severity: 'info',
      assigneeId: 'safety01',
      dueAt: t(-2 * DAY),
      createdAt: t(DAY),
      history: [{ at: t(DAY), by: 'ops01', action: '제출' }],
      docId: 'DOC-004',
    },
  ];
  const alerts: Alert[] = [
    {
      id: 'AL-001',
      deviceId: 'CPB-003',
      kind: 'voltage',
      severity: 'critical',
      message: 'CPB-003 380V 전압 이상 (E-021) — 342V',
      at: t(20_000),
      acked: false,
      caseId: 'C-105',
      eventId: 'EV-001',
    },
    {
      id: 'AL-002',
      deviceId: 'CPB-004',
      kind: 'comm',
      severity: 'critical',
      message: 'CPB-004 통신 두절 2시간 5분 (LWT)',
      at: t(2 * H + 5 * MIN),
      acked: false,
      caseId: 'C-104',
    },
    {
      id: 'AL-003',
      deviceId: 'CPB-002',
      kind: 'pipe',
      severity: 'warning',
      message: 'CPB-002 수송관 도달률 96% — 점검 권고',
      at: t(6 * H),
      acked: true,
      caseId: 'C-103',
    },
    {
      id: 'AL-004',
      deviceId: 'CPB-002',
      kind: 'camera-health',
      severity: 'warning',
      message: 'CPB-002 AI 카메라 판단 불가 — 렌즈 가림 의심',
      at: t(40 * MIN),
      acked: false,
      caseId: null,
    },
    {
      id: 'AL-005',
      deviceId: 'CPB-001',
      kind: 'filter',
      severity: 'info',
      message: 'CPB-001 필터 도달률 48%',
      at: t(DAY),
      acked: true,
      caseId: null,
    },
    {
      id: 'AL-006',
      deviceId: 'CPB-005',
      kind: 'error',
      severity: 'info',
      message: 'CPB-005 정비 중 — 유압 펌프 교체',
      at: t(3 * DAY),
      acked: true,
      caseId: null,
    },
    {
      id: 'AL-007',
      deviceId: 'CPB-001',
      kind: 'doc',
      severity: 'info',
      message: '운전자 교육 이수증 만료 D-27',
      at: t(DAY),
      acked: false,
      caseId: 'C-101',
    },
    {
      id: 'AL-008',
      deviceId: 'CPB-003',
      kind: 'ai-person',
      severity: 'warning',
      message: 'CPB-003 호스 주변 인원 접근 후보 (AI)',
      at: t(50 * MIN),
      acked: true,
      caseId: null,
      cameraId: 'CAM-3-2', // B1-02M 모달 bbox · EV-001 AI 레인 마커 · 스냅샷 스틸(boom-person)의 원천
      bbox: STILL_BBOX['boom-person'],
    },
  ];
  const docs: Doc[] = [
    {
      id: 'DOC-001',
      kind: 'training',
      subject: '박기사 교육 이수증',
      subjectId: 'driver03',
      siteId: 'SITE-001',
      state: 'expiring',
      expiresAt: t(-27 * DAY),
      submittedAt: null,
      history: [{ at: t(3 * DAY), by: 'system', action: '만료 임박 D-30' }],
    },
    {
      id: 'DOC-002',
      kind: 'license',
      subject: '박기사 면허',
      subjectId: 'driver03',
      siteId: 'SITE-001',
      state: 'valid',
      expiresAt: t(-400 * DAY),
      submittedAt: t(200 * DAY),
      history: [],
    },
    {
      id: 'DOC-003',
      kind: 'cert',
      subject: 'CPB-003 제작증',
      subjectId: 'CPB-003',
      siteId: 'SITE-001',
      state: 'valid',
      expiresAt: null,
      submittedAt: t(300 * DAY),
      history: [],
    },
    {
      id: 'DOC-004',
      kind: 'ndt',
      subject: 'CPB-002 비파괴 검사 성적서',
      subjectId: 'CPB-002',
      siteId: 'SITE-001',
      state: 'review',
      expiresAt: t(-100 * DAY),
      submittedAt: t(DAY),
      history: [],
    },
    {
      id: 'DOC-005',
      kind: 'contract',
      subject: '박기사 근로계약서',
      subjectId: 'driver03',
      siteId: 'SITE-001',
      state: 'rejected',
      expiresAt: null,
      submittedAt: t(2 * DAY),
      history: [
        { at: t(2 * DAY), by: 'driver03', action: '제출' },
        { at: t(DAY), by: 'safety01', action: '반려', note: '서명 누락 — 재작성 후 제출' },
      ],
    },
    {
      id: 'DOC-006',
      kind: 'license',
      subject: '이관제 안전관리자 선임증',
      subjectId: 'safety01',
      siteId: 'SITE-001',
      state: 'approved',
      expiresAt: t(-300 * DAY),
      submittedAt: t(10 * DAY),
      history: [
        { at: t(10 * DAY), by: 'safety01', action: '제출' },
        { at: t(9 * DAY), by: 'control01', action: '승인' },
      ],
    },
  ];
  const leases: Lease[] = [
    // lease 상태기계(ENT-10): LS-001 만료 D-27 → expiring(장면 9 · B1-06 최상단) · LS-002 D-150 active
    {
      id: 'LS-001',
      deviceId: 'CPB-001',
      siteId: 'SITE-001',
      ownerId: 'OWN-001',
      from: t(60 * DAY),
      to: t(-27 * DAY),
      state: 'expiring',
      history: [
        { at: t(60 * DAY), by: 'ops01', action: '계약 등록', note: 'CPB-001 · 한빛 초등학교 · 87일' },
        { at: t(3 * DAY), by: 'system', action: '만료 임박 D-30' },
      ],
    },
    {
      id: 'LS-002',
      deviceId: 'CPB-003',
      siteId: 'SITE-001',
      ownerId: 'OWN-001',
      from: t(30 * DAY),
      to: t(-150 * DAY),
      state: 'active',
      history: [{ at: t(30 * DAY), by: 'ops01', action: '계약 등록', note: 'CPB-003 · 한빛 초등학교 · 180일' }],
    },
  ];
  // FR-017 신청·요청 5 — 수신함(B1-03) 픽스처
  const requests: Request[] = [
    {
      id: 'RQ-001',
      kind: 'site-open',
      title: '한빛 초등학교 2공구 개설 신청',
      requesterId: 'hq01',
      siteId: 'SITE-001',
      state: 'submitted',
      requestedAt: t(3 * H),
      note: '10월 타설 시작, CPB 2대 필요',
      history: [{ at: t(3 * H), by: 'hq01', action: '신청' }],
    },
    {
      id: 'RQ-002',
      kind: 'device-assign',
      title: 'CPB-006 배정 요청 — 대전 B 물류센터',
      requesterId: 'hq01',
      siteId: 'SITE-002',
      state: 'review',
      requestedAt: t(DAY + H),
      history: [
        { at: t(DAY + H), by: 'hq01', action: '신청' },
        { at: t(20 * H), by: 'control01', action: '검토 시작' },
      ],
    },
    {
      id: 'RQ-003',
      kind: 'doc',
      title: '박기사 교육 이수증 갱신 서류 제출',
      requesterId: 'safety01',
      siteId: 'SITE-001',
      state: 'submitted',
      requestedAt: t(2 * H),
      note: 'DOC-001 만료 D-27',
      history: [{ at: t(2 * H), by: 'safety01', action: '신청' }],
    },
    {
      id: 'RQ-004',
      kind: 'device-assign',
      title: 'CPB-002 교체 장비 요청',
      requesterId: 'safety01',
      siteId: 'SITE-001',
      state: 'approved',
      requestedAt: t(2 * DAY),
      history: [
        { at: t(2 * DAY), by: 'safety01', action: '신청' },
        { at: t(DAY + 6 * H), by: 'control01', action: '승인', note: 'CPB-007 9/10 투입' },
      ],
    },
    {
      id: 'RQ-005',
      kind: 'doc',
      title: 'CPB-002 비파괴 검사 성적서 검토 요청',
      requesterId: 'safety01',
      siteId: 'SITE-001',
      state: 'review',
      requestedAt: t(DAY),
      note: 'DOC-004',
      history: [
        { at: t(DAY), by: 'safety01', action: '신청' },
        { at: t(18 * H), by: 'control01', action: '검토 시작' },
      ],
    },
  ];
  // driver-daily: 출근·점검은 비어 있음(픽스처가 채움) · 동의는 표준 패키지(영상·위치 동의, 음성 미동의)
  const attendance: Attendance[] = [];
  const inspections: Inspection[] = [];
  const consents: Consent[] = [
    {
      userId: 'driver03',
      items: [
        { kind: 'video', agreed: true, at: t(30 * DAY) },
        { kind: 'audio', agreed: false, at: t(30 * DAY) },
        { kind: 'location', agreed: true, at: t(30 * DAY) },
      ],
    },
  ];
  // admin-protocol-rules: 프로토콜 2(운영 cpb.v0.1 · 테스트 cpb.v0.2) · 샘플 3 · 규칙(알림 8 · 고장코드 · 시나리오)
  const protocols: ProtocolVersion[] = [
    {
      id: 'PV-001',
      version: CPB_V0_1.version,
      kind: 'production',
      def: CPB_V0_1,
      uploadedAt: t(30 * DAY),
      uploadedBy: 'ops01',
      lastReceivedAt: t(20_000),
      note: '별첨 1-3.3 텔레메트리 항목 — 운영',
    },
    {
      id: 'PV-002',
      version: 'cpb.v0.2',
      kind: 'test',
      def: {
        ...CPB_V0_1,
        version: 'cpb.v0.2',
        groups: CPB_V0_1.groups.map((g) =>
          g.group === '전압' ? { ...g, fields: [...g.fields, { name: 'frequency_hz', type: 'number' as const }] } : g,
        ),
      },
      uploadedAt: t(2 * DAY),
      uploadedBy: 'ops01',
      lastReceivedAt: null,
      note: '전압 그룹에 주파수 추가 — 테스트',
    },
  ];
  const base = JSON.parse(
    (ssot as { interfaces: { protocol: { sample: string } } }).interfaces.protocol.sample,
  ) as Record<string, unknown>;
  const missing = structuredClone(base);
  delete (missing.gps as Record<string, unknown>).latitude;
  delete missing.power;
  missing.harness = { disconnected: true }; // 오류 샘플도 알림을 낸다 — 장면 8 "오류 샘플 파싱 테스트 → 알림 발생 확인"
  const wrongType = structuredClone(base);
  (wrongType.power as Record<string, unknown>).voltage_value = '380';
  (wrongType.gps as Record<string, unknown>).fix_status = 'lost';
  (wrongType.harness as Record<string, unknown>).disconnected = 'no';
  wrongType.error = { error_code: 'E-011', error_name: '제어기 통신 두절', severity: 'critical' };
  wrongType.network = { type: 'LTE', status: 'lost' };
  const abnormal = structuredClone(base);
  abnormal.error = { error_code: 'E-021', error_name: '380V 전압 이상', severity: 'critical' };
  abnormal.power = { voltage_status: 'abnormal', voltage_value: 342 };
  abnormal.consumables = [{ part_type: 'pipe', usage_value: 96, threshold: 100 }];
  const samples: SampleTest[] = [
    { id: 'S-OK', label: '정상', json: JSON.stringify(base, null, 2) },
    { id: 'S-ALERT', label: '이상 값', json: JSON.stringify(abnormal, null, 2) },
    { id: 'S-MISSING', label: '필드 누락', json: JSON.stringify(missing, null, 2) },
    { id: 'S-TYPE', label: '타입 오류', json: JSON.stringify(wrongType, null, 2) },
  ];
  const rules: RuleSet = {
    alerts: [
      { kind: 'comm', label: '통신 두절', severity: 'critical', roles: ['control', 'site-safety'], enabled: true },
      { kind: 'gps', label: 'GPS 미수신', severity: 'info', roles: ['control'], enabled: true },
      {
        kind: 'voltage',
        label: '380V 전압 이상',
        severity: 'critical',
        roles: ['control', 'site-safety', 'driver'],
        enabled: true,
      },
      { kind: 'harness', label: '하네스 단선', severity: 'critical', roles: ['control', 'site-safety'], enabled: true },
      // 3상 전원 이상(FR-040) — 종류는 등록, 임계는 DISC-056 확정 전이라 threshold 없음(comm·gps·voltage와 같은 형태)
      {
        kind: 'phase',
        label: '3상 전원 이상',
        severity: 'critical',
        roles: ['control', 'site-safety', 'maintenance'],
        enabled: true,
      },
      {
        kind: 'error',
        label: '고장코드',
        severity: 'critical',
        roles: ['control', 'site-safety', 'driver', 'maintenance'],
        enabled: true,
      },
      {
        kind: 'doc',
        label: '서류 미비·만료',
        severity: 'warning',
        roles: ['site-safety', 'hq-safety'],
        threshold: { caution: 30, danger: 0, unit: '일' },
        enabled: true,
      },
      {
        kind: 'pipe',
        label: '수송관 도달률',
        severity: 'warning',
        roles: ['site-safety', 'driver'],
        threshold: { caution: 0.9, danger: 1, unit: '비율' },
        enabled: true,
      },
      {
        kind: 'filter',
        label: '필터 도달률',
        severity: 'warning',
        roles: ['site-safety', 'driver'],
        threshold: { caution: 0.9, danger: 1, unit: '비율' },
        enabled: true,
      },
    ],
    errorCodes: [
      {
        code: 'E-011',
        name: '제어기 통신 두절',
        severity: 'critical',
        guide: 'LTE 신호·게이트웨이 전원 확인, 5분 내 미복구 시 정비 호출',
      },
      {
        code: 'E-021',
        name: '380V 전압 이상',
        severity: 'critical',
        guide: '상 전압 확인(342V 이하 저전압), 릴레이·입력 전원 점검 후 재기동',
      },
      {
        code: 'E-022',
        name: '3상 전원 이상',
        severity: 'critical',
        guide: '결상·역상 시 모터 구동 불가 — 3상 결선·차단기·상 순서 점검 후 재기동',
      },
      { code: 'E-031', name: '하네스 단선', severity: 'critical', guide: '단선 채널 커넥터 점검, 작업 중지' },
      {
        code: 'E-041',
        name: '수송관 도달률 임계 초과',
        severity: 'warning',
        guide: '두께 실측 후 교체 부품 발주(OEM 기준 준비 중)',
      },
    ],
    scenarios: [
      { id: 'SC-1', title: '정상 타설', severity: 'none', locked: false, note: '알림 없음 — 로그만' },
      {
        id: 'SC-2',
        title: '호스 주변 인원 접근',
        severity: 'critical',
        locked: false,
        note: '즉시 알림 (AI 카메라 이벤트)',
      },
      { id: 'SC-3', title: '배관·호스 이상', severity: 'critical', locked: false, note: '긴급' },
      { id: 'SC-4', title: '영상 장애', severity: 'warning', locked: false, note: 'AI 판단 불가 표시 + 알림' },
      { id: 'SC-5', title: '전도', severity: 'critical', locked: true, note: '현장 검증 후 적용' },
      { id: 'SC-6', title: '무동작', severity: 'warning', locked: true, note: '현장 검증 후 적용' },
    ],
    updatedAt: t(5 * DAY),
    updatedBy: 'ops01',
    history: [{ at: t(5 * DAY), by: 'ops01', action: '알림 기준 등록 — 9종 · 고장코드 5' }],
  };
  // equipment-parts(W2 B9, 구조): CPB-003 5군 각 1 — P-004 가스켓은 점검 불합으로 due · 이력 3 · 재고 5 (임계·주기는 DISC-038)
  const parts: Part[] = [
    {
      id: 'P-001',
      partNo: 'DY-PIPE-125',
      group: 'pipe',
      deviceId: 'CPB-003',
      position: '붐 1단 직관',
      installedAt: t(60 * DAY),
      lot: 'L2604-07',
      baseThicknessMm: 4.5,
      lastThicknessMm: null,
      pouredM3: 1820,
      guideM3: 3000,
      runHours: 310,
      state: 'installed',
    },
    {
      id: 'P-002',
      partNo: 'DY-ELB-90',
      group: 'elbow',
      deviceId: 'CPB-003',
      position: '붐 2단 엘보',
      installedAt: t(60 * DAY),
      lot: 'L2604-07',
      baseThicknessMm: 6.0,
      lastThicknessMm: 5.2,
      pouredM3: 1820,
      guideM3: 3000,
      runHours: 310,
      state: 'inspected',
    },
    {
      id: 'P-003',
      partNo: 'DY-FLG-125',
      group: 'flange',
      deviceId: 'CPB-003',
      position: '붐 3단 플랜지',
      installedAt: t(45 * DAY),
      lot: 'L2605-02',
      baseThicknessMm: 8.0,
      lastThicknessMm: null,
      pouredM3: 1210,
      guideM3: 3000,
      runHours: 205,
      state: 'installed',
    },
    {
      id: 'P-004',
      partNo: 'DY-GSK-125',
      group: 'gasket',
      deviceId: 'CPB-003',
      position: '엔드호스 접속부 가스켓',
      installedAt: t(30 * DAY),
      lot: 'L2606-01',
      baseThicknessMm: 3.5,
      lastThicknessMm: 3.1,
      pouredM3: 820,
      guideM3: 3000,
      runHours: 140,
      state: 'due',
    },
    {
      id: 'P-005',
      partNo: 'DY-EH-125',
      group: 'endhose',
      deviceId: 'CPB-003',
      position: '엔드호스',
      installedAt: t(30 * DAY),
      lot: 'L2606-01',
      baseThicknessMm: 5.0,
      lastThicknessMm: null,
      pouredM3: 820,
      guideM3: 3000,
      runHours: 140,
      state: 'installed',
    },
  ];
  const partEvents: PartEvent[] = [
    {
      id: 'PE-001',
      partId: 'P-001',
      kind: 'install',
      at: t(60 * DAY),
      by: 'maint01',
      note: '붐 1단 직관 장착 · 로트 L2604-07',
    },
    {
      id: 'PE-002',
      partId: 'P-002',
      kind: 'inspect',
      at: t(5 * DAY),
      by: 'safety01',
      thicknessMm: 5.2,
      visual: 'ok',
      fastening: 'ok',
      pass: true,
    },
    {
      id: 'PE-003',
      partId: 'P-004',
      kind: 'inspect',
      at: t(2 * DAY),
      by: 'safety01',
      thicknessMm: 3.1,
      visual: 'wear',
      fastening: 'ok',
      pass: false,
      note: '마모 한계 접근 — 교체 대상',
    },
  ];
  const stock: Stock[] = [
    { id: 'ST-001', partNo: 'DY-PIPE-125', group: 'pipe', onHand: 3, safety: 2 },
    { id: 'ST-002', partNo: 'DY-ELB-90', group: 'elbow', onHand: 2, safety: 1 },
    { id: 'ST-003', partNo: 'DY-FLG-125', group: 'flange', onHand: 4, safety: 2 },
    { id: 'ST-004', partNo: 'DY-GSK-125', group: 'gasket', onHand: 10, safety: 4 },
    { id: 'ST-005', partNo: 'DY-EH-125', group: 'endhose', onHand: 1, safety: 1 },
  ];
  // event-replay(W2 B10, 구조): EV-001 = AL-001(E-021) · t0 = 알림 시각 · 창 ±60초 · 4레인 메타(실영상 seek·채번은 2단계 DISC-039) · 원본 보존 잠금(NFR-015)
  const t0 = new Date(now.getTime() - 20_000);
  const off = (sec: number) => new Date(t0.getTime() + sec * 1000).toISOString();
  const events: ReplayEvent[] = [
    {
      id: 'EV-001',
      kind: 'voltage',
      deviceId: 'CPB-003',
      at: t0.toISOString(),
      windowSec: 60,
      alertId: 'AL-001',
      caseId: 'C-105',
      locked: true,
      evidence: 'partial', // 일반·AI 세그먼트 있음 · 바디캠 없음 — 사건 상태와 별개(참고자료 v5.0 §15)
      lanes: {
        general: {
          source: 'general',
          available: true,
          cameraId: 'CAM-3-1',
          segments: [{ from: off(-60), to: off(60), label: '서버 세그먼트 · 대체 클립' }],
          markers: [{ at: off(0), label: 't0 — 전방 조망' }],
        },
        ai: {
          source: 'ai',
          available: true,
          cameraId: 'CAM-3-2',
          segments: [{ from: off(-60), to: off(60), label: 'SD 병행 세그먼트 · 대체 클립' }],
          markers: [
            { at: off(-12), label: 'AI 사람 접근 후보', still: 'boom-person', bbox: STILL_BBOX['boom-person'] },
            { at: off(0), label: 't0 — 붐 끝 하향' },
          ],
        },
        bodycam: {
          source: 'bodycam',
          available: false,
          note: '바디캠 A — 세션 연동 준비 중',
          segments: [],
          markers: [],
        },
        cpb: {
          source: 'cpb',
          available: true,
          segments: [],
          markers: [
            { at: off(-30), label: '전압 378V · 정상' },
            { at: off(-5), label: '전압 351V · 하강' },
            { at: off(0), label: '전압 342V · E-021 발생' },
            { at: off(2), label: 'AL-001 긴급 알림 · C-105 발행' },
          ],
        },
      },
    },
  ];
  // 타설량 시계열(FR-039 · ADR-013) — 24버킷 리터럴(Math.random 0). idx0 = 23시간 전(KST 11시) … idx23 = 현재 버킷(KST 10시).
  // 야간 0 → 오전 상승 → 점심(12시) 0 → 오후 → 0. 상태별 패턴: 고장은 현재 버킷 0, 통신 두절은 오늘 0, 정비는 전부 0.
  const POUR: Record<Device['state'], { m3: number[]; cumulativeM3: number }> = {
    normal: {
      m3: [26, 0, 30, 32, 28, 22, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 24, 31, 14],
      cumulativeM3: 4820,
    },
    caution: {
      m3: [30, 0, 34, 36, 33, 29, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 28, 35, 17],
      cumulativeM3: 6140,
    },
    fault: { m3: [24, 0, 28, 30, 26, 20, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 18, 9, 0], cumulativeM3: 3910 },
    offline: { m3: [22, 0, 26, 27, 25, 19, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cumulativeM3: 2760 },
    maintenance: { m3: new Array<number>(24).fill(0), cumulativeM3: 1120 },
  };
  for (const d of devices) d.pour = pourSeries(now, POUR[d.state].m3, { cumulativeM3: POUR[d.state].cumulativeM3 });
  return {
    users,
    sites,
    owners,
    devices,
    cameras,
    alerts,
    cases,
    requests,
    attendance,
    inspections,
    consents,
    protocols,
    samples,
    rules,
    docs,
    leases,
    parts,
    partEvents,
    stock,
    events,
  };
}
