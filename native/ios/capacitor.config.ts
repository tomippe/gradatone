import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.tomippe.gradatone',
  appName: 'Gradatone',
  webDir: '../store-web',
  server: {
    iosScheme: 'gradatone'
  }
};

export default config;
