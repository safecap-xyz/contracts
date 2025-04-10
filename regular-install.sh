#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Color codes for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Installing OpenZeppelin contracts directly...${NC}"

# Create a new temporary directory for node_modules if it doesn't exist
if [ ! -d "./node_modules" ]; then
  mkdir -p ./node_modules
fi

# Create a new directory for OpenZeppelin contracts
mkdir -p ./node_modules/@openzeppelin

# Clone the OpenZeppelin contracts repo directly
echo -e "${GREEN}Cloning OpenZeppelin contracts...${NC}"
git clone --depth 1 --branch v5.0.1 https://github.com/OpenZeppelin/openzeppelin-contracts.git ./node_modules/@openzeppelin/contracts

echo -e "${GREEN}OpenZeppelin contracts installed successfully!${NC}"
echo -e "Now you can try running: ${YELLOW}pnpm run compile${NC}"
