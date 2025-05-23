import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não correspondem.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await register(email, password, () => {
        navigate('/');
      });
    } catch (err: any) {
      console.error('Erro de cadastro:', err);
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(() => {
        navigate('/');
      });
    } catch (err: any) {
      console.error('Erro de login com Google:', err);
      setError(err.message || 'Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <h1 className="auth-logo">ServeFirst</h1>
      
      {error && <div className="error-container">{error}</div>}
      
      <form className="auth-form" onSubmit={handleRegister}>
        <input
          type="email"
          className="auth-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <input
          type="password"
          className="auth-input"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <input
          type="password"
          className="auth-input"
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          Criar Conta
        </button>
      </form>
      
      <div className="auth-divider">
        <span className="auth-divider-text">ou utilize o google</span>
      </div>
      
      <button 
        className="auth-button-google"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <span className="auth-google-icon">G</span>
        Google
      </button>
      
      <div className="auth-link">
        Já possui uma conta?
        <Link to="/login">Entrar</Link>
      </div>
    </div>
  );
} 