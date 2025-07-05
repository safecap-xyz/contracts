#!/bin/bash

# Color codes for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Creating a full local setup outside of PNPM workspace...${NC}"

# Create a new directory for the direct setup
mkdir -p ./direct-setup
cd ./direct-setup

# Copy necessary files
cp -r ../contracts .
cp -r ../test .
cp -r ../scripts .
cp -r ../tasks .
cp ../hardhat.config.js .
cp ../.env* .

# Initialize a new package.json
echo -e "${GREEN}Initializing package.json...${NC}"
cat > package.json << 'EOL'
{
  "name": "onchain-dapp-direct",
  "version": "1.0.0",
  "description": "Direct setup for onchain-dapp",
  "main": "index.js",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy": "hardhat run scripts/deploy.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@nomicfoundation/hardhat-verify": "^2.0.0",
    "@openzeppelin/contracts": "^5.0.1",
    "chai": "^4.3.7",
    "dotenv": "^16.0.3",
    "ethers": "^6.7.1",
    "hardhat": "^2.22.1",
    "hardhat-gas-reporter": "^1.0.8",
    "solidity-coverage": "^0.8.0"
  }
}
EOL

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

echo -e "${GREEN}Setup complete!${NC}"
echo -e "To use this setup, run:${NC}"
echo -e "cd direct-setup"
echo -e "npm run compile"
echo -e "npm test"
