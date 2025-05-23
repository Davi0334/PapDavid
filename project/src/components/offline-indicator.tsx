import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Collapse } from '@mui/material';
import { WifiOff, Refresh, ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { attemptReconnect } from '@/lib/firebase-prod';
import { detectDeviceType } from '@/lib/mobile-config';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onReconnect?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className,
  showDetails = false,
  onReconnect
}) => {
  const [expanded, setExpanded] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const platform = detectDeviceType();
  
  // Check network status and offline mode
  useEffect(() => {
    const checkStatus = () => {
      const networkOffline = !navigator.onLine;
      setIsOffline(networkOffline);
    };
    
    // Initial check
    checkStatus();
    
    // Set up listeners
    window.addEventListener('online', checkStatus);
    window.addEventListener('offline', checkStatus);
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => {
      window.removeEventListener('online', checkStatus);
      window.removeEventListener('offline', checkStatus);
      clearInterval(interval);
    };
  }, []);
  
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      // Attempt to reconnect
      await attemptReconnect();
      
      // Execute callback if provided
      if (onReconnect) {
        onReconnect();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setReconnecting(false);
      
      // Recheck status after reconnection attempt
      const networkOffline = !navigator.onLine;
      setIsOffline(networkOffline);
    }
  };
  
  // If online, don't show anything
  if (!isOffline) {
    return null;
  }
  
  return (
    <Paper
      elevation={platform === 'ios' ? 0 : 2}
      sx={{
        position: 'fixed',
        bottom: showDetails ? 'auto' : '70px',
        top: showDetails ? '65px' : 'auto',
        left: '16px',
        right: '16px',
        zIndex: 999,
        padding: '12px 16px',
        backgroundColor: platform === 'ios' ? '#fffbe6' : '#fff3e0',
        borderRadius: platform === 'ios' ? '12px' : '8px',
        boxShadow: platform === 'ios' 
          ? '0 2px 8px rgba(0,0,0,0.15)' 
          : '0 2px 4px rgba(0,0,0,0.2)',
        border: platform === 'ios' ? '1px solid rgba(0,0,0,0.1)' : 'none',
        marginBottom: '8px',
        className
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WifiOff fontSize="small" color="warning" />
          <Typography variant="body2" fontWeight={500}>
            Sem conexão com internet
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            size="small" 
            color="primary"
            onClick={handleReconnect}
            disabled={reconnecting}
            sx={{ mr: 1 }}
          >
            <Refresh fontSize="small" />
          </IconButton>
          
          {showDetails && (
            <IconButton 
              size="small" 
              onClick={handleToggleExpanded}
            >
              {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
            </IconButton>
          )}
        </Box>
      </Box>
      
      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Typography variant="body2" paragraph>
              Sua conexão com a internet foi perdida. Os dados serão salvos localmente.
            </Typography>
            
            <Typography variant="body2" paragraph>
              As alterações feitas offline serão sincronizadas automaticamente quando a conexão for restaurada.
            </Typography>
            
            <Typography 
              variant="body2" 
              color="primary" 
              onClick={handleReconnect} 
              sx={{ 
                cursor: 'pointer', 
                fontWeight: 500,
                display: 'inline-block'
              }}
            >
              {reconnecting ? 'Tentando reconectar...' : 'Tentar reconectar agora →'}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default OfflineIndicator; 