import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';

type RoteiroParams = {
  id: string;
};

type Teatro = {
  id: string;
  titulo: string;
  roteiro?: string;
  qtdAtos?: number;
  dataApresentacao?: string;
  criador: string;
};

export function RoteiroDetalhes() {
  const { id } = useParams<RoteiroParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarTeatro = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const teatroRef = doc(db, 'teatros', id);
        const teatroSnap = await getDoc(teatroRef);
        
        if (teatroSnap.exists()) {
          setTeatro({ id: teatroSnap.id, ...teatroSnap.data() } as Teatro);
        } else {
          setError('Teatro não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar teatro:', error);
        setError('Erro ao carregar dados do teatro');
      } finally {
        setLoading(false);
      }
    };
    
    carregarTeatro();
  }, [id]);

  // Verificar se o usuário atual é o criador/admin do teatro
  const isCreator = user && teatro ? user.uid === teatro.criador : false;

  // Formatar a data de apresentação
  const formatarData = (data?: string) => {
    if (!data) return "Não definida";
    
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch (error) {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <MobileWrapper title="Carregando...">
        <div className="flex items-center justify-center h-96">
          <p>Carregando detalhes do roteiro...</p>
        </div>
      </MobileWrapper>
    );
  }

  if (error || !teatro) {
    return (
      <MobileWrapper title="Erro">
        <div className="p-4">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error || 'Teatro não encontrado'}
          </div>
          <button
            onClick={() => navigate(`/teatro/${id}`)}
            className="flex items-center justify-center gap-2 bg-[#002B5B] text-white rounded-full py-2 px-4"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        </div>
      </MobileWrapper>
    );
  }

  return (
    <MobileWrapper title="Teatro">
      <div className="bg-[#ff7f7f] min-h-screen pt-4 pb-16">
        <div className="px-4">
          {/* Botão de voltar */}
          <button 
            onClick={() => navigate(`/teatro/${id}`)}
            className="absolute top-4 left-4 text-white"
          >
            <ArrowLeft size={24} />
          </button>
          
          {/* Área de conteúdo do roteiro */}
          <div className="mt-12">
            {/* Grande área cinza para detalhes do roteiro */}
            <div className="bg-gray-200 rounded-lg p-4 mb-8 min-h-[300px]">
              <h2 className="text-black text-xl font-medium mb-4 text-center">Roteiro:</h2>
              <div className="text-gray-700">
                {teatro.roteiro ? (
                  <p className="whitespace-pre-line">{teatro.roteiro}</p>
                ) : (
                  <p className="text-center text-gray-500">Nenhuma descrição de roteiro disponível</p>
                )}
              </div>
            </div>
            
            {/* Card de informações adicionais */}
            <div className="bg-[#ff7f7f] rounded-lg p-4 text-white">
              <p className="mb-3">
                <span className="font-semibold">Quantidade de Atos:</span>{' '}
                {teatro.qtdAtos || 'Não definido'}
              </p>
              
              <p>
                <span className="font-semibold">Data de Apresentação:</span>{' '}
                {formatarData(teatro.dataApresentacao)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileWrapper>
  );
} 