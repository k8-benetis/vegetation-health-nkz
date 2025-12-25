# Opciones para Publicar Imágenes Docker

## Diferencia Importante

**Git Push ≠ Docker Push**

- `git push`: Sube **código fuente** al repositorio
- `docker push`: Sube **imágenes Docker** al registro (GHCR)

## Opción 1: Subir Imágenes Locales a GHCR (Recomendado Ahora)

Ya tienes las imágenes construidas localmente. Puedes subirlas directamente:

```bash
# 1. Autenticarse
echo 'TU_TOKEN' | docker login ghcr.io -u k8-benetis --password-stdin

# 2. Subir imágenes
docker push ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
docker push ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:latest
```

**Ventajas:**
- ✅ Rápido (imágenes ya construidas)
- ✅ Usas las imágenes que probaste localmente
- ✅ Control total sobre la versión

**Desventajas:**
- ❌ Solo arquitectura local (amd64, no arm64)
- ❌ Manual (tienes que hacerlo cada vez)

---

## Opción 2: GitHub Actions Automático (Para Releases)

El workflow configurado **solo se ejecuta en tags**:

```bash
# Crear tag de release
git tag v1.0.0
git push origin v1.0.0
```

**Ventajas:**
- ✅ Multi-arch (amd64 + arm64)
- ✅ Automático
- ✅ Reproducible

**Desventajas:**
- ❌ Solo en tags (no en cada push)
- ❌ Tarda más (construye desde cero)

---

## Opción 3: Disparar Manualmente GitHub Actions

Puedes disparar el workflow manualmente desde GitHub:

1. Ve a: https://github.com/k8-benetis/vegetation-health-nkz/actions
2. Click en "Build and Publish Docker Images"
3. Click "Run workflow"
4. Introduce versión (ej: `v1.0.0`)
5. Run

**Ventajas:**
- ✅ Multi-arch
- ✅ Sin crear tag
- ✅ Control manual

---

## Recomendación para Tu Caso

**Para probar ahora en la plataforma:**

1. **Sube las imágenes locales a GHCR** (Opción 1)
   - Ya están construidas y probadas
   - Rápido y directo

2. **Para releases futuros:**
   - Usa tags → GitHub Actions (Opción 2)
   - O dispara manualmente (Opción 3)

---

## ¿Qué Pasa si Haces Solo `git push`?

Si haces `git push` sin tag:
- ✅ El código se sube al repositorio
- ❌ **NO se construyen imágenes automáticamente**
- ❌ Las imágenes Docker no se publican

**Para que GitHub Actions construya:**
- Crea un tag: `git tag v1.0.0 && git push origin v1.0.0`
- O dispara manualmente desde la UI

---

## Resumen

| Acción | Resultado |
|--------|-----------|
| `git push` | Solo código, no imágenes |
| `git push --tags` | Código + GitHub Actions construye imágenes |
| `docker push` | Sube imágenes locales a GHCR |
| GitHub Actions (manual) | Construye imágenes desde código |

**Para tu caso ahora:** Usa `docker push` con las imágenes locales.

