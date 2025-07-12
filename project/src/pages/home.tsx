import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDataService } from '../lib/data-service';
import { Teatro } from '../types/teatro';
import BottomNav from '../components/bottom-nav';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-prod';
import { Home as HomeIcon, Users, Calendar, Plus, Star, Sparkles, Clock } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [teatros, setTeatros] = useState<Teatro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminStatus, setAdminStatus] = useState(false);
  const [userName, setUserName] = useState('');
  const dataService = useDataService();
  const { user, isAdmin, userRole, refreshAdminStatus } = useAuth();
  
  useEffect(() => {
    const checkAdminDirectly = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userIsAdmin = userData.role === 'admin';
          setAdminStatus(userIsAdmin);
          setUserName(userData.displayName || userData.name || user.displayName || user.email?.split('@')[0] || 'Usuário');
          
          if (userIsAdmin && !isAdmin) {
            try {
              await refreshAdminStatus();
            } catch (refreshError) {
              console.error('Erro no refresh do admin:', refreshError);
            }
          }
        }
      } catch (err) {
        console.error('Erro na verificação direta de admin:', err);
      }
    };
    
    checkAdminDirectly();
  }, [user, isAdmin, refreshAdminStatus]);
  
  useEffect(() => {
    const fetchTeatros = async () => {
      try {
        setLoading(true);
        const data = await dataService.getTeatros();
        const convertedData = data.map((teatro: any) => ({
          id: teatro.id,
          nome: teatro.titulo || teatro.nome,
          descricao: teatro.descricao,
          tipo: teatro.tipo || 'standard',
          diasEnsaio: Array.isArray(teatro.diasEnsaio) ? teatro.diasEnsaio.join(', ') : teatro.diasEnsaio,
          dataApresentacao: teatro.dataApresentacao,
          qtdParticipantes: teatro.participantes?.length || teatro.qtdParticipantes || 0,
          status: teatro.status || 'ativo',
          dataCriacao: teatro.dataCriacao || new Date(),
        }));
        setTeatros(convertedData);
      } catch (err) {
        console.error('Erro ao buscar teatros:', err);
        setError('Não foi possível carregar seus teatros.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeatros();
  }, [dataService, user]);

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const renderTeatros = () => {
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
          }}>Carregando seus teatros...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.9))',
          borderRadius: '16px',
          padding: '30px',
          textAlign: 'center',
          border: '1px solid rgba(252, 108, 95, 0.2)',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(252, 108, 95, 0.3)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    
    if (teatros.length === 0) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.05), rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px 30px',
          textAlign: 'center',
          border: '1px solid rgba(252, 108, 95, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          margin: '20px 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Elementos decorativos */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.1))',
            borderRadius: '50%',
            animation: 'float 3s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '-10px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.05), rgba(255, 255, 255, 0.05))',
            borderRadius: '50%',
            animation: 'float 4s ease-in-out infinite reverse'
          }} />
          
          <div style={{
            background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Sparkles size={40} color="white" />
          </div>
          
          <h3 style={{
            color: '#333',
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '10px'
          }}>Bem-vindo ao ServeFirst!</h3>
          
          <p style={{
            color: '#666',
            fontSize: '16px',
            marginBottom: '25px',
            lineHeight: '1.5'
          }}>Você ainda não participa de nenhum teatro. Que tal começar sua jornada artística?</p>
          
          {(isAdmin || adminStatus) && (
            <button 
              onClick={() => navigate('/criar-teatro')}
              style={{
                background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(252, 108, 95, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 auto'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={20} />
              Criar Primeiro Teatro
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {teatros.map((teatro, index) => (
          <div 
            key={teatro.id} 
            onClick={() => navigate(`/teatro/${teatro.id}`)}
            style={{
              background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.9))',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(252, 108, 95, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              animation: `slideIn 0.6s ease-out ${index * 0.1}s both`
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Elemento decorativo */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, rgba(252, 108, 95, 0.2), rgba(255, 255, 255, 0.2))',
              borderRadius: '50%',
              animation: 'float 3s ease-in-out infinite'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{
                color: '#333',
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
                flex: 1
              }}>{teatro.nome}</h3>
              
              {teatro.status === 'ativo' && (
                <div style={{
                  background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  animation: 'pulse 2s ease-in-out infinite',
                  marginTop: '4px'
                }} />
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={16} color="white" />
                </div>
                <div>
                  <p style={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    margin: 0, 
                    fontWeight: '500' 
                  }}>Participantes</p>
                  <p style={{ 
                    color: '#333', 
                    fontSize: '16px', 
                    margin: 0, 
                    fontWeight: '700' 
                  }}>{teatro.qtdParticipantes || 0}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Calendar size={16} color="white" />
                </div>
                <div>
                  <p style={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    margin: 0, 
                    fontWeight: '500' 
                  }}>Dias de ensaio</p>
                  <p style={{ 
                    color: '#333', 
                    fontSize: '14px', 
                    margin: 0, 
                    fontWeight: '600' 
                  }}>{teatro.diasEnsaio || 'Não definido'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
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
        width: '80px',
        height: '80px',
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
            <HomeIcon size={24} style={{ color: '#fc6c5f' }} />
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
          }}>ServeFirst</h1>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)'
          }}>
            {getTimeOfDayGreeting()}, {userName}! ✨
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            fontWeight: '500',
            margin: '4px 0 0',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
          }}>
            Pronto para brilhar no palco?
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
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Elemento decorativo interno */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
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
              <Star size={20} color="white" />
            </div>
            <h2 style={{
              color: '#333',
              fontSize: '22px',
              fontWeight: '700',
              margin: 0
            }}>Meus Teatros</h2>
          </div>
          
          {renderTeatros()}
        </div>
      </div>
      
      {/* Botão flutuante para admins */}
      {(isAdmin || adminStatus) && (
        <button 
          onClick={() => navigate('/criar-teatro')}
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '25px',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
            color: 'white',
            fontSize: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 8px 25px rgba(252, 108, 95, 0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            animation: 'pulse 3s ease-in-out infinite'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={28} />
        </button>
      )}
      
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