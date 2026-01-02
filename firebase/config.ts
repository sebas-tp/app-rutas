// 1. Importamos las funciones necesarias
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <--- ESTO ES CRUCIAL

// 2. Tu configuración (la misma que ya tenías)
const firebaseConfig = {
  apiKey: "AIzaSyDsTnvr9JcrgGoeFmKKA-fHIal6o8RULZ4",
  authDomain: "app-rutas-f63f5.firebaseapp.com",
  projectId: "app-rutas-f63f5",
  storageBucket: "app-rutas-f63f5.firebasestorage.app",
  messagingSenderId: "227057729878",
  appId: "1:227057729878:web:08e7457f4bbcfdb5b096f7",
  measurementId: "G-7T9R6RHKJT"
};

// 3. Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// 4. Inicializamos y EXPORTAMOS la base de datos (db)
// El error ocurría porque esta línea faltaba o era diferente
export const db = getFirestore(app);
