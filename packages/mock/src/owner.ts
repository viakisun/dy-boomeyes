import {
  OWNER_CLOCK,
  OWNER_UPLOAD_LIMIT,
  type OwnerAiEvent,
  type OwnerApi,
  type OwnerCamera,
  type OwnerDataset,
  type OwnerDevice,
  type OwnerDocument,
  type OwnerSnapshot,
  type Session,
} from '@boomeyes/domain';
import { LOOP_MP4, LOOP_SEC, STILL, STILL_BBOX } from '@boomeyes/video/assets';
import { OWNER_ASSETS } from './assets/owner';
import { OWNER_SITES, ownerFleet } from './owner-fleet';
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
    ]),
    cameras: devices.flatMap((d) => ownerCameras(d)),
    aiEvents: devices.flatMap((d) => ownerAiEvents(d)),
  };
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
/** AI 경고는 몇 호기에만 둔다 — 모든 호기가 경고를 내면 시연에서 무엇을 봐야 할지 알 수 없다 */
const AI_EVENT_UNITS = new Set([1, 62]);
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
      const ids = new Set(devices.map((d) => d.id));
      return clone({
        ...source,
        company: owner === 'OWN-002' ? '새봄중기' : '한빛중기',
        sites: source.sites.filter((s) => s.ownerId === owner),
        devices,
        documents: source.documents.filter((d) => ids.has(d.deviceId)),
        alerts: source.alerts.filter((a) => ids.has(a.deviceId)),
        cameras: source.cameras.filter((c) => ids.has(c.deviceId)),
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
