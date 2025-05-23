// Script para importar dados para o Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB6FftMvI0jt38tsQRvY7Q6BH6d37SrOdY",
  authDomain: "servefirst-temp.firebaseapp.com",
  databaseURL: "https://servefirst-temp-default-rtdb.firebaseio.com",
  projectId: "servefirst-temp",
  storageBucket: "servefirst-temp.appspot.com",
  messagingSenderId: "232347459779",
  appId: "1:232347459779:web:4e7a3b825ede1c99cadf33"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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

// Função para converter timestamps do formato Firestore para ISO strings
function convertTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    // Verificar se é um timestamp do Firestore
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      // Criar um objeto Date a partir dos segundos
      const date = new Date(value._seconds * 1000);
      // Substituir pelo objeto Date formatado como string ISO
      result[key] = date.toISOString();
    } 
    // Recursivamente converter timestamps em objetos aninhados
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertTimestamps(value);
    }
    // Recursivamente converter timestamps em arrays
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return convertTimestamps(item);
        }
        return item;
      });
    }
  });
  
  return result;
}

// Função para importar dados para o Realtime Database
async function importData() {
  console.log('Iniciando importação de dados para o Realtime Database...');
  
  // Converter todos os timestamps antes da importação
  const dataConverted = convertTimestamps(data);
  
  // Importar objetos para o Realtime Database
  try {
    // Importar toda a estrutura de dados de uma vez
    await set(ref(db, '/'), dataConverted);
    console.log('✅ Todos os dados foram importados com sucesso para o Realtime Database!');
  } catch (error) {
    console.error('❌ Erro ao importar dados:', error);
  }
}

// Executar a função de importação
importData()
  .then(() => {
    console.log('Processo de importação concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro durante o processo de importação:', error);
    process.exit(1);
  }); 