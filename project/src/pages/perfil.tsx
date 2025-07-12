import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-prod';
import { auth } from '@/lib/firebase-prod';
import { Camera, Edit2, LogOut, Lock, Mail, User, ChevronRight, Award, Users } from 'lucide-react';

export function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    gruposAtivos: 0,
    participacoes: 0
  });
  
  useEffect(() => {
    setPhotoURL(user?.photoURL || null);
    setNewDisplayName(user?.displayName || '');
    
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStats({
            gruposAtivos: userData.gruposAtivos || 0,
            participacoes: userData.participacoes || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas do usuário:', error);
      }
    };
    
    fetchUserStats();
  }, [user]);

  const handleUpdateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;
    
    try {
      setLoading(true);
      toast.loading('Atualizando nome...');
      
      await updateProfile(user, { displayName: newDisplayName.trim() });
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        displayName: newDisplayName.trim(),
        updatedAt: new Date()
      });
      
      await auth.currentUser?.reload();
      
      setIsEditingName(false);
      toast.dismiss();
      toast.success('Nome atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar nome');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setLoading(true);
      toast.loading('Enviando imagem...');
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      await updateProfile(user, { photoURL: downloadURL });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: downloadURL, updatedAt: new Date() });
      await auth.currentUser?.reload();
      setPhotoURL(downloadURL);
      toast.dismiss();
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      toast.dismiss();
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setLoading(false);
    }
  };
  
  const getInitial = () => {
    if (!user || !user.displayName) return user?.email?.charAt(0).toUpperCase() || '?';
    return user.displayName.charAt(0).toUpperCase();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', paddingBottom: '80px' }}>
      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#fc6c5f', paddingTop: '48px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', color: 'white', margin: 0 }}>Perfil</h1>
      </div>
      
      {/* Conteúdo principal */}
      <div style={{ padding: '24px 16px' }}>
        {/* Cartão de perfil */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
            {/* Foto de perfil */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div 
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '4px solid #fc6c5f',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease'
                }}
                onClick={handleFileClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {photoURL ? (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${photoURL})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#fc6c5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{getInitial()}</span>
                  </div>
                )}
                
                {/* Overlay para edição */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
                className="edit-overlay"
                >
                  <Camera style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                
                {/* Indicador de carregamento */}
                {loading && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            {/* Nome do usuário */}
            {isEditingName ? (
              <div style={{ width: '100%', maxWidth: '288px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    placeholder="Seu nome"
                    disabled={loading}
                  />
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={loading || !newDisplayName.trim()}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: loading || !newDisplayName.trim() ? '#d1d5db' : '#fc6c5f',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: loading || !newDisplayName.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNewDisplayName(user?.displayName || '');
                    }}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      borderRadius: '8px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px',
                    color: '#9ca3af',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#fc6c5f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <Edit2 style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px', margin: '0 0 24px 0' }}>{user?.email}</p>
            
            {/* Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fc6c5f', marginBottom: '4px' }}>{stats.gruposAtivos}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Grupos Ativos</div>
              </div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fc6c5f', marginBottom: '4px' }}>{stats.participacoes}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Participações</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações pessoais */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', margin: 0 }}>
              <User style={{ width: '20px', height: '20px', color: '#fc6c5f', marginRight: '8px' }} />
              Informações Pessoais
            </h3>
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', margin: '0 0 4px 0' }}>Nome</p>
                  <p style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>{user?.displayName || 'Não definido'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingName(true)}
                style={{
                  padding: '8px',
                  color: '#9ca3af',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fc6c5f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                <Edit2 style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Mail style={{ width: '20px', height: '20px', color: '#fc6c5f', marginRight: '12px' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px', margin: '0 0 4px 0' }}>Email</p>
                  <p style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', color: '#065f46', backgroundColor: '#d1fae5' }}>
                Verificado
              </div>
            </div>
          </div>
        </div>
        
        {/* Ações rápidas */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>Ações Rápidas</h3>
          </div>
          
          {/* Botões organizados em grid 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
            <button 
              onClick={() => navigate('/alterar-senha')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: 'none',
                backgroundColor: 'white',
                borderRight: '1px solid #f3f4f6',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Lock style={{ width: '24px', height: '24px', color: '#fc6c5f', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>Alterar Senha</span>
            </button>
            
            <button 
              onClick={() => navigate('/teatros')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: 'none',
                backgroundColor: 'white',
                borderBottom: '1px solid #f3f4f6',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Users style={{ width: '24px', height: '24px', color: '#fc6c5f', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>Meus Grupos</span>
            </button>
            
            <button 
              onClick={() => navigate('/eventos')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: 'none',
                backgroundColor: 'white',
                borderRight: '1px solid #f3f4f6',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Award style={{ width: '24px', height: '24px', color: '#fc6c5f', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>Meus Eventos</span>
            </button>
            
            <button 
              onClick={handleLogout}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <LogOut style={{ width: '24px', height: '24px', color: '#ef4444', marginBottom: '8px' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#dc2626' }}>Sair</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Barra de navegação inferior igual às outras páginas */}
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
          .edit-overlay {
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          
          .edit-overlay:hover {
            opacity: 1;
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
