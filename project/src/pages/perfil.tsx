import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-prod';
import { MobileWrapper } from '@/components/mobile-wrapper';

export function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    gruposAtivos: 0,
    participacoes: 0
  });
  
  useEffect(() => {
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
    }
    
    // Fetch user stats from Firestore
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
      
      // 1. Fazer upload da imagem para o Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
      
      // Upload do arquivo
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Obter a URL de download
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // 2. Atualizar o perfil do usuário no Firebase Auth
      await updateProfile(user, {
        photoURL: downloadURL
      });
      
      // 3. Atualizar o perfil do usuário no Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date()
      });
      
      // 4. Atualizar o estado local
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
    if (!user || !user.displayName) return '?';
    return user.displayName.charAt(0).toUpperCase();
  };

  return (
    <MobileWrapper title="Perfil" showBottomNav={true}>
      <div className="profile-container flex flex-col gap-5">
        <div className="profile-photo-container flex flex-col items-center mt-4 mb-6">
          <div 
            className="profile-avatar w-28 h-28 rounded-full bg-[#8a2be2] mb-3"
            style={{ 
              backgroundImage: photoURL ? `url(${photoURL})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={handleFileClick}
          >
            {loading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '50%'
              }}>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {!photoURL && (
              <span style={{ fontSize: '2rem', color: '#fff' }}>
                {getInitial()}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleFileClick} 
            className="profile-photo-button bg-white text-[#8a2be2] py-2 px-5 rounded-full shadow-sm font-medium text-sm transition-all hover:shadow-md active:scale-95"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Alterar foto'}
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="profile-info-card bg-white rounded-xl p-5 shadow-sm mb-5">
          <div className="profile-info-item flex border-b border-gray-100 pb-4 mb-4">
            <div className="profile-info-label font-semibold text-gray-500 w-24">Nome:</div>
            <div className="text-gray-800 font-medium">{user?.displayName || 'Usuário'}</div>
          </div>
          
          <div className="profile-info-item flex">
            <div className="profile-info-label font-semibold text-gray-500 w-24">Email:</div>
            <div className="text-gray-800 font-medium">{user?.email || 'email@exemplo.com'}</div>
          </div>
        </div>
        
        <div className="stats-card bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 shadow-md mb-5 text-white">
          <h3 className="text-lg font-semibold mb-3">Estatísticas</h3>
          <div className="flex justify-between">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.gruposAtivos}</div>
              <div className="text-xs opacity-80">Grupos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.participacoes}</div>
              <div className="text-xs opacity-80">Participações</div>
            </div>
          </div>
        </div>
        
        <div className="settings-card bg-white rounded-xl p-5 shadow-sm mb-5">
          <h3 className="text-lg font-semibold mb-3">Configurações</h3>
          
          <div className="setting-item flex items-center justify-between py-3 border-b border-gray-100">
            <div className="setting-label">Tema Escuro</div>
            <div className="setting-control">
              <div 
                onClick={() => {
                  const currentTheme = localStorage.getItem('theme') === 'dark';
                  localStorage.setItem('theme', currentTheme ? 'light' : 'dark');
                  document.documentElement.classList.toggle('dark', !currentTheme);
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-200 dark:bg-purple-600"
              >
                <span 
                  className={`${
                    localStorage.getItem('theme') === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </div>
            </div>
          </div>
          
           <div className="setting-item flex items-center justify-between py-3">
            <div className="setting-label">Notificações</div>
            <div className="setting-control">
              <div 
                onClick={() => {
                  const currentNotif = localStorage.getItem('notifications') === 'enabled';
                  localStorage.setItem('notifications', currentNotif ? 'disabled' : 'enabled');
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-200 dark:bg-purple-600"
              >
                <span 
                  className={`${
                    localStorage.getItem('notifications') === 'enabled' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-2 mb-20">
          <button 
            className="flex items-center justify-center bg-white text-[#2c3e50] py-3 px-5 rounded-xl shadow-sm font-medium transition-all hover:shadow-md active:scale-95 w-full"
            onClick={() => navigate('/alterar-senha')}
          >
            <span className="mr-2">🔒</span>
            Alterar Senha
          </button>
          
          <button 
            className="flex items-center justify-center bg-[#f8f9fa] text-[#e74c3c] border border-[#e74c3c] py-3 px-5 rounded-xl font-medium transition-all hover:bg-[#e74c3c] hover:text-white active:scale-95 w-full mb-10"
            onClick={handleLogout}
          >
            <span className="mr-2">↩</span>
            Sair da conta
          </button>
        </div>
      </div>
    </MobileWrapper>
  );
} 