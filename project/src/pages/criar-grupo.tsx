import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { db } from '@/lib/firebase';
import { getNextPage } from '@/lib/page-router';

type FormState = {
  titulo: string;
  diasEnsaio: string;
  dataApresentacao: string;
};

export function CriarGrupo() {
  const [formState, setFormState] = useState<FormState>({
    titulo: '',
    diasEnsaio: '',
    dataApresentacao: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.titulo.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const diasEnsaioArray = formState.diasEnsaio
        .split(',')
        .map(dia => dia.trim())
        .filter(dia => dia);

      // Adicionando o criador como participante já na criação
      const participantes = user?.uid ? [user.uid] : [];

      const teatroData = {
        titulo: formState.titulo,
        descricao: '',
        diasEnsaio: diasEnsaioArray,
        dataApresentacao: formState.dataApresentacao || null,
        participantes: participantes, // O criador já é adicionado como participante
        criador: user?.uid || 'unknown',
        criadoEm: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'teatros'), teatroData);
      
      // Navegar para a próxima página na sequência
      const nextPage = getNextPage(location.pathname, docRef.id);
      navigate(nextPage);
    } catch (error) {
      console.error('Erro ao criar teatro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileWrapper title="Criar Grupo:" showBackButton={true}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Título
          </label>
          <input
            type="text"
            name="titulo"
            value={formState.titulo}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Dias de Ensaio:
          </label>
          <input
            type="text"
            name="diasEnsaio"
            value={formState.diasEnsaio}
            onChange={handleChange}
            placeholder="Segunda, Quarta, Sexta"
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Data de Apresentação
          </label>
          <input
            type="date"
            name="dataApresentacao"
            value={formState.dataApresentacao}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#002B5B] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? 'Salvando...' : 'Criar Grupo'}
          </button>
        </div>
      </form>
    </MobileWrapper>
  );
}