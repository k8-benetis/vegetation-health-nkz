import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

// Plugin to intercept react/jsx-runtime imports and redirect to bundled version
// Uses resolveId hook to intercept module resolution before Module Federation processes it
function replaceJsxRuntime() {
  let jsxRuntimeId = null;
  let jsxDevRuntimeId = null;
  
  return {
    name: 'replace-jsx-runtime',
    // This hook runs during module resolution, before Module Federation processes imports
    resolveId(source, importer) {
      // Intercept react/jsx-runtime and react/jsx-dev-runtime imports
      if (source === 'react/jsx-runtime' || source === 'react/jsx-dev-runtime') {
        // If we haven't found the bundled file yet, return null to let Vite handle it normally
        // The alias will ensure it gets bundled
        // Once bundled, we'll redirect to the actual file
        if (jsxRuntimeId) {
          return jsxRuntimeId;
        }
        // Return the alias path - Vite will resolve it to the physical file
        return path.resolve(__dirname, 'node_modules/react/jsx-runtime.js');
      }
      return null;
    },
    // After build, find the actual bundled jsx-runtime file
    generateBundle(options, bundle) {
      // Find the jsx-runtime file in the bundle
      Object.keys(bundle).forEach(fileName => {
        if (fileName.includes('jsx-runtime')) {
          jsxRuntimeId = fileName;
          jsxDevRuntimeId = fileName; // Same file for both
        }
      });
    },
    // Also replace in the code as fallback
    renderChunk(code, chunk) {
      if (jsxRuntimeId) {
        // Replace bare specifier imports with relative imports
        code = code.replace(
          /from\s+['"]react\/jsx-runtime['"]/g,
          `from './${jsxRuntimeId}'`
        );
        code = code.replace(
          /from\s+['"]react\/jsx-dev-runtime['"]/g,
          `from './${jsxRuntimeId}'`
        );
      }
      return code;
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
        './viewerSlots': './src/slots/index.ts',
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
        // Note: @nekazari/sdk is NOT in shared - it's bundled directly
        // SDK automatically obtains auth context from host via React Context
        // The host's AuthProvider wraps all modules, so useAuth() works correctly
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
