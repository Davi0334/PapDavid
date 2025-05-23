import React, { useState } from 'react';
import DocumentImporter from './DocumentImporter';

const ImporterExample: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [fieldToUpdate, setFieldToUpdate] = useState<string>('roteiro');

  // Função para lidar com o texto extraído do documento
  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    
    // Exemplo: Aqui você poderia integrar com o estado do Teatro
    // Por exemplo: setRoteiro(text) ou setFigurino(text)
    console.log(`Texto extraído (${text.length} caracteres) para o campo: ${fieldToUpdate}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Importar Documento</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Escolha onde aplicar o texto:
        </label>
        <select
          value={fieldToUpdate}
          onChange={(e) => setFieldToUpdate(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            width: '100%',
            marginBottom: '15px'
          }}
        >
          <option value="roteiro">Roteiro</option>
          <option value="figurino">Figurino</option>
          <option value="cenario">Cenário</option>
          <option value="descricao">Descrição</option>
        </select>
        
        <DocumentImporter onTextExtracted={handleTextExtracted} />
      </div>
      
      {extractedText && (
        <div>
          <h4>Prévia do texto extraído:</h4>
          <div
            style={{
              padding: '15px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {extractedText.length > 1000 
              ? `${extractedText.substring(0, 1000)}... (${extractedText.length - 1000} caracteres adicionais)`
              : extractedText
            }
          </div>
          
          <button
            onClick={() => setExtractedText('')}
            style={{
              backgroundColor: '#041e42',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '8px',
              border: 'none',
              marginTop: '15px',
              cursor: 'pointer'
            }}
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  );
};

export default ImporterExample;