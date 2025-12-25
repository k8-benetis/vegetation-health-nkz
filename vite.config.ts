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
        // Self-contained module architecture: React/ReactDOM/React Router are bundled directly
        // This ensures long-term compatibility and independence from platform updates.
        // See: https://github.com/your-org/nekazari-public/blob/main/docs/development/MODULE_DEVELOPMENT_BEST_PRACTICES.md
        // 
        // Only platform-specific packages are shared (they're lightweight and version-stable)
        '@nekazari/ui-kit': {
          singleton: false,
          requiredVersion: '^1.0.0',
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
    // Self-contained architecture: React is bundled, not externalized
    // This ensures the module works independently without host dependencies
    rollupOptions: {
      output: {
        // Module Federation handles module sharing internally
        // React/ReactDOM/React Router are bundled directly (not externalized)
      },
    },
  },
});
