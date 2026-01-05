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
        './viewerSlots': './src/slots/index.ts',
        './VegetationLayer': './src/components/slots/VegetationLayer.tsx',
        './TimelineWidget': './src/components/slots/TimelineWidget.tsx',
        './VegetationLayerControl': './src/components/slots/VegetationLayerControl.tsx',
      },
      shared: {
        // CRITICAL: React MUST be shared as singleton to avoid hook errors
        'react': {
          singleton: true,
          requiredVersion: '^18.3.1',
          import: false,
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
          import: false,
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
    // React must be shared via Module Federation (singleton) to work correctly
    // when module renders inside host's React tree
    rollupOptions: {
      // Externalize React so ui-kit (when bundled) can use React from host
      // Note: react/jsx-runtime is NOT externalized - it's bundled because
      // Module Federation doesn't provide it in shared scope and it's safe to bundle
      // Note: @nekazari/sdk is NOT externalized - it's bundled directly
      external: [
        'react',
        'react-dom',
        'react-router-dom',
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
        },
        format: 'es',
      },
    },
    // Ensure @nekazari/sdk is resolved correctly
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
