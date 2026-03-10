# Casir-Online Production Setup Guide

Complete guide for setting up Casir-Online in local production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software

1. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Enable WSL 2 backend
   - Allocate at least:
     - 4 CPUs
     - 8GB RAM
     - 50GB Disk

2. **mkcert** (for SSL certificates)
   ```bash
   choco install mkcert
   ```
   Or download from: https://github.com/FiloSottile/mkcert

3. **Git** (for cloning)
   ```bash
   choco install git
   ```

4. **PowerShell or Windows Terminal**
   - For running shell scripts

---

## Quick Start

### Step 1: Generate SSL Certificates

```powershell
# Install mkcert CA
mkcert -install

# Generate certificates for casir.local
mkcert casir.local *.casir.local localhost 127.0.0.1 ::1

# Move certificates to nginx/ssl/
mkdir nginx\ssl
move cert.pem nginx\ssl\
move key.pem nginx\ssl\
```

Or use the automated script:
```bash
bash scripts/setup-ssl.sh
```

### Step 2: Configure Environment

```powershell
# Copy environment template
Copy-Item .env.production.example .env.production

# Edit .env.production with your values
notepad .env.production
```

**Critical values to update:**
- `JWT_SECRET` - Generate with: `openssl rand -base64 64`
- `DATABASE_URL` - Your Supabase connection string
- `REDIS_URL` - Redis connection string
- `MIDTRANS_SERVER_KEY` - Your Midtrans keys
- `WHATSAPP_WEBHOOK_SECRET` - Generate random string

### Step 3: Update Hosts File

Add these lines to `C:\Windows\System32\drivers\etc\hosts` (run Notepad as Administrator):

```
127.0.0.1 casir.local
127.0.0.1 api.casir.local
127.0.0.1 grafana.local
127.0.0.1 prometheus.local
```

### Step 4: Deploy Application

```bash
# Make scripts executable (Git Bash)
chmod +x scripts/*.sh

# Run deployment
bash scripts/deploy.sh

# Or start services directly
bash scripts/start.sh
```

### Step 5: Access Application

- **Frontend**: https://casir.local
- **API**: https://casir.local/api
- **Grafana**: https://grafana.local (or http://localhost:3001)
  - Default credentials: `admin` / (your GRAFANA_ADMIN_PASSWORD)
- **Prometheus**: http://localhost:9090

---

## Configuration

### Directory Structure

```
casir-online/
├── docker-compose.prod.yml          # Production Docker Compose
├── nginx/
│   ├── nginx.conf                   # NGINX configuration
│   └── ssl/                         # SSL certificates
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml           # Prometheus config
│   │   └── rules/                   # Alert rules
│   ├── grafana/
│   │   ├── provisioning/            # Grafana provisioning
│   │   └── dashboards/              # Dashboard definitions
│   ├── loki/
│   │   └── loki.yml                 # Loki config
│   ├── promtail/
│   │   └── promtail.yml             # Promtail config
│   └── alertmanager/
│       └── alertmanager.yml         # Alertmanager config
├── scripts/
│   ├── deploy.sh                    # Deployment script
│   ├── start.sh                     # Startup script
│   ├── backup.sh                    # Backup script
│   └── setup-ssl.sh                 # SSL setup script
└── .env.production                  # Production environment
```

### Services Overview

| Service | Container Name | Ports | Description |
|---------|---------------|-------|-------------|
| NGINX | casir-nginx | 80, 443 | Reverse proxy |
| Server | casir-server | 3000 | Express.js API |
| Client | casir-client | 80 | React frontend |
| Redis | casir-redis | 6379 | Cache |
| PostgreSQL | casir-postgres | 5432 | Database (optional) |
| WhatsApp | casir-whatsapp | 5000 | WhatsApp service |
| Face Recognition | casir-face-recognition | 8001 | Face recognition |
| Prometheus | casir-prometheus | 9090 | Metrics |
| Grafana | casir-grafana | 3001 | Visualization |
| Loki | casir-loki | 3100 | Log aggregation |
| Promtail | casir-promtail | 9080 | Log collector |
| Alertmanager | casir-alertmanager | 9093 | Alert management |

---

## Deployment

### Automated Deployment

The deployment script (`scripts/deploy.sh`) handles:
1. Prerequisites check
2. Database backup
3. Running tests
4. Building Docker images
5. Running migrations
6. Starting services
7. Health checks
8. Cleanup

```bash
bash scripts/deploy.sh
```

### Manual Deployment

1. **Build images:**
   ```bash
   docker compose -f docker-compose.prod.yml build
   ```

2. **Run migrations:**
   ```bash
   docker compose -f docker-compose.prod.yml run --rm server npx prisma migrate deploy
   ```

3. **Start services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Check status:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

### Stopping Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Restarting Services

```bash
docker compose -f docker-compose.prod.yml restart
```

---

## Monitoring

### Grafana Dashboards

Access Grafana at https://grafana.local or http://localhost:3001

**Pre-configured dashboards:**
- **Casir-Online Overview** - System overview with key metrics
- **Application Metrics** - Request rate, error rate, latency
- **Infrastructure** - CPU, memory, disk usage
- **Database** - PostgreSQL performance
- **Cache** - Redis performance

### Prometheus Metrics

Access Prometheus at http://localhost:9090

**Key queries:**
- `up` - Service status
- `rate(http_requests_total[5m])` - Request rate
- `rate(http_requests_total{status=~"5.."}[5m])` - Error rate
- `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` - p95 latency

### Logs (Loki)

Logs are automatically collected from:
- Docker containers
- Nginx access/error logs
- Application logs

Access logs through Grafana's "Explore" feature with Loki datasource.

### Alerts

Alerts are configured in `monitoring/prometheus/rules/alerts.yml` and managed by Alertmanager.

**Critical alerts:**
- Service down
- High error rate (>5%)
- Database connection lost
- Out of memory

**Warning alerts:**
- High CPU usage (>80%)
- High memory usage (>80%)
- Low disk space (<20%)
- Slow database queries (>3s)

Configure notifications in `monitoring/alertmanager/alertmanager.yml`.

---

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Errors

**Problem:** Browser shows "Not Secure" or certificate warnings

**Solution:**
```bash
# Reinstall mkcert CA
mkcert -install

# Regenerate certificates
mkcert casir.local *.casir.local localhost 127.0.0.1 ::1

# Move to correct location
cp cert.pem nginx/ssl/
cp key.pem nginx/ssl/

# Restart NGINX
docker compose -f docker-compose.prod.yml restart nginx
```

#### 2. Services Won't Start

**Problem:** Containers fail to start or exit immediately

**Solution:**
```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Check Docker resource allocation
# Docker Desktop > Settings > Resources

# Verify environment variables
cat .env.production

# Check port conflicts
netstat -ano | findstr :443
```

#### 3. Database Connection Errors

**Problem:** Application can't connect to database

**Solution:**
```bash
# Check PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Check logs
docker compose -f docker-compose.prod.yml logs postgres
```

#### 4. High Memory Usage

**Problem:** System running slow, high RAM usage

**Solution:**
```bash
# Check resource usage
docker stats

# Reduce Redis memory limit in docker-compose.prod.yml
# command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru

# Restart services
docker compose -f docker-compose.prod.yml restart
```

#### 5. Logs Not Appearing in Grafana

**Problem:** No logs showing in Loki/Grafana

**Solution:**
```bash
# Check Promtail is running
docker compose -f docker-compose.prod.yml logs promtail

# Verify Loki is accessible
curl http://localhost:3100/ready

# Check Promtail configuration
cat monitoring/promtail/promtail.yml
```

### Health Checks

Check service health:

```bash
# Main application
curl https://casir.local/health

# API health
curl https://casir.local/api/health

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health

# All services
docker compose -f docker-compose.prod.yml ps
```

---

## Maintenance

### Daily Tasks

1. **Check service health:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

2. **Review error logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail=100 server | grep ERROR
   ```

3. **Check resource usage:**
   ```bash
   docker stats
   ```

### Weekly Tasks

1. **Review metrics in Grafana**
2. **Check for updates:**
   ```bash
   docker compose -f docker-compose.prod.yml pull
   ```

3. **Clean up old logs:**
   ```bash
   docker compose -f docker-compose.prod.yml exec server find /var/log/casir -name "*.log" -mtime +7 -delete
   ```

### Monthly Tasks

1. **Update dependencies:**
   ```bash
   cd server && npm update
   cd ../client && npm update
   ```

2. **Run security audit:**
   ```bash
   cd server && npm audit
   cd ../client && npm audit
   ```

3. **Test backup restore:**
   ```bash
   # Backup
   bash scripts/backup.sh

   # Test restore (if using local PostgreSQL)
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d casir < backup.sql
   ```

4. **Review and optimize:**
   - Slow query logs
   - Cache hit ratios
   - Resource usage trends

### Backup Strategy

**Automated backups:**
```bash
# Run backup manually
bash scripts/backup.sh

# Or schedule with Windows Task Scheduler
# Task: Run bash scripts/backup.sh
# Trigger: Daily at 2:00 AM
```

**Backup locations:**
- Database: `./backups/db_backup_*.sql.gz`
- Uploads: `./server/uploads/`
- Config: `.env.production`

**To restore:**
```bash
# Database
gunzip backup.sql.gz
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d casir < backup.sql
```

---

## Security Best Practices

1. **Regular secret rotation**
   - Change JWT_SECRET every 90 days
   - Rotate database passwords
   - Update API keys

2. **Keep dependencies updated**
   ```bash
   npm audit fix
   ```

3. **Monitor security logs**
   - Check Grafana security dashboard
   - Review authentication logs
   - Monitor failed login attempts

4. **Access control**
   - Use strong passwords
   - Enable 2FA where available
   - Limit API access

5. **Network security**
   - Keep firewall enabled
   - Use HTTPS only
   - Configure CORS properly

---

## Performance Optimization

### Database Optimization

1. **Add indexes:**
   ```prisma
   @@index([userId])
   @@index([createdAt])
   @@index([status])
   ```

2. **Connection pooling:**
   Already configured with max 20 connections

3. **Query optimization:**
   - Review slow query logs (>300ms)
   - Use EXPLAIN ANALYZE
   - Optimize N+1 queries

### Caching Strategy

1. **Redis is configured for:**
   - User data (1 hour TTL)
   - Product data (30 min TTL)
   - Reports (15 min TTL)

2. **Monitor cache hit ratio:**
   ```
   cache_hit_ratio = hits / (hits + misses)
   Target: >70%
   ```

### Frontend Optimization

1. **Bundle analysis:**
   ```bash
   cd client
   npm run build -- --mode analyze
   ```

2. **Image optimization:**
   - Use WebP format
   - Lazy loading enabled
   - Cloudinary integration

---

## Support and Resources

### Documentation

- **Main README**: `./README.md`
- **API Documentation**: https://casir.local/api-docs (when configured)
- **Monitoring Guide**: `./docs/MONITORING.md`
- **Troubleshooting**: `./docs/TROUBLESHOOTING.md`

### Useful Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f server

# Execute command in container
docker compose -f docker-compose.prod.yml exec server bash

# Restart specific service
docker compose -f docker-compose.prod.yml restart server

# Remove all containers and volumes
docker compose -f docker-compose.prod.yml down -v

# Prune unused images
docker image prune -a

# Check disk usage
docker system df
```

### External Resources

- **Docker Documentation**: https://docs.docker.com
- **Prometheus**: https://prometheus.io/docs
- **Grafana**: https://grafana.com/docs
- **Loki**: https://grafana.com/docs/loki/latest
- **mkcert**: https://github.com/FiloSottile/mkcert

---

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs
3. Check Grafana dashboards for errors
4. Review this documentation
5. Check the GitHub issues page

---

**Last Updated:** 2025-03-09
**Version:** 1.0.0
