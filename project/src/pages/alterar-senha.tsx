import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Mail, Check, AlertCircle } from 'lucide-react';

export function AlterarSenha() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'email' | 'success'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu email.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      
      toast.success('Link enviado! Verifique sua caixa de entrada.');
      setStep('success');
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      let errorMessage = 'Erro ao enviar email. Tente novamente.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Email não encontrado. Verifique o endereço digitado.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido. Verifique o formato.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
          Alterar Senha
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Digite seu email para receber um link de redefinição de senha
        </p>
      </div>

      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSendResetEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <Mail style={{ width: '20px', height: '20px' }} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '12px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#fc6c5f';
                e.target.style.boxShadow = '0 0 0 3px rgba(252, 108, 95, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading || !email ? '#d1d5db' : '#fc6c5f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading || !email ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : (
            <>
              <Mail style={{ width: '20px', height: '20px' }} />
              Enviar Link
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Check style={{ width: '40px', height: '40px', color: '#16a34a' }} />
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
          Link Enviado!
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 16px 0' }}>
          Enviamos um link para redefinir sua senha para:
        </p>
        <p style={{ color: '#fc6c5f', fontSize: '1rem', fontWeight: '500', margin: '0 0 16px 0' }}>
          {email}
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Verifique sua caixa de entrada e a pasta de spam. Clique no link recebido para definir sua nova senha.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => setStep('email')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
        >
          Enviar Novamente
        </button>
        
        <button
          onClick={() => navigate('/perfil')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#fc6c5f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e55a4b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fc6c5f';
          }}
        >
          Voltar ao Perfil
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', paddingBottom: '80px' }}>
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#fc6c5f', paddingTop: '48px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/perfil')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <ArrowLeft style={{ width: '20px', height: '20px', color: 'white' }} />
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Alterar Senha</h1>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', padding: '24px' }}>
          {step === 'email' ? renderEmailStep() : renderSuccessStep()}
        </div>
      </div>
      
      {/* Barra de navegação inferior */}
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
            color: isActive('/') ? '#000' : '#333',
            fontSize: '0.7rem',
            fontWeight: isActive('/') ? '600' : '500'
          }}
        >
          <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth={isActive('/') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
            color: isActive('/buscar') ? '#000' : '#333',
            fontSize: '0.7rem',
            fontWeight: isActive('/buscar') ? '600' : '500'
          }}
        >
          <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={isActive('/buscar') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth={isActive('/buscar') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
            color: isActive('/eventos') ? '#000' : '#333',
            fontSize: '0.7rem',
            fontWeight: isActive('/eventos') ? '600' : '500'
          }}
        >
          <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth={isActive('/eventos') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V4" stroke="currentColor" strokeWidth={isActive('/eventos') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V4" stroke="currentColor" strokeWidth={isActive('/eventos') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth={isActive('/eventos') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth={isActive('/eventos') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
            color: isActive('/perfil') ? '#000' : '#333',
            fontSize: '0.7rem',
            fontWeight: isActive('/perfil') ? '600' : '500'
          }}
        >
          <div style={{ marginBottom: '6px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth={isActive('/perfil') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth={isActive('/perfil') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>PERFIL</span>
        </Link>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
} 