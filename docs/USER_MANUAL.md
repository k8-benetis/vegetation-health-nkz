# Manual de Usuario - Vegetation Prime

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Página de Configuración](#página-de-configuración)
4. [Página de Analytics](#página-de-analytics)
5. [Componentes de Visualización en el Mapa](#componentes-de-visualización-en-el-mapa)
6. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
7. [Índices de Vegetación Disponibles](#índices-de-vegetación-disponibles)
8. [Límites y Monetización](#límites-y-monetización)
9. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

**Vegetation Prime** es un módulo avanzado de monitoreo de salud vegetal que utiliza imágenes satelitales Sentinel-2 L2A para calcular índices espectrales y analizar el estado de la vegetación en tiempo real.

### Características Principales

- **Cálculo de Índices Espectrales**: NDVI, EVI, SAVI, GNDVI, NDRE y fórmulas personalizadas
- **Integración con Sentinel-2**: Descarga automática de escenas desde Copernicus Data Space
- **Análisis Temporal**: Visualización de series temporales históricas
- **Visualización en Mapa**: Renderizado de alta performance con tiles optimizados
- **Procesamiento Asíncrono**: Trabajos en segundo plano para operaciones largas

---

## Acceso al Módulo

1. Inicie sesión en la plataforma Nekazari
2. Navegue al módulo **Vegetation Prime** desde el menú principal
3. La ruta del módulo es: `/vegetation`

El módulo se abre con dos pestañas principales:
- **Configuration**: Configuración y gestión del módulo
- **Analytics**: Análisis y monitoreo de trabajos

---

## Página de Configuración

La página de **Configuration** es el centro de control del módulo. Aquí puede configurar credenciales, ajustar parámetros de procesamiento y monitorear el uso del sistema.

### Sección: Uso y Límites

En la parte superior de la página encontrará una tarjeta que muestra:

#### Plan Actual
- Muestra el tipo de plan activo (ej: "Premium Plan", "Basic Plan")
- Badge de color azul con el nombre del plan

#### Límite de Volumen (Hectáreas Mensuales)
- **Barra de Progreso**: Visualiza el uso mensual de hectáreas procesadas
- **Colores de la Barra**:
  - Verde: Uso por debajo del 75%
  - Amarillo/Naranja: Uso entre 75% y 90%
  - Rojo: Uso por encima del 90%
- **Información Mostrada**:
  - Hectáreas usadas / Hectáreas límite
  - Porcentaje restante del mes

**Ejemplo**: Si su límite es 100 Ha y ha usado 45 Ha, verá:
- `45.00 / 100.00 Ha`
- `55.0% remaining this month`
- Barra verde al 45%

#### Límite de Frecuencia (Trabajos Diarios)
- **Barra de Progreso**: Visualiza el número de trabajos ejecutados hoy
- **Colores de la Barra**: Mismo sistema que el límite de volumen
- **Información Mostrada**:
  - Trabajos usados hoy / Límite diario de trabajos
  - Número de trabajos restantes para hoy

**Ejemplo**: Si su límite diario es 20 trabajos y ha ejecutado 8, verá:
- `8 / 20 jobs`
- `12 jobs remaining today`
- Barra verde al 40%

**Importante**: Si alcanza el 90% o más de cualquiera de los límites, el sistema rechazará nuevas solicitudes con un error HTTP 429. Planifique su uso en consecuencia.

### Sección: Credenciales de Copernicus Data Space

Las credenciales de Copernicus Data Space se gestionan centralmente desde el panel de administración de la plataforma. **No es necesario configurarlas manualmente en este módulo**.

#### Gestión Centralizada

- **Ventaja**: Las credenciales se configuran una vez en la plataforma y todos los módulos las utilizan automáticamente
- **Seguridad**: Las credenciales se almacenan de forma segura en la base de datos de la plataforma
- **Simplicidad**: No necesita recordar o ingresar credenciales para cada módulo

#### Si Necesita Configurar Credenciales

Si las credenciales de Copernicus no están configuradas en la plataforma:

1. **Contacte al Administrador**: El administrador de la plataforma puede configurar las credenciales desde el panel de administración
2. **Endpoint de Administración**: `/api/admin/platform-credentials/copernicus-cdse`
3. **Obtenga Credenciales**: Regístrese en https://dataspace.copernicus.eu/ para obtener su Client ID y Client Secret

**Nota**: El módulo intentará usar primero las credenciales de la plataforma. Si no están disponibles, puede usar credenciales específicas del módulo como respaldo (configuración avanzada).

### Sección: Configuración de Procesamiento

Ajuste los parámetros por defecto para el procesamiento de imágenes.

#### Índice por Defecto
- **Selector desplegable** con los índices disponibles:
  - **NDVI**: Normalized Difference Vegetation Index
  - **EVI**: Enhanced Vegetation Index
  - **SAVI**: Soil-Adjusted Vegetation Index
  - **GNDVI**: Green Normalized Difference Vegetation Index
  - **NDRE**: Normalized Difference Red Edge

Este índice se usará como predeterminado cuando no se especifique otro en las solicitudes.

#### Umbral de Cobertura de Nubes (%)
- **Campo numérico** (0-100)
- Valor por defecto: 20%
- **Funcionamiento**: Las escenas con cobertura de nubes superior a este porcentaje serán excluidas automáticamente de las descargas
- **Recomendación**: 
  - 10-20%: Para análisis de alta calidad (más estricto)
  - 20-30%: Balance entre calidad y disponibilidad
  - 30-50%: Para áreas con frecuente cobertura nubosa

#### Procesamiento Automático
- **Checkbox**: "Auto-process downloaded scenes"
- **Activado por defecto**: Sí
- **Funcionamiento**: 
  - Si está activado: Al descargar una escena, se procesará automáticamente para calcular índices
  - Si está desactivado: Deberá procesar manualmente las escenas descargadas

### Sección: Configuración de Almacenamiento

Configure el tipo de almacenamiento para las imágenes y resultados procesados.

#### Tipo de Almacenamiento
- **Selector desplegable** con opciones:
  - **AWS S3**: Almacenamiento en Amazon S3
  - **MinIO**: Almacenamiento compatible con S3 (self-hosted)
  - **Local Filesystem**: Almacenamiento en el sistema de archivos local

#### Bucket de Almacenamiento
- **Generación Automática**: El nombre del bucket se genera automáticamente basado en su identificador de tenant
- **Formato**: `vegetation-prime-{tenant-id}` (sanitizado para cumplir con las reglas de nombres de buckets)
- **Seguridad**: Este diseño garantiza:
  - Aislamiento completo de datos entre diferentes tenants
  - Prevención de conflictos de nombres
  - Eliminación de riesgos de seguridad por nombres de buckets maliciosos
- **No requiere configuración**: El sistema gestiona el bucket automáticamente
- El bucket almacenará:
  - Imágenes Sentinel-2 descargadas
  - Índices de vegetación calculados
  - Tiles generados para visualización

### Sección: Trabajos de Descarga Recientes

Tabla que muestra los últimos 5 trabajos de descarga ejecutados.

#### Columnas de la Tabla

1. **Job ID**: Identificador único del trabajo (primeros 8 caracteres)
2. **Status**: Estado del trabajo con icono y badge de color:
   - Verde (completed): Trabajo completado exitosamente
   - Amarillo (running): Trabajo en ejecución
   - Rojo (failed): Trabajo fallido
   - Gris (pending): Trabajo pendiente
3. **Progress**: Barra de progreso con porcentaje (0-100%)
4. **Created**: Fecha y hora de creación del trabajo
5. **Message**: Mensaje de progreso o error

#### Acciones Disponibles

- **Botón "Refresh"**: Actualiza la lista de trabajos manualmente
- La tabla se actualiza automáticamente al guardar la configuración

#### Estados de Trabajo

- **pending**: El trabajo está en cola esperando ser procesado
- **running**: El trabajo está siendo ejecutado por un worker de Celery
- **completed**: El trabajo finalizó exitosamente
- **failed**: El trabajo falló (ver mensaje de error para detalles)

---

## Página de Analytics

La página de **Analytics** proporciona una visión general del rendimiento del módulo y permite monitorear todos los trabajos ejecutados.

### Tarjetas de Estadísticas

En la parte superior encontrará 4 tarjetas con métricas clave:

#### 1. Total Jobs
- Muestra el número total de trabajos (todos los tipos)
- Icono: Gráfico de barras azul

#### 2. Completed
- Número de trabajos completados exitosamente
- Color: Verde
- Icono: Tendencia ascendente

#### 3. Running
- Número de trabajos actualmente en ejecución
- Color: Amarillo
- Icono: Calendario

#### 4. Failed
- Número de trabajos que fallaron
- Color: Rojo
- Icono: Filtro

### Tabla de Trabajos Recientes

Tabla completa con todos los trabajos del sistema.

#### Filtro de Estado

En la esquina superior derecha de la tabla encontrará un selector desplegable para filtrar trabajos por estado:

- **All Status**: Muestra todos los trabajos
- **Pending**: Solo trabajos pendientes
- **Running**: Solo trabajos en ejecución
- **Completed**: Solo trabajos completados
- **Failed**: Solo trabajos fallidos

#### Columnas de la Tabla

1. **Job ID**: Identificador único (primeros 8 caracteres)
2. **Type**: Tipo de trabajo:
   - `download`: Descarga de escena Sentinel-2
   - `process`: Procesamiento de escena descargada
   - `calculate_index`: Cálculo de índice de vegetación
3. **Status**: Badge de color con el estado (igual que en ConfigPage)
4. **Progress**: Barra de progreso con porcentaje
5. **Created**: Fecha de creación (formato de fecha local)

#### Interacción

- **Hover**: Las filas cambian de color al pasar el mouse
- **Ordenamiento**: Los trabajos se muestran ordenados por fecha de creación (más recientes primero)
- **Paginación**: La tabla muestra hasta 50 trabajos por defecto

---

## Componentes de Visualización en el Mapa

Vegetation Prime se integra con el visor de mapas de la plataforma mediante componentes "slot" que aparecen en diferentes áreas de la interfaz.

### VegetationLayerControl (Panel de Control de Capas)

Este componente aparece en el panel de controles de capas del mapa.

#### Funcionalidad

Permite seleccionar el índice de vegetación y la fecha de la escena que se visualizará en el mapa.

#### Controles Disponibles

1. **Selector de Tipo de Índice**:
   - Dropdown con los índices disponibles:
     - **NDVI**: Normalized Difference Vegetation Index
     - **EVI**: Enhanced Vegetation Index
     - **SAVI**: Soil-Adjusted Vegetation Index
     - **GNDVI**: Green Normalized Difference Vegetation Index
     - **NDRE**: Normalized Difference Red Edge
   - Al cambiar el índice, el mapa se actualiza automáticamente

2. **Selector de Fecha de Sensado**:
   - Campo de fecha (date picker)
   - Permite seleccionar la fecha de la escena Sentinel-2 a visualizar
   - Solo muestra fechas de escenas disponibles

3. **Información del Índice**:
   - Panel informativo que muestra una descripción del índice seleccionado:
     - **NDVI**: "Measures vegetation health and density"
     - **EVI**: "Enhanced index that reduces atmospheric and soil effects"
     - **SAVI**: "Soil-adjusted index for areas with exposed soil"
     - **GNDVI**: "Uses green band, sensitive to chlorophyll content"
     - **NDRE**: "Uses red edge band, sensitive to crop stress"

#### Uso

1. Seleccione el índice deseado del dropdown
2. Seleccione la fecha de la escena del date picker
3. El mapa se actualizará automáticamente mostrando el índice seleccionado para esa fecha

### TimelineWidget (Widget de Línea de Tiempo)

Este componente aparece en el panel inferior del mapa y muestra una línea de tiempo horizontal con todas las escenas disponibles.

#### Funcionalidad

Proporciona una vista cronológica de todas las escenas Sentinel-2 disponibles para la entidad seleccionada (parcela agrícola).

#### Elementos Visuales

Cada escena se muestra como una tarjeta con:

1. **Fecha**:
   - Día del mes (número grande)
   - Mes (abreviado, ej: "Jan", "Feb")
   - Año (número pequeño)

2. **Indicador de Cobertura de Nubes**:
   - Icono de nube con color según cobertura:
     - Verde: < 10% nubes (excelente)
     - Amarillo: 10-30% nubes (bueno)
     - Naranja: 30-50% nubes (aceptable)
     - Rojo: > 50% nubes (mucha cobertura)
   - Porcentaje de cobertura de nubes

3. **Indicador de Selección**:
   - Punto verde debajo de la escena seleccionada
   - Borde verde y fondo verde claro en la tarjeta seleccionada

#### Interacción

- **Click en una Escena**: Selecciona esa escena y actualiza el mapa
- **Scroll Horizontal**: Desplácese para ver más escenas si hay muchas
- **Hover**: Las tarjetas muestran un tooltip con fecha completa y porcentaje de nubes

#### Información Inferior

Debajo de la línea de tiempo se muestra:

- **Fecha Seleccionada**: Fecha completa formateada (ej: "January 15, 2024")
- **Índice Actual**: El índice de vegetación que se está visualizando

#### Estados

- **Loading**: Muestra un spinner y mensaje "Loading available scenes..."
- **Error**: Muestra mensaje de error en rojo
- **Sin Escenas**: Muestra mensaje "No scenes available. Create a download job to fetch Sentinel-2 data."

### VegetationLayer (Capa en el Mapa)

Este componente renderiza la visualización de los índices de vegetación directamente en el mapa usando Deck.gl.

#### Funcionalidad

- Renderiza tiles de índices de vegetación como una capa superpuesta en el mapa
- Utiliza colores para representar los valores del índice:
  - Verde oscuro: Valores altos (vegetación saludable)
  - Amarillo: Valores medios
  - Rojo/Marrón: Valores bajos (vegetación estresada o suelo)

#### Características Técnicas

- **Lazy Loading**: Los tiles se cargan bajo demanda al hacer zoom/pan
- **Caché**: Los tiles se almacenan en Redis para acceso rápido
- **Rendimiento**: Optimizado para grandes áreas geográficas

#### Uso

La capa se activa automáticamente cuando:
1. Hay una escena seleccionada en el TimelineWidget
2. Hay un índice seleccionado en el VegetationLayerControl
3. La escena tiene índices calculados disponibles

---

## Flujo de Trabajo Completo

### Escenario 1: Primera Configuración y Descarga de Escenas

1. **Acceder al Módulo**:
   - Navegue a `/vegetation` en la plataforma
   - Se abrirá la pestaña "Configuration"

2. **Configurar Credenciales de Copernicus**:
   - Ingrese su Client ID y Client Secret
   - Haga clic en "Save Configuration"

3. **Configurar Parámetros de Procesamiento**:
   - Seleccione el índice por defecto (ej: NDVI)
   - Configure el umbral de nubes (ej: 20%)
   - Active "Auto-process downloaded scenes"

4. **Crear Trabajo de Descarga** (vía API o integración):
   - El sistema descargará escenas Sentinel-2 para las parcelas configuradas
   - Puede monitorear el progreso en "Recent Download Jobs"

5. **Verificar Descarga**:
   - En la tabla de trabajos, espere a que el estado sea "completed"
   - Verifique que el progreso sea 100%

6. **Visualizar en el Mapa**:
   - Navegue al visor de mapas
   - En el panel de controles, use "Vegetation Layer Control" para seleccionar índice y fecha
   - En el panel inferior, use el "Timeline Widget" para seleccionar escenas
   - El mapa mostrará la visualización del índice seleccionado

### Escenario 2: Análisis de Series Temporales

1. **Acceder a Analytics**:
   - En el módulo Vegetation Prime, cambie a la pestaña "Analytics"

2. **Revisar Estadísticas**:
   - Verifique cuántos trabajos están completados
   - Identifique trabajos fallidos si los hay

3. **Filtrar Trabajos**:
   - Use el selector de estado para ver solo trabajos "completed"

4. **Verificar Escenas Disponibles**:
   - En el mapa, el TimelineWidget mostrará todas las escenas disponibles
   - Las escenas se ordenan cronológicamente (más recientes primero)

5. **Comparar Diferentes Fechas**:
   - Seleccione diferentes escenas en el TimelineWidget
   - Observe los cambios en la visualización del mapa
   - Compare valores de índices entre diferentes fechas

### Escenario 3: Monitoreo de Límites de Uso

1. **Revisar Límites**:
   - En la pestaña "Configuration", revise la sección "Usage & Limits"

2. **Monitorear Uso de Hectáreas**:
   - Verifique cuántas hectáreas ha procesado este mes
   - Si está cerca del límite (90%+), planifique el uso restante

3. **Monitorear Uso de Trabajos**:
   - Verifique cuántos trabajos ha ejecutado hoy
   - Si está cerca del límite diario, espere hasta mañana o contacte al administrador

4. **Prevenir Errores 429**:
   - Si ve barras amarillas o rojas, reduzca el uso
   - El sistema rechazará nuevas solicitudes si excede los límites

---

## Índices de Vegetación Disponibles

### NDVI (Normalized Difference Vegetation Index)

- **Fórmula**: `(NIR - Red) / (NIR + Red)`
- **Rango**: -1 a 1 (típicamente 0 a 1)
- **Uso**: Mide la salud y densidad de la vegetación
- **Interpretación**:
  - > 0.6: Vegetación muy saludable y densa
  - 0.3 - 0.6: Vegetación moderada
  - < 0.3: Vegetación escasa o suelo desnudo
  - < 0: Agua o nubes

### EVI (Enhanced Vegetation Index)

- **Fórmula**: `2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))`
- **Rango**: -1 a 1
- **Uso**: Índice mejorado que reduce efectos atmosféricos y del suelo
- **Ventajas**: Más sensible que NDVI en áreas de alta biomasa
- **Interpretación**: Similar a NDVI pero con mejor contraste en vegetación densa

### SAVI (Soil-Adjusted Vegetation Index)

- **Fórmula**: `((NIR - Red) / (NIR + Red + L)) * (1 + L)`
- **Factor L**: 0.5 (ajuste de suelo)
- **Rango**: -1 a 1
- **Uso**: Ideal para áreas con suelo expuesto
- **Ventajas**: Compensa el efecto del brillo del suelo
- **Interpretación**: Similar a NDVI pero más preciso en áreas con poca cobertura vegetal

### GNDVI (Green Normalized Difference Vegetation Index)

- **Fórmula**: `(NIR - Green) / (NIR + Green)`
- **Rango**: -1 a 1
- **Uso**: Sensible al contenido de clorofila
- **Ventajas**: Mejor detección de estrés temprano en cultivos
- **Interpretación**: Valores altos indican alta concentración de clorofila

### NDRE (Normalized Difference Red Edge)

- **Fórmula**: `(NIR - RedEdge) / (NIR + RedEdge)`
- **Rango**: -1 a 1
- **Uso**: Sensible al estrés de cultivos y contenido de nitrógeno
- **Ventajas**: Detecta problemas antes que NDVI
- **Interpretación**: Valores altos indican cultivos saludables con buen contenido de nitrógeno

---

## Límites y Monetización

Vegetation Prime implementa un sistema de doble capa de límites para controlar el uso del módulo.

### Tipos de Límites

#### 1. Límite de Volumen (Hectáreas)

- **Período**: Mensual
- **Medición**: Suma de hectáreas procesadas en el mes actual
- **Almacenamiento**: PostgreSQL (tabla `vegetation_usage_stats`)
- **Validación**: Se verifica antes de crear cada trabajo

**Ejemplo**: Si su límite es 100 Ha/mes y ya procesó 95 Ha, solo podrá procesar 5 Ha más este mes.

#### 2. Límite de Frecuencia (Trabajos)

- **Período**: Diario
- **Medición**: Número de trabajos ejecutados hoy
- **Almacenamiento**: Redis (contador atómico con expiración diaria)
- **Validación**: Se verifica antes de crear cada trabajo

**Ejemplo**: Si su límite es 20 trabajos/día y ya ejecutó 18, solo podrá ejecutar 2 trabajos más hoy.

### Comportamiento al Exceder Límites

Si intenta crear un trabajo que excedería cualquiera de los límites:

1. **El sistema rechazará la solicitud** con un error HTTP 429 (Too Many Requests)
2. **Recibirá un mensaje de error** explicando qué límite se excedió
3. **Se mostrará información de uso actual** en la respuesta

### Sincronización de Límites

Los límites son gestionados por la plataforma Core y se sincronizan automáticamente con el módulo mediante el endpoint `/api/vegetation/admin/sync-limits`.

**No necesita configurar límites manualmente**; la plataforma los actualiza automáticamente según su plan.

### Límites por Defecto

Si no hay límites configurados para su tenant, el sistema usa límites seguros por defecto:

- **Volumen**: 10 Ha/día
- **Frecuencia**: 5 trabajos/día

Estos límites previenen abuso en cuentas gratuitas o sin configuración.

---

## Solución de Problemas

### Problema: El módulo redirige a la página de inicio

**Causas posibles**:
1. El módulo no está instalado para su tenant
2. El módulo no está activo en el marketplace
3. Error de carga del módulo

**Soluciones**:
1. Contacte al administrador para verificar la instalación del módulo
2. Verifique en la consola del navegador si hay errores de carga
3. Asegúrese de tener los permisos necesarios (Farmer, TenantAdmin, o PlatformAdmin)

### Problema: No se pueden descargar escenas Sentinel-2

**Causas posibles**:
1. Credenciales de Copernicus incorrectas o no configuradas
2. Límite de trabajos diarios excedido
3. Error en la conexión con Copernicus Data Space

**Soluciones**:
1. Verifique las credenciales en la página de Configuration
2. Revise los límites de uso en la sección "Usage & Limits"
3. Verifique el estado del trabajo en la tabla "Recent Download Jobs"
4. Si el trabajo falló, revise el mensaje de error en la columna "Message"

### Problema: No se visualizan índices en el mapa

**Causas posibles**:
1. No hay escenas disponibles para la parcela seleccionada
2. Los índices no han sido calculados para la escena
3. La escena seleccionada no tiene datos procesados

**Soluciones**:
1. Verifique en el TimelineWidget si hay escenas disponibles
2. Si no hay escenas, cree un trabajo de descarga primero
3. Si hay escenas pero no se visualizan, verifique que el trabajo de procesamiento esté completado
4. Asegúrese de que "Auto-process downloaded scenes" esté activado en la configuración

### Problema: Error HTTP 429 (Too Many Requests)

**Causa**: Ha excedido uno de los límites (volumen o frecuencia)

**Soluciones**:
1. Revise la sección "Usage & Limits" en Configuration
2. Espere hasta el siguiente período (día siguiente para frecuencia, mes siguiente para volumen)
3. Contacte al administrador para aumentar los límites de su plan

### Problema: Los trabajos permanecen en estado "pending"

**Causas posibles**:
1. Los workers de Celery no están ejecutándose
2. Hay un problema con la conexión a Redis
3. El trabajo está en cola esperando recursos

**Soluciones**:
1. Contacte al administrador del sistema
2. Verifique que los servicios de backend estén funcionando
3. Espere unos minutos; los trabajos pueden tardar en iniciarse si hay muchos en cola

### Problema: La barra de progreso no se actualiza

**Causa**: El trabajo puede estar procesando pero la actualización de estado no se refleja en tiempo real

**Soluciones**:
1. Haga clic en "Refresh" en la tabla de trabajos
2. Espere unos segundos y actualice la página
3. Los trabajos de descarga y procesamiento pueden tardar varios minutos

### Problema: No aparecen escenas en el TimelineWidget

**Causas posibles**:
1. No se han descargado escenas para la parcela seleccionada
2. La parcela no está correctamente asociada
3. Error al cargar las escenas

**Soluciones**:
1. Verifique que haya trabajos de descarga completados en Analytics
2. Asegúrese de que la parcela esté seleccionada en el mapa
3. Revise la consola del navegador para errores
4. Cree un nuevo trabajo de descarga si es necesario

---

## Glosario de Términos

- **Escena (Scene)**: Una imagen satelital Sentinel-2 completa que cubre un área específica en una fecha determinada
- **Índice de Vegetación**: Un valor calculado que representa el estado de la vegetación basado en bandas espectrales
- **Trabajo (Job)**: Una tarea asíncrona ejecutada en segundo plano (descarga, procesamiento, cálculo)
- **Tile**: Una porción pequeña de una imagen rasterizada optimizada para visualización en mapas
- **Tenant**: Una organización o cliente que usa la plataforma (multi-tenancy)
- **Parcela (AgriParcel)**: Una entidad FIWARE que representa un área agrícola
- **Cobertura de Nubes**: Porcentaje de la escena cubierto por nubes
- **Bandas Espectrales**: Diferentes longitudes de onda capturadas por el satélite (Red, NIR, Green, etc.)

---

## Soporte y Contacto

Para más información o soporte técnico:

- **Documentación del Módulo**: Consulte `README.md` en el repositorio
- **Guía de Desarrollo**: Consulte `docs/` para documentación técnica
- **Issues**: Reporte problemas en el repositorio de GitHub
- **Contacto**: nekazari@artotxiki.com

---

**Última actualización**: Versión 1.0.0

