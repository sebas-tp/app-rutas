// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDsTnvr9JcrgGoeFmKKA-fHIal6o8RULZ4",
  authDomain: "app-rutas-f63f5.firebaseapp.com",
  projectId: "app-rutas-f63f5",
  storageBucket: "app-rutas-f63f5.firebasestorage.app",
  messagingSenderId: "227057729878",
  appId: "1:227057729878:web:08e7457f4bbcfdb5b096f7",
  measurementId: "G-7T9R6RHKJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);