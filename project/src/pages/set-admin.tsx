import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-prod';
import { useNavigate } from 'react-router-dom';

export function SetAdmin() {
  const { user, isAdmin, userRole, refreshAdminStatus } = useAuth();
  const [message, setMessage] = useState('');
  const [localAdminStatus, setLocalAdminStatus] = useState(false);
  const navigate = useNavigate();
  
  // Verificar o status atual no carregamento
  React.useEffect(() => {
    if (!user) return;
    
    const checkCurrentStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLocalAdminStatus(userData.role === 'admin');
        }
      } catch (err) {
        console.error('Erro ao verificar status atual:', err);
      }
    };
    
    checkCurrentStatus();
  }, [user]);
  
  const setUserAsAdmin = async () => {
    if (!user) {
      setMessage('Você precisa estar logado para usar esta função');
      return;
    }
    
    try {
      setMessage('Processando...');
      console.log('Tentando definir usuário como admin:', user.uid);
      
      // Referência ao documento do usuário
      const userRef = doc(db, 'users', user.uid);
      
      // Atualiza o papel para 'admin'
      await updateDoc(userRef, {
        role: 'admin'  // AuthContext detecta isAdmin quando role === 'admin'
      });
      
      // Verificar se a atualização foi bem-sucedida
      const updatedDoc = await getDoc(userRef);
      const updatedData = updatedDoc.data();
      const isNowAdmin = updatedData?.role === 'admin';
      
      console.log('Usuário definido como admin com sucesso! Novo status:', isNowAdmin);
      setLocalAdminStatus(isNowAdmin);
      
      // Tentar atualizar o contexto de autenticação com a nova função
      try {
        const refreshedStatus = await refreshAdminStatus();
        console.log('Status admin refreshed no contexto:', refreshedStatus);
        
        if (refreshedStatus) {
          setMessage(
            'Usuário definido como administrador com sucesso! ' +
            'O status de admin foi atualizado. Você já deve ter acesso às funcionalidades de admin.'
          );
        } else {
          setMessage(
            'Usuário definido como administrador no Firestore, mas o contexto não atualizou. ' +
            'Por favor, faça logout e login novamente para aplicar as alterações em todo o aplicativo.'
          );
        }
      } catch (refreshError) {
        console.error('Erro ao atualizar contexto:', refreshError);
        setMessage(
          'Usuário definido como administrador com sucesso! ' +
          'Por favor, faça logout e login novamente para aplicar as alterações em todo o aplicativo.'
        );
      }
    } catch (error) {
      console.error('Erro ao definir usuário como admin:', error);
      setMessage('Erro ao definir usuário como administrador: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const forceRefresh = async () => {
    // Primeiro tentar atualizar o contexto usando a função refreshAdminStatus
    try {
      setMessage('Atualizando status de admin...');
      const refreshed = await refreshAdminStatus();
      console.log('Status após refresh:', refreshed);
      
      if (refreshed) {
        setMessage('Status de admin atualizado com sucesso! Você já deve ter acesso às funcionalidades de admin.');
      } else {
        // Se falhar, tentar recarregar a página
        setMessage('Não foi possível atualizar o status. Tentando recarregar a página...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Navegar para a home e depois voltar para forçar uma nova renderização
      navigate('/');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">Ferramentas de Desenvolvimento</h1>
      </div>
      
      <div className="mobile-content">
        <div className="container">
          <h2>Status de Admin</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <p><strong>User ID:</strong> {user?.uid || 'Não logado'}</p>
            <p><strong>Email:</strong> {user?.email || 'Não logado'}</p>
            <p><strong>User Role:</strong> {userRole || 'Não definido'}</p>
            <p><strong>Admin (context):</strong> {isAdmin ? 'SIM' : 'NÃO'}</p>
            <p><strong>Admin (Firestore atual):</strong> {localAdminStatus ? 'SIM' : 'NÃO'}</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="button-primary"
              onClick={setUserAsAdmin}
              disabled={!user}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fc6c5f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Definir como Admin
            </button>
            
            <button 
              onClick={forceRefresh}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Recarregar Aplicativo
            </button>
            
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#5cb85c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Voltar para Home
            </button>
          </div>
          
          {message && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '15px'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <h3>Instruções</h3>
            <p>
              Esta página permite definir o usuário atual como administrador.
              Após definir o status, você pode:
            </p>
            <ol>
              <li>Fazer logout e login novamente para atualizar em todo o aplicativo (recomendado)</li>
              <li>Clicar em "Recarregar Aplicativo" para tentar forçar a atualização sem logout</li>
              <li>Voltar para a Home e clicar no botão "Verificar Admin Agora" para atualizar o status</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 