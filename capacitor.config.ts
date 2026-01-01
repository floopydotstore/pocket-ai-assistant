import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.27beb1e0a5f442dba47763b2e3a6edfb',
  appName: 'PocketAgent',
  webDir: 'dist',
  server: {
    url: 'https://27beb1e0-a5f4-42db-a477-63b2e3a6edfb.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D1117',
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
