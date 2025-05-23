import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw, WifiOff, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { attemptReconnect } from '@/lib/firebase-prod';

interface FirebaseErrorHandlerProps {
  error: Error | null;
  resetError: () => void;
  children: React.ReactNode;
}

export function FirebaseErrorHandler({ error, resetError, children }: FirebaseErrorHandlerProps) {
  const [showError, setShowError] = useState(false);
  const [modoOfflineAtivo, setModoOfflineAtivo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
    // Verificar o estado da conexão de rede
    setModoOfflineAtivo(!navigator.onLine);
  }, [error]);

  if (!error) {
    return <>{children}</>;
  }

  const handleContinueAnyway = () => {
    // Continuar mesmo sem conexão
    setModoOfflineAtivo(true);
    setShowError(false);
    resetError();
  };

  const handleRetry = async () => {
    try {
      // Tentar reconectar
      await attemptReconnect();
      window.location.reload();
    } catch (error) {
      console.error("Falha ao tentar reconectar:", error);
    }
  };
  
  const irParaDiagnostico = () => {
    navigate('/firebase-diagnostico');
  };

  return (
    <>
      {showError ? (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de conexão com o Firebase</AlertTitle>
              <AlertDescription>
                Não foi possível conectar ao Firestore. Isso pode ser devido a problemas de rede ou configuração.
                {modoOfflineAtivo && " O modo offline está ativado."}
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-muted-foreground mb-6">
              <p>Detalhes do erro:</p>
              <pre className="bg-muted p-2 rounded-md overflow-auto text-xs mt-2">
                {error.message}
              </pre>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleRetry} className="w-full flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                {modoOfflineAtivo ? "Tentar reconexão" : "Tentar novamente"}
              </Button>
              
              {!modoOfflineAtivo && (
                <Button 
                  variant="outline" 
                  onClick={handleContinueAnyway} 
                  className="w-full flex items-center gap-2"
                >
                  <WifiOff className="h-4 w-4" />
                  Continuar em modo offline
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                onClick={irParaDiagnostico} 
                className="w-full"
              >
                Ir para ferramenta de diagnóstico
              </Button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
} 