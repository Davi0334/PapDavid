import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase-prod';

/**
 * Componente de botão de administrador que aparece independente
 * da estrutura da aplicação para garantir que sempre seja visível
 * para administradores.
 */
export default function AdminButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAdmin, refreshAdminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se o usuário é admin diretamente do Firestore
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      console.log("AdminButton: verificando status admin...");
      
      try {
        // Primeiro tentar através do contexto
        await refreshAdminStatus();
        
        // Também verificar diretamente no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isUserAdmin = userData.role === 'admin';
          console.log("AdminButton: status admin direto do Firestore:", isUserAdmin);
          
          // Se for admin por qualquer meio, mostrar o botão
          if (isUserAdmin || isAdmin) {
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error("AdminButton: erro ao verificar status admin:", err);
        // Em caso de erro, vamos confiar no isAdmin do contexto
        if (isAdmin) {
          setIsVisible(true);
        }
      }
    };

    // Verificar imediatamente e depois a cada 5 segundos
    checkAdminStatus();
    const interval = setInterval(checkAdminStatus, 5000);

    return () => clearInterval(interval);
  }, [user, isAdmin, refreshAdminStatus]);

  // Verificar se estamos na página home
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  // Não mostrar o botão se não for admin ou se não estiver na página home
  if (!isVisible || !isHomePage) return null;

  return (
    <button
      className="admin-floating-button"
      onClick={() => navigate('/criar-teatro')}
      aria-label="Criar novo teatro"
      style={{
        position: 'fixed',
        bottom: '85px',
        right: '25px',
        width: '75px',
        height: '75px',
        borderRadius: '50%',
        backgroundColor: '#fc6c5f',
        color: 'white',
        fontSize: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        zIndex: 9999,
        fontWeight: 'bold',
        transform: 'translateZ(0)',
      }}
    >
      +
    </button>
  );
} 