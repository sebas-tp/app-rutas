import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { SavedRoute, Stop, RouteData } from '../types';

// Nombre de la colección en Firebase (equivalente a una "carpeta" o "tabla")
const COLLECTION_NAME = 'rutas';

// Definimos qué datos exactos vamos a guardar en cada documento
interface RouteDocument {
  name: string;
  date: string;       // Fecha legible (ej: "2/1/2026")
  createdAt: any;     // Marca de tiempo exacta para ordenar
  stops: Stop[];
  // Datos extra para futuras métricas del panel de gerente:
  totalDistance: number; 
  totalDuration: number;
  stopCount: number;
}

// --- FUNCIÓN 1: GUARDAR RUTA EN LA NUBE ---
export const saveRouteToCloud = async (name: string, stops: Stop[], routeData: RouteData | null) => {
  try {
    const docData: RouteDocument = {
      name,
      date: new Date().toLocaleDateString(),
      createdAt: Timestamp.now(), // Usamos la hora del servidor
      stops,
      // Guardamos métricas clave ahora (aunque no las mostremos todavía)
      // para poder hacer gráficos en el futuro.
      totalDistance: routeData ? routeData.distance : 0,
      totalDuration: routeData ? routeData.duration : 0,
      stopCount: stops.length
    };

    // "addDoc" crea un documento nuevo con un ID autogenerado único
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    console.log("Ruta guardada exitosamente con ID: ", docRef.id);
    
    return { ...docData, id: docRef.id };
  } catch (e) {
    console.error("Error al guardar ruta en Firebase: ", e);
    throw e; // Relanzamos el error para manejarlo en la UI
  }
};

// --- FUNCIÓN 2: LEER RUTAS DE LA NUBE ---
export const getRoutesFromCloud = async (): Promise<SavedRoute[]> => {
  try {
    // Pedimos la colección 'rutas', ordenadas por 'createdAt' descendente (nuevas primero)
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    
    // Convertimos los documentos de Firebase a nuestro formato 'SavedRoute'
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
    // Si falla (ej: sin internet), devolvemos lista vacía para que la app no se rompa
    return [];
  }
};
