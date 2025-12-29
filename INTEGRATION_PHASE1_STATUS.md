# Estado de Fase 1: Refactorización de Componentes

## 📋 Resumen

**Objetivo**: Refactorizar `ConfigPage.tsx` y `AnalyticsPage.tsx` en componentes reutilizables, mobile-first, diseñados para panel lateral (300-400px) primero.

**Estado**: En progreso - Hooks creados, componentes pendientes

---

## ✅ Completado

### Hooks Reutilizables Creados

1. **`src/hooks/useVegetationJobs.ts`** ✅
   - Gestión de trabajos (download, process, calculate_index)
   - Estadísticas (total, completed, failed, running, pending)
   - Auto-refresh opcional
   - Extraído de ConfigPage y AnalyticsPage

2. **`src/hooks/useVegetationScenes.ts`** ✅
   - Gestión de escenas
   - Filtrado por entityId, fechas
   - Auto-refresh opcional
   - Extraído de AnalyticsPage

---

## 🔄 Pendiente

### 1. Hook `useVegetationConfig.ts`
**Archivo**: `src/hooks/useVegetationConfig.ts`

**Funcionalidad**:
- Cargar configuración del módulo
- Guardar configuración
- Estado de credenciales de Copernicus
- Uso y límites del plan
- Trabajos recientes (download jobs)

**Extraer de**: `ConfigPage.tsx` (líneas 19-141)

---

### 2. Componente `VegetationConfig.tsx`
**Archivo**: `src/components/VegetationConfig.tsx`

**Props**:
```typescript
interface VegetationConfigProps {
  parcelId: string | null; // Parcela seleccionada (desde useViewer)
  mode?: 'panel' | 'full-page'; // Adapta layout según contexto
  onJobCreated?: (jobId: string) => void;
  className?: string;
}
```

**Requisitos**:
- ✅ Diseñado para panel lateral (300-400px) primero (Mobile-First)
- ✅ Funciona también en página completa
- ✅ Sin headers duplicados
- ✅ Sin scrollbars dobles
- ✅ Estilos que se funden con UnifiedViewer
- ✅ Usa `useVegetationConfig` hook

**Secciones a incluir**:
1. Estado de credenciales de Copernicus (compacto en panel)
2. Uso y límites (progress bars compactos)
3. Configuración de procesamiento (default_index_type, cloud_coverage_threshold, auto_process)
4. Configuración de almacenamiento (storage_type)
5. Trabajos recientes (tabla compacta o lista)

**Basado en**: `ConfigPage.tsx` (líneas 151-606)

---

### 3. Componente `VegetationAnalytics.tsx`
**Archivo**: `src/components/VegetationAnalytics.tsx`

**Props**:
```typescript
interface VegetationAnalyticsProps {
  parcelId: string | null; // Parcela seleccionada (desde useViewer)
  mode?: 'panel' | 'full-page'; // Adapta layout según contexto
  className?: string;
}
```

**Requisitos**:
- ✅ Diseñado para panel lateral (300-400px) primero (Mobile-First)
- ✅ Funciona también en página completa
- ✅ Gráficos responsivos (compactos en panel, completos en página)
- ✅ Sin headers duplicados
- ✅ Estilos que se funden con UnifiedViewer

**Secciones a incluir**:
1. Estadísticas resumidas (cards compactas)
2. Series temporales (gráfico compacto en panel)
3. Histograma de distribución (compacto)
4. Comparación A/B (slider compacto)
5. Lista de trabajos (compacta)

**Basado en**: `AnalyticsPage.tsx` (líneas 29-608)

---

## 📝 Notas de Implementación

### Integración con useViewer()
Los componentes deben obtener `parcelId` desde el visor unificado:

```typescript
import { useViewer } from '@nekazari/sdk';

const { selectedEntityId, selectedEntityType } = useViewer();
const parcelId = selectedEntityType === 'AgriParcel' ? selectedEntityId : null;
```

### Diseño Responsive
- **Panel mode (300-400px)**:
  - Cards más compactas
  - Gráficos con altura reducida
  - Tablas convertidas a listas
  - Texto más pequeño pero legible
  
- **Full-page mode**:
  - Layout completo
  - Gráficos con altura normal
  - Tablas completas
  - Espaciado generoso

### Estilos Consistentes
Usar las mismas clases que `CoreContextPanel.tsx`:
- `bg-white/90 backdrop-blur-md` para paneles
- `border border-slate-200/50` para bordes
- `text-slate-800`, `text-slate-600`, `text-slate-500` para texto
- `rounded-xl` para esquinas

---

## 🎯 Próximos Pasos

1. Crear `useVegetationConfig.ts` hook
2. Crear `VegetationConfig.tsx` componente
3. Crear `VegetationAnalytics.tsx` componente
4. Testing responsive (panel y página completa)
5. Verificar integración visual con UnifiedViewer

---

## 📚 Referencias

- Plan de integración: `/home/g/Documents/nekazari-public/docs/development/VEGETATION_PRIME_VIEWER_INTEGRATION_PLAN.md`
- Análisis crítico: `/home/g/Documents/nekazari-public/docs/development/ANALISIS_CRITICO_PLAN_INTEGRACION.md`
- Componente original: `src/components/pages/ConfigPage.tsx`
- Componente original: `src/components/pages/AnalyticsPage.tsx`
- Referencia de estilo: `/home/g/Documents/nekazari-public/apps/host/src/components/viewer/CoreContextPanel.tsx`

