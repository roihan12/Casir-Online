#!/bin/bash

################################################################################
# Casir-Online Production Deployment Script
# This script automates the deployment process for local production environment
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="casir"
BACKUP_DIR="./backups"
LOG_FILE="./deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    fi
    log_success "Docker is installed"

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    log_success "Docker is running"

    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please update Docker Desktop."
        exit 1
    fi
    log_success "Docker Compose is available"

    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_warning ".env.production not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env.production
            log_warning "Please edit .env.production with your production values before continuing."
            log_warning "Run this script again after configuring."
            exit 1
        else
            log_error ".env.example not found. Please create .env.production manually."
            exit 1
        fi
    fi
    log_success ".env.production found"

    # Check if SSL certificates exist
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        log_warning "SSL certificates not found. Please run setup-ssl.sh first."
        log_warning "Or create certificates manually in nginx/ssl/ directory"
        exit 1
    fi
    log_success "SSL certificates found"

    # Load environment variables
    log "Loading environment variables from .env.production"
    set -a
    source .env.production
    set +a

    log_success "All prerequisites met"
}

backup_database() {
    print_header "Backing Up Database"

    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

    log "Creating database backup..."

    # Check if using local PostgreSQL or Supabase
    if docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null | grep -q .; then
        # Local PostgreSQL
        docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-casir}" > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        log_success "Database backed up to ${BACKUP_FILE}.gz"
    else
        log_warning "Local PostgreSQL not running. Skipping backup."
        log_warning "If using Supabase, backup is handled automatically."
    fi
}

run_tests() {
    print_header "Running Tests"

    log "Running server tests..."
    cd server
    if npm test; then
        log_success "Server tests passed"
    else
        log_error "Server tests failed. Aborting deployment."
        exit 1
    fi
    cd ..

    log "Running client tests..."
    cd client
    if npm test; then
        log_success "Client tests passed"
    else
        log_error "Client tests failed. Aborting deployment."
        exit 1
    fi
    cd ..
}

build_images() {
    print_header "Building Docker Images"

    log "Building all services..."

    # Build with no cache to ensure fresh build
    docker compose -f "$COMPOSE_FILE" build --no-cache

    log_success "Docker images built successfully"
}

run_migrations() {
    print_header "Running Database Migrations"

    log "Running Prisma migrations..."

    docker compose -f "$COMPOSE_FILE" run --rm server npx prisma migrate deploy

    log_success "Database migrations completed"
}

start_services() {
    print_header "Starting Services"

    log "Starting all services..."

    # Start services in detached mode
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "Services started"
}

wait_for_services() {
    print_header "Waiting for Services to be Healthy"

    local services=("server" "client" "redis" "nginx")
    local max_attempts=30
    local attempt=1

    for service in "${services[@]}"; do
        log "Waiting for $service to be healthy..."

        while [ $attempt -le $max_attempts ]; do
            if docker compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|running"; then
                log_success "$service is healthy"
                break
            fi

            if [ $attempt -eq $max_attempts ]; then
                log_error "$service failed to become healthy"
                log "Checking logs for $service..."
                docker compose -f "$COMPOSE_FILE" logs --tail=50 "$service"
                exit 1
            fi

            sleep 2
            ((attempt++))
        done
        attempt=1
    done

    log_success "All services are healthy"
}

run_health_checks() {
    print_header "Running Health Checks"

    # Check main application health
    if curl -f -s https://casir.local/health > /dev/null; then
        log_success "Main application health check passed"
    else
        log_error "Main application health check failed"
        exit 1
    fi

    # Check API health
    if curl -f -s https://casir.local/api/health > /dev/null; then
        log_success "API health check passed"
    else
        log_warning "API health check failed"
    fi

    # Check monitoring services
    if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        log_success "Prometheus is healthy"
    else
        log_warning "Prometheus health check failed"
    fi

    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log_success "Grafana is healthy"
    else
        log_warning "Grafana health check failed"
    fi
}

cleanup_old_images() {
    print_header "Cleaning Up Old Images"

    log "Removing dangling Docker images..."
    docker image prune -f

    log "Removing old build cache..."
    docker builder prune -f

    log_success "Cleanup completed"
}

print_summary() {
    print_header "Deployment Summary"

    echo "Deployment completed successfully!"
    echo ""
    echo "Services are now running:"
    echo "  - Frontend:  https://casir.local"
    echo "  - API:       https://casir.local/api"
    echo "  - Grafana:   https://grafana.local (or http://localhost:3001)"
    echo "  - Prometheus: http://localhost:9090"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker compose -f $COMPOSE_FILE logs -f"
    echo "  - Stop services: docker compose -f $COMPOSE_FILE down"
    echo "  - Restart services: docker compose -f $COMPOSE_FILE restart"
    echo "  - Check status: docker compose -f $COMPOSE_FILE ps"
    echo ""
    echo "Logs saved to: $LOG_FILE"
}

# Main deployment flow
main() {
    print_header "Casir-Online Production Deployment"

    log "Starting deployment process..."

    check_prerequisites
    backup_database
    run_tests
    build_images
    run_migrations
    start_services
    wait_for_services
    run_health_checks
    cleanup_old_images
    print_summary

    log_success "Deployment completed successfully!"
}

# Rollback function
rollback() {
    print_header "Rolling Back Deployment"

    log_error "Deployment failed. Rolling back..."

    log "Stopping new services..."
    docker compose -f "$COMPOSE_FILE" down

    log "Restoring from previous backup if available..."
    # Add rollback logic here if needed

    log_error "Rollback completed. Please check the logs and fix the issues."
}

# Trap errors and rollback
trap rollback ERR

# Run main function
main "$@"
