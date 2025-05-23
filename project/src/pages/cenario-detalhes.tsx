import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { styleFixScrollHorizontal } from '@/main';

type CenarioParams = {
  id: string;
};

type Teatro = {
  id: string;
  titulo: string;
  cenario?: string;
  qtdCenas?: number;
  criador: string;
  temAlerta?: boolean;
  mensagemAlerta?: string;
  avisoAtivo?: boolean;
  aviso?: string;
};

export function CenarioDetalhes() {
  const { id } = useParams<CenarioParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Injetar estilos para prevenir scroll horizontal
  useEffect(() => {
    // Adiciona o estilo ao head se não existir
    if (!document.querySelector('#fix-horizontal-scroll')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'fix-horizontal-scroll';
      styleEl.innerHTML = styleFixScrollHorizontal;
      document.head.appendChild(styleEl);
    }
    
    // Remover quando o componente for desmontado
    return () => {
      const styleEl = document.querySelector('#fix-horizontal-scroll');
      if (styleEl) styleEl.remove();
    };
  }, []);

  useEffect(() => {
    const carregarTeatro = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const teatroRef = doc(db, 'teatros', id);
        const teatroSnap = await getDoc(teatroRef);
        
        if (teatroSnap.exists()) {
          const rawData = teatroSnap.data();
          // DEBUG: Verificar dados brutos do Firestore
          console.log("Cenário - Dados originais do Firestore:", rawData);
          console.log("Cenário - Aviso no Firestore:", rawData.aviso);
          console.log("Cenário - AvisoAtivo no Firestore:", rawData.avisoAtivo);
          
          // Garantir que todos os campos estão presentes
          const teatroProcessado = { 
            id: teatroSnap.id, 
            ...rawData,
            temAlerta: rawData.temAlerta ?? false,
            mensagemAlerta: rawData.mensagemAlerta || '',
            aviso: rawData.aviso || '',
            avisoAtivo: rawData.avisoAtivo ?? false
          } as Teatro;
          
          console.log("Cenário - Teatro processado:", teatroProcessado);
          
          setTeatro(teatroProcessado);
        } else {
          setError('Teatro não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar teatro:', error);
        setError('Erro ao carregar dados do teatro');
      } finally {
        setLoading(false);
      }
    };
    
    carregarTeatro();
  }, [id]);

  // Verificar se o usuário atual é o criador/admin do teatro
  const isCreator = user && teatro ? user.uid === teatro.criador : false;

  if (loading) {
    return (
      <MobileWrapper title="Carregando..." fullHeight={false} safeArea={true}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
          <p>Carregando...</p>
        </div>
      </MobileWrapper>
    );
  }

  if (error || !teatro) {
    return (
      <MobileWrapper title="Erro" fullHeight={false} safeArea={true}>
        <div style={{ padding: '10px' }}>
          <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', marginBottom: '10px' }}>
            {error || 'Teatro não encontrado'}
          </div>
          <button
            onClick={() => navigate(`/teatro/${id}`)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#002B5B', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              width: '100%', 
              cursor: 'pointer',
              borderRadius: '4px' 
            }}
          >
            <ArrowLeft size={16} />
            <span style={{ marginLeft: '8px' }}>Voltar</span>
          </button>
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper 
      title={teatro.titulo || "Cenário"} 
      showBackButton={true} 
      onBack={() => navigate(`/teatro/${id}`)} 
      showBottomNav={false}
      fullHeight={false}
      safeArea={true}
    >
      {/* Container principal com propriedades fixas */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: '100vh',
        position: 'fixed',
        top: '56px', /* altura do cabeçalho */
        left: 0,
        bottom: 0,
        right: 0,
        overflow: 'hidden'
      }}>
        {/* Navegação em abas - APENAS ESTA PARTE TEM SCROLL HORIZONTAL */}
        <div className="tabs-scroll-container" style={{ 
          display: 'flex', 
          backgroundColor: 'white', 
          overflowX: 'auto', 
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100%',
          borderBottom: '1px solid #ddd',
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0, /* Impede que esta área reduza de tamanho */
          scrollSnapType: 'x mandatory', /* Melhora o scroll para parar nos itens */
        }}>
          <button 
            onClick={() => navigate(`/teatro/${id}`)}
            style={{ 
              padding: '10px 12px', 
              border: 'none', 
              background: 'none', 
              borderBottom: 'none', 
              fontWeight: 'normal', 
              color: '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', /* Não encolhe nem cresce */
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start', /* Para scroll snapping */
              minWidth: '80px'
            }}>
            Principal
          </button>
          <button 
            onClick={() => navigate(`/teatro/${id}/roteiro`)}
            style={{ 
              padding: '10px 12px', 
              border: 'none', 
              background: 'none', 
              borderBottom: 'none', 
              fontWeight: 'normal', 
              color: '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '80px'
            }}>
            Roteiro
          </button>
          <button 
            style={{ 
              padding: '10px 12px', 
              border: 'none', 
              background: 'none', 
              borderBottom: '2px solid #ff726f', 
              fontWeight: 'bold', 
              color: '#333', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '80px'
            }}>
            Cenário
          </button>
          <button 
            onClick={() => navigate(`/teatro/${id}/figurino`)}
            style={{ 
              padding: '10px 12px', 
              border: 'none', 
              background: 'none', 
              borderBottom: 'none', 
              fontWeight: 'normal', 
              color: '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '80px'
            }}>
            Figurino
          </button>
          <button 
            onClick={() => navigate(`/teatro/${id}/equipe`)}
            style={{ 
              padding: '10px 12px', 
              border: 'none', 
              background: 'none', 
              borderBottom: 'none', 
              fontWeight: 'normal', 
              color: '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '80px'
            }}>
            Equipe
          </button>
        </div>

        {/* Conteúdo com scroll vertical */}
        <div style={{ 
          flex: '1', 
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'white',
          padding: '12px',
          paddingBottom: '80px' /* espaço para o botão fixo no fundo */
        }}>
          {/* Alertas */}
          {teatro.avisoAtivo && teatro.aviso && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeeba', 
              padding: '15px', 
              marginBottom: '15px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ 
                color: '#856404', 
                marginBottom: '5px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}>
                ⚠️ Aviso Importante
              </h3>
              <p style={{ wordBreak: 'break-word', margin: '0' }}>{teatro.aviso}</p>
            </div>
          )}
          
          {teatro.temAlerta && (
            <div style={{ 
              backgroundColor: '#fff8e1', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #ffe082'
            }}>
              <p style={{ color: '#ff8f00', margin: 0 }}>
                <span style={{ marginRight: '8px' }}>⚠️</span>
                {teatro.mensagemAlerta || 'Este teatro possui um alerta importante!'}
              </p>
            </div>
          )}
          
          {/* Conteúdo principal */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>
              Detalhes do Cenário
            </h2>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              border: '1px solid #ddd', 
              boxSizing: 'border-box',
              marginBottom: '20px',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%'
            }}>
              {teatro.cenario ? (
                <p style={{ 
                  whiteSpace: 'pre-line', 
                  lineHeight: '1.4', 
                  fontSize: '14px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {teatro.cenario}
                </p>
              ) : (
                <p style={{ 
                  textAlign: 'center', 
                  color: '#888', 
                  fontSize: '14px' 
                }}>
                  Nenhuma descrição de cenário disponível
                </p>
              )}
            </div>

            {/* Estatísticas */}
            <div style={{ 
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '10px' 
              }}>
                Estatísticas
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ fontWeight: 'bold' }}>Quantidade de Cenas:</span>
                <span style={{ color: '#ff726f', fontWeight: 'bold' }}>{teatro.qtdCenas || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões fixos na parte inferior - estilo mobile */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '10px', 
          backgroundColor: 'white', 
          borderTop: '1px solid #ddd', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          zIndex: 10,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => navigate(`/teatro/${id}/ordem-cenarios`)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#ff726f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
} 