// Script para importar dados para o Firebase usando a configuração do aplicativo web
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Configuração do Firebase fornecida
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Carregar dados do arquivo JSON
let data;
try {
  const jsonPath = path.join(__dirname, 'firebase-import.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf8');
  data = JSON.parse(jsonData);
  console.log('Dados JSON carregados com sucesso.');
} catch (error) {
  console.error('Erro ao carregar o arquivo JSON:', error);
  process.exit(1);
}

// Função para converter timestamps do formato Firestore
function convertTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Verificar se é um timestamp do Firestore
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      // Criar um objeto Date a partir dos segundos
      const date = new Date(value._seconds * 1000);
      // Substituir pelo objeto Date
      obj[key] = date;
    } 
    // Recursivamente converter timestamps em objetos aninhados
    else if (value && typeof value === 'object') {
      convertTimestamps(value);
    }
  });
  
  return obj;
}

// Função para importar dados
async function importData() {
  console.log('Iniciando importação de dados...');
  
  // Importar teatros
  console.log('\nImportando teatros:');
  for (const [id, teatro] of Object.entries(data.teatros || {})) {
    try {
      const convertedTeatro = convertTimestamps(teatro);
      await setDoc(doc(db, 'teatros', id), convertedTeatro);
      console.log(`✓ Teatro importado: ${id} - ${teatro.titulo}`);
    } catch (error) {
      console.error(`✗ Erro ao importar teatro ${id}:`, error);
    }
  }
  
  // Importar eventos
  console.log('\nImportando eventos:');
  for (const [id, evento] of Object.entries(data.eventos || {})) {
    try {
      const convertedEvento = convertTimestamps(evento);
      await setDoc(doc(db, 'eventos', id), convertedEvento);
      console.log(`✓ Evento importado: ${id} - ${evento.titulo}`);
    } catch (error) {
      console.error(`✗ Erro ao importar evento ${id}:`, error);
    }
  }
  
  // Importar usuários
  console.log('\nImportando usuários:');
  for (const [id, user] of Object.entries(data.users || {})) {
    try {
      const convertedUser = convertTimestamps(user);
      await setDoc(doc(db, 'users', id), convertedUser);
      console.log(`✓ Usuário importado: ${id} - ${user.email}`);
    } catch (error) {
      console.error(`✗ Erro ao importar usuário ${id}:`, error);
    }
  }
  
  console.log('\n✅ Importação concluída!');
}

// Executar a importação
importData().catch(error => {
  console.error('Erro durante a importação:', error);
  process.exit(1);
}); 