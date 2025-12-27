# Docker Build Guide - Local vs Automated

This guide explains when to build Docker images locally vs using GitHub Actions.

## Two Approaches

### 1. Local Build (Recommended for Development)

**When to use:**
- During development and testing
- When you need to see build logs in real-time
- When debugging build issues
- When you want to test before pushing

**How to use:**

```bash
# Build and push to GHCR (interactive)
./scripts/build-and-push.sh v1.0.0

# Or just build locally (no push)
./scripts/build-local.sh local
```

**Benefits:**
- Real-time logs
- Immediate feedback
- Easy debugging
- Test before pushing

**Requirements:**
- Docker installed locally
- GitHub Personal Access Token (for pushing)
- Sufficient disk space

### 2. Automated Build (GitHub Actions)

**When to use:**
- Production releases
- Automated CI/CD
- Multi-architecture builds (amd64 + arm64)
- When you want hands-off automation

**How it works:**
- Automatically triggers on push to `main` or `develop`
- Builds and pushes to GHCR automatically
- Creates tags based on branch or Git tags

**Benefits:**
- Fully automated
- Multi-arch support
- Build cache optimization
- No local resources needed

## Comparison

| Feature | Local Build | GitHub Actions |
|---------|-------------|----------------|
| Real-time logs | ✅ Yes | ❌ No (view in Actions tab) |
| Multi-arch | ❌ No (single arch) | ✅ Yes (amd64 + arm64) |
| Build cache | ✅ Yes | ✅ Yes (GitHub Actions cache) |
| Automation | ❌ Manual | ✅ Automatic |
| Debugging | ✅ Easy | ⚠️ View logs after |
| Speed | ✅ Fast (local) | ⚠️ Depends on queue |
| Cost | Free | Free (for public repos) |

## Recommended Workflow

### Development Phase
1. Build locally: `./scripts/build-local.sh dev`
2. Test locally: `docker run ...`
3. Fix issues and rebuild
4. When ready, push to GHCR: `./scripts/build-and-push.sh dev`

### Production Release
1. Create Git tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. GitHub Actions automatically builds and publishes
4. Images available at `ghcr.io/.../vegetation-prime-backend:v1.0.0`

## Authentication for GHCR

### First Time Setup

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `write:packages`, `read:packages`
   - Generate and copy token

2. **Login to GHCR:**
   ```bash
   echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

3. **Or use GitHub CLI:**
   ```bash
   gh auth token | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

### Using the Script

The `build-and-push.sh` script will prompt you for credentials if not logged in.

## Troubleshooting

### Build fails locally

```bash
# Check Docker is running
docker ps

# Check disk space
df -h

# Clean up old images
docker system prune -a
```

### Push fails (authentication)

```bash
# Re-login
docker logout ghcr.io
docker login ghcr.io -u YOUR_USERNAME
```

### Multi-arch builds

For multi-architecture builds (amd64 + arm64), you need to use GitHub Actions or Docker Buildx:

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/............:latest \
  --push \
  ./backend
```

## Best Practices

1. **Development**: Use local builds for quick iteration
2. **Testing**: Build locally, test, then push
3. **Production**: Use GitHub Actions for automated releases
4. **Versioning**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
5. **Tags**: Always tag with version + `latest`

## Summary

- **Local builds**: Better for development, debugging, real-time feedback
- **GitHub Actions**: Better for production, automation, multi-arch

Use both! Local for development, automated for releases.



