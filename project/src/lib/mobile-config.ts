/**
 * Mobile Application Configuration
 * This file contains settings and utilities specifically for mobile environments
 */

// Device Detection
export function detectDeviceType(): 'ios' | 'android' | 'web' {
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  }
  
  return 'web';
}

// Get safe area insets for notches and system UI elements
export function getSafeAreaInsets() {
  const platform = detectDeviceType();
  
  // Default insets
  const defaultInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  
  // Get CSS environment variables if supported
  const supportsEnv = CSS && CSS.supports && CSS.supports('(padding-top: env(safe-area-inset-top))');
  
  if (supportsEnv) {
    // Use getComputedStyle to get the actual values
    try {
      const div = document.createElement('div');
      div.style.paddingTop = 'env(safe-area-inset-top)';
      div.style.paddingRight = 'env(safe-area-inset-right)';
      div.style.paddingBottom = 'env(safe-area-inset-bottom)';
      div.style.paddingLeft = 'env(safe-area-inset-left)';
      div.style.position = 'fixed';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      
      const style = window.getComputedStyle(div);
      const top = parseInt(style.paddingTop) || 0;
      const right = parseInt(style.paddingRight) || 0;
      const bottom = parseInt(style.paddingBottom) || 0;
      const left = parseInt(style.paddingLeft) || 0;
      
      document.body.removeChild(div);
      
      return { top, right, bottom, left };
    } catch (e) {
      console.error('Error getting safe area insets:', e);
    }
  }
  
  // Fallback values for common devices if CSS environment variables not supported
  if (platform === 'ios') {
    // Estimate iOS safe area
    const isIPhoneX = window.innerWidth >= 375 && window.innerHeight >= 812;
    const isIPad = /ipad/.test(window.navigator.userAgent.toLowerCase());
    
    if (isIPhoneX) {
      return { top: 47, bottom: 34, left: 0, right: 0 };
    } else if (isIPad) {
      return { top: 24, bottom: 20, left: 0, right: 0 };
    }
    
    return { top: 20, bottom: 0, left: 0, right: 0 };
  } else if (platform === 'android') {
    // Estimate Android safe area
    return { top: 24, bottom: 0, left: 0, right: 0 };
  }
  
  return defaultInsets;
}

// Check if the app is running as PWA/installed app
export const isInstalledApp = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Check if the app is running in native container (Capacitor/Cordova)
export const isNativeApp = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined' || 
         document.URL.startsWith('capacitor://') ||
         document.URL.startsWith('cordova://');
};

// Mobile-specific UI configuration
export const mobileUIConfig = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#f5f5f5',
    surface: '#ffffff',
    error: '#B00020',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#000000',
    onSurface: '#000000',
    onError: '#ffffff',
  },
  typography: {
    fontFamily: {
      ios: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      android: 'Roboto, "Helvetica Neue", sans-serif',
      web: '"Segoe UI", "Helvetica Neue", sans-serif',
    },
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '1.5rem',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    unit: 8,
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
  },
  animation: {
    standard: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  shape: {
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
    },
  },
  elevation: {
    ios: [
      'none',
      '0 0.5px 0 0 rgba(0, 0, 0, 0.15)',
      '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      '0 2px 8px 0 rgba(0, 0, 0, 0.15)',
    ],
    android: [
      'none',
      '0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 1px -1px rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2)',
      '0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
    ],
  },
};

export default {
  detectDeviceType,
  getSafeAreaInsets,
  isInstalledApp,
  isNativeApp,
  mobileUIConfig
}; 