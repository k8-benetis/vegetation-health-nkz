import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

// Plugin to replace react/jsx-runtime imports with bundled version
// This runs after the code is transformed but before Module Federation processes it
function replaceJsxRuntime() {
  let jsxRuntimeFileName = null;
  
  return {
    name: 'replace-jsx-runtime',
    generateBundle(options, bundle) {
      // First pass: find the jsx-runtime file name
      Object.keys(bundle).forEach(fileName => {
        if (fileName.includes('jsx-runtime')) {
          jsxRuntimeFileName = fileName;
        }
      });
      
      // Second pass: replace imports with relative path
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.code && jsxRuntimeFileName) {
          // Replace bare specifier imports with relative imports to the bundled file
          const relativePath = `./${jsxRuntimeFileName}`;
          chunk.code = chunk.code.replace(
            /from\s+['"]react\/jsx-runtime['"]/g,
            `from '${relativePath}'`
          );
          chunk.code = chunk.code.replace(
            /from\s+['"]react\/jsx-dev-runtime['"]/g,
            `from '${relativePath}'`
          );
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic JSX runtime to avoid react/jsx-runtime dependency issues with Module Federation
      jsxRuntime: 'classic',
    }),
    replaceJsxRuntime(),
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
        // ui-kit is shared from host via globalThis.__federation_shared__
        // Host populates this in main.tsx before modules load
        '@nekazari/ui-kit': {
          singleton: true,
          requiredVersion: '^1.0.0',
          import: false,  // Use shared from host (globalThis.__federation_shared__)
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
      // CRITICAL: Force Vite to bundle react/jsx-runtime by pointing to physical files
      // This prevents Vite from treating it as an external shared module
      // When Vite sees a file path, it bundles it instead of externalizing
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
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
  },
});
