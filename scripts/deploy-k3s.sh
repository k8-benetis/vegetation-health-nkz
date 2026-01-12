#!/bin/bash
# ==============================================================================
# K3s Deployment Script for Vegetation Prime
# ==============================================================================
# Solves the "Docker vs K3s Registry" issue by manually importing the image.
#
# Usage: ./scripts/deploy-k3s.sh
# Run this on the PRODUCTION SERVER (ssh g@...)
# ==============================================================================

set -e # Exit on error

# Configuration
IMAGE_NAME="vegetation-prime-frontend"
TAG="stable"
DEPLOYMENT="vegetation-prime-frontend"
NAMESPACE="nekazari"
TAR_PATH="/tmp/${IMAGE_NAME}.tar"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}[1/4] Building Docker Image...${NC}"
# Build from the root context using frontend/Dockerfile
docker build -t "${IMAGE_NAME}:${TAG}" -f frontend/Dockerfile .

echo -e "${CYAN}[2/4] Exporting Image for K3s...${NC}"
# Save docker image to a tar file so K3s can read it
docker save "${IMAGE_NAME}:${TAG}" -o "${TAR_PATH}"

echo -e "${CYAN}[3/4] Importing to K3s Registry...${NC}"
# Import the tar file into K3s's containerd registry
sudo k3s ctr images import "${TAR_PATH}" --digests

echo -e "${CYAN}[4/4] Restarting Pods...${NC}"
# Force a rollout restart to pick up the new image
sudo kubectl rollout restart deployment "${DEPLOYMENT}" -n "${NAMESPACE}"

# Cleanup
rm "${TAR_PATH}"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "Watch verification: ${YELLOW}sudo kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT} -w${NC}"
