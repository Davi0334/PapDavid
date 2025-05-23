import React, { useState } from 'react';
import DocumentImporterForTeatro from '../components/DocumentImporterForTeatro';
import { MobileWrapper } from '../components/MobileWrapper';

export function ImportadorExemplo() {
  const [cenario, setCenario] = useState('');
  const [figurino, setFigurino] = useState('');
  const [roteiro, setRoteiro] = useState('');
  const [activeTab, setActiveTab] = useState<'cenario' | 'figurino' | 'roteiro'>('roteiro');

  const handleTextImported = (text: string) => {
    // Atualizar o estado correspondente com base na aba ativa
    switch (activeTab) {
      case 'cenario':
        setCenario(text);
        break;
      case 'figurino':
        setFigurino(text);
        break;
      case 'roteiro':
        setRoteiro(text);
        break;
    }
  };

  return (
    <MobileWrapper title="Demo Importador" showBack={true}>
      <div className="container">
        <h2 style={{ marginBottom: '20px' }}>Exemplo de Importação</h2>
        
        {/* Abas para navegação */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #eee',
          marginBottom: '15px'
        }}>
          <div 
            onClick={() => setActiveTab('roteiro')} 
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '10px', 
              borderBottom: activeTab === 'roteiro' ? '2px solid #fc6c5f' : 'none',
              fontWeight: activeTab === 'roteiro' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Roteiro
          </div>
          <div 
            onClick={() => setActiveTab('cenario')} 
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '10px',
              borderBottom: activeTab === 'cenario' ? '2px solid #fc6c5f' : 'none',
              fontWeight: activeTab === 'cenario' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Cenário
          </div>
          <div 
            onClick={() => setActiveTab('figurino')} 
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '10px',
              borderBottom: activeTab === 'figurino' ? '2px solid #fc6c5f' : 'none',
              fontWeight: activeTab === 'figurino' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Figurino
          </div>
        </div>
        
        {/* Conteúdo das abas */}
        <div style={{ marginBottom: '20px' }}>
          <DocumentImporterForTeatro 
            onTextImported={handleTextImported} 
            importingFor={activeTab}
          />
        </div>
        
        {/* Texto importado */}
        <div style={{ 
          backgroundColor: '#f9f9f9', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {activeTab === 'roteiro' && 'Roteiro Importado'}
            {activeTab === 'cenario' && 'Cenário Importado'}
            {activeTab === 'figurino' && 'Figurino Importado'}
          </h3>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #eee',
            maxHeight: '300px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {activeTab === 'roteiro' && (roteiro || 'Nenhum roteiro importado ainda.')}
            {activeTab === 'cenario' && (cenario || 'Nenhum cenário importado ainda.')}
            {activeTab === 'figurino' && (figurino || 'Nenhum figurino importado ainda.')}
          </div>
        </div>
        
        {/* Informação sobre formatos suportados */}
        <div style={{ 
          backgroundColor: '#fff8e1', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #ffe082',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0' }}>
            <strong>Formatos suportados:</strong> .docx, .txt
          </p>
          <p style={{ margin: '8px 0 0 0' }}>
            Se estiver tendo problemas com a importação de documentos do Word (.docx), tente salvar o arquivo como Texto (.txt) e importar novamente.
          </p>
        </div>
      </div>
    </MobileWrapper>
  );
}