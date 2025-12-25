# Build Strategy - Local vs Automated

## Current Strategy: Hybrid Approach

We use a **hybrid approach** that combines the best of both worlds:

### Local Builds (Development)
- **Use for**: Development, testing, debugging
- **Script**: `./scripts/build-and-push.sh`
- **Benefits**: Real-time logs, immediate feedback, easy debugging

### Automated Builds (Production)
- **Use for**: Official releases
- **Trigger**: Git tags (e.g., `v1.0.0`)
- **Benefits**: Multi-arch, automated, hands-off

## Why This Approach?

### Problem with Always-On Automated Builds
- Builds fail frequently during development
- Wastes CI/CD minutes
- Hard to debug (logs after the fact)
- Slows down development iteration

### Solution: Tag-Based Builds
- **Development**: Build locally, see logs in real-time
- **Releases**: Tag version → GitHub Actions builds automatically
- **Best of both**: Fast development + automated releases

## Workflow

### Daily Development
```bash
# 1. Make changes
git add .
git commit -m "Fix bug"

# 2. Build and test locally (with logs)
./scripts/build-local.sh dev

# 3. Test the image
docker run -p 8000:8000 vegetation-prime-backend:dev

# 4. If good, push to GHCR
./scripts/build-and-push.sh dev
```

### Production Release
```bash
# 1. Tag the release
git tag v1.0.0
git push origin v1.0.0

# 2. GitHub Actions automatically:
#    - Builds images (amd64 + arm64)
#    - Publishes to GHCR
#    - Tags as v1.0.0, v1.0, v1, latest
```

## Manual Trigger (If Needed)

You can also trigger builds manually from GitHub Actions UI:
1. Go to "Actions" tab
2. Select "Build and Publish Docker Images"
3. Click "Run workflow"
4. Enter version tag (e.g., `v1.0.0`)
5. Run

## Configuration

### Docker Build Workflow
- **File**: `.github/workflows/docker-publish.yml`
- **Triggers**: 
  - Git tags (`v*.*.*`)
  - Manual workflow dispatch
- **Disabled on**: Regular pushes to `main`/`develop` (to avoid constant builds)

### Local Build Scripts
- **File**: `scripts/build-and-push.sh`
- **File**: `scripts/build-local.sh`
- **Usage**: See [Docker Build Guide](DOCKER_BUILD.md)

## Summary

| Scenario | Method | Why |
|----------|--------|-----|
| Development | Local build | Real-time logs, fast iteration |
| Testing | Local build → push | Test before release |
| Production | Git tag → Auto | Multi-arch, automated |
| Hotfix | Local build → push | Fast deployment |

This gives you **control during development** and **automation for releases**.

