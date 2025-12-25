# Changelog

All notable changes to the Vegetation Prime module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added
- Initial release of Vegetation Prime module
- Multi-spectral index calculation (NDVI, EVI, SAVI, GNDVI, NDRE)
- Custom formula engine with secure evaluation
- Sentinel-2 L2A integration via Copernicus Data Space Ecosystem
- Asynchronous job processing with Celery + Redis
- High-performance tile serving with lazy caching
- Time series analysis and visualization
- FIWARE NGSI-LD integration
- Multi-tenant architecture with Row Level Security (RLS)
- Monetization system with double-layer limits (volume + frequency)
- Usage tracking and statistics
- Service-to-service authentication (`X-Service-Auth`)
- PostgreSQL Advisory Locks for safe concurrent migrations
- Docker Compose setup for local development
- Kubernetes deployment manifests
- Module Federation integration for Nekazari Platform
- Frontend components: ConfigPage, AnalyticsPage, TimelineWidget, VegetationLayer
- Comprehensive API documentation
- Database migrations with rollback scripts

### Security
- JWT authentication with Keycloak compatibility
- Row Level Security (RLS) on all database tables
- Service authentication for Core Platform communication
- Secure formula evaluation (no `eval()`)
- Constant-time string comparison for API key validation

### Performance
- Lazy tile caching with Redis (50-200ms → <10ms)
- Vectorized NumPy operations for colormap application
- Asynchronous FastAPI endpoints
- Connection pooling for database and Redis
- Optimized PostGIS queries

---

## [Unreleased]

### Planned
- AI-powered vegetation trend prediction (ARIMA/Prophet)
- Additional vegetation indices (NDWI, NDMI, etc.)
- Batch processing for multiple parcels
- Export functionality (PDF reports, CSV data)
- Advanced analytics dashboard
- Webhook support for job completion notifications
