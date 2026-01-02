
/**
 * 1. Regístrate en https://openrouteservice.org/dev/#/signup
 * 2. Copia tu API Key (Token de 64 caracteres hexadecimales)
 * 3. Reemplaza el valor de abajo
 */
export const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImI5ODA3ODY1Mzk2MjQzNGY4YzExNDlhZGI1ZmQ0YTZmIiwiaCI6Im11cm11cjY0In0='; 

export const API_ENDPOINTS = {
  GEOCODE: 'https://api.openrouteservice.org/geocode/search',
  REVERSE_GEOCODE: 'https://api.openrouteservice.org/geocode/reverse',
  OPTIMIZATION: 'https://api.openrouteservice.org/optimization',
};

export const DEFAULT_CENTER: [number, number] = [-34.9214, -57.9545]; // La Plata, Argentina
