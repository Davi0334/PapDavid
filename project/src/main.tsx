// Fix for mobile viewport height (iOS Safari)
(function() {
  // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  // Add event listener to update the value when the window is resized
  window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });
})();

import React, { useState, useEffect, useContext, createContext, useRef, Fragment, ReactNode } from 'react';
import { 
  BrowserRouter,
  Routes, 
  Route, 
  Navigate, 
  useParams, 
  useNavigate, 
  Link,
  useLocation
} from 'react-router-dom';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updateProfile
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, 
  getDocs, getDoc, query, where, serverTimestamp, Timestamp,
  collectionGroup
} from 'firebase/firestore';
import './simple.css';
import './styles/mobile-fix.css'; // Importar CSS com correções para layout mobile
import { db, auth } from './lib/firebase-prod';
import ReactDOM from 'react-dom/client';
import { useAuth } from './lib/auth';
import { AuthProvider } from './lib/auth';
import AdminButton from './components/admin-button';
import { SetAdmin } from './pages/set-admin';
import { Login } from './pages/login';
import { Cadastro } from './pages/cadastro';
import { EsqueciSenha } from './pages/esqueci-senha';
import { DataServiceProvider } from './lib/data-service';
import { AuthLayout } from './layouts/auth-layout';
import { DocumentImporter } from './components/DocumentImporter';
import mammoth from 'mammoth';
import { EditarTeatro } from './pages/editar-teatro';

// Estilos CSS para corrigir problemas de scroll horizontal em dispositivos móveis
export const styleFixScrollHorizontal = `
  html, body {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    position: relative;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    margin: 0;
    padding: 0;
  }
  
  .mobile-wrapper-fix {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    position: relative;
  }
  
  .mobile-content-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`;

// Tipo para timestamp do Firestore
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Definição dos tipos
interface Teatro {
  id: string;
  titulo: string;
  descricao: string;
  diasEnsaio: string[];
  dataApresentacao: string; // Alterado de string | FirestoreTimestamp para string
  participantes: string[];
  criador: string;
  criadoEm?: string; // Alterado de string | FirestoreTimestamp para string
  atualizadoEm?: string; // Alterado de string | FirestoreTimestamp para string
  temAlerta?: boolean;
  roteiro?: string;
  cenarios?: string[];
  figurinos?: string[];
  temaFigurinos?: string;
  numeroAtos?: number;
  quantidadeCenas?: number;
  quantidadeFigurinos?: number;
  ordemCenarios?: string;
  dataCriacao?: string; // Alterado de string | FirestoreTimestamp para string
  local?: string;
  mensagemAlerta?: string;
  cenario?: string;
  quantidadeAtores?: number;
  figurino?: string;
  avisoAtivo?: boolean;
  aviso?: string;
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  organizador: string;
  horarioInicio?: string;
  horarioFim?: string;
  teatroId?: string;
  criadoEm?: string | FirestoreTimestamp;
  atualizadoEm?: string | FirestoreTimestamp;
}

// Criação do contexto do serviço de dados
interface DataServiceContextType {
  getTeatros: () => Promise<Teatro[]>;
  getTeatroById: (id: string) => Promise<Teatro | null>;
  createTeatro: (teatro: Omit<Teatro, 'id'>) => Promise<string>;
  updateTeatro: (id: string, teatro: Partial<Teatro>) => Promise<boolean>;
  deleteTeatro: (id: string) => Promise<boolean>;
  getEventos: () => Promise<Evento[]>;
  getEvento: (id: string) => Promise<Evento | null>;
}

const DataServiceContext = createContext<DataServiceContextType>({
  getTeatros: async () => [],
  getTeatroById: async () => null,
  createTeatro: async () => '',
  updateTeatro: async () => false,
  deleteTeatro: async () => false,
  getEventos: async () => [],
  getEvento: async () => null
});

// Hook para usar o serviço de dados
function useDataService() {
  return React.useContext(DataServiceContext);
}

// Função auxiliar para formatar timestamps do Firestore
function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return String(timestamp);
  }
}

// Funções específicas para limpar timestamps em cada tipo de objeto
function cleanTeatroTimestamps(teatro: any): Teatro {
  // Função para garantir que um valor seja uma string
  const ensureString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    // Para outros tipos, converter para string
    return String(value);
  };
  
  // Garantir que o array diasEnsaio seja realmente um array
  const diasEnsaio = Array.isArray(teatro.diasEnsaio) 
    ? teatro.diasEnsaio.map(ensureString)
    : [];
  
  // Construir um objeto seguro
  return {
    id: teatro.id || '',
    titulo: ensureString(teatro.titulo),
    descricao: ensureString(teatro.descricao),
    diasEnsaio: diasEnsaio,
    dataApresentacao: ensureString(teatro.dataApresentacao),
    participantes: Array.isArray(teatro.participantes) ? teatro.participantes : [],
    criador: ensureString(teatro.criador),
    criadoEm: ensureString(teatro.criadoEm),
    atualizadoEm: ensureString(teatro.atualizadoEm),
    temAlerta: !!teatro.temAlerta,
    roteiro: ensureString(teatro.roteiro),
    cenarios: teatro.cenarios ? teatro.cenarios.map(ensureString) : [],
    figurinos: teatro.figurinos ? teatro.figurinos.map(ensureString) : [],
    temaFigurinos: ensureString(teatro.temaFigurinos),
    numeroAtos: teatro.numeroAtos || 0,
    quantidadeCenas: teatro.quantidadeCenas || 0,
    quantidadeFigurinos: teatro.quantidadeFigurinos || 0,
    ordemCenarios: teatro.ordemCenarios ? teatro.ordemCenarios : '',
    dataCriacao: ensureString(teatro.dataCriacao),
    local: ensureString(teatro.local),
    mensagemAlerta: ensureString(teatro.mensagemAlerta),
    cenario: ensureString(teatro.cenario),
    quantidadeAtores: teatro.quantidadeAtores || 0,
    figurino: ensureString(teatro.figurino),
    avisoAtivo: !!teatro.avisoAtivo,
    aviso: teatro.aviso || '',
  };
}

function cleanEventoTimestamps(evento: any): Evento {
  // Função para garantir que um valor seja uma string
  const ensureString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    // Para outros tipos, converter para string
    return String(value);
  };
  
  // Construir um objeto seguro
  return {
    id: evento.id || '',
    titulo: ensureString(evento.titulo),
    descricao: ensureString(evento.descricao),
    data: ensureString(evento.data),
    local: ensureString(evento.local),
    organizador: ensureString(evento.organizador),
    horarioInicio: ensureString(evento.horarioInicio),
    horarioFim: ensureString(evento.horarioFim),
    teatroId: ensureString(evento.teatroId),
    criadoEm: ensureString(evento.criadoEm),
    atualizadoEm: ensureString(evento.atualizadoEm)
  };
}

// Provider do serviço de dados
function InternalDataServiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false); // Adicionando state de loading aqui
  
  // Função para garantir que valores sejam string (para uso interno)
  const ensureString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    // Para outros tipos, converter para string
    try {
      return String(value);
    } catch (e) {
      return '';
    }
  };

  // Função para obter todos os teatros
  const getTeatros = async (): Promise<Teatro[]> => {
    if (!user) return [];

    try {
      const userTeatros: Teatro[] = [];
      
      // Buscar teatros onde o usuário é participante
      const teatrosRef = collection(db, 'teatros');
      const participantQuery = query(teatrosRef, where('participantes', 'array-contains', user.uid));
      const participantSnapshot = await getDocs(participantQuery);
      
      participantSnapshot.forEach((doc) => {
        const data = doc.data();
        userTeatros.push(cleanTeatroTimestamps({ id: doc.id, ...data }));
      });
      
      // Buscar teatros onde o usuário é criador (se ainda não incluídos)
      const creatorQuery = query(teatrosRef, where('criador', '==', user.uid));
      const creatorSnapshot = await getDocs(creatorQuery);
      
      creatorSnapshot.forEach((doc) => {
        if (!userTeatros.some(t => t.id === doc.id)) {
          const data = doc.data();
          userTeatros.push(cleanTeatroTimestamps({ id: doc.id, ...data }));
        }
      });
      
      return userTeatros;
    } catch (error) {
      console.error('Erro ao buscar teatros:', error);
      return [];
    }
  };

  // Função para obter um teatro pelo ID
  const getTeatroById = async (id: string): Promise<Teatro | null> => {
    try {
      console.log("Iniciando busca por teatro com ID:", id);
      
      if (!id || id.trim() === '') {
        console.error("ID de teatro inválido ou vazio");
        return null;
      }
      
      const docRef = doc(db, 'teatros', id);
      console.log("Referência do documento criada para ID:", id);
      
      try {
        const docSnap = await getDoc(docRef);
        console.log("Documento recuperado, existe?", docSnap.exists());
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Dados brutos do teatro:", data);
          
          // Verificar se os dados têm os campos mínimos necessários
          if (!data.titulo) {
            console.warn("Teatro encontrado mas faltam dados obrigatórios (título)");
          }
          
          // Formatar timestamp
          const teatro = {
            id: docSnap.id,
            titulo: data.titulo || 'Sem título',
            descricao: data.descricao || '',
            diasEnsaio: data.diasEnsaio || [],
            dataApresentacao: data.dataApresentacao,
            participantes: data.participantes || [],
            criador: data.criador || '',
            criadoEm: data.criadoEm,
            atualizadoEm: data.atualizadoEm,
            temAlerta: data.temAlerta || false,
            roteiro: data.roteiro || '',
            cenarios: data.cenarios || [],
            figurinos: data.figurinos || [],
            temaFigurinos: data.temaFigurinos || '',
            numeroAtos: data.numeroAtos || 0,
            quantidadeCenas: data.quantidadeCenas || 0,
            quantidadeFigurinos: data.quantidadeFigurinos || 0,
            ordemCenarios: data.ordemCenarios || '',
            dataCriacao: data.dataCriacao,
            local: data.local || '',
            mensagemAlerta: data.mensagemAlerta,
            cenario: data.cenario || '',
            quantidadeAtores: data.quantidadeAtores || 0,
            figurino: data.figurino || '',
            avisoAtivo: !!data.avisoAtivo,
            aviso: data.aviso || '',
          };
          
          const teatroProcessado = cleanTeatroTimestamps(teatro);
          console.log("Teatro processado com sucesso:", teatroProcessado.id, teatroProcessado.titulo);
          return teatroProcessado;
        } else {
          console.warn(`Documento de teatro não encontrado para ID: ${id}`);
          return null;
        }
      } catch (docError: any) {
        console.error(`Erro específico ao acessar documento ${id}:`, docError);
        console.error("Código de erro:", docError.code, "Mensagem:", docError.message);
        return null;
      }
    } catch (error: any) {
      console.error("Erro geral ao buscar teatro por ID:", error);
      console.error("Tipo de erro:", typeof error);
      if (error.code) {
        console.error("Código de erro:", error.code);
      }
      if (error.message) {
        console.error("Mensagem de erro:", error.message);
      }
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
      return null;
    }
  };

  // Função para criar um novo teatro
  const createTeatro = async (teatro: Omit<Teatro, 'id'>): Promise<string> => {
    try {
      setLoading(true); // Define loading como true antes de começar
      
      // Garantir que os campos de aviso estejam presentes
      const teatroCompleto = {
        ...teatro,
        // Inicializar campos de aviso se não existirem
        avisoAtivo: teatro.avisoAtivo !== undefined ? teatro.avisoAtivo : false,
        aviso: teatro.aviso || "",
        temAlerta: teatro.temAlerta !== undefined ? teatro.temAlerta : false,
        mensagemAlerta: teatro.mensagemAlerta || "",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      };
      
      console.log('Criando teatro com campos de aviso:', {
        avisoAtivo: teatroCompleto.avisoAtivo,
        aviso: teatroCompleto.aviso,
        temAlerta: teatroCompleto.temAlerta,
        mensagemAlerta: teatroCompleto.mensagemAlerta
      });
      
      const docRef = await addDoc(collection(db, 'teatros'), teatroCompleto);
      console.log('Teatro criado com ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Erro ao criar teatro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar um teatro
  const updateTeatro = async (id: string, updates: Partial<Teatro>): Promise<boolean> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      // Obter dados atuais do teatro para garantir que não perdemos valores
      const teatroRef = doc(db, 'teatros', id);
      const teatroSnapshot = await getDoc(teatroRef);
      
      if (!teatroSnapshot.exists()) {
        console.error('Teatro não encontrado para atualização');
        return false;
      }
      
      const teatroAtual = teatroSnapshot.data();
      console.log('Atualizando teatro - dados atuais:', teatroAtual);
      console.log('Atualizando teatro - campos de aviso atuais:', { 
        avisoAtivo: teatroAtual.avisoAtivo,
        aviso: teatroAtual.aviso,
        temAlerta: teatroAtual.temAlerta,
        mensagemAlerta: teatroAtual.mensagemAlerta
      });
      
      // Garantir que os campos de aviso são preservados
      const dadosParaAtualizar = {
        ...updates,
        atualizadoEm: serverTimestamp(),
        // Campos de aviso são explicitamente mantidos ou atualizados
        avisoAtivo: updates.avisoAtivo !== undefined ? updates.avisoAtivo : (teatroAtual.avisoAtivo || false),
        aviso: updates.aviso !== undefined ? updates.aviso : (teatroAtual.aviso || ''),
        temAlerta: updates.temAlerta !== undefined ? updates.temAlerta : (teatroAtual.temAlerta || false),
        mensagemAlerta: updates.mensagemAlerta !== undefined ? updates.mensagemAlerta : (teatroAtual.mensagemAlerta || '')
      };
      
      console.log('Atualizando teatro - dados para atualizar:', dadosParaAtualizar);
      
      await updateDoc(doc(db, 'teatros', id), dadosParaAtualizar);
      
      console.log('Teatro atualizado com sucesso, incluindo campos de aviso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar teatro:', error);
      return false;
    }
  };

  // Função para deletar um teatro
  const deleteTeatro = async (id: string): Promise<boolean> => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      await deleteDoc(doc(db, 'teatros', id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar teatro:', error);
      return false;
    }
  };

  // Função para obter todos os eventos
  const getEventos = async (): Promise<Evento[]> => {
    if (!user) return [];
    
    try {
      const eventosRef = collection(db, 'eventos');
      const q = query(eventosRef);
      const snapshot = await getDocs(q);
      
      const eventos: Evento[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        eventos.push(cleanEventoTimestamps({ id: doc.id, ...data }));
      });
      
      return eventos;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  };

  // Função para obter um evento pelo ID
  const getEvento = async (id: string): Promise<Evento | null> => {
    if (!id) return null;
    
    try {
      const eventoDoc = await getDoc(doc(db, 'eventos', id));
      
      if (eventoDoc.exists()) {
        const data = eventoDoc.data();
        return cleanEventoTimestamps({ id: eventoDoc.id, ...data });
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar evento por ID:', error);
      return null;
    }
  };

  const value = {
    getTeatros,
    getTeatroById,
    createTeatro,
    updateTeatro,
    deleteTeatro,
    getEventos,
    getEvento
  };

  return (
    <DataServiceContext.Provider value={value}>
      {children}
    </DataServiceContext.Provider>
  );
}

// Interface para props do MobileWrapper
interface MobileWrapperProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  showBottomNav?: boolean;
  customClass?: string;
}

// Componente para envolver todas as telas com a estrutura móvel
function MobileWrapper({ children, title, showBack = true, showBottomNav = true, customClass = '' }: MobileWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className={`mobile-wrapper ${customClass}`}>
      <div className="mobile-header">
        {showBack && (
          <button 
            className="back-button" 
            onClick={() => navigate(-1)}
          >
            ←
          </button>
        )}
        <h1 className="mobile-title">{title}</h1>
      </div>
      
      <div className="mobile-content">
        {children}
      </div>
      
      {showBottomNav && <BottomNav currentPath={location.pathname} />}
    </div>
  );
}

// Componente do BottomNav
function BottomNav({ currentPath }: { currentPath: string }) {
  const isActive = (path: string) => {
    return currentPath === path;
  };
  
  return (
    <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #eee', zIndex: 50 }}>
      <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>INÍCIO</span>
      </Link>
      
      <Link to="/buscar" className={`bottom-nav-item ${isActive('/buscar') ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>BUSCAR</span>
      </Link>
      
      <Link to="/eventos" className={`bottom-nav-item ${isActive('/eventos') ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>EVENTOS</span>
      </Link>
      
      <Link to="/perfil" className={`bottom-nav-item ${isActive('/perfil') ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span>PERFIL</span>
      </Link>
    </div>
  );
}

// Mock de dados para simular teatros
const mockTeatros: Teatro[] = [
  {
    id: '1',
    titulo: 'Título',
    descricao: 'Descrição do teatro',
    diasEnsaio: ['Segunda', 'Quarta', 'Sexta'],
    dataApresentacao: '2023-12-25',
    participantes: ['1', '2', '3'],
    criador: '1',
    temAlerta: true
  },
  {
    id: '2',
    titulo: 'Título',
    descricao: 'Outro teatro de exemplo',
    diasEnsaio: ['Terça', 'Quinta'],
    dataApresentacao: '2023-11-30',
    participantes: ['1', '4'],
    criador: '1',
    temAlerta: false
  }
];

// Componente Home
function Home() {
  const navigate = useNavigate();
  const [teatros, setTeatros] = useState<Teatro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const dataService = useDataService();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchTeatros = async () => {
      try {
        setLoading(true);
        const data = await dataService.getTeatros();
        console.log('Teatros carregados:', data);
        setTeatros(data);
      } catch (err) {
        console.error('Erro ao buscar teatros:', err);
        setError('Não foi possível carregar seus teatros.');
      } finally {
        setLoading(false);
      }
    };
    
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().isAdmin === true);
        }
      } catch (err) {
        console.error('Erro ao verificar status de admin:', err);
      }
    };
    
    fetchTeatros();
    checkAdminStatus();
  }, [dataService, user]);
  
  const renderTeatros = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando seus teatros...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="button">
            Tentar novamente
          </button>
        </div>
      );
    }
    
    if (teatros.length === 0) {
      return (
        <div className="empty-state">
          <p>Você ainda não participa de nenhum teatro.</p>
          {isAdmin && (
            <button 
              onClick={() => navigate('/criar-teatro')} 
              className="button"
            >
              Criar Novo Teatro
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="theaters-list">
        {teatros.map(teatro => (
          <div 
            key={teatro.id} 
            className="theater-card"
            onClick={() => navigate(`/teatro/${teatro.id}`)}
          >
            <h3>{teatro.titulo}</h3>
            
            <p>
              <strong>Participantes:</strong> {teatro.participantes?.length || 0}
            </p>
            
            <p>
              <strong>Dias de ensaio:</strong> {teatro.diasEnsaio?.join(', ') || 'Não definido'}
            </p>
            
            {(teatro.temAlerta || (teatro.avisoAtivo && teatro.aviso)) && (
              <div className="alert-indicator"></div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">ServeFirst</h1>
      </div>
      
      <div className="mobile-content">
        <div className="container">
          <h2>Meus Teatros</h2>
          {renderTeatros()}
          
          {isAdmin && (
            <button 
              className="floating-button"
              onClick={() => navigate('/criar-teatro')}
            >
              +
            </button>
          )}
        </div>
      </div>
      
      <BottomNav currentPath="/" />
    </div>
  );
}

// Componente para listar teatros
function Teatros() {
  const navigate = useNavigate();
  return (
    <MobileWrapper title="Todos os Teatros">
      <Home />
    </MobileWrapper>
  );
}

// Componente para detalhes do teatro
function TeatroDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('principal');
  const dataService = useDataService();
  const { user } = useAuth();
  const [isCreator, setIsCreator] = useState(false);
  const [liderNome, setLiderNome] = useState('');
  const [isParticipating, setIsParticipating] = useState(false);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [participantesInfo, setParticipantesInfo] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showParticipantsLoading, setShowParticipantsLoading] = useState(false);
  const [emailConvite, setEmailConvite] = useState('');
  
  useEffect(() => {
    const fetchTeatro = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await dataService.getTeatroById(id);
        
        if (data) {
          setTeatro(data);
          setParticipantes(data.participantes || []);
          
          // Verificar se o usuário atual é o criador
          if (user && data.criador === user.uid) {
            setIsCreator(true);
          }
          
          // Verificar se o usuário é participante
          if (user && data.participantes && data.participantes.includes(user.uid)) {
            setIsParticipating(true);
          }
        } else {
          setError('Teatro não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar teatro:', err);
        setError('Não foi possível carregar as informações do teatro.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeatro();
  }, [id, dataService, user]);
  
  // Função para deletar o teatro
  const handleDeleteTeatro = async () => {
    if (!id || !user) return;
    
    try {
      setSaving(true);
      const success = await dataService.deleteTeatro(id);
      
      if (success) {
        alert('Teatro excluído com sucesso!');
        navigate('/');
      } else {
        setError('Não foi possível excluir o teatro.');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Erro ao excluir teatro:', err);
      setError('Ocorreu um erro ao excluir o teatro.');
    } finally {
      setSaving(false);
    }
  };
  
  // Função para remover um participante
  const handleRemoveParticipante = async (participanteId: string) => {
    if (!id || !teatro) return;
    
    try {
      setSaving(true);
      
      // Filtrar o participante a ser removido
      const novosParticipantes = participantes.filter(pid => pid !== participanteId);
      
      // Atualizar o teatro
      const success = await dataService.updateTeatro(id, {
        participantes: novosParticipantes
      });
      
      if (success) {
        // Atualizar estado local
        setParticipantes(novosParticipantes);
        setParticipantesInfo(prev => prev.filter(p => p.id !== participanteId));
        alert('Participante removido com sucesso!');
      } else {
        setError('Não foi possível remover o participante.');
      }
    } catch (err) {
      console.error('Erro ao remover participante:', err);
      setError('Ocorreu um erro ao remover o participante.');
    } finally {
      setSaving(false);
    }
  };
  
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Data não definida';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'Data inválida';
    }
  };
  
  const getAlertas = () => {
    if (!teatro) return [];
    
    const alertas = [];
    
    if (teatro.temAlerta) {
      alertas.push(teatro.mensagemAlerta || 'Este teatro possui um alerta importante!');
    }
    
    return alertas;
  };
  
  const navegarParaRoteiro = () => {
    // Na versão atual, apenas mostra aba de detalhes
    setActiveTab('roteiro');
  };
  
  const navegarParaFigurino = () => {
    setActiveTab('figurino');
  };
  
  const navegarParaCenario = () => {
    setActiveTab('cenario');
  };
  
  const navegarParaOrdemCenarios = () => {
    setActiveTab('cenarios');
  };
  
  const navegarParaParticipantes = () => {
    setActiveTab('participantes');
    if (participantesInfo.length === 0) {
      carregarInfoParticipantes();
    }
  };
  
  const compartilharTeatro = () => {
    if (!teatro || !teatro.id) return;
    
    try {
      // Garantir que estamos copiando o ID do teatro e não o título
      navigator.clipboard.writeText(teatro.id);
      
      // Mostrar um alerta mais informativo
      alert(`ID "${teatro.id}" copiado para a área de transferência! Compartilhe este ID com outros participantes para que eles possam acessar este teatro.`);
      
      console.log('ID compartilhado:', teatro.id); // Log para debug
    } catch (err) {
      console.error('Erro ao copiar ID:', err);
      
      // Mostrar o ID mesmo que não consiga copiar para a área de transferência
      alert(`ID do teatro: ${teatro.id}\nAnote este ID para compartilhar com outros participantes.`);
    }
  };
  
  // Adicionar função para entrar no teatro
  const entrarNoTeatro = async () => {
    if (!user || !teatro) return;
    
    try {
      // Verificar se o usuário já é participante
      if (teatro.participantes?.includes(user.uid)) {
        alert('Você já é participante deste teatro!');
        return;
      }
      
      // Criar uma cópia do array de participantes e adicionar o usuário
      const novosParticipantes = [...(teatro.participantes || []), user.uid];
      
      // Atualizar o teatro com o novo array de participantes
      const success = await dataService.updateTeatro(teatro.id, {
        participantes: novosParticipantes
      });
      
      if (success) {
        alert('Você entrou no teatro com sucesso!');
        setIsParticipating(true);
        // Atualizar o teatro localmente
        setTeatro({
          ...teatro,
          participantes: novosParticipantes
        });
      } else {
        alert('Não foi possível entrar no teatro. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao entrar no teatro:', err);
      alert('Ocorreu um erro ao tentar entrar no teatro.');
    }
  };
  
  // Função para obter informações detalhadas dos participantes
  const carregarInfoParticipantes = async () => {
    if (!teatro || !teatro.participantes || teatro.participantes.length === 0) return;
    
    setShowParticipantsLoading(true);
    
    try {
      const db = getFirestore();
      const dadosParticipantes = [];
      
      // Buscar dados de cada participante
      for (const pid of teatro.participantes) {
        const userRef = doc(db, 'usuarios', pid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          dadosParticipantes.push({
            id: pid,
            nome: userDoc.data().nome || userDoc.data().displayName || 'Usuário sem nome',
            email: userDoc.data().email || 'Email não disponível',
            fotoPerfil: userDoc.data().photoURL || null,
            dataCadastro: userDoc.data().dataCadastro || null
          });
        } else {
          dadosParticipantes.push({
            id: pid,
            nome: 'Usuário não encontrado',
            email: 'Email não disponível',
            fotoPerfil: null
          });
        }
      }
      
      setParticipantesInfo(dadosParticipantes);
    } catch (err) {
      console.error('Erro ao carregar informações dos participantes:', err);
      setError('Não foi possível carregar os dados dos participantes.');
    } finally {
      setShowParticipantsLoading(false);
    }
  };
  
  // Função para convidar participantes via email
  const handleConvidarParticipante = async () => {
    if (!emailConvite || !emailConvite.includes('@') || !id) return;
    
    try {
      setSaving(true);
      
      // Verificar se o usuário com este email existe
      const db = getFirestore();
      const q = query(collection(db, 'usuarios'), where('email', '==', emailConvite));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Usuário não encontrado com este email.');
        return;
      }
      
      // Obter o ID do usuário
      const userId = querySnapshot.docs[0].id;
      
      // Verificar se já é participante
      if (participantes.includes(userId)) {
        setError('Este usuário já é participante deste teatro.');
        return;
      }
      
      // Adicionar à lista de participantes
      const novosParticipantes = [...participantes, userId];
      
      // Atualizar o teatro
      const success = await dataService.updateTeatro(id, {
        participantes: novosParticipantes
      });
      
      if (success) {
        setParticipantes(novosParticipantes);
        alert('Participante adicionado com sucesso!');
        setEmailConvite('');
        
        // Atualizar a lista de participantes
        carregarInfoParticipantes();
      } else {
        setError('Não foi possível adicionar o participante.');
      }
    } catch (err) {
      console.error('Erro ao adicionar participante:', err);
      setError('Ocorreu um erro ao adicionar o participante.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="mobile-wrapper">
        <div className="mobile-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h1 className="mobile-header-title">Detalhes</h1>
        </div>
        <div className="mobile-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #fc6c5f',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Carregando informações do teatro...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mobile-wrapper">
        <div className="mobile-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h1 className="mobile-header-title">Erro</h1>
        </div>
        <div className="mobile-content" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: '#ffeeee', 
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <p style={{ color: '#cc0000', fontWeight: 'bold' }}>{error}</p>
            <button 
              onClick={() => navigate('/teatros')}
              style={{
                backgroundColor: '#041e42',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                marginTop: '15px',
                cursor: 'pointer'
              }}
            >
              Voltar para Teatros
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!teatro) {
    return (
      <div className="mobile-wrapper">
        <div className="mobile-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h1 className="mobile-header-title">Detalhes</h1>
        </div>
        <div className="mobile-content" style={{ padding: '20px', textAlign: 'center' }}>
          <p>Nenhuma informação disponível para este teatro.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="mobile-header-title">{teatro.titulo}</h1>
      </div>
      
      <div className="mobile-content">
        <div className="container">
          {/* Abas para navegação */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #eee',
            marginBottom: '15px'
          }}>
            <div 
              onClick={() => setActiveTab('principal')} 
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '10px', 
                borderBottom: activeTab === 'principal' ? '2px solid #fc6c5f' : 'none',
                fontWeight: activeTab === 'principal' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Principal
            </div>
            <div 
              onClick={navegarParaRoteiro} 
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '10px',
                borderBottom: activeTab === 'roteiro' ? '2px solid #fc6c5f' : 'none',
                fontWeight: activeTab === 'roteiro' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Roteiro
            </div>
            <div 
              onClick={navegarParaCenario} 
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '10px',
                borderBottom: activeTab === 'cenario' ? '2px solid #fc6c5f' : 'none',
                fontWeight: activeTab === 'cenario' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Cenário
            </div>
            <div 
              onClick={navegarParaFigurino} 
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '10px',
                borderBottom: activeTab === 'figurino' ? '2px solid #fc6c5f' : 'none',
                fontWeight: activeTab === 'figurino' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Figurino
            </div>
            <div 
              onClick={navegarParaParticipantes} 
              style={{ 
                flex: 1, 
                textAlign: 'center', 
                padding: '10px',
                borderBottom: activeTab === 'participantes' ? '2px solid #fc6c5f' : 'none',
                fontWeight: activeTab === 'participantes' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Equipe
            </div>
          </div>
          
          {/* Apenas mostrar o aviso real se estiver ativo */}
          {teatro.avisoAtivo && teatro.aviso && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeeba', 
              padding: '15px', 
              marginBottom: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ 
                color: '#856404', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                fontSize: '16px'
              }}>
                <span style={{ marginRight: '8px' }}>⚠️</span>
                Aviso
              </h3>
              <p style={{ wordBreak: 'break-word', margin: '0', lineHeight: '1.4' }}>
                {teatro.aviso}
              </p>
            </div>
          )}
          
          {/* Alertas temAlerta - Condicionais */}
          {teatro.temAlerta && (
            <div style={{ 
              backgroundColor: '#fff8e1', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #ffe082'
            }}>
              <p style={{ color: '#ff8f00', margin: 0 }}>
                <span style={{ marginRight: '8px' }}>⚠️</span>
                {teatro.mensagemAlerta || 'Este teatro possui um alerta importante!'}
              </p>
            </div>
          )}
          
          {/* Conteúdo das abas */}
          {activeTab === 'principal' && (
            <>
              {/* Informações básicas */}
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Informações Gerais</h3>
                <p><strong>ID:</strong> {teatro.id}</p>
                <p><strong>Data de Apresentação:</strong> {formatDate(teatro.dataApresentacao)}</p>
                <p><strong>Local:</strong> {teatro.local || 'Não definido'}</p>
                <p><strong>Dias de Ensaio:</strong> {teatro.diasEnsaio?.join(', ') || 'Não definidos'}</p>
                <p><strong>Criado por:</strong> {liderNome}</p>
                {teatro.descricao && (
                  <div>
                    <p><strong>Descrição:</strong></p>
                    <p style={{ margin: '5px 0 0 0' }}>{teatro.descricao}</p>
                  </div>
                )}
              </div>
              
              {/* Estatísticas */}
              <div style={{ 
                backgroundColor: '#f9f9f9', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Estatísticas</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 0 50%', marginBottom: '10px' }}>
                    <p style={{ margin: '0' }}><strong>Quantidade de Cenas:</strong></p>
                    <p style={{ margin: '0', fontSize: '20px', color: '#fc6c5f' }}>{teatro.quantidadeCenas || '0'}</p>
                  </div>
                  <div style={{ flex: '1 0 50%', marginBottom: '10px' }}>
                    <p style={{ margin: '0' }}><strong>Número de Atos:</strong></p>
                    <p style={{ margin: '0', fontSize: '20px', color: '#fc6c5f' }}>{teatro.numeroAtos || '0'}</p>
                  </div>
                  <div style={{ flex: '1 0 50%', marginBottom: '10px' }}>
                    <p style={{ margin: '0' }}><strong>Quantidade de Atores:</strong></p>
                    <p style={{ margin: '0', fontSize: '20px', color: '#fc6c5f' }}>{teatro.quantidadeAtores || '0'}</p>
                  </div>
                  <div style={{ flex: '1 0 50%', marginBottom: '10px' }}>
                    <p style={{ margin: '0' }}><strong>Participantes:</strong></p>
                    <p style={{ margin: '0', fontSize: '20px', color: '#fc6c5f' }}>{teatro.participantes?.length || '0'}</p>
                  </div>
                </div>
              </div>
              
              {/* Ações */}
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={compartilharTeatro}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '8px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Compartilhar ID
                </button>
                
                {isCreator && (
                  <button 
                    onClick={() => navigate(`/editar-teatro/${teatro.id}`)}
                    style={{
                      backgroundColor: '#fc6c5f',
                      color: 'white',
                      padding: '12px 0',
                      borderRadius: '8px',
                      border: 'none',
                      width: '100%',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Editar Teatro
                  </button>
                )}
                
                {user && !isCreator && !isParticipating && (
                  <button 
                    onClick={entrarNoTeatro}
                    style={{
                      backgroundColor: '#3e8e41', // Verde
                      color: 'white',
                      padding: '12px 0',
                      borderRadius: '8px',
                      border: 'none',
                      width: '100%',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: isCreator ? '10px' : '0'
                    }}
                  >
                    Participar deste Teatro
                  </button>
                )}
                
                {user && !isCreator && isParticipating && (
                  <div style={{
                    backgroundColor: '#f0f8ff', // Azul claro
                    color: '#0066cc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cce5ff',
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '16px',
                    marginTop: '10px'
                  }}>
                    Você é participante deste teatro
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Aba de Roteiro */}
          {activeTab === 'roteiro' && (
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Roteiro</h3>
              <p><strong>Número de Atos:</strong> {teatro.numeroAtos || '0'}</p>
              
              {teatro.roteiro ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {teatro.roteiro}
                </div>
              ) : (
                <p>Nenhum roteiro definido para este teatro.</p>
              )}
            </div>
          )}
          
          {/* Aba de Cenário */}
          {activeTab === 'cenario' && (
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Cenário</h3>
              <p><strong>Quantidade de Cenas:</strong> {teatro.quantidadeCenas || '0'}</p>
              
              {teatro.cenario ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {teatro.cenario}
                </div>
              ) : (
                <p>Nenhum cenário definido para este teatro.</p>
              )}
              
              {teatro.ordemCenarios && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Ordem dos Cenários</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}>
                    {teatro.ordemCenarios}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Aba de Figurino */}
          {activeTab === 'figurino' && (
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Figurino</h3>
              <p><strong>Quantidade de Atores:</strong> {teatro.quantidadeAtores || '0'}</p>
              
              {teatro.figurino ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {teatro.figurino}
                </div>
              ) : (
                <p>Nenhum figurino definido para este teatro.</p>
              )}
              
              {teatro.temaFigurinos && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Tema dos Figurinos</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '8px',
                    border: '1px solid #eee'
                  }}>
                    {teatro.temaFigurinos}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Aba de Participantes */}
          {activeTab === 'participantes' && (
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Participantes</h3>
              
              {/* Convite para adicionar participantes - visível apenas para o criador */}
              {isCreator && (
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Adicionar Participante</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="email"
                      placeholder="Email do participante"
                      value={emailConvite}
                      onChange={(e) => setEmailConvite(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                    <button
                      onClick={handleConvidarParticipante}
                      disabled={saving}
                      style={{
                        backgroundColor: '#041e42',
                        color: 'white',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {saving ? 'Enviando...' : 'Convidar'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Lista de participantes */}
              {showParticipantsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner" style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #fc6c5f',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px'
                  }}></div>
                  <p>Carregando participantes...</p>
                </div>
              ) : (
                <div>
                  {participantesInfo.length > 0 ? (
                    <div>
                      {participantesInfo.map((participante) => (
                        <div key={participante.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: '1px solid #eee'
                        }}>
                          {/* Avatar do participante */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#e1e1e1',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: '10px',
                            overflow: 'hidden'
                          }}>
                            {participante.fotoPerfil ? (
                              <img 
                                src={participante.fotoPerfil} 
                                alt="Avatar" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontWeight: 'bold' }}>
                                {participante.nome.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {/* Informações do participante */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {participante.nome}
                              {participante.id === teatro.criador && (
                                <span style={{ 
                                  backgroundColor: '#fc6c5f', 
                                  color: 'white',
                                  fontSize: '12px',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  marginLeft: '8px'
                                }}>
                                  Lider
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {participante.email}
                            </div>
                          </div>
                          
                          {/* Botão de remover - visível apenas para o criador e não para o próprio criador */}
                          {isCreator && participante.id !== user?.uid && (
                            <button
                              onClick={() => handleRemoveParticipante(participante.id)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#cc0000',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                padding: '5px'
                              }}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      marginTop: '10px' 
                    }}>
                      <p>Nenhum participante encontrado.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav currentPath="/buscar" />
    </div>
  );
}

// Componente para criar teatro com fluxo em etapas
function CriarTeatro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dataService = useDataService();
  
  const [etapa, setEtapa] = useState(1);
  const [teatroId, setTeatroId] = useState('');
  
  // Dados do teatro
  const [titulo, setTitulo] = useState('');
  const [diasEnsaio, setDiasEnsaio] = useState('');
  const [dataApresentacao, setDataApresentacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidadeCenas, setQuantidadeCenas] = useState('0');
  const [cenario, setCenario] = useState('');
  const [quantidadeAtores, setQuantidadeAtores] = useState('0');
  const [figurino, setFigurino] = useState('');
  const [quantidadeAtos, setQuantidadeAtos] = useState('0');
  const [roteiro, setRoteiro] = useState('');
  const [emailParticipante, setEmailParticipante] = useState('');
  const [local, setLocal] = useState('');  // Adicionado o estado local
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importTarget, setImportTarget] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  
  const handleImportClick = (targetField: string) => {
    // Armazenar o campo de destino antes de abrir o seletor de arquivo
    setImportTarget(targetField);
    fileInput.current?.click();
  };
  
  // Wrapper para compatibilidade com o handler de evento do botão
  const handleImportClickWithEvent = (targetField: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    handleImportClick(targetField);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setError('');
    
    try {
      let content = '';
      
      // Para documentos DOCX
      if (file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          console.log("DOCX importado com sucesso, conteúdo: ", content.substring(0, 100) + "...");
        } catch (error: any) {
          console.error("Erro específico ao processar DOCX:", error);
          throw new Error(`Erro ao processar arquivo DOCX: ${error.message || 'erro desconhecido'}`);
        }
      } 
      // Para arquivos de texto
      else if (file.name.endsWith('.txt')) {
        try {
          const reader = new FileReader();
          content = await new Promise((resolve, reject) => {
            reader.onload = (event) => {
              resolve(event.target?.result as string || '');
            };
            reader.onerror = (e) => {
              console.error("Erro no FileReader:", e);
              reject(new Error('Erro ao ler o arquivo de texto.'));
            };
            reader.readAsText(file);
          });
          console.log("TXT importado com sucesso, conteúdo: ", content.substring(0, 100) + "...");
        } catch (error: any) {
          console.error("Erro específico ao processar TXT:", error);
          throw new Error(`Erro ao processar arquivo TXT: ${error.message || 'erro desconhecido'}`);
        }
      }
      // Outros formatos
      else {
        throw new Error(`Formato de arquivo não suportado: ${file.name}. Use .docx ou .txt`);
      }
      
      // Verificar se o conteúdo foi extraído corretamente
      if (!content || content.trim() === '') {
        throw new Error('O arquivo parece estar vazio ou seu conteúdo não pôde ser lido.');
      }
      
      // Aplicar o conteúdo importado com base no campo de destino
      switch (importTarget) {
        case 'cenario':
          setCenario(content);
          alert('Cenário importado com sucesso!');
          break;
        case 'figurino':
          setFigurino(content);
          alert('Figurino importado com sucesso!');
          break;
        case 'roteiro':
          setRoteiro(content);
          alert('Roteiro importado com sucesso!');
          break;
        default:
          // Determinar com base na etapa atual (fallback do comportamento anterior)
          if (etapa === 2) {
            setCenario(content);
            alert('Cenário importado com sucesso!');
          } else if (etapa === 3) {
            setFigurino(content);
            alert('Figurino importado com sucesso!');
          } else if (etapa === 4) {
            setRoteiro(content);
            alert('Roteiro importado com sucesso!');
          }
      }
      
      // Limpar o input de arquivo para permitir importar o mesmo arquivo novamente
      if (fileInput.current) {
        fileInput.current.value = '';
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setError(error instanceof Error ? error.message : 'Não foi possível processar o arquivo.');
      alert(`Erro: ${error instanceof Error ? error.message : 'Não foi possível processar o arquivo.'}`);
    } finally {
      setImportLoading(false);
      setImportTarget('');
    }
  };
  
  const avancarEtapa = () => {
    switch (etapa) {
      case 1: // Validar primeira etapa
        if (!titulo) {
          setError('Por favor, informe o título do grupo.');
          return;
        }
        if (!diasEnsaio) {
          setError('Por favor, informe os dias de ensalio.');
          return;
        }
        if (!dataApresentacao) {
          setError('Por favor, informe a data de apresentação.');
          return;
        }
        setEtapa(2);
        break;
        
      case 2: // Avançar para Figurino/Atores
        setEtapa(3);
        break;
        
      case 3: // Avançar para Roteiro/Atos
        setEtapa(4);
        break;
        
      case 4: // Avançar para convidar participantes
        // Criar o teatro antes de mostrar a tela de convite
        criarTeatroFirestore().then(id => {
          if (id) {
            setTeatroId(id);
            setEtapa(5);
          }
        });
        break;
        
      case 5: // Finalizar processo
        navigate(`/teatro/${teatroId}`);
        break;
    }
    
    setError('');
  };
  
  const voltarEtapa = () => {
    if (etapa > 1) {
      setEtapa(etapa - 1);
      setError('');
    } else {
      navigate(-1);
    }
  };
  
  const navegarParaOrdemCenarios = () => {
    // Implementação futura - por enquanto apenas avança para a próxima etapa
    avancarEtapa();
  };
  
  const copiarId = () => {
    if (!teatroId) {
      setError('Ainda não há um ID disponível para copiar.');
      return;
    }
    
    try {
      navigator.clipboard.writeText(teatroId)
        .then(() => {
          console.log('ID copiado:', teatroId); // Log para debug
          alert(`ID "${teatroId}" copiado para a área de transferência! Compartilhe este ID com outros participantes para que eles possam acessar este teatro.`);
        })
        .catch(err => {
          console.error('Erro ao copiar ID:', err);
          alert(`ID do teatro: ${teatroId}\nAnote este ID para compartilhar com outros participantes.`);
        });
    } catch (err) {
      console.error('Erro ao copiar ID:', err);
      setError('Não foi possível copiar o ID.');
    }
  };
  
  const criarTeatroFirestore = async (): Promise<string> => {
    if (!user) {
      setError('Você precisa estar logado para criar um teatro.');
      return '';
    }
    
    setLoading(true);
    setError('');
    
    try {
      const novoTeatro: Omit<Teatro, 'id'> = {
        titulo,
        diasEnsaio: diasEnsaio.split(',').map(d => d.trim()),
        dataApresentacao: String(dataApresentacao),
        descricao,
        quantidadeCenas: parseInt(quantidadeCenas) || 0,
        cenario,
        quantidadeAtores: parseInt(quantidadeAtores) || 0,
        figurino,
        numeroAtos: parseInt(quantidadeAtos) || 0,
        roteiro,
        participantes: [user.uid],
        criador: user.uid,
        local: local || ""  // Usando a variável local corretamente
      };
      
      const id = await dataService.createTeatro(novoTeatro);
      console.log('Teatro criado com sucesso:', id);
      return id;
    } catch (err) {
      console.error('Erro ao criar teatro:', err);
      setError('Ocorreu um erro ao criar o teatro. Por favor, tente novamente.');
      return '';
    } finally {
      setLoading(false);
    }
  };
  
  // Renderiza a etapa atual
  const renderEtapa = () => {
    switch(etapa) {
      case 1: // Título, Dias de Ensaio, Data de Apresentação
        return (
          <div className="mobile-wrapper">
            <div className="mobile-header">
              <button className="back-button" onClick={() => navigate(-1)}>
                ←
              </button>
              <h1 className="mobile-header-title">Criar Grupo:</h1>
            </div>
            
            <div className="mobile-content">
              <div className="container">
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    className="form-input"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Dias de Ensaio:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={diasEnsaio}
                    onChange={(e) => setDiasEnsaio(e.target.value)}
                    placeholder="Ex: Segunda, Quarta, Sexta"
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Data de Apresentação</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataApresentacao}
                    onChange={(e) => setDataApresentacao(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                {error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                    {error}
                  </div>
                )}
                
                <button
                  className="button-primary"
                  onClick={avancarEtapa}
                  disabled={loading}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  {loading ? 'Processando...' : 'Criar Grupo'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 2: // Quantidade de Cenas, Cenário
        return (
          <div className="mobile-wrapper">
            <div className="mobile-header">
              <button className="back-button" onClick={voltarEtapa}>
                ←
              </button>
              <h1 className="mobile-header-title">Descrição</h1>
            </div>
            
            <div className="mobile-content">
              <div className="container">
                <div className="form-group">
                  <label>Quantidade de Cenas:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quantidadeCenas}
                    onChange={(e) => setQuantidadeCenas(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Cenario:</label>
                  <textarea
                    className="form-textarea"
                    value={cenario}
                    onChange={(e) => setCenario(e.target.value)}
                    rows={10}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec',
                      width: '100%',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                    {error}
                  </div>
                )}
                
                <button
                  className="button-primary"
                  onClick={navegarParaOrdemCenarios}
                  disabled={loading}
                  style={{
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  Ordem Dos Cenarios
                </button>
                
                <button
                  className="button-primary"
                  onClick={avancarEtapa}
                  disabled={loading}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  {loading ? 'Processando...' : 'Criar Grupo'}
                </button>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '20px 0',
                  color: '#666'
                }}>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                  <span style={{ margin: '0 10px' }}>ou</span>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                </div>
                
                <button
                  onClick={handleImportClickWithEvent('cenario')}
                  disabled={importLoading}
                  style={{
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {importLoading ? 'Importando...' : 'Importar Cenário (DOCX/TXT)'}
                </button>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
                
                {error && (
                  <div style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3: // Quantidade de Atores, Figurino
        return (
          <div className="mobile-wrapper">
            <div className="mobile-header">
              <button className="back-button" onClick={voltarEtapa}>
                ←
              </button>
              <h1 className="mobile-header-title">Descrição</h1>
            </div>
            
            <div className="mobile-content">
              <div className="container">
                <div className="form-group">
                  <label>Quantidade de Atores</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quantidadeAtores}
                    onChange={(e) => setQuantidadeAtores(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Figurino</label>
                  <textarea
                    className="form-textarea"
                    value={figurino}
                    onChange={(e) => setFigurino(e.target.value)}
                    rows={10}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec',
                      width: '100%',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                    {error}
                  </div>
                )}
                
                <button
                  className="button-primary"
                  onClick={avancarEtapa}
                  disabled={loading}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  {loading ? 'Processando...' : 'Criar Grupo'}
                </button>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '20px 0',
                  color: '#666'
                }}>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                  <span style={{ margin: '0 10px' }}>ou</span>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                </div>
                
                <button
                  onClick={handleImportClickWithEvent('figurino')}
                  disabled={importLoading}
                  style={{
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {importLoading ? 'Importando...' : 'Importar Figurino (DOCX/TXT)'}
                </button>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
                
              </div>
            </div>
          </div>
        );
        
      case 4: // Quantidade de Atos, Roteiro
        return (
          <div className="mobile-wrapper">
            <div className="mobile-header">
              <button className="back-button" onClick={voltarEtapa}>
                ←
              </button>
              <h1 className="mobile-header-title">Descrição</h1>
            </div>
            
            <div className="mobile-content">
              <div className="container">
                <div className="form-group">
                  <label>Quantidade de Atos</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quantidadeAtos}
                    onChange={(e) => setQuantidadeAtos(e.target.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Roteiro</label>
                  <textarea
                    className="form-textarea"
                    value={roteiro}
                    onChange={(e) => setRoteiro(e.target.value)}
                    rows={10}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: '#ececec',
                      width: '100%',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                {error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                    {error}
                  </div>
                )}
                
                <button
                  className="button-primary"
                  onClick={avancarEtapa}
                  disabled={loading}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  {loading ? 'Processando...' : 'Criar Grupo'}
                </button>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '20px 0',
                  color: '#666'
                }}>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                  <span style={{ margin: '0 10px' }}>ou</span>
                  <div style={{ height: '1px', backgroundColor: '#ccc', flex: 1 }}></div>
                </div>
                
                <button
                  onClick={handleImportClickWithEvent('roteiro')}
                  disabled={importLoading}
                  style={{
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  {importLoading ? 'Importando...' : 'Importar Roteiro (DOCX/TXT)'}
                </button>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
              </div>
            </div>
          </div>
        );
        
      case 5: // Finalizar processo / Convidar
        return (
          <div className="mobile-wrapper">
            <div className="mobile-header">
              <button className="back-button" onClick={voltarEtapa}>
                ←
              </button>
              <h1 className="mobile-header-title">Finalizar</h1>
            </div>
            
            <div className="mobile-content">
              <div className="container">
                <div className="success-message" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    backgroundColor: '#3e8e41', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 20px' 
                  }}>
                    <span style={{ color: 'white', fontSize: '40px' }}>✓</span>
                  </div>
                  <h2>Grupo Criado com Sucesso!</h2>
                  <p>ID do Grupo: {teatroId}</p>
                </div>
                
                <button
                  className="button-primary"
                  onClick={copiarId}
                  style={{
                    backgroundColor: '#041e42',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '15px'
                  }}
                >
                  Copiar ID
                </button>
                
                <button
                  className="button-primary"
                  onClick={avancarEtapa}
                  style={{
                    backgroundColor: '#3e8e41',
                    color: 'white',
                    padding: '12px 0',
                    borderRadius: '20px',
                    border: 'none',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Ver Detalhes do Grupo
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="mobile-header-title">Criar Grupo</h1>
      </div>
      
      <div className="mobile-content">
        <div className="container">
          {renderEtapa()}
        </div>
      </div>
      
      {/* Input de arquivo invisível para importação */}
      <input
        type="file"
        ref={fileInput}
        style={{ display: 'none' }}
        accept=".docx,.txt"
        onChange={handleFileChange}
      />
      
      <BottomNav currentPath="/criar-teatro" />
    </div>
  );
}

// Componente App com roteamento
function App() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/teatros" element={<Teatros />} />
        <Route path="/teatro/:id" element={<TeatroDetalhes />} />
        <Route path="/criar-teatro" element={
          user ? <CriarTeatro /> : <Navigate to="/login" />
        } />
        <Route path="/editar-teatro/:id" element={
          user ? <EditarTeatro /> : <Navigate to="/login" />
        } />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/perfil" element={
          user ? <Perfil /> : <Navigate to="/login" />
        } />
        
        {/* Rotas de autenticação com AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        </Route>
        
        <Route path="/set-admin" element={<SetAdmin />} />
      </Routes>
      
      {/* Componente independente para o botão de admin */}
      <AdminButton />
    </BrowserRouter>
  );
}

// Renderização do aplicativo na div root
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <InternalDataServiceProvider>
        <App />
      </InternalDataServiceProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Componentes para rotas vazias temporárias
function Buscar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dataService = useDataService();
  const [searchQuery, setSearchQuery] = useState('');
  const [teatro, setTeatro] = useState<Teatro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, digite um ID de teatro');
      return;
    }
    
    setLoading(true);
    setTeatro(null);
    setError('');
    setShowResults(true);
    
    try {
      const result = await dataService.getTeatroById(searchQuery.trim());
      
      if (result) {
        setTeatro(result);
      } else {
        setError('Teatro não encontrado. Verifique o ID e tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao buscar teatro:', err);
      setError('Ocorreu um erro ao buscar o teatro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const formatarData = (dataString?: string) => {
    if (!dataString) return 'Data não definida';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Data inválida';
    }
  };
  
  // Verificar se o usuário já é participante
  const isParticipating = (teatro: Teatro) => {
    return teatro.participantes && user && teatro.participantes.includes(user.uid);
  };
  
  const handleJoinTeatro = async () => {
    if (!teatro || !user) return;
    
    setLoading(true);
    
    try {
      // Se o usuário já for participante, não faz nada
      if (isParticipating(teatro)) {
        navigate(`/teatro/${teatro.id}`);
        return;
      }
      
      // Adicionar o usuário à lista de participantes
      const novosParticipantes = [...(teatro.participantes || []), user.uid];
      
      const success = await dataService.updateTeatro(teatro.id, {
        participantes: novosParticipantes
      });
      
      if (success) {
        // Atualizar o estado localmente
        setTeatro({
          ...teatro,
          participantes: novosParticipantes
        });
        
        // Navegar para a página do teatro
        navigate(`/teatro/${teatro.id}`);
      } else {
        setError('Não foi possível entrar no teatro. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao entrar no teatro:', err);
      setError('Ocorreu um erro ao tentar entrar no teatro.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">Buscar</h1>
      </div>
      <div className="mobile-content">
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              Encontre um teatro pelo ID
            </h2>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px' 
            }}>
              <div style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o ID do teatro" 
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 15px',
                    borderRadius: '30px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    backgroundColor: '#f5f5f5',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🔍</span>
                </button>
              </div>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                textAlign: 'center',
                margin: '0'
              }}>
                Digite o ID para buscar e participar de um grupo de teatro
              </p>
              
              {error && (
                <div style={{ 
                  backgroundColor: '#ffebee', 
                  color: '#d32f2f', 
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '14px',
                  marginTop: '10px'
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {loading && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
              color: '#666'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #fc6c5f',
                borderRadius: '50%',
                marginBottom: '15px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Buscando teatro...</p>
            </div>
          )}
          
          {showResults && !loading && !error && !teatro && (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              marginTop: '20px'
            }}>
              <p>Nenhum teatro encontrado com este ID.</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Verifique se o ID está correto e tente novamente.
              </p>
            </div>
          )}
          
          {teatro && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginTop: '20px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#fc6c5f',
                color: 'white'
              }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{teatro.titulo}</h3>
                <p style={{ margin: '0', fontSize: '14px', opacity: '0.8' }}>ID: {teatro.id}</p>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '14px', 
                    color: '#666', 
                    fontWeight: 'bold' 
                  }}>
                    Data de Apresentação
                  </p>
                  <p style={{ margin: '0', fontSize: '16px' }}>
                    {formatarData(teatro.dataApresentacao)}
                  </p>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '14px', 
                    color: '#666', 
                    fontWeight: 'bold' 
                  }}>
                    Dias de Ensaio
                  </p>
                  <p style={{ margin: '0', fontSize: '16px' }}>
                    {teatro.diasEnsaio?.join(', ') || 'Não definidos'}
                  </p>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ 
                    margin: '0 0 5px 0', 
                    fontSize: '14px', 
                    color: '#666', 
                    fontWeight: 'bold' 
                  }}>
                    Participantes
                  </p>
                  <p style={{ margin: '0', fontSize: '16px' }}>
                    {teatro.participantes?.length || 0} participante(s)
                  </p>
                </div>
                
                <button
                  onClick={handleJoinTeatro}
                  disabled={loading}
                  style={{
                    backgroundColor: isParticipating(teatro) ? '#4caf50' : '#fc6c5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '12px 0',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  {isParticipating(teatro) ? 'Ver Teatro' : 'Participar do Teatro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav currentPath="/buscar" />
    </div>
  );
}

function Eventos() {
  const { user } = useAuth();
  const dataService = useDataService();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teatros, setTeatros] = useState<Teatro[]>([]);
  const [eventos, setEventos] = useState<{teatro: Teatro, tipo: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [ensaioDates, setEnsaioDates] = useState<Date[]>([]);
  const [apresentacaoDates, setApresentacaoDates] = useState<Date[]>([]);
  
  // Função para formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };
  
  useEffect(() => {
    const carregarTeatros = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const teatrosData = await dataService.getTeatros();
        setTeatros(teatrosData);
        
        // Coletar datas de ensaio
        const ensaioDates: Date[] = [];
        const apresentacaoDates: Date[] = [];
        
        teatrosData.forEach(teatro => {
          // Adicionar dias de ensaio
          if (teatro.diasEnsaio && teatro.diasEnsaio.length > 0) {
            const diasDaSemana: Record<string, number> = {
              'Domingo': 0, 'Dom': 0,
              'Segunda': 1, 'Segunda-feira': 1, 'Seg': 1,
              'Terça': 2, 'Terça-feira': 2, 'Ter': 2,
              'Quarta': 3, 'Quarta-feira': 3, 'Qua': 3,
              'Quinta': 4, 'Quinta-feira': 4, 'Qui': 4,
              'Sexta': 5, 'Sexta-feira': 5, 'Sex': 5,
              'Sábado': 6, 'Sab': 6
            };
            
            // Adicionar os próximos 60 dias de ensaio
            const hoje = new Date();
            for (let i = 0; i < 60; i++) {
              const data = new Date();
              data.setDate(hoje.getDate() + i);
              
              // Verificar se o dia da semana está na lista de ensaio
              const diaDaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda, ...
              const temEnsaio = teatro.diasEnsaio.some(diaEnsaio => {
                // Garantir que diaEnsaio é uma string válida para evitar erro
                if (typeof diaEnsaio !== 'string') return false;
                
                const diaKey = diaEnsaio as string;
                const numeroDia = diasDaSemana[diaKey];
                return numeroDia === diaDaSemana;
              });
              
              if (temEnsaio) {
                ensaioDates.push(new Date(data));
              }
            }
          }
          
          // Adicionar data de apresentação
          if (teatro.dataApresentacao) {
            try {
              const dataApresentacao = new Date(teatro.dataApresentacao);
              if (!isNaN(dataApresentacao.getTime())) {
                apresentacaoDates.push(dataApresentacao);
              }
            } catch (e) {
              console.error('Erro ao converter data de apresentação:', e);
            }
          }
        });
        
        setEnsaioDates(ensaioDates);
        setApresentacaoDates(apresentacaoDates);
      } catch (error) {
        console.error('Erro ao carregar teatros:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarTeatros();
  }, [user, dataService]);
  
  useEffect(() => {
    // Filtrar eventos para a data selecionada
    if (teatros.length > 0) {
      const eventosData: {teatro: Teatro, tipo: string}[] = [];
      
      teatros.forEach(teatro => {
        // Verificar se é dia de apresentação
        if (teatro.dataApresentacao) {
          try {
            const dataApresentacao = new Date(teatro.dataApresentacao);
            if (
              dataApresentacao.getDate() === selectedDate.getDate() &&
              dataApresentacao.getMonth() === selectedDate.getMonth() &&
              dataApresentacao.getFullYear() === selectedDate.getFullYear()
            ) {
              eventosData.push({
                teatro,
                tipo: 'apresentacao'
              });
            }
          } catch (e) {
            console.error('Erro ao verificar data de apresentação:', e);
          }
        }
        
        // Verificar se é dia de ensaio
        if (teatro.diasEnsaio && teatro.diasEnsaio.length > 0) {
          const diasDaSemana: Record<string, number> = {
            'Domingo': 0, 'Dom': 0,
            'Segunda': 1, 'Segunda-feira': 1, 'Seg': 1,
            'Terça': 2, 'Terça-feira': 2, 'Ter': 2,
            'Quarta': 3, 'Quarta-feira': 3, 'Qua': 3,
            'Quinta': 4, 'Quinta-feira': 4, 'Qui': 4,
            'Sexta': 5, 'Sexta-feira': 5, 'Sex': 5,
            'Sábado': 6, 'Sab': 6
          };
          
          const diaDaSemana = selectedDate.getDay();
          const temEnsaio = teatro.diasEnsaio.some(diaEnsaio => {
            // Garantir que diaEnsaio é uma string válida para evitar erro
            if (typeof diaEnsaio !== 'string') return false;
            
            const diaKey = diaEnsaio as string;
            const numeroDia = diasDaSemana[diaKey];
            return numeroDia === diaDaSemana;
          });
          
          if (temEnsaio) {
            eventosData.push({
              teatro,
              tipo: 'ensaio'
            });
          }
        }
      });
      
      setEventos(eventosData);
    }
  }, [selectedDate, teatros]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">Eventos</h1>
      </div>
      <div className="mobile-content" style={{ overflow: 'auto', height: 'calc(100vh - 56px - 60px)' }}>
        <div style={{ padding: '15px', paddingBottom: '80px' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#666'
            }}>
              <p>Carregando eventos...</p>
            </div>
          ) : (
            <>
              {/* Calendário interativo */}
              <SimpleCalendarInteractive 
                onSelectDate={handleDateSelect}
                ensaioDates={ensaioDates}
                apresentacaoDates={apresentacaoDates}
              />
              
              {/* Lista de eventos da data selecionada */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ 
                  marginBottom: '15px', 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '22px' }}>📅</span>
                  Eventos em {formatDate(selectedDate)}
                </h2>
                
                {eventos.length === 0 ? (
                  <div style={{
                    backgroundColor: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    <p>Não há eventos agendados para esta data.</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>
                      Os eventos dos seus teatros aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '60px' }}>
                    {eventos.map((evento, index) => (
                      <div 
                        key={index}
                        style={{
                          backgroundColor: '#fff',
                          padding: '15px',
                          borderRadius: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          borderLeft: evento.tipo === 'apresentacao' ? '4px solid #fc6c5f' : '4px solid #6c5ce7'
                        }}
                        onClick={() => navigate(`/teatro/${evento.teatro.id}`)}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '5px'
                        }}>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            {evento.teatro.titulo}
                          </h3>
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            backgroundColor: evento.tipo === 'apresentacao' ? '#fc6c5f' : '#6c5ce7',
                            color: 'white',
                            borderRadius: '12px'
                          }}>
                            {evento.tipo === 'apresentacao' ? 'Apresentação' : 'Ensaio'}
                          </span>
                        </div>
                        
                        <p style={{ 
                          margin: '5px 0',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {evento.teatro.local ? `Local: ${evento.teatro.local}` : 'Local não definido'}
                        </p>
                        
                        <p style={{ 
                          margin: '0',
                          fontSize: '12px',
                          color: '#888',
                          textAlign: 'right',
                          marginTop: '5px'
                        }}>
                          Toque para ver detalhes
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav currentPath="/eventos" />
    </div>
  );
}

function Perfil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dataService = useDataService();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    gruposAtivos: 0,
    participacoes: 0
  });
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const loadUserPreferences = () => {
      if (!user) return;
      
      // Try to load saved preferences from localStorage
      const savedDarkTheme = localStorage.getItem(`darkTheme_${user.uid}`);
      const savedNotifications = localStorage.getItem(`notifications_${user.uid}`);
      
      if (savedDarkTheme !== null) {
        setDarkThemeEnabled(savedDarkTheme === 'true');
      }
      
      if (savedNotifications !== null) {
        setNotificationsEnabled(savedNotifications === 'true');
      }
    };
    
    loadUserPreferences();
  }, [user]);
  
  // Apply dark theme to body element
  useEffect(() => {
    if (darkThemeEnabled) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkThemeEnabled]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch user's theaters
        const teatros = await dataService.getTeatros();
        
        // Calculate statistics
        const gruposAtivos = teatros.length;
        
        // Calculate total participations (sum of all theaters where user is not the creator)
        const participacoes = teatros.reduce((count, teatro) => {
          // If user is not the creator, it counts as a participation
          return count + (teatro.criador !== user.uid ? 1 : 0);
        }, 0);
        
        setUserStats({
          gruposAtivos,
          participacoes
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, dataService]);
  
  const toggleDarkTheme = () => {
    const newValue = !darkThemeEnabled;
    setDarkThemeEnabled(newValue);
    
    if (user) {
      localStorage.setItem(`darkTheme_${user.uid}`, String(newValue));
    }
  };
  
  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    if (user) {
      localStorage.setItem(`notifications_${user.uid}`, String(newValue));
    }
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  return (
    <div className="mobile-wrapper">
      <div className="mobile-header">
        <h1 className="mobile-title">Perfil</h1>
      </div>
      <div className="mobile-content">
        <div style={{ padding: '20px', paddingBottom: '120px' }}>
          {/* Header com foto e informações básicas */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '25px',
            padding: '15px',
            backgroundColor: '#f8f8f8',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#041e42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              marginRight: '20px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
            }}>
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#333' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </h2>
              {user && (
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{user.email}</p>
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginTop: '8px',
                color: '#4caf50',
                fontSize: '13px'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#4caf50',
                  marginRight: '5px'
                }}></span>
                Ativo
              </div>
            </div>
          </div>

          {/* Seções do perfil */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#333', 
              marginBottom: '15px',
              fontWeight: 'bold',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee'
            }}>
              Informações da Conta
            </h3>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '3px' }}>Email</div>
                  <div style={{ fontSize: '16px' }}>{user?.email || 'Não disponível'}</div>
                </div>
                <div style={{ color: '#fc6c5f', fontSize: '14px', cursor: 'pointer' }}>
                  Verificado
                </div>
              </div>
              
              <div style={{ 
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '3px' }}>Senha</div>
                  <div style={{ fontSize: '16px' }}>••••••••</div>
                </div>
                <div 
                  onClick={() => navigate('/esqueci-senha')}
                  style={{ color: '#041e42', fontSize: '14px', cursor: 'pointer' }}
                >
                  Alterar
                </div>
              </div>
            </div>
          </div>
          
          {/* Preferências */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#333', 
              marginBottom: '15px',
              fontWeight: 'bold',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee'
            }}>
              Preferências
            </h3>
            
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px' }}>Notificações</div>
                </div>
                <div 
                  onClick={toggleNotifications}
                  style={{ 
                    width: '40px',
                    height: '20px',
                    backgroundColor: notificationsEnabled ? '#4caf50' : '#ccc',
                    borderRadius: '20px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    right: notificationsEnabled ? '2px' : 'auto',
                    left: notificationsEnabled ? 'auto' : '2px',
                    top: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'left 0.3s, right 0.3s'
                  }}></div>
                </div>
              </div>
              
              <div style={{ 
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
              }}>
                <div>
                  <div style={{ fontSize: '16px' }}>Tema Escuro</div>
                </div>
                <div 
                  onClick={toggleDarkTheme}
                  style={{ 
                    width: '40px',
                    height: '20px',
                    backgroundColor: darkThemeEnabled ? '#4caf50' : '#ccc',
                    borderRadius: '20px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    right: darkThemeEnabled ? '2px' : 'auto',
                    left: darkThemeEnabled ? 'auto' : '2px',
                    top: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'left 0.3s, right 0.3s'
                  }}></div>
                </div>
              </div>
              
              <div style={{ 
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px' }}>Idioma</div>
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Português
                </div>
              </div>
            </div>
          </div>
          
          {/* Estatísticas dinâmicas */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#333', 
              marginBottom: '15px',
              fontWeight: 'bold',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee'
            }}>
              Estatísticas
            </h3>
            
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '15px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #fc6c5f',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#041e42', fontSize: '24px', fontWeight: 'bold' }}>{userStats.gruposAtivos}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Grupos Ativos</div>
                </div>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#fc6c5f', fontSize: '24px', fontWeight: 'bold' }}>{userStats.participacoes}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Participações</div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div style={{ marginBottom: '80px' }}>
            <button 
              onClick={() => navigate('/teatros')}
              style={{
                backgroundColor: '#041e42',
                color: 'white',
                padding: '12px 0',
                borderRadius: '8px',
                border: 'none',
                width: '100%',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                cursor: 'pointer'
              }}
            >
              Meus Grupos
            </button>
            
            <button 
              onClick={handleLogout}
              style={{
                backgroundColor: 'white',
                color: '#fc6c5f',
                padding: '12px 0',
                borderRadius: '8px',
                border: '1px solid #fc6c5f',
                width: '100%',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
      <BottomNav currentPath="/perfil" />
    </div>
  );
}

// Componente de calendário interativo para a página de Eventos
function SimpleCalendarInteractive({ 
  onSelectDate, 
  ensaioDates = [], 
  apresentacaoDates = [] 
}: { 
  onSelectDate: (date: Date) => void, 
  ensaioDates?: Date[], 
  apresentacaoDates?: Date[] 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Funções de navegação do calendário
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  // Formatar o nome do mês e ano
  const getMonthYearString = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Obter dias da semana
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  // Gerar array com os dias do mês atual
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const firstDayOfWeek = firstDay.getDay();
    
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Adicionar dias do mês anterior
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: prevMonthLastDay - firstDayOfWeek + i + 1,
        currentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - firstDayOfWeek + i + 1)
      });
    }
    
    // Adicionar dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Adicionar dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length; // 6 semanas x 7 dias = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };
  
  // Verificar se uma data é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Verificar se uma data está selecionada
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Verificar se uma data tem ensaio
  const hasEnsaio = (date: Date) => {
    return ensaioDates.some(ensaioDate => 
      ensaioDate.getDate() === date.getDate() &&
      ensaioDate.getMonth() === date.getMonth() &&
      ensaioDate.getFullYear() === date.getFullYear()
    );
  };
  
  // Verificar se uma data tem apresentação
  const hasApresentacao = (date: Date) => {
    return apresentacaoDates.some(apresentacaoDate => 
      apresentacaoDate.getDate() === date.getDate() &&
      apresentacaoDate.getMonth() === date.getMonth() &&
      apresentacaoDate.getFullYear() === date.getFullYear()
    );
  };
  
  // Manipulador de clique em uma data
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onSelectDate(date);
  };
  
  // Organizar os dias em semanas para o layout da grade
  const chunks = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };
  
  const daysArray = getDaysInMonth();
  const weeksArray = chunks(daysArray, 7);
  
  return (
    <div style={{ 
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '15px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '100%'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <button 
            onClick={goToPreviousMonth}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px 10px',
              color: '#888'
            }}
          >
            ←
          </button>
          
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            textTransform: 'capitalize',
            color: '#333'
          }}>
            {getMonthYearString(currentDate)}
          </div>
          
          <button 
            onClick={goToNextMonth}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px 10px',
              color: '#888'
            }}
          >
            →
          </button>
        </div>
        
        {/* Legenda minimalista */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          marginTop: '5px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              border: '1px solid #888',
              backgroundColor: '#f0f0f0'
            }}></div>
            <span style={{ color: '#888' }}>Ensaio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#fc6c5f' 
            }}></div>
            <span style={{ color: '#888' }}>Apresentação</span>
          </div>
        </div>
      </div>
      
      {/* Dias da semana */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
        marginBottom: '10px'
      }}>
        {daysOfWeek.map(day => (
          <div 
            key={day}
            style={{ 
              textAlign: 'center', 
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#aaa',
              padding: '5px 0'
            }}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Grade dos dias */}
      {weeksArray.map((week, weekIndex) => (
        <div 
          key={weekIndex}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '5px',
            marginBottom: '5px'
          }}
        >
          {week.map((day, dayIndex) => {
            const isApresentacao = day.currentMonth && hasApresentacao(day.date);
            const isEnsaio = day.currentMonth && hasEnsaio(day.date);
            
            return (
              <div 
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => day.currentMonth && handleDateClick(day.date)}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: day.currentMonth ? 'pointer' : 'default',
                  backgroundColor: isSelected(day.date) ? '#f8f8f8' : 'transparent',
                  color: !day.currentMonth ? '#ddd' : 
                        isSelected(day.date) ? '#333' : 
                        isToday(day.date) ? '#fc6c5f' : '#555',
                  fontWeight: isToday(day.date) || isSelected(day.date) ? 'bold' : 'normal',
                  position: 'relative',
                  border: isSelected(day.date) ? '1px solid #ddd' : 'none'
                }}
              >
                {day.day}
                
                {/* Indicador minimalista para eventos */}
                {day.currentMonth && (
                  <div style={{
                    position: 'absolute',
                    bottom: '3px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '3px'
                  }}>
                    {isEnsaio && (
                      <div style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        border: '1px solid #888',
                        backgroundColor: isSelected(day.date) ? '#888' : '#f0f0f0'
                      }}></div>
                    )}
                    {isApresentacao && (
                      <div style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        backgroundColor: '#fc6c5f' 
                      }}></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}