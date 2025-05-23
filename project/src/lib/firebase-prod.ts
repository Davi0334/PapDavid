import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, browserSessionPersistence, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYfx7_J2ytajSGVRZp49pgOlbr1hQCXGo",
  authDomain: "servefirst-4d431.firebaseapp.com",
  databaseURL: "https://servefirst-4d431-default-rtdb.firebaseio.com",
  projectId: "servefirst-4d431",
  storageBucket: "servefirst-4d431.appspot.com",
  messagingSenderId: "202211771576",
  appId: "1:202211771576:web:ef55e0103774742122204d",
  measurementId: "G-VDENK2RHN9"
};

// Initialize Firebase - check if app already exists
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Configure auth persistence based on environment
export const configurePersistence = async () => {
  try {
    // Log current domain for debugging
    const currentDomain = window.location.hostname;
    console.log('Current domain:', currentDomain);
    console.log('Full URL:', window.location.href);
    
    // Check if we're in production or development
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');
    
    if (isLocalhost) {
      // In local development, use local persistence (most permissive)
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase Auth: Using browser local persistence (development)');
    } else {
      // In production, use session persistence (more secure)
      await setPersistence(auth, browserSessionPersistence);
      console.log('Firebase Auth: Using browser session persistence (production)');
      
      // Alert if domain might not be authorized
      console.warn('⚠️ If authentication fails, you may need to add this domain to Firebase authorized domains');
      console.warn('Visit Firebase Console > Authentication > Settings > Authorized domains');
      console.warn('Add: ' + currentDomain);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    
    // Fallback to in-memory persistence as last resort
    try {
      await setPersistence(auth, inMemoryPersistence);
      console.log('Firebase Auth: Fallback to in-memory persistence');
      return true;
    } catch (fallbackError) {
      console.error('Critical error setting auth persistence:', fallbackError);
      return false;
    }
  }
};

// Call configurePersistence when module loads
if (typeof window !== 'undefined') {
  configurePersistence().catch(err => console.error('Failed to initialize auth persistence:', err));
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
