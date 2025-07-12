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
// import './simple.css'; // Comentado para permitir estilos inline futurísticos
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
import { AlterarSenha } from './pages/alterar-senha';
import { DataServiceProvider } from './lib/data-service';
import { AuthLayout } from './layouts/auth-layout';
import { DocumentImporter } from './components/DocumentImporter';
import mammoth from 'mammoth';
import { EditarTeatro } from './pages/editar-teatro';
import { Perfil } from './pages/perfil';

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

// Componente do BottomNav Futurístico
function BottomNav({ currentPath }: { currentPath: string }) {
  const getActiveRoute = () => {
    if (currentPath === '/') return 'inicio';
    if (currentPath.startsWith('/teatro/') || currentPath === '/teatros') return 'inicio';
    if (currentPath === '/buscar') return 'buscar';
    if (currentPath === '/eventos' || currentPath.startsWith('/evento/')) return 'eventos';
    if (currentPath === '/perfil') return 'perfil';
    return 'inicio';
  };

  const activeRoute = getActiveRoute();

  const navItems = [
    { 
      id: 'inicio', 
      path: '/', 
      icon: 'Home', 
      label: 'INÍCIO',
      gradient: 'linear-gradient(135deg, #fc6c5f, #ff8a7a)',
      shadowColor: 'rgba(252, 108, 95, 0.4)'
    },
    { 
      id: 'buscar', 
      path: '/buscar', 
      icon: 'Search', 
      label: 'BUSCAR',
              gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
        shadowColor: 'rgba(255, 255, 255, 0.4)'
    },
    { 
      id: 'eventos', 
      path: '/eventos', 
      icon: 'CalendarDays', 
      label: 'EVENTOS',
              gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
        shadowColor: 'rgba(255, 255, 255, 0.4)'
    },
    { 
      id: 'perfil', 
      path: '/perfil', 
      icon: 'User', 
      label: 'PERFIL',
              gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
        shadowColor: 'rgba(255, 255, 255, 0.4)'
    }
  ];

  const getIconSvg = (iconName: string, isActive: boolean) => {
    const strokeWidth = isActive ? 2.5 : 2;
    const color = isActive ? '#fc6c5f' : '#6b7280';
    const fillColor = isActive ? '#fc6c5f' : 'none';
    
    switch(iconName) {
      case 'Home':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill={isActive ? 'rgba(252, 108, 95, 0.1)' : 'none'}
            />
          </svg>
        );
      case 'Search':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle 
              cx="11" 
              cy="11" 
              r="8" 
              stroke={color} 
              strokeWidth={strokeWidth}
              fill={isActive ? 'rgba(252, 108, 95, 0.1)' : 'none'}
            />
            <path 
              d="M21 21L16.65 16.65" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'CalendarDays':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect 
              x="3" 
              y="4" 
              width="18" 
              height="18" 
              rx="2" 
              ry="2" 
              stroke={color} 
              strokeWidth={strokeWidth}
              fill={isActive ? 'rgba(252, 108, 95, 0.1)' : 'none'}
            />
            <line 
              x1="16" 
              y1="2" 
              x2="16" 
              y2="6" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round"
            />
            <line 
              x1="8" 
              y1="2" 
              x2="8" 
              y2="6" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round"
            />
            <line 
              x1="3" 
              y1="10" 
              x2="21" 
              y2="10" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round"
            />
          </svg>
        );
      case 'User':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <circle 
              cx="12" 
              cy="7" 
              r="4" 
              stroke={color} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill={isActive ? 'rgba(252, 108, 95, 0.1)' : 'none'}
            />
          </svg>
        );
      default:
        return null;
    }
  };
  
    return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      backgroundColor: 'white', 
      padding: '10px 0', 
      borderTop: '1px solid #e0e0e0', 
      zIndex: 10, 
      maxWidth: '430px', 
      margin: '0 auto', 
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' 
    }}>
      <Link 
        to="/" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          flex: 1,
          padding: '6px 0',
          color: activeRoute === 'inicio' ? '#fc6c5f' : '#6b7280',
          fontSize: '0.7rem',
          fontWeight: activeRoute === 'inicio' ? '600' : '500'
        }}
      >
        <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getIconSvg('Home', activeRoute === 'inicio')}
        </div>
        <span>INÍCIO</span>
      </Link>
      
      <Link 
        to="/buscar" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          flex: 1,
          padding: '6px 0',
          color: activeRoute === 'buscar' ? '#fc6c5f' : '#6b7280',
          fontSize: '0.7rem',
          fontWeight: activeRoute === 'buscar' ? '600' : '500'
        }}
      >
        <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getIconSvg('Search', activeRoute === 'buscar')}
        </div>
        <span>BUSCAR</span>
      </Link>
      
      <Link 
        to="/eventos" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          flex: 1,
          padding: '6px 0',
          color: activeRoute === 'eventos' ? '#fc6c5f' : '#6b7280',
          fontSize: '0.7rem',
          fontWeight: activeRoute === 'eventos' ? '600' : '500'
        }}
      >
        <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getIconSvg('CalendarDays', activeRoute === 'eventos')}
        </div>
        <span>EVENTOS</span>
      </Link>
      
      <Link 
        to="/perfil" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textDecoration: 'none',
          flex: 1,
          padding: '6px 0',
          color: activeRoute === 'perfil' ? '#fc6c5f' : '#6b7280',
          fontSize: '0.7rem',
          fontWeight: activeRoute === 'perfil' ? '600' : '500'
        }}
      >
        <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getIconSvg('User', activeRoute === 'perfil')}
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
  
  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '430px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '60px 24px 32px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fc6c5f 0%, #ff8a65 100%)',
          color: 'white'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white'
            }}>S</span>
          </div>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 8px'
          }}>
            ServeFirst
          </h1>
          
          <p style={{
            fontSize: '16px',
            opacity: 0.9,
            margin: 0,
            fontWeight: '400'
          }}>
            Gestão Teatral Profissional
          </p>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1,
          padding: '32px 24px 100px'
        }}>
          {/* Quick Actions */}
          <div style={{
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 20px'
            }}>
              Acesso Rápido
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <button 
                onClick={() => navigate('/eventos')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '12px',
                  opacity: 0.8
                }}>📅</div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  textAlign: 'center',
                  color: '#333'
                }}>
                  Eventos
                </span>
              </button>

              <button 
                onClick={() => navigate('/buscar')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ 
                  fontSize: '32px', 
                  marginBottom: '12px',
                  opacity: 0.8
                }}>🔍</div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  textAlign: 'center',
                  color: '#333'
                }}>
                  Buscar
                </span>
              </button>
            </div>
          </div>

          {/* Meus Teatros */}
          <div style={{
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 20px'
            }}>
              Meus Teatros
            </h2>
            
            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '40px 0',
                color: '#666'
              }}>
                Carregando teatros...
              </div>
            ) : error ? (
              <div style={{
                padding: '24px',
                background: '#fee',
                borderRadius: '8px',
                border: '1px solid #fcc',
                textAlign: 'center'
              }}>
                <p style={{ color: '#c33', margin: '0 0 16px' }}>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#fc6c5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : teatros.length === 0 ? (
              <div style={{
                padding: '40px 24px',
                background: '#f8f9fa',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎭</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333',
                  margin: '0 0 8px'
                }}>
                  Nenhum teatro ainda
                </h3>
                <p style={{
                  color: '#666',
                  margin: '0 0 20px',
                  fontSize: '14px'
                }}>
                  Você ainda não participa de nenhum teatro. {isAdmin ? 'Crie um novo projeto ou ' : ''}Entre em um teatro para começar!
                </p>
                {isAdmin && (
                  <button 
                    onClick={() => navigate('/criar-teatro')}
                    style={{
                      background: '#fc6c5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Criar Novo Teatro
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {teatros.map((teatro) => (
                  <div 
                    key={teatro.id}
                    onClick={() => navigate(`/teatro/${teatro.id}`)}
                    style={{
                      padding: '16px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#333',
                        margin: 0,
                        flex: 1
                      }}>
                        {teatro.titulo}
                      </h3>
                      {(teatro.temAlerta || (teatro.avisoAtivo && teatro.aviso)) && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #fc6c5f, #ff8a80)',
                          marginLeft: '8px',
                          marginTop: '4px'
                        }} />
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      <span>👥 {teatro.participantes?.length || 0} pessoas</span>
                      <span>📅 {teatro.diasEnsaio?.join(', ') || 'Não definido'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 16px'
            }}>
              Resumo
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#fc6c5f',
                  marginBottom: '4px'
                }}>
                  {loading ? '-' : teatros.length}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Teatros Ativos
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#fc6c5f',
                  marginBottom: '4px'
                }}>
                  0
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Eventos Agendados
                </div>
              </div>
            </div>
          </div>
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
  const { user, isAdmin } = useAuth();
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
  
  const compartilharTeatro = async () => {
    if (!teatro || !teatro.id) return;
    try {
      await navigator.clipboard.writeText(teatro.id);
      alert(`ID "${teatro.id}" copiado para a área de transferência! Compartilhe este ID com outros participantes para que eles possam acessar este teatro.`);
      console.log('ID compartilhado:', teatro.id);
    } catch (err) {
      // Fallback manual
      try {
        const tempInput = document.createElement('input');
        tempInput.value = teatro.id;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert(`ID "${teatro.id}" copiado para a área de transferência!`);
      } catch (fallbackErr) {
        console.error('Erro ao copiar ID:');
        alert(`ID do teatro: ${teatro.id}\nNão foi possível copiar automaticamente. Por favor, copie manualmente.`);
      }
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
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        paddingBottom: '120px'
      }}>
        <div style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 2000,
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#374151'
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Carregando...
          </h1>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #fc6c5f',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Carregando informações do teatro...
          </p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        paddingBottom: '120px'
      }}>
        <div style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 2000,
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#374151'
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Erro
          </h1>
        </div>
        
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '32px 24px'
          }}>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #ef4444',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
            <button 
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: '#fc6c5f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!teatro) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        paddingBottom: '120px'
      }}>
        <div style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          zIndex: 2000,
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#374151'
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Teatro
          </h1>
        </div>
        
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '32px 24px'
          }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Nenhuma informação disponível para este teatro.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      paddingBottom: '120px'
    }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 2000,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#374151'
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1f2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {teatro.titulo}
          </h1>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Teatro • {formatDate(teatro.dataApresentacao)}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Navigation Tabs */}
        <div style={{ 
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '20px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex' }}>
            {[
              { key: 'principal', label: 'Principal', icon: '🏠' },
              { key: 'roteiro', label: 'Roteiro', icon: '📜' },
              { key: 'cenario', label: 'Cenário', icon: '🎭' },
              { key: 'figurino', label: 'Figurino', icon: '👔' },
              { key: 'participantes', label: 'Equipe', icon: '👥' }
            ].map((tab) => (
              <div 
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)} 
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '12px 8px', 
                  backgroundColor: activeTab === tab.key ? '#fc6c5f' : 'white',
                  color: activeTab === tab.key ? 'white' : '#6b7280',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: activeTab === tab.key ? '3px solid #fc6c5f' : '3px solid transparent'
                }}
              >
                <div style={{ marginBottom: '4px', fontSize: '16px' }}>{tab.icon}</div>
                <div>{tab.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Avisos */}
        {teatro.avisoAtivo && teatro.aviso && (
          <div style={{ 
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderLeft: '4px solid #f59e0b',
            padding: '16px', 
            marginBottom: '20px',
            borderRadius: '8px'
          }}>
            <h3 style={{ 
              color: '#92400e', 
              marginBottom: '8px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px'
            }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>⚠️</span>
              Aviso Importante
            </h3>
            <p style={{ 
              color: '#92400e', 
              wordBreak: 'break-word', 
              margin: '0', 
              lineHeight: '1.5',
              fontSize: '14px'
            }}>
              {teatro.aviso}
            </p>
          </div>
        )}
        
        {/* Alertas */}
        {teatro.temAlerta && (
          <div style={{ 
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderLeft: '4px solid #ef4444',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              color: '#991b1b', 
              margin: 0, 
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>🚨</span>
              {teatro.mensagemAlerta || 'Este teatro possui um alerta importante!'}
            </p>
          </div>
        )}
          
        {/* Content Sections */}
        {activeTab === 'principal' && (
          <div>
            {/* Basic Information */}
            <div style={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              padding: '24px', 
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '10px' }}>📋</span>
                Informações Gerais
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ 
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    ID do Teatro
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', wordBreak: 'break-all', fontSize: '14px' }}>
                    {teatro.id}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    Data de Apresentação
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    {formatDate(teatro.dataApresentacao)}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    Local
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    {teatro.local || 'Não definido'}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                    Dias de Ensaio
                  </p>
                  <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                    {teatro.diasEnsaio?.join(', ') || 'Não definidos'}
                  </p>
                </div>
                
                {teatro.descricao && (
                  <div style={{ 
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    padding: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                      Descrição
                    </p>
                    <p style={{ margin: '0', color: '#1f2937', fontWeight: '500', lineHeight: '1.5', fontSize: '14px' }}>
                      {teatro.descricao}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Statistics */}
            <div style={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              padding: '24px', 
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '10px' }}>📊</span>
                Estatísticas
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ 
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #fbbf24',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#d97706', marginBottom: '8px' }}>
                    {teatro.quantidadeCenas || '0'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '500' }}>
                    Cenas
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #3b82f6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1d4ed8', marginBottom: '8px' }}>
                    {teatro.numeroAtos || '0'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>
                    Atos
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f3e8ff',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #8b5cf6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#7c3aed', marginBottom: '8px' }}>
                    {teatro.quantidadeAtores || '0'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b46c1', fontWeight: '500' }}>
                    Atores
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #fc6c5f',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#fc6c5f', marginBottom: '8px' }}>
                    {teatro.participantes?.length || '0'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                    Participantes
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'grid', gap: '12px' }}>
              <button 
                onClick={compartilharTeatro}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>📋</span>
                Compartilhar ID
              </button>
              
              {isCreator && (
                <button 
                  onClick={() => navigate(`/editar-teatro/${teatro.id}`)}
                  style={{
                    backgroundColor: '#fc6c5f',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>✏️</span>
                  Editar Teatro
                </button>
              )}
              
              {user && !isCreator && !isParticipating && (
                <button 
                  onClick={entrarNoTeatro}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🎭</span>
                  Participar deste Teatro
                </button>
              )}
              
              {user && !isCreator && isParticipating && (
                <div style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #16a34a',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <span>✅</span>
                  Você é participante deste teatro
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Script Tab */}
        {activeTab === 'roteiro' && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '24px', 
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '10px' }}>📜</span>
              Roteiro
            </h3>
            
            <div style={{ 
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                Número de Atos
              </p>
              <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                {teatro.numeroAtos || '0'}
              </p>
            </div>
            
            {teatro.roteiro ? (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '20px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#1f2937',
                lineHeight: '1.6',
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '14px'
              }}>
                {teatro.roteiro}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '40px 20px', 
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
                <p style={{ margin: '0', fontSize: '16px' }}>Nenhum roteiro definido para este teatro.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Scenario Tab */}
        {activeTab === 'cenario' && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '24px', 
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '10px' }}>🎭</span>
              Cenário
            </h3>
            
            <div style={{ 
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
                Quantidade de Cenas
              </p>
              <p style={{ margin: '0', color: '#1f2937', fontWeight: '600', fontSize: '14px' }}>
                {teatro.quantidadeCenas || '0'}
              </p>
            </div>
            
            {teatro.cenario ? (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '20px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#1f2937',
                lineHeight: '1.6',
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '14px'
              }}>
                {teatro.cenario}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '40px 20px', 
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎨</div>
                <p style={{ margin: '0', fontSize: '16px' }}>Nenhum cenário definido para este teatro.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Costume Tab */}
        {activeTab === 'figurino' && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '24px', 
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '10px' }}>👔</span>
              Figurino
            </h3>
            
            {teatro.figurino ? (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '20px', 
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#1f2937',
                lineHeight: '1.6',
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '14px'
              }}>
                {teatro.figurino}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '40px 20px', 
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👔</div>
                <p style={{ margin: '0', fontSize: '16px' }}>Nenhum figurino definido para este teatro.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Team Tab */}
        {activeTab === 'participantes' && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '24px', 
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '10px' }}>👥</span>
              Participantes
            </h3>
            
            {showParticipantsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #fc6c5f',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Carregando participantes...</p>
              </div>
            ) : participantesInfo.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {participantesInfo.map((participante) => (
                  <div key={participante.id} style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <p style={{ margin: '0', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                        {participante.nome}
                      </p>
                      <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                        {participante.email}
                      </p>
                    </div>
                    {isCreator && (
                      <button
                        onClick={() => handleRemoveParticipante(participante.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
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
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                padding: '40px 20px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                <p style={{ margin: '0', fontSize: '16px' }}>Nenhum participante ainda.</p>
              </div>
            )}
            
            {isCreator && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="Email do participante"
                    value={emailConvite}
                    onChange={(e) => setEmailConvite(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={handleConvidarParticipante}
                    disabled={!emailConvite || saving}
                    style={{
                      backgroundColor: emailConvite && !saving ? '#fc6c5f' : '#e5e7eb',
                      color: emailConvite && !saving ? 'white' : '#6b7280',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: emailConvite && !saving ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Convidar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <BottomNav currentPath="/teatros" />
    </div>
  );
}


// Componente para criar teatro com fluxo em etapas

// Componente para criar teatro com fluxo em etapas
function CriarTeatro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dataService = useDataService();
  
  const [etapa, setEtapa] = useState(1);
  const [teatroId, setTeatroId] = useState('');
  
  // Dados do teatro
  const [titulo, setTitulo] = useState('');
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];
  const [diasEnsaio, setDiasEnsaio] = useState<string[]>([]);
  const [dataApresentacao, setDataApresentacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidadeCenas, setQuantidadeCenas] = useState('0');
  const [cenario, setCenario] = useState('');
  const [quantidadeAtores, setQuantidadeAtores] = useState('0');
  const [figurino, setFigurino] = useState('');
  const [quantidadeAtos, setQuantidadeAtos] = useState('0');
  const [roteiro, setRoteiro] = useState('');
  const [emailParticipante, setEmailParticipante] = useState('');
  const [local, setLocal] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importTarget, setImportTarget] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  
  const handleImportClick = (targetField: string) => {
    setImportTarget(targetField);
    fileInput.current?.click();
  };
  
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
        if (!diasEnsaio || diasEnsaio.length === 0) {
          setError('Por favor, selecione pelo menos um dia de ensaio.');
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
        diasEnsaio: diasEnsaio,
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
          <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{ 
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              zIndex: 2000,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button 
                onClick={() => navigate(-1)}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Criar Grupo
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Etapa 1 de 5 - Informações Básicas
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 20px'
            }}>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '20%',
                  height: '100%',
                  backgroundColor: '#fc6c5f',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Título do Teatro
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Digite o nome do seu teatro"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Dias de Ensaio
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {diasSemana.map(dia => (
                      <button
                        type="button"
                        key={dia}
                        onClick={() => setDiasEnsaio(prev =>
                          prev.includes(dia)
                            ? prev.filter(d => d !== dia)
                            : [...prev, dia]
                        )}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: diasEnsaio.includes(dia) ? '2px solid #fc6c5f' : '1px solid #d1d5db',
                          backgroundColor: diasEnsaio.includes(dia) ? '#fc6c5f' : 'white',
                          color: diasEnsaio.includes(dia) ? 'white' : '#374151',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {dia.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Data de Apresentação
                  </label>
                  <input
                    type="date"
                    value={dataApresentacao}
                    onChange={(e) => setDataApresentacao(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Local (opcional)
                  </label>
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Local das apresentações"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>
                
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '24px'
                  }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={avancarEtapa}
                  disabled={loading || !titulo.trim()}
                  style={{
                    backgroundColor: (!titulo.trim() || loading) ? '#9ca3af' : '#fc6c5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    width: '100%',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!titulo.trim() || loading) ? 'not-allowed' : 'pointer',
                    opacity: (!titulo.trim() || loading) ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processando...' : 'Próxima Etapa'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 2: // Quantidade de Cenas, Cenário
        return (
          <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{ 
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              zIndex: 2000,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button 
                onClick={voltarEtapa}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Cenário
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Etapa 2 de 5 - Configurações do Cenário
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 20px'
            }}>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '40%',
                  height: '100%',
                  backgroundColor: '#fc6c5f',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Quantidade de Cenas
                  </label>
                  <input
                    type="number"
                    value={quantidadeCenas}
                    onChange={(e) => setQuantidadeCenas(e.target.value)}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Descrição do Cenário
                  </label>
                  <textarea
                    value={cenario}
                    onChange={(e) => setCenario(e.target.value)}
                    placeholder="Descreva os cenários da sua peça..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151',
                      resize: 'vertical',
                      minHeight: '120px'
                    }}
                  />
                </div>
                
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '24px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={avancarEtapa}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#9ca3af' : '#fc6c5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Processando...' : 'Próxima Etapa'}
                  </button>
                  
                  <button
                    onClick={handleImportClickWithEvent('cenario')}
                    disabled={importLoading}
                    style={{
                      backgroundColor: importLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: importLoading ? 'not-allowed' : 'pointer',
                      opacity: importLoading ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📄 {importLoading ? 'Importando...' : 'Importar'}
                  </button>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  textAlign: 'center'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3: // Quantidade de Atores, Figurino
        return (
          <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{ 
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              zIndex: 2000,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button 
                onClick={voltarEtapa}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Figurino
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Etapa 3 de 5 - Personagens e Figurino
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 20px'
            }}>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '60%',
                  height: '100%',
                  backgroundColor: '#fc6c5f',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Quantidade de Atores
                  </label>
                  <input
                    type="number"
                    value={quantidadeAtores}
                    onChange={(e) => setQuantidadeAtores(e.target.value)}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Descrição do Figurino
                  </label>
                  <textarea
                    value={figurino}
                    onChange={(e) => setFigurino(e.target.value)}
                    placeholder="Descreva os figurinos dos personagens..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151',
                      resize: 'vertical',
                      minHeight: '120px'
                    }}
                  />
                </div>
                
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '24px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={avancarEtapa}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#9ca3af' : '#fc6c5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Processando...' : 'Próxima Etapa'}
                  </button>
                  
                  <button
                    onClick={handleImportClickWithEvent('figurino')}
                    disabled={importLoading}
                    style={{
                      backgroundColor: importLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: importLoading ? 'not-allowed' : 'pointer',
                      opacity: importLoading ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    👔 {importLoading ? 'Importando...' : 'Importar'}
                  </button>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  textAlign: 'center'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4: // Quantidade de Atos, Roteiro
        return (
          <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{ 
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              zIndex: 2000,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button 
                onClick={voltarEtapa}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Roteiro
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Etapa 4 de 5 - História e Roteiro
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 20px'
            }}>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '80%',
                  height: '100%',
                  backgroundColor: '#fc6c5f',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Quantidade de Atos
                  </label>
                  <input
                    type="number"
                    value={quantidadeAtos}
                    onChange={(e) => setQuantidadeAtos(e.target.value)}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Roteiro Completo
                  </label>
                  <textarea
                    value={roteiro}
                    onChange={(e) => setRoteiro(e.target.value)}
                    placeholder="Digite o roteiro completo da sua peça..."
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      outline: 'none',
                      color: '#374151',
                      resize: 'vertical',
                      minHeight: '200px'
                    }}
                  />
                </div>
                
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderLeft: '4px solid #ef4444',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '24px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button
                    onClick={avancarEtapa}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#9ca3af' : '#fc6c5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Criando Teatro...' : 'Criar Teatro'}
                  </button>
                  
                  <button
                    onClick={handleImportClickWithEvent('roteiro')}
                    disabled={importLoading}
                    style={{
                      backgroundColor: importLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: importLoading ? 'not-allowed' : 'pointer',
                      opacity: importLoading ? 0.7 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📜 {importLoading ? 'Importando...' : 'Importar'}
                  </button>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  textAlign: 'center'
                }}>
                  Formatos suportados: Word (.docx) e Texto (.txt)
                </div>
              </div>
            </div>
          </div>
        );
        
      case 5: // Finalizar processo / Convidar
        return (
          <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            paddingBottom: '120px'
          }}>
            {/* Header */}
            <div style={{ 
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              zIndex: 2000,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button 
                onClick={voltarEtapa}
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#374151'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Teatro Criado!
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Etapa 5 de 5 - Finalização
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 20px'
            }}>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 20px' }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '32px 24px',
                textAlign: 'center'
              }}>
                {/* Success Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ 
                    color: 'white', 
                    fontSize: '36px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </span>
                </div>

                <h2 style={{
                  margin: '0 0 16px 0',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Teatro Criado com Sucesso!
                </h2>

                <div style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    ID do Teatro
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#374151',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}>
                    {teatroId}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  <button
                    onClick={copiarId}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    📋 Copiar ID do Teatro
                  </button>
                  
                  <button
                    onClick={avancarEtapa}
                    style={{
                      backgroundColor: '#fc6c5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Ver Detalhes do Teatro
                  </button>
                </div>

                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  💡 <strong>Dica:</strong> Compartilhe o ID do teatro com seus colegas para que possam se juntar ao grupo!
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div>
      {renderEtapa()}
      
      {/* Input de arquivo invisível para importação */}
      <input
        type="file"
        ref={fileInput}
        style={{ display: 'none' }}
        accept=".docx,.txt"
        onChange={handleFileChange}
      />
      
      {/* Navegação inferior */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.1)',
        padding: '15px 20px',
        zIndex: 2000
      }}>
        <BottomNav currentPath="/teatro" />
      </div>
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
        
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        
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
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      paddingBottom: '120px'
    }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 2000,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: '600',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          Buscar Teatro
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            marginBottom: '8px',
            textAlign: 'center',
            color: '#374151',
            fontWeight: '500'
          }}>
            Encontre um teatro pelo ID
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            textAlign: 'center',
            margin: '0 0 20px 0'
          }}>
            Digite o ID para buscar e participar de um grupo de teatro
          </p>
          
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
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                backgroundColor: 'white',
                outline: 'none',
                color: '#374151'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                position: 'absolute',
                right: '8px',
                backgroundColor: '#fc6c5f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: '16px' }}>🔍</span>
            </button>
          </div>
          
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #ef4444',
              color: '#dc2626', 
              padding: '12px',
              borderRadius: '6px',
              fontSize: '14px',
              marginTop: '12px'
            }}>
              {error}
            </div>
          )}
        </div>
        
        {loading && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #fc6c5f',
              borderRadius: '50%',
              marginBottom: '15px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p style={{ color: '#6b7280', margin: 0 }}>Buscando teatro...</p>
          </div>
        )}
        
        {showResults && !loading && !error && !teatro && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎭</div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px',
              color: '#374151',
              fontWeight: '500'
            }}>
              Nenhum teatro encontrado
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              margin: 0
            }}>
              Verifique se o ID está correto e tente novamente.
            </p>
          </div>
        )}
        
        {teatro && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#fc6c5f',
              color: 'white'
            }}>
              <h3 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {teatro.titulo}
              </h3>
              <p style={{ 
                margin: '0', 
                fontSize: '14px', 
                opacity: '0.9'
              }}>
                ID: {teatro.id}
              </p>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'grid',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Data de Apresentação
                  </p>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {formatarData(teatro.dataApresentacao)}
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Dias de Ensaio
                  </p>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {teatro.diasEnsaio?.join(', ') || 'Não definidos'}
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Participantes
                  </p>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {teatro.participantes?.length || 0} participante(s)
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleJoinTeatro}
                disabled={loading}
                style={{
                  backgroundColor: isParticipating(teatro) ? '#6b7280' : '#fc6c5f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  width: '100%',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {isParticipating(teatro) ? 'Ver Teatro' : 'Participar do Teatro'}
              </button>
            </div>
          </div>
        )}
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
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      paddingBottom: '120px'
    }}>
      {/* Header */}
      <div style={{ 
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 2000,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: '600',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          Eventos
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #fc6c5f',
              borderRadius: '50%',
              marginBottom: '15px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p style={{ color: '#6b7280', margin: 0 }}>Carregando eventos...</p>
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
            <div>
              <h2 style={{ 
                marginBottom: '16px', 
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📅</span>
                Eventos em {formatDate(selectedDate)}
              </h2>
              
              {eventos.length === 0 ? (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    Nenhum evento para esta data
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280', 
                    margin: 0
                  }}>
                    Os eventos dos seus teatros aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {eventos.map((evento, index) => (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        borderLeft: evento.tipo === 'apresentacao' ? '4px solid #fc6c5f' : '4px solid #6b7280',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => navigate(`/teatro/${evento.teatro.id}`)}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937',
                          lineHeight: '1.4'
                        }}>
                          {evento.teatro.titulo}
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          backgroundColor: evento.tipo === 'apresentacao' ? '#fc6c5f' : '#6b7280',
                          color: 'white',
                          borderRadius: '6px',
                          fontWeight: '500',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {evento.tipo === 'apresentacao' ? 'Apresentação' : 'Ensaio'}
                        </span>
                      </div>
                      
                      <p style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {evento.teatro.local ? `📍 ${evento.teatro.local}` : '📍 Local não definido'}
                      </p>
                      
                      <p style={{ 
                        margin: '0',
                        fontSize: '12px',
                        color: '#9ca3af',
                        textAlign: 'right'
                      }}>
                        Toque para ver detalhes →
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <BottomNav currentPath="/eventos" />
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
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '16px',
      marginBottom: '20px',
      width: '100%',
      maxWidth: '100%'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <button 
            onClick={goToPreviousMonth}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '8px 12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          
          <div style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            textTransform: 'capitalize',
            color: '#1f2937'
          }}>
            {getMonthYearString(currentDate)}
          </div>
          
          <button 
            onClick={goToNextMonth}
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '8px 12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            →
          </button>
        </div>
        
        {/* Legenda */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              border: '1px solid #6b7280',
              backgroundColor: '#f3f4f6'
            }}></div>
            <span style={{ color: '#6b7280', fontWeight: '500' }}>Ensaio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#fc6c5f' 
            }}></div>
            <span style={{ color: '#6b7280', fontWeight: '500' }}>Apresentação</span>
          </div>
        </div>
      </div>
      
      {/* Dias da semana */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '8px'
      }}>
        {daysOfWeek.map(day => (
          <div 
            key={day}
            style={{ 
              textAlign: 'center', 
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              padding: '8px 0'
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
            gap: '4px',
            marginBottom: '4px'
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
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  cursor: day.currentMonth ? 'pointer' : 'default',
                  backgroundColor: isSelected(day.date) ? '#fc6c5f' : 
                                 isToday(day.date) ? '#f9fafb' : 'transparent',
                  color: !day.currentMonth ? '#d1d5db' : 
                        isSelected(day.date) ? 'white' : 
                        isToday(day.date) ? '#fc6c5f' : '#374151',
                  fontWeight: isToday(day.date) || isSelected(day.date) ? '600' : '400',
                  position: 'relative',
                  border: isToday(day.date) && !isSelected(day.date) ? '1px solid #fc6c5f' : 
                         isSelected(day.date) ? 'none' : '1px solid transparent',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                {day.day}
                
                {/* Indicadores para eventos */}
                {day.currentMonth && (isEnsaio || isApresentacao) && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '2px'
                  }}>
                    {isEnsaio && (
                      <div style={{ 
                        width: '3px', 
                        height: '3px', 
                        borderRadius: '50%', 
                        backgroundColor: isSelected(day.date) ? 'white' : '#6b7280'
                      }}></div>
                    )}
                    {isApresentacao && (
                      <div style={{ 
                        width: '3px', 
                        height: '3px', 
                        borderRadius: '50%', 
                        backgroundColor: isSelected(day.date) ? 'white' : '#fc6c5f'
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