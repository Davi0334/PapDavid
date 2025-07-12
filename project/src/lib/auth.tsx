import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
  sendPasswordResetEmail,
  getAuth
} from 'firebase/auth';
import { auth, db } from './firebase-prod';
import { toast } from 'sonner';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to check if we're on a network environment vs localhost
export const isNetworkEnvironment = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return !(hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.'));
};

console.log("Loading auth.tsx | Network environment:", isNetworkEnvironment());

type UserRole = 'user' | 'admin';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  login: (email: string, password: string, callback?: () => void) => Promise<void>;
  register: (email: string, password: string, callback?: () => void) => Promise<User>;
  loginWithGoogle: (callback?: () => void) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setRole: (role: string) => void;
  isAdmin: boolean;
  profile: any;
  refreshAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  login: async () => {},
  register: async () => {
    throw new Error('Not implemented');
  },
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  setRole: () => {},
  isAdmin: false,
  profile: null,
  refreshAdminStatus: async () => false,
});

type AuthProviderProps = {
  children: ReactNode;
  onError?: (error: Error) => void;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onError }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const auth = getAuth();

  // Função para verificar conectividade
  const checkConnectivity = () => {
    return navigator.onLine;
  };

  // Listener para alterações na conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log("Aplicativo está online");
      setIsOfflineMode(false);
    };

    const handleOffline = () => {
      console.log("Aplicativo está offline");
      setIsOfflineMode(true);
      if (onError) {
        onError(new Error("Aplicativo está offline. Algumas funcionalidades podem não estar disponíveis."));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status inicial
    if (!checkConnectivity()) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onError]);

  // Função para buscar o papel do usuário no Firestore
  const fetchUserRole = async (uid: string) => {
    // Se estiver em modo offline, retornar papel padrão
    if (isOfflineMode) {
      console.log("Em modo offline, usando papel de usuário padrão");
      setUserRole('user');
      setIsAdmin(false);
      return 'user';
    }

    try {
      const userRef = doc(db, 'users', uid);
      
      try {
        console.log('Buscando documento do usuário no Firestore:', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log("Dados do usuário:", userData);
          console.log("Role do usuário:", userData.role);
          setUserRole(userData.role || 'user');
          const isAdminUser = userData.role === 'admin';
          setIsAdmin(isAdminUser);
          console.log("É admin:", isAdminUser, "baseado em role =", userData.role);
          console.log("isAdmin foi definido como:", isAdminUser);
          
          // Verificar o valor imediatamente após a atualização
          setTimeout(() => {
            console.log("Verificando isAdmin após timeout:", isAdmin);
          }, 0);
          
          return userData.role || 'user';
        } else {
          // Se o documento do usuário não existir, cria um com papel padrão 'user'
          try {
            await setDoc(userRef, { 
              role: 'user', 
              email: user?.email,
              createdAt: new Date()
            });
            setUserRole('user');
            setIsAdmin(false);
            console.log("Novo usuário criado com papel 'user'");
            return 'user';
          } catch (writeError: any) {
            console.error('Erro ao criar documento de usuário:', writeError);
            
            // Verificar se é um erro de permissão (403) ou erro de requisição (400)
            if (writeError.code === 'permission-denied' || 
                writeError.code === 'failed-precondition' || 
                writeError.message.includes('400') || 
                writeError.message.includes('403')) {
              console.warn("Erro de permissão ou requisição. Usando modo offline.");
              setIsOfflineMode(true);
            }
            
            // Fallback para modo offline
            setUserRole('user');
            setIsAdmin(false);
            return 'user';
          }
        }
      } catch (getError: any) {
        console.error('Erro ao ler documento de usuário:', getError);
        
        // Verificar se é um erro de permissão (403) ou erro de requisição (400)
        if (getError.code === 'permission-denied' || 
            getError.code === 'failed-precondition' || 
            getError.message.includes('400') || 
            getError.message.includes('403')) {
          console.warn("Erro de permissão ou requisição. Usando modo offline.");
          setIsOfflineMode(true);
        }
        
        // Fallback para modo offline
        setUserRole('user');
        setIsAdmin(false);
        return 'user';
      }
    } catch (error) {
      console.error('Erro ao buscar papel do usuário:', error);
      // Fallback para modo offline
      console.log("Usando modo offline devido a erro");
      setUserRole('user');
      setIsAdmin(false);
      return 'user';
    }
  };

  // Função para definir um usuário como administrador
  const setUserAsAdmin = async (email: string) => {
    try {
      // Verificar se o usuário atual é admin
      if (!isAdmin) {
        toast.error('Apenas administradores podem definir outros administradores');
        return;
      }
      
      // Buscar o usuário pelo email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Usuário não encontrado');
        return;
      }
      
      // Atualizar o papel do usuário para admin
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { 
        role: 'admin' 
      });
      
      toast.success(`Usuário ${email} definido como administrador`);
    } catch (error) {
      console.error('Erro ao definir usuário como admin:', error);
      toast.error('Erro ao definir usuário como administrador');
    }
  };

  // Effect para observar mudanças na autenticação
  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Estado de autenticação alterado:', currentUser?.email || 'nenhum usuário');
      console.log('Auth state change - isAdmin antes:', isAdmin);
      
      if (currentUser) {
        setUser(currentUser);
        
        try {
          console.log('Buscando papel do usuário para:', currentUser.uid);
          const role = await fetchUserRole(currentUser.uid);
          console.log("User role detected:", role);
          console.log("isAdmin set to:", role === 'admin');
          console.log("Estado atual após atualização - isAdmin:", isAdmin);
        } catch (error) {
          console.error('Erro ao buscar papel do usuário:', error);
          setUserRole('user');
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Erro no observador de autenticação:', error);
      if (onError) {
        onError(new Error(`Erro na autenticação: ${error.message}`));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [onError]);

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    
    const errorCode = error?.code;
    
    // Tratamento específico para erro de API key inválida
    if (errorCode === 'auth/api-key-not-valid' || error?.message?.includes('api-key-not-valid')) {
      toast.error('Erro de configuração Firebase: API key inválida. Verifique as configurações do Firebase.', { 
        duration: 6000,
        id: 'api-key-error'
      });
      console.error('Firebase API Key inválida. Por favor, verifique as configurações do projeto Firebase.');
      return;
    }
    
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        toast.error('Email ou senha incorretos');
        break;
      case 'auth/email-already-in-use':
        toast.error('Este email já está sendo utilizado');
        break;
      case 'auth/weak-password':
        toast.error('A senha deve ter pelo menos 6 caracteres');
        break;
      case 'auth/network-request-failed':
        toast.error('Falha na conexão. Verifique sua internet');
        break;
      case 'auth/invalid-email':
        toast.error('Email inválido');
        break;
      case 'auth/invalid-credential':
        toast.error('Credenciais inválidas. Verifique seu email/senha ou tente outro método de login');
        break;
      case 'auth/popup-closed-by-user':
        // O usuário fechou o popup de login - não exibir erro
        break;
      case 'auth/cancelled-popup-request':
        // Requisição de popup cancelada - não exibir erro
        break;
      case 'auth/popup-blocked':
        toast.error('O popup de login foi bloqueado pelo navegador');
        break;
      default:
        toast.error('Erro ao autenticar: ' + (error?.message || 'Tente novamente mais tarde'));
    }
    
    if (onError) {
      onError(error);
    }
  };

  const login = async (email: string, password: string, callback?: () => void) => {
    try {
      setLoading(true);
      
      // Tentar login no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login bem-sucedido:", userCredential.user.email);
      await fetchUserRole(userCredential.user.uid);
      toast.success('Login realizado com sucesso!');
      if (callback) {
        callback();
      }
      return;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, callback?: () => void): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'user',
        createdAt: new Date()
      });
      
      if (callback) {
        callback();
      }
      return userCredential.user;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const loginWithGoogle = async (callback?: () => void) => {
    const provider = new GoogleAuthProvider();
    
    // Add scopes
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      setLoading(true);
      console.log("Iniciando login com Google via popup...");
      console.log("Domínio atual:", window.location.hostname);
      
      try {
        // Primeira tentativa: usar popup
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Login com Google bem-sucedido via popup:", user.email);
        await processGoogleUser(user);
      } catch (popupError: any) {
        console.log("Popup falhou, detalhes do erro:", popupError);
        console.log("Código do erro:", popupError.code);
        console.log("Mensagem do erro:", popupError.message);
        
        // Se o popup falhar, tentar redirecionamento
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/unauthorized-domain') {
          
          console.log("Tentando login com redirecionamento...");
          // Tentar login com redirecionamento
          await signInWithRedirect(auth, provider);
          toast.info('Redirecionando para login do Google...');
          
          // O resultado será processado no useEffect que monitora auth state
          return;
        } else {
          throw popupError;
        }
      }
      
      if (callback) {
        callback();
      }
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      
      if (error.code === 'auth/popup-blocked') {
        toast.error('O popup de login foi bloqueado. Tentando redirecionamento...');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Este domínio não está autorizado para autenticação.');
        console.error('Domínio não autorizado:', window.location.hostname);
      } else if (error.code === 'auth/internal-error') {
        toast.error('Erro interno do Firebase. Tente novamente.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        handleAuthError(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para processar o usuário Google após autenticação
  const processGoogleUser = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          nome: user.displayName || 'Usuário',
          role: 'user',
          dataCriacao: serverTimestamp(),
          photoURL: user.photoURL,
          authProvider: 'google'
        });
        console.log('New user document created for:', user.email);
      } else {
        console.log('Existing user found:', user.email);
      }
      
      // Fetch user role
      await fetchUserRole(user.uid);
      toast.success('Login com Google realizado com sucesso!');
    } catch (firestoreError) {
      console.error('Error working with Firestore:', firestoreError);
      // Still consider login successful even if Firestore operations fail
      toast.success('Login realizado, mas houve um erro ao acessar seus dados');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUserRole(null);
      setIsAdmin(false);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const setRole = (role: string) => {
    setUserRole(role);
  };

  // Função para redefinir senha
  const resetPassword = async (email: string) => {
    if (isOfflineMode) {
      throw new Error("Não é possível redefinir a senha no modo offline.");
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Email de redefinição de senha enviado para:", email);
      toast.success("Email de redefinição de senha enviado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao enviar email de redefinição de senha:", error);
      handleAuthError(error);
      throw error;
    }
  };

  // Nova função para forçar a verificação do status de admin
  const refreshAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('Forçando verificação de status admin para:', user.uid);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newAdminStatus = userData.role === 'admin';
        console.log('Status admin atualizado:', newAdminStatus, 'baseado em role =', userData.role);
        
        // Atualizar o estado
        setUserRole(userData.role || 'user');
        setIsAdmin(newAdminStatus);
        
        return newAdminStatus;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar status admin:', error);
      return false;
    }
  };

  // Efeito para processar resultado do redirecionamento do Google Auth
  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        console.log("Verificando resultado do redirecionamento...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Login com Google via redirecionamento bem-sucedido:", result.user.email);
          await processGoogleUser(result.user);
          toast.success('Login com Google realizado com sucesso!');
        } else {
          console.log("Nenhum resultado de redirecionamento encontrado");
        }
      } catch (error: any) {
        console.error("Erro ao processar resultado do redirecionamento:", error);
        console.error("Código do erro:", error.code);
        console.error("Mensagem do erro:", error.message);
        
        if (error.code === 'auth/unauthorized-domain') {
          toast.error('Este domínio não está autorizado para autenticação do Google.');
          console.error('Domínio não autorizado:', window.location.hostname);
        } else {
          handleAuthError(error);
        }
      }
    };

    processRedirectResult();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      setRole,
      isAdmin,
      profile,
      refreshAdminStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);