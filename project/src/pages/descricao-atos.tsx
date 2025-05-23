import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { getNextPage } from '@/lib/page-router';

type FormState = {
  quantidadeAtos: string;
  roteiro: string;
};

export function DescricaoAtos() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [formState, setFormState] = useState<FormState>({
    quantidadeAtos: '',
    roteiro: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        quantidadeAtos: formState.quantidadeAtos.trim() ? parseInt(formState.quantidadeAtos) : 0,
        roteiro: formState.roteiro,
        atualizadoEm: new Date()
      });
      
      // Navegar para a próxima página na sequência
      const nextPage = getNextPage(location.pathname, id);
      navigate(nextPage);
    } catch (error) {
      console.error('Erro ao atualizar informações de atos:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportarDocumento = () => {
    // Criar um input de arquivo invisível
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.doc,.docx,.pdf';
    
    // Manipular o evento de seleção de arquivo
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !files[0]) return;
      
      const file = files[0];
      
      try {
        // Para texto simples:
        if (file.type === 'text/plain') {
          const text = await file.text();
          // Extrair informações do arquivo
          const linhas = text.split('\n');
          const quantidadeAtos = linhas.find(l => l.includes('Atos:'))?.replace('Atos:', '').trim() || '';
          // Considerar múltiplas linhas para o roteiro
          const roteiroIndex = linhas.findIndex(l => l.includes('Roteiro:'));
          let roteiroInfo = '';
          
          if (roteiroIndex !== -1) {
            roteiroInfo = linhas.slice(roteiroIndex + 1).join('\n').trim();
          }
          
          // Atualizar o estado do formulário
          setFormState({
            quantidadeAtos,
            roteiro: roteiroInfo || 'Roteiro importado do documento'
          });
        } else {
          // Para outros tipos, apenas uma mensagem informativa
          alert(`Arquivo "${file.name}" selecionado. O processamento de ${file.type} será implementado em breve.`);
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert('Erro ao processar o arquivo. Tente novamente.');
      }
    };
    
    // Acionar o seletor de arquivo
    fileInput.click();
  };

  return (
    <MobileWrapper title="Descrição" showBackButton={true}>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Quantidade de Atos
          </label>
          <input
            type="number"
            name="quantidadeAtos"
            value={formState.quantidadeAtos}
            onChange={handleChange}
            className="w-full h-12 px-4 bg-gray-200 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium text-center">
            Roteiro
          </label>
          <textarea
            name="roteiro"
            value={formState.roteiro}
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
            {isSubmitting ? 'Salvando...' : 'Recriar Grupo'}
          </button>
        </div>

        <div className="flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleImportarDocumento}
            className="w-full h-12 bg-[#FF7F7F] text-white font-bold rounded-lg shadow-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Importar Documento
          </button>
        </div>
      </form>
    </MobileWrapper>
  );
} 