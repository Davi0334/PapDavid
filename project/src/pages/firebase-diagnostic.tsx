import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, CircularProgress, Alert, Grid, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon, WifiOff as WifiOffIcon, Check as CheckIcon } from '@mui/icons-material';
import { db, auth, attemptReconnect, handleFirebaseError } from '../lib/firebase-prod';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useAuth } from '../lib/auth';

export const FirebaseDiagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Run initial diagnostic
    runDiagnostic();

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    setErrorDetails(null);
    setDiagnosticResults(null);

    try {
      // Verificar conectividade com a internet
      const internetConnected = navigator.onLine;
      
      // Verificar conexão com Firebase
      let firebaseConnected = false;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        await getDocs(q);
        firebaseConnected = true;
      } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
        firebaseConnected = false;
        setErrorDetails(error instanceof Error ? error.message : 'Erro desconhecido');
      }
      
      // Verificar se o usuário está autenticado
      const isAuthenticated = !!user;
      
      // Preparar resultados do diagnóstico
      setDiagnosticResults({
        internetConnected,
        firebaseConnected,
        isAuthenticated,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      setErrorDetails(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const success = await attemptReconnect();
      if (success) {
        runDiagnostic();
      } else {
        setErrorDetails('Não foi possível reconectar ao Firebase. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('Erro ao tentar reconectar:', error);
      setErrorDetails(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setReconnecting(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mr: 2 }}>
            Voltar
          </Button>
          <Typography variant="h5" component="h1">
            Diagnóstico de Conexão Firebase
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box mb={3}>
          <Alert severity={isOnline ? "success" : "error"}>
            Status de rede: {isOnline ? "Conectado" : "Desconectado"}
          </Alert>
        </Box>
        
        {loading ? (
          <Box textAlign="center" p={4}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Executando diagnóstico...</Typography>
          </Box>
        ) : (
          <>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={runDiagnostic}
              disabled={reconnecting}
              sx={{ mb: 3 }}
              fullWidth
            >
              Executar Diagnóstico
            </Button>
            
            {diagnosticResults && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Resultados do Diagnóstico</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Conexão com Internet</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {diagnosticResults.internetConnected ? (
                        <CheckIcon color="success" />
                      ) : (
                        <WifiOffIcon color="error" />
                      )}
                      <Typography sx={{ ml: 1 }}>
                        {diagnosticResults.internetConnected ? "Conectado" : "Desconectado"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Conexão com Firebase</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {diagnosticResults.firebaseConnected ? (
                        <CheckIcon color="success" />
                      ) : (
                        <WifiOffIcon color="error" />
                      )}
                      <Typography sx={{ ml: 1 }}>
                        {diagnosticResults.firebaseConnected ? "Conectado" : "Desconectado"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Autenticação</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {diagnosticResults.isAuthenticated ? (
                        <CheckIcon color="success" />
                      ) : (
                        <WifiOffIcon color="error" />
                      )}
                      <Typography sx={{ ml: 1 }}>
                        {diagnosticResults.isAuthenticated ? "Autenticado" : "Não Autenticado"}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Horário do Diagnóstico</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {new Date(diagnosticResults.timestamp).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
            
            {errorDetails && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="subtitle1">Erro detectado:</Typography>
                <Typography variant="body2">{errorDetails}</Typography>
              </Alert>
            )}
            
            <Box mt={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleReconnect}
                disabled={reconnecting || !diagnosticResults || diagnosticResults.firebaseConnected}
                fullWidth
              >
                {reconnecting ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Tentando reconectar...
                  </>
                ) : (
                  "Tentar Reconectar ao Firebase"
                )}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default FirebaseDiagnostic; 