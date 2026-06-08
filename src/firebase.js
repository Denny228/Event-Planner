import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Konfiguracija Firebase projekta EventPlanner
const firebaseConfig = {
  apiKey: "AIzaSyCv0_I247M10qR3LrNOVZqoHQkL9AUDqf4",
  authDomain: "eventplanner-7f975.firebaseapp.com",
  projectId: "eventplanner-7f975",
  storageBucket: "eventplanner-7f975.firebasestorage.app",
  messagingSenderId: "823496324194",
  appId: "1:823496324194:web:5196a73bc8776abb164d3b"
};

// Inicijalizacija Firebase aplikacije (v8 namespaced API)
firebase.initializeApp(firebaseConfig);

// Instance za autentifikaciju i Firestore — uvozi ih u komponentama/rutama
export const auth = firebase.auth();
export const db = firebase.firestore();

export default firebase;
