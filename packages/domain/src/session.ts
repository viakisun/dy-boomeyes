import type { Scope } from './types';
// 세션 — 목업 단계: 역할 카드 로그인 (실인증 없음, DISC-020·023)
import { ROLE, SCREENS, type RoleId, type ScrId } from './generated/ids';
import type { Scope } from './types';

export interface Session {
  userId: string;
  role: RoleId;
  display: string;
  org: string;
  /** 소유주 계정의 사업주 ID — B1 스코프(ADR-012). 다른 역할은 없음 */
  ownerId?: string;
}

/** 웹 역할별 첫 화면 (specs/shell-auth AC-1) */
export const HOME_OF: Record<RoleId, ScrId> = {
  control: 'B1-02',
  'hq-safety': 'B2-02',
  'site-safety': 'B3-02',
  'ops-admin': 'B4-02',
  maintenance: 'B1-04',
  driver: 'A2-02',
  owner: 'B1-02', // 웹(PC) 첫 화면 — 소유주는 B1 주인(ADR-012) · 앱은 APP_HOME_OF A4
};
/** PWA 표면 역할의 앱 첫 화면 */
export const APP_HOME_OF: Partial<Record<RoleId, ScrId>> = {
  'site-safety': 'A1-02',
  'hq-safety': 'A3-02',
  driver: 'A2-02',
  owner: 'A4-02',
};

export const isRole = (v: unknown): v is RoleId => typeof v === 'string' && v in ROLE;
/** 세션 → API 스코프 — 역할 + 소유주면 ownerId(보유 호기만, ADR-012). 세션이 없으면(캡처 부팅 전) control 전국 뷰 */
export const scopeOf = (s: Pick<Session, 'role' | 'ownerId'> | null | undefined): Scope =>
  s ? { role: s.role, ...(s.ownerId ? { ownerId: s.ownerId } : {}) } : { role: 'control' };

export const canAccess = (role: RoleId, scr: ScrId): boolean =>
  (SCREENS[scr].roles as readonly string[]).includes(role);
