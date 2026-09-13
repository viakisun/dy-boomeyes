import {
  OWNER_CLOCK,
  OWNER_UPLOAD_LIMIT,
  ownerAssignNext,
  ownerCandidates,
  transition,
  type OwnerAiEvent,
  type OwnerApi,
  type OwnerCamera,
  type OwnerDataset,
  type OwnerDevice,
  type OwnerDocument,
  type OwnerDriver,
  type OwnerDriverDoc,
  OWNER_DRIVER_DOC_KINDS,
  type OwnerRequest,
  type OwnerSnapshot,
  type Session,
} from '@boomeyes/domain';
import { LOOP_MP4, LOOP_SEC, STILL, STILL_BBOX, STILL_ZONE } from '@boomeyes/video/assets';
import { OWNER_ASSETS } from './assets/owner';
import { DRIVER_ROSTER, OWNER_SITES, ownerFleet } from './owner-fleet';
import { createOwnerSim, type OwnerSim } from './owner-sim';

type Options = {
  dataset?: OwnerDataset;
  error?: boolean;
  latencyMs?: number;
  offline?: () => boolean;
  /** 활동 시뮬레이터(틱마다 원천을 바꾸고 subscribe 핸들러에 알린다) */
  sim?: boolean;
};
type BoundSession = Pick<Session, 'role' | 'ownerId'> | null;
const clone = <T>(value: T): T => structuredClone(value);
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** ENT 장비·계약·서류의 시연 읽기 모델. 기존 seed와 섞지 않아 제조사 시연을 보존한다. 기본 세트가 120대·현장 13곳(large는 별칭). */
export function seedOwner(dataset: OwnerDataset = 'owner'): OwnerSnapshot {
  const sites = OWNER_SITES.map((s) => clone(s));
  const devices = ownerFleet();
  if (dataset === 'boundaries') {
    Object.assign(devices[0]!, {
      deployment: 'unknown',
      connection: 'unintegrated',
      receivedAt: null,
      voltage: null,
      harness: null,
      location: null,
      contract: null,
      contact: null,
    });
    devices[1]!.inspection = '수송관 점검 시기 도래';
    devices[1]!.parts[0] = {
      name: '수송관',
      kind: 'wear',
      value: 78,
      limit: 80,
      measured: '누적 타설량 9,800 m³',
      reference: '점검 시연 기준 9,500 m³',
      due: true,
    };
  }
  const visible = dataset === 'empty' ? devices.filter((d) => d.ownerId === 'OWN-002') : devices;
  const documents: OwnerDocument[] = devices.flatMap((d) => {
    const assets = OWNER_ASSETS[d.id];
    if (!assets) return [];
    return [
      {
        id: `${d.id}-CERT`,
        deviceId: d.id,
        title: `${d.unit}호기 제작증`,
        filename: `${d.id}-제작증.pdf`,
        kind: '제작증' as const,
        type: 'application/pdf' as const,
        url: assets.certificate.pdf,
        previewUrl: assets.certificate.preview,
        issuedAt: '2026-07-02',
        expiresAt: null,
        sessionOnly: false,
      },
      {
        id: `${d.id}-INSP`,
        deviceId: d.id,
        title: `${d.unit}호기 비파괴 검사 성적서`,
        filename: `${d.id}-비파괴검사.png`,
        kind: '비파괴 검사 성적서' as const,
        type: 'image/png' as const,
        url: assets.inspection,
        issuedAt: '2026-07-02',
        expiresAt: '2027-06-20',
        sessionOnly: false,
      },
      // 나머지 5종은 시연 세트에 실 파일이 없다 — 목록·만료는 보이되 원문은 「미등록」으로 남긴다.
      // 없는 파일을 지어내지 않는다(원본 없는 원문을 고객에게 보이지 않는다).
      ...PAPER_ONLY.map((paper) => ({
        id: `${d.id}-${paper.slug}`,
        deviceId: d.id,
        title: `${d.unit}호기 ${paper.kind}`,
        filename: `${d.id}-${paper.slug}.pdf`,
        kind: paper.kind,
        type: 'application/pdf' as const,
        url: null,
        issuedAt: paper.issuedAt,
        expiresAt: paper.expiresAt(d.unit),
        sessionOnly: false,
      })),
    ];
  });
  return {
    dataset,
    at: OWNER_CLOCK,
    company: '한빛중기',
    sites: dataset === 'empty' ? sites.filter((s) => s.ownerId === 'OWN-002') : sites,
    devices: visible,
    documents,
    alerts: devices.flatMap((d) => [
      ...(d.fault
        ? [
            {
              id: `${d.id}-FAULT`,
              deviceId: d.id,
              kind: 'fault' as const,
              title: d.fault,
              detail:
                d.errorCode === 'E-021'
                  ? `마지막 측정 ${d.voltage} V · 시연 기준 380 V · 고장코드 ${d.errorCode}. 현장 전원 상태를 담당자에게 확인하세요.`
                  : `유압 압력이 시연 기준을 벗어났습니다 · 고장코드 ${d.errorCode}. 현장 담당자에게 확인하세요.`,
              at: '2026-07-03T10:38:00+09:00',
              read: false,
            },
          ]
        : []),
      ...(d.inspection
        ? [
            {
              id: `${d.id}-INSP-DUE`,
              deviceId: d.id,
              kind: 'inspection' as const,
              title: d.inspection,
              detail: '누적 타설량 9,800 m³ · 점검 시연 기준 9,500 m³. 실제 교체 판정은 현장 점검이 필요합니다.',
              at: '2026-07-03T10:20:00+09:00',
              read: false,
            },
          ]
        : []),
      ...(d.connection === 'stale'
        ? [
            {
              id: `${d.id}-STALE`,
              deviceId: d.id,
              kind: 'connection' as const,
              title: '수신 지연',
              detail:
                d.harness === 'disconnected'
                  ? '마지막 수신 이후 새 자료가 없고 단선이 감지됐습니다. 통신선과 현장 상태를 확인하세요.'
                  : '마지막 수신 이후 새 자료가 없습니다. 통신과 현장 상태를 확인하세요.',
              at: '2026-07-03T08:22:00+09:00',
              read: false,
            },
          ]
        : []),
      // 시안의 종 패널은 고장·지연·점검 말고도 AI 경고·소모품 한계·계약 종료 임박·자격 만료를 담는다.
      // 모두 이미 있는 축에서 나온다 — 알림이 따로 사실을 만들지 않는다.
      ...ownerAiEvents(d).map((event) => ({
        id: `${event.id}-ALERT`,
        deviceId: d.id,
        kind: 'ai' as const,
        title: event.title,
        detail: `${event.detail}${event.driver ? ` · 그 시각 운전자 ${event.driver.name}` : ''}`,
        at: event.at,
        read: false,
      })),
      ...d.parts
        .filter((part) => part.due)
        .slice(0, 1)
        .map((part) => ({
          id: `${d.id}-PART-${part.name}`,
          deviceId: d.id,
          kind: 'part' as const,
          title: `${part.name} 교체 한계`,
          detail:
            part.kind === 'wear'
              ? `마모 ${part.value}% · 시연 기준 ${part.limit}%. 실제 교체 판정은 현장 점검이 필요합니다.`
              : `교체까지 ${part.value}일 남았습니다. 실제 교체 판정은 현장 점검이 필요합니다.`,
          at: '2026-07-03T09:40:00+09:00',
          read: false,
        })),
      // 계약 종료는 현장 하나의 사실이다 — 그 현장 호기마다 한 건씩 울리면 패널이 같은 말로 찬다
      ...(d.contract && leaseDays(d.contract.to) <= 30 && firstOfSite(devices, d)
        ? [
            {
              id: `${d.siteId}-LEASE`,
              deviceId: d.id,
              kind: 'lease' as const,
              title: '계약 종료 임박',
              detail: `${d.site} 계약이 ${d.contract.to}에 끝납니다(D-${leaseDays(d.contract.to)}) · 투입 ${devices.filter((x) => x.siteId === d.siteId && x.deployment === 'deployed').length}대. 연장이나 회수를 현장과 정하세요.`,
              at: '2026-07-03T09:05:00+09:00',
              read: false,
            },
          ]
        : []),
      // 자격 만료도 사람 하나의 사실이다 — 그 사람이 오르는 호기마다 울리지 않는다
      ...(d.driver && licenseSoon(d.driver.id) && firstOfDriver(devices, d)
        ? [
            {
              id: `${d.driver.id}-LICENSE`,
              deviceId: d.id,
              kind: 'license' as const,
              title: `${d.driver.name} 자격 만료 임박`,
              detail: `건설기계조종사 면허가 ${licenseSoon(d.driver.id)}에 끝납니다. 갱신 전까지 배정을 조정하세요.`,
              at: '2026-07-03T08:50:00+09:00',
              read: false,
            },
          ]
        : []),
    ]),
    cameras: devices.flatMap((d) => ownerCameras(d)),
    aiEvents: devices.flatMap((d) => ownerAiEvents(d)),
    requests: dataset === 'empty' ? [] : OWNER_REQUESTS,
    drivers: dataset === 'empty' ? [] : ownerDrivers(devices),
    driverDocs: dataset === 'empty' ? [] : ownerDriverDocs(ownerDrivers(devices)),
  };
}
const DAY = 86_400_000;
/** 이 호기가 그 현장의 첫 호기인가 — 현장 단위 사실을 한 번만 알린다 */
const firstOfSite = (devices: OwnerDevice[], d: OwnerDevice) => devices.find((x) => x.siteId === d.siteId)?.id === d.id;
/** 이 호기가 그 운전자의 첫 호기인가 — 사람 단위 사실을 한 번만 알린다 */
const firstOfDriver = (devices: OwnerDevice[], d: OwnerDevice) =>
  devices.find((x) => x.driver?.id === d.driver?.id)?.id === d.id;
/** 계약 종료까지 남은 일수 — 알림은 30일 이내에만 뜬다 */
const leaseDays = (to: string) => Math.round((Date.parse(to) - Date.parse(OWNER_CLOCK)) / DAY);
/** 30일 안에 끝나는 면허의 만료일 — 아니면 빈 문자열 */
function licenseSoon(driverId: string) {
  const person = DRIVER_ROSTER.find((x) => x.id === driverId);
  if (!person) return '';
  return leaseDays(person.licenseTo) <= 30 ? person.licenseTo : '';
}
/** 투입 요청 5건 — 상태 5단계가 한 번씩 나오게 둔다(시안 «확정 2026-09-12» · FR-026).
 *  소유주의 판단 하나(「이 기간에 낼 수 있는 장비가 있나」)를 보이려면 배정 중 건이 필요하다. */
const OWNER_REQUESTS: OwnerRequest[] = [
  {
    id: 'REQ-001',
    ownerId: 'OWN-001',
    siteName: '성수 2공구 신축',
    region: '서울 성동구',
    builder: '대성건설',
    manager: { name: '윤안전', phone: '010-0000-0101' },
    from: '2026-08-01',
    to: '2026-11-30',
    count: 3,
    spec: 'CPB 32m 이상',
    state: 'new',
    assigned: [],
    receivedAt: '2026-07-03T09:10:00+09:00',
  },
  {
    id: 'REQ-002',
    ownerId: 'OWN-001',
    siteName: '동탄 물류센터',
    region: '경기 화성시',
    builder: '한빛건설',
    manager: { name: '김현장', phone: '010-0000-0000' },
    from: '2026-07-20',
    to: '2026-10-20',
    count: 2,
    spec: 'CPB 32m',
    state: 'assign',
    assigned: ['CPB-005'],
    receivedAt: '2026-07-02T16:40:00+09:00',
  },
  {
    id: 'REQ-003',
    ownerId: 'OWN-001',
    siteName: '광명 지식산업센터',
    region: '경기 광명시',
    builder: '해오름건설',
    manager: { name: '이현장', phone: '010-0000-0002' },
    from: '2026-07-10',
    to: '2026-12-31',
    count: 1,
    spec: 'CPB 32m',
    state: 'ship',
    assigned: ['CPB-081'],
    receivedAt: '2026-06-28T11:05:00+09:00',
  },
  {
    id: 'REQ-004',
    ownerId: 'OWN-001',
    siteName: '평택 물류센터',
    region: '경기 평택시',
    builder: '세움건설',
    manager: { name: '박현장', phone: '010-0000-0003' },
    from: '2026-06-01',
    to: '2026-10-31',
    count: 2,
    spec: 'CPB 32m',
    state: 'run',
    assigned: ['CPB-003', 'CPB-004'],
    receivedAt: '2026-05-20T10:00:00+09:00',
  },
  // 다른 소유주의 요청 — 교차 조회 시험이 「데이터가 없어 통과」하지 않게 한다
  {
    id: 'REQ-101',
    ownerId: 'OWN-002',
    siteName: '김포 창고 신축',
    region: '경기 김포시',
    builder: '새봄건설',
    manager: { name: '한안전', phone: '010-0000-0201' },
    from: '2026-08-10',
    to: '2026-12-10',
    count: 1,
    spec: 'CPB 32m',
    state: 'assign',
    assigned: [],
    receivedAt: '2026-07-01T09:00:00+09:00',
  },
  {
    id: 'REQ-005',
    ownerId: 'OWN-001',
    siteName: '청주 공장 증축',
    region: '충북 청주시',
    builder: '대성건설',
    manager: { name: '최현장', phone: '010-0000-0004' },
    from: '2026-03-01',
    to: '2026-06-15',
    count: 1,
    spec: 'CPB 32m',
    state: 'done',
    assigned: ['CPB-082'],
    receivedAt: '2026-02-14T13:30:00+09:00',
  },
  {
    // 낼 수 있는 호기가 없는 요청 — 보유 기종이 32m뿐이라 40m 사양을 아무도 못 맞춘다.
    // 시안의 «기간에 낼 수 있는 호기 없음»을 화면이 실제로 보이려면 이런 요청이 하나 있어야 한다.
    id: 'REQ-006',
    ownerId: 'OWN-001',
    siteName: '김포 데이터센터',
    region: '경기 김포시',
    builder: '새길건설',
    manager: { name: '정현장', phone: '010-0000-0005' },
    from: '2026-09-01',
    to: '2027-03-31',
    count: 2,
    spec: 'CPB 40m 이상',
    state: 'new',
    assigned: [],
    receivedAt: '2026-07-03T08:05:00+09:00',
  },
];
/** 운전자 서류 4종 — 사람마다 한 벌. 면허 만료는 명단의 licenseTo와 같은 값이어야 한다(두 곳이 갈리면 명단과 서류가 다른 날을 말한다).
 *  한 명은 건강검진이 빠져 있고(미비) 한 명은 교육 이수증이 곧 만료된다 — 화면의 «만료 임박»·«미비»가 실제 자료에서 나온다. */
function ownerDriverDocs(drivers: OwnerDriver[]): OwnerDriverDoc[] {
  const out: OwnerDriverDoc[] = [];
  for (const person of drivers) {
    for (const kind of OWNER_DRIVER_DOC_KINDS) {
      if (person.id === 'DRV-003' && kind === '건강검진 결과') continue; // 미비
      const expires =
        kind === '건설기계조종사 면허'
          ? person.licenseTo
          : kind === '안전보건교육 이수증'
            ? person.id === 'DRV-002'
              ? '2026-07-18'
              : '2027-03-31'
            : kind === '건강검진 결과'
              ? '2027-02-28'
              : null;
      out.push({
        id: `${person.id}-${OWNER_DRIVER_DOC_KINDS.indexOf(kind) + 1}`,
        driverId: person.id,
        kind,
        issuedAt: expires ? `${Number(expires.slice(0, 4)) - 1}${expires.slice(4)}` : '2026-01-15',
        expiresAt: expires,
      });
    }
  }
  return out;
}
/** 운전자 6명 — 오늘 배정은 장비 축(device.driver)이 원천이고 여기서 되읽는다.
 *  두 곳이 따로 정하면 호기 화면과 명단이 다른 사람을 보인다. */
function ownerDrivers(devices: OwnerDevice[]): OwnerDriver[] {
  return [
    ...DRIVER_ROSTER.map((person) => ({
      ...person,
      ownerId: 'OWN-001',
      assignedTo: devices.find((d) => d.driver?.id === person.id)?.id ?? null,
    })),
    // 다른 소유주의 운전자 — 교차 조회 시험이 「데이터가 없어 통과」하지 않게 한다
    {
      id: 'DRV-101',
      ownerId: 'OWN-002',
      name: '한운전',
      license: '건설기계조종사 1종',
      licenseTo: '2027-03-03',
      phone: '010-0000-0201',
      assignedTo: devices.find((d) => d.ownerId === 'OWN-002' && d.driver)?.id ?? null,
    },
  ];
}
/** 호기 카메라 6 — 바디캠 A·B·C · CCTV 1·2 · AI CCTV(시안 «확정 2026-09-12» · FR-042 · DISC-004).
 *  시연 영상 소스는 front·boom 둘뿐이라 여섯 타일이 같은 클립을 돌린다 — sample로 그 사실을 남기고
 *  화면이 「실시간 예시 · 시연 클립」으로 밝힌다(실 스트림인 척하지 않는다). */
const CAMERA_SPEC = [
  { slot: 'body-a', kind: 'body', label: '바디캠 A', purpose: 'install' },
  { slot: 'body-b', kind: 'body', label: '바디캠 B', purpose: 'install' },
  { slot: 'body-c', kind: 'body', label: '바디캠 C', purpose: 'install' },
  { slot: 'cctv-1', kind: 'cctv', label: 'CCTV 1', purpose: 'pour' },
  { slot: 'cctv-2', kind: 'cctv', label: 'CCTV 2', purpose: 'pour' },
  { slot: 'ai', kind: 'ai', label: 'AI CCTV', purpose: 'pour' },
] as const;
function ownerCameras(d: OwnerDevice): OwnerCamera[] {
  const person = AI_EVENT_UNITS.has(d.unit);
  return CAMERA_SPEC.map((spec) => ({
    id: `${d.id}-${spec.slot}`,
    deviceId: d.id,
    purpose: spec.purpose,
    kind: spec.kind,
    label: spec.label,
    available: d.connection === 'current',
    url: spec.kind === 'ai' ? LOOP_MP4.boom : LOOP_MP4.front,
    poster: spec.kind === 'ai' ? (person ? STILL['boom-person'] : STILL.boom) : STILL.front,
    sample: true,
    durationSec: LOOP_SEC,
    operatingDay: '2026-07-03',
    recordedAt: '2026-07-03T09:30:00+09:00',
  }));
}
/** AI 경고는 몇 호기에만 둔다 — 모든 호기가 경고를 내면 시연에서 무엇을 봐야 할지 알 수 없다.
 *  101(다른 소유주)을 포함해 교차 조회 시험이 공허해지지 않게 한다. */
const AI_EVENT_UNITS = new Set([1, 62, 101]);
function ownerAiEvents(d: OwnerDevice): OwnerAiEvent[] {
  if (!AI_EVENT_UNITS.has(d.unit) || d.connection !== 'current') return [];
  return [
    {
      id: `${d.id}-AI-1`,
      deviceId: d.id,
      cameraId: `${d.id}-ai`,
      at: '2026-07-03T10:18:00+09:00',
      kind: 'person',
      title: '붐 하부 인원 감지',
      detail: '붐 끝 반경 안에서 작업자가 확인됐습니다. 경광등·알람이 울렸고 제어는 하지 않습니다.',
      driver: d.driver ? { id: d.driver.id, name: d.driver.name } : null,
      bbox: STILL_BBOX['boom-person'],
      zone: STILL_ZONE['boom-person'],
    },
  ];
}

/** 차량 서류 중 시연 세트에 실 파일이 없는 5종. 만료일은 호기 번호로만 흔들어 결정적이다 —
 *  일부 호기는 만료가 임박해 보유 장비의 주의 칩과 종 알림의 근거가 된다(FR-016). */
const PAPER_ONLY = [
  {
    slug: 'SAFETY',
    kind: '안전검사 합격증' as const,
    issuedAt: '2026-05-14',
    expiresAt: (u: number) => iso(2027, 5, 14 + (u % 9)),
  },
  {
    slug: 'INSURANCE',
    kind: '보험 증서' as const,
    issuedAt: '2026-01-08',
    expiresAt: (u: number) => iso(2027, 1, 8 + (u % 5)),
  },
  { slug: 'INSTALL', kind: '설치 확인서' as const, issuedAt: '2026-06-03', expiresAt: () => null },
  {
    slug: 'CHECKUP',
    kind: '정기점검 기록' as const,
    issuedAt: '2026-08-21',
    expiresAt: (u: number) => iso(2026, 8, 21 + (u % 40)),
  },
  { slug: 'PIPE', kind: '수송관 교체 이력' as const, issuedAt: '2026-07-11', expiresAt: () => null },
];
const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);

export function createOwnerApi(
  session: BoundSession,
  options: Options = {},
  source = seedOwner(options.dataset),
): OwnerApi {
  // 복사한 세션을 고정: 호출 뒤 참조 객체의 ownerId 변경으로 권한이 변하지 않는다.
  const owner = session?.role === 'owner' && /^OWN-00[12]$/.test(session.ownerId ?? '') ? session.ownerId : null;
  let shouldFail = !!options.error;
  const guard = () => {
    if (!owner) throw new Error('소유주 계정으로 다시 시작해 주세요.');
  };
  const device = (id: string) => {
    guard();
    const d = source.devices.find((d) => d.id === id && d.ownerId === owner);
    if (!d) throw new Error('이 장비를 조회할 수 없습니다.');
    return d;
  };
  const related = <T extends { id: string; deviceId: string }>(items: T[], id: string) => {
    guard();
    const item = items.find((x) => x.id === id);
    if (!item) throw new Error('요청한 자료를 조회할 수 없습니다.');
    device(item.deviceId);
    return item;
  };
  // 요청은 장비가 아니라 소유주에 매인다 — related(deviceId 경유)로는 경계를 지킬 수 없다
  const ownedRequest = (id: string) => {
    guard();
    const found = source.requests.find((r) => r.id === id && r.ownerId === owner);
    if (!found) throw new Error('요청한 자료를 조회할 수 없습니다.');
    return found;
  };
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- 비반응 핸들러 집합
  const handlers = new Set<() => void>();
  const wait = async () => {
    guard();
    await pause(options.latencyMs ?? 100);
    if (shouldFail) {
      shouldFail = false;
      throw new Error('자료를 불러오지 못했습니다. 다시 시도해 주세요.');
    }
  };
  return {
    async snapshot() {
      await wait();
      const devices = source.devices.filter((d) => d.ownerId === owner);
      const driverIds = new Set(source.drivers.filter((v) => v.ownerId === owner).map((v) => v.id));
      const ids = new Set(devices.map((d) => d.id));
      return clone({
        ...source,
        company: owner === 'OWN-002' ? '새봄중기' : '한빛중기',
        sites: source.sites.filter((s) => s.ownerId === owner),
        devices,
        documents: source.documents.filter((d) => ids.has(d.deviceId)),
        alerts: source.alerts.filter((a) => ids.has(a.deviceId)),
        cameras: source.cameras.filter((c) => ids.has(c.deviceId)),
        // 새 축도 같은 경계를 지난다 — 빠뜨리면 남의 계약·연락처·명단이 그대로 보인다(FR-024 · AC-12)
        aiEvents: source.aiEvents.filter((e) => ids.has(e.deviceId)),
        requests: source.requests.filter((r) => r.ownerId === owner),
        drivers: source.drivers.filter((v) => v.ownerId === owner),
        driverDocs: source.driverDocs.filter((d) => driverIds.has(d.driverId)),
      });
    },
    async device(id) {
      await wait();
      return clone(device(id));
    },
    async document(id) {
      await wait();
      return clone(related(source.documents, id));
    },
    async camera(id) {
      await wait();
      return clone(related(source.cameras, id));
    },
    async alert(id) {
      await wait();
      return clone(related(source.alerts, id));
    },
    async markRead(id) {
      await wait();
      related(source.alerts, id).read = true;
    },
    async attach(deviceId, file) {
      await wait();
      device(deviceId);
      if (options.offline?.()) throw new Error('오프라인에서는 첨부할 수 없습니다. 연결 후 다시 시도해 주세요.');
      if (
        !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) ||
        !file.size ||
        file.size > OWNER_UPLOAD_LIMIT ||
        !file.url.startsWith('blob:')
      )
        throw new Error('PDF·PNG·JPEG 파일을 10 MB 이내로 선택해 주세요.');
      const doc: OwnerDocument = {
        id: `${deviceId}-SESSION-${source.documents.length + 1}`,
        deviceId,
        title: file.name,
        filename: file.name,
        kind: '시연용 첨부',
        type: file.type,
        url: file.url,
        previewUrl: file.previewUrl,
        issuedAt: OWNER_CLOCK.slice(0, 10),
        expiresAt: null,
        sessionOnly: true,
      };
      source.documents.push(doc);
      return clone(doc);
    },
    async assign(requestId, deviceIds) {
      await wait();
      const request = ownedRequest(requestId);
      if (options.offline?.()) throw new Error('오프라인에서는 배정할 수 없습니다. 연결 후 다시 시도해 주세요.');
      const mine = source.devices.filter((d) => d.ownerId === owner);
      const pool = new Set(ownerCandidates(mine, request).map((c) => c.device.id));
      const picked = deviceIds.filter((id) => pool.has(id));
      if (picked.length !== deviceIds.length) throw new Error('후보가 아닌 호기는 배정할 수 없습니다.');
      if (picked.length > request.count) throw new Error(`필요 대수는 ${request.count}대입니다.`);
      request.assigned = picked;
      // new에서 바로 확정되면 「후보 확인 시작 → 배정 확정」 두 전이를 차례로 밟는다 —
      // ssot machines.assignment에 new → ship은 없다(transition이 어긋난 경로를 막는다)
      const next = ownerAssignNext(request, picked);
      for (const step of next === 'ship' && request.state === 'new' ? (['assign', 'ship'] as const) : [next])
        request.state = transition('assignment', request.state, step);
      // 확정되면 계약 기간이 호기에 남는다 — 보유 장비·운영 현황이 같은 자료를 읽는다(시안)
      if (request.state === 'ship')
        for (const id of picked)
          device(id).contract = {
            company: request.builder,
            from: request.from,
            to: request.to,
            installed: request.from,
          };
      return clone(request);
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    // 내부: 시뮬레이터가 틱마다 부른다
    ...({ notify: () => handlers.forEach((h) => h()) } as object),
  };
}

let cached: { key: string; api: OwnerApi; source: OwnerSnapshot; sim?: OwnerSim } | null = null;
export function resetOwner() {
  cached?.sim?.stop();
  for (const doc of cached?.source.documents ?? [])
    if (doc.sessionOnly && doc.url?.startsWith('blob:')) URL.revokeObjectURL(doc.url);
  for (const doc of cached?.source.documents ?? [])
    if (doc.sessionOnly && doc.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(doc.previewUrl);
  cached = null;
}
/** 화면 ID가 cache key에 들어가지 않는다. 탐색·쿼리 전환으로 읽음/첨부가 사라지지 않는다. */
export function bootOwner(session: BoundSession, options: Options = {}): OwnerApi {
  const key = `${session?.role}|${session?.ownerId}|${options.dataset ?? 'owner'}|${!!options.error}|${!!options.sim}`;
  if (cached?.key === key) return cached.api;
  resetOwner();
  const source = seedOwner(options.dataset);
  const api = createOwnerApi(session, options, source);
  const sim = options.sim
    ? createOwnerSim(source, () => (api as unknown as { notify: () => void }).notify())
    : undefined;
  sim?.start();
  cached = { key, source, api, sim };
  return api;
}
