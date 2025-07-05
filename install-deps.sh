#!/bin/bash

# Set colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Installing dependencies for onchain-dapp project...${NC}"

# Install hardhat and related dependencies
echo -e "${GREEN}Installing Hardhat and dependencies...${NC}"
pnpm install

echo -e "${GREEN}Dependencies installed successfully!${NC}"
echo -e "You can now compile the smart contracts with: ${YELLOW}pnpm run compile${NC}"
