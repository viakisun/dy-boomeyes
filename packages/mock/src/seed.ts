// 시드 — 데모 픽스처(INTENT §7 · docs/DEMO.md): CPB-003 E-021 전압 이상 · CPB-004 통신 두절 · C-105 · D-27 임대 · 교육 이수증
import ssot from '@boomeyes/domain/generated/ssot.json';
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
  Request,
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
  docs: Doc[];
  leases: Lease[];
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
    }),
    dev(4, 'SITE-002', 'offline', 36.4241, 127.392, { lte: 'lost', at: t(2 * H + 5 * MIN) }),
    dev(5, 'SITE-002', 'maintenance', 36.4236, 127.3912, { boomAngle: 0 }),
  ];
  const cameras: Camera[] = devices.flatMap((d) => [
    {
      id: `CAM-${d.unitNo}-1`,
      deviceId: d.id,
      kind: 'general',
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
    },
  ];
  const docs: Doc[] = [
    {
      id: 'DOC-001',
      kind: 'training',
      subject: '박기사 교육 이수증',
      subjectId: 'driver03',
      state: 'expiring',
      expiresAt: t(-27 * DAY),
      submittedAt: null,
    },
    {
      id: 'DOC-002',
      kind: 'license',
      subject: '박기사 면허',
      subjectId: 'driver03',
      state: 'valid',
      expiresAt: t(-400 * DAY),
      submittedAt: t(200 * DAY),
    },
    {
      id: 'DOC-003',
      kind: 'cert',
      subject: 'CPB-003 제작증',
      subjectId: 'CPB-003',
      state: 'valid',
      expiresAt: null,
      submittedAt: t(300 * DAY),
    },
    {
      id: 'DOC-004',
      kind: 'ndt',
      subject: 'CPB-002 비파괴 검사 성적서',
      subjectId: 'CPB-002',
      state: 'review',
      expiresAt: t(-100 * DAY),
      submittedAt: t(DAY),
    },
  ];
  const leases: Lease[] = [
    { id: 'LS-001', deviceId: 'CPB-001', siteId: 'SITE-001', ownerId: 'OWN-001', from: t(60 * DAY), to: t(-27 * DAY) },
    { id: 'LS-002', deviceId: 'CPB-003', siteId: 'SITE-001', ownerId: 'OWN-001', from: t(30 * DAY), to: t(-150 * DAY) },
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
    docs,
    leases,
  };
}
