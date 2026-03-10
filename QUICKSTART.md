# Casir-Online Production Quick Reference

Quick commands and references for local production setup.

## 🚀 Initial Setup (One-time)

```powershell
# 1. Install prerequisites
choco install mkcert docker-desktop git

# 2. Setup SSL certificates
mkcert -install
mkcert casir.local *.casir.local localhost 127.0.0.1 ::1
mkdir nginx\ssl
move cert.pem nginx\ssl\
move key.pem nginx\ssl\

# 3. Add to hosts file (run as Administrator)
notepad C:\Windows\System32\drivers\etc\hosts
# Add: 127.0.0.1 casir.local

# 4. Configure environment
Copy-Item .env.production.example .env.production
notepad .env.production
# Generate secrets: openssl rand -base64 64

# 5. Deploy
bash scripts/deploy.sh
```

## 📋 Daily Commands

```bash
# Start services
bash scripts/start.sh

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

## 🔍 Health Checks

```bash
# Application health
curl https://casir.local/health

# API health
curl https://casir.local/api/health

# Service status
docker compose -f docker-compose.prod.yml ps
```

## 📊 Monitoring Access

- **Frontend**: https://casir.local
- **API**: https://casir.local/api
- **Grafana**: https://grafana.local (admin / your_password)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## 🔧 Troubleshooting

```bash
# View service logs
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Restart specific service
docker compose -f docker-compose.prod.yml restart [service-name]

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build [service-name]

# Check resource usage
docker stats

# Clean restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## 💾 Backup

```bash
# Create backup
bash scripts/backup.sh

# Backup location
ls -lh backups/
```

## 🔄 Update

```bash
# Pull latest changes
git pull origin main

# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Rebuild and restart
bash scripts/deploy.sh
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.production` | Production environment variables |
| `docker-compose.prod.yml` | Production Docker Compose config |
| `nginx/nginx.conf` | NGINX reverse proxy config |
| `nginx/ssl/*.pem` | SSL certificates |
| `monitoring/prometheus/prometheus.yml` | Prometheus config |
| `monitoring/grafana/dashboards/` | Grafana dashboards |

## 🔐 Security Checklist

- [ ] Changed all default passwords
- [ ] Generated secure JWT_SECRET
- [ ] Updated CORS allowed origins
- [ ] Configured rate limiting
- [ ] Enabled security headers
- [ ] Set up SSL certificates
- [ ] Configured backup automation
- [ ] Set up monitoring alerts

## 📞 Support

- **Full Documentation**: `docs/PRODUCTION_SETUP.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Monitoring**: https://grafana.local
- **Logs**: Grafana → Explore → Loki

## 🆘 Emergency Commands

```bash
# Stop everything immediately
docker compose -f docker-compose.prod.yml down

# Restore from backup
gunzip backups/db_backup_*.sql.gz
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d casir < backup.sql

# Check for errors
docker compose -f docker-compose.prod.yml logs | grep -i error

# Reset to previous version
git reset --hard HEAD~1
bash scripts/deploy.sh
```

---

**Setup complete!** Access your application at https://casir.local
