// 목업 데이터 — Claude Design 「운영 현황 목업.html」의 표를 옮긴 것.
// 실서버가 생기면 shared/mock 폴더만 버리면 된다. 화면은 이 파일을 import하지 않는다.
import type { Camera, Document, Driver, EquipmentRequest, Part, Site, Unit } from '../types';

type SiteSeed = Omit<Site, 'units'>;

// prettier-ignore
const SITE_SEEDS: SiteSeed[] = [
  {id:'songdo',  name:'송도 업무시설 신축', region:'인천', address:'인천 연수구',  builder:'대양건설', lat:37.39, lon:126.64, unitCount:8,  status:'fault', statusNote:'2호기 공급 전압 저하',        contractStart:'2026. 04. 15.', contractEnd:'2026. 12. 20.', progress:.60, daysToEnd:99,  manager:'박현장',      managerTel:'010-0000-1201'},
  {id:'busan',   name:'부산 해운대 오피스', region:'부산', address:'부산 해운대구', builder:'해성건설', lat:35.16, lon:129.16, unitCount:14, status:'fault', statusNote:'11호기 유압 경보',            contractStart:'2026. 02. 01.', contractEnd:'2027. 01. 31.', progress:.62, daysToEnd:141, manager:'정현장',      managerTel:'010-0000-1202'},
  {id:'pt',      name:'평택 물류센터',      region:'경기', address:'경기 평택시',   builder:'한빛건설', lat:36.99, lon:127.09, unitCount:12, status:'check', statusNote:'3호기 수송관 점검 시기 도래',  contractStart:'2026. 05. 10.', contractEnd:'2027. 01. 10.', progress:.50, daysToEnd:120, manager:'이현장',      managerTel:'010-0000-1203'},
  {id:'daegu',   name:'대구 주거단지',      region:'대구', address:'대구 달서구',   builder:'남도건설', lat:35.87, lon:128.60, unitCount:10, status:'check', statusNote:'23호기 정기 점검',            contractStart:'2026. 03. 01.', contractEnd:'2026. 11. 30.', progress:.72, daysToEnd:79,  manager:'최현장',      managerTel:'010-0000-1204'},
  {id:'daejeon', name:'대전 공동주택',      region:'대전', address:'대전 유성구',   builder:'한빛건설', lat:36.35, lon:127.38, unitCount:6,  status:'late',  statusNote:'4호기 마지막 수신 7. 3. 08:22', contractStart:'2026. 06. 01.', contractEnd:'2027. 02. 28.', progress:.38, daysToEnd:120, manager:'김현장',      managerTel:'010-0000-1205'},
  {id:'gn',      name:'강릉 리조트',        region:'강원', address:'강원 강릉시',   builder:'동해건설', lat:37.75, lon:128.88, unitCount:4,  status:'late',  statusNote:'2호기 수신 지연 3시간',       contractStart:'2026. 07. 01.', contractEnd:'2026. 12. 31.', progress:.40, daysToEnd:110, manager:'윤현장',      managerTel:'010-0000-1206'},
  {id:'mapo',    name:'마포 주상복합 신축', region:'서울', address:'서울 마포구',   builder:'한빛건설', lat:37.55, lon:126.95, unitCount:5,  status:'run',                                             contractStart:'2026. 06. 01.', contractEnd:'2026. 09. 30.', progress:.27, daysToEnd:89,  manager:'김현장',      managerTel:'010-0000-1207'},
  {id:'sejong',  name:'세종 행정타운',      region:'세종', address:'세종시 어진동', builder:'세림건설', lat:36.48, lon:127.29, unitCount:11, status:'run',                                             contractStart:'2026. 01. 15.', contractEnd:'2027. 01. 30.', progress:.66, daysToEnd:140, manager:'오현장',      managerTel:'010-0000-1208'},
  {id:'cj',      name:'청주 산업단지',      region:'충북', address:'충북 청주시',   builder:'중원건설', lat:36.64, lon:127.49, unitCount:9,  status:'run',                                             contractStart:'2026. 04. 01.', contractEnd:'2027. 04. 10.', progress:.44, daysToEnd:210, manager:'장현장',      managerTel:'010-0000-1209'},
  {id:'gj',      name:'광주 산단 물류',     region:'광주', address:'광주 광산구',   builder:'호남건설', lat:35.16, lon:126.85, unitCount:9,  status:'run',                                             contractStart:'2026. 03. 20.', contractEnd:'2026. 11. 15.', progress:.75, daysToEnd:64,  manager:'강현장',      managerTel:'010-0000-1210'},
  {id:'jj',      name:'전주 병원 신축',     region:'전북', address:'전북 전주시',   builder:'전북건설', lat:35.82, lon:127.15, unitCount:7,  status:'run',                                             contractStart:'2026. 05. 01.', contractEnd:'2027. 01. 08.', progress:.53, daysToEnd:118, manager:'문현장',      managerTel:'010-0000-1211'},
  {id:'cw',      name:'창원 공장 증축',     region:'경남', address:'경남 창원시',   builder:'경남산업', lat:35.23, lon:128.68, unitCount:8,  status:'run',                                             contractStart:'2026. 04. 20.', contractEnd:'2026. 10. 14.', progress:.82, daysToEnd:32,  manager:'배현장',      managerTel:'010-0000-1212'},
  {id:'yongin',  name:'용인 장비 보관소',   region:'경기', address:'경기 용인시',   builder:'—',        lat:37.24, lon:127.18, unitCount:17, status:'store',                                           contractStart:'',              contractEnd:'',              progress:0,   daysToEnd:0,   manager:'보관소 관리', managerTel:'010-0000-1213'},
];

// 호기마다 실리는 부품. 점검 상태인 호기는 수송관이 한계 가까이 가 있다.
// prettier-ignore
const PART_SEEDS: Part[] = [
  { kind:'wear',  name:'수송관',       wornPercent:62, limitPercent:80 },
  { kind:'wear',  name:'엘보',         wornPercent:41, limitPercent:80 },
  { kind:'wear',  name:'고무 호스',    wornPercent:24, limitPercent:80 },
  { kind:'wear',  name:'S밸브 웨어링', wornPercent:55, limitPercent:80 },
  { kind:'cycle', name:'유압유',       daysLeft:38 },
  { kind:'cycle', name:'유압 필터',    daysLeft:71 },
];

// prettier-ignore
const CAMERAS: Camera[] = [
  { kind:'body', name:'바디캠 A' }, { kind:'body', name:'바디캠 B' }, { kind:'body', name:'바디캠 C' },
  { kind:'cctv', name:'CCTV 1' },  { kind:'cctv', name:'CCTV 2' },  { kind:'ai', name:'AI CCTV' },
];

// prettier-ignore
const DOCUMENTS: Document[] = [
  { name:'제작증', issuedOn:'2025-11' }, { name:'검사 성적서', issuedOn:'2026-05' },
  { name:'안전검사 합격증', issuedOn:'2026-05' }, { name:'보험 증서', issuedOn:'2026-01' },
  { name:'설치 확인서', issuedOn:'2026-06' }, { name:'정기점검 기록', issuedOn:'2026-08' },
  { name:'수송관 교체 이력', issuedOn:'2026-07' },
];

// 운전자는 소유주 소속이고 호기에 날마다 배정된다. 서류는 장비 서류와 별개다.
// prettier-ignore
const DRIVERS: Driver[] = [
  { name:'김운전', license:'건설기계조종사 1종', licenseUntil:'2027. 04. 30.', tel:'010-0000-0001' },
  { name:'이운전', license:'건설기계조종사 1종', licenseUntil:'2026. 10. 12.', tel:'010-0000-0002' },
  { name:'박운전', license:'건설기계조종사 1종', licenseUntil:'2028. 01. 20.', tel:'010-0000-0003' },
  { name:'최운전', license:'건설기계조종사 1종', licenseUntil:'2026. 09. 28.', tel:'010-0000-0004' },
  { name:'정운전', license:'건설기계조종사 1종', licenseUntil:'2027. 07. 05.', tel:'010-0000-0005' },
  { name:'윤운전', license:'건설기계조종사 1종', licenseUntil:'2027. 11. 18.', tel:'010-0000-0006' },
];

// prettier-ignore
const REQUEST_SEEDS: EquipmentRequest[] = [
  { id:'R-241', status:'new',    siteName:'강서 데이터센터 신축', builder:'정은건설', region:'서울 강서구', manager:'한안전', managerTel:'010-0000-1101', neededFrom:'2026. 10. 05.', neededTo:'2027. 03. 31.', neededCount:3, spec:'붐 32 m · 지상 18층', receivedAt:'2시간 전', assignedCodes:[] },
  { id:'R-240', status:'new',    siteName:'김해 물류창고',       builder:'남도건설', region:'경남 김해',   manager:'서안전', managerTel:'010-0000-1102', neededFrom:'2026. 09. 25.', neededTo:'2027. 01. 15.', neededCount:2, spec:'붐 32 m',              receivedAt:'어제',    assignedCodes:[] },
  { id:'R-238', status:'assign', siteName:'수원 주상복합',       builder:'한빛건설', region:'경기 수원',   manager:'임안전', managerTel:'010-0000-1103', neededFrom:'2026. 10. 01.', neededTo:'2027. 06. 30.', neededCount:4, spec:'붐 32 m · 지상 24층', receivedAt:'3일 전',  assignedCodes:[] },
  { id:'R-235', status:'ship',   siteName:'울산 플랜트 증설',    builder:'동해건설', region:'울산 남구',   manager:'권안전', managerTel:'010-0000-1104', neededFrom:'2026. 09. 20.', neededTo:'2027. 02. 28.', neededCount:2, spec:'붐 32 m',              receivedAt:'1주 전',  assignedCodes:[] },
  { id:'R-231', status:'done',   siteName:'제주 리조트 증축',    builder:'호남건설', region:'제주시',     manager:'고안전', managerTel:'010-0000-1105', neededFrom:'2026. 03. 02.', neededTo:'2026. 08. 31.', neededCount:2, spec:'붐 32 m',              receivedAt:'종료',    assignedCodes:[] },
];

const WARN_EVENTS: Unit['aiEvents'] = [
  { at: '10:41:52', title: '작업자 접근', detail: '붐 끝 반경 4 m 이내', level: 'warn' },
  { at: '09:58:10', title: '안전모 미착용', detail: '타설 구역 내 1명', level: 'warn' },
  { at: '08:12:30', title: '구역 진입', detail: '작업 시작 전 접근 주의 구역', level: 'info' },
];
const INFO_EVENT: Unit['aiEvents'] = [
  { at: '07:55:03', title: '구역 진입', detail: '작업 시작 전 접근 주의 구역', level: 'info' },
];

// 현장 안 호기 배치. 줌 17에서 픽셀로 잡은 뒤 미터로, 다시 위경도로 바꾼다.
const SITE_ZOOM = 17;
const METRES_PER_PX = (40075016.686 * Math.cos((36.5 * Math.PI) / 180)) / Math.pow(2, SITE_ZOOM + 8);
const PLOT_OFFSETS: [number, number][] = [];
for (let i = 0; i < 20; i++) {
  const columns = 3,
    row = Math.floor(i / columns),
    col = i % columns;
  PLOT_OFFSETS.push([((col - 1) * 132 + (row % 2 ? 44 : 0)) * METRES_PER_PX, (2 - row) * 62 * METRES_PER_PX]);
}

/** 호기마다 부품 마모를 조금씩 다르게 흩어 놓는다 — 번호로 정해지므로 다시 켜도 같다. */
function partsFor(unitNumber: number): Part[] {
  return PART_SEEDS.map((p, i) =>
    p.kind === 'wear'
      ? { ...p, wornPercent: Math.min(95, p.wornPercent + ((unitNumber * (i + 3)) % 17) - 8) }
      : { ...p, daysLeft: Math.max(2, p.daysLeft + ((unitNumber * (i + 5)) % 23) - 11) },
  );
}

function unitsFor(site: SiteSeed, nextNumber: () => number): Unit[] {
  // 마포는 시안의 실제 호기 번호를 쓴다. 나머지는 이어서 매긴다.
  const numbers = site.id === 'mapo' ? [1, 6, 7, 8, 9] : Array.from({ length: site.unitCount }, nextNumber);
  const inStorage = site.status === 'store';
  return numbers.map((number, i) => {
    const [east, north] = PLOT_OFFSETS[i % PLOT_OFFSETS.length];
    return {
      number,
      code: 'CPB-' + String(number).padStart(3, '0'),
      status: inStorage ? 'store' : 'run',
      lat: site.lat + north / 111320,
      lon: site.lon + east / (111320 * Math.cos((site.lat * Math.PI) / 180)),
      cameras: inStorage ? [] : CAMERAS,
      parts: partsFor(number),
      documents: DOCUMENTS.slice(0, 2 + ((number * 5) % (DOCUMENTS.length - 1))),
      aiEvents: number === 1 || number === 12 ? WARN_EVENTS : number % 4 === 0 ? INFO_EVENT : [],
      driver: DRIVERS[(number + i) % DRIVERS.length],
      lastSeen: inStorage ? '수신 없음' : '1분 전 수신',
      installedOn: (site.contractStart || '2026. 06. 01.').replace(
        /(\d{2})\.$/,
        (_m, day) => String(Math.min(28, +day + 2)).padStart(2, '0') + '.',
      ),
    };
  });
}

/** 현장 상태를 대표하는 호기 하나에 그 상태를 실어 준다. */
function markRepresentativeUnit(site: Site) {
  if (site.status === 'fault') site.units[1].status = 'fault';
  if (site.status === 'check') {
    const unit = site.units[2 % site.units.length];
    unit.status = 'check';
    const pipe = unit.parts[0];
    if (pipe.kind === 'wear') pipe.wornPercent = 84;
  }
  if (site.status === 'late') {
    const unit = site.units[Math.min(3, site.units.length - 1)];
    unit.status = 'late';
    unit.lastSeen = '마지막 수신 7. 3. 오전 08:22';
  }
}

/** 목업 서버가 들고 있을 한 벌을 만든다. 서버가 켜질 때 한 번 부른다. */
export function buildDataset(): { sites: Site[]; requests: EquipmentRequest[] } {
  let last = 10;
  const nextNumber = () => ++last;
  const sites: Site[] = SITE_SEEDS.map(seed => ({ ...seed, units: unitsFor(seed, nextNumber) }));
  sites.forEach(markRepresentativeUnit);
  return { sites, requests: REQUEST_SEEDS.map(r => ({ ...r, assignedCodes: [] })) };
}
