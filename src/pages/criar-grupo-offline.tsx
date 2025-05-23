import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function CriarGrupoOffline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [titulo, setTitulo] = useState('');
  const [diasEnsaio, setDiasEnsaio] = useState('');
  const [dataApresentacao, setDataApresentacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);

  // Lista de dias da semana
  const diasDaSemana = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
  ];

  // Função para alternar a seleção de dias
  const toggleDia = (dia: string) => {
    if (diasSelecionados.includes(dia)) {
      setDiasSelecionados(diasSelecionados.filter(d => d !== dia));
    } else {
      setDiasSelecionados([...diasSelecionados, dia]);
    }
  };

  // Validar o formulário
  const validarFormulario = () => {
    if (!titulo.trim()) {
      toast.error('Por favor, informe o título do grupo');
      return false;
    }
    
    if (diasSelecionados.length === 0) {
      toast.error('Por favor, selecione pelo menos um dia de ensaio');
      return false;
    }
    
    if (!dataApresentacao) {
      toast.error('Por favor, informe a data de apresentação');
      return false;
    }
    
    return true;
  };

  // Função para criar o grupo/teatro
  const handleCriarGrupo = () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    
    try {
      // Gerar ID único
      const id = 'local_' + Date.now();
      
      // Criar objeto com os dados do teatro
      const teatroData = {
        id,
        titulo,
        descricao: descricao.trim() || `Grupo de teatro: ${titulo}`,
        diasEnsaio: diasSelecionados,
        dataApresentacao: new Date(dataApresentacao),
        participantes: [user?.uid || 'anonymous'],
        criador: user?.uid || 'anonymous',
        dataCriacao: new Date(),
        alerta: true
      };
      
      // Salvar no localStorage
      localStorage.setItem(`teatro_${id}`, JSON.stringify(teatroData));
      
      toast.success('Grupo criado com sucesso no modo offline!');
      
      // Esperar um pouco antes de navegar
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar o grupo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto pb-20">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-400 rounded-lg text-sm">
        <p className="font-medium text-yellow-700 mb-1">Modo Offline Ativo</p>
        <p className="text-xs text-yellow-600">Criando teatro em modo offline devido a problemas de conexão</p>
      </div>
      
      <div className="flex items-center mb-6">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-center flex-1 -ml-6">
          Criar Grupo (Offline)
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-center mb-2">Título</label>
          <Input
            className="rounded-full bg-muted border-primary/20"
            placeholder="Nome do grupo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-center mb-2">Descrição (opcional)</label>
          <Input
            className="rounded-full bg-muted border-primary/20"
            placeholder="Breve descrição do grupo"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-center mb-2">Dias de Ensaio:</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {diasDaSemana.map((dia) => (
              <button
                key={dia}
                type="button"
                onClick={() => toggleDia(dia)}
                className={`px-3 py-1 rounded-full text-sm ${
                  diasSelecionados.includes(dia)
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {dia}
              </button>
            ))}
          </div>
          
          {diasSelecionados.length > 0 && (
            <div className="mt-2 bg-muted p-2 rounded-xl">
              <div className="text-sm text-center mb-1">Dias selecionados:</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {diasSelecionados.map((dia) => (
                  <div
                    key={dia}
                    className="bg-primary/10 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    {dia}
                    <button
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className="text-primary hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-center mb-2">Data de Apresentação</label>
          <Input
            type="date"
            className="rounded-full bg-muted border-primary/20"
            value={dataApresentacao}
            onChange={(e) => setDataApresentacao(e.target.value)}
          />
        </div>

        <Button 
          className="w-full bg-[#0A1628] text-white rounded-full hover:bg-[#0A1628]/90"
          onClick={handleCriarGrupo}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Grupo Offline
            </span>
          )}
        </Button>
      </div>
    </div>
  );
} 