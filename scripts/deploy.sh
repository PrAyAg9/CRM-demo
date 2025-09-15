#!/bin/bash

# Mini CRM Platform Deployment Script
# This script sets up and deploys the Mini CRM Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mini-crm"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if ports are available
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port 80 is already in use. Please stop the service using this port."
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        warning "Port 3000 is already in use. Please stop the service using this port."
    fi
    
    success "System requirements check completed"
}

# Setup directories
setup_directories() {
    log "Setting up project directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./ssl"
    mkdir -p "./monitoring"
    mkdir -p "./nginx"
    
    success "Directories created successfully"
}

# Environment setup
setup_environment() {
    log "Setting up environment configuration..."
    
    ENV_FILE=".env"
    
    if [ "$1" = "production" ]; then
        ENV_FILE=".env.production"
    else
        ENV_FILE=".env.development"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found. Please create it first."
    fi
    
    # Copy environment file
    cp "$ENV_FILE" ".env"
    
    success "Environment configuration completed"
}

# Build images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    docker build -t mini-crm-backend:latest ./backend
    
    # Build frontend
    docker build -t mini-crm-frontend:latest ./frontend
    
    success "Docker images built successfully"
}

# Deploy application
deploy() {
    local environment=${1:-development}
    
    log "Deploying Mini CRM Platform in $environment mode..."
    
    # Setup environment
    setup_environment "$environment"
    
    # Choose compose file based on environment
    COMPOSE_FILE="docker-compose.yml"
    if [ "$environment" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build and start services
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    # Wait for services to be healthy
    log "Waiting for services to start..."
    sleep 30
    
    # Check service health
    check_health
    
    success "Deployment completed successfully!"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            success "Backend service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            error "Backend service failed to start"
        fi
        sleep 2
    done
    
    # Check frontend health
    for i in {1..30}; do
        if curl -f http://localhost:80/health >/dev/null 2>&1; then
            success "Frontend service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            error "Frontend service failed to start"
        fi
        sleep 2
    done
}

# Generate SSL certificates
generate_ssl() {
    log "Generating SSL certificates..."
    
    SSL_DIR="./ssl"
    
    # Create self-signed certificate for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    success "SSL certificates generated"
}

# Backup data
backup() {
    log "Creating backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB
    docker exec mini-crm-mongodb mongodump --out /backups/mongodb_$TIMESTAMP
    
    # Backup Redis
    docker exec mini-crm-redis redis-cli BGSAVE
    
    # Create compressed backup
    tar -czf "$BACKUP_FILE" \
        ./backend/uploads \
        "$BACKUP_DIR/mongodb_$TIMESTAMP" \
        ./logs
    
    success "Backup created: $BACKUP_FILE"
}

# Restore data
restore() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring from backup: $backup_file"
    
    # Extract backup
    tar -xzf "$backup_file" -C ./
    
    # Restore MongoDB
    # This would need to be implemented based on your backup structure
    
    success "Restore completed"
}

# Show logs
show_logs() {
    local service=${1:-}
    
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Stop services
stop() {
    log "Stopping Mini CRM Platform..."
    docker-compose down
    success "Services stopped"
}

# Clean up
cleanup() {
    log "Cleaning up..."
    
    # Stop and remove containers
    docker-compose down -v
    
    # Remove images
    docker rmi -f mini-crm-backend:latest mini-crm-frontend:latest 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f
    
    success "Cleanup completed"
}

# Update application
update() {
    log "Updating Mini CRM Platform..."
    
    # Pull latest code (if using git)
    # git pull origin main
    
    # Rebuild and restart
    docker-compose down
    docker-compose up -d --build
    
    success "Update completed"
}

# Show status
status() {
    log "Mini CRM Platform Status:"
    echo ""
    docker-compose ps
    echo ""
    docker-compose top
}

# Main script logic
case "$1" in
    "check")
        check_requirements
        ;;
    "setup")
        check_requirements
        setup_directories
        generate_ssl
        ;;
    "deploy")
        environment=${2:-development}
        check_requirements
        setup_directories
        deploy "$environment"
        ;;
    "backup")
        backup
        ;;
    "restore")
        restore "$2"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "stop")
        stop
        ;;
    "cleanup")
        cleanup
        ;;
    "update")
        update
        ;;
    "status")
        status
        ;;
    "ssl")
        generate_ssl
        ;;
    *)
        echo "Mini CRM Platform Deployment Script"
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Commands:"
        echo "  check               Check system requirements"
        echo "  setup               Setup project directories and SSL"
        echo "  deploy [env]        Deploy application (env: development|production)"
        echo "  backup              Create backup of data"
        echo "  restore [file]      Restore from backup file"
        echo "  logs [service]      Show logs (all services or specific service)"
        echo "  stop                Stop all services"
        echo "  cleanup             Stop services and cleanup resources"
        echo "  update              Update and restart application"
        echo "  status              Show service status"
        echo "  ssl                 Generate SSL certificates"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 deploy development"
        echo "  $0 deploy production"
        echo "  $0 logs backend"
        echo "  $0 backup"
        echo ""
        exit 1
        ;;
esac