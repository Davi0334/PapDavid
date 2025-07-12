import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { detectDeviceType } from '@/lib/mobile-config';
import { db } from '@/lib/firebase';
import { Edit, ArrowLeft, Share2, Users, FileText, Palette, Calendar } from 'lucide-react';

// Adicione estilo global para prevenir scroll horizontal
const styleFixScrollHorizontal = `
  <style>
    body, html {
      overflow-x: hidden;
      width: 100%;
      max-width: 100%;
    }
    
    .mobile-content-container {
      overflow-x: hidden !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    
    .mobile-wrapper-fix {
      overflow-x: hidden !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    
    .tab-content {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    }
  </style>
`;

type TeatroParams = {
  id: string;
};

type Participante = {
  id: string;
  nome: string;
  funcao?: string;
  teatroId: string;
  email?: string;
};

type Teatro = {
  id: string;
  titulo: string;
  descricao?: string;
  diasEnsaio?: string[];
  dataApresentacao?: string;
  roteiro?: string;
  figurino?: string;
  cenario?: string;
  aviso?: string;
  avisoAtivo?: boolean;
  criador: string;
  participantes?: string[];
  quantidadeCenas?: number;
  numeroAtos?: number;
  quantidadeAtores?: number;
  quantidadeFigurinos?: number;
  temaFigurinos?: string;
  temAlerta?: boolean;
  mensagemAlerta?: string;
};

const TeatroDetalhes: React.FC = () => {
  const { id } = useParams<TeatroParams>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const platform = detectDeviceType();
  
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [activeTab, setActiveTab] = useState<'principal' | 'roteiro' | 'cenario' | 'figurino' | 'equipe'>('principal');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Injetar estilos para prevenir scroll horizontal
  useEffect(() => {
    // Adiciona o estilo ao head se não existir
    if (!document.querySelector('#fix-horizontal-scroll')) {
      const styleEl = document.createElement('div');
      styleEl.id = 'fix-horizontal-scroll';
      styleEl.innerHTML = styleFixScrollHorizontal;
      document.head.appendChild(styleEl);
    }
    
    // Adicionando script para garantir que as abas tenham scroll horizontal
    const enableTabsScroll = () => {
      const tabsContainer = document.querySelector('.tabs-scroll-container') as HTMLElement;
      if (tabsContainer) {
        // Forçar estilos diretamente no elemento
        Object.assign(tabsContainer.style, {
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          display: 'flex',
          touchAction: 'pan-x',
          position: 'relative',
          zIndex: '1000'
        });
        
        // Verificar se o conteúdo é maior que o container
        const tabsWidth = Array.from(tabsContainer.children)
          .reduce((total, el) => total + (el as HTMLElement).getBoundingClientRect().width, 0);
          
        if (tabsWidth > tabsContainer.clientWidth) {
          console.log('Tabs precisam de scroll horizontal:', tabsWidth, '>', tabsContainer.clientWidth);
        }
      }
    };
    
    // Executar imediatamente e após um pequeno delay para garantir
    enableTabsScroll();
    const timer = setTimeout(enableTabsScroll, 500);
    
    // Remover quando o componente for desmontado
    return () => {
      const styleEl = document.querySelector('#fix-horizontal-scroll');
      if (styleEl) styleEl.remove();
      clearTimeout(timer);
    };
  }, []);

  // Carregar dados do teatro
  useEffect(() => {
    const carregarTeatro = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Verificar se temos o teatro em cache
        const cacheKey = `teatro_cache_${id}`;
        const teatroCache = localStorage.getItem(cacheKey);
        let teatroData = null;
        
        if (teatroCache) {
          try {
            teatroData = JSON.parse(teatroCache);
            // DEBUG: Verificar se os dados do aviso estão presentes
            console.log("Teatro do cache:", teatroData);
            console.log("Aviso no cache:", teatroData.aviso);
            console.log("AvisoAtivo no cache:", teatroData.avisoAtivo);
            
            // Atualizar dados para garantir que tem os campos de aviso
            teatroData = {
              ...teatroData,
              temAlerta: teatroData.temAlerta ?? false,
              mensagemAlerta: teatroData.mensagemAlerta || '',
              aviso: teatroData.aviso || '',
              avisoAtivo: teatroData.avisoAtivo ?? false
            };
            
            setTeatro(teatroData);
            
            // Verificar se é um teatro offline
            setIsOffline(id.startsWith('local_'));
          } catch (e) {
            console.error('Erro ao ler cache do teatro:', e);
          }
        }
        
        // Se não temos em cache ou é um ID completo (não local), buscar do Firestore
        if (!teatroData && !id.startsWith('local_')) {
          const docRef = doc(db, 'teatros', id as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const rawData = docSnap.data();
            // DEBUG: Verificar dados brutos do Firestore
            console.log("Dados originais do Firestore:", rawData);
            console.log("Aviso no Firestore:", rawData.aviso);
            console.log("AvisoAtivo no Firestore:", rawData.avisoAtivo);
            
            teatroData = { 
              id: docSnap.id, 
              ...rawData,
              temAlerta: rawData.temAlerta ?? false,
              mensagemAlerta: rawData.mensagemAlerta || '',
              aviso: rawData.aviso || '',
              avisoAtivo: rawData.avisoAtivo ?? false
            } as Teatro;
            
            console.log("Teatro processado:", teatroData);
            
            setTeatro(teatroData);
            
            // Salvar em cache
            localStorage.setItem(cacheKey, JSON.stringify(teatroData));
          } else {
            setError('Teatro não encontrado');
          }
        }
        
        // Se ainda não temos dados e é um ID local, verificar no armazenamento local
        if (!teatroData && id.startsWith('local_')) {
          const localStorageKey = `teatro_local_${id}`;
          const localData = localStorage.getItem(localStorageKey);
          
          if (localData) {
            try {
              teatroData = JSON.parse(localData);
              setTeatro(teatroData);
              setIsOffline(true);
            } catch (e) {
              console.error('Erro ao ler dados locais do teatro:', e);
              setError('Erro ao ler dados do teatro');
            }
          } else {
            setError('Teatro não encontrado no armazenamento local');
          }
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

  // Carregar participantes
  useEffect(() => {
    const carregarParticipantes = async () => {
      if (!id) return;
      
      try {
        // Verificar cache primeiro
        const cacheKey = `participantes_teatro_${id}`;
        const participantesCache = localStorage.getItem(cacheKey);
        
        if (participantesCache) {
          try {
            const parsedCache = JSON.parse(participantesCache);
            setParticipantes(parsedCache);
          } catch (e) {
            console.error('Erro ao ler cache de participantes:', e);
          }
        }
        
        // Se não é um ID local, buscar do Firestore
        if (!id.startsWith('local_')) {
          const participantesRef = collection(db, 'participantes');
          const q = query(participantesRef, where('teatroId', '==', id));
          const querySnapshot = await getDocs(q);
          
          const participantesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Participante[];
          
          setParticipantes(participantesData);
          
          // Atualizar cache
          localStorage.setItem(cacheKey, JSON.stringify(participantesData));
        }
      } catch (error) {
        console.error('Erro ao carregar participantes:', error);
      }
    };
    
    if (teatro) {
      carregarParticipantes();
    }
  }, [id, teatro]);

  const handleDelete = async () => {
    if (!id || !user) return;
    
    setDeleteInProgress(true);
    
    try {
      // Para teatros locais, apenas remover do localStorage
      if (id.startsWith('local_')) {
        localStorage.removeItem(`teatro_local_${id}`);
        
        // Atualizar cache de lista de teatros
        try {
          const teatrosCache = localStorage.getItem('teatros_cache');
          if (teatrosCache) {
            const teatros = JSON.parse(teatrosCache);
            const teatrosAtualizados = teatros.filter((t: any) => t.id !== id);
            localStorage.setItem('teatros_cache', JSON.stringify(teatrosAtualizados));
          }
        } catch (e) {
          console.error('Erro ao atualizar cache de teatros:', e);
        }
        
        navigate('/teatros');
        return;
      }
      
      // Para teatros no Firestore
      const teatroRef = doc(db, 'teatros', id);
      
      // Marcar como excluído em vez de remover completamente
      // Isso permite recuperação e mantém histórico
      await deleteDoc(teatroRef);
      
      // Remover do cache
      localStorage.removeItem(`teatro_cache_${id}`);
      
      // Atualizar cache de lista de teatros
      try {
        const teatrosCache = localStorage.getItem('teatros_cache');
        if (teatrosCache) {
          const teatros = JSON.parse(teatrosCache);
          const teatrosAtualizados = teatros.filter((t: any) => t.id !== id);
          localStorage.setItem('teatros_cache', JSON.stringify(teatrosAtualizados));
        }
      } catch (e) {
        console.error('Erro ao atualizar cache de teatros:', e);
      }
      
      navigate('/teatros');
    } catch (error) {
      console.error('Erro ao excluir teatro:', error);
      
      // Em caso de erro, marcar para exclusão posterior
      if (!id.startsWith('local_')) {
        localStorage.setItem(`teatro_delete_${id}`, JSON.stringify({
          id,
          timestamp: new Date().toISOString(),
          userId: user.uid
        }));
      }
    } finally {
      setDeleteInProgress(false);
      setConfirmDelete(false);
    }
  };

  // Verificar permissão para editar
  const canEdit = () => {
    if (!user || !teatro) return false;
    return isAdmin || teatro.criador === user.uid;
  };

  // Verificar se o usuário atual é o criador/admin do teatro
  const isCreator = user && teatro ? user.uid === teatro.criador : false;

  // Formatar a data de apresentação
  const formatarData = (data?: string) => {
    if (!data) return "Não definido";
    
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch (error) {
      return "Data inválida";
    }
  };

  // Formatar dias de ensaio
  const formatarDiasEnsaio = (dias?: string[]) => {
    if (!dias || dias.length === 0) return "Não definido";
    
    const diasMap: Record<string, string> = {
      seg: 'Segunda',
      ter: 'Terça',
      qua: 'Quarta',
      qui: 'Quinta',
      sex: 'Sexta',
      sab: 'Sábado',
      dom: 'Domingo'
    };
    
    return dias.map(dia => diasMap[dia] || dia).join(', ');
  };

  const handleShareId = () => {
    if (!teatro) return;
    
    // Copiar ID para a área de transferência
    navigator.clipboard.writeText(teatro.id)
      .then(() => {
        alert('ID copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Erro ao copiar ID:', err);
        alert('Erro ao copiar ID. Tente novamente.');
      });
  };

  if (loading) {
    return (
      <MobileWrapper title="Carregando..." fullHeight={false} safeArea={true}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%', 
          padding: '20px' 
        }}>
          <p>Carregando...</p>
        </div>
      </MobileWrapper>
    );
  }

  if (error || !teatro) {
    return (
      <MobileWrapper title="Erro" fullHeight={false} safeArea={true}>
        <div style={{ padding: '10px' }}>
          <div style={{ 
            backgroundColor: '#ffcccc', 
            color: '#cc0000', 
            padding: '10px', 
            marginBottom: '10px' 
          }}>
            {error || 'Teatro não encontrado'}
          </div>
          <button
            onClick={() => navigate('/')}
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
            <span style={{ marginLeft: '8px' }}>Voltar para o início</span>
          </button>
        </div>
      </MobileWrapper>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'principal':
        return (
          <>
            {/* Alertas somente na aba Principal */}
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Aviso Importante
                </h3>
                <p style={{ wordBreak: 'break-word' }}>{teatro.aviso}</p>
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
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              marginBottom: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '15px' 
              }}>Informações Gerais</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ wordBreak: 'break-word' }}>
                  <span style={{ fontWeight: 'bold' }}>ID:</span>
                  <div>{teatro.id}</div>
                </div>
                
                <div>
                  <span style={{ fontWeight: 'bold' }}>Data de Apresentação:</span>
                  <div>{formatarData(teatro.dataApresentacao)}</div>
                </div>
                
                <div>
                  <span style={{ fontWeight: 'bold' }}>Local:</span>
                  <div style={{ wordBreak: 'break-word' }}>{teatro.descricao || "Não definido"}</div>
                </div>
                
                <div>
                  <span style={{ fontWeight: 'bold' }}>Dias de Ensaio:</span>
                  <div>{formatarDiasEnsaio(teatro.diasEnsaio)}</div>
                </div>
                
                <div>
                  <span style={{ fontWeight: 'bold' }}>Criado por:</span>
                  <div style={{ wordBreak: 'break-word' }}>{isCreator ? user?.displayName || user?.email || 'Você' : 'Outro usuário'}</div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '15px' 
              }}>Estatísticas</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px',
                width: '100%'
              }}>
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: 'white', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#ff726f'
                  }}>{teatro.quantidadeCenas || 0}</div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666'
                  }}>Quantidade de Cenas</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: 'white', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#ff726f'
                  }}>{teatro.numeroAtos || 0}</div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666'
                  }}>Número de Atos</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: 'white', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#ff726f'
                  }}>{teatro.quantidadeAtores || 0}</div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666'
                  }}>Quantidade de Atores</div>
                </div>
                
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: 'white', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#ff726f'
                  }}>{participantes.length}</div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666'
                  }}>Participantes</div>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'roteiro':
        return (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>Roteiro</h2>
            {teatro.roteiro ? (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                whiteSpace: 'pre-line',
                border: '1px solid #eee',
                borderRadius: '4px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowWrap: 'break-word',
                wordWrap: 'break-word'
              }}>
                {teatro.roteiro}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#888'
              }}>
                <p>O roteiro ainda não foi definido.</p>
              </div>
            )}
          </div>
        );
      
      case 'cenario':
        return (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>Cenário</h2>
            {teatro.cenario ? (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                whiteSpace: 'pre-line',
                border: '1px solid #eee',
                borderRadius: '4px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowWrap: 'break-word',
                wordWrap: 'break-word'
              }}>
                {teatro.cenario}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#888'
              }}>
                <p>O cenário ainda não foi definido.</p>
              </div>
            )}
          </div>
        );
      
      case 'figurino':
        return (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>Figurino</h2>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              marginBottom: '15px',
              border: '1px solid #eee',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ 
                fontWeight: 'bold', 
                fontSize: '14px', 
                marginBottom: '5px'
              }}>Tema</h3>
              <p style={{ wordBreak: 'break-word' }}>{teatro.temaFigurinos || "Não definido"}</p>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px',
              border: '1px solid #eee',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ 
                fontWeight: 'bold', 
                fontSize: '14px', 
                marginBottom: '5px'
              }}>Quantidade</h3>
              <p>{teatro.quantidadeFigurinos || 0} figurinos</p>
            </div>
          </div>
        );
      
      case 'equipe':
        return (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>Equipe</h2>
            {participantes.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                width: '100%',
                maxWidth: '100%'
              }}>
                {participantes.map(p => (
                  <div key={p.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '10px', 
                    backgroundColor: 'white', 
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#002B5B', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginRight: '10px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ 
                      overflow: 'hidden',
                      width: 'calc(100% - 50px)' 
                    }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>{p.nome}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#666',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>{p.funcao || "Participante"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#888'
              }}>
                <p>Nenhum participante registrado.</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <MobileWrapper 
      title={teatro.titulo} 
      showBackButton={true} 
      onBack={() => navigate('/')}
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
        overflow: 'hidden',
        zIndex: 1
      }}>
        {/* Avisos e alertas - Posição fixa no topo da página, visível independente da aba */}
        {(teatro.avisoAtivo && teatro.aviso) && (
          <div style={{ 
            backgroundColor: '#fd7e14', 
            color: 'white',
            padding: '15px', 
            margin: '0',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '5px'
            }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>⚠️</span>
              <span style={{ fontSize: '16px' }}>AVISO IMPORTANTE</span>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: '14px',
              wordBreak: 'break-word'
            }}>{teatro.aviso}</p>
          </div>
        )}

        {/* Navegação em abas */}
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
          flexShrink: 0,
          scrollSnapType: 'x mandatory',
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 10,
          touchAction: 'pan-x',
          msOverflowStyle: 'none', /* IE and Edge */
          scrollbarWidth: 'none', /* Firefox */
          flexWrap: 'nowrap'
        }}>
          {/* Hide scrollbar for Chrome, Safari and Opera */}
          <style>{`
            .tabs-scroll-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <button 
            onClick={() => setActiveTab('principal')}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              borderBottom: activeTab === 'principal' ? '2px solid #ff726f' : 'none', 
              fontWeight: activeTab === 'principal' ? 'bold' : 'normal', 
              color: activeTab === 'principal' ? '#333' : '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '120px'
            }}>
            Principal
          </button>
          <button 
            onClick={() => setActiveTab('roteiro')}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              borderBottom: activeTab === 'roteiro' ? '2px solid #ff726f' : 'none', 
              fontWeight: activeTab === 'roteiro' ? 'bold' : 'normal', 
              color: activeTab === 'roteiro' ? '#333' : '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '120px'
            }}>
            Roteiro
          </button>
          <button 
            onClick={() => setActiveTab('cenario')}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              borderBottom: activeTab === 'cenario' ? '2px solid #ff726f' : 'none', 
              fontWeight: activeTab === 'cenario' ? 'bold' : 'normal', 
              color: activeTab === 'cenario' ? '#333' : '#777', 
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '120px'
            }}>
            Cenário
          </button>
          <button 
            onClick={() => setActiveTab('figurino')}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              borderBottom: activeTab === 'figurino' ? '2px solid #ff726f' : 'none',
              fontWeight: activeTab === 'figurino' ? 'bold' : 'normal',
              color: activeTab === 'figurino' ? '#333' : '#777',
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '120px'
            }}>
            Figurino
          </button>
          <button 
            onClick={() => setActiveTab('equipe')}
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              background: 'none', 
              borderBottom: activeTab === 'equipe' ? '2px solid #ff726f' : 'none',
              fontWeight: activeTab === 'equipe' ? 'bold' : 'normal',
              color: activeTab === 'equipe' ? '#333' : '#777',
              fontSize: '14px', 
              flex: '0 0 auto', 
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              minWidth: '120px'
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
          padding: '10px',
          paddingBottom: '80px'
        }}>
          {renderTabContent()}
        </div>
      </div>
    </MobileWrapper>
  );
};

export { TeatroDetalhes };
export default TeatroDetalhes; 