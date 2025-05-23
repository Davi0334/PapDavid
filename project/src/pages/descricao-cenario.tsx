import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import mammoth from 'mammoth';
import { CenarioImporter } from '@/components/CenarioImporter';

type FormState = {
  quantidadeCenas: string;
  cenario: string;
};

export function DescricaoCenario() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [formState, setFormState] = useState<FormState>({
    quantidadeCenas: '0',
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
      
      // Feedback visual de sucesso
      alert('Informações salvas com sucesso!');
      
      // Navegar para a página de ordem dos cenários
      navigate(`/ordem-cenarios/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar informações de cenas:', error);
      alert('Erro ao salvar informações. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrdemCenarios = () => {
    if (id) {
      navigate(`/ordem-cenarios/${id}`);
    }
  };

  const handleCriarGrupo = () => {
    if (id) {
      navigate(`/criar-grupo/${id}`);
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
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Quantidade de Cenas:
          </label>
          <input
            type="number"
            name="quantidadeCenas"
            value={formState.quantidadeCenas}
            onChange={handleChange}
            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Cenario:
          </label>
          <textarea
            name="cenario"
            value={formState.cenario}
            onChange={handleChange}
            rows={10}
            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleOrdemCenarios}
          className="w-full py-3 bg-[#fc6c5f] text-white font-medium rounded-full mb-4"
        >
          Ordem Dos Cenarios
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-[#002B5B] text-white font-medium rounded-full mb-6"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <CenarioImporter 
          onTextImported={handleImportarCenario} 
          isLoading={importLoading}
        />
        
        <div className="text-center text-xs text-gray-500 mt-2">
          Formatos suportados: Word (.docx) e Texto (.txt)
        </div>
      </div>
    </MobileWrapper>
  );
} 