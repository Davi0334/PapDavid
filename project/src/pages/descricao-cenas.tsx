import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { getNextPage } from '@/lib/page-router';
import mammoth from 'mammoth';
import { CenarioImporter } from '@/components/CenarioImporter';

type FormState = {
  quantidadeCenas: string;
  cenario: string;
};

export function DescricaoCenas() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [formState, setFormState] = useState<FormState>({
    quantidadeCenas: '',
    cenario: ''
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
        quantidadeCenas: formState.quantidadeCenas.trim() ? parseInt(formState.quantidadeCenas) : 0,
        cenario: formState.cenario,
        atualizadoEm: new Date()
      });
      
      // Navegar para a próxima página na sequência
      const nextPage = getNextPage(location.pathname, id);
      navigate(nextPage);
    } catch (error) {
      console.error('Erro ao atualizar informações de cenas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrdemCenarios = () => {
    if (id) {
      navigate(`/ordem-cenarios/${id}`);
    }
  };

  const handleImportarCenario = (texto: string) => {
    // Atualizar o estado com o texto extraído
    setFormState(prev => ({
      ...prev,
      cenario: texto
    }));
  };

  return (
    <MobileWrapper title="Descrição" showBackButton={true}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Quantidade de Cenas:
          </label>
          <input
            type="number"
            name="quantidadeCenas"
            value={formState.quantidadeCenas}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Cenario:
          </label>
          <textarea
            name="cenario"
            value={formState.cenario}
            onChange={handleChange}
            rows={10}
            className="w-full p-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={handleOrdemCenarios}
            className="w-full h-12 bg-[#FF7F7F] text-white font-bold rounded-lg shadow-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
          >
            Ordem Dos Cenarios
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#002B5B] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? 'Salvando...' : 'Recriar Grupo'}
          </button>
        </div>

        <div className="flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div>
          <CenarioImporter 
            onTextImported={handleImportarCenario} 
            isLoading={importLoading}
          />
          <div className="text-center text-xs text-gray-500 mt-2">
            Formatos suportados: Word (.docx) e Texto (.txt)
          </div>
        </div>
      </form>
    </MobileWrapper>
  );
} 