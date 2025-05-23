import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu email.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message || 'Erro ao enviar email de redefinição. Verifique seu email.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="back-button" onClick={() => navigate('/login')}>
          ←
        </button>
        <h1 className="auth-logo">ServeFirst</h1>
      </div>
      
      <h2 className="auth-title">Recuperação de Senha</h2>
      
      {error && (
        <div className="auth-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {success ? (
        <div className="auth-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="success-message">
            <h3>Email enviado!</h3>
            <p>Enviamos instruções para redefinir sua senha para {email}. Verifique sua caixa de entrada e a pasta de spam.</p>
          </div>
          <button 
            className="auth-button"
            onClick={() => navigate('/login')}
          >
            Voltar para Login
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <div className="auth-form-description">
            Digite seu email abaixo e enviaremos instruções para redefinir sua senha.
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email"
              className="auth-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <div className="button-spinner"></div>
            ) : (
              'Enviar instruções'
            )}
          </button>
          
          <div className="auth-link">
            Lembrou sua senha? <Link to="/login">Voltar para Login</Link>
          </div>
        </form>
      )}
    </div>
  );
} 