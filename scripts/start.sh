#!/bin/bash

################################################################################
# Casir-Online Production Startup Script
# This script starts all services in production mode
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================="
echo "Casir-Online Production Startup"
echo -e "==================================${NC}"
echo ""

# Load environment variables
if [ -f ".env.production" ]; then
    echo "Loading environment variables..."
    set -a
    source .env.production
    set +a
    echo -e "${GREEN}✓ Environment loaded${NC}"
else
    echo "Warning: .env.production not found"
    echo "Creating from .env.example..."
    cp .env.example .env.production
    echo "Please edit .env.production with your production values"
fi

echo ""
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}✓ Services started${NC}"
echo ""
echo "Waiting for services to be ready..."

# Wait for key services
echo "Waiting for PostgreSQL..."
sleep 5

echo "Waiting for Redis..."
sleep 3

echo "Waiting for Server..."
sleep 5

echo "Waiting for Client..."
sleep 3

echo ""
echo -e "${GREEN}=================================="
echo "Services are now running!"
echo -e "==================================${NC}"
echo ""
echo "Access the application at:"
echo "  Frontend:  https://casir.local"
echo "  API:       https://casir.local/api"
echo "  Grafana:   https://grafana.local (or http://localhost:3001)"
echo "  Prometheus: http://localhost:9090"
echo ""
echo "To view logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To stop services:"
echo "  docker compose -f docker-compose.prod.yml down"
