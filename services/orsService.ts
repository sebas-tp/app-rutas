
import { ORS_API_KEY, API_ENDPOINTS } from '../constants';
import { GeocodingResult, Stop, RouteData } from '../types';
import { decodePolyline } from '../utils/polyline';

// Convierte "HH:mm" a segundos desde las 00:00
const timeToSeconds = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
};

export const geocodeSearch = async (text: string): Promise<GeocodingResult[]> => {
  const cleanKey = ORS_API_KEY.trim();
  const url = `${API_ENDPOINTS.GEOCODE}?api_key=${cleanKey}&text=${encodeURIComponent(text)}&size=5`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error en búsqueda');
    const data = await response.json();
    return data.features?.map((f: any) => ({
      label: f.properties.label,
      coordinates: f.geometry.coordinates,
    })) || [];
  } catch (error) {
    return [];
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const cleanKey = ORS_API_KEY.trim();
  const url = `${API_ENDPOINTS.REVERSE_GEOCODE}?api_key=${cleanKey}&point.lon=${lng}&point.lat=${lat}&size=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.features?.[0]?.properties.label || `Punto en ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    return `Punto en ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const optimizeRoute = async (stops: Stop[]): Promise<RouteData> => {
  const cleanKey = ORS_API_KEY.trim();
  const depot = stops.find(s => s.isDepot) || stops[0];
  
  // Mapeo de trabajos con ventanas de tiempo
  const jobs = stops
    .filter(s => !s.isDepot)
    .map((s, index) => {
      const job: any = {
        id: index + 1,
        location: [s.lng, s.lat],
        service: 600, // 10 min de espera por defecto
      };
      if (s.timeWindow?.start && s.timeWindow?.end) {
        job.time_windows = [[
          timeToSeconds(s.timeWindow.start),
          timeToSeconds(s.timeWindow.end)
        ]];
      }
      return job;
    });

  const body = {
    jobs,
    vehicles: [{
      id: 1,
      profile: 'driving-car',
      start: [depot.lng, depot.lat],
      end: [depot.lng, depot.lat],
      // Ventana de trabajo del vehículo (ej: 07:00 a 20:00)
      time_window: [25200, 72000] 
    }],
    options: { g: true },
  };

  const response = await fetch(`${API_ENDPOINTS.OPTIMIZATION}?api_key=${cleanKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error de optimización (posiblemente horarios imposibles)');
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No se encontró una ruta válida para esos horarios');

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: decodePolyline(route.geometry),
    steps: route.steps,
  };
};
