// 역할 표시명 — ssot roles.yaml name (ROLE 상수는 generated/ids)
import type { RoleId } from './generated/ids';
import ssot from './generated/ssot.json';

export const ROLE_NAME = Object.fromEntries(
  (ssot as { roles: { roles: { id: string; name: string }[] } }).roles.roles.map((r) => [r.id, r.name]),
) as Record<RoleId, string>;
