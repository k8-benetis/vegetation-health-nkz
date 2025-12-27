# Docker Images - Vegetation Prime

This document explains how to use the pre-built Docker images from GitHub Container Registry (GHCR).

## Image Registry

All images are published to **GitHub Container Registry (GHCR)**:

- **Backend**: `ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend`
- **Frontend**: `ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend`

## Available Tags

### Latest (Recommended for Production)

```bash
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:latest
```

### Version Tags

When you create a Git tag (e.g., `v1.0.0`), images are automatically built and tagged:

```bash
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:v1.0.0
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:v1.0.0
```

### Branch Tags

Images are also tagged with branch names for development:

```bash
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:main
ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:develop
```

## Authentication

### Public Repository

If the repository is **public**, images are publicly accessible and no authentication is required:

```bash
docker pull ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
```

### Private Repository

If the repository is **private**, you need to authenticate:

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Or use GitHub CLI
gh auth token | docker login ghcr.io -u USERNAME --password-stdin
```

Where `GITHUB_TOKEN` is a Personal Access Token with `read:packages` permission.

## Usage

### Backend

```bash
docker run -d \
  --name vegetation-prime-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/nekazari" \
  -e MODULE_MANAGEMENT_KEY="your-secret-key" \
  -e CELERY_BROKER_URL="redis://redis:6379/0" \
  -e REDIS_CACHE_URL="redis://redis:6379/1" \
  -e JWT_ISSUER="https://auth.nekazari.com/realms/nekazari" \
  -e JWKS_URL="https://auth.nekazari.com/realms/nekazari/.well-known/jwks.json" \
  ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
```

### Frontend

```bash
docker run -d \
  --name vegetation-prime-frontend \
  -p 80:80 \
  ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:latest
```

### Docker Compose

Update `backend/docker-compose.yml` to use GHCR images:

```yaml
services:
  backend:
    image: ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
    # ... rest of configuration
```

## Building Images Locally

If you prefer to build images locally:

```bash
# Backend
cd backend
docker build -t vegetation-prime-backend:local .

# Frontend
cd frontend
docker build -t vegetation-prime-frontend:local .
```

## Automatic Publishing

Images are automatically built and published when:

1. **Push to `main` branch**: Creates `latest` tag
2. **Push to `develop` branch**: Creates `develop` tag
3. **Create Git tag** (e.g., `v1.0.0`): Creates version tags
4. **Pull Request**: Builds images but doesn't publish (for testing)

## Viewing Published Images

1. Go to your repository on GitHub
2. Click on "Packages" (right sidebar)
3. You'll see both `vegetation-prime-backend` and `vegetation-prime-frontend` packages

Or visit directly:
- https://github.com/k8-benetis/vegetation-health-nkz/pkgs/container/vegetation-prime-backend
- https://github.com/k8-benetis/vegetation-health-nkz/pkgs/container/vegetation-prime-frontend

## Kubernetes Deployment

Update your Kubernetes manifests to use GHCR images:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vegetation-prime-backend
spec:
  template:
    spec:
      containers:
      - name: api
        image: ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest
        # ... rest of configuration
```

## Troubleshooting

### Error: "unauthorized: authentication required"

**Solution**: Authenticate with GHCR (see Authentication section above)

### Error: "manifest unknown"

**Solution**: The image tag doesn't exist. Check available tags:
```bash
# List all tags (requires authentication for private repos)
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://ghcr.io/v2/k8-benetis/vegetation-health-nkz/vegetation-prime-backend/tags/list
```

### Images not updating

**Solution**: 
1. Check GitHub Actions workflow ran successfully
2. Verify you're using the correct tag
3. Pull the latest image: `docker pull ghcr.io/.../vegetation-prime-backend:latest`

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/docker-publish.yml`) automatically:
- Builds multi-arch images (amd64, arm64)
- Uses build cache for faster builds
- Publishes to GHCR on push/tag
- Skips publishing on pull requests (builds only)

No additional configuration needed - it works out of the box!



