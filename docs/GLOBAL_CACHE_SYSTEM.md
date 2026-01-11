# Global Scene Cache System

## Overview

The Vegetation Prime module implements a **hybrid global cache system** for Sentinel-2 scenes to maximize quota savings when using shared Copernicus credentials. This system allows multiple tenants to reuse the same downloaded scenes without re-downloading from Copernicus Data Space Ecosystem.

## Architecture

### Two-Level Storage System

1. **Global Bucket** (`vegetation-prime-global`)
   - Stores raw Sentinel-2 scene files (bands) shared across all tenants
   - Managed by the `global_scene_cache` database table
   - Single source of truth for downloaded scenes

2. **Tenant Buckets** (`vegetation-prime-{tenant_id}`)
   - Stores tenant-specific copies of scenes for processing
   - Contains processed data (NDVI maps, indices) that remain private
   - Isolated per tenant for security

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ User Request: Download Scene S2A_MSIL2A_20231201T120000... │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Check GlobalSceneCache Table │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                                │
        ▼                                ▼
   Scene Exists?                    Scene Not Found?
        │                                │
        │                                ▼
        │                    ┌──────────────────────────┐
        │                    │ Download from Copernicus │
        │                    └───────────┬──────────────┘
        │                                │
        │                                ▼
        │                    ┌──────────────────────────┐
        │                    │ Save to Global Bucket   │
        │                    └───────────┬──────────────┘
        │                                │
        │                                ▼
        │                    ┌──────────────────────────┐
        │                    │ Register in Cache Table │
        │                    └───────────┬──────────────┘
        │                                │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │ Copy to Tenant Bucket          │
        │ (from global or from download)  │
        └─────────────────┬───────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │ Create Tenant Scene Record     │
        │ (for processing/indices)       │
        └─────────────────────────────────┘
```

## Database Schema

### `global_scene_cache` Table

Stores metadata about scenes in the global bucket:

```sql
CREATE TABLE global_scene_cache (
    id UUID PRIMARY KEY,
    scene_id TEXT UNIQUE NOT NULL,          -- Sentinel-2 product ID
    storage_path TEXT NOT NULL,             -- Path in global bucket
    storage_bucket TEXT NOT NULL,          -- 'vegetation-prime-global'
    bands JSONB,                            -- {"B02": "path/to/B02.tif", ...}
    download_count INTEGER DEFAULT 0,      -- Reuse counter
    last_accessed_at TIMESTAMPTZ,          -- Last tenant request
    is_valid BOOLEAN DEFAULT true,         -- Mark invalid if files missing
    sensing_date DATE NOT NULL,
    cloud_coverage TEXT,
    ...
);
```

## Benefits

### 1. Quota Savings
- **Before**: Each tenant downloads the same scene → N downloads for N tenants
- **After**: Scene downloaded once, reused N times → 1 download for N tenants
- **Example**: 10 tenants request the same scene → 90% quota savings

### 2. Data Isolation
- Raw scenes are shared (public Sentinel-2 data)
- Processed data (NDVI, indices, maps) remain private per tenant
- Each tenant has their own bucket for processed outputs

### 3. Scalability
- Works efficiently with shared Copernicus credentials
- Reduces API rate limiting issues
- Lower storage costs (single copy vs. multiple copies)

### 4. Resilience
- Verifies file existence before reusing
- Marks invalid entries if files are corrupted/missing
- Automatically re-downloads if cache entry is invalid

## Implementation Details

### Cache Check Flow

1. **Scene Lookup**
   ```python
   global_cache_entry = db.query(GlobalSceneCache).filter(
       GlobalSceneCache.scene_id == scene_id,
       GlobalSceneCache.is_valid == True
   ).first()
   ```

2. **File Verification**
   ```python
   for band in required_bands:
       if not global_storage.file_exists(global_band_path, global_bucket):
           # Mark invalid, force re-download
           all_bands_exist = False
   ```

3. **Copy Operation**
   ```python
   tenant_storage.copy_file(
       source_path=global_band_path,
       dest_path=tenant_band_path,
       source_bucket=global_bucket_name,
       dest_bucket=tenant_bucket_name
   )
   ```

### Storage Service Methods

- `get_global_bucket_name()` → Returns `'vegetation-prime-global'`
- `copy_file()` → Server-side copy (S3) or filesystem copy (local)
- `file_exists()` → Verify files before reuse

## Configuration

### Global Bucket Setup

The global bucket is automatically created if it doesn't exist. Ensure your storage service (S3/MinIO) has proper permissions:

```bash
# Bucket name is hardcoded to: vegetation-prime-global
# No configuration needed - created automatically on first use
```

### Migration

**IMPORTANT**: The global cache system requires running migration 003 to create the `global_scene_cache` table.

#### Option 1: Using the Migration Script (Recommended)

The module includes an automated migration runner that detects and applies migrations:

```bash
# From the backend directory
cd backend
python scripts/run_migrations.py
```

The script will:
- Automatically detect migration 003
- Check if it's already applied
- Apply it if needed
- Use PostgreSQL advisory locks to prevent concurrent execution

**Requirements:**
- `DATABASE_URL` environment variable must be set
- Database connection must be accessible

#### Option 2: Manual SQL Execution

If you prefer to run the migration manually:

```bash
# Direct SQL execution
psql $DATABASE_URL -f backend/migrations/003_create_global_scene_cache.sql
```

Or from within a database session:

```sql
\i backend/migrations/003_create_global_scene_cache.sql
```

#### Option 3: Kubernetes Pod Execution

If running in Kubernetes, execute from the backend pod:

```bash
# Get pod name
kubectl get pods -n nekazari | grep vegetation-prime-api

# Execute migration script
kubectl exec -it vegetation-prime-api-<pod-id> -n nekazari -- \
  python /app/scripts/run_migrations.py
```

Or execute SQL directly:

```bash
kubectl exec -it vegetation-prime-api-<pod-id> -n nekazari -- \
  psql $DATABASE_URL -f /app/migrations/003_create_global_scene_cache.sql
```

#### Verification

After running the migration, verify the table was created:

```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'global_scene_cache'
);

-- View table structure
\d global_scene_cache
```

## Monitoring

### Cache Statistics

Query cache performance:

```sql
-- Most reused scenes
SELECT scene_id, download_count, last_accessed_at
FROM global_scene_cache
WHERE is_valid = true
ORDER BY download_count DESC
LIMIT 10;

-- Cache hit rate (approximate)
SELECT 
    COUNT(*) FILTER (WHERE download_count > 0) as reused_scenes,
    COUNT(*) as total_scenes,
    ROUND(100.0 * COUNT(*) FILTER (WHERE download_count > 0) / COUNT(*), 2) as reuse_percentage
FROM global_scene_cache
WHERE is_valid = true;
```

### Job Results

Each job includes cache status:

```json
{
    "scene_id": "...",
    "cache_status": "reused",  // or "downloaded"
    "bands_downloaded": ["B04", "B08"],
    "message": "Scene reused successfully"
}
```

## Troubleshooting

### Scene Not Being Reused

1. **Check cache entry exists:**
   ```sql
   SELECT * FROM global_scene_cache WHERE scene_id = 'S2A_...';
   ```

2. **Verify files exist in global bucket:**
   ```python
   storage = create_storage_service(...)
   storage.file_exists('scenes/S2A_.../B04.tif', 'vegetation-prime-global')
   ```

3. **Check if entry is marked invalid:**
   ```sql
   SELECT is_valid FROM global_scene_cache WHERE scene_id = 'S2A_...';
   ```

### Invalid Cache Entries

If files are missing or corrupted:

```sql
-- Mark as invalid (will be re-downloaded on next request)
UPDATE global_scene_cache 
SET is_valid = false 
WHERE scene_id = 'S2A_...';
```

### Manual Cache Cleanup

```sql
-- Remove old invalid entries
DELETE FROM global_scene_cache 
WHERE is_valid = false 
AND updated_at < NOW() - INTERVAL '30 days';
```

## Best Practices

1. **Monitor cache hit rate** - Should increase over time as more scenes are cached
2. **Regular cleanup** - Remove invalid entries periodically
3. **Storage management** - Monitor global bucket size (scenes can be large)
4. **Backup strategy** - Consider backing up global bucket (contains unique downloads)

## Related Documentation

- [Storage Service](STORAGE_SERVICE.md) - Storage abstraction details
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production setup
- [User Manual](USER_MANUAL.md) - End-user documentation

---

**Last Updated**: December 2025
**Version**: 1.9.0

