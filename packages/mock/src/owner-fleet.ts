// 소유주 시연 함대 — 현장 14곳(한빛중기 13 + 타사 1) · 호기 121대(1~120, 101 제외 + 121). 고객 V5 관제기능 시트의 규모(120대, 경기·대전·강원·부산)를 따른다.
// 좌표는 현장 위치 + 결정적 격자(Math.random 금지) — 캡처·e2e가 같은 그림을 본다.
import type { OwnerDevice, OwnerSite } from '@boomeyes/domain';

const PHONE = '010-0000-0000';
const contact = (name: string) => ({ name, job: '현장 담당자', phone: PHONE });
const period = (from: string, to: string) => ({ from, to });

export const OWNER_SITES: readonly OwnerSite[] = [
  {
    id: 'SITE-MAPO',
    ownerId: 'OWN-001',
    name: '마포 주상복합 신축',
    short: '마포',
    kind: 'site',
    company: '한빛건설',
    address: '서울 마포구',
    region: '서울',
    location: { lat: 37.55, lng: 126.94 },
    contact: contact('김현장'),
    period: period('2026-06-01', '2026-09-30'),
  },
  {
    id: 'SITE-SONGDO',
    ownerId: 'OWN-001',
    name: '송도 업무시설 신축',
    short: '송도',
    kind: 'site',
    company: '해오름건설',
    address: '인천 연수구',
    region: '인천·경기',
    location: { lat: 37.38, lng: 126.64 },
    contact: contact('이현장'),
    period: period('2026-06-01', '2026-10-31'),
  },
  {
    id: 'SITE-PYEONGTAEK',
    ownerId: 'OWN-001',
    name: '평택 물류센터',
    short: '평택',
    kind: 'site',
    company: '새길건설',
    address: '경기 평택시',
    region: '인천·경기',
    location: { lat: 36.99, lng: 127.09 },
    contact: contact('박현장'),
    period: period('2026-06-01', '2026-10-31'),
  },
  {
    id: 'SITE-DAEJEON',
    ownerId: 'OWN-001',
    name: '대전 공동주택',
    short: '대전',
    kind: 'site',
    company: '한빛건설',
    address: '대전 유성구',
    region: '대전·충청',
    location: { lat: 36.35, lng: 127.35 },
    contact: contact('최현장'),
    period: period('2026-06-01', '2026-10-31'),
  },
  {
    id: 'SITE-YONGIN',
    ownerId: 'OWN-001',
    name: '용인 장비 보관소',
    short: '용인',
    kind: 'depot',
    company: null,
    address: '경기 용인시',
    region: '인천·경기',
    location: { lat: 37.24, lng: 127.2 },
    contact: null,
    period: null,
  },
  {
    id: 'SITE-HWASEONG',
    ownerId: 'OWN-001',
    name: '화성 동탄 지식산업센터',
    short: '화성',
    kind: 'site',
    company: 'G/S건설',
    address: '경기 화성시',
    region: '인천·경기',
    location: { lat: 37.2, lng: 127.07 },
    contact: contact('정현장'),
    period: period('2026-04-15', '2026-12-31'),
  },
  {
    id: 'SITE-DAEDEOK',
    ownerId: 'OWN-001',
    name: '대덕 연구단지 증축',
    short: '대덕',
    kind: 'site',
    company: '포스코건설',
    address: '대전 대덕구',
    region: '대전·충청',
    location: { lat: 36.39, lng: 127.4 },
    contact: contact('한현장'),
    period: period('2026-05-01', '2026-11-30'),
  },
  {
    id: 'SITE-SEJONG',
    ownerId: 'OWN-001',
    name: '세종 행정타운 2단계',
    short: '세종',
    kind: 'site',
    company: '포스코건설',
    address: '세종 어진동',
    region: '대전·충청',
    location: { lat: 36.5, lng: 127.26 },
    contact: contact('오현장'),
    period: period('2026-03-01', '2027-02-28'),
  },
  {
    id: 'SITE-GWANGJU',
    ownerId: 'OWN-001',
    name: '광주 첨단지구 아파트',
    short: '광주',
    kind: 'site',
    company: '대림건설',
    address: '광주 광산구',
    region: '광주·호남',
    location: { lat: 35.16, lng: 126.85 },
    contact: contact('서현장'),
    period: period('2026-05-20', '2026-12-20'),
  },
  {
    id: 'SITE-DAEGU',
    ownerId: 'OWN-001',
    name: '대구 신서혁신도시 오피스텔',
    short: '대구',
    kind: 'site',
    company: '대림건설',
    address: '대구 동구',
    region: '대구·경북',
    location: { lat: 35.87, lng: 128.6 },
    contact: contact('강현장'),
    period: period('2026-04-01', '2026-11-15'),
  },
  {
    id: 'SITE-CHANGWON',
    ownerId: 'OWN-001',
    name: '창원 국가산단 공장동',
    short: '창원',
    kind: 'site',
    company: '한화건설',
    address: '경남 창원시',
    region: '부산·경남',
    location: { lat: 35.23, lng: 128.68 },
    contact: contact('윤현장'),
    period: period('2026-02-10', '2026-10-10'),
  },
  {
    id: 'SITE-GANGNEUNG',
    ownerId: 'OWN-001',
    name: '강릉 리조트 신축',
    short: '강릉',
    kind: 'site',
    company: '대림건설',
    address: '강원 강릉시',
    region: '강원',
    location: { lat: 37.75, lng: 128.88 },
    contact: contact('임현장'),
    period: period('2026-05-05', '2027-01-31'),
  },
  {
    id: 'SITE-BUSAN',
    ownerId: 'OWN-001',
    name: '부산 에코델타시티 주상복합',
    short: '부산',
    kind: 'site',
    company: '한화건설',
    address: '부산 강서구',
    region: '부산·경남',
    location: { lat: 35.18, lng: 128.97 },
    contact: contact('조현장'),
    period: period('2026-06-15', '2027-03-31'),
  },
  {
    id: 'SITE-OTHER',
    ownerId: 'OWN-002',
    name: '다른 회사 전용 현장',
    short: '타사',
    kind: 'site',
    company: '두번째건설',
    address: '부산 강서구',
    region: '부산·경남',
    location: { lat: 35.18, lng: 128.97 },
    contact: contact('타사 담당자'),
    period: period('2026-06-01', '2026-10-31'),
  },
];

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
/** 현장 → 호기 번호. 보관소는 5 + 81~99 중 5·0으로 끝나지 않는 번호(검색 '5호기' 계약 유지) */
export const OWNER_UNITS: Readonly<Record<string, readonly number[]>> = {
  'SITE-MAPO': [1, 6, 7, 8, 9],
  'SITE-SONGDO': [2, ...range(10, 14)],
  'SITE-PYEONGTAEK': [3, ...range(15, 20)],
  'SITE-DAEJEON': [4, ...range(21, 24)],
  'SITE-YONGIN': [5, 81, 82, 83, 84, 86, 87, 88, 89, 91, 92, 93, 94, 96, 97, 98, 99],
  'SITE-HWASEONG': range(25, 40),
  'SITE-DAEDEOK': range(41, 48),
  'SITE-SEJONG': range(49, 56),
  'SITE-GWANGJU': range(57, 66),
  'SITE-DAEGU': range(67, 80),
  'SITE-CHANGWON': [85, 90, 95, 100, ...range(102, 111)],
  'SITE-GANGNEUNG': range(112, 119),
  'SITE-BUSAN': [120, 121],
  'SITE-OTHER': [101],
};

/** 현장 안 호기 배치 — √n 열 격자, 칸 ≈ 78 m. 첫 호기는 현장 좌표 그대로(페르소나 좌표 보존) */
export function unitLocation(site: OwnerSite, index: number, count: number) {
  const cols = Math.ceil(Math.sqrt(count));
  return {
    lat: site.location.lat + Math.floor(index / cols) * 0.0007,
    lng: site.location.lng + (index % cols) * 0.0009,
  };
}

const RECEIVED = '2026-07-03T10:41:00+09:00';
const STALE_AT = '2026-07-03T08:22:00+09:00';
/** 확인 필요 6대 — 페르소나 3(002 전압 고장 · 003 점검 · 004 수신 지연) + 033 수신 지연 · 062 점검 · 117 유압 고장 */
const FAULT: Record<number, { fault: string; errorCode: string; voltage: number }> = {
  2: { fault: '공급 전압 저하', errorCode: 'E-021', voltage: 342 },
  101: { fault: '공급 전압 저하', errorCode: 'E-021', voltage: 342 },
  117: { fault: '유압 압력 이상', errorCode: 'E-107', voltage: 380 },
};
const INSPECTION = new Set([3, 62]);
const STALE = new Set([4, 33]);

export function ownerFleet(): OwnerDevice[] {
  const devices: OwnerDevice[] = [];
  for (const site of OWNER_SITES) {
    const units = OWNER_UNITS[site.id] ?? [];
    units.forEach((unit, index) => {
      const stored = site.kind === 'depot';
      const stale = STALE.has(unit);
      const fault = FAULT[unit];
      const inspection = INSPECTION.has(unit);
      devices.push({
        id: `CPB-${String(unit).padStart(3, '0')}`,
        ownerId: site.ownerId,
        unit,
        model: 'DY CPB 32',
        siteId: site.id,
        site: site.name,
        address: site.address,
        location: unitLocation(site, index, units.length),
        deployment: stored ? 'stored' : 'deployed',
        connection: stored ? 'detached' : stale ? 'stale' : 'current',
        receivedAt: stored ? null : stale ? STALE_AT : RECEIVED,
        voltage: stored ? null : (fault?.voltage ?? 380),
        harness: stored ? null : unit === 33 ? 'disconnected' : 'ok',
        fault: fault?.fault ?? null,
        errorCode: fault?.errorCode ?? null,
        inspection: inspection ? '수송관 점검 시기 도래' : null,
        contract:
          site.company && site.period
            ? {
                company: site.company,
                from: site.period.from,
                to: site.period.to,
                installed: installedOn(site.period.from),
              }
            : null,
        contact: site.contact ? { ...site.contact } : null,
        parts: [
          {
            name: '수송관',
            measured: inspection ? '누적 타설량 9,800 m³' : '누적 타설량 4,200 m³',
            reference: '점검 시연 기준 9,500 m³',
            due: inspection,
          },
          { name: '유압 필터', measured: '가동 180시간', reference: null, due: false },
        ],
      });
    });
  }
  return devices.sort((a, b) => a.unit - b.unit);
}
/** 설치일 = 계약 시작 + 2일(페르소나 06-01 → 06-03 유지) */
function installedOn(from: string) {
  const [y, m, d] = from.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + 2)).toISOString().slice(0, 10); // 날짜만 다루므로 UTC 산술이 시간대에 흔들리지 않는다
}
