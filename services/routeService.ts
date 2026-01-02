import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { SavedRoute, Stop, RouteData } from '../types';

const COLLECTION_NAME = 'rutas';

// Definimos la estructura exacta de lo que guardamos en la base de datos
interface RouteDocument {
  name: string;
  date: string;       
  createdAt: any;     
  stops: Stop[];
  // Campos para métricas (KPIs)
  totalDistance: number; 
  totalDuration: number;
  stopCount: number;
}

// --- FUNCIÓN 1: GUARDAR RUTA (Con Métricas y Limpieza) ---
export const saveRouteToCloud = async (name: string, stops: Stop[], routeData: RouteData | null) => {
  try {
    // 1. SANITIZACIÓN: Limpiamos los datos para evitar errores de "undefined" en Firebase
    const sanitizedStops = stops.map(stop => ({
      ...stop,
      order: stop.order ?? null, 
      comment: stop.comment || "", 
      timeWindow: stop.timeWindow || null 
    }));

    // 2. PREPARACIÓN: Armamos el objeto con datos extra para el dashboard
    const docData: RouteDocument = {
      name,
      date: new Date().toLocaleDateString(),
      createdAt: Timestamp.now(),
      stops: sanitizedStops,
      // Guardamos las métricas calculadas (si no hay ruta calculada, van en 0)
      totalDistance: routeData ? routeData.distance : 0,
      totalDuration: routeData ? routeData.duration : 0,
      stopCount: stops.length
    };

    // 3. ENVÍO: Subimos a la nube
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    console.log("Ruta guardada exitosamente con ID: ", docRef.id);
    
    return { ...docData, id: docRef.id };
  } catch (e) {
    console.error("Error al guardar ruta en Firebase: ", e);
    throw e;
  }
};

// --- FUNCIÓN 2: LEER RUTAS (Recuperando Métricas) ---
export const getRoutesFromCloud = async (): Promise<SavedRoute[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as RouteDocument;
      return {
        id: doc.id,
        name: data.name,
        date: data.date,
        stops: data.stops,
        // MAPEO DE KPIs: Leemos los datos para el gráfico
        // (Usamos || 0 por si es una ruta vieja que no tenía estos datos)
        totalDistance: data.totalDistance || 0, 
        totalDuration: data.totalDuration || 0,
        stopCount: data.stopCount || 0
      };
    });
  } catch (e) {
    console.error("Error al leer rutas de Firebase: ", e);
    return [];
  }
};
