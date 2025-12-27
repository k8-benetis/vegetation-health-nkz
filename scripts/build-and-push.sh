#!/bin/bash
# Build and push Docker images to GHCR locally
# This allows you to see logs in real-time and test before pushing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
OWNER="k8-benetis"
REPO="vegetation-health-nkz"
VERSION="${1:-latest}"

echo -e "${GREEN}Building and pushing Docker images to GHCR${NC}"
echo -e "Registry: ${REGISTRY}"
echo -e "Owner: ${OWNER}"
echo -e "Repository: ${REPO}"
echo -e "Version/Tag: ${VERSION}"
echo ""

# Check if user is logged in to GHCR
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}Warning: Not logged in to Docker. Attempting to login to GHCR...${NC}"
    echo "You'll need a GitHub Personal Access Token with 'write:packages' permission"
    echo "Get one at: https://github.com/settings/tokens"
    echo ""
    read -p "Enter your GitHub username: " GITHUB_USERNAME
    read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
    echo ""
    echo "$GITHUB_TOKEN" | docker login "$REGISTRY" -u "$GITHUB_USERNAME" --password-stdin
fi

# Build Backend
echo -e "${GREEN}Building backend image...${NC}"
cd backend
docker build \
    -t "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:${VERSION}" \
    -t "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:latest" \
    -f Dockerfile \
    .

echo -e "${GREEN}Backend image built successfully!${NC}"
echo ""

# Build Frontend
echo -e "${GREEN}Building frontend image...${NC}"
cd ../frontend
docker build \
    -t "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:${VERSION}" \
    -t "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:latest" \
    -f Dockerfile \
    --build-arg NODE_ENV=production \
    ..

echo -e "${GREEN}Frontend image built successfully!${NC}"
echo ""

# Ask if user wants to push
read -p "Do you want to push images to GHCR? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Pushing backend image...${NC}"
    docker push "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:${VERSION}"
    docker push "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:latest"
    
    echo -e "${GREEN}Pushing frontend image...${NC}"
    docker push "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:${VERSION}"
    docker push "${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:latest"
    
    echo ""
    echo -e "${GREEN}All images pushed successfully!${NC}"
    echo ""
    echo "Images available at:"
    echo "  - ${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:${VERSION}"
    echo "  - ${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:${VERSION}"
else
    echo -e "${YELLOW}Images built but not pushed. You can push them later with:${NC}"
    echo "  docker push ${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-backend:${VERSION}"
    echo "  docker push ${REGISTRY}/${OWNER}/${REPO}/vegetation-prime-frontend:${VERSION}"
fi

cd ..



