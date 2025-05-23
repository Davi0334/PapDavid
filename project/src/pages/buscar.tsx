import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Search } from 'lucide-react';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Teatro = {
  id: string;
  titulo: string;
  descricao?: string;
  diasEnsaio?: string[];
  dataApresentacao?: string;
  roteiro?: string;
  participantes?: string[];
  criador: string;
};

export function Buscar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, digite um ID de teatro');
      return;
    }

    setLoading(true);
    setError('');
    setTeatro(null);

    try {
      const teatroRef = doc(db, 'teatros', searchQuery.trim());
      const teatroSnap = await getDoc(teatroRef);

      if (teatroSnap.exists()) {
        setTeatro({ id: teatroSnap.id, ...teatroSnap.data() } as Teatro);
      } else {
        setError('Teatro não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar teatro:', err);
      setError('Erro ao buscar teatro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar dias de ensaio para exibição
  const formatarDiasEnsaio = (dias?: string[]) => {
    if (!dias || dias.length === 0) return 'Não definido';
    return dias.join(', ');
  };

  // Formatar data de apresentação para exibição
  const formatarDataApresentacao = (data?: string) => {
    if (!data) return 'Não definida';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Função para verificar se o usuário já participa do teatro
  const userParticipates = (teatro: Teatro) => {
    return teatro.participantes && teatro.participantes.includes(user?.uid || '');
  };

  return (
    <MobileWrapper title="Buscar Teatro">
      <div className="p-4">
        <div className="flex items-center mb-6 bg-gray-100 rounded-full p-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite o ID do teatro"
            className="flex-1 bg-transparent outline-none px-2"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="p-2 rounded-full"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>
        </div>

        {loading && <p className="text-center">Buscando...</p>}
        
        {error && <p className="text-center text-red-500">{error}</p>}

        {teatro && (
          <Link to={`/teatro/${teatro.id}`} className="block">
            <div className="bg-[#ff7f50] text-white rounded-xl p-4 shadow-md">
              <h2 className="text-xl font-bold mb-2">{teatro.titulo}</h2>
              <p className="mb-2">
                <span className="font-semibold">Dias de ensaio:</span>{' '}
                {formatarDiasEnsaio(teatro.diasEnsaio)}
              </p>
              <p>
                <span className="font-semibold">Data de apresentação:</span>{' '}
                {formatarDataApresentacao(teatro.dataApresentacao)}
              </p>
              <div className="flex justify-between items-center mt-4">
                <button
                  className="bg-white text-[#ff7f50] px-3 py-1 rounded-full text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </Link>
        )}
      </div>
    </MobileWrapper>
  );
} 