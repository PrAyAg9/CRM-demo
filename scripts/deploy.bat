@echo off
REM Mini CRM Platform Deployment Script for Windows
REM This script sets up and deploys the Mini CRM Platform on Windows

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=mini-crm
set BACKUP_DIR=.\backups
set LOG_DIR=.\logs

REM Functions using labels
goto :main

:log
    echo [%date% %time%] %~1
    goto :eof

:success
    echo [SUCCESS] %~1
    goto :eof

:warning
    echo [WARNING] %~1
    goto :eof

:error
    echo [ERROR] %~1
    exit /b 1

:check_requirements
    call :log "Checking system requirements..."
    
    REM Check Docker
    docker --version >nul 2>&1
    if !errorlevel! neq 0 (
        call :error "Docker is not installed. Please install Docker Desktop first."
        exit /b 1
    )
    
    REM Check Docker Compose
    docker-compose --version >nul 2>&1
    if !errorlevel! neq 0 (
        call :error "Docker Compose is not installed. Please install Docker Compose first."
        exit /b 1
    )
    
    call :success "System requirements check completed"
    goto :eof

:setup_directories
    call :log "Setting up project directories..."
    
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
    if not exist "ssl" mkdir "ssl"
    if not exist "monitoring" mkdir "monitoring"
    if not exist "nginx" mkdir "nginx"
    
    call :success "Directories created successfully"
    goto :eof

:setup_environment
    call :log "Setting up environment configuration..."
    
    set ENV_FILE=.env.development
    if "%~1"=="production" set ENV_FILE=.env.production
    
    if not exist "%ENV_FILE%" (
        call :error "Environment file %ENV_FILE% not found. Please create it first."
        exit /b 1
    )
    
    copy "%ENV_FILE%" ".env" >nul
    
    call :success "Environment configuration completed"
    goto :eof

:build_images
    call :log "Building Docker images..."
    
    REM Build backend
    docker build -t mini-crm-backend:latest ./backend
    if !errorlevel! neq 0 (
        call :error "Failed to build backend image"
        exit /b 1
    )
    
    REM Build frontend
    docker build -t mini-crm-frontend:latest ./frontend
    if !errorlevel! neq 0 (
        call :error "Failed to build frontend image"
        exit /b 1
    )
    
    call :success "Docker images built successfully"
    goto :eof

:deploy
    set environment=%~1
    if "%environment%"=="" set environment=development
    
    call :log "Deploying Mini CRM Platform in %environment% mode..."
    
    REM Setup environment
    call :setup_environment %environment%
    
    REM Choose compose file based on environment
    set COMPOSE_FILE=docker-compose.yml
    if "%environment%"=="production" set COMPOSE_FILE=docker-compose.prod.yml
    
    REM Stop existing containers
    docker-compose -f "%COMPOSE_FILE%" down
    
    REM Pull latest images
    docker-compose -f "%COMPOSE_FILE%" pull
    
    REM Build and start services
    docker-compose -f "%COMPOSE_FILE%" up -d --build
    if !errorlevel! neq 0 (
        call :error "Failed to start services"
        exit /b 1
    )
    
    REM Wait for services to start
    call :log "Waiting for services to start..."
    timeout /t 30 /nobreak >nul
    
    REM Check service health
    call :check_health
    
    call :success "Deployment completed successfully!"
    goto :eof

:check_health
    call :log "Checking service health..."
    
    REM Check backend health
    set /a count=0
    :backend_health_loop
    curl -f http://localhost:3000/api/health >nul 2>&1
    if !errorlevel! equ 0 (
        call :success "Backend service is healthy"
        goto :frontend_health
    )
    set /a count+=1
    if !count! geq 30 (
        call :error "Backend service failed to start"
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto :backend_health_loop
    
    :frontend_health
    set /a count=0
    :frontend_health_loop
    curl -f http://localhost:80/health >nul 2>&1
    if !errorlevel! equ 0 (
        call :success "Frontend service is healthy"
        goto :eof
    )
    set /a count+=1
    if !count! geq 30 (
        call :error "Frontend service failed to start"
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto :frontend_health_loop

:backup
    call :log "Creating backup..."
    
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
    set "BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.tar.gz"
    
    REM Create backup directory
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    
    REM Note: MongoDB and Redis backup would need appropriate tools
    call :log "Backup functionality requires additional tools on Windows"
    call :log "Consider using MongoDB Compass and Redis Desktop Manager for manual backups"
    
    call :success "Backup process initiated"
    goto :eof

:show_logs
    set service=%~1
    if "%service%"=="" (
        docker-compose logs -f
    ) else (
        docker-compose logs -f %service%
    )
    goto :eof

:stop
    call :log "Stopping Mini CRM Platform..."
    docker-compose down
    call :success "Services stopped"
    goto :eof

:cleanup
    call :log "Cleaning up..."
    
    REM Stop and remove containers
    docker-compose down -v
    
    REM Remove images
    docker rmi -f mini-crm-backend:latest mini-crm-frontend:latest 2>nul
    
    REM Remove unused volumes
    docker volume prune -f
    
    call :success "Cleanup completed"
    goto :eof

:update
    call :log "Updating Mini CRM Platform..."
    
    REM Rebuild and restart
    docker-compose down
    docker-compose up -d --build
    
    call :success "Update completed"
    goto :eof

:status
    call :log "Mini CRM Platform Status:"
    echo.
    docker-compose ps
    echo.
    docker-compose top
    goto :eof

:main
    if "%~1"=="check" (
        call :check_requirements
    ) else if "%~1"=="setup" (
        call :check_requirements
        call :setup_directories
    ) else if "%~1"=="deploy" (
        call :check_requirements
        call :setup_directories
        call :deploy %~2
    ) else if "%~1"=="backup" (
        call :backup
    ) else if "%~1"=="logs" (
        call :show_logs %~2
    ) else if "%~1"=="stop" (
        call :stop
    ) else if "%~1"=="cleanup" (
        call :cleanup
    ) else if "%~1"=="update" (
        call :update
    ) else if "%~1"=="status" (
        call :status
    ) else (
        echo Mini CRM Platform Deployment Script for Windows
        echo.
        echo Usage: %~nx0 {command} [options]
        echo.
        echo Commands:
        echo   check               Check system requirements
        echo   setup               Setup project directories
        echo   deploy [env]        Deploy application (env: development^|production^)
        echo   backup              Create backup of data
        echo   logs [service]      Show logs (all services or specific service^)
        echo   stop                Stop all services
        echo   cleanup             Stop services and cleanup resources
        echo   update              Update and restart application
        echo   status              Show service status
        echo.
        echo Examples:
        echo   %~nx0 setup
        echo   %~nx0 deploy development
        echo   %~nx0 deploy production
        echo   %~nx0 logs backend
        echo   %~nx0 backup
        echo.
        exit /b 1
    )

endlocal