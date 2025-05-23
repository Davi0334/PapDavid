import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, CalendarDays, User } from 'lucide-react';
import { getSafeAreaInsets } from '@/lib/mobile-config';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const safeAreaInsets = getSafeAreaInsets();

  // Find the active path or default to home
  const getActiveRoute = () => {
    if (pathname === '/') return 'inicio';
    if (pathname.startsWith('/teatro/') || pathname === '/teatros') return 'inicio';
    if (pathname === '/buscar') return 'buscar';
    if (pathname === '/eventos' || pathname.startsWith('/evento/')) return 'eventos';
    if (pathname === '/perfil') return 'perfil';
    return 'inicio';
  };

  const activeRoute = getActiveRoute();

  // Apply styles to ensure the bottom nav doesn't overlap content
  React.useEffect(() => {
    // Add padding to the document body to ensure content is not obscured
    document.body.style.paddingBottom = '80px';
    
    return () => {
      // Cleanup when component unmounts
      document.body.style.paddingBottom = '';
    };
  }, []);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 shadow-lg"
      style={{ 
        paddingBottom: safeAreaInsets.bottom > 0 ? `${safeAreaInsets.bottom}px` : '0',
      }}
    >
      {/* Active indicator bar */}
      <div className="relative h-0.5 w-full">
        <div 
          className="absolute h-full bg-[#fc6c5f] transition-all duration-300 ease-in-out"
          style={{ 
            width: '25%',
            left: activeRoute === 'inicio' ? '0%' :
                 activeRoute === 'buscar' ? '25%' :
                 activeRoute === 'eventos' ? '50%' : '75%'
          }}
        ></div>
      </div>
      
      <div className="grid grid-cols-4 h-16">
        <Link 
          to="/" 
          className={`
            flex flex-col items-center justify-center text-xs 
            transition-colors duration-200 
            active:bg-gray-100
            ${activeRoute === 'inicio' ? 'text-[#fc6c5f] font-medium' : 'text-gray-500'}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative">
            <Home 
              size={22} 
              className={`transition-colors duration-200 ${activeRoute === 'inicio' ? 'text-[#fc6c5f]' : 'text-gray-500'}`} 
            />
            {activeRoute === 'inicio' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fc6c5f]"></div>
            )}
          </div>
          <span className="mt-1">INÍCIO</span>
        </Link>
        
        <Link 
          to="/buscar" 
          className={`
            flex flex-col items-center justify-center text-xs 
            transition-colors duration-200 
            active:bg-gray-100
            ${activeRoute === 'buscar' ? 'text-[#fc6c5f] font-medium' : 'text-gray-500'}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative">
            <Search 
              size={22} 
              className={`transition-colors duration-200 ${activeRoute === 'buscar' ? 'text-[#fc6c5f]' : 'text-gray-500'}`} 
            />
            {activeRoute === 'buscar' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fc6c5f]"></div>
            )}
          </div>
          <span className="mt-1">BUSCAR</span>
        </Link>
        
        <Link 
          to="/eventos" 
          className={`
            flex flex-col items-center justify-center text-xs 
            transition-colors duration-200 
            active:bg-gray-100
            ${activeRoute === 'eventos' ? 'text-[#fc6c5f] font-medium' : 'text-gray-500'}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative">
            <CalendarDays 
              size={22} 
              className={`transition-colors duration-200 ${activeRoute === 'eventos' ? 'text-[#fc6c5f]' : 'text-gray-500'}`} 
            />
            {activeRoute === 'eventos' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fc6c5f]"></div>
            )}
          </div>
          <span className="mt-1">EVENTOS</span>
        </Link>
        
        <Link 
          to="/perfil" 
          className={`
            flex flex-col items-center justify-center text-xs 
            transition-colors duration-200 
            active:bg-gray-100
            ${activeRoute === 'perfil' ? 'text-[#fc6c5f] font-medium' : 'text-gray-500'}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative">
            <User 
              size={22} 
              className={`transition-colors duration-200 ${activeRoute === 'perfil' ? 'text-[#fc6c5f]' : 'text-gray-500'}`} 
            />
            {activeRoute === 'perfil' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fc6c5f]"></div>
            )}
          </div>
          <span className="mt-1">PERFIL</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;