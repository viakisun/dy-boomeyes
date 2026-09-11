import {
  OWNER_CLOCK,
  OWNER_UPLOAD_LIMIT,
  type OwnerApi,
  type OwnerDataset,
  type OwnerDevice,
  type OwnerDocument,
  type OwnerSnapshot,
  type Session,
} from '@boomeyes/domain';
import { LOOP_MP4, LOOP_SEC, STILL } from '@boomeyes/video/assets';
import { OWNER_ASSETS } from './assets/owner';

type Options = { dataset?: OwnerDataset; error?: boolean; latencyMs?: number; offline?: () => boolean };
type BoundSession = Pick<Session, 'role' | 'ownerId'> | null;
const clone = <T>(value: T): T => structuredClone(value);
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** ENT 장비·계약·서류의 시연 읽기 모델. 기존 seed와 섞지 않아 제조사 시연을 보존한다. */
export function seedOwner(dataset: OwnerDataset = 'owner'): OwnerSnapshot {
  const sites = [
    '마포 주상복합 신축',
    '송도 업무시설 신축',
    '평택 물류센터',
    '대전 공동주택',
    '용인 장비 보관소',
    '다른 회사 전용 현장',
  ];
  const devices: OwnerDevice[] = [1, 2, 3, 4, 5, 101].map((unit, i) => ({
    id: `CPB-${String(unit).padStart(3, '0')}`,
    ownerId: unit === 101 ? 'OWN-002' : 'OWN-001',
    unit,
    model: 'DY CPB 32',
    site: sites[i]!,
    address: ['서울 마포구', '인천 연수구', '경기 평택시', '대전 유성구', '경기 용인시', '부산 강서구'][i]!,
    location: {
      lat: [37.55, 37.38, 36.99, 36.35, 37.24, 35.18][i]!,
      lng: [126.94, 126.64, 127.09, 127.35, 127.2, 128.97][i]!,
    },
    deployment: unit === 5 ? 'stored' : 'deployed',
    connection: unit === 5 ? 'detached' : unit === 4 ? 'stale' : 'current',
    receivedAt: unit === 5 ? null : unit === 4 ? '2026-07-03T08:22:00+09:00' : '2026-07-03T10:41:00+09:00',
    voltage: unit === 5 ? null : unit === 2 || unit === 101 ? 342 : 380,
    fault: unit === 2 || unit === 101 ? '공급 전압 저하' : null,
    inspection: unit === 3 ? '수송관 점검 시기 도래' : null,
    contract:
      unit === 5
        ? null
        : {
            company: unit === 101 ? '두번째건설' : ['한빛건설', '해오름건설', '새길건설', '한빛건설'][i]!,
            from: '2026-06-01',
            to: i === 0 ? '2026-09-30' : '2026-10-31',
            installed: '2026-06-03',
          },
    contact:
      unit === 5
        ? null
        : {
            name: unit === 101 ? '타사 담당자' : ['김현장', '이현장', '박현장', '최현장'][i]!,
            job: '현장 담당자',
            phone: '010-0000-0000',
          },
    parts: [
      {
        name: '수송관',
        measured: unit === 3 ? '누적 타설량 9,800 m³' : '누적 타설량 4,200 m³',
        reference: '점검 시연 기준 9,500 m³',
        due: unit === 3,
      },
      { name: '유압 필터', measured: '가동 180시간', reference: null, due: false },
    ],
  }));
  if (dataset === 'boundaries') {
    Object.assign(devices[0]!, {
      deployment: 'unknown',
      connection: 'unintegrated',
      receivedAt: null,
      voltage: null,
      location: null,
      contract: null,
      contact: null,
    });
    devices[1]!.inspection = '수송관 점검 시기 도래';
    devices[1]!.parts[0] = {
      name: '수송관',
      measured: '누적 타설량 9,800 m³',
      reference: '점검 시연 기준 9,500 m³',
      due: true,
    };
  }
  if (dataset === 'large') {
    for (let unit = 6; unit <= 120; unit++) {
      if (unit === 101) continue;
      devices.push({
        ...clone(devices[0]!),
        id: `CPB-${String(unit).padStart(3, '0')}`,
        unit,
        site: `시연 현장 ${unit}`,
        ownerId: 'OWN-001',
      });
    }
    devices.push({ ...clone(devices[0]!), id: 'CPB-121', unit: 121, site: '성능 시연 현장', ownerId: 'OWN-001' });
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
    ];
  });
  return {
    dataset,
    at: OWNER_CLOCK,
    company: '한빛중기',
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
              detail: '마지막 측정 342 V · 시연 기준 380 V. 현장 전원 상태를 담당자에게 확인하세요.',
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
              detail: '마지막 수신 이후 새 자료가 없습니다. 통신과 현장 상태를 확인하세요.',
              at: '2026-07-03T08:22:00+09:00',
              read: false,
            },
          ]
        : []),
    ]),
    cameras: devices.flatMap((d) =>
      (['pour', 'install'] as const).map((purpose) => ({
        id: `${d.id}-${purpose}`,
        deviceId: d.id,
        purpose,
        label: purpose === 'pour' ? '타설 위치' : '마스트 설치',
        available: d.connection === 'current',
        url: LOOP_MP4.front,
        poster: STILL.front,
        durationSec: LOOP_SEC,
        operatingDay: '2026-07-03',
        recordedAt: '2026-07-03T09:30:00+09:00',
      })),
    ),
  };
}

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
  };
}

let cached: { key: string; api: OwnerApi; source: OwnerSnapshot } | null = null;
export function resetOwner() {
  for (const doc of cached?.source.documents ?? [])
    if (doc.sessionOnly && doc.url.startsWith('blob:')) URL.revokeObjectURL(doc.url);
  for (const doc of cached?.source.documents ?? [])
    if (doc.sessionOnly && doc.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(doc.previewUrl);
  cached = null;
}
/** 화면 ID가 cache key에 들어가지 않는다. 탐색·쿼리 전환으로 읽음/첨부가 사라지지 않는다. */
export function bootOwner(session: BoundSession, options: Options = {}): OwnerApi {
  const key = `${session?.role}|${session?.ownerId}|${options.dataset ?? 'owner'}|${!!options.error}`;
  if (cached?.key === key) return cached.api;
  resetOwner();
  const source = seedOwner(options.dataset);
  const api = createOwnerApi(session, options, source);
  cached = { key, source, api };
  return api;
}
