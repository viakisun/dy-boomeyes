import type { EquipmentState } from '@boomeyes/domain';
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  state: EquipmentState;
  label: string;
  /** 짧은 지도 라벨의 전체 맥락. 스크린리더와 툴팁에서 읽는다. */
  description?: string;
  selected?: boolean;
}
export interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  interactive?: boolean;
  /** 작은 배치 지도에서 표시한 호기 범위를 자동으로 맞춘다. 기존 관제는 기본 배율 유지. */
  fitMarkers?: boolean;
  /** 지명 라벨 언어(예: 'ko') — 타일에 name:<locale>가 있으면 우선, 없으면 name */
  labelLocale?: string;
  onselect?: (id: string) => void;
  class?: string;
}
