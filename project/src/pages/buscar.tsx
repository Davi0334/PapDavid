import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Search, Users, Calendar, MapPin, Clock, Star, Sparkles, Target, Zap } from 'lucide-react';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BottomNav from '../components/bottom-nav';

type Teatro = {
  id: string;
  titulo: string;
  descricao?: string;
  diasEnsaio?: string[];
  dataApresentacao?: string;
  roteiro?: string;
  participantes?: string[];
  criador: string;
};

export function Buscar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, digite um ID de teatro');
      return;
    }

    setLoading(true);
    setError('');
    setTeatro(null);
    setSearchAttempted(true);

    try {
      const teatroRef = doc(db, 'teatros', searchQuery.trim());
      const teatroSnap = await getDoc(teatroRef);

      if (teatroSnap.exists()) {
        setTeatro({ id: teatroSnap.id, ...teatroSnap.data() } as Teatro);
      } else {
        setError('Teatro não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar teatro:', err);
      setError('Erro ao buscar teatro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Formatar dias de ensaio para exibição
  const formatarDiasEnsaio = (dias?: string[]) => {
    if (!dias || dias.length === 0) return 'Não definido';
    return dias.join(', ');
  };

  // Formatar data de apresentação para exibição
  const formatarDataApresentacao = (data?: string) => {
    if (!data) return 'Não definida';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Função para verificar se o usuário já participa do teatro
  const userParticipates = (teatro: Teatro) => {
    return teatro.participantes && teatro.participantes.includes(user?.uid || '');
  };

  const renderSearchResult = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(252, 108, 95, 0.3)',
            borderTop: '4px solid #fc6c5f',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p style={{
            color: '#666',
            fontSize: '16px',
            fontWeight: '500'
          }}>Procurando teatro...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          margin: '20px 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 255, 255, 0.1))',
            borderRadius: '50%',
            animation: 'float 3s ease-in-out infinite'
          }} />
          
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #f87171)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Search size={30} color="white" />
          </div>
          
          <h3 style={{
            color: '#333',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '10px'
          }}>Ops!</h3>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginBottom: '25px',
            lineHeight: '1.5'
          }}>{error}</p>
          
          <button 
            onClick={() => {
              setError('');
              setSearchAttempted(false);
              setSearchQuery('');
            }}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    if (teatro) {
      return (
        <div 
          onClick={() => navigate(`/teatro/${teatro.id}`)}
          style={{
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.95))',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(252, 108, 95, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            margin: '20px 0',
            animation: 'slideIn 0.6s ease-out'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Elementos decorativos */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.2), rgba(255, 255, 255, 0.2))',
            borderRadius: '50%',
            animation: 'float 4s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '-10px',
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.1))',
            borderRadius: '50%',
            animation: 'float 3s ease-in-out infinite reverse'
          }} />
          
          {/* Header do card */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                  borderRadius: '8px',
                  padding: '6px',
                  marginRight: '10px'
                }}>
                  <Target size={16} color="white" />
                </div>
                <span style={{
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Teatro Encontrado
                </span>
              </div>
              <h2 style={{
                color: '#333',
                fontSize: '24px',
                fontWeight: '800',
                margin: 0,
                lineHeight: '1.2'
              }}>{teatro.titulo}</h2>
              <p style={{
                color: '#666',
                fontSize: '14px',
                margin: '4px 0 0',
                fontWeight: '500'
              }}>ID: {teatro.id}</p>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #4ade80)',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              animation: 'pulse 2s ease-in-out infinite',
              marginTop: '8px'
            }} />
          </div>
          
          {/* Informações do teatro */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  color: '#666', 
                  fontSize: '12px', 
                  margin: 0, 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Dias de Ensaio</p>
                <p style={{ 
                  color: '#333', 
                  fontSize: '16px', 
                  margin: 0, 
                  fontWeight: '700' 
                }}>{formatarDiasEnsaio(teatro.diasEnsaio)}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  color: '#666', 
                  fontSize: '12px', 
                  margin: 0, 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Data de Apresentação</p>
                <p style={{ 
                  color: '#333', 
                  fontSize: '16px', 
                  margin: 0, 
                  fontWeight: '700' 
                }}>{formatarDataApresentacao(teatro.dataApresentacao)}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  color: '#666', 
                  fontSize: '12px', 
                  margin: 0, 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Participantes</p>
                <p style={{ 
                  color: '#333', 
                  fontSize: '16px', 
                  margin: 0, 
                  fontWeight: '700' 
                }}>{teatro.participantes?.length || 0} pessoas</p>
              </div>
            </div>
          </div>
          
          {/* Botão de ação */}
          <div style={{ 
            marginTop: '24px', 
            paddingTop: '20px', 
            borderTop: '1px solid rgba(252, 108, 95, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: '#fc6c5f' }} />
              <span style={{ 
                color: '#fc6c5f', 
                fontSize: '14px', 
                fontWeight: '600' 
              }}>
                {userParticipates(teatro) ? 'Já participa' : 'Clique para entrar'}
              </span>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 4px 15px rgba(252, 108, 95, 0.3)'
            }}>
              →
            </div>
          </div>
        </div>
      );
    }

    if (searchAttempted && !teatro && !error) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px 30px',
          textAlign: 'center',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          margin: '20px 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #9ca3af, #d1d5db)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Search size={30} color="white" />
          </div>
          
          <h3 style={{
            color: '#333',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '10px'
          }}>Nenhum resultado</h3>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>Não encontramos nenhum teatro com este ID.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fc6c5f 0%, #ff8a7a 25%, #ffb8a3 50%, #ffffff 75%, #f8f9fa 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientFlow 15s ease infinite',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos decorativos de fundo */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '80px',
        height: '80px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '15%',
        width: '60px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: '5%',
        width: '70px',
        height: '70px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 7s ease-in-out infinite'
      }} />

      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 20px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
            borderRadius: '16px',
            padding: '12px',
            marginRight: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <Search size={24} style={{ color: '#fc6c5f' }} />
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '800',
            margin: 0,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Buscar Teatro</h1>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)'
          }}>
            Encontre seu grupo teatral! 🎭
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            fontWeight: '500',
            margin: '4px 0 0',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>
            Digite o ID para participar
          </p>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div style={{
        maxWidth: '430px',
        margin: '0 auto',
        padding: '24px 20px 100px',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Campo de busca */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          {/* Elemento decorativo interno */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.1))',
            borderRadius: '50%',
            animation: 'float 5s ease-in-out infinite'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
              borderRadius: '12px',
              padding: '8px',
              marginRight: '12px'
            }}>
              <Sparkles size={20} color="white" />
            </div>
            <h2 style={{
              color: '#333',
              fontSize: '20px',
              fontWeight: '700',
              margin: 0
            }}>Localizar Teatro</h2>
          </div>
          
          <div style={{
            position: 'relative',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite o ID do teatro"
              style={{
                width: '100%',
                padding: '16px 60px 16px 20px',
                border: '2px solid transparent',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '500',
                background: 'rgba(252, 108, 95, 0.05)',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid #fc6c5f';
                e.target.style.background = 'rgba(252, 108, 95, 0.1)';
                e.target.style.boxShadow = '0 0 0 4px rgba(252, 108, 95, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid transparent';
                e.target.style.background = 'rgba(252, 108, 95, 0.05)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                border: 'none',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(252, 108, 95, 0.3)',
                opacity: loading ? 0.6 : 1
              }}
              onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)')}
              onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-50%) scale(1)')}
            >
              {loading ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <Search size={20} color="white" />
              )}
            </button>
          </div>
          
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0,
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            💡 Peça o ID do teatro para o administrador do grupo
          </p>
        </div>
        
        {/* Resultados */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px'
        }}>
          {!searchAttempted && !loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 30px',
              textAlign: 'center'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.5))',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
                <Star size={40} style={{ color: '#fc6c5f' }} />
              </div>
              
              <h3 style={{
                color: '#333',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '10px'
              }}>Pronto para começar?</h3>
              
              <p style={{
                color: '#666',
                fontSize: '16px',
                lineHeight: '1.5',
                maxWidth: '280px'
              }}>
                Digite o ID do teatro no campo acima para encontrar e participar do seu grupo!
              </p>
            </div>
          )}
          
          {renderSearchResult()}
        </div>
      </div>
      
      <BottomNav />
      
      {/* Estilos CSS para animações */}
      <style>{`
        @keyframes gradientFlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 