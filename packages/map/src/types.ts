import type { EquipmentState } from '@boomeyes/domain';
/** unit = 호기 핀(기본) · site = 현장 알약(이름 + 대수) · region = 지역 집계 원(대수 + 지역명) */
export type MarkerKind = 'unit' | 'site' | 'region';
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  state: EquipmentState;
  label: string;
  /** 짧은 지도 라벨의 전체 맥락. 스크린리더와 툴팁에서 읽는다. */
  description?: string;
  selected?: boolean;
  kind?: MarkerKind;
  /** site·region 알약의 대수 배지 */
  count?: number;
  /** 보관소 현장 — 상태 점 대신 사각 표식 */
  variant?: 'depot';
}
/** 카메라 지시 — key가 바뀔 때만 이동한다(같은 장면의 재렌더는 카메라를 건드리지 않는다). padding은 cameraForBounds에만 쓰고 지도에 남기지 않는다. */
export type MapCamera = {
  key: string;
  padding?: { top: number; right: number; bottom: number; left: number };
} & ({ bounds: [[number, number], [number, number]]; maxZoom?: number } | { center: [number, number]; zoom: number });
export interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  /** tiles = 베이스맵 타일(styleUrl) · outline = 타일 없이 국경만(전국 단계 — 시안 «확정 2026-09-12») */
  basemap?: 'tiles' | 'outline';
  /** 타일을 회색조로 물린다 — 현장 단계. 마커는 DOM이라 영향받지 않는다. */
  muted?: boolean;
  interactive?: boolean;
  /** 작은 배치 지도에서 표시한 호기 범위를 자동으로 맞춘다. 기존 관제는 기본 배율 유지. */
  fitMarkers?: boolean;
  /** 드릴다운 현황 — 장면이 정한 카메라로 이동(fitMarkers의 자동 맞춤 대신). 준비 표식(data-map-ready)을 이동마다 다시 세운다. */
  camera?: MapCamera;
  /** 카메라 이동을 애니메이션한다(prefers-reduced-motion이면 즉시). */
  animate?: boolean;
  /** auto = 폭 < 480px에서 번호 원형 · compact = 항상 원형 · pill = 항상 알약 */
  pins?: 'auto' | 'compact' | 'pill';
  /** data-map-level로 노출 — 캡처·e2e가 "이 단계의 지도가 준비됐다"를 기다린다 */
  level?: string;
  /** 지명 라벨 언어(예: 'ko') — 타일에 name:<locale>가 있으면 우선, 없으면 name */
  labelLocale?: string;
  onselect?: (id: string, kind: MarkerKind) => void;
  class?: string;
}
