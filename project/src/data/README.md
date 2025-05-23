# Instruções para Importação de Dados no Firebase

Este diretório contém um arquivo JSON (`firebase-import.json`) com dados de exemplo para o aplicativo ServeFirst. Siga as instruções abaixo para importar esses dados para o seu projeto Firebase.

## Conteúdo do Arquivo

O arquivo JSON contém dados de exemplo para as seguintes coleções:

- **teatros**: Peças de teatro com detalhes como título, descrição, datas de ensaio, etc.
- **eventos**: Eventos relacionados às peças de teatro
- **users**: Usuários do sistema com diferentes funções (admin, user)

## Importar para Realtime Database (Recomendado)

O projeto foi atualizado para usar o Firebase Realtime Database. Este método é mais simples e eficiente:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Abra um terminal neste diretório (`project/src/data`)
3. Instale as dependências:
   ```
   npm install firebase
   ```
4. Execute o script de importação para Realtime Database:
   ```
   node import-data-realtime.js
   ```

## Instalação Rápida (Firestore - Legado)

Se ainda precisar usar o Firestore:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Abra um terminal neste diretório (`project/src/data`)
3. Instale as dependências:
   ```
   npm install
   ```
4. Execute o script de importação:
   ```
   npm run import
   ```

## Configuração das Regras de Segurança do Realtime Database

Para o Realtime Database, você precisará configurar as regras de segurança:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto (`servefirst-temp`)
3. Navegue até "Realtime Database" no menu lateral
4. Clique na aba "Regras"
5. Substitua as regras existentes pelas seguintes (temporariamente para importação):

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

6. Clique em "Publicar"
7. Após a importação, considere regras mais restritivas para produção.

## Configuração das Regras de Segurança do Firestore (Legado)

Se ainda estiver usando Firestore, configure suas regras:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto (`servefirst-temp`)
3. Navegue até "Firestore Database" no menu lateral
4. Clique na aba "Regras"
5. Substitua as regras existentes pelas seguintes (temporariamente para importação):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Clique em "Publicar"
7. Após a importação, recomenda-se restaurar regras mais seguras.

## Métodos de Importação Detalhados

### Método 1: Usando o Script de Importação Direta (Recomendado)

Este método usa diretamente as credenciais do seu aplicativo web Firebase:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Instale as dependências necessárias:
   ```
   npm install
   ```
3. Execute o script de importação direta:
   ```
   npm run import
   ```
   ou diretamente:
   ```
   node import-data-direct.js
   ```

O script `import-data-direct.js` já contém a configuração do Firebase do seu projeto e importará automaticamente todos os dados do arquivo `firebase-import.json` para o Firestore.

### Método 1B: Usando o Script de Importação com Admin SDK (Contorna Regras de Segurança)

Este método usa o Firebase Admin SDK, que contorna as regras de segurança do Firestore:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Instale as dependências necessárias:
   ```
   npm install
   ```
3. Execute o script de importação com Admin SDK:
   ```
   npm run import-admin
   ```
   ou diretamente:
   ```
   node import-data-admin.js
   ```

**Nota**: Este método pode exigir configuração adicional se você estiver executando localmente. Você pode precisar baixar um arquivo `serviceAccountKey.json` do Console do Firebase (Configurações do Projeto > Contas de serviço) e descomentar a linha relevante no script.

### Método 1C: Usando o Script de Importação com API REST

Este método usa a API REST do Firebase, que é uma alternativa mais simples:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Instale as dependências necessárias:
   ```
   npm install
   ```
3. Execute o script de importação com API REST:
   ```
   npm run import-rest
   ```
   ou diretamente:
   ```
   node import-data-rest.js
   ```

**Nota**: Este método requer que as regras de segurança do Firestore permitam acesso público para funcionar. Certifique-se de configurar as regras conforme descrito na seção "Configuração das Regras de Segurança do Firestore".

### Método 1D: Gerando Arquivos JSON para Importação Manual

Este método gera arquivos JSON formatados para importação manual através do Console do Firebase:

1. Certifique-se de ter o Node.js instalado em seu computador
2. Instale as dependências necessárias:
   ```
   npm install
   ```
3. Execute o script de geração de arquivos JSON:
   ```
   npm run generate-json
   ```
   ou diretamente:
   ```
   node generate-import-json.js
   ```

O script irá gerar arquivos JSON para cada coleção no diretório `import-files`, junto com um arquivo README.txt contendo instruções detalhadas para importação manual.

### Método 2: Usando o Console do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto (`servefirst-4d431`)
3. Navegue até "Firestore Database" no menu lateral
4. Para cada coleção que deseja importar:
   - Clique em "Iniciar coleção" (ou "Adicionar coleção" se já existirem coleções)
   - Digite o nome da coleção (ex: "teatros", "eventos", "users")
   - Adicione documentos manualmente com os IDs e campos correspondentes do arquivo JSON

### Método 3: Usando a Ferramenta de Linha de Comando do Firebase

1. Instale o Firebase CLI se ainda não tiver instalado:
   ```
   npm install -g firebase-tools
   ```

2. Faça login na sua conta Firebase:
   ```
   firebase login
   ```

3. Inicialize seu projeto Firebase (se ainda não estiver inicializado):
   ```
   firebase init firestore
   ```

4. Use o script `import-data.js` que requer uma chave de serviço:
   - Baixe a chave de serviço do Console do Firebase (Configurações do Projeto > Contas de serviço)
   - Salve o arquivo como `serviceAccountKey.json` neste diretório
   - Execute o script:
     ```
     npm run import-admin
     ```
     ou diretamente:
     ```
     node import-data.js
     ```

## Observações Importantes

- Os timestamps no arquivo JSON estão no formato do Firestore (`_seconds` e `_nanoseconds`).
- Os IDs dos documentos são definidos como chaves no JSON (ex: "teatro1", "evento1", "user1").
- Certifique-se de que as regras de segurança do Firestore permitam a importação dos dados.
- Após a importação, verifique se os dados foram corretamente importados navegando pelo Console do Firebase.

## Estrutura de Dados

### Teatros
Cada documento na coleção `teatros` contém:
- `titulo`: Nome da peça
- `descricao`: Descrição da peça
- `diasEnsaio`: Array com os dias de ensaio
- `dataApresentacao`: Timestamp da data de apresentação
- `participantes`: Array com IDs dos usuários participantes
- `criador`: ID do usuário criador
- `dataCriacao`: Timestamp da data de criação
- `alerta`: Boolean indicando se há alertas
- `roteiro`: Texto do roteiro
- `numeroAtos`: Número de atos
- `figurinos`: Array com descrições dos figurinos
- `quantidadeFigurinos`: Número total de figurinos
- `temaFigurinos`: Tema dos figurinos
- `quantidadeCenas`: Número de cenas
- `cenarios`: Array com descrições dos cenários
- `ordemCenarios`: Texto descrevendo a ordem dos cenários

### Eventos
Cada documento na coleção `eventos` contém:
- `titulo`: Nome do evento
- `descricao`: Descrição do evento
- `data`: Timestamp da data do evento
- `local`: Local do evento
- `teatroId`: ID do teatro relacionado (ou null)
- `dataCriacao`: Timestamp da data de criação

### Usuários
Cada documento na coleção `users` contém:
- `email`: Email do usuário
- `role`: Função do usuário ("admin" ou "user")
- `profile`: Objeto com informações do perfil
  - `fullName`: Nome completo
  - `username`: Nome de usuário
  - `avatarUrl`: URL do avatar
- `createdAt`: Timestamp da data de criação 