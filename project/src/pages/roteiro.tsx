import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { Box, Typography, Paper, Skeleton, Button, TextField, Divider } from '@mui/material';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DocumentImporterButton } from '../components/DocumentImporterButton';

// Definir o tipo para o teatro
interface Teatro {
  id: string;
  titulo?: string;
  roteiro?: string;
  numeroAtos?: number;
  dataApresentacao?: string;
  [key: string]: any; // Para outras propriedades
}

export function Roteiro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(true);
  const [roteiro, setRoteiro] = useState('');
  const [saving, setSaving] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const loadTeatro = async () => {
      setLoading(true);
      
      const teatroId = id || location.state?.teatroId;
      
      if (teatroId) {
        try {
          const docRef = doc(db, 'teatros', teatroId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const teatroData = { id: docSnap.id, ...docSnap.data() } as Teatro;
            setTeatro(teatroData);
            setRoteiro(teatroData.roteiro || '');
          }
        } catch (error) {
          console.error('Erro ao carregar teatro:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadTeatro();
  }, [id, location.state]);

  const handleGoBack = () => {
    // Verificar se veio de uma página de detalhes de teatro
    if (teatro?.id) {
      navigate(`/teatro/${teatro.id}`);
    } else {
      // Caso não tenha o ID do teatro, voltar para a página anterior
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (!teatro?.id) return;
    
    setSaving(true);
    
    try {
      const teatroRef = doc(db, 'teatros', teatro.id);
      await updateDoc(teatroRef, {
        roteiro: roteiro,
        atualizadoEm: new Date()
      });
      
      // Atualizar o estado local
      setTeatro((prev: Teatro | null) => {
        if (!prev) return null;
        return {
          ...prev,
          roteiro: roteiro
        };
      });
      
      // Mostrar feedback
      alert('Roteiro salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar roteiro:', error);
      alert('Erro ao salvar o roteiro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleTextImported = (text: string) => {
    setRoteiro(text);
  };

  return (
    <MobileWrapper 
      title="Roteiro"
      showBackButton={true}
    >
      <Box sx={{ p: 2, mb: 4 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={400} />
        ) : (
          <>
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Roteiro:
              </Typography>
              
              <TextField
                multiline
                fullWidth
                rows={12}
                variant="outlined"
                value={roteiro}
                onChange={(e) => setRoteiro(e.target.value)}
                placeholder="Digite o roteiro do teatro aqui..."
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.06)'
                  }
                }}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={handleSave}
                disabled={saving}
                sx={{ mb: 2 }}
              >
                {saving ? 'Salvando...' : 'Salvar Roteiro'}
              </Button>
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">ou</Typography>
              </Divider>
              
              <DocumentImporterButton
                onTextExtracted={handleTextImported}
                label="Importar Roteiro (DOCX/TXT)"
                isLoading={importLoading}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Quantidade de Atos:
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
                    {teatro?.numeroAtos || "Não definido"}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Data de Apresentação:
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
                    {teatro?.dataApresentacao ? 
                      new Date(teatro.dataApresentacao).toLocaleDateString() : 
                      "Não definida"}
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </MobileWrapper>
  );
}