# Platform-Managed Credentials

## Overview

Vegetation Prime uses platform-managed credentials for Copernicus Data Space Ecosystem (CDSE) authentication. This means credentials are stored centrally in the platform database and shared across all modules, eliminating the need for users to configure credentials manually.

## How It Works

### Central Storage

The platform stores Copernicus credentials in the `external_api_credentials` table:

```sql
SELECT username, password_encrypted, service_url, auth_type
FROM external_api_credentials
WHERE service_name = 'copernicus-cdse'
AND is_active = true;
```

- **service_name**: `'copernicus-cdse'`
- **username**: Client ID (OAuth2 client_id)
- **password_encrypted**: Client Secret (OAuth2 client_secret) - encrypted
- **service_url**: Base URL (default: `https://dataspace.copernicus.eu`)
- **auth_type**: Authentication type (default: `'basic_auth'`)

### Credential Retrieval

The module uses the `platform_credentials` service to retrieve credentials:

1. **Primary Source**: Platform's `external_api_credentials` table
2. **Fallback**: Module-specific configuration (if platform credentials not available)

```python
from app.services.platform_credentials import get_copernicus_credentials_with_fallback

# Get credentials (platform first, then fallback)
creds = get_copernicus_credentials_with_fallback(
    db=db,
    fallback_client_id=config.copernicus_client_id,
    fallback_client_secret=config.copernicus_client_secret_encrypted
)
```

### Benefits

1. **Single Configuration Point**: Credentials configured once in platform admin panel
2. **Security**: Centralized credential management with encryption
3. **Simplicity**: Users don't need to configure credentials per module
4. **Consistency**: All modules use the same credentials
5. **Maintenance**: Easy to update credentials for all modules at once

## Configuration

### Platform Administrator

To configure Copernicus credentials in the platform:

1. **Access Admin Panel**: Navigate to platform admin credentials section
2. **Endpoint**: `POST /api/admin/platform-credentials/copernicus-cdse`
3. **Required Fields**:
   - `username`: Copernicus Client ID
   - `password`: Copernicus Client Secret
   - `url`: Service URL (default: `https://dataspace.copernicus.eu`)

4. **Storage**: Credentials are saved to:
   - Kubernetes Secret: `copernicus-cdse-secret` (namespace: `nekazari`)
   - Database: `external_api_credentials` table

### Module Fallback

If platform credentials are not available, the module can use tenant-specific credentials stored in `vegetation_config` table:

- `copernicus_client_id`: Client ID
- `copernicus_client_secret_encrypted`: Client Secret (encrypted)

**Note**: This is a fallback mechanism. Platform-managed credentials are preferred.

## Implementation Details

### Service: `platform_credentials.py`

```python
def get_copernicus_credentials(db: Session) -> Optional[Dict[str, str]]:
    """Get Copernicus CDSE credentials from platform's external_api_credentials table."""
    # Queries external_api_credentials table
    # Returns: {'client_id': ..., 'client_secret': ..., 'service_url': ..., 'auth_type': ...}
```

### Client: `copernicus_client.py`

The `CopernicusDataSpaceClient` can be initialized without credentials:

```python
# Initialize without credentials
client = CopernicusDataSpaceClient()

# Set credentials later (from platform or module config)
client.set_credentials(client_id=creds['client_id'], client_secret=creds['client_secret'])
```

### Task Integration: `download_tasks.py`

Download tasks automatically retrieve credentials:

```python
# Get credentials (platform first, fallback to module config)
creds = get_copernicus_credentials_with_fallback(
    db=db,
    fallback_client_id=config.copernicus_client_id,
    fallback_client_secret=config.copernicus_client_secret_encrypted
)

# Initialize client
copernicus_client = CopernicusDataSpaceClient()
copernicus_client.set_credentials(
    client_id=creds['client_id'],
    client_secret=creds['client_secret']
)
```

## Database Schema

### Platform Table: `external_api_credentials`

```sql
CREATE TABLE external_api_credentials (
    id UUID PRIMARY KEY,
    service_name VARCHAR(255) UNIQUE NOT NULL,  -- 'copernicus-cdse'
    service_url TEXT NOT NULL,
    auth_type VARCHAR(50) NOT NULL,              -- 'basic_auth'
    username TEXT,                               -- Client ID
    password_encrypted TEXT,                     -- Client Secret (encrypted)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Module Table: `vegetation_config` (Fallback)

```sql
CREATE TABLE vegetation_config (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    copernicus_client_id TEXT,                   -- Fallback Client ID
    copernicus_client_secret_encrypted TEXT,    -- Fallback Client Secret
    ...
);
```

## Security Considerations

1. **Encryption**: Passwords are encrypted in the database
2. **RLS**: Row Level Security ensures only authorized users can access credentials
3. **Access Control**: Only PlatformAdmin can manage credentials
4. **No Exposure**: Credentials are never exposed in API responses or logs

## Troubleshooting

### Credentials Not Found

**Error**: `"Copernicus credentials not available"`

**Solutions**:
1. Verify credentials are configured in platform admin panel
2. Check `external_api_credentials` table has active entry for `'copernicus-cdse'`
3. Verify database connection has access to platform database
4. Check RLS policies allow credential access

### Fallback to Module Config

If platform credentials are not available, the module will:
1. Log a warning
2. Attempt to use module-specific credentials (if configured)
3. Raise an error if neither source is available

### Testing

To test credential retrieval:

```python
from app.services.platform_credentials import get_copernicus_credentials
from app.database import get_db_session

db = next(get_db_session())
creds = get_copernicus_credentials(db)
if creds:
    print(f"Found credentials: {creds['client_id'][:10]}...")
else:
    print("No platform credentials found")
```

## Migration Notes

### From Module-Specific to Platform-Managed

If you have existing module-specific credentials:

1. **Export**: Export credentials from `vegetation_config` table
2. **Import**: Add to `external_api_credentials` table via admin panel
3. **Verify**: Test that platform credentials work
4. **Cleanup**: Optionally remove module-specific credentials (they remain as fallback)

### Backward Compatibility

The module maintains backward compatibility:
- Platform credentials (preferred)
- Module-specific credentials (fallback)
- Clear error messages if neither available

## References

- Platform Migration: `002_external_api_credentials.sql`
- Platform API Gateway: `/api/admin/platform-credentials/copernicus-cdse`
- Copernicus CDSE: https://dataspace.copernicus.eu/

