#!/bin/bash

################################################################################
# Deployment Monitoring Script
# Monitors the deployment process in real-time
################################################################################

echo "=========================================="
echo "Casir-Online Deployment Monitor"
echo "=========================================="
echo ""

echo "🔍 Checking Docker build status..."
echo ""

# Check if build is running
if docker compose -f docker-compose.prod.yml --env-file .env.production ps 2>&1 | grep -q "exited with code"; then
    echo "❌ Build failed!"
    echo ""
    echo "Checking logs..."
    docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=50
    exit 1
fi

echo "✅ Build process running..."
echo ""

# Monitor Docker images being built
echo "📦 Docker Images:"
echo "----------------"
docker images | grep -E "casir|node|nginx|python|postgres|redis|grafana|prometheus" | head -15

echo ""
echo "⏳ Waiting for build to complete..."
echo ""

# Wait loop with progress indicator
elapsed=0
while true; do
    sleep 10
    elapsed=$((elapsed + 10))

    # Check if build completed
    if ! docker ps | grep -q "build"; then
        echo "✅ Build completed!"
        break
    fi

    # Show progress
    minutes=$((elapsed / 60))
    seconds=$((elapsed % 60))
    echo "⏱️  Elapsed time: ${minutes}m ${seconds}s"

    # Check images
    images_count=$(docker images | grep -c "casir")
    echo "📦 Images built: $images_count"

    # Check if any build failed
    if docker compose -f docker-compose.prod.yml --env-file .env.production ps 2>&1 | grep -q "exited with code"; then
        echo "❌ Build failed! Checking logs..."
        docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100
        exit 1
    fi
done

echo ""
echo "=========================================="
echo "🎉 Build Complete!"
echo "=========================================="
echo ""

# Show built images
echo "📦 Built Docker Images:"
echo "----------------------"
docker images | grep "casir"

echo ""
echo "✅ Ready to start services!"
echo ""
echo "Next steps:"
echo "  1. Start services: docker compose -f docker-compose.prod.yml --env-file .env.production up -d"
echo "  2. Run migrations: docker compose -f docker-compose.prod.yml --env-file .env.production run server npx prisma migrate deploy"
echo "  3. Check health: curl https://casir.local/health"
