import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
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
          color: isActive('/') ? '#fc6c5f' : '#333',
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
          color: isActive('/buscar') ? '#fc6c5f' : '#333',
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
          color: isActive('/eventos') ? '#fc6c5f' : '#333',
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
          color: isActive('/perfil') ? '#fc6c5f' : '#333',
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
  );
};

export default BottomNav;