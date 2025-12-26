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
        // CRITICAL: React MUST be shared as singleton to avoid hook errors
        // When a module renders inside host's React tree, both must use the same React instance
        // This is a technical requirement, not a coupling issue - React requires singleton for hooks
        'react': {
          singleton: true,
          requiredVersion: '^18.3.1',
          import: false,  // Use global from host (window.React)
          shareScope: 'default',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
          import: false,  // Use global from host (window.ReactDOM)
          shareScope: 'default',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.26.0',
          import: false,  // Use global from host (window.ReactRouterDOM)
          shareScope: 'default',
        },
        // CRITICAL: ui-kit must be shared as singleton because it imports React
        // When ui-kit is bundled inside the module, it can't access React (which is externalized)
        // By sharing ui-kit as singleton, it will use React from the host
        '@nekazari/ui-kit': {
          singleton: true,
          requiredVersion: '^1.0.0',
          import: false,  // Use from host's shared scope
          shareScope: 'default',
        },
        '@nekazari/sdk': {
          singleton: false,
          requiredVersion: '^1.0.0',
          // Note: SDK automatically obtains auth context from host via React Context
          // The host's AuthProvider wraps all modules, so useAuth() works correctly
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
    // React must be shared via Module Federation (singleton) to work correctly
    // when module renders inside host's React tree
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
        },
      },
    },
  },
});
