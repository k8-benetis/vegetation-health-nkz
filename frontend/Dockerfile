# Multi-stage build for Vegetation Prime Frontend
# Stage 1: Build with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy all necessary files for build
COPY src/ ./src/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY postcss.config.cjs ./ 2>/dev/null || true
COPY manifest.json ./

# Build application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (with CORS)
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # CORS headers for Module Federation \
    add_header Access-Control-Allow-Origin * always; \
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always; \
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always; \
    \
    # Handle preflight requests \
    if ($request_method = OPTIONS) { \
        return 204; \
    } \
    \
    # Serve static files \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
