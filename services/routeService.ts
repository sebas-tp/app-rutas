import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { SavedRoute, Stop, RouteData } from '../types';

const COLLECTION_NAME = 'rutas';

interface RouteDocument {
  name: string;
  date: string;       
  createdAt: any;     
  stops: Stop[];
  totalDistance: number; 
  totalDuration: number;
  stopCount: number;
}

export const saveRouteToCloud = async (name: string, stops: Stop[], routeData: RouteData | null) => {
  try {
    // --- PASO DE LIMPIEZA (SANITIZATION) ---
    // Firebase odia los 'undefined', así que los convertimos a 'null' o strings vacíos
    const sanitizedStops = stops.map(stop => ({
      ...stop,
      // Si order es undefined, lo guardamos como null
      order: stop.order ?? null, 
      // Si comment es undefined, lo guardamos como texto vacío
      comment: stop.comment || "", 
      // Si timeWindow es undefined, lo guardamos como null
      timeWindow: stop.timeWindow || null 
    }));

    const docData: RouteDocument = {
      name,
      date: new Date().toLocaleDateString(),
      createdAt: Timestamp.now(),
      stops: sanitizedStops, // <--- Enviamos la versión limpia
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
        stops: data.stops
      };
    });
  } catch (e) {
    console.error("Error al leer rutas de Firebase: ", e);
    return [];
  }
};
