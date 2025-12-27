# Verificación de Sincronización de Límites

## Endpoint de Sincronización

El módulo expone el endpoint `/api/vegetation/admin/sync-limits` para que el Core Platform sincronice los límites de cada tenant.

### Endpoint

```
POST /api/vegetation/admin/sync-limits
```

### Autenticación

Requiere header `X-Service-Auth` con la clave configurada en `MODULE_MANAGEMENT_KEY`.

### Request Body

```json
{
  "tenant_id": "tenant-uuid",
  "plan_type": "premium",
  "plan_name": "Premium Plan",
  "monthly_ha_limit": 1000.0,
  "daily_ha_limit": 50.0,
  "daily_jobs_limit": 50,
  "monthly_jobs_limit": 500,
  "daily_download_jobs_limit": 20,
  "daily_process_jobs_limit": 30,
  "daily_calculate_jobs_limit": 50,
  "is_active": true,
  "synced_by": "core-platform"
}
```

### Verificación en Base de Datos

Para verificar si los límites están sincronizados:

```sql
-- Ver límites de un tenant específico
SELECT 
    tenant_id,
    plan_type,
    plan_name,
    monthly_ha_limit,
    daily_jobs_limit,
    is_active,
    synced_at,
    synced_by
FROM vegetation_plan_limits
WHERE tenant_id = 'TU_TENANT_ID'
AND is_active = true;
```

### Cuándo Debe Llamarse

El Core Platform debe llamar a este endpoint cuando:

1. **Instalación del módulo**: Al instalar el módulo para un tenant por primera vez
2. **Cambio de plan**: Cuando el tenant cambia de plan (basic → premium, etc.)
3. **Actualización de límites**: Cuando se actualizan los límites del plan
4. **Reactivación**: Cuando se reactiva un tenant después de suspensión

### Verificación de Sincronización

#### 1. Verificar si hay límites configurados

```sql
SELECT COUNT(*) 
FROM vegetation_plan_limits 
WHERE tenant_id = 'TU_TENANT_ID' 
AND is_active = true;
```

**Resultado esperado**: `1` (si está sincronizado) o `0` (si no está sincronizado)

#### 2. Verificar última sincronización

```sql
SELECT 
    synced_at,
    synced_by,
    plan_name,
    plan_type
FROM vegetation_plan_limits
WHERE tenant_id = 'TU_TENANT_ID'
AND is_active = true;
```

#### 3. Verificar desde el módulo

El módulo mostrará:
- **"Plan No Configurado"**: Si no hay límites en la BD (usa defaults)
- **Nombre del plan**: Si hay límites sincronizados
- **"Admin Plan"**: Si el usuario es PlatformAdmin

### Troubleshooting

#### Problema: "Plan No Configurado" aparece

**Causa**: Los límites no se han sincronizado desde el Core Platform.

**Solución**:
1. Verificar que el Core Platform tenga configurado el webhook/endpoint
2. Llamar manualmente al endpoint `sync-limits` con los datos del tenant
3. Verificar que `MODULE_MANAGEMENT_KEY` esté configurado correctamente

#### Problema: Límites no se actualizan

**Causa**: El Core Platform no está llamando al endpoint cuando cambia el plan.

**Solución**:
1. Verificar logs del backend para ver si se reciben llamadas
2. Verificar que el endpoint esté accesible desde el Core Platform
3. Verificar autenticación (header `X-Service-Auth`)

### Ejemplo de Llamada Manual

```bash
curl -X POST http://localhost:8000/api/vegetation/admin/sync-limits \
  -H "Content-Type: application/json" \
  -H "X-Service-Auth: YOUR_MODULE_MANAGEMENT_KEY" \
  -d '{
    "tenant_id": "tenant-uuid",
    "plan_type": "premium",
    "plan_name": "Premium Plan",
    "monthly_ha_limit": 1000.0,
    "daily_ha_limit": 50.0,
    "daily_jobs_limit": 50,
    "monthly_jobs_limit": 500,
    "daily_download_jobs_limit": 20,
    "daily_process_jobs_limit": 30,
    "daily_calculate_jobs_limit": 50,
    "is_active": true,
    "synced_by": "manual-test"
  }'
```

### Logs de Verificación

El módulo registra cuando se sincronizan límites:

```
INFO: Syncing limits for tenant {tenant_id}: plan_type={plan_type}, plan_name={plan_name}
```

Si no hay logs, el endpoint no se está llamando.


