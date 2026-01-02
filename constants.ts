/**
 * Configuración de API Keys y Endpoints
 * La Key se carga desde las variables de entorno (Vercel)
 */
export const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY; 

export const API_ENDPOINTS = {
  GEOCODE: 'https://api.openrouteservice.org/geocode/search',
  REVERSE_GEOCODE: 'https://api.openrouteservice.org/geocode/reverse',
  OPTIMIZATION: 'https://api.openrouteservice.org/optimization',
};

// Vi que ya está centrada en La Plata, ¡excelente!
export const DEFAULT_CENTER: [number, number] = [-34.9214, -57.9545];
