# Multi-stage build for Vegetation Prime Frontend
# Stage 1: Build with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy SDK from parent repo to use latest version
# This allows using the SDK with latest fixes without publishing to npm
# Note: Build context must include the SDK directory
COPY ../nekazari-public/packages/sdk ./local-sdk

# Install dependencies
# Install local SDK first, then install other dependencies
RUN npm install ./local-sdk && \
    npm ci && \
    rm -rf ./local-sdk

# Copy all necessary files for build
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY manifest.json ./

# Build application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (with CORS and module path support)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
