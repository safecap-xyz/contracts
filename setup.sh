#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Setting up OnchainKit development environment...${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}pnpm could not be found. Please install pnpm first.${NC}"
    echo "Visit https://pnpm.io/installation for installation instructions."
    exit 1
fi

echo -e "${GREEN}Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}Compiling smart contracts...${NC}"
pnpm run compile

echo -e "${GREEN}Running tests to verify setup...${NC}"
pnpm test

# Check if .env file exists, if not copy from example
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your own values.${NC}"
fi

echo -e "${GREEN}Setup complete! 🎉${NC}"
echo -e "${GREEN}You can now start developing with OnchainKit and Hardhat.${NC}"
echo ""
echo "Available commands:"
echo "  pnpm run compile - Compile smart contracts"
echo "  pnpm test - Run tests"
echo "  pnpm run deploy - Deploy contracts"
echo "  pnpm run interact - Interact with deployed contracts"
