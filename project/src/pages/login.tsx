import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário já está autenticado ao carregar o componente
  useEffect(() => {
    if (user) {
      console.log('Usuário já autenticado, redirecionando para home');
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      // Navegação é feita no useEffect quando user for atualizado
    } catch (error) {
      console.error('Erro no login:', error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try { 
      console.log("Iniciando login com Google a partir do botão");
      await loginWithGoogle();
      // Navegação é feita no useEffect quando user for atualizado
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center' as const,
        marginBottom: '30px',
        marginTop: '20px'
      }}>
        ServeFirst
      </h1>
      
      <div>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User554125"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            boxSizing: 'border-box' as const,
            backgroundColor: '#ff7f7f',
            opacity: 0.5
          }}
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••••••••••••"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            boxSizing: 'border-box' as const,
            backgroundColor: '#ff7f7f',
            opacity: 0.5
          }}
        />
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <Link 
          to="/esqueci-senha" 
          style={{
            color: '#0000EE',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Esqueceu a senha?
        </Link>
        
        <button 
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: '#ff7f7f',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Entrar <span style={{marginLeft: '5px'}}>→</span>
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '20px 0',
        color: '#777'
      }}>
        <div style={{
          flex: 1,
          height: '1px',
          backgroundColor: '#ccc'
        }}></div>
        <span style={{padding: '0 10px'}}>ou</span>
        <div style={{
          flex: 1,
          height: '1px',
          backgroundColor: '#ccc'
        }}></div>
      </div>
      
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          color: '#444',
          border: '1px solid #ddd',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" style={{marginRight: '10px'}}>
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Entrar com Google
      </button>
      
      <div style={{
        textAlign: 'center' as const,
        fontSize: '14px',
        color: '#555'
      }}>
        Não tem uma conta ainda?{' '}
        <Link to="/cadastro" style={{
          color: '#0000EE',
          textDecoration: 'underline'
        }}>
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}