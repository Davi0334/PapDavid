import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';

interface DocumentImporterProps {
  onTextExtracted: (text: string) => void;
  buttonLabel?: string;
}

export const DocumentImporter: React.FC<DocumentImporterProps> = ({ 
  onTextExtracted, 
  buttonLabel = 'Importar Documento' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setDebugInfo(`Arquivo selecionado: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);

    try {
      // Para documentos DOCX, usamos a biblioteca mammoth
      if (file.name.endsWith('.docx')) {
        setDebugInfo(prev => `${prev}\nProcessando arquivo DOCX...`);
        
        const arrayBuffer = await file.arrayBuffer();
        setDebugInfo(prev => `${prev}\nArquivo convertido para ArrayBuffer`);
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        setDebugInfo(prev => `${prev}\nTexto extraído com sucesso, comprimento: ${result.value.length} caracteres`);
        
        onTextExtracted(result.value);
      } 
      // Para arquivos de texto simples
      else if (file.name.endsWith('.txt')) {
        setDebugInfo(prev => `${prev}\nProcessando arquivo TXT...`);
        
        const text = await file.text();
        setDebugInfo(prev => `${prev}\nTexto extraído com sucesso, comprimento: ${text.length} caracteres`);
        
        onTextExtracted(text);
      }
      // Para outros tipos de arquivo, exibir erro
      else {
        setError(`Formato de arquivo não suportado: ${file.type}. Use .docx ou .txt`);
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setError(`Erro ao processar o arquivo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="document-importer">
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
          padding: '12px 20px',
          borderRadius: '20px',
          border: 'none',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {isLoading ? 'Importando...' : buttonLabel}
      </button>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        textAlign: 'center',
        marginTop: '8px'
      }}>
        Formatos suportados: Word (.docx) e Texto (.txt)
      </div>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
          <strong>Erro:</strong> {error}
        </div>
      )}
      
      {debugInfo && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          <strong>Informações de depuração:</strong><br />
          {debugInfo}
        </div>
      )}
    </div>
  );
};

export default DocumentImporter; 