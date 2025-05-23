import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';

interface DocumentImportButtonProps {
  onTextImported: (text: string) => void;
  label?: string;
  buttonClassName?: string;
}

export const DocumentImportButton: React.FC<DocumentImportButtonProps> = ({
  onTextImported,
  label = 'Importar Documento',
  buttonClassName = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Arquivo selecionado:', file.name, file.type);
      
      let texto = '';
      
      // Para documentos DOCX
      if (file.name.endsWith('.docx')) {
        console.log('Processando arquivo DOCX');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        texto = result.value;
        console.log('Texto extraído do DOCX, comprimento:', texto.length);
      } 
      // Para arquivos de texto
      else if (file.name.endsWith('.txt')) {
        console.log('Processando arquivo TXT');
        texto = await file.text();
        console.log('Texto extraído do TXT, comprimento:', texto.length);
      }
      // Outros formatos
      else {
        throw new Error(`Formato não suportado: ${file.type}. Use .docx ou .txt`);
      }
      
      // Passar o texto para o callback
      onTextImported(texto);
      
      console.log('Documento importado com sucesso!');
      
      // Limpar input para permitir reimportar o mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".txt,.docx"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <button
        type="button"
        onClick={handleImportClick}
        disabled={isLoading}
        className={`
          w-full py-4 bg-[#fc6c5f] text-white font-medium rounded-full
          flex items-center justify-center 
          active:transform active:scale-[0.98] 
          transition-transform duration-100
          shadow-md
          ${isLoading ? 'opacity-70' : 'opacity-100'}
          ${buttonClassName}
        `}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Importando...</span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="mr-2 text-lg">📄</span>
            <span>{label}</span>
          </div>
        )}
      </button>
      
      <div className="text-center text-xs text-gray-500 mt-2 px-2">
        Formatos suportados: Word (.docx) e Texto (.txt)
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentImportButton; 