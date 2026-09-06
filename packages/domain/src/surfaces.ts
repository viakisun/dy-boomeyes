// 표면 표시명 — ssot screens.yaml surfaces[].name (B1 → 운영사 관제 WEB). 내비 그룹·브레드크럼·로그인 카드가 표면 코드 대신 쓴다 (DY-design §12.1-7)
import type { SCREENS, ScrId } from './generated/ids';
import ssot from './generated/ssot.json';

export type SurfaceId = (typeof SCREENS)[ScrId]['surface'];
export const SURFACE_NAME = Object.fromEntries(
  (ssot as { screens: { surfaces: { id: string; name: string }[] } }).screens.surfaces.map((s) => [s.id, s.name]),
) as Record<SurfaceId, string>;
