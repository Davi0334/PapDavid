import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { Copy } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function ConvidarParticipantes() {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Efeito para adicionar o criador como participante ao carregar a página
  useEffect(() => {
    if (id && user?.uid) {
      adicionarCriadorComoParticipante();
    }
  }, [id, user]);
  
  // Função para adicionar o criador como participante
  const adicionarCriadorComoParticipante = async () => {
    if (!id || !user?.uid) return;
    
    try {
      setLoading(true);
      const teatroRef = doc(db, 'teatros', id);
      const teatroSnap = await getDoc(teatroRef);
      
      if (teatroSnap.exists()) {
        const teatroData = teatroSnap.data();
        
        // Verifica se o usuário atual é o criador e não está na lista de participantes
        if (teatroData.criador === user.uid && 
            (!teatroData.participantes || !teatroData.participantes.includes(user.uid))) {
          
          // Adiciona o criador à lista de participantes
          await updateDoc(teatroRef, {
            participantes: arrayUnion(user.uid)
          });
          
          console.log('Criador adicionado como participante com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar criador como participante:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
  };

  // Função para copiar o ID e finalizar a criação do grupo
  const handleCopiarECriar = async () => {
    // Copiar o ID para a área de transferência
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
        setCopiado(true);
        
        // Exibir mensagem de sucesso temporária
        setTimeout(() => {
          setCopiado(false);
          // Redirecionar para a página inicial imediatamente após a mensagem
          navigate('/');
        }, 1500);
      } catch (error) {
        console.error('Erro ao copiar ID:', error);
        // Em caso de erro, ainda redireciona para a página inicial
        navigate('/');
      }
    }
  };

  return (
    <MobileWrapper title="Convidar participantes" showBackButton={true}>
      <div className="mt-6 space-y-6">
        {email && (
          <div className="space-y-2">
            <label className="block text-lg font-medium text-center">
              Email dos Participantes:
            </label>
            <input
              type="email"
              value={email}
              onChange={handleChange}
              className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={id || ''}
              readOnly
              className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={handleCopiarECriar}
            disabled={loading}
            className="w-full h-12 bg-[#FF7F7F] text-white font-bold rounded-lg shadow-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            {copiado ? 'ID Copiado!' : loading ? 'Processando...' : 'Copiar Id/Recriar Grupo'}
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
} 