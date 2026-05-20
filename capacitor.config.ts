import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tempo.app',
  appName: 'Tempo',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: false,
  },
};

export default config;
