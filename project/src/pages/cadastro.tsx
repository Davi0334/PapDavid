import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Mail, Lock, UserPlus, Loader2, AlertCircle, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

export function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      toast.error('Por favor, preencha todos os campos.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não correspondem.');
      toast.error('As senhas não correspondem.');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await register(email, password, () => {
        toast.success('Conta criada com sucesso!');
        navigate('/');
      });
    } catch (err: any) {
      console.error('Erro de cadastro:', err);
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está sendo usado por outra conta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido. Verifique o formato.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          break;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(() => {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      });
    } catch (err: any) {
      console.error('Erro de login com Google:', err);
      let errorMessage = 'Erro ao fazer login com Google.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado pelo usuário.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pass: string) => {
    const requirements = [
      { test: pass.length >= 6, text: 'Mínimo 6 caracteres' },
      { test: /[A-Z]/.test(pass), text: 'Uma letra maiúscula' },
      { test: /[0-9]/.test(pass), text: 'Um número' }
    ];
    return requirements;
  };

  const passwordRequirements = validatePassword(password);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fc6c5f 0%, #ff8a80 25%, #ffffff 50%, #fc6c5f 75%, #e55a4b 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientFlow 8s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Elementos decorativos de fundo */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, rgba(252, 108, 95, 0.1), rgba(255, 255, 255, 0.1))',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(252, 108, 95, 0.1))',
        filter: 'blur(30px)',
        animation: 'float 8s ease-in-out infinite reverse'
      }}></div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative'
      }}>
        {/* Container principal com glassmorphism */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>


          {/* Logo e cabeçalho */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #fc6c5f, #e55a4b)',
              borderRadius: '20px',
              marginBottom: '16px',
              boxShadow: '0 10px 30px rgba(252, 108, 95, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <UserPlus style={{ width: '40px', height: '40px', color: 'white' }} />
            </div>
            
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #fc6c5f, #e55a4b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              ServeFirst
            </h1>
            
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              margin: 0
            }}>
              Crie sua conta e comece sua jornada
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              borderRadius: '12px',
              marginBottom: '24px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} />
              <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Campo Email */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: focusedField === 'email' ? '#fc6c5f' : '#374151',
                marginBottom: '8px',
                transition: 'color 0.2s ease'
              }}>
                Email
              </label>
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusedField === 'email' ? '#fc6c5f' : '#9ca3af',
                  transition: 'color 0.2s ease'
                }}>
                  <Mail style={{ width: '20px', height: '20px' }} />
                </div>
                
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  placeholder="seu.email@exemplo.com"
                  style={{
                    width: '100%',
                    paddingLeft: '52px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: focusedField === 'email' ? '2px solid #fc6c5f' : '2px solid #e5e7eb',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(252, 108, 95, 0.1)' : 'none'
                  }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: focusedField === 'password' ? '#fc6c5f' : '#374151',
                marginBottom: '8px',
                transition: 'color 0.2s ease'
              }}>
                Senha
              </label>
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusedField === 'password' ? '#fc6c5f' : '#9ca3af',
                  transition: 'color 0.2s ease'
                }}>
                  <Lock style={{ width: '20px', height: '20px' }} />
                </div>
                
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Crie uma senha segura"
                  style={{
                    width: '100%',
                    paddingLeft: '52px',
                    paddingRight: '52px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: focusedField === 'password' ? '2px solid #fc6c5f' : '2px solid #e5e7eb',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(252, 108, 95, 0.1)' : 'none'
                  }}
                  disabled={loading}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fc6c5f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
              
              {/* Indicadores de força da senha */}
              {password && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'rgba(252, 108, 95, 0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {passwordRequirements.map((req, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: req.test ? '#10b981' : '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s ease'
                        }}>
                          {req.test && <Check style={{ width: '10px', height: '10px', color: 'white' }} />}
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          color: req.test ? '#10b981' : '#6b7280',
                          transition: 'color 0.2s ease'
                        }}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: focusedField === 'confirmPassword' ? '#fc6c5f' : '#374151',
                marginBottom: '8px',
                transition: 'color 0.2s ease'
              }}>
                Confirmar Senha
              </label>
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusedField === 'confirmPassword' ? '#fc6c5f' : '#9ca3af',
                  transition: 'color 0.2s ease'
                }}>
                  <Lock style={{ width: '20px', height: '20px' }} />
                </div>
                
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Repita sua senha"
                  style={{
                    width: '100%',
                    paddingLeft: '52px',
                    paddingRight: '52px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: focusedField === 'confirmPassword' ? '2px solid #fc6c5f' : 
                           (confirmPassword && password !== confirmPassword) ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: focusedField === 'confirmPassword' ? '0 0 0 4px rgba(252, 108, 95, 0.1)' : 'none'
                  }}
                  disabled={loading}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fc6c5f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
              
              {/* Validação de confirmação de senha */}
              {confirmPassword && password !== confirmPassword && (
                <div style={{
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  fontSize: '0.75rem'
                }}>
                  <AlertCircle style={{ width: '14px', height: '14px' }} />
                  As senhas não correspondem
                </div>
              )}
            </div>

            {/* Botão de cadastro */}
            <button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                background: loading || !email || !password || !confirmPassword || password !== confirmPassword 
                  ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' 
                  : 'linear-gradient(135deg, #fc6c5f, #e55a4b)',
                color: 'white',
                cursor: loading || !email || !password || !confirmPassword || password !== confirmPassword ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading || !email || !password || !confirmPassword || password !== confirmPassword 
                  ? 'none' 
                  : '0 10px 30px rgba(252, 108, 95, 0.3)',
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                if (!loading && email && password && confirmPassword && password === confirmPassword) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(252, 108, 95, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && email && password && confirmPassword && password === confirmPassword) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(252, 108, 95, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus style={{ width: '20px', height: '20px' }} />
                  Criar Conta
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '32px 0',
            gap: '16px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}></div>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>ou continue com</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }}></div>
          </div>

          {/* Botão Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: '500',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transform: loading ? 'scale(0.98)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#fc6c5f';
                e.currentTarget.style.backgroundColor = 'rgba(252, 108, 95, 0.05)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Carregando...' : 'Google'}
          </button>

          {/* Link para login */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Já possui uma conta?{' '}
            <Link
              to="/login"
              style={{
                color: '#fc6c5f',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e55a4b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#fc6c5f';
              }}
            >
              Fazer Login
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.75rem'
        }}>
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} ServeFirst. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Estilos CSS */}
      <style>
        {`
          @keyframes gradientFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          
          
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
} 
