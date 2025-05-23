import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Interface para props do MobileWrapper
interface MobileWrapperProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  showBottomNav?: boolean;
  customClass?: string;
}

// Componente para envolver todas as telas com a estrutura móvel
export function MobileWrapper({ children, title, showBack = true, showBottomNav = true, customClass = '' }: MobileWrapperProps) {
  const navigate = useNavigate();
  
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
    </div>
  );
} 