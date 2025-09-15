# Mini CRM Platform - Deployment Guide

## Overview

This deployment guide provides comprehensive instructions for setting up and deploying the Mini CRM Platform in development and production environments using Docker and Docker Compose.

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or Windows 10/11
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection

### Required Software

- **Docker**: Version 20.0 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For version control (optional)
- **curl**: For health checks

### Installation Links

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository (if using Git)
git clone <your-repo-url>
cd mini-crm

# Make deployment scripts executable (Linux/macOS)
chmod +x scripts/deploy.sh

# Or use Windows batch script
# scripts\deploy.bat
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.development .env

# Edit environment variables
nano .env  # Linux/macOS
# notepad .env  # Windows
```

### 3. Deploy Development Environment

```bash
# Linux/macOS
./scripts/deploy.sh setup
./scripts/deploy.sh deploy development

# Windows
scripts\deploy.bat setup
scripts\deploy.bat deploy development
```

### 4. Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs

## Environment Configuration

### Development Environment (.env.development)

```env
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=dev_password_123
MONGO_DB_NAME=mini_crm_dev

# Redis Configuration
REDIS_PASSWORD=redis_dev_123

# Application Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production
NODE_ENV=development
LOG_LEVEL=debug

# External Services (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
```

### Production Environment (.env.production)

```env
# Database Configuration (Use strong passwords!)
MONGO_ROOT_USERNAME=crm_admin
MONGO_ROOT_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123!
MONGO_DB_NAME=mini_crm_production

# Redis Configuration
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_456!

# Application Configuration
JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_RANDOM_STRING_FOR_PRODUCTION
NODE_ENV=production
LOG_LEVEL=info

# Domain Configuration
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# External Services (Required for production)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
OPENAI_API_KEY=your-production-openai-api-key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-app-password

# SMS Configuration
SMS_SERVICE=twilio
SMS_ACCOUNT_SID=your-twilio-account-sid
SMS_AUTH_TOKEN=your-twilio-auth-token
SMS_PHONE_NUMBER=+1234567890
```

## Deployment Commands

### Linux/macOS (deploy.sh)

```bash
# Check system requirements
./scripts/deploy.sh check

# Setup directories and SSL certificates
./scripts/deploy.sh setup

# Deploy development environment
./scripts/deploy.sh deploy development

# Deploy production environment
./scripts/deploy.sh deploy production

# View logs
./scripts/deploy.sh logs

# View specific service logs
./scripts/deploy.sh logs backend

# Check status
./scripts/deploy.sh status

# Create backup
./scripts/deploy.sh backup

# Stop services
./scripts/deploy.sh stop

# Clean up all resources
./scripts/deploy.sh cleanup

# Update application
./scripts/deploy.sh update
```

### Windows (deploy.bat)

```cmd
REM Check system requirements
scripts\deploy.bat check

REM Setup directories
scripts\deploy.bat setup

REM Deploy development environment
scripts\deploy.bat deploy development

REM Deploy production environment
scripts\deploy.bat deploy production

REM View logs
scripts\deploy.bat logs

REM Check status
scripts\deploy.bat status

REM Stop services
scripts\deploy.bat stop

REM Clean up resources
scripts\deploy.bat cleanup
```

## Docker Compose Profiles

### Development (docker-compose.yml)

- Includes admin tools for debugging
- Less restrictive security settings
- Detailed logging
- Port binding to all interfaces

### Production (docker-compose.prod.yml)

- Security-hardened configuration
- Resource limits
- Monitoring services
- Port binding to localhost only
- SSL/TLS support

### Admin Tools Profile

```bash
# Start with admin tools (MongoDB Express, Redis Insight)
docker-compose --profile admin up -d

# Access admin tools
# MongoDB Express: http://localhost:8081
# Redis Insight: http://localhost:8001
```

### Monitoring Profile

```bash
# Start with monitoring stack
docker-compose --profile monitoring up -d

# Access monitoring tools
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

## SSL/TLS Configuration

### Development (Self-signed certificates)

```bash
# Generate self-signed certificates
./scripts/deploy.sh ssl
```

### Production (Let's Encrypt recommended)

```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to SSL directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
sudo chown $(whoami):$(whoami) ./ssl/*.pem
```

## Database Management

### MongoDB Administration

```bash
# Access MongoDB shell
docker exec -it mini-crm-mongodb mongosh

# Connect with authentication
mongosh "mongodb://admin:password123@localhost:27017/mini_crm?authSource=admin"

# Create backup
docker exec mini-crm-mongodb mongodump --out /backups/$(date +%Y%m%d_%H%M%S)

# Restore from backup
docker exec -i mini-crm-mongodb mongorestore /backups/20241201_120000
```

### Redis Administration

```bash
# Access Redis CLI
docker exec -it mini-crm-redis redis-cli

# Monitor Redis activity
docker exec -it mini-crm-redis redis-cli monitor

# Clear cache
docker exec -it mini-crm-redis redis-cli flushall
```

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using port 80
sudo lsof -i :80

# Check what's using port 3000
sudo lsof -i :3000

# Kill process using specific port
sudo kill -9 $(sudo lsof -t -i:80)
```

#### Container Health Issues

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f [service_name]

# Restart specific service
docker-compose restart [service_name]

# Check resource usage
docker stats
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R $(whoami):$(whoami) .

# Fix SSL certificate permissions
sudo chmod 600 ./ssl/key.pem
sudo chmod 644 ./ssl/cert.pem
```

#### Database Connection Issues

```bash
# Test MongoDB connection
docker exec mini-crm-mongodb mongosh --eval "db.adminCommand('ping')"

# Test Redis connection
docker exec mini-crm-redis redis-cli ping
```

### Log Analysis

#### Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend/Nginx logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f mongodb
```

#### System Logs

```bash
# Docker daemon logs
sudo journalctl -fu docker.service

# Container resource usage
docker stats --no-stream

# Disk usage
docker system df
```

## Performance Optimization

### Resource Limits

Edit `docker-compose.prod.yml` to adjust resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1.0"
        reservations:
          memory: 512M
          cpus: "0.5"
```

### Database Optimization

```javascript
// MongoDB optimization queries
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ totalSpent: -1 });
db.orders.createIndex({ customerId: 1, createdAt: -1 });
```

### Nginx Caching

Edit `frontend/default.conf` to adjust caching:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Configure proper SSL certificates
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Configure Redis password
- [ ] Set up fail2ban (if applicable)
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Implement rate limiting

### Network Security

```bash
# Configure UFW firewall (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Block direct backend access
sudo ufw deny 27017/tcp  # Block direct MongoDB access
sudo ufw deny 6379/tcp   # Block direct Redis access
```

## Backup and Recovery

### Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
docker exec mini-crm-mongodb mongodump --out "$BACKUP_DIR/mongodb"

# Backup Redis
docker exec mini-crm-redis redis-cli --rdb "$BACKUP_DIR/redis.rdb"

# Backup application data
tar -czf "$BACKUP_DIR/app_data.tar.gz" ./backend/uploads

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_DIR" s3://your-backup-bucket/ --recursive
```

### Recovery Process

```bash
# Restore MongoDB
docker exec -i mini-crm-mongodb mongorestore /backups/20241201_120000/mongodb

# Restore Redis
docker exec -i mini-crm-redis redis-cli --pipe < /backups/20241201_120000/redis.rdb

# Restore application data
tar -xzf /backups/20241201_120000/app_data.tar.gz -C ./backend/
```

## Monitoring and Logging

### Grafana Dashboards

Access Grafana at http://localhost:3001 (admin/admin)

Available dashboards:

- Application Performance Metrics
- Database Performance
- System Resource Usage
- Error Rate Monitoring

### Log Aggregation

Logs are centralized in the `./logs` directory:

- `./logs/backend/` - Application logs
- `./logs/nginx/` - Web server logs
- `./logs/mongodb/` - Database logs

### Health Checks

```bash
# Check all services health
curl http://localhost:80/health
curl http://localhost:3000/api/health

# Check individual components
docker-compose ps
docker-compose top
```

## Scaling and Load Balancing

### Horizontal Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Use load balancer profile
docker-compose --profile load-balancer up -d
```

### Load Balancer Configuration

Edit `nginx/nginx-lb.conf` for load balancing:

```nginx
upstream backend_servers {
    server backend:3000;
    server backend_2:3000;
    server backend_3:3000;
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Mini CRM
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          ./scripts/deploy.sh deploy production
```

### Environment-specific Deployments

```bash
# Staging environment
./scripts/deploy.sh deploy staging

# Production environment
./scripts/deploy.sh deploy production
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Check logs for errors
2. **Monthly**: Update Docker images
3. **Quarterly**: Review security configurations
4. **Annually**: Update SSL certificates

### Getting Help

- Check logs first: `docker-compose logs -f`
- Review health checks: `./scripts/deploy.sh status`
- Consult documentation: See USER_GUIDE.md
- Community support: GitHub Issues

### Updates and Upgrades

```bash
# Pull latest images
docker-compose pull

# Update and restart
./scripts/deploy.sh update

# Verify deployment
./scripts/deploy.sh status
```

---

## Appendix

### Useful Docker Commands

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

### Emergency Procedures

```bash
# Emergency stop
docker-compose down

# Force restart all services
docker-compose down && docker-compose up -d --force-recreate

# Rollback to previous backup
./scripts/deploy.sh restore /path/to/backup.tar.gz
```
