import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  },
  
  // Server configuration
  server: {
    port: 3004,
    strictPort: false,
    host: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true
    }
  },
  
  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
