import React, { ReactNode, useEffect, useState } from 'react';
import { Box, Container, Paper, IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { BottomNav } from './bottom-nav';
import { detectDeviceType, getSafeAreaInsets, mobileUIConfig } from '@/lib/mobile-config';
import { OfflineIndicator } from './offline-indicator';

interface MobileWrapperProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showBottomNav?: boolean;
  safeArea?: boolean;
  fullHeight?: boolean;
  onBack?: () => void;
  showOfflineIndicator?: boolean;
}

/**
 * Componente MobileWrapper
 * 
 * Este componente envolve o conteúdo para exibição em dispositivos móveis.
 * Ele impede scroll horizontal na página inteira para melhor experiência em mobile.
 * 
 * IMPORTANTE: Para conteúdo com scroll vertical, envolva o conteúdo em um elemento
 * com propriedades overflow-y: auto; e height/flex adequados. Por exemplo:
 * 
 * <MobileWrapper>
 *   <div style={{
 *     display: 'flex',
 *     flexDirection: 'column',
 *     overflow: 'hidden',
 *     height: '100%'
 *   }}>
 *     <div style={{ overflow: 'hidden' }}>
 *       Conteúdo fixo (como tabs)
 *     </div>
 *     <div style={{ 
 *       overflowY: 'auto',
 *       overflowX: 'hidden',
 *       flex: 1
 *     }}>
 *       Conteúdo com scroll
 *     </div>
 *   </div>
 * </MobileWrapper>
 */
export const MobileWrapper: React.FC<MobileWrapperProps> = ({ 
  children, 
  title, 
  showBackButton = false,
  showBottomNav = true,
  safeArea = true,
  fullHeight = true,
  onBack,
  showOfflineIndicator = true
}) => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [safeAreaInsets, setSafeAreaInsets] = useState(getSafeAreaInsets());
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    // Detect platform
    setPlatform(detectDeviceType());
    setSafeAreaInsets(getSafeAreaInsets());
    
    // Add listener for orientation changes
    const handleResize = () => {
      setSafeAreaInsets(getSafeAreaInsets());
    };
    
    // Add scroll listener for header shadow
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Platform-specific styles
  const getStyles = () => {
    const baseStyles = {
      root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: fullHeight ? '100%' : 'auto',
        maxHeight: fullHeight ? '100%' : 'none',
        background: mobileUIConfig.colors.background,
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        paddingTop: safeArea ? safeAreaInsets.top : 0,
        paddingBottom: safeArea ? safeAreaInsets.bottom : 0,
        paddingLeft: safeArea ? safeAreaInsets.left : 0,
        paddingRight: safeArea ? safeAreaInsets.right : 0,
        fontFamily: mobileUIConfig.typography.fontFamily,
        overflow: !fullHeight ? 'visible' : 'hidden',
        width: '100%',
        position: 'relative',
      },
      content: {
        flex: 1,
        padding: '0',
        paddingBottom: showBottomNav ? '80px' : '0',
        overflow: 'visible',
        WebkitOverflowScrolling: 'touch',
        height: 'auto',
        overscrollBehavior: 'contain',
        width: '100%',
        boxSizing: 'border-box',
        maxHeight: 'none',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: mobileUIConfig.colors.background,
        transition: 'box-shadow 0.3s ease',
        boxShadow: isScrolled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        height: '56px',
      },
      backButton: {
        marginRight: '8px',
        color: '#000',
        padding: '8px',
        WebkitTapHighlightColor: 'transparent',
      },
      title: {
        margin: 0,
        fontWeight: 600,
        fontSize: mobileUIConfig.typography.fontSize.large,
        color: '#000',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
      },
    };

    // Add platform-specific adjustments
    if (platform === 'ios') {
      return {
        ...baseStyles,
        content: {
          ...baseStyles.content,
          // iOS specific styles
          WebkitOverflowScrolling: 'touch',
        },
      };
    } else if (platform === 'android') {
      return {
        ...baseStyles,
        content: {
          ...baseStyles.content,
          // Android specific styles
          overscrollBehavior: 'none',
        },
      };
    }

    return baseStyles;
  };

  const styles = getStyles();
  
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={styles.root} className="mobile-wrapper-fix">
      {title && (
        <Box sx={styles.header}>
          {showBackButton && (
            <IconButton 
              onClick={handleBackClick}
              sx={styles.backButton}
              size="small"
              className="touch-btn"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={styles.title}>
            {title}
          </Typography>
        </Box>
      )}
      
      {showOfflineIndicator && <OfflineIndicator />}
      
      <Container 
        component={Paper} 
        elevation={0}
        sx={{
          ...styles.content,
          maxHeight: 'none',
          overflow: 'visible',
          display: 'block',
          paddingBottom: showBottomNav ? '100px' : '20px'
        }}
        disableGutters
        maxWidth={false}
        className="mobile-content-container"
      >
        {children}
      </Container>
      {showBottomNav && (
        <Box 
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <BottomNav />
        </Box>
      )}
    </Box>
  );
}; 