// Script para importar dados para o Firebase usando o Admin SDK
// Este script contorna as regras de segurança do Firestore
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar o Firebase Admin SDK
// Nota: Este método não requer um arquivo serviceAccountKey.json
// Ele usa as credenciais padrão do ambiente
admin.initializeApp({
  projectId: 'servefirst-4d431',
  // Se você estiver executando localmente, pode precisar do arquivo serviceAccountKey.json
  // credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();

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

// Função para converter timestamps do formato Firestore para objetos Timestamp do Admin SDK
function convertTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Verificar se é um timestamp do Firestore
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      // Criar um Timestamp do Admin SDK
      obj[key] = admin.firestore.Timestamp.fromMillis(value._seconds * 1000);
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
      await db.collection('teatros').doc(id).set(convertedTeatro);
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
      await db.collection('eventos').doc(id).set(convertedEvento);
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
      await db.collection('users').doc(id).set(convertedUser);
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