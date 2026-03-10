#!/bin/bash

################################################################################
# Casir-Online Database Backup Script
# This script creates automated backups of the database
################################################################################

set -e

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=30
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Casir-Online Database Backup"
echo "=========================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

echo "Creating database backup..."

# Check if using local PostgreSQL
if docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null | grep -q .; then
    # Load environment variables
    if [ -f ".env.production" ]; then
        set -a
        source .env.production
        set +a
    fi

    # Create backup
    docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-casir}" > "$BACKUP_FILE"

    # Compress backup
    gzip "$BACKUP_FILE"

    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"

    # Calculate backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo -e "${YELLOW}⚠ Local PostgreSQL not running${NC}"
    echo "If using Supabase, backup is handled automatically."
    echo "To backup Supabase, use:"
    echo "  - Supabase Dashboard: Database > Backups"
    echo "  - CLI: supabase db dump -f backup.sql"
fi

# Clean old backups
echo ""
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."

find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✓ Old backups cleaned${NC}"

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo -e "${GREEN}Backup completed successfully!${NC}"
