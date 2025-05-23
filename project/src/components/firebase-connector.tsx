import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase-prod';
import { Alert, Snackbar, Button } from '@mui/material';
import { WifiOff, Refresh } from '@mui/icons-material';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export const FirebaseConnector: React.FC = () => {
  const navigate = useNavigate();
  const [showErrorBar, setShowErrorBar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  // Check Firebase connection on initialization
  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      try {
        // Check connection by making a simple request
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        await getDocs(q);
        
        // If we reach here, connection is working
        if (isMounted && offlineMode) {
          setOfflineMode(false);
        }
      } catch (error) {
        console.error('Error checking Firebase connection:', error);
        if (isMounted) {
          setErrorMessage(`Erro de conexão: ${error instanceof Error ? error.message : String(error)}`);
          setShowErrorBar(true);
          setOfflineMode(true);
        }
      }
    };
    
    // Check connection initially
    checkConnection();
    
    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [offlineMode]);

  const handleCloseErrorBar = () => {
    setShowErrorBar(false);
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      // Try a simple Firebase operation to check connection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      await getDocs(q);
      
      setErrorMessage('Conexão restaurada com sucesso!');
      setShowErrorBar(true);
      setOfflineMode(false);
      setTimeout(() => {
        if (showErrorBar) setShowErrorBar(false);
      }, 3000);
    } catch (error) {
      setErrorMessage(`Falha ao tentar reconectar: ${error instanceof Error ? error.message : String(error)}`);
      setShowErrorBar(true);
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <>
      <Snackbar 
        open={showErrorBar} 
        autoHideDuration={offlineMode ? null : 6000} 
        onClose={handleCloseErrorBar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={offlineMode ? "warning" : "error"} 
          sx={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-action': { alignItems: 'center' }
          }}
          action={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleReconnect}
                disabled={reconnecting}
                startIcon={<Refresh />}
              >
                {reconnecting ? 'Reconectando...' : 'Reconectar'}
              </Button>
            </div>
          }
        >
          {offlineMode ? 'Sem conexão. Tente reconectar.' : errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
