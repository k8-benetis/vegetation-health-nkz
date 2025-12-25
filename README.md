# Vegetation Prime

<div align="center">

**High-performance vegetation intelligence suite for the Nekazari Platform**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

</div>

---

## Overview

**Vegetation Prime** is a production-ready external module for the [Nekazari Platform](https://nekazari.artotxiki.com) that provides advanced vegetation health monitoring using Sentinel-2 L2A satellite imagery. It offers real-time spectral index calculation, historical time series analysis, and high-performance map visualization.

### Key Features

- **Multi-spectral Index Calculation**: NDVI, EVI, SAVI, GNDVI, NDRE, and custom formulas
- **Sentinel-2 L2A Integration**: Automated scene download and processing via Copernicus Data Space Ecosystem
- **Time Series Analysis**: Historical vegetation trend visualization with interactive timelines
- **High-Performance Visualization**: Deck.gl-based raster rendering with lazy tile caching
- **Asynchronous Processing**: Celery-based job queue for long-running tasks
- **Multi-tenant Architecture**: Row Level Security (RLS) for complete tenant isolation
- **Monetization Ready**: Double-layer limits (volume + frequency) with usage tracking
- **FIWARE Compatible**: Full NGSI-LD integration with Smart Data Models

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- PostgreSQL with PostGIS (or use the service in docker-compose)
- Redis (or use the service in docker-compose)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/k8-benetis/vegetation-health-nkz.git
cd vegetation-health-nkz

# 2. Start backend services
cd backend
docker-compose up -d

# 3. Verify health check
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"vegetation-prime"}

# 4. Build frontend
cd ..
npm install
npm run build
```

### Initial Configuration

1. **Access Config Page**: Navigate to `/vegetation/config` in Nekazari Platform
2. **Configure Copernicus Credentials**:
   - Client ID
   - Client Secret
   - Default Index Type (NDVI, EVI, etc.)
3. **Verify Jobs**: Check "Recent Download Jobs" table for download status

---

## Architecture

### Backend (Python/FastAPI)

- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with PostGIS extension
- **Task Queue**: Celery + Redis
- **Storage**: S3/MinIO abstraction layer
- **Authentication**: JWT (RS256) with Keycloak compatibility
- **Migrations**: PostgreSQL Advisory Locks for safe concurrent migrations

### Frontend (React/Vite)

- **Module Federation**: Remote module loading via `@originjs/vite-plugin-federation`
- **UI Framework**: React 18 with TypeScript
- **Map Library**: Deck.gl with Mapbox overlay
- **Styling**: Tailwind CSS + `@nekazari/ui-kit`
- **State Management**: React Context API

---

## Project Structure

```
vegetation-health-nkz/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── middleware/       # Auth, limits, service auth
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   └── tasks/            # Celery tasks
│   ├── migrations/           # SQL migrations with RLS
│   ├── scripts/              # Migration runner
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API clients
│   │   └── types/            # TypeScript definitions
│   ├── Dockerfile
│   └── vite.config.ts
├── k8s/
│   └── registration.sql       # K8s module registration
├── LICENSE                    # AGPL-3.0
├── manifest.json              # Module metadata
└── README.md
```

---

## API Endpoints

### Jobs
- `POST /api/vegetation/jobs` - Create processing job
- `GET /api/vegetation/jobs/{job_id}` - Get job status
- `GET /api/vegetation/jobs` - List jobs

### Indices
- `GET /api/vegetation/indices` - Get vegetation indices (GeoJSON/XYZ)
- `GET /api/vegetation/timeseries` - Get time series data
- `POST /api/vegetation/calculate` - Calculate index for scene
- `GET /api/vegetation/tiles/{z}/{x}/{y}.png` - Get map tile (lazy caching)

### Configuration
- `GET /api/vegetation/config` - Get tenant configuration
- `POST /api/vegetation/config` - Update tenant configuration

### Usage & Limits
- `GET /api/vegetation/usage/current` - Get current usage statistics
- `POST /api/vegetation/admin/sync-limits` - Sync limits from Core Platform

---

## Security

- **Authentication**: JWT tokens validated against Keycloak JWKS endpoint
- **Authorization**: Tenant ID extracted from `X-Tenant-ID` header
- **Row Level Security**: All database queries filtered by tenant
- **Service Auth**: `X-Service-Auth` header for Core Platform → Module communication
- **Formula Safety**: Custom formulas evaluated using `simpleeval` (no `eval()`)

---

## Monetization

The module implements **double-layer limits** for monetization:

### Volume Limits (Hectares)
- **Monthly limit**: Configurable per plan (default: 10 Ha/month)
- **Daily limit**: Configurable per plan (default: 5 Ha/day)
- **Tracking**: Calculated from job bounds using PostGIS/Shapely

### Frequency Limits (Jobs per Day)
- **Daily jobs limit**: Configurable per plan (default: 5 jobs/day)
- **Per job type**: Separate limits for download/process/calculate
- **Implementation**: Redis atomic counters with daily TTL

### Limit Synchronization
- **Push model**: Core Platform pushes limits via `POST /api/vegetation/admin/sync-limits`
- **Fallback**: Safe defaults if limits not synced
- **Validation**: Limits checked BEFORE job creation (HTTP 429 if exceeded)

---

## Development

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/nekazari"
export CELERY_BROKER_URL="redis://localhost:6379/0"
export REDIS_CACHE_URL="redis://localhost:6379/1"

# Run migrations
python scripts/run_migrations.py

# Start FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info
```

### Frontend Setup

```bash
npm install
npm run dev        # Development server
npm run build      # Production build
npm run typecheck  # TypeScript validation
```

---

## Docker Deployment

### Using Pre-built Images (Recommended)

Images are automatically built and published to **GitHub Container Registry (GHCR)**:

```bash
# Backend
docker run -d \
  --name vegetation-prime-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/nekazari" \
  -e MODULE_MANAGEMENT_KEY="your-secret-key" \
  -e CELERY_BROKER_URL="redis://redis:6379/0" \
  -e REDIS_CACHE_URL="redis://redis:6379/1" \
  ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-backend:latest

# Frontend
docker run -d \
  --name vegetation-prime-frontend \
  -p 80:80 \
  ghcr.io/k8-benetis/vegetation-health-nkz/vegetation-prime-frontend:latest
```

**Available tags**: `latest`, `v1.0.0`, `main`, `develop`

See [Docker Images Documentation](docs/DOCKER_IMAGES.md) for details.

### Building Locally

```bash
# Backend
cd backend
docker build -t vegetation-prime-backend:local .

# Frontend
cd frontend
docker build -t vegetation-prime-frontend:local .
```

### Docker Compose (Full Stack)

```bash
cd backend
docker-compose up -d
```

---

## Kubernetes Deployment

1. **Register Module**: Execute `k8s/registration.sql` in Core Platform database
2. **Deploy Backend**: Apply Kubernetes manifests (Core Platform manages secrets)
3. **Deploy Frontend**: Serve static assets via Nginx or CDN
4. **Verify**: Check module appears in Nekazari marketplace

**Note**: Environment variables (including `MODULE_MANAGEMENT_KEY`) are automatically injected by the Core Platform's orchestration system.

---

## Database Schema

The module creates the following tables with Row Level Security (RLS):

- `vegetation_config` - Tenant configuration
- `vegetation_jobs` - Processing job tracking
- `vegetation_scenes` - Sentinel-2 scene metadata
- `vegetation_indices_cache` - Pre-calculated index values
- `vegetation_custom_formulas` - User-defined formulas
- `vegetation_plan_limits` - Plan limits (synced from Core)
- `vegetation_usage_stats` - Monthly aggregated usage
- `vegetation_usage_log` - Detailed usage log

All tables include:
- `tenant_id` for multi-tenancy
- `created_at` and `updated_at` timestamps
- RLS policies for tenant isolation

---

## Configuration

### Environment Variables

#### Required (Injected by Core Platform in Production)
- `MODULE_MANAGEMENT_KEY` - Service-to-service authentication key
- `DATABASE_URL` - PostgreSQL connection string
- `CELERY_BROKER_URL` - Redis URL for Celery
- `REDIS_CACHE_URL` - Redis URL for tile cache
- `JWT_ISSUER` - Keycloak issuer URL
- `JWKS_URL` - Keycloak JWKS endpoint

#### Optional (With Defaults)
- `LOG_LEVEL` - Logging level (default: `INFO`)
- `DEFAULT_MONTHLY_HA_LIMIT` - Fallback monthly limit (default: `10.0`)
- `DEFAULT_DAILY_HA_LIMIT` - Fallback daily limit (default: `5.0`)
- `S3_ENDPOINT_URL` - S3/MinIO endpoint (if not AWS)
- `S3_BUCKET` - Default bucket name (default: `vegetation-prime`)

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

See [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Support

For issues, questions, or contributions:
- **Issues**: [GitHub Issues](https://github.com/k8-benetis/vegetation-health-nkz/issues)
- **Email**: nekazari@artotxiki.com

---

## Acknowledgments

- **Nekazari Platform** - For the modular architecture and SDK
- **Copernicus Data Space Ecosystem** - For Sentinel-2 L2A data access
- **FIWARE** - For Smart Data Models and NGSI-LD standards
- **Deck.gl** - For high-performance map visualization

---

<div align="center">

**Made for the Nekazari Platform**

[Website](https://nekazari.artotxiki.com) • [Documentation](https://docs.nekazari.com) • [License](LICENSE)

</div>
