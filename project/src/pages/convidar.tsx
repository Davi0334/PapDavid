import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { Box, Paper, Typography, TextField, Stack, Divider, Snackbar, Alert } from '@mui/material';
import { detectDeviceType, mobileUIConfig } from '@/lib/mobile-config';

export function ConvidarParticipantes() {
  const [groupId, setGroupId] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();
  const platform = detectDeviceType();

  const handleCopy = () => {
    if (groupId) {
      navigator.clipboard.writeText(groupId)
        .then(() => {
          setSnackbarOpen(true);
        })
        .catch(err => {
          console.error('Não foi possível copiar o texto: ', err);
        });
    }
  };

  const handleShare = async () => {
    if (!groupId) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ServeFirst - Convite para Grupo',
          text: `Junte-se ao nosso grupo no ServeFirst usando o ID: ${groupId}`,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <MobileWrapper
      title="Convidar Participantes"
      showBackButton={true}
      onBack={() => navigate(-1)}
    >
      <Box sx={{ p: 2 }}>
        <Paper 
          elevation={platform === 'ios' ? 0 : 1}
          sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: platform === 'ios' ? '12px' : '4px',
            border: platform === 'ios' ? '1px solid rgba(0,0,0,0.1)' : 'none',
            bgcolor: platform === 'ios' ? 'rgba(0,0,0,0.02)' : 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            ID do Grupo
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use o ID abaixo para convidar outras pessoas para o seu grupo. Elas precisarão adicionar este ID na página de participação.
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Digite ou cole o ID do grupo"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: platform === 'ios' ? '8px' : '4px' }
            }}
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2}>
            <Button 
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar ID
            </Button>
            
            <Button 
              onClick={handleShare}
              variant="default"
              className="flex-1"
              style={{ backgroundColor: mobileUIConfig.colors.primary }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </Stack>
        </Paper>
        
        <Paper 
          elevation={platform === 'ios' ? 0 : 1}
          sx={{ 
            p: 3,
            borderRadius: platform === 'ios' ? '12px' : '4px',
            border: platform === 'ios' ? '1px solid rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            Seus Grupos
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione um grupo abaixo para ver seu ID e convidar participantes.
          </Typography>
          
          <Box sx={{ 
            p: 3, 
            textAlign: 'center', 
            bgcolor: 'rgba(0,0,0,0.03)', 
            borderRadius: '8px' 
          }}>
            <Typography variant="body2">
              Você não administra nenhum grupo ainda.
            </Typography>
            
            <Button
              onClick={() => navigate('/criar-grupo')}
              variant="default"
              className="mt-2"
              style={{ backgroundColor: mobileUIConfig.colors.primary }}
            >
              Criar Novo Grupo
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          ID copiado para a área de transferência!
        </Alert>
      </Snackbar>
    </MobileWrapper>
  );
}