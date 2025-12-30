# Multi-stage build for Vegetation Prime Frontend
# Stage 1: Build with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy SDK from local directory (must be copied to build context before docker build)
# This allows using the SDK with latest fixes without publishing to npm
COPY local-sdk ./local-sdk

# Temporarily update package.json to use local SDK path
RUN sed -i 's|"file:../nekazari-public/packages/sdk"|"file:./local-sdk"|' package.json

# Install dependencies (including local SDK)
RUN npm install && \
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
