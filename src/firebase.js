import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Konfiguracija Firebase projekta EventPlanner
const firebaseConfig = {
  apiKey: "AIzaSyC9j87eNuWeUiGPOX7zjjJafcdJ0wQoX5c",
  authDomain: "eventplanner-30440.firebaseapp.com",
  projectId: "eventplanner-30440",
  storageBucket: "eventplanner-30440.firebasestorage.app",
  messagingSenderId: "850175175625",
  appId: "1:850175175625:web:f18b138b0260eb3e729618"
};

// Inicijalizacija Firebase aplikacije (v8 namespaced API)
firebase.initializeApp(firebaseConfig);

// Instance za autentifikaciju i Firestore — uvozi ih u komponentama/rutama
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;
