import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
// import { useDataService } from '@/lib/data-service';
import { Evento } from '@/lib/data-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function EventoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  // const dataService = useDataService();

  useEffect(() => {
    if (!id) {
      navigate('/eventos');
      return;
    }

    const carregarEvento = async () => {
      try {
        setLoading(true);
        // Buscar dados do evento pelo ID diretamente do Firestore
        const eventoRef = doc(db, 'eventos', id);
        const eventoSnap = await getDoc(eventoRef);
        
        if (eventoSnap.exists()) {
          const data = eventoSnap.data();
          setEvento({
            id: eventoSnap.id,
            titulo: data.titulo || '',
            descricao: data.descricao || '',
            data: data.data || '',
            local: data.local || '',
            organizador: data.organizador || '',
            horarioInicio: data.horarioInicio || '',
            horarioFim: data.horarioFim || '',
            teatroId: data.teatroId || '',
            criadoEm: data.criadoEm || '',
            atualizadoEm: data.atualizadoEm || ''
          });
        } else {
          // Se não encontrar o evento, redirecionar para a página de eventos
          navigate('/eventos');
        }
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
        navigate('/eventos');
      } finally {
        setLoading(false);
      }
    };

    carregarEvento();
  }, [id, navigate]);

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    if (!dataString) {
      return "Data não definida";
    }
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "Data inválida";
    }
  };

  const handleGoBack = () => {
    navigate('/eventos');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary/90 text-white p-4 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-primary/90 text-white p-4 flex items-center justify-center">
        <p>Evento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/90 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={handleGoBack} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-center flex-1 -ml-6">
            Evento
          </h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">{evento.titulo}</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-white/70" />
                <span>{formatarData(evento.data)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-white/70" />
                <span>{evento.horarioInicio} - {evento.horarioFim}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-white/70" />
                <span>{evento.local}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="font-medium mb-3">Descrição:</h3>
            <p className="text-white/90">{evento.descricao || "Sem descrição disponível"}</p>
          </div>

          {evento.teatroId && (
            <div className="mt-6">
              <Button 
                className="w-full bg-[#0A1628] text-white rounded-full hover:bg-[#0A1628]/90 py-6"
                onClick={() => navigate(`/teatro/${evento.teatroId}`)}
              >
                Ver Teatro Relacionado
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 