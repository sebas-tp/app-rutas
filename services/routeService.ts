import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { SavedRoute, Stop, RouteData } from '../types';

const COLLECTION_NAME = 'rutas';

interface RouteDocument {
  name: string;
  date: string;       
  createdAt: any;     
  stops: Stop[];
  // Campos para métricas
  totalDistance: number; 
  totalDuration: number;
  stopCount: number;
}

// --- FUNCIÓN 1: GUARDAR RUTA ---
export const saveRouteToCloud = async (name: string, stops: Stop[], routeData: RouteData | null) => {
  try {
    const sanitizedStops = stops.map(stop => ({
      ...stop,
      order: stop.order ?? null, 
      comment: stop.comment || "", 
      timeWindow: stop.timeWindow || null 
    }));

    const docData: RouteDocument = {
      name,
      date: new Date().toLocaleDateString(),
      createdAt: Timestamp.now(),
      stops: sanitizedStops,
      totalDistance: routeData ? routeData.distance : 0,
      totalDuration: routeData ? routeData.duration : 0,
      stopCount: stops.length
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    console.log("Ruta guardada exitosamente con ID: ", docRef.id);
    
    return { ...docData, id: docRef.id };
  } catch (e) {
    console.error("Error al guardar ruta en Firebase: ", e);
    throw e;
  }
};

// --- FUNCIÓN 2: LEER RUTAS ---
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

// --- FUNCIÓN 3: BORRAR RUTA (NUEVA) ---
export const deleteRouteFromCloud = async (id: string) => {
  try {
    const routeRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(routeRef);
    console.log("Ruta eliminada:", id);
  } catch (e) {
    console.error("Error al borrar ruta:", e);
    throw e;
  }
};
