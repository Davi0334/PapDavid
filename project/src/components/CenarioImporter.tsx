import React, { useRef, useState } from 'react';
import mammoth from 'mammoth';

interface CenarioImporterProps {
  onTextImported: (text: string) => void;
  label?: string;
  isLoading?: boolean;
}

export const CenarioImporter: React.FC<CenarioImporterProps> = ({
  onTextImported,
  label = 'Importar Cenário',
  isLoading: externalLoading = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loading = externalLoading || internalLoading;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('Arquivo selecionado:', file.name, file.type);
    setInternalLoading(true);
    setError(null);

    try {
      // Para documentos DOCX
      if (file.name.endsWith('.docx')) {
        console.log('Processando arquivo DOCX');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('Texto extraído do DOCX, comprimento:', result.value.length);
        onTextImported(result.value);
      } 
      // Para arquivos de texto
      else if (file.name.endsWith('.txt')) {
        console.log('Processando arquivo TXT');
        const text = await file.text();
        console.log('Texto extraído do TXT, comprimento:', text.length);
        onTextImported(text);
      }
      // Outros formatos
      else {
        throw new Error(`Formato não suportado: ${file.type}. Use .docx ou .txt`);
      }
      
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInternalLoading(false);
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
        disabled={loading}
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
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Importando...' : label}
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
        <div style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CenarioImporter; 