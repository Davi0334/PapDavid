import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.servefirst.app',
  appName: 'ServeFirst',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'servefirst.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#1976d2",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    CapacitorFirebaseAuth: {
      providers: ["google.com", "apple.com"],
      languageCode: "pt-BR",
      skipNativeAuth: false,
      permissions: {
        google: ["profile", "email"]
      }
    }
  },
  ios: {
    contentInset: "always",
    allowsLinkPreview: true,
    scrollEnabled: true,
    preferredContentMode: "mobile"
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    initialFocus: true
  }
};

export default config; 