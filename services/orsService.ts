import { ORS_API_KEY, API_ENDPOINTS } from '../constants';
import { GeocodingResult, Stop, RouteData } from '../types';
import { decodePolyline } from '../utils/polyline';

// Convierte "HH:mm" a segundos desde las 00:00
const timeToSeconds = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
};

// ... (Las funciones de geocodeSearch y reverseGeocode déjalas igual) ...
export const geocodeSearch = async (text: string): Promise<GeocodingResult[]> => {
  // ... (código existente) ...
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
  // ... (código existente) ...
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

// AQUI ESTA EL CAMBIO IMPORTANTE: Agregamos el parámetro 'startTime'
export const optimizeRoute = async (stops: Stop[], startTime: string = "08:00"): Promise<RouteData> => {
  const cleanKey = ORS_API_KEY.trim();
  const depot = stops.find(s => s.isDepot) || stops[0];
  
  // Convertimos la hora de inicio elegida a segundos
  const startSeconds = timeToSeconds(startTime);

  // Mapeo de trabajos
  const jobs = stops
    .filter(s => !s.isDepot)
    .map((s, index) => {
      const job: any = {
        id: index + 1,
        location: [s.lng, s.lat],
        service: 1200, // CAMBIO: 20 minutos (1200 seg) por parada para ser más realistas
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
      // CAMBIO CRÍTICO: El vehículo arranca a la hora que dice el usuario
      // Y trabaja hasta las 22:00 (79200 seg) como límite
      time_window: [startSeconds, 79200] 
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
    // Mensaje de error más amigable si falla por horarios
    throw new Error(errorData.error?.message || 'No se encontró ruta. Revisa si los horarios del Proveedor son posibles con la hora de salida.');
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No se pudo calcular la ruta');

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: decodePolyline(route.geometry),
    steps: route.steps,
  };
};
