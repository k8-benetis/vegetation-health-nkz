import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'vegetation_prime_module',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
        './VegetationLayer': './src/components/slots/VegetationLayer.tsx',
        './TimelineWidget': './src/components/slots/TimelineWidget.tsx',
        './VegetationLayerControl': './src/components/slots/VegetationLayerControl.tsx',
      },
      shared: {
        'react': {
          singleton: true,
          requiredVersion: '^18.3.1',
          import: false,  // Use global from host
          shareScope: 'default',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
          import: false,
          shareScope: 'default',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.26.0',
          import: false,
          shareScope: 'default',
        },
        '@nekazari/ui-kit': {
          singleton: true,
          requiredVersion: '^1.0.0',
          import: false,  // Share from host
          shareScope: 'default',
        },
        '@nekazari/sdk': {
          singleton: true,
          requiredVersion: '^1.0.0',
          import: false,  // Share from host
          shareScope: 'default',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5003,
    cors: true,
    // Proxy API calls to avoid CORS issues in development
    proxy: {
      '/api': {
        target: 'https://nkz.artotxiki.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom', '@nekazari/ui-kit', '@nekazari/sdk'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          '@nekazari/ui-kit': 'NekazariUIKit',
          '@nekazari/sdk': 'NekazariSDK',
        },
      },
    },
  },
});
