import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYfx7_J2ytajSGVRZp49pgOlbr1hQCXGo",
  authDomain: "servefirst-4d431.firebaseapp.com",
  databaseURL: "https://servefirst-4d431-default-rtdb.firebaseio.com",
  projectId: "servefirst-4d431",
  storageBucket: "servefirst-4d431.firebasestorage.app",
  messagingSenderId: "202211771576",
  appId: "1:202211771576:web:ef55e0103774742122204d",
  measurementId: "G-VDENK2RHN9"
};

// Initialize Firebase - verificar se o app já foi inicializado
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Error handling
export const handleFirebaseError = (error: any) => {
  console.error('Firebase error:', error);
  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        console.error('Permissão negada. O usuário não tem acesso a este recurso.');
        break;
      case 'not-found':
        console.error('Documento não encontrado.');
        break;
      case 'already-exists':
        console.error('Documento já existe.');
        break;
      case 'failed-precondition':
        console.error('Falha na pré-condição. Verifique se todos os requisitos foram atendidos.');
        break;
      default:
        console.error(`Erro do Firebase: ${error.code}`);
    }
  }
};