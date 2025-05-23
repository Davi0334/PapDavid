import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';

type Cenario = {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
};

export function OrdemCenarios() {
  const { id } = useParams<{ id: string }>();
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Carregar cenários
  useEffect(() => {
    const carregarCenarios = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        const teatroRef = doc(db, 'teatros', id);
        const teatroDoc = await getDoc(teatroRef);
        
        if (teatroDoc.exists()) {
          const teatro = teatroDoc.data();
          // Verificar se o teatro tem cenários
          const cenariosDoTeatro = teatro.cenarios || [];
          
          // Se não tiver cenários, criar alguns exemplos com base na descrição
          if (cenariosDoTeatro.length === 0 && teatro.cenario) {
            // Extrair possíveis cenários da descrição
            const descricao = teatro.cenario as string;
            const possiveisCenarios = descricao.split('.')[0].split(',');
            
            // Criar cenários baseados na descrição
            const cenarosExemplo = possiveisCenarios.map((cenario, index) => ({
              id: `cenario-${index + 1}`,
              nome: cenario.trim(),
              descricao: `Descrição para ${cenario.trim()}`,
              ordem: index + 1
            }));
            
            setCenarios(cenarosExemplo);
          } else {
            // Ordenar cenários por ordem
            const cenariosOrdenados = [...cenariosDoTeatro].sort((a, b) => a.ordem - b.ordem);
            setCenarios(cenariosOrdenados);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cenários:', error);
        
        // Dados de exemplo para desenvolvimento
        const cenariosExemplo: Cenario[] = [
          { id: 'cenario1', nome: 'Varanda de Julieta', descricao: 'Famosa varanda onde ocorre a cena do balcão', ordem: 1 },
          { id: 'cenario2', nome: 'Praça de Verona', descricao: 'Local onde ocorrem as brigas entre as famílias', ordem: 2 },
          { id: 'cenario3', nome: 'Cripta dos Capuleto', descricao: 'Túmulo onde ocorre o final trágico', ordem: 3 }
        ];
        setCenarios(cenariosExemplo);
      } finally {
        setLoading(false);
      }
    };

    carregarCenarios();
  }, [id, navigate]);

  // Mover cenário para cima
  const moverCenarioCima = (index: number) => {
    if (index <= 0) return;
    
    const novosCenarios = [...cenarios];
    const temp = novosCenarios[index];
    novosCenarios[index] = novosCenarios[index - 1];
    novosCenarios[index - 1] = temp;
    
    // Atualizar ordem
    novosCenarios.forEach((cenario, idx) => {
      cenario.ordem = idx + 1;
    });
    
    setCenarios(novosCenarios);
  };

  // Mover cenário para baixo
  const moverCenarioBaixo = (index: number) => {
    if (index >= cenarios.length - 1) return;
    
    const novosCenarios = [...cenarios];
    const temp = novosCenarios[index];
    novosCenarios[index] = novosCenarios[index + 1];
    novosCenarios[index + 1] = temp;
    
    // Atualizar ordem
    novosCenarios.forEach((cenario, idx) => {
      cenario.ordem = idx + 1;
    });
    
    setCenarios(novosCenarios);
  };

  // Salvar ordem dos cenários
  const salvarOrdem = async () => {
    if (!id) return;
    
    setSaving(true);
    try {
      const teatroRef = doc(db, 'teatros', id);
      await updateDoc(teatroRef, {
        cenarios: cenarios
      });
      
      navigate(`/teatro/${id}/cenario`);
    } catch (error) {
      console.error('Erro ao salvar ordem dos cenários:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileWrapper title="Teatro">
      <div className="bg-[#ff7f7f] min-h-screen pt-4 pb-16">
        <div className="px-4">
          {/* Botão de voltar */}
          <button 
            onClick={() => navigate(`/teatro/${id}/cenario`)}
            className="absolute top-4 left-4 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          
          {/* Área de conteúdo */}
          <div className="mt-12">
            {/* Grande área cinza para ordem dos cenários */}
            <div className="bg-gray-200 rounded-lg p-4 mb-8 min-h-[300px]">
              <h2 className="text-black text-xl font-medium mb-4 text-center">Ordem dos Cenarios:</h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando cenários...
                </div>
              ) : cenarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Não há cenários cadastrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {cenarios.map((cenario, index) => (
                    <div 
                      key={cenario.id} 
                      className="bg-[#FF7F7F] rounded-lg p-4 text-white relative flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-lg font-medium">{cenario.nome}</h3>
                        <p className="text-sm">{cenario.descricao}</p>
                      </div>
                      
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moverCenarioCima(index)}
                          disabled={index === 0}
                          className="p-1 disabled:opacity-50"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverCenarioBaixo(index)}
                          disabled={index === cenarios.length - 1}
                          className="p-1 disabled:opacity-50"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Botão de salvar */}
            {!loading && cenarios.length > 0 && (
              <button
                type="button"
                onClick={salvarOrdem}
                disabled={saving}
                className="w-full h-12 bg-[#002B5B] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {saving ? 'Salvando...' : 'Salvar Ordem'}
              </button>
            )}
          </div>
        </div>
      </div>
    </MobileWrapper>
  );
}