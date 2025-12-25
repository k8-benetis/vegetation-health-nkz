-- =============================================================================
-- K8s Module Registration SQL
-- =============================================================================
-- Registers the Vegetation Prime module in the Core Platform database
-- for Kubernetes deployment.
--
-- USAGE:
-- Execute this SQL in the Core Platform database (nekazari_core schema)
-- after deploying the module to Kubernetes.
--
-- PREREQUISITES:
-- - Module backend deployed to K8s (service: vegetation-prime-api)
-- - Module frontend deployed to K8s (service: vegetation-prime-frontend)
-- - Module accessible via ingress or service URLs
-- =============================================================================

-- Insert module registration
INSERT INTO modules (
    id,
    name,
    display_name,
    version,
    description,
    author,
    category,
    module_type,
    route_path,
    label,
    icon,
    icon_url,
    required_roles,
    dependencies,
    permissions,
    build_config,
    is_active,
    is_local,
    backend_url,
    frontend_url,
    created_at,
    updated_at
) VALUES (
    'vegetation-prime',  -- Module ID
    'vegetation-prime',  -- Internal name
    'Vegetation Prime',  -- Display name
    '1.0.0',            -- Version
    'High-performance vegetation intelligence suite for Sentinel-2 analysis. Provides NDVI, EVI, SAVI, GNDVI, NDRE indices with real-time tile serving and historical time series analysis.',
    'Nekazari Team',    -- Author
    'analytics',        -- Category
    'ADDON_PAID',       -- Module type (can be ADDON_FREE, ADDON_PAID, ENTERPRISE)
    '/vegetation',      -- Route path
    'Vegetation',       -- Menu label
    '🌱',               -- Icon emoji
    NULL,               -- Icon URL (optional)
    ARRAY['User'],      -- Required roles (minimum)
    ARRAY['@nekazari/sdk@^1.0.0', '@nekazari/ui-kit@^1.0.0'],  -- Dependencies
    '{
        "api_access": true,
        "external_requests": true,
        "storage": true,
        "geospatial": true
    }'::jsonb,          -- Permissions
    '{
        "exposes": {
            "./App": "./App",
            "./VegetationLayer": "./VegetationLayer",
            "./TimelineWidget": "./TimelineWidget",
            "./VegetationLayerControl": "./VegetationLayerControl"
        },
        "shared": {
            "react": {
                "singleton": true,
                "requiredVersion": "^18.3.1"
            },
            "react-dom": {
                "singleton": true,
                "requiredVersion": "^18.3.1"
            },
            "react-router-dom": {
                "singleton": true,
                "requiredVersion": "^6.26.0"
            },
            "@nekazari/sdk": {
                "singleton": true,
                "requiredVersion": "^1.0.0"
            },
            "@nekazari/ui-kit": {
                "singleton": true,
                "requiredVersion": "^1.0.0"
            }
        }
    }'::jsonb,          -- Build config (Module Federation)
    true,               -- Is active
    false,              -- Is local (external module)
    'http://vegetation-prime-api:8000',  -- Backend service URL (K8s internal)
    'http://vegetation-prime-frontend',  -- Frontend service URL (K8s internal or ingress)
    NOW(),              -- Created at
    NOW()               -- Updated at
) ON CONFLICT (id) DO UPDATE SET
    version = EXCLUDED.version,
    description = EXCLUDED.description,
    backend_url = EXCLUDED.backend_url,
    frontend_url = EXCLUDED.frontend_url,
    build_config = EXCLUDED.build_config,
    updated_at = NOW();

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 1. BACKEND_URL: Use K8s service name for internal communication
--    Example: 'http://vegetation-prime-api:8000'
--    Or use ingress URL for external: 'https://api.nekazari.com/vegetation'
--
-- 2. FRONTEND_URL: Use K8s service or ingress URL
--    Example: 'http://vegetation-prime-frontend' (internal)
--    Or: 'https://modules.nekazari.com/vegetation-prime' (external)
--
-- 3. MODULE_TYPE: 
--    - 'ADDON_FREE': Free for all tenants
--    - 'ADDON_PAID': Requires subscription (monetization enabled)
--    - 'ENTERPRISE': Enterprise-only features
--
-- 4. PERMISSIONS: Adjust based on module requirements
--    - api_access: Can call Core Platform APIs
--    - external_requests: Can make external HTTP requests (Copernicus, etc.)
--    - storage: Can use storage service (S3/MinIO)
--    - geospatial: Can use PostGIS/geospatial features
--
-- 5. After registration, the Core Platform will:
--    - Load the module frontend via Module Federation
--    - Route API requests to the backend URL
--    - Display the module in the marketplace/admin panel
-- =============================================================================

