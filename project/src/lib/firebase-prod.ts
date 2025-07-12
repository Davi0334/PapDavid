import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYfx7_J2ytajSGVRZp49pgOlbr1hQCXGo",
  authDomain: "servefirst-4d431.firebaseapp.com",
  projectId: "servefirst-4d431",
  storageBucket: "servefirst-4d431.appspot.com",
  messagingSenderId: "202211771576",
  appId: "1:202211771576:web:ef55e0103774742122204d"
};

// Initialize Firebase
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Auth
export const auth = getAuth(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('Auth persistence set to local'))
  .catch(error => console.error('Error setting auth persistence:', error));

// Initialize other services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics in production only
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Simple connection check function
export const attemptReconnect = async (): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(1));
    await getDocs(q);
    return true;
  } catch (error) {
    console.error('Error attempting to reconnect:', error);
    return false;
  }
};

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
