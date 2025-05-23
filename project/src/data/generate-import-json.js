// Script para gerar arquivos JSON formatados para importação manual
const fs = require('fs');
const path = require('path');

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

// Função para converter timestamps do formato Firestore para o formato Date
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

// Função para gerar arquivos JSON para cada coleção
function generateImportFiles() {
  console.log('Gerando arquivos JSON para importação manual...');
  
  // Diretório para os arquivos de saída
  const outputDir = path.join(__dirname, 'import-files');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Gerar arquivo para teatros
  if (data.teatros) {
    const teatros = {};
    for (const [id, teatro] of Object.entries(data.teatros)) {
      teatros[id] = convertTimestamps(teatro);
    }
    
    const teatrosPath = path.join(outputDir, 'teatros.json');
    fs.writeFileSync(teatrosPath, JSON.stringify(teatros, null, 2));
    console.log(`✓ Arquivo de teatros gerado: ${teatrosPath}`);
  }
  
  // Gerar arquivo para eventos
  if (data.eventos) {
    const eventos = {};
    for (const [id, evento] of Object.entries(data.eventos)) {
      eventos[id] = convertTimestamps(evento);
    }
    
    const eventosPath = path.join(outputDir, 'eventos.json');
    fs.writeFileSync(eventosPath, JSON.stringify(eventos, null, 2));
    console.log(`✓ Arquivo de eventos gerado: ${eventosPath}`);
  }
  
  // Gerar arquivo para usuários
  if (data.users) {
    const users = {};
    for (const [id, user] of Object.entries(data.users)) {
      users[id] = convertTimestamps(user);
    }
    
    const usersPath = path.join(outputDir, 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log(`✓ Arquivo de usuários gerado: ${usersPath}`);
  }
  
  // Gerar um arquivo README com instruções
  const readmePath = path.join(outputDir, 'README.txt');
  const readmeContent = `
INSTRUÇÕES PARA IMPORTAÇÃO MANUAL NO FIREBASE

Os arquivos neste diretório contêm dados formatados para importação manual no Firebase.
Siga as instruções abaixo para importar os dados:

1. Acesse o Console do Firebase: https://console.firebase.google.com/
2. Selecione seu projeto: servefirst-4d431
3. Navegue até "Firestore Database" no menu lateral
4. Para cada coleção que deseja importar:
   - Clique em "Iniciar coleção" (ou "Adicionar coleção" se já existirem coleções)
   - Digite o nome da coleção (ex: "teatros", "eventos", "users")
   - Para cada documento no arquivo JSON correspondente:
     - Clique em "Adicionar documento"
     - Digite o ID do documento (a chave no JSON)
     - Adicione cada campo com seu valor correspondente
     - Para campos do tipo timestamp, use o formato de data e hora do Firestore
     - Para campos do tipo array, adicione cada item individualmente
     - Para campos do tipo objeto, crie um mapa com os campos aninhados

Observações:
- Os timestamps foram convertidos para strings no formato ISO (ex: "2023-01-01T12:00:00.000Z")
- Ao importar no Firestore, você precisará convertê-los de volta para o tipo timestamp
- Os arrays foram preservados como arrays
- Os objetos aninhados foram preservados como objetos
`;
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✓ Arquivo README gerado: ${readmePath}`);
  
  console.log('\n✅ Geração de arquivos concluída!');
  console.log(`\nOs arquivos foram gerados no diretório: ${outputDir}`);
}

// Executar a geração de arquivos
generateImportFiles(); 