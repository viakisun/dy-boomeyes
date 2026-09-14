// 시드 — Claude Design 「운영 현황 목업.html」 그대로.
// 시안이 리터럴을 나중에 확장한다(s.units·u.parts) — 좁은 추론만 푼다
const SITES: any[] = [
  {id:'songdo',  name:'송도 업무시설 신축', region:'인천', addr:'인천 연수구', builder:'대양건설', lat:37.39, lon:126.64, n:8,  st:'fault', note:'2호기 공급 전압 저하', start:'2026. 04. 15.', end:'2026. 12. 20.', prog:.6, dday:99, mgr:'박현장'},
  {id:'busan',   name:'부산 해운대 오피스', region:'부산', addr:'부산 해운대구', builder:'해성건설', lat:35.16, lon:129.16, n:14, st:'fault', note:'11호기 유압 경보', start:'2026. 02. 01.', end:'2027. 01. 31.', prog:.62, dday:141, mgr:'정현장'},
  {id:'pt',      name:'평택 물류센터',     region:'경기', addr:'경기 평택시', builder:'한빛건설', lat:36.99, lon:127.09, n:12, st:'check', note:'3호기 수송관 점검 시기 도래', start:'2026. 05. 10.', end:'2027. 01. 10.', prog:.5, dday:120, mgr:'이현장'},
  {id:'daegu',   name:'대구 주거단지',     region:'대구', addr:'대구 달서구', builder:'남도건설', lat:35.87, lon:128.60, n:10, st:'check', note:'23호기 정기 점검', start:'2026. 03. 01.', end:'2026. 11. 30.', prog:.72, dday:79, mgr:'최현장'},
  {id:'daejeon', name:'대전 공동주택',     region:'대전', addr:'대전 유성구', builder:'한빛건설', lat:36.35, lon:127.38, n:6,  st:'late',  note:'4호기 마지막 수신 7. 3. 08:22', start:'2026. 06. 01.', end:'2027. 02. 28.', prog:.38, dday:120, mgr:'김현장'},
  {id:'gn',      name:'강릉 리조트',       region:'강원', addr:'강원 강릉시', builder:'동해건설', lat:37.75, lon:128.88, n:4,  st:'late',  note:'2호기 수신 지연 3시간', start:'2026. 07. 01.', end:'2026. 12. 31.', prog:.4, dday:110, mgr:'윤현장'},
  {id:'mapo',    name:'마포 주상복합 신축', region:'서울', addr:'서울 마포구', builder:'한빛건설', lat:37.55, lon:126.95, n:5,  st:'run', start:'2026. 06. 01.', end:'2026. 09. 30.', prog:.27, dday:89, mgr:'김현장'},
  {id:'sejong',  name:'세종 행정타운',     region:'세종', addr:'세종시 어진동', builder:'세림건설', lat:36.48, lon:127.29, n:11, st:'run', start:'2026. 01. 15.', end:'2027. 01. 30.', prog:.66, dday:140, mgr:'오현장'},
  {id:'cj',      name:'청주 산업단지',     region:'충북', addr:'충북 청주시', builder:'중원건설', lat:36.64, lon:127.49, n:9,  st:'run', start:'2026. 04. 01.', end:'2027. 04. 10.', prog:.44, dday:210, mgr:'장현장'},
  {id:'gj',      name:'광주 산단 물류',    region:'광주', addr:'광주 광산구', builder:'호남건설', lat:35.16, lon:126.85, n:9,  st:'run', start:'2026. 03. 20.', end:'2026. 11. 15.', prog:.75, dday:64, mgr:'강현장'},
  {id:'jj',      name:'전주 병원 신축',    region:'전북', addr:'전북 전주시', builder:'전북건설', lat:35.82, lon:127.15, n:7,  st:'run', start:'2026. 05. 01.', end:'2027. 01. 08.', prog:.53, dday:118, mgr:'문현장'},
  {id:'cw',      name:'창원 공장 증축',    region:'경남', addr:'경남 창원시', builder:'경남산업', lat:35.23, lon:128.68, n:8,  st:'run', start:'2026. 04. 20.', end:'2026. 10. 14.', prog:.82, dday:32, mgr:'배현장'},
  {id:'yongin',  name:'용인 장비 보관소',  region:'경기', addr:'경기 용인시', builder:'—', lat:37.24, lon:127.18, n:17, st:'store', start:'', end:'', prog:0, dday:0, mgr:'보관소 관리'},
];
const LABEL = {fault:'고장', check:'점검', late:'수신 지연', run:'정상', store:'보관'};
const COLOR = {fault:'var(--fault)', check:'var(--check)', late:'var(--late)', run:'var(--run)', store:'var(--store)'};
const UNIT_MSG = {fault:'공급 전압 저하', check:'수송관 점검 시기 도래', late:'마지막 수신 7. 3. 오전 08:22', run:'이상 신호 없음', store:'단말기 미장착'};
const UNIT_TITLE = {fault:'고장 · 공급 전압 저하', check:'점검 · 수송관 점검 시기 도래', late:'수신 지연', run:'정상 가동 중', store:'보관 중'};
// Consumables per unit: wear (%) or replacement countdown (days). The check-status unit has its pipe near the limit.
const PARTS: any[][] = [['수송관', 'wear', 62, 80], ['엘보', 'wear', 41, 80], ['고무 호스', 'wear', 24, 80], ['S밸브 웨어링', 'wear', 55, 80], ['유압유', 'days', 38], ['유압 필터', 'days', 71]];
const CAMS = [['body','바디캠 A'],['body','바디캠 B'],['body','바디캠 C'],['cctv','CCTV 1'],['cctv','CCTV 2'],['ai','AI CCTV']];
// Each camera shows a different framing of the same demo scene (background-size / position stand in for six feeds).
const CAMVIEW = ['cover; background-position:15% 35%', 'cover; background-position:70% 45%', 'cover; background-position:100% 60%', 'cover; background-position:50% 40%', 'cover; background-position:0% 70%', 'cover; background-position:60% 50%'];
const DOCS = [['제작증','2025-11'],['검사 성적서','2026-05'],['안전검사 합격증','2026-05'],['보험 증서','2026-01'],['설치 확인서','2026-06'],['정기점검 기록','2026-08'],['수송관 교체 이력','2026-07']];
// Drivers belong to the owner and are assigned per unit, per day. Their papers are separate from the machine's.
const DRIVERS = [
  ['김운전', '건설기계조종사 1종', '2027. 04. 30.', '010-0000-0001'],
  ['이운전', '건설기계조종사 1종', '2026. 10. 12.', '010-0000-0002'],
  ['박운전', '건설기계조종사 1종', '2028. 01. 20.', '010-0000-0003'],
  ['최운전', '건설기계조종사 1종', '2026. 09. 28.', '010-0000-0004'],
  ['정운전', '건설기계조종사 1종', '2027. 07. 05.', '010-0000-0005'],
  ['윤운전', '건설기계조종사 1종', '2027. 11. 18.', '010-0000-0006'],
];
// Incoming CPB requests from site safety managers.
const REQS = [
  { id: 'R-241', st: 'new',  site: '강서 데이터센터 신축', builder: '정은건설', region: '서울 강서구', mgr: '한안전', tel: '010-0000-1101', from: '2026. 10. 05.', to: '2027. 03. 31.', n: 3, spec: '봐 32 m · 지상 18층', at: '2시간 전' },
  { id: 'R-240', st: 'new',  site: '김해 물류창고', builder: '남도건설', region: '경남 김해', mgr: '서안전', tel: '010-0000-1102', from: '2026. 09. 25.', to: '2027. 01. 15.', n: 2, spec: '봐 32 m', at: '어제' },
  { id: 'R-238', st: 'assign', site: '수원 주상복합', builder: '한빛건설', region: '경기 수원', mgr: '임안전', tel: '010-0000-1103', from: '2026. 10. 01.', to: '2027. 06. 30.', n: 4, spec: '봐 32 m · 지상 24층', at: '3일 전', picked: [] },
  { id: 'R-235', st: 'ship', site: '울산 플랜트 증설', builder: '동해건설', region: '울산 남구', mgr: '권안전', tel: '010-0000-1104', from: '2026. 09. 20.', to: '2027. 02. 28.', n: 2, spec: '봐 32 m', at: '1주 전' },
  { id: 'R-231', st: 'done', site: '제주 리조트 증축', builder: '호남건설', region: '제주시', mgr: '고안전', tel: '010-0000-1105', from: '2026. 03. 02.', to: '2026. 08. 31.', n: 2, spec: '봐 32 m', at: '종료' },
];
const REQ_ST = { new: '요청 접수', assign: '배정 중', ship: '운송·설치', run: '가동', done: '종료' };

// Units per site: 마포 uses the demo's real numbers; the rest are generated. Site offsets (metres) form a small plot.
let seq = 10;
// Unit plots are laid out in PIXELS at a fixed site zoom (constant 118 px column pitch), then converted to metres per site.
const SITE_Z = 17, PX_M = 40075016.686 * Math.cos(36.5 * Math.PI / 180) / Math.pow(2, SITE_Z + 8); // metres per px at zoom 17, ~36.5°N
const PLOTS: number[][] = []; for (let i = 0; i < 20; i++) { const cols = 3, r = Math.floor(i / cols), c = i % cols; PLOTS.push([((c - 1) * 132 + (r % 2 ? 44 : 0)) * PX_M, ((2 - r) * 62) * PX_M]); }
for (const s of SITES) {
  const nums = s.id === 'mapo' ? [1,6,7,8,9] : Array.from({length:s.n}, () => ++seq);
  s.units = nums.map((num, i) => ({
    num, code: 'CPB-' + String(num).padStart(3,'0'), st: s.st === 'store' ? 'store' : 'run',
    cams: s.st === 'store' ? [] : CAMS,
    parts: PARTS.map((p, k) => p[1] === 'wear' ? [p[0], 'wear', Math.min(95, p[2] + ((num * (k + 3)) % 17) - 8), p[3]] : [p[0], 'days', Math.max(2, p[2] + ((num * (k + 5)) % 23) - 11)]),
    docs: DOCS.slice(0, 2 + ((num * 5) % (DOCS.length - 1))),
    ai: (num === 1 || num === 12) ? [
      { t: '10:41:52', type: '작업자 접근', detail: '붐 끝 반경 4 m 이내', lvl: 'warn' },
      { t: '09:58:10', type: '안전모 미착용', detail: '타설 구역 내 1명', lvl: 'warn' },
      { t: '08:12:30', type: '구역 진입', detail: '작업 시작 전 접근 주의 구역', lvl: 'info' },
    ] : (num % 4 === 0 ? [{ t: '07:55:03', type: '구역 진입', detail: '작업 시작 전 접근 주의 구역', lvl: 'info' }] : []),
    d: PLOTS[i % PLOTS.length], driver: DRIVERS[(num + i) % DRIVERS.length], recv: s.st === 'store' ? '수신 없음' : '1분 전 수신', install: (s.start || '2026. 06. 01.').replace(/(\d{2})\.$/, (m, d) => String(Math.min(28, +d + 2)).padStart(2, '0') + '.')
  }));
  if (s.st === 'fault') { s.units[1].st = 'fault'; }
  if (s.st === 'check') { s.units[2 % s.units.length].st = 'check'; s.units[2 % s.units.length].parts[0][2] = 84; }
  if (s.st === 'late')  { s.units[Math.min(3, s.units.length-1)].st = 'late'; s.units[Math.min(3, s.units.length-1)].recv = '마지막 수신 7. 3. 오전 08:22'; }
}
const ll = (s, d) => [s.lat + d[1] / 111320, s.lon + d[0] / (111320 * Math.cos(s.lat * Math.PI / 180))];

export { SITES, SITE_Z, LABEL, COLOR, UNIT_MSG, UNIT_TITLE, PARTS, CAMS, CAMVIEW, DOCS, DRIVERS, REQS, REQ_ST, ll };
