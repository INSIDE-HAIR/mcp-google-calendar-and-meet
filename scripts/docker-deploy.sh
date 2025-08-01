#!/bin/bash
# Google Meet MCP Server v3.0 - Docker Deployment Script
# Production-ready deployment automation with environment validation

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# Configuration and Constants
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_COMPOSE_DEV="$PROJECT_ROOT/docker-compose.yml"
DOCKER_COMPOSE_PROD="$PROJECT_ROOT/docker-compose.prod.yml"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_FRESH=false
VERBOSE=false
HEALTHCHECK_TIMEOUT=60
BACKUP_DATA=false

# ============================================================================
# Utility Functions
# ============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "  Google Meet MCP Server v3.0 - Docker Deploy"
    echo "================================================"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

COMMANDS:
    dev         Deploy in development mode with hot reload
    prod        Deploy in production mode with optimizations
    stop        Stop all services
    restart     Restart services (preserves data)
    logs        Show service logs
    status      Show service status
    cleanup     Clean up containers and networks
    backup      Backup persistent data

OPTIONS:
    -f, --fresh         Force rebuild of Docker images
    -v, --verbose       Enable verbose logging
    -t, --timeout N     Health check timeout in seconds (default: 60)
    -b, --backup        Backup data before deployment
    -h, --help          Show this help message

EXAMPLES:
    $0 dev                    # Start development environment
    $0 prod --fresh --backup  # Fresh production deployment with backup
    $0 logs google-meet-mcp   # Show application logs
    $0 stop                   # Stop all services
    $0 cleanup                # Clean up everything

EOF
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_debug "Docker version: $(docker --version)"
    log_debug "Docker Compose version: $(docker-compose --version 2>/dev/null || docker compose version)"
}

check_files() {
    log_info "Checking required files..."
    
    local required_files=("$PROJECT_ROOT/Dockerfile")
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        required_files+=("$DOCKER_COMPOSE_DEV")
    else
        required_files+=("$DOCKER_COMPOSE_PROD")
    fi
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
        log_debug "Found: $file"
    done
}

check_credentials() {
    log_info "Checking Google credentials..."
    
    local credentials_path=""
    
    # Check environment variables
    if [[ -n "${G_OAUTH_CREDENTIALS:-}" ]]; then
        credentials_path="$G_OAUTH_CREDENTIALS"
    elif [[ -n "${GOOGLE_MEET_CREDENTIALS_PATH:-}" ]]; then
        credentials_path="$GOOGLE_MEET_CREDENTIALS_PATH"
    else
        credentials_path="$PROJECT_ROOT/credentials.json"
    fi
    
    if [[ ! -f "$credentials_path" ]]; then
        log_warn "Credentials file not found: $credentials_path"
        log_warn "Make sure to set up Google OAuth credentials before deployment"
        log_warn "Run 'npm run setup' to create credentials"
    else
        log_debug "Credentials found: $credentials_path"
    fi
}

# ============================================================================
# Deployment Functions
# ============================================================================

backup_data() {
    if [[ "$BACKUP_DATA" != "true" ]]; then
        return 0
    fi
    
    log_info "Creating data backup..."
    
    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup Docker volumes
    local volumes=()
    if [[ "$ENVIRONMENT" == "development" ]]; then
        volumes=("google_meet_mcp_logs_dev" "google_meet_mcp_data_dev")
    else
        volumes=("google_meet_mcp_logs_prod" "google_meet_mcp_data_prod")
    fi
    
    for volume in "${volumes[@]}"; do
        if docker volume inspect "$volume" &> /dev/null; then
            log_debug "Backing up volume: $volume"
            docker run --rm -v "$volume:/data" -v "$backup_dir:/backup" alpine:latest \
                tar czf "/backup/${volume}.tar.gz" -C /data .
        fi
    done
    
    log_info "Backup completed: $backup_dir"
}

build_images() {
    log_info "Building Docker images..."
    
    local compose_file=""
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    local build_args=()
    if [[ "$BUILD_FRESH" == "true" ]]; then
        build_args+=("--no-cache" "--pull")
        log_info "Performing fresh build (no cache)"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        build_args+=("--progress=plain")
    fi
    
    docker-compose -f "$compose_file" build "${build_args[@]}"
}

deploy_services() {
    log_info "Deploying services in $ENVIRONMENT mode..."
    
    local compose_file=""
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    # Start services
    docker-compose -f "$compose_file" up -d
    
    # Wait for services to be healthy
    wait_for_health
}

wait_for_health() {
    log_info "Waiting for services to be healthy (timeout: ${HEALTHCHECK_TIMEOUT}s)..."
    
    local compose_file=""
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
        # Development mode may not have health checks enabled
        log_info "Development mode - skipping health check wait"
        return 0
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    local timeout=$HEALTHCHECK_TIMEOUT
    local interval=5
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        local healthy=true
        
        # Check main service health
        if ! docker-compose -f "$compose_file" ps google-meet-mcp | grep -q "healthy\|Up"; then
            healthy=false
        fi
        
        if [[ "$healthy" == "true" ]]; then
            log_info "All services are healthy!"
            return 0
        fi
        
        log_debug "Waiting for services... (${elapsed}s/${timeout}s)"
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    log_error "Services failed to become healthy within ${timeout}s"
    show_service_status
    exit 1
}

show_service_status() {
    log_info "Service status:"
    
    local compose_file=""
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    docker-compose -f "$compose_file" ps
}

show_logs() {
    local service_name="${1:-}"
    local compose_file=""
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    if [[ -n "$service_name" ]]; then
        docker-compose -f "$compose_file" logs -f "$service_name"
    else
        docker-compose -f "$compose_file" logs -f
    fi
}

stop_services() {
    log_info "Stopping services..."
    
    local compose_files=("$DOCKER_COMPOSE_DEV" "$DOCKER_COMPOSE_PROD")
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$compose_file" ]]; then
            log_debug "Stopping services from: $compose_file"
            docker-compose -f "$compose_file" down || true
        fi
    done
}

restart_services() {
    log_info "Restarting services..."
    
    local compose_file=""
    if [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="$DOCKER_COMPOSE_DEV"
    else
        compose_file="$DOCKER_COMPOSE_PROD"
    fi
    
    docker-compose -f "$compose_file" restart
    wait_for_health
}

cleanup_docker() {
    log_info "Cleaning up Docker resources..."
    
    # Stop all services
    stop_services
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused images (if requested)
    if [[ "$BUILD_FRESH" == "true" ]]; then
        log_info "Removing unused Docker images..."
        docker image prune -f
    fi
    
    # Remove dangling volumes (with confirmation)
    log_warn "This will remove unused Docker volumes. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
}

# ============================================================================
# Command Handlers
# ============================================================================

cmd_dev() {
    ENVIRONMENT="development"
    check_dependencies
    check_files
    check_credentials
    backup_data
    build_images
    deploy_services
    
    log_info "Development environment deployed successfully!"
    log_info "Services available:"
    log_info "  - MCP Server: stdio transport (main)"
    log_info "  - HTTP API: http://localhost:3000 (if enabled)"
    log_info "  - MongoDB: localhost:27017"
    log_info "  - Mongo Express: http://localhost:8081 (run with --profile debug)"
    log_info ""
    log_info "View logs: $0 logs"
    log_info "Stop services: $0 stop"
}

cmd_prod() {
    ENVIRONMENT="production"
    
    # Production requires stricter checks
    if [[ ! -f "$PROJECT_ROOT/credentials.json" ]]; then
        log_error "Production requires credentials.json file"
        exit 1
    fi
    
    check_dependencies  
    check_files
    check_credentials
    backup_data
    build_images
    deploy_services
    
    log_info "Production environment deployed successfully!"
    log_info "Services available:"
    log_info "  - MCP Server: stdio transport (main)"
    log_info "  - HTTP API: http://localhost:3000"
    log_info "  - Health Check: http://localhost:3000/health"
    log_info "  - Metrics: http://localhost:9090 (if enabled)"
    log_info ""
    log_info "Monitor logs: $0 logs"
    log_info "Check status: $0 status"
}

cmd_stop() {
    stop_services
    log_info "All services stopped"
}

cmd_restart() {
    restart_services
    log_info "Services restarted successfully"
}

cmd_logs() {
    local service_name="${1:-}"
    show_logs "$service_name"
}

cmd_status() {
    show_service_status
}

cmd_cleanup() {
    cleanup_docker
    log_info "Cleanup completed"
}

cmd_backup() {
    BACKUP_DATA=true
    backup_data
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
    print_banner
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--fresh)
                BUILD_FRESH=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -t|--timeout)
                HEALTHCHECK_TIMEOUT="$2"
                shift 2
                ;;
            -b|--backup)
                BACKUP_DATA=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            dev|prod|stop|restart|logs|status|cleanup|backup)
                COMMAND="$1"
                shift
                break
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check for command
    if [[ -z "${COMMAND:-}" ]]; then
        log_error "No command specified"
        show_usage
        exit 1
    fi
    
    # Execute command
    case "$COMMAND" in
        dev)
            cmd_dev
            ;;
        prod)
            cmd_prod
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        logs)
            cmd_logs "$@"
            ;;
        status)
            cmd_status
            ;;
        cleanup)
            cmd_cleanup
            ;;
        backup)
            cmd_backup
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"