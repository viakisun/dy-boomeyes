// 도메인 — 서버가 돌려주는 것들의 모양. 세 역할(소유주·건설사·안전관리자)이 같은 세계를 본다.

/** 호기·현장의 상태. 확인이 급한 순서는 shared/labels.ts의 STATUS_ORDER가 정한다. */
export type EquipmentStatus = 'fault' | 'check' | 'late' | 'run' | 'store';

/** 마모품은 닳은 정도로, 주기품은 남은 날로 관리한다. */
export type Part =
  | { kind: 'wear'; name: string; wornPercent: number; limitPercent: number }
  | { kind: 'cycle'; name: string; daysLeft: number };

export interface Camera {
  kind: 'body' | 'cctv' | 'ai';
  name: string;
}

export interface Document {
  name: string;
  issuedOn: string;
}

export interface Driver {
  name: string;
  license: string;
  licenseUntil: string;
  tel: string;
}

export interface AiEvent {
  at: string;
  title: string;
  detail: string;
  level: 'warn' | 'info';
}

export interface Unit {
  /** 현장 안에서 부르는 호기 번호 */
  number: number;
  /** 장비 고유 코드 CPB-012 */
  code: string;
  status: EquipmentStatus;
  lat: number;
  lon: number;
  cameras: Camera[];
  parts: Part[];
  documents: Document[];
  aiEvents: AiEvent[];
  driver: Driver;
  /** 마지막 수신을 사람이 읽는 문구로 — 서버가 만든다 */
  lastSeen: string;
  installedOn: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  address: string;
  /** 시공을 맡은 건설사 */
  builder: string;
  lat: number;
  lon: number;
  unitCount: number;
  status: EquipmentStatus;
  /** 확인이 필요한 현장만 — 무엇이 문제인지 */
  statusNote?: string;
  contractStart: string;
  contractEnd: string;
  /** 공정률 0~1 */
  progress: number;
  /** 계약 종료까지 남은 날 */
  daysToEnd: number;
  manager: string;
  managerTel: string;
  units: Unit[];
}

export type RequestStatus = 'new' | 'assign' | 'ship' | 'run' | 'done';

/** 현장 안전관리자가 보낸 CPB 요청. 소유주가 받아 호기를 배정한다. */
export interface EquipmentRequest {
  id: string;
  status: RequestStatus;
  /** 아직 현장으로 등록되기 전이라 이름만 있다 */
  siteName: string;
  builder: string;
  region: string;
  manager: string;
  managerTel: string;
  neededFrom: string;
  neededTo: string;
  neededCount: number;
  spec: string;
  /** 접수 시점을 사람이 읽는 문구로 */
  receivedAt: string;
  assignedCodes: string[];
}

/** 한 요청에 배정할 수 있는 호기 — 가용 판단은 서버가 한다. */
export interface Candidate {
  unitNumber: number;
  code: string;
  status: EquipmentStatus;
  lastSeen: string;
  /** 차량 서류 건수 — 4건 미만이면 화면이 「서류 미비」로 표시한다 */
  documentCount: number;
  siteName: string;
  contractEnd: string;
  daysToEnd: number;
  inStorage: boolean;
}

export interface Alert {
  /** 알림 한 건을 가리키는 키 — 읽음 표시에 쓴다 */
  id: string;
  kind: 'fault' | 'late' | 'check' | 'ai' | 'contract';
  at: string;
  siteId: string;
  siteName: string;
  unitNumber: number | null;
  unitCode: string | null;
  title: string;
  detail: string;
}
