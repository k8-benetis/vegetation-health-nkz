# Guía para Subir el Proyecto a GitHub

## Pasos a Seguir

### 1. Crear el Repositorio en GitHub

1. Ve a [GitHub](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (arriba derecha) → **"New repository"**
3. Configura el repositorio:
   - **Repository name**: `vegetation-health-nkz`
   - **Description**: `High-performance vegetation intelligence suite for Nekazari Platform`
   - **Visibility**: Público o Privado (según prefieras)
   - **NO marques**: "Add a README file" (ya tenemos uno)
   - **NO marques**: "Add .gitignore" (ya tenemos uno)
   - **NO marques**: "Choose a license" (ya tenemos LICENSE)
4. Haz clic en **"Create repository"**

### 2. Inicializar Git Localmente

```bash
# Navega a la carpeta del proyecto
cd /home/g/Documents/nekazari-module-vegetation-health

# Inicializa git (si no está inicializado)
git init

# Verifica el estado
git status
```

### 3. Verificar .gitignore

El archivo `.gitignore` ya está configurado para excluir:
- ✅ `/documents/` (carpeta completa)
- ✅ `node_modules/`
- ✅ `__pycache__/` y archivos `.pyc`
- ✅ `.env` y archivos de entorno
- ✅ `dist/` y archivos de build
- ✅ Archivos temporales y logs

**Verifica que no haya archivos sensibles:**
```bash
# Ver qué archivos se van a subir
git status

# Si ves algún archivo que NO debería subirse, añádelo al .gitignore
```

### 4. Añadir Archivos y Hacer Commit

```bash
# Añadir todos los archivos (respetando .gitignore)
git add .

# Ver qué se va a commitear
git status

# Hacer el commit inicial
git commit -m "Initial commit: Vegetation Prime v1.0.0

- Multi-spectral index calculation (NDVI, EVI, SAVI, GNDVI, NDRE)
- Sentinel-2 L2A integration via Copernicus Data Space Ecosystem
- Asynchronous job processing with Celery + Redis
- High-performance tile serving with lazy caching
- FIWARE NGSI-LD integration
- Multi-tenant architecture with Row Level Security
- Monetization system with usage tracking
- Docker and Kubernetes deployment ready"
```

### 5. Conectar con GitHub y Subir

```bash
# Añadir el remoto (reemplaza 'k8-benetis' si es diferente)
git remote add origin https://github.com/k8-benetis/vegetation-health-nkz.git

# Verificar que se añadió correctamente
git remote -v

# Subir a GitHub (primera vez)
git branch -M main
git push -u origin main
```

### 6. Verificar en GitHub

1. Ve a tu repositorio: `https://github.com/k8-benetis/vegetation-health-nkz`
2. Verifica que:
   - ✅ README.md se muestra correctamente
   - ✅ LICENSE aparece
   - ✅ Todos los archivos están presentes
   - ✅ La carpeta `documents/` NO aparece (está en .gitignore)

### 7. (Opcional) Configurar GitHub Pages o Topics

**Topics (etiquetas)** para mejorar la visibilidad:
- `nekazari`
- `vegetation-analysis`
- `sentinel-2`
- `agriculture`
- `fiware`
- `fastapi`
- `react`
- `postgis`
- `agpl-3.0`

**Para añadir topics:**
1. Ve a tu repositorio en GitHub
2. Haz clic en el engranaje ⚙️ (junto a "About")
3. Añade los topics en "Topics"

---

## Checklist Pre-Subida

Antes de hacer `git push`, verifica:

- [ ] `.gitignore` incluye `/documents/`
- [ ] No hay archivos `.env` o con secretos
- [ ] No hay `node_modules/` o `__pycache__/`
- [ ] README.md está actualizado y profesional
- [ ] LICENSE está presente (AGPL-3.0)
- [ ] CHANGELOG.md está actualizado
- [ ] No hay archivos temporales o de log

---

## Verificar Archivos que se Subirán

```bash
# Ver qué archivos se añadirán (sin hacer commit)
git add --dry-run .

# Ver el tamaño de los archivos
du -sh *

# Ver archivos grandes (>1MB)
find . -type f -size +1M -not -path "./.git/*" -not -path "./node_modules/*"
```

---

## Si Algo Sale Mal

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/k8-benetis/vegetation-health-nkz.git
```

### Error: "failed to push some refs"
```bash
# Si GitHub creó un README automáticamente
git pull origin main --allow-unrelated-histories
# Resuelve conflictos si los hay
git push -u origin main
```

### Quieres eliminar un archivo ya subido
```bash
# Añádelo a .gitignore
echo "archivo-sensible.txt" >> .gitignore

# Elimínalo del repositorio (pero manténlo localmente)
git rm --cached archivo-sensible.txt

# Commit y push
git commit -m "Remove sensitive file"
git push
```

---

## Próximos Pasos Después de Subir

1. **Añadir descripción al repositorio** en GitHub
2. **Configurar Topics** (ver arriba)
3. **Añadir un icono/banner** (opcional)
4. **Configurar GitHub Actions** (CI/CD ya está configurado en `.github/workflows/ci.yml`)
5. **Crear releases** cuando publiques nuevas versiones

---

## Listo

Tu repositorio debería verse profesional con:
- README.md con badges y documentación completa
- LICENSE (AGPL-3.0)
- CHANGELOG.md
- CONTRIBUTING.md
- Templates para Issues y Pull Requests
- GitHub Actions para CI/CD
- .gitignore completo

