// Script para importar dados para o Firebase usando a API REST
const fs = require('fs');
const path = require('path');
const https = require('https');

// URL base do Firestore REST API
const projectId = 'servefirst-4d431';
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

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

// Função para converter timestamps do formato Firestore para o formato da API REST
function convertTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    // Verificar se é um timestamp do Firestore
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      // Criar um timestamp no formato da API REST
      result[key] = {
        timestampValue: new Date(value._seconds * 1000).toISOString()
      };
    } 
    // Verificar se é um array
    else if (Array.isArray(value)) {
      result[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') {
              return { stringValue: item };
            } else if (typeof item === 'number') {
              return { integerValue: item };
            } else if (typeof item === 'boolean') {
              return { booleanValue: item };
            } else if (item && typeof item === 'object') {
              return { mapValue: { fields: convertTimestamps(item) } };
            }
            return null;
          })
        }
      };
    }
    // Verificar se é um objeto
    else if (value && typeof value === 'object') {
      result[key] = {
        mapValue: {
          fields: convertTimestamps(value)
        }
      };
    }
    // Valores primitivos
    else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      result[key] = { integerValue: value };
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (value === null) {
      result[key] = { nullValue: null };
    }
  });
  
  return result;
}

// Função para fazer uma requisição HTTP
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`Status: ${res.statusCode}, Response: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Função para importar dados
async function importData() {
  console.log('Iniciando importação de dados...');
  
  // Importar teatros
  console.log('\nImportando teatros:');
  for (const [id, teatro] of Object.entries(data.teatros || {})) {
    try {
      const convertedTeatro = { fields: convertTimestamps(teatro) };
      const url = `${baseUrl}/teatros/${id}`;
      await makeRequest(url, 'PATCH', convertedTeatro);
      console.log(`✓ Teatro importado: ${id} - ${teatro.titulo}`);
    } catch (error) {
      console.error(`✗ Erro ao importar teatro ${id}:`, error.message);
    }
  }
  
  // Importar eventos
  console.log('\nImportando eventos:');
  for (const [id, evento] of Object.entries(data.eventos || {})) {
    try {
      const convertedEvento = { fields: convertTimestamps(evento) };
      const url = `${baseUrl}/eventos/${id}`;
      await makeRequest(url, 'PATCH', convertedEvento);
      console.log(`✓ Evento importado: ${id} - ${evento.titulo}`);
    } catch (error) {
      console.error(`✗ Erro ao importar evento ${id}:`, error.message);
    }
  }
  
  // Importar usuários
  console.log('\nImportando usuários:');
  for (const [id, user] of Object.entries(data.users || {})) {
    try {
      const convertedUser = { fields: convertTimestamps(user) };
      const url = `${baseUrl}/users/${id}`;
      await makeRequest(url, 'PATCH', convertedUser);
      console.log(`✓ Usuário importado: ${id} - ${user.email}`);
    } catch (error) {
      console.error(`✗ Erro ao importar usuário ${id}:`, error.message);
    }
  }
  
  console.log('\n✅ Importação concluída!');
}

// Executar a importação
importData().catch(error => {
  console.error('Erro durante a importação:', error);
  process.exit(1);
}); 