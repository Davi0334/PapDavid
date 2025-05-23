
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
