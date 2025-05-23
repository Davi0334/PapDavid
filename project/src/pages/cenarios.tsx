import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { Box, Typography, Paper, Button, Skeleton } from '@mui/material';
// import { useDataService } from '@/lib/data-service';

export function Cenarios() {
  const location = useLocation();
  const navigate = useNavigate();
  const [teatro, setTeatro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // const dataService = useDataService();

  useEffect(() => {
    // Buscar dados do teatro se tiver o ID
    async function loadTeatro() {
      if (location.state?.teatroId) {
        try {
          // const teatroData = await dataService.getTeatroById(location.state.teatroId);
          // if (teatroData) {
          //   setTeatro(teatroData);
          // }
          
          // Dados fictícios para teste
          setTeatro({
            id: '123',
            titulo: 'Teatro de Teste'
          });
        } catch (error) {
          console.error("Erro ao carregar teatro:", error);
        }
      }
      setLoading(false);
    }
    
    loadTeatro();
  }, [location.state]);

  const handleGoBack = () => {
    // Verificar se veio de uma página de detalhes de teatro
    if (location.state?.teatroId) {
      navigate(`/teatro/${location.state.teatroId}`);
    } else {
      // Caso não tenha o ID do teatro, voltar para a página anterior
      navigate(-1);
    }
  };

  const handleViewOrdemCenarios = () => {
    navigate('/ordem-cenarios', { 
      state: { 
        teatroId: location.state?.teatroId,
        backTo: location.state?.teatroId ? `/teatro/${location.state.teatroId}` : -1 
      } 
    });
  };

  return (
    <MobileWrapper 
      title="Cenários"
      showBackButton={true}
      onBack={handleGoBack}
    >
      <Box sx={{ p: 2, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Quantidade de Cenas:
          </Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(255,255,255,0.06)', 
              borderRadius: 2 
            }}
          >
            <Typography>
              {teatro?.quantidadeCenas || "Não definido"}
            </Typography>
          </Paper>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Cenário:
          </Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              minHeight: 200, 
              bgcolor: 'rgba(255,255,255,0.06)', 
              borderRadius: 2 
            }}
          >
            {loading ? (
              <Skeleton variant="text" height={120} />
            ) : teatro?.cenarios ? (
              <Typography>{teatro.cenarios}</Typography>
            ) : (
              <Typography color="text.secondary">
                Informações sobre cenários não disponíveis
              </Typography>
            )}
          </Paper>
        </Paper>

        <Button 
          variant="contained"
          fullWidth
          onClick={handleViewOrdemCenarios}
          sx={{ py: 1.5, borderRadius: 3 }}
        >
          Ver Ordem Dos Cenários
        </Button>
      </Box>
    </MobileWrapper>
  );
}