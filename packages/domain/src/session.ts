// 세션 — 목업 단계: 역할 카드 로그인 (실인증 없음, DISC-020·023)
import { ROLE, SCREENS, type RoleId, type ScrId } from './generated/ids';

export interface Session {
  userId: string;
  role: RoleId;
  display: string;
  org: string;
}

/** 웹 역할별 첫 화면 (specs/shell-auth AC-1) */
export const HOME_OF: Record<RoleId, ScrId> = {
  control: 'B1-02',
  'hq-safety': 'B2-02',
  'site-safety': 'B3-02',
  'ops-admin': 'B4-02',
  maintenance: 'B1-04',
  driver: 'A2-02',
  owner: 'A4-02',
};
/** PWA 표면 역할의 앱 첫 화면 */
export const APP_HOME_OF: Partial<Record<RoleId, ScrId>> = {
  'site-safety': 'A1-02',
  'hq-safety': 'A3-02',
  driver: 'A2-02',
  owner: 'A4-02',
};

export const isRole = (v: unknown): v is RoleId => typeof v === 'string' && v in ROLE;
export const canAccess = (role: RoleId, scr: ScrId): boolean =>
  (SCREENS[scr].roles as readonly string[]).includes(role);
