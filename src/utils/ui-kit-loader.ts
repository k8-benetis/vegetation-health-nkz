/**
 * UI Kit Loader - Dynamically loads @nekazari/ui-kit from host
 * 
 * This utility allows the module to use the host's ui-kit instance
 * instead of bundling its own, avoiding React instance conflicts.
 */

// Type definitions for ui-kit components
export interface UIKitComponents {
  Card: React.ComponentType<any>;
  Button: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  Select: React.ComponentType<any>;
}

let cachedUIKit: UIKitComponents | null = null;

/**
 * Get ui-kit components from host
 * Falls back to a minimal implementation if host ui-kit is not available
 */
export function getUIKit(): UIKitComponents {
  if (cachedUIKit) {
    return cachedUIKit;
  }

  // Try to get ui-kit from host's window global
  const hostUIKit = (window as any).__nekazariUIKit;
  
  if (hostUIKit) {
    console.log('[ui-kit-loader] ✅ Using ui-kit from host');
    // Handle both named exports and default export
    // When imported as `import * as UIKit`, it's a namespace object
    const uiKit = hostUIKit.default || hostUIKit;
    cachedUIKit = {
      Card: uiKit.Card,
      Button: uiKit.Button,
      Input: uiKit.Input,
      Select: uiKit.Select,
    };
    
    // Validate that we got the components
    if (cachedUIKit.Card && cachedUIKit.Button && cachedUIKit.Input && cachedUIKit.Select) {
      return cachedUIKit;
    } else {
      console.warn('[ui-kit-loader] Some ui-kit components missing:', {
        Card: !!cachedUIKit.Card,
        Button: !!cachedUIKit.Button,
        Input: !!cachedUIKit.Input,
        Select: !!cachedUIKit.Select,
        hostUIKitKeys: Object.keys(hostUIKit),
      });
    }
  }

  // Fallback: Try to get from globalThis.__federation_shared__
  try {
    const shared = (globalThis as any).__federation_shared__;
    if (shared && shared.default && shared.default['@nekazari/ui-kit']) {
      const uiKitModule = shared.default['@nekazari/ui-kit']['1.0.0'];
      if (uiKitModule && typeof uiKitModule.get === 'function') {
        uiKitModule.get().then((module: any) => {
          const uiKit = typeof module === 'function' ? module() : module;
          cachedUIKit = {
            Card: uiKit.Card || uiKit.default?.Card,
            Button: uiKit.Button || uiKit.default?.Button,
            Input: uiKit.Input || uiKit.default?.Input,
            Select: uiKit.Select || uiKit.default?.Select,
          };
        });
      }
    }
  } catch (error) {
    console.warn('[ui-kit-loader] Could not load ui-kit from federation shared:', error);
  }

  // Last resort: Create minimal fallback components
  console.warn('[ui-kit-loader] ⚠️ Host ui-kit not available, using fallback components');
  const React = (window as any).React;
  
  if (!React) {
    throw new Error('React is not available. Cannot create fallback components.');
  }

  cachedUIKit = {
    Card: ({ children, className, ...props }: any) => 
      React.createElement('div', { className: `rounded-lg border border-gray-200 bg-white shadow-sm p-4 ${className || ''}`, ...props }, children),
    Button: ({ children, className, onClick, ...props }: any) => 
      React.createElement('button', { className: `px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 ${className || ''}`, onClick, ...props }, children),
    Input: ({ className, ...props }: any) => 
      React.createElement('input', { className: `px-3 py-2 border border-gray-300 rounded-md ${className || ''}`, ...props }),
    Select: ({ children, className, ...props }: any) => 
      React.createElement('select', { className: `px-3 py-2 border border-gray-300 rounded-md ${className || ''}`, ...props }, children),
  };

  return cachedUIKit;
}

