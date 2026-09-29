import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mechzie.app',
  appName: 'MechZie',
  webDir: 'dist',

  // Android-specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Remove in production
  },

  // Server configuration for API communication
  server: {
    // Use HTTPS scheme for proper CORS handling in WebView
    androidScheme: 'https',
    // TODO: Replace with your production API URL
    // url: 'https://api.mechzie.com',
    cleartext: true,
  },

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#171717',
      showSpinner: true,
      spinnerColor: '#ececec',
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK' as any,
      backgroundColor: '#171717',
    },
  },
};

export default config;
