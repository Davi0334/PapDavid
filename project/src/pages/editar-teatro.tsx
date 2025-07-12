import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { MobileWrapper } from '@/components/mobile-wrapper';
import { DocumentImporterButton } from '@/components/DocumentImporterButton';
import { ArrowLeft } from 'lucide-react';

type FormState = {
  titulo: string;
  descricao: string;
  local: string;
  diasEnsaio: string[];
  dataApresentacao: string;
  roteiro: string;
  cenario: string;
  temaFigurinos: string;
  quantidadeFigurinos: number;
  quantidadeCenas: number;
  quantidadeAtores: number;
  numeroAtos: number;
  aviso: string;
  avisoAtivo: boolean;
};

// Define a wrapper component to pass the correct props to DocumentImporterButton
type DocumentImporterWrapperProps = {
  onContentReceived: (text: string) => void;
};

const DocumentImporterWrapper: React.FC<DocumentImporterWrapperProps> = ({ onContentReceived }) => {
  return <DocumentImporterButton onTextExtracted={onContentReceived} />;
};

export function EditarTeatro() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'principal' | 'roteiro' | 'cenario' | 'figurino' | 'equipe'>('principal');
  const [formState, setFormState] = useState<FormState>({
    titulo: '',
    descricao: '',
    local: '',
    diasEnsaio: [],
    dataApresentacao: '',
    roteiro: '',
    cenario: '',
    temaFigurinos: '',
    quantidadeFigurinos: 0,
    quantidadeCenas: 0,
    quantidadeAtores: 0,
    numeroAtos: 0,
    aviso: '',
    avisoAtivo: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [participantes, setParticipantes] = useState<{ id: string, nome: string, email?: string }[]>([]);

  const weekdays = [
    { key: 'seg', label: 'Seg' },
    { key: 'ter', label: 'Ter' },
    { key: 'qua', label: 'Qua' },
    { key: 'qui', label: 'Qui' },
    { key: 'sex', label: 'Sex' },
    { key: 'sab', label: 'Sáb' },
    { key: 'dom', label: 'Dom' }
  ];

  // Carregar dados do teatro
  useEffect(() => {
    const fetchTeatro = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, 'teatros', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const teatroData = docSnap.data();
          
          // Verificar se o usuário tem permissão para editar
          if (user?.uid !== teatroData.criador) {
            setError('Você não tem permissão para editar este teatro');
            setLoading(false);
            return;
          }
          
          setFormState({
            titulo: teatroData.titulo || '',
            descricao: teatroData.descricao || '',
            local: teatroData.local || '',
            diasEnsaio: Array.isArray(teatroData.diasEnsaio) ? teatroData.diasEnsaio : [],
            dataApresentacao: teatroData.dataApresentacao || '',
            roteiro: teatroData.roteiro || '',
            cenario: teatroData.cenario || '',
            temaFigurinos: teatroData.temaFigurinos || '',
            quantidadeFigurinos: teatroData.quantidadeFigurinos || 0,
            quantidadeCenas: teatroData.quantidadeCenas || 0,
            quantidadeAtores: teatroData.quantidadeAtores || 0,
            numeroAtos: teatroData.numeroAtos || 0,
            aviso: teatroData.aviso || '',
            avisoAtivo: teatroData.avisoAtivo || false
          });
        } else {
          setError('Teatro não encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar teatro:', err);
        setError('Erro ao carregar informações do teatro');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeatro();
  }, [id, user]);

  // Buscar participantes (atores) ao carregar o teatro
  useEffect(() => {
    const fetchParticipantes = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'teatros', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const teatroData = docSnap.data();
          if (Array.isArray(teatroData.participantes) && teatroData.participantes.length > 0) {
            // Buscar nomes dos participantes na coleção 'usuarios'
            const usersCol = collection(db, 'usuarios');
            const participantesData = await Promise.all(
              teatroData.participantes.map(async (uid: string) => {
                const userDoc = await getDoc(doc(usersCol, uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  return { id: uid, nome: data.nome || data.displayName || 'Sem nome', email: data.email };
                } else {
                  return { id: uid, nome: 'Usuário não encontrado' };
                }
              })
            );
            setParticipantes(participantesData);
          } else {
            setParticipantes([]);
          }
        }
      } catch (e) {
        setParticipantes([]);
      }
    };
    fetchParticipantes();
  }, [id]);

  // Lidar com alterações no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Lidar com alterações em campos numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.trim() ? parseInt(value) : 0;
    
    setFormState(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  // Lidar com toggle de avisoAtivo
  const handleToggleAviso = () => {
    // Update state
    setFormState(prev => ({
      ...prev,
      avisoAtivo: !prev.avisoAtivo
    }));
  };

  // Alternar dia de ensaio
  const toggleDiaEnsaio = (dia: string) => {
    setFormState(prev => {
      const diasEnsaio = [...prev.diasEnsaio];
      if (diasEnsaio.includes(dia)) {
        return {
          ...prev,
          diasEnsaio: diasEnsaio.filter(d => d !== dia)
        };
      } else {
        return {
          ...prev,
          diasEnsaio: [...diasEnsaio, dia]
        };
      }
    });
  };

  // Importar texto para diferentes campos
  const handleImportRoteiro = (text: string) => {
    setFormState(prev => ({
      ...prev,
      roteiro: text
    }));
    // Mostrar mensagem de sucesso temporária
    setSuccess('Roteiro importado com sucesso!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleImportCenario = (text: string) => {
    setFormState(prev => ({
      ...prev,
      cenario: text
    }));
    // Mostrar mensagem de sucesso temporária
    setSuccess('Cenário importado com sucesso!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleImportFigurino = (text: string) => {
    setFormState(prev => ({
      ...prev,
      temaFigurinos: text
    }));
    setSuccess('Tema dos figurinos importado com sucesso!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Custom DocumentImporter wrappers that match the expected props
  const RoteiroDImporter = () => {
    return (
      <DocumentImporterWrapper onContentReceived={handleImportRoteiro} />
    );
  };
  
  const CenarioDImporter = () => {
    return (
      <DocumentImporterWrapper onContentReceived={handleImportCenario} />
    );
  };

  const FigurinoImporter = () => {
    return <DocumentImporterWrapper onContentReceived={handleImportFigurino} />;
  };

  // Salvar atualizações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const teatroRef = doc(db, 'teatros', id);
      
      await updateDoc(teatroRef, {
        titulo: formState.titulo,
        descricao: formState.descricao,
        local: formState.local,
        diasEnsaio: formState.diasEnsaio,
        dataApresentacao: formState.dataApresentacao,
        roteiro: formState.roteiro,
        cenario: formState.cenario,
        temaFigurinos: formState.temaFigurinos,
        quantidadeFigurinos: formState.quantidadeFigurinos,
        quantidadeCenas: formState.quantidadeCenas,
        quantidadeAtores: formState.quantidadeAtores,
        numeroAtos: formState.numeroAtos,
        aviso: formState.aviso,
        avisoAtivo: formState.avisoAtivo,
        atualizadoEm: new Date()
      });
      
      setSuccess('Teatro atualizado com sucesso!');
      
      // Atualizar dados em cache, se houver
      try {
        const cacheKey = `teatro_cache_${id}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedData = {
            ...parsedData,
            titulo: formState.titulo,
            descricao: formState.descricao,
            local: formState.local,
            diasEnsaio: formState.diasEnsaio,
            dataApresentacao: formState.dataApresentacao,
            roteiro: formState.roteiro,
            cenario: formState.cenario,
            temaFigurinos: formState.temaFigurinos,
            quantidadeFigurinos: formState.quantidadeFigurinos,
            quantidadeCenas: formState.quantidadeCenas,
            quantidadeAtores: formState.quantidadeAtores,
            numeroAtos: formState.numeroAtos,
            aviso: formState.aviso,
            avisoAtivo: formState.avisoAtivo,
            atualizadoEm: new Date().toISOString()
          };
          
          localStorage.setItem(cacheKey, JSON.stringify(updatedData));
        }
      } catch (e) {
        console.error('Erro ao atualizar cache:', e);
      }
      
    } catch (err) {
      console.error('Erro ao atualizar teatro:', err);
      setError('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
      
      // Scroll para o topo para mostrar mensagem de sucesso/erro
      window.scrollTo(0, 0);
    }
  };

  // Função para deletar teatro
  const handleDelete = async () => {
    if (!id || !user) return;
    setDeleteInProgress(true);
    try {
      if (id.startsWith('local_')) {
        localStorage.removeItem(`teatro_local_${id}`);
        try {
          const teatrosCache = localStorage.getItem('teatros_cache');
          if (teatrosCache) {
            const teatros = JSON.parse(teatrosCache);
            const teatrosAtualizados = teatros.filter((t: any) => t.id !== id);
            localStorage.setItem('teatros_cache', JSON.stringify(teatrosAtualizados));
          }
        } catch (e) {
          console.error('Erro ao atualizar cache de teatros:', e);
        }
        navigate('/teatros');
        return;
      }
      const teatroRef = doc(db, 'teatros', id);
      await deleteDoc(teatroRef);
      localStorage.removeItem(`teatro_cache_${id}`);
      try {
        const teatrosCache = localStorage.getItem('teatros_cache');
        if (teatrosCache) {
          const teatros = JSON.parse(teatrosCache);
          const teatrosAtualizados = teatros.filter((t: any) => t.id !== id);
          localStorage.setItem('teatros_cache', JSON.stringify(teatrosAtualizados));
        }
      } catch (e) {
        console.error('Erro ao atualizar cache de teatros:', e);
      }
      navigate('/teatros');
    } catch (error) {
      console.error('Erro ao excluir teatro:', error);
      if (!id.startsWith('local_')) {
        localStorage.setItem(`teatro_delete_${id}`, JSON.stringify({
          id,
          timestamp: new Date().toISOString(),
          userId: user.uid
        }));
      }
    } finally {
      setDeleteInProgress(false);
      setShowDeleteConfirm(false);
    }
  };

  // Voltar para a página anterior
  const handleBack = () => {
    if (window.history.length > 2) {
      // If there's history available, go back to previous page
      window.history.back();
    } else {
      // Fallback to theater details if no history available
      navigate(`/teatro/${id}`);
    }
  };

  // Função para remover participante
  const handleRemoveParticipante = async (uid: string) => {
    if (!id) return;
    try {
      setSaving(true);
      // Atualizar no Firestore
      const docRef = doc(db, 'teatros', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const teatroData = docSnap.data();
        const novaLista = (teatroData.participantes || []).filter((pid: string) => pid !== uid);
        await updateDoc(docRef, { participantes: novaLista });
        setParticipantes(prev => prev.filter(p => p.id !== uid));
        setSuccess('Ator removido com sucesso!');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (e) {
      setError('Erro ao remover ator.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MobileWrapper title="Carregando..." fullHeight={false} safeArea={true}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
          <p>Carregando...</p>
        </div>
      </MobileWrapper>
    );
  }

  if (error && !formState.titulo) {
    return (
      <MobileWrapper title="Erro" fullHeight={false} safeArea={true}>
        <div style={{ padding: '10px' }}>
          <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', marginBottom: '10px' }}>
            {error}
          </div>
          <button 
            onClick={handleBack}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#002B5B', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              width: '100%', 
              cursor: 'pointer',
              borderRadius: '4px' 
            }}
          >
            <ArrowLeft size={16} />
            <span style={{ marginLeft: '8px' }}>Voltar</span>
          </button>
        </div>
      </MobileWrapper>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'principal':
        return (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título do Teatro</label>
              <input
                type="text"
                name="titulo"
                value={formState.titulo}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                autoComplete="off"
                placeholder="Digite o título do teatro..."
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição</label>
              <textarea
                name="descricao"
                value={formState.descricao}
                onChange={handleChange}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Digite uma descrição para o teatro..."
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Local</label>
              <input
                type="text"
                name="local"
                value={formState.local}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                autoComplete="off"
                placeholder="Digite o local do teatro..."
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data de Apresentação</label>
              <input
                type="date"
                name="dataApresentacao"
                value={formState.dataApresentacao}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dias de Ensaio</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {weekdays.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDiaEnsaio(day.key)}
                    style={{ 
                      padding: '5px 9px', 
                      backgroundColor: formState.diasEnsaio.includes(day.key) ? '#002B5B' : '#f0f0f0', 
                      color: formState.diasEnsaio.includes(day.key) ? 'white' : 'black',
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'roteiro':
        return (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>Roteiro</label>
              <RoteiroDImporter />
            </div>
            <textarea
              name="roteiro"
              value={formState.roteiro}
              onChange={handleChange}
              rows={10}
              style={{ 
                width: '100%', 
                padding: '8px', 
                boxSizing: 'border-box',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Digite o roteiro do teatro..."
            />
          </div>
        );
      
      case 'cenario':
        return (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontWeight: 'bold' }}>Cenário</label>
              <CenarioDImporter />
            </div>
            <textarea
              name="cenario"
              value={formState.cenario}
              onChange={handleChange}
              rows={10}
              style={{ 
                width: '100%', 
                padding: '8px', 
                boxSizing: 'border-box',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Descreva os cenários do teatro..."
            />
          </div>
        );
        
      case 'figurino':
        return (
          <div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tema dos Figurinos</label>
              <FigurinoImporter />
            </div>
            <input
              type="text"
              name="temaFigurinos"
              value={formState.temaFigurinos}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                boxSizing: 'border-box',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Ex: Medieval, Futurista, Casual..."
              autoComplete="off"
            />
            <div style={{ marginBottom: '15px', marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantidade de Figurinos</label>
              <input
                type="number"
                name="quantidadeFigurinos"
                value={formState.quantidadeFigurinos}
                onChange={handleNumberChange}
                min="0"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        );
        
      case 'equipe':
        return (
          <div>
            {/* Toggle de aviso */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Ativar aviso importante</label>
                <input
                  type="checkbox"
                  checked={formState.avisoAtivo}
                  onChange={handleToggleAviso}
                />
                <span style={{ marginLeft: '8px' }}>{formState.avisoAtivo ? 'Ativo' : 'Inativo'}</span>
              </div>
              <textarea
                name="aviso"
                value={formState.aviso}
                onChange={handleChange}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  boxSizing: 'border-box',
                  backgroundColor: formState.avisoAtivo ? 'white' : '#f5f5f5',
                  opacity: formState.avisoAtivo ? 1 : 0.7,
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Digite aqui o aviso importante..."
                disabled={!formState.avisoAtivo}
              />
            </div>

            {/* Aviso ativo (preview) */}
            {formState.avisoAtivo && formState.aviso && (
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeeba', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                <h3 style={{ color: '#856404', marginBottom: '5px', fontWeight: 'bold' }}>
                  <span style={{ marginRight: '8px' }}>⚠️</span>
                  Preview do Aviso
                </h3>
                <p style={{ wordBreak: 'break-word' }}>{formState.aviso}</p>
              </div>
            )}

            {/* Lista de atores */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Atores do Teatro</label>
              {participantes.length === 0 ? (
                <p style={{ color: '#888' }}>Nenhum ator cadastrado.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {participantes.map((p) => (
                    <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <span>{p.nome}{p.email ? ` (${p.email})` : ''}</span>
                      {user && p.id !== user.uid && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipante(p.id)}
                          style={{ background: 'none', color: '#cc0000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          disabled={saving}
                        >
                          Remover
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <MobileWrapper 
      title={formState.titulo || "Editar Teatro"} 
      showBackButton={true} 
      onBack={handleBack} 
      showBottomNav={false}
      fullHeight={false}
      safeArea={true}
    >
      {/* Abas simples - estilo mobile */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: 'white', 
        overflowX: 'auto', 
        width: '100%',
        borderBottom: '1px solid #ddd'
      }}>
        <button 
          onClick={() => setActiveTab('principal')} 
          style={{ 
            padding: '10px 12px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'principal' ? '2px solid #ff726f' : 'none', 
            fontWeight: activeTab === 'principal' ? 'bold' : 'normal', 
            color: activeTab === 'principal' ? '#333' : '#777', 
            fontSize: '14px', 
            flex: '1', 
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}>
          Principal
        </button>
        <button 
          onClick={() => setActiveTab('roteiro')} 
          style={{ 
            padding: '10px 12px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'roteiro' ? '2px solid #ff726f' : 'none', 
            fontWeight: activeTab === 'roteiro' ? 'bold' : 'normal', 
            color: activeTab === 'roteiro' ? '#333' : '#777', 
            fontSize: '14px', 
            flex: '1', 
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}>
          Roteiro
        </button>
        <button 
          onClick={() => setActiveTab('cenario')} 
          style={{ 
            padding: '10px 12px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'cenario' ? '2px solid #ff726f' : 'none', 
            fontWeight: activeTab === 'cenario' ? 'bold' : 'normal', 
            color: activeTab === 'cenario' ? '#333' : '#777', 
            fontSize: '14px', 
            flex: '1', 
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}>
          Cenário
        </button>
        <button 
          onClick={() => setActiveTab('figurino')} 
          style={{ 
            padding: '10px 12px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'figurino' ? '2px solid #ff726f' : 'none', 
            fontWeight: activeTab === 'figurino' ? 'bold' : 'normal', 
            color: activeTab === 'figurino' ? '#333' : '#777', 
            fontSize: '14px', 
            flex: '1', 
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}>
          Figurino
        </button>
        <button 
          onClick={() => setActiveTab('equipe')} 
          style={{ 
            padding: '10px 12px', 
            border: 'none', 
            background: 'none', 
            borderBottom: activeTab === 'equipe' ? '2px solid #ff726f' : 'none', 
            fontWeight: activeTab === 'equipe' ? 'bold' : 'normal', 
            color: activeTab === 'equipe' ? '#333' : '#777', 
            fontSize: '14px', 
            flex: '1', 
            whiteSpace: 'nowrap',
            minWidth: 'auto'
          }}>
          Equipe
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', margin: '0 auto' }}>
        {success && (
          <div style={{ backgroundColor: '#dff0d8', color: '#3c763d', padding: '8px', margin: '8px', fontSize: '14px' }}>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '8px', margin: '8px', fontSize: '14px' }}>
            <span>{error}</span>
          </div>
        )}
        
        <div style={{ 
          padding: '12px', 
          paddingBottom: '120px', // espaço extra para dois botões
          backgroundColor: 'white'
        }}>
          {renderTabContent()}
        </div>
        
        {/* Botões fixos na parte inferior */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '10px', 
          backgroundColor: 'white', 
          borderTop: '1px solid #ddd', 
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            type="submit"
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#ff726f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#ff3b30', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 'bold', 
              cursor: deleteInProgress ? 'not-allowed' : 'pointer',
              opacity: deleteInProgress ? 0.7 : 1
            }}
            disabled={deleteInProgress}
          >
            {deleteInProgress ? 'Excluindo...' : 'Deletar Teatro'}
          </button>
        </div>
      </form>
      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '90vw',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ color: '#ff3b30', marginBottom: '16px' }}>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja <b>deletar este teatro</b>? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: '#ccc',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                disabled={deleteInProgress}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 20px',
                  background: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: deleteInProgress ? 'not-allowed' : 'pointer',
                  opacity: deleteInProgress ? 0.7 : 1
                }}
                disabled={deleteInProgress}
              >
                {deleteInProgress ? 'Excluindo...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileWrapper>
  );
} 