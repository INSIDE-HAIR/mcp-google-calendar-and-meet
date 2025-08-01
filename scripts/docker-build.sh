#!/bin/bash
# Google Meet MCP Server v3.0 - Docker Build Script
# Optimized multi-stage build with size optimization and caching

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="google-meet-mcp"
TAG="${TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64,linux/arm64}"
BUILD_FRESH=false
VERBOSE=false
PUSH_IMAGE=false
REGISTRY="${REGISTRY:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build Google Meet MCP Server Docker images with multi-stage optimization

OPTIONS:
    -t, --tag TAG           Image tag (default: latest)
    -p, --platform LIST     Target platforms (default: linux/amd64,linux/arm64)
    -f, --fresh             Force fresh build (no cache)
    -v, --verbose           Enable verbose output
    --push                  Push to registry after build
    --registry REGISTRY     Registry to push to (e.g., ghcr.io/user)
    -h, --help              Show this help

EXAMPLES:
    $0                                          # Basic build
    $0 -t v3.0.0 --push                       # Build and push version
    $0 --platform linux/amd64 --fresh         # Fresh build for single platform
    $0 --registry ghcr.io/myorg --push        # Push to GitHub Container Registry

EOF
}

check_buildx() {
    if ! docker buildx version >/dev/null 2>&1; then
        log_error "Docker buildx is required for multi-platform builds"
        exit 1
    fi
    
    # Create builder if not exists
    if ! docker buildx inspect multiarch >/dev/null 2>&1; then
        log_info "Creating multi-platform builder..."
        docker buildx create --name multiarch --driver docker-container --use
        docker buildx inspect --bootstrap
    else
        docker buildx use multiarch
    fi
}

build_image() {
    local full_tag="$IMAGE_NAME:$TAG"
    if [[ -n "$REGISTRY" ]]; then
        full_tag="$REGISTRY/$full_tag"
    fi
    
    log_info "Building Docker image: $full_tag"
    log_info "Platforms: $PLATFORM"
    
    local build_args=()
    build_args+=("--platform" "$PLATFORM")
    build_args+=("--tag" "$full_tag")
    build_args+=("--file" "$PROJECT_ROOT/Dockerfile")
    
    if [[ "$BUILD_FRESH" == "true" ]]; then
        build_args+=("--no-cache" "--pull")
        log_info "Building with fresh cache"
    fi
    
    if [[ "$PUSH_IMAGE" == "true" ]]; then
        build_args+=("--push")
        log_info "Will push to registry after build"
    else
        build_args+=("--load")
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        build_args+=("--progress=plain")
    fi
    
    # Build all stages
    log_info "Building production image..."
    docker buildx build "${build_args[@]}" --target production "$PROJECT_ROOT"
    
    # Build development image if requested
    if [[ "${BUILD_DEV:-false}" == "true" ]]; then
        local dev_tag="${full_tag}-dev"
        log_info "Building development image: $dev_tag"
        
        local dev_build_args=("${build_args[@]}")
        dev_build_args=(${dev_build_args[@]//$full_tag/$dev_tag})
        
        docker buildx build "${dev_build_args[@]}" --target development "$PROJECT_ROOT"
    fi
}

show_image_info() {
    local full_tag="$IMAGE_NAME:$TAG"
    if [[ -n "$REGISTRY" ]]; then
        full_tag="$REGISTRY/$full_tag"
    fi
    
    if [[ "$PUSH_IMAGE" != "true" ]]; then
        log_info "Image built successfully!"
        log_info "Image: $full_tag"
        
        # Show image size
        if docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -q "$IMAGE_NAME:$TAG"; then
            log_info "Size: $(docker images --format "{{.Size}}" "$IMAGE_NAME:$TAG")"
        fi
        
        log_info ""
        log_info "Test the image:"
        log_info "  docker run --rm -it $full_tag"
        log_info ""
        log_info "Run with credentials:"
        log_info "  docker run --rm -v ./credentials.json:/app/credentials.json $full_tag"
    else
        log_info "Image built and pushed successfully!"
        log_info "Registry: $full_tag"
    fi
}

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                TAG="$2"
                shift 2
                ;;
            -p|--platform)
                PLATFORM="$2"
                shift 2
                ;;
            -f|--fresh)
                BUILD_FRESH=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            --push)
                PUSH_IMAGE=true
                shift
                ;;
            --registry)
                REGISTRY="$2"
                shift 2
                ;;
            --dev)
                BUILD_DEV=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate registry if pushing
    if [[ "$PUSH_IMAGE" == "true" && -z "$REGISTRY" ]]; then
        log_error "Registry must be specified when pushing (use --registry)"
        exit 1
    fi
    
    # Check requirements
    check_buildx
    
    # Build image
    build_image
    
    # Show results
    show_image_info
}

main "$@"