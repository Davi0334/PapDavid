import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { getNextPage } from '@/lib/page-router';
import { DocumentImporterButton } from '../components/DocumentImporterButton';

type FormState = {
  quantidadeAtores: string;
  figurino: string;
};

export function DescricaoGrupo() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [formState, setFormState] = useState<FormState>({
    quantidadeAtores: '',
    figurino: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const teatroRef = doc(db, 'teatros', id);
      await updateDoc(teatroRef, {
        quantidadeAtores: formState.quantidadeAtores.trim() ? parseInt(formState.quantidadeAtores) : 0,
        figurino: formState.figurino,
        atualizadoEm: new Date()
      });
      
      // Navegar para a próxima página na sequência
      const nextPage = getNextPage(location.pathname, id);
      navigate(nextPage);
    } catch (error) {
      console.error('Erro ao atualizar descrição do teatro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextImported = (text: string) => {
    setFormState(prev => ({
      ...prev,
      figurino: text
    }));
  };

  return (
    <MobileWrapper title="Descrição" showBackButton={true}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Quantidade de Atores
          </label>
          <input
            type="number"
            name="quantidadeAtores"
            value={formState.quantidadeAtores}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Figurino
          </label>
          <textarea
            name="figurino"
            value={formState.figurino}
            onChange={handleChange}
            rows={10}
            className="w-full p-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
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

        <div className="flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div>
          <DocumentImporterButton 
            onTextExtracted={handleTextImported}
            label="Importar Figurino (DOCX/TXT)"
            isLoading={importLoading}
          />
        </div>
      </form>
    </MobileWrapper>
  );
} 