
export interface GeoPoint {
  lat: number;
  lng: number;
}

export type StopType = 'cliente' | 'proveedor';

export interface TimeWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface Stop extends GeoPoint {
  id: string;
  address: string;
  isDepot: boolean;
  type: StopType;
  comment?: string;
  timeWindow?: TimeWindow;
  order?: number;
  arrival?: number; // segundos desde inicio del día
}

export interface RouteData {
  distance: number;
  duration: number;
  geometry: [number, number][];
  steps: any[];
}

export interface GeocodingResult {
  label: string;
  coordinates: [number, number];
  isFromCoords?: boolean;
}

export interface SavedRoute {
  id: string;
  name: string;
  date: string;
  stops: Stop[];
}
