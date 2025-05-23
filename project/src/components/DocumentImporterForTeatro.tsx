import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';

interface DocumentImporterForTeatroProps {
  onTextImported: (text: string) => void;
  importingFor: 'cenario' | 'figurino' | 'roteiro';
  isLoading?: boolean;
}

const DocumentImporterForTeatro: React.FC<DocumentImporterForTeatroProps> = ({ 
  onTextImported, 
  importingFor,
  isLoading: externalLoading = false
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isLoading = externalLoading || internalLoading;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Arquivo selecionado em DocumentImporterForTeatro:', file.name, file.type);
    setInternalLoading(true);
    setError(null);
    
    try {
      let extractedText = '';
      
      // Para documentos DOCX
      if (file.name.endsWith('.docx')) {
        console.log('Processando arquivo DOCX');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
        console.log('Texto extraído do DOCX, comprimento:', extractedText.length);
      } 
      // Para arquivos de texto
      else if (file.name.endsWith('.txt')) {
        console.log('Processando arquivo TXT');
        extractedText = await file.text();
        console.log('Texto extraído do TXT, comprimento:', extractedText.length);
      } 
      // Outros formatos
      else {
        throw new Error(`Formato de arquivo não suportado: ${file.type}. Use .docx ou .txt`);
      }
      
      // Chamar o callback com o texto extraído
      if (extractedText) {
        onTextImported(extractedText);
      } else {
        throw new Error('Não foi possível extrair texto do documento');
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo');
    } finally {
      setInternalLoading(false);
      
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Mapear o tipo para um texto mais amigável
  const getImportingForText = () => {
    switch (importingFor) {
      case 'cenario': return 'Cenário';
      case 'figurino': return 'Figurino';
      case 'roteiro': return 'Roteiro';
      default: return 'Documento';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".docx,.txt"
        onChange={handleFileChange}
      />
      
      <button
        onClick={handleImportClick}
        disabled={isLoading}
        style={{
          backgroundColor: '#fc6c5f',
          color: 'white',
          padding: '12px 0',
          borderRadius: '20px',
          border: 'none',
          width: '100%',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Importando...' : `Importar ${getImportingForText()}`}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ffeeee', 
          borderRadius: '8px',
          color: '#cc0000',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentImporterForTeatro;
