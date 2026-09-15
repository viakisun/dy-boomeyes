// 서버가 돌려주는 것들의 모양. 화면은 이 타입만 알고 목업인지 실서버인지는 모른다.

export type Status = 'fault' | 'check' | 'late' | 'run' | 'store';
export type ReqStatus = 'new' | 'assign' | 'ship' | 'run' | 'done';

/** [이름, 마모품이면 현재 %와 교체 한계 % / 주기품이면 남은 일수] */
export type Part = [name: string, kind: 'wear' | 'days', value: number, limit?: number];
/** [갈래, 이름] */
export type Cam = [kind: 'body' | 'cctv' | 'ai', name: string];
/** [이름, 발급일] */
export type Doc = [name: string, date: string];
/** [이름, 면허, 만료일, 전화] */
export type Driver = [name: string, license: string, until: string, tel: string];

export interface AiEvent {
  t: string;
  type: string;
  detail: string;
  lvl: 'warn' | 'info';
}

export interface Unit {
  num: number;
  code: string;
  st: Status;
  lat: number;
  lon: number;
  cams: Cam[];
  parts: Part[];
  docs: Doc[];
  ai: AiEvent[];
  driver: Driver;
  /** 마지막 수신을 사람이 읽는 문구로 — 서버가 만든다 */
  recv: string;
  install: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  addr: string;
  builder: string;
  lat: number;
  lon: number;
  /** 보유 대수 */
  n: number;
  st: Status;
  /** 확인이 필요한 현장만 — 무엇이 문제인지 */
  note?: string;
  start: string;
  end: string;
  /** 공정률 0~1 */
  prog: number;
  /** 계약 종료까지 남은 일수 */
  dday: number;
  mgr: string;
  tel: string;
  units: Unit[];
}

export interface Request {
  id: string;
  st: ReqStatus;
  site: string;
  builder: string;
  region: string;
  mgr: string;
  tel: string;
  from: string;
  to: string;
  /** 필요 대수 */
  n: number;
  spec: string;
  /** 접수 시점을 사람이 읽는 문구로 */
  at: string;
  /** 배정된 호기 코드 */
  picked: string[];
}

/** 한 요청에 배정할 수 있는 호기 — 가용 판단은 서버가 한다 */
export interface Candidate {
  num: number;
  code: string;
  st: Status;
  recv: string;
  /** 차량 서류 건수 — 4건 미만이면 화면이 「서류 미비」로 표시한다 */
  docs: number;
  siteName: string;
  siteEnd: string;
  dday: number;
  stored: boolean;
}

export interface Alert {
  /** 알림 한 건을 가리키는 키 — 읽음 표시에 쓴다 */
  id: string;
  kind: 'fault' | 'late' | 'check' | 'ai' | 'exp';
  t: string;
  siteId: string;
  siteName: string;
  unitNum: number | null;
  unitCode: string | null;
  title: string;
  sub: string;
}
