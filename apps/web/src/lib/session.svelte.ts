// 세션 — 역할 카드 로그인 (목업). localStorage에 역할·계정만 보관 (DISC-020·023 확정 전)
import { isRole, type RoleId, type Session } from '@boomeyes/domain';

const KEY = 'boomeyes.session';
function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return isRole(s.role) ? s : null;
  } catch {
    return null;
  }
}
export const session = $state<{ user: Session | null }>({ user: typeof localStorage === 'undefined' ? null : read() });
export function login(user: Session) {
  session.user = user;
  localStorage.setItem(KEY, JSON.stringify(user));
}
export function logout() {
  session.user = null;
  localStorage.removeItem(KEY);
}
export const roleOf = (): RoleId | null => session.user?.role ?? null;
