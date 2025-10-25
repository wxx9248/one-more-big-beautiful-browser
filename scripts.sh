#!/bin/bash

# Color output for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to install dependencies
install_deps() {
    echo -e "${BLUE}=== Installing dependencies for all projects ===${NC}\n"
    
    echo -e "${GREEN}[1/3] Installing extension dependencies...${NC}"
    cd "$SCRIPT_DIR/extension" && pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install extension dependencies${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}[2/3] Installing web dependencies...${NC}"
    cd "$SCRIPT_DIR/web" && pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install web dependencies${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}[3/3] Installing server dependencies...${NC}"
    cd "$SCRIPT_DIR/server" && uv sync
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install server dependencies${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ All dependencies installed successfully!${NC}"
}

# Function to start all projects
start_projects() {
    echo -e "${BLUE}=== Starting all projects ===${NC}\n"
    
    # Trap SIGINT (Ctrl+C) to kill all background processes
    trap 'echo -e "\n${RED}Stopping all projects...${NC}"; kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM
    
    echo -e "${GREEN}Starting extension (Browser Extension)...${NC}"
    cd "$SCRIPT_DIR/extension" && pnpm dev &
    EXTENSION_PID=$!
    
    echo -e "${GREEN}Starting web (Next.js) on port 3000...${NC}"
    cd "$SCRIPT_DIR/web" && pnpm dev -p 3001 &
    WEB_PID=$!
    
    echo -e "${GREEN}Starting server (Python) on port 8080...${NC}"
    cd "$SCRIPT_DIR/server" && PORT=8080 uv run python main.py &
    SERVER_PID=$!
    
    echo -e "\n${GREEN}✓ All projects started!${NC}"
    echo -e "${BLUE}Process IDs:${NC}"
    echo -e "  Extension: $EXTENSION_PID"
    echo -e "  Web:       $WEB_PID"
    echo -e "  Server:    $SERVER_PID"
    echo -e "\n${BLUE}Press Ctrl+C to stop all projects${NC}\n"
    
    # Wait for all background processes
    wait
}

# Main script logic
case "$1" in
    install)
        install_deps
        ;;
    start)
        start_projects
        ;;
    *)
        echo -e "${BLUE}Usage:${NC}"
        echo -e "  $0 install    Install dependencies for all projects"
        echo -e "  $0 start      Start all projects"
        echo -e "\n${BLUE}Examples:${NC}"
        echo -e "  $0 install    # Install dependencies"
        echo -e "  $0 start      # Start all three projects"
        exit 1
        ;;
esac
