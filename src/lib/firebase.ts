import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuração demo atualizada
const firebaseConfig = {
  apiKey: "AIzaSyBXYqR-lI4Sd5rTbhG4zCU8hU4zXTQqUW0",
  authDomain: "servefirst-teste.firebaseapp.com",
  projectId: "servefirst-teste",
  storageBucket: "servefirst-teste.appspot.com",
  messagingSenderId: "475631891876",
  appId: "1:475631891876:web:1ec8ab3381efb5bc0fc95b"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Flag para habilitar modo de desenvolvedor (offline)
const DEV_MODE = true;

// Configurar Firestore para modo offline
if (DEV_MODE) {
  console.log("🔥 Firebase em modo de desenvolvimento/offline");
  
  // Tenta habilitar persistência offline
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("✅ Persistência offline habilitada");
    })
    .catch((err) => {
      console.error("❌ Erro ao habilitar persistência offline:", err);
      if (err.code === 'failed-precondition') {
        console.log("⚠️ Múltiplas abas abertas. Apenas uma aba pode usar persistência offline.");
      } else if (err.code === 'unimplemented') {
        console.log("⚠️ Navegador não suporta persistência offline.");
      }
    });
} else {
  console.log("🔥 Firebase conectado ao projeto real");
}

export default app; 