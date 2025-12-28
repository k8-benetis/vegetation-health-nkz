# ONBOARDING PROMPT: Vegetation Prime Module - Professional Integration Guide

## CONTEXT: Nekazari Platform - Enterprise-Grade Modular FIWARE System

You are working on a **production FIWARE multi-tenant modular platform** that serves as an operating system for agriculture, industry, science, and environmental sciences. The platform uses **Module Federation** (via `@originjs/vite-plugin-federation`) to dynamically load external modules at runtime, enabling third-party developers to create and deploy their own modules.

**This is the FIRST external module** (`vegetation-prime`) and must set the **gold standard** for:
- Professional code quality
- Clean architecture
- Proper Module Federation integration
- Production-ready deployment
- Comprehensive documentation

---

## PLATFORM ARCHITECTURE

### Host Platform (`nekazari-public` repository)

**Location**: `/home/g/Documents/nekazari-public`  
**Repository**: `https://github.com/k8-benetis/nekazari-public`  
**Production URL**: `https://nekazari.artotxiki.com`  
**Kubernetes Namespace**: `nekazari`

**Key Technologies**:
- React 18.3.1 + Vite + TypeScript
- Module Federation: **DISABLED in host** (causes production hangs - see `apps/host/vite.config.ts`)
- **Workaround**: Host exposes shared modules via `window` globals and `globalThis.__federation_shared__`
- Frontend Deployment: **Served from MinIO bucket** (not Docker image) for faster updates
- Module Loading: Custom `RemoteModuleLoader` component with dynamic ES module imports

**Critical Host Exports** (`apps/host/src/main.tsx`):
```typescript
// React, ReactDOM, ReactRouterDOM exposed globally
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
(window as any).ReactRouterDOM = ReactRouterDOM;
(window as any).__nekazariUIKit = UIKit; // ui-kit namespace

// Module Federation shared modules (for remote modules with import: false)
globalThis.__federation_shared__['default']['react'] = {
  '18.3.1': { get: () => Promise.resolve(() => React) }
};
globalThis.__federation_shared__['default']['react-dom'] = {
  '18.3.1': { get: () => Promise.resolve(() => ReactDOM) }
};
globalThis.__federation_shared__['default']['react-router-dom'] = {
  '6.26.0': { get: () => Promise.resolve(() => ReactRouterDOM) }
};
globalThis.__federation_shared__['default']['@nekazari/ui-kit'] = {
  '1.0.0': { get: () => Promise.resolve(() => UIKit) }
};
```

**UI Kit Package** (`packages/ui-kit`):
- **Exports**: `Card`, `Button` only
- **Does NOT export**: `Input`, `Select` (modules must create their own)

### External Module (`vegetation-health-nkz` repository)

**Location**: `/home/g/Documents/nekazari-module-vegetation-health`  
**Repository**: `https://github.com/k8-benetis/vegetation-health-nkz`  
**Module ID**: `vegetation-prime`  
**Module Route**: `/vegetation`  
**Frontend URL**: `https://nekazari.artotxiki.com/modules/vegetation-prime/`

**Module Federation Configuration** (`vite.config.ts`):
```typescript
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
    '@nekazari/ui-kit': {
      singleton: true,
      requiredVersion: '^1.0.0',
      import: false,  // Use shared from host (globalThis.__federation_shared__)
      shareScope: 'default',
    },
    '@nekazari/sdk': {
      singleton: false,
      requiredVersion: '^1.0.0',
    },
  },
})
```

**Build Output**:
- `remoteEntry.js`: Module Federation entry point
- Assets served from `/modules/vegetation-prime/assets/`
- Nginx serves static files with CORS headers

---

## CRITICAL REQUIREMENTS FOR EXTERNAL MODULES

### 1. Module Federation Configuration

**MUST**:
- Configure `react`, `react-dom`, `react-router-dom` as **singletons** with `import: false`
- Configure `@nekazari/ui-kit` as **singleton** with `import: false` (if using ui-kit)
- Use `shareScope: 'default'` to match host's scope
- **DO NOT** bundle React or ui-kit - they must come from the host

**Why**: React requires a single instance when modules render inside the host's React tree. Multiple React instances cause hook errors and context failures.

### 2. UI Kit Usage

**Available Components** (from `@nekazari/ui-kit`):
- `Card` ✅
- `Button` ✅
- `Input` ❌ (does not exist - create your own)
- `Select` ❌ (does not exist - create your own)

**Correct Import Pattern**:
```typescript
// ✅ CORRECT: Direct import from @nekazari/ui-kit
import { Card, Button } from '@nekazari/ui-kit';

// ✅ CORRECT: Create local components for missing ones
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
```

**❌ WRONG Patterns** (DO NOT DO THIS):
```typescript
// ❌ WRONG: Dynamic loader at module level
const { Card } = getUIKit(); // Executes before host initializes

// ❌ WRONG: Bundling ui-kit
import * as UIKit from '@nekazari/ui-kit'; // Bundles ui-kit, causes React conflicts

// ❌ WRONG: Using window globals directly
const Card = window.__nekazariUIKit.Card; // Bypasses Module Federation
```

### 3. React Router Usage

**CRITICAL**: Modules **MUST NOT** use `react-router-dom`'s `<Routes>`, `<Route>`, or `<Navigate>` internally.

**Why**: The host has a `BrowserRouter` with a catch-all route (`<Route path="*" element={<Navigate to="/" replace />} />`). If a module uses internal routing, navigation attempts are caught by the host's router, causing redirects to the landing page.

**✅ CORRECT**: Use state-based navigation (tabs, conditional rendering)
```typescript
const [activeTab, setActiveTab] = useState<'config' | 'analytics'>('config');

return (
  <div>
    <button onClick={() => setActiveTab('config')}>Config</button>
    <button onClick={() => setActiveTab('analytics')}>Analytics</button>
    {activeTab === 'config' && <ConfigPage />}
    {activeTab === 'analytics' && <AnalyticsPage />}
  </div>
);
```

**❌ WRONG**: Internal routing
```typescript
// ❌ This will conflict with host's router
<Routes>
  <Route path="config" element={<ConfigPage />} />
  <Route path="analytics" element={<AnalyticsPage />} />
</Routes>
```

### 4. Component Exports

**Main Component** (`App.tsx`):
- **MUST** use `export default` (not named export)
- Module Federation expects default export from `./App`

**Slot Components** (for UnifiedViewer integration):
- Can use named exports
- Exported via `exposes` in `vite.config.ts`

### 5. Database Registration

**Required Tables**:
- `marketplace_modules`: Module metadata and Module Federation config
- `tenant_installed_modules`: Tenant-specific module installation status

**Required Fields** (`marketplace_modules`):
```sql
INSERT INTO marketplace_modules (
  id,                    -- 'vegetation-prime'
  name,                  -- 'vegetation-prime'
  display_name,          -- 'Vegetation Prime'
  version,               -- '1.0.0'
  is_active,             -- true
  remote_entry_url,     -- '/modules/vegetation-prime/assets/remoteEntry.js'
  scope,                 -- 'vegetation_prime_module' (matches vite.config.ts name)
  exposed_module,        -- './App' (matches vite.config.ts exposes)
  route_path            -- '/vegetation'
) VALUES (...);
```

**Critical**: `scope`, `exposed_module`, and `remote_entry_url` **MUST** match `vite.config.ts` configuration.

### 6. Nginx Configuration

**Required** (`frontend/nginx.conf`):
- CORS headers for Module Federation assets
- `/health` endpoint for Kubernetes probes
- Path rewriting for `/modules/{module-name}/*` prefix
- Short cache for `remoteEntry.js` (60s) for updates

### 7. CSS Isolation

- Use Tailwind CSS with proper scoping
- **DO NOT** use global CSS that affects the host
- Module's root container should use `w-full` (not `min-h-screen`) to avoid layout conflicts

---

## COMMON PITFALLS AND SOLUTIONS

### Error 1: React Error #130 ("Element type is invalid: expected a string... but got: undefined")

**Cause**: Component is `undefined` when React tries to render it.

**Common Scenarios**:
1. **UI-Kit not loaded**: Module tries to use `Card` before host initializes `globalThis.__federation_shared__`
2. **Wrong import**: Using dynamic loader at module level instead of direct import
3. **Bundling conflict**: ui-kit bundled in module but uses different React instance

**Solution**:
```typescript
// ✅ CORRECT: Direct import (Module Federation handles sharing)
import { Card, Button } from '@nekazari/ui-kit';

// Module Federation will automatically use shared instance from host
```

### Error 2: Module redirects to landing page

**Cause**: Module uses `react-router-dom` internally, conflicting with host's router.

**Solution**: Remove internal routing, use state-based navigation.

### Error 3: `undefined has no properties` or `Cannot read property 'X' of undefined`

**Cause**: Module Federation shared modules not available when module loads.

**Solution**: Ensure host's `main.tsx` populates `globalThis.__federation_shared__` before modules load. Check that module's `vite.config.ts` has `import: false` for shared modules.

### Error 4: `404` for `remoteEntry.js`

**Cause**: Ingress/Nginx routing issue or incorrect `remote_entry_url` in database.

**Solution**:
1. Verify `remote_entry_url` in `marketplace_modules` matches actual path
2. Check Ingress configuration for `/modules/{module-name}/*` routing
3. Verify Nginx serves files from correct directory
4. Test: `curl -I https://nekazari.artotxiki.com/modules/vegetation-prime/assets/remoteEntry.js`

### Error 5: `Address in use` for Nginx

**Cause**: Multiple containers trying to bind to port 80 in the same pod.

**Solution**: Ensure `k8s/frontend-deployment.yaml` has only ONE container (nginx).

### Error 6: Health check failed

**Cause**: Nginx doesn't have `/health` endpoint.

**Solution**: Add to `nginx.conf`:
```nginx
location = /health {
    access_log off;
    add_header Content-Type text/plain;
    return 200 "healthy";
}
```

---

## DEPLOYMENT WORKFLOW

### 1. Build Module

```bash
cd /home/g/Documents/nekazari-module-vegetation-health
npm install
npm run build
```

**Verify**:
- `dist/remoteEntry.js` exists
- `dist/assets/` contains all chunks
- No errors in build output

### 2. Build Docker Image

```bash
docker build -f frontend/Dockerfile \
  -t ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:v1.7.0 .
```

### 3. Push to Registry

```bash
docker push ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:v1.7.0
```

### 4. Update Kubernetes Deployment

```bash
# Update image tag in k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Or update directly
kubectl set image deployment/vegetation-prime-frontend \
  nginx=ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:v1.7.0 \
  -n nekazari
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n nekazari -l app=vegetation-prime-frontend

# Check logs
kubectl logs -n nekazari -l app=vegetation-prime-frontend --tail=50

# Test remoteEntry.js
curl -I https://nekazari.artotxiki.com/modules/vegetation-prime/assets/remoteEntry.js
```

### 6. Verify Database Registration

```sql
-- Check module registration
SELECT id, name, display_name, version, is_active, remote_entry_url, scope, exposed_module, route_path
FROM marketplace_modules
WHERE id = 'vegetation-prime';

-- Check tenant installation
SELECT tenant_id, module_id, is_enabled, created_at
FROM tenant_installed_modules
WHERE module_id = 'vegetation-prime';
```

---

## TESTING CHECKLIST

### Frontend Integration

- [ ] Module page loads at `/vegetation` without redirecting to landing page
- [ ] No React errors in browser console
- [ ] UI-Kit components (`Card`, `Button`) render correctly
- [ ] Custom components (`Input`, `Select`) work correctly
- [ ] Internal navigation (tabs) works without router conflicts
- [ ] Module integrates with UnifiedViewer slots (if applicable)
- [ ] Authentication context (`useAuth()`) works correctly
- [ ] API calls include correct tenant ID and token

### Module Federation

- [ ] `remoteEntry.js` is accessible and returns 200
- [ ] Module loads via `RemoteModuleLoader` without errors
- [ ] Shared modules (React, ui-kit) come from host, not bundled
- [ ] No "multiple React instances" warnings
- [ ] Module renders inside host's React tree correctly

### Deployment

- [ ] Kubernetes pod is running and healthy
- [ ] Health check endpoint (`/health`) returns 200
- [ ] Nginx serves static files correctly
- [ ] CORS headers are present for Module Federation assets
- [ ] Ingress routes `/modules/vegetation-prime/*` correctly

### Database

- [ ] Module registered in `marketplace_modules` with correct `scope` and `exposed_module`
- [ ] Module installed for tenant in `tenant_installed_modules` with `is_enabled = true`
- [ ] `remote_entry_url` matches actual path

---

## ARCHITECTURE PRINCIPLES

### 1. Separation of Concerns

- **Host**: Provides React, routing, authentication, UI-Kit
- **Module**: Provides business logic, domain-specific UI, API integration
- **Module Federation**: Handles module loading and shared dependencies

### 2. Loose Coupling

- Modules should NOT depend on host's internal implementation
- Use SDK (`@nekazari/sdk`) for platform APIs
- Use UI-Kit for consistent styling
- Use `useAuth()` hook for authentication (not direct Keycloak access)

### 3. Professional Standards

- **TypeScript**: Strict type checking, no `any` types
- **Error Handling**: Proper error boundaries, user-friendly messages
- **Loading States**: Show loading indicators during async operations
- **Documentation**: Code comments, README, inline documentation
- **Testing**: Unit tests for critical logic (if applicable)

### 4. Production Readiness

- **Error Boundaries**: Catch and display errors gracefully
- **Resource Limits**: Kubernetes resource requests/limits set appropriately
- **Health Checks**: Liveness and readiness probes configured
- **Logging**: Structured logging for debugging
- **Monitoring**: Metrics and observability (if applicable)

---

## FILES TO REVIEW

### Module Configuration
- `vite.config.ts`: Module Federation configuration
- `package.json`: Dependencies and scripts
- `k8s/frontend-deployment.yaml`: Kubernetes deployment manifest
- `frontend/nginx.conf`: Nginx configuration

### Module Code
- `src/App.tsx`: Main component (must export default)
- `src/components/pages/*`: Page components
- `src/components/slots/*`: Slot components for UnifiedViewer
- `src/services/api.ts`: API client using `@nekazari/sdk`
- `src/components/ui/Input.tsx`: Custom Input component (ui-kit doesn't export it)
- `src/components/ui/Select.tsx`: Custom Select component (ui-kit doesn't export it)

### Host Platform (Reference)
- `apps/host/src/main.tsx`: Host initialization and shared module exports
- `apps/host/src/components/RemoteModuleLoader.tsx`: Module loading logic
- `apps/host/src/context/ModuleContext.tsx`: Module registry and discovery
- `apps/host/src/App.tsx`: Host routing and module route registration
- `packages/ui-kit/src/index.ts`: UI-Kit exports

---

## DEBUGGING WORKFLOW

### 1. Check Browser Console

Look for:
- Module Federation loading messages
- React errors
- Network errors (404s, CORS)
- Authentication errors

### 2. Check Network Tab

Verify:
- `remoteEntry.js` loads successfully (200 status)
- All Module Federation chunks load (200 status)
- No CORS errors
- Correct `Content-Type` headers

### 3. Check Module Federation Shared Modules

In browser console:
```javascript
// Check if host populated shared modules
console.log('Shared modules:', globalThis.__federation_shared__);

// Check if ui-kit is available
console.log('UIKit:', globalThis.__federation_shared__?.default?.['@nekazari/ui-kit']);

// Check window globals
console.log('React:', typeof window.React);
console.log('UIKit window:', typeof window.__nekazariUIKit);
```

### 4. Check Kubernetes Logs

```bash
# Module frontend logs
kubectl logs -n nekazari -l app=vegetation-prime-frontend --tail=100

# Host frontend logs (if served from pod, not MinIO)
kubectl logs -n nekazari -l app=nekazari-frontend --tail=100
```

### 5. Check Database

```sql
-- Verify module registration
SELECT * FROM marketplace_modules WHERE id = 'vegetation-prime';

-- Verify tenant installation
SELECT * FROM tenant_installed_modules WHERE module_id = 'vegetation-prime';
```

---

## SUCCESS CRITERIA

The module is **professionally integrated** when:

1. ✅ **Loads correctly**: Module page renders without errors or redirects
2. ✅ **Module Federation works**: Shared modules come from host, not bundled
3. ✅ **UI-Kit integration**: Components render correctly using host's ui-kit
4. ✅ **Authentication works**: `useAuth()` provides correct token and tenant ID
5. ✅ **No conflicts**: No React instance conflicts, no router conflicts
6. ✅ **Production ready**: Health checks pass, resources configured, errors handled
7. ✅ **Documentation**: README updated with requirements and deployment steps
8. ✅ **Code quality**: TypeScript strict, no `any`, proper error handling

---

## FINAL NOTES

**This module sets the standard** for all future external modules. Every decision should prioritize:
- **Professionalism**: Enterprise-grade code quality
- **Maintainability**: Clean architecture, clear patterns
- **Scalability**: Works for multiple modules, not just this one
- **Documentation**: Future developers can understand and extend

**Remember**: The goal is not just to make this module work, but to create a **reusable, professional pattern** that other developers can follow.

---

**Good luck! You're building the foundation for a modular, extensible platform. Make it count.**





