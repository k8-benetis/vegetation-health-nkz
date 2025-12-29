# Prompt de Contexto para Agente - Fase 1: Refactorización de Componentes

## 🎯 Objetivo

Refactorizar `ConfigPage.tsx` y `AnalyticsPage.tsx` en componentes reutilizables, mobile-first, diseñados para panel lateral (300-400px) primero, que funcionen tanto en panel como en página completa.

## 📋 Contexto del Proyecto

**Módulo**: Vegetation Prime (vegetation-health-nkz)
**Ubicación**: `/home/g/Documents/nekazari-module-vegetation-health`
**Objetivo Final**: Integrar completamente el módulo en el visor unificado de la plataforma Nekazari usando el sistema de slots.

**Plan Completo**: Ver `../nekazari-public/docs/development/VEGETATION_PRIME_VIEWER_INTEGRATION_PLAN.md`
**Análisis Crítico**: Ver `../nekazari-public/docs/development/ANALISIS_CRITICO_PLAN_INTEGRACION.md`

## ✅ Estado Actual

### Hooks Reutilizables Creados
- ✅ `src/hooks/useVegetationJobs.ts` - Gestión de trabajos
- ✅ `src/hooks/useVegetationScenes.ts` - Gestión de escenas

### Pendiente
- ❌ `src/hooks/useVegetationConfig.ts` - Configuración, credenciales, uso
- ❌ `src/components/VegetationConfig.tsx` - Componente refactorizado
- ❌ `src/components/VegetationAnalytics.tsx` - Componente refactorizado

## 🎨 Condiciones Críticas de UX (INNEGOCIABLES)

### 1. Sensación Nativa
- El usuario **NO debe percibir que son "slots"**
- Componentes deben fundirse perfectamente con UnifiedViewer
- **Sin bordes extraños, sin iframes, sin scrollbars dobles**
- Transiciones fluidas

### 2. Diseño Mobile-First
- **Diseñados para Panel Lateral (300-400px) PRIMERO**
- Componentes verdaderamente atómicos y responsivos
- **Nada de "copiar y pegar y ocultar el header"**
- Funcionan perfectamente tanto en panel como en página completa

### 3. Estilos Consistentes
Usar las mismas clases que `CoreContextPanel.tsx` (referencia en `../nekazari-public/apps/host/src/components/viewer/CoreContextPanel.tsx`):
- `bg-white/90 backdrop-blur-md` para paneles
- `border border-slate-200/50` para bordes
- `text-slate-800`, `text-slate-600`, `text-slate-500` para texto
- `rounded-xl` para esquinas

## 📝 Tareas Específicas

### Tarea 1: Crear `useVegetationConfig.ts` Hook

**Archivo**: `src/hooks/useVegetationConfig.ts`

**Funcionalidad**:
- Cargar configuración del módulo (`api.getConfig()`)
- Guardar configuración (`api.updateConfig()`)
- Estado de credenciales de Copernicus (`api.getCredentialsStatus()`)
- Uso y límites del plan (`api.getCurrentUsage()`)
- Trabajos recientes (usar `useVegetationJobs` con filtro `job_type === 'download'`)

**Extraer de**: `src/components/pages/ConfigPage.tsx` (líneas 19-141)

**Ejemplo de estructura**:
```typescript
export function useVegetationConfig() {
  const api = useVegetationApi();
  const [config, setConfig] = useState<Partial<VegetationConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentialsStatus, setCredentialsStatus] = useState<...>(null);
  const [usage, setUsage] = useState<...>(null);
  
  // Funciones: loadConfig, saveConfig, loadCredentialsStatus, loadUsage
  
  return {
    config,
    loading,
    saving,
    error,
    credentialsStatus,
    usage,
    saveConfig,
    refresh: loadConfig,
  };
}
```

---

### Tarea 2: Crear `VegetationConfig.tsx` Componente

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
- ✅ Usa `useVegetationConfig()` hook
- ✅ Diseñado para panel lateral (300-400px) primero
- ✅ Funciona también en página completa
- ✅ Sin headers duplicados (el panel ya tiene header)
- ✅ Sin scrollbars dobles
- ✅ Estilos que se funden con UnifiedViewer

**Secciones a incluir** (en orden de importancia para panel):
1. **Estado de credenciales de Copernicus** (compacto, card pequeña)
2. **Uso y límites** (progress bars compactos, una sola línea si es posible)
3. **Configuración de procesamiento** (formulario compacto)
4. **Trabajos recientes** (lista compacta o tabla pequeña)

**Basado en**: `src/components/pages/ConfigPage.tsx` (líneas 151-606)

**Ejemplo de estructura responsive**:
```typescript
export const VegetationConfig: React.FC<VegetationConfigProps> = ({
  parcelId,
  mode = 'panel',
  onJobCreated,
  className
}) => {
  const { config, loading, saving, error, credentialsStatus, usage, saveConfig } = useVegetationConfig();
  const { Card, Button } = useUIKit();
  
  // Layout adaptativo según mode
  const containerClass = mode === 'panel' 
    ? 'space-y-3' // Compacto para panel
    : 'space-y-6'; // Generoso para página completa
  
  // Cards más pequeñas en panel
  const cardPadding = mode === 'panel' ? 'md' : 'lg';
  
  return (
    <div className={className}>
      {/* Credenciales - Card compacta */}
      <Card padding={cardPadding}>
        {/* Contenido compacto */}
      </Card>
      
      {/* Uso y límites - Progress bars compactos */}
      {usage && (
        <Card padding={cardPadding}>
          {/* Progress bars en una línea si es posible */}
        </Card>
      )}
      
      {/* Configuración - Formulario compacto */}
      <Card padding={cardPadding}>
        {/* Campos más compactos en panel */}
      </Card>
      
      {/* Trabajos recientes - Lista compacta */}
      <Card padding={cardPadding}>
        {/* Tabla pequeña o lista en panel */}
      </Card>
    </div>
  );
};
```

---

### Tarea 3: Crear `VegetationAnalytics.tsx` Componente

**Archivo**: `src/components/VegetationAnalytics.tsx`

**Props**:
```typescript
interface VegetationAnalyticsProps {
  parcelId: string | null; // Parcela seleccionada (desde useViewer)
  mode?: 'panel' | 'full-page';
  className?: string;
}
```

**Requisitos**:
- ✅ Usa `useVegetationJobs()` y `useVegetationScenes()` hooks
- ✅ Diseñado para panel lateral (300-400px) primero
- ✅ Gráficos responsivos (compactos en panel, completos en página)
- ✅ Sin headers duplicados
- ✅ Estilos que se funden con UnifiedViewer

**Secciones a incluir** (en orden de importancia para panel):
1. **Estadísticas resumidas** (cards compactas, 2x2 grid en panel)
2. **Series temporales** (gráfico compacto, altura reducida en panel)
3. **Histograma de distribución** (compacto, altura reducida)
4. **Lista de trabajos** (compacta, sin tabla completa)

**Basado en**: `src/components/pages/AnalyticsPage.tsx` (líneas 29-608)

**Nota**: La comparación A/B puede omitirse en modo panel o ser muy compacta.

---

## 🔧 Integración con Visor Unificado

Los componentes deben obtener `parcelId` desde el visor unificado:

```typescript
import { useViewer } from '@nekazari/sdk';

const { selectedEntityId, selectedEntityType } = useViewer();
const parcelId = selectedEntityType === 'AgriParcel' ? selectedEntityId : null;
```

**IMPORTANTE**: Los componentes deben funcionar incluso si `parcelId` es `null` (mostrar estado vacío o mensaje apropiado).

---

## 📐 Especificaciones de Diseño

### Panel Mode (300-400px)
- Cards con padding `md` (no `lg`)
- Gráficos con altura reducida (200-250px en lugar de 400px)
- Tablas convertidas a listas o cards
- Texto más pequeño pero legible (`text-sm` en lugar de `text-base`)
- Espaciado reducido (`space-y-3` en lugar de `space-y-6`)

### Full-Page Mode
- Cards con padding `lg`
- Gráficos con altura normal (400px)
- Tablas completas
- Texto normal
- Espaciado generoso (`space-y-6`)

### Colores y Estilos
- Usar paleta de `CoreContextPanel.tsx`:
  - Fondo: `bg-white/90 backdrop-blur-md`
  - Bordes: `border border-slate-200/50`
  - Texto principal: `text-slate-800`
  - Texto secundario: `text-slate-600`
  - Texto terciario: `text-slate-500`
  - Esquinas: `rounded-xl`

---

## 📚 Archivos de Referencia

### En este módulo:
- `src/components/pages/ConfigPage.tsx` - Componente original a refactorizar
- `src/components/pages/AnalyticsPage.tsx` - Componente original a refactorizar
- `src/hooks/useVegetationJobs.ts` - Hook de ejemplo (ya creado)
- `src/hooks/useVegetationScenes.ts` - Hook de ejemplo (ya creado)
- `src/services/api.ts` - API client
- `src/services/vegetationContext.tsx` - Contexto global del módulo

### En la plataforma (nekazari-public):
- `apps/host/src/components/viewer/CoreContextPanel.tsx` - Referencia de estilos
- `docs/development/VEGETATION_PRIME_VIEWER_INTEGRATION_PLAN.md` - Plan completo
- `docs/development/ANALISIS_CRITICO_PLAN_INTEGRACION.md` - Análisis y decisiones

---

## ✅ Criterios de Aceptación

1. ✅ Componentes funcionan en modo panel (300-400px) sin problemas
2. ✅ Componentes funcionan en modo full-page sin problemas
3. ✅ No hay headers duplicados
4. ✅ No hay scrollbars dobles
5. ✅ Estilos consistentes con UnifiedViewer
6. ✅ Usuario NO percibe que son "slots"
7. ✅ Integración con `useViewer()` funciona correctamente
8. ✅ Hooks reutilizables extraídos correctamente

---

## 🚀 Comenzar

1. Leer `INTEGRATION_PHASE1_STATUS.md` para estado actual
2. Leer `ConfigPage.tsx` y `AnalyticsPage.tsx` para entender la lógica
3. Crear `useVegetationConfig.ts` hook
4. Crear `VegetationConfig.tsx` componente
5. Crear `VegetationAnalytics.tsx` componente
6. Testing responsive (panel y página completa)

---

## 📝 Notas Importantes

- **NO hacer copy-paste**: Refactorizar, no duplicar código
- **Mobile-first**: Diseñar para 300-400px primero, luego expandir
- **Reutilizar hooks**: Usar `useVegetationJobs` y `useVegetationScenes` ya creados
- **Estilos consistentes**: Seguir `CoreContextPanel.tsx` como referencia
- **Sin deuda técnica**: Componentes deben ser mantenibles y reutilizables


