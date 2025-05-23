import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDataService } from '../lib/data-service';
import { Teatro } from '../types/teatro';
import BottomNav from '../components/bottom-nav';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-prod';

export default function Home() {
  const navigate = useNavigate();
  const [teatros, setTeatros] = useState<Teatro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminStatus, setAdminStatus] = useState(false); // Estado local para admin
  const [forceAdmin, setForceAdmin] = useState(false); // Para forçar status admin quando necessário
  const [forceShowButton, setForceShowButton] = useState(true); // Para forçar a exibição do botão durante testes
  const dataService = useDataService();
  const { user, isAdmin, userRole, refreshAdminStatus } = useAuth();
  
  // Verificar status admin em um useEffect separado para garantir que rode a cada renderização
  useEffect(() => {
    const checkAdminDirectly = async () => {
      if (!user) return;
      
      try {
        console.log('Verificando admin diretamente (useEffect separado)');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userIsAdmin = userData.role === 'admin';
          console.log('Verificação direta de admin:', userIsAdmin, userData);
          
          // Atualizar ambos os estados para garantir que o botão apareça
          setAdminStatus(userIsAdmin);
          setForceAdmin(userIsAdmin);
          
          // Se for admin pelo Firestore mas não pelo contexto, tentar atualizar o contexto
          if (userIsAdmin && !isAdmin) {
            console.log('Detectado admin no Firestore mas não no contexto, tentando refresh...');
            try {
              const refreshed = await refreshAdminStatus();
              console.log('Resultado do refresh admin:', refreshed);
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
  }, [user, isAdmin, refreshAdminStatus]); // Adicionando isAdmin e refreshAdminStatus como dependências
  
  useEffect(() => {
    console.log('User info:', user?.email, user?.uid);
    console.log('isAdmin status from auth:', isAdmin);
    console.log('userRole from auth:', userRole);
    console.log('adminStatus state:', adminStatus);
    console.log('forceAdmin state:', forceAdmin);
    console.log('Valor da condição de renderização do botão:', (isAdmin || adminStatus || forceAdmin));
    
    const fetchTeatros = async () => {
      try {
        setLoading(true);
        const data = await dataService.getTeatros();
        console.log('Teatros carregados:', data);
        // Convert to the expected format
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
  }, [dataService, isAdmin, user, userRole]);
  
  // Adicionar este useEffect para forçar mostrar o botão durante desenvolvimento
  useEffect(() => {
    // Se o console indica que é admin, vamos garantir que o botão apareça
    console.log("FORÇANDO EXIBIÇÃO DO BOTÃO");
    const userDocRef = user?.uid ? doc(db, 'users', user.uid) : null;
    
    if (userDocRef) {
      getDoc(userDocRef).then(snapshot => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          if (userData.role === 'admin') {
            console.log("ADMIN DETECTADO, FORÇANDO BOTÃO");
            setForceAdmin(true);
            setForceShowButton(true);
          }
        }
      }).catch(err => {
        console.error("Erro ao verificar admin:", err);
        // Se houver erro, mostra o botão de qualquer forma para teste
        setForceShowButton(true);
      });
    }
  }, [user]);
  
  const renderTeatros = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando seus teatros...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="button">
            Tentar novamente
          </button>
        </div>
      );
    }
    
    if (teatros.length === 0) {
      return (
        <div className="empty-state">
          <p>Você ainda não participa de nenhum teatro.</p>
          {isAdmin && (
            <button 
              onClick={() => navigate('/criar-teatro')} 
              className="button"
            >
              Criar Novo Teatro
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="theaters-list">
        {teatros.map(teatro => (
          <div 
            key={teatro.id} 
            className="theater-card"
            onClick={() => navigate(`/teatro/${teatro.id}`)}
          >
            <h3>{teatro.nome}</h3>
            
            <p>
              <strong>Participantes:</strong> {teatro.qtdParticipantes || 0}
            </p>
            
            <p>
              <strong>Dias de ensaio:</strong> {teatro.diasEnsaio || 'Não definido'}
            </p>
            
            {teatro.status === 'ativo' && (
              <div className="active-indicator"></div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">ServeFirst</h1>
      </div>
      
      <div className="mobile-content">
        <div className="container">
          <h2>Meus Teatros</h2>
          {renderTeatros()}
          
          {/* Debug Info */}
          <div style={{ marginTop: '30px', padding: '10px', border: '1px dashed #ccc', fontSize: '12px' }}>
            <p>Debug: isAdmin={String(isAdmin)}, adminStatus={String(adminStatus)}, forceAdmin={String(forceAdmin)}, forceShowButton={String(forceShowButton)}</p>
            <p>userRole={userRole || 'não definido'}</p>
            <p>Condição botão: {String(isAdmin || adminStatus || forceAdmin || forceShowButton)}</p>
            <button 
              onClick={async () => {
                if (!user) return;
                try {
                  // Primeiro tentar a função do AuthContext
                  const refreshed = await refreshAdminStatus();
                  console.log('Admin status refreshed:', refreshed);
                  
                  // Também verificar direto no Firestore
                  const userDoc = await getDoc(doc(db, 'users', user.uid));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const isUserAdmin = userData.role === 'admin';
                    setForceAdmin(isUserAdmin);
                    setForceShowButton(true); // Forçar exibição do botão após verificação
                    alert(`Admin status verificado: ${isUserAdmin ? 'É admin' : 'Não é admin'} (Refresh: ${refreshed ? 'Sucesso' : 'Falha'})`);
                  }
                } catch (err) {
                  console.error(err);
                  alert('Erro ao verificar status: ' + String(err));
                  // Se houver erro, mostra o botão para teste
                  setForceShowButton(true);
                }
              }}
              style={{
                padding: '5px 10px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              Verificar Admin Agora
            </button>

            <button 
              onClick={() => {
                setForceShowButton(!forceShowButton);
                alert(`Botão ${forceShowButton ? 'escondido' : 'mostrado'} manualmente`);
              }}
              style={{
                padding: '5px 10px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                marginLeft: '5px'
              }}
            >
              {forceShowButton ? 'Esconder' : 'Mostrar'} Botão
            </button>
          </div>
        </div>
      </div>
      
      {/* Usar várias condições para garantir que o botão apareça quando qualquer um 
          dos métodos detectar que o usuário é admin */}
      {(isAdmin || adminStatus || forceAdmin || forceShowButton) && (
        <button 
          className="floating-button"
          onClick={() => navigate('/criar-teatro')}
          aria-label="Criar novo teatro"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '70px',  // Aumentar tamanho para mobile
            height: '70px', // Aumentar tamanho para mobile
            borderRadius: '50%',
            backgroundColor: '#fc6c5f',
            color: 'white',
            fontSize: '36px', // Fonte maior para maior visibilidade em mobile
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)', // Sombra mais escura para destacar
            cursor: 'pointer',
            zIndex: 9999, // Z-index muito alto para garantir que fique sobre tudo
            transform: 'scale(1.1)', // Deixar um pouco maior
            transition: '0.3s all'
          }}
        >
          +
        </button>
      )}
      
      {/* Botão de teste que sempre aparece para verificar se o problema é de estilo */}
      <button 
        className="floating-button-test"
        onClick={() => console.log('Botão de teste clicado')}
        aria-label="Botão de teste"
        style={{
          position: 'fixed',
          bottom: '150px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'green',
          color: 'white',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        TEST
      </button>
      
      <BottomNav />
    </div>
  );
}