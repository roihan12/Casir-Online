#!/bin/bash

################################################################################
# Start Services Script
# This script starts all services after images are built
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Starting Casir-Online Services"
echo -e "==========================================${NC}"
echo ""

# Load environment
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Starting all services..."
echo ""

# Start services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo ""
echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo "Waiting for services to be ready..."
echo ""

# Wait for key services
echo "⏳ Waiting for PostgreSQL..."
sleep 5

echo "⏳ Waiting for Redis..."
sleep 3

echo "⏳ Waiting for Server..."
sleep 10

echo "⏳ Waiting for Client..."
sleep 5

echo ""
echo "🔍 Checking service status..."
docker compose -f docker-compose.prod.yml --env-file .env.production ps

echo ""
echo "✅ Services are running!"
echo ""
echo "📍 Access URLs:"
echo "  - Frontend:  https://casir.local"
echo "  - API:       https://casir.local/api"
echo "  - Grafana:   https://grafana.local (or http://localhost:3001)"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "📊 Next steps:"
echo "  1. Check logs: docker compose -f docker-compose.prod.yml logs -f"
echo "  2. Run migrations: ./scripts/migrate.sh"
echo "  3. Check health: curl https://casir.local/health"
