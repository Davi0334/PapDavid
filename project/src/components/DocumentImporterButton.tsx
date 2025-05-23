import React, { useRef, useState } from 'react';
import mammoth from 'mammoth';

interface DocumentImporterButtonProps {
  onTextExtracted: (text: string) => void;
  label?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const DocumentImporterButton: React.FC<DocumentImporterButtonProps> = ({
  onTextExtracted,
  label = 'Importar Documento',
  isLoading = false,
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loading = isLoading || internalLoading;

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
        onTextExtracted(result.value);
      } 
      // Para arquivos de texto
      else if (file.name.endsWith('.txt')) {
        console.log('Processando arquivo TXT');
        const text = await file.text();
        console.log('Texto extraído do TXT, comprimento:', text.length);
        onTextExtracted(text);
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
    <div style={{ width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".docx,.txt"
        onChange={handleFileChange}
      />
      
      <button
        onClick={handleImportClick}
        disabled={loading || disabled}
        style={{
          backgroundColor: '#fc6c5f',
          color: 'white',
          padding: '14px 0',
          borderRadius: '25px',
          border: 'none',
          width: '100%',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          opacity: loading || disabled ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.1s ease',
          transform: loading || disabled ? 'none' : 'translateY(0)',
          position: 'relative'
        }}
        onTouchStart={(e) => {
          if (!loading && !disabled) {
            e.currentTarget.style.transform = 'translateY(2px)';
          }
        }}
        onTouchEnd={(e) => {
          if (!loading && !disabled) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              border: '2px solid rgba(255,255,255,0.3)', 
              borderTopColor: 'white',
              marginRight: '8px',
              animation: 'spin 1s linear infinite'
            }}></div>
            Importando...
          </div>
        ) : (
          <>
            <span style={{ marginRight: '8px', fontSize: '18px' }}>📄</span>
            {label}
          </>
        )}
      </button>
      
      <div style={{ 
        fontSize: '13px', 
        color: '#666', 
        textAlign: 'center',
        marginTop: '10px',
        padding: '0 5px'
      }}>
        Formatos suportados: Word (.docx) e Texto (.txt)
      </div>
      
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee',
          padding: '12px',
          borderRadius: '12px',
          marginTop: '12px', 
          fontSize: '14px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}; 