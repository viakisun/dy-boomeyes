import type { EquipmentState } from '@boomeyes/domain';
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  state: EquipmentState;
  label: string;
  selected?: boolean;
}
export interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  interactive?: boolean;
  onselect?: (id: string) => void;
  class?: string;
}
