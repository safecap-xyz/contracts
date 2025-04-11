# Web3 Crowdfunding Platform

A decentralized crowdfunding platform with NFT rewards for donors.

## Smart Contract Architecture

This project implements a complete smart contract architecture for a Web3 crowdfunding platform similar to Kickstarter or GoFundMe, with NFT rewards for donors.

### Key Components

1. **CampaignFactory**: A singleton contract that deploys new Campaign contracts for creators.

2. **Campaign**: Individual campaign contracts that hold funds for specific fundraisers and manage their state. Each time a creator launches a fundraiser, the Factory deploys a new instance of this contract.

3. **CampaignNFT**: An ERC721 contract that mints NFTs to donors as a record and reward for their contribution.

### Features

- Support for both ETH and ERC20 token donations
- NFT rewards for donors
- Campaign goal enforcement with Kickstarter-like funding model
- Campaign management functions (pause/resume funding)
- Complete onchain tracking of fundraising progress

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

### Installation

```bash
# Install dependencies
pnpm install

# Compile smart contracts
pnpm run compile

# Run tests to verify setup
pnpm test
```

### Environment Setup

1. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your own values:

```
# Network RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
BASE_TESTNET_RPC_URL=https://goerli.base.org

# Private key (with or without 0x prefix - our code handles both formats)
PRIVATE_KEY=your-private-key-here

# API Keys for verification and services
ETHERSCAN_API_KEY=your-etherscan-api-key
ALCHEMY_API_KEY=your-alchemy-api-key
```

### Using Hardhat

This project uses [Hardhat](https://hardhat.org/) for Ethereum development. Here are some common commands:

```bash
# Compile contracts
pnpm run compile

# Run tests
pnpm test

# Deploy contracts
pnpm run deploy

# Interact with deployed contracts
pnpm run interact

# Verify contracts on Etherscan (Sepolia)
pnpm run verify

# Run a local Hardhat node
npx hardhat node

# Deploy to a local Hardhat node
npx hardhat run --network localhost scripts/deploy.js
```

## Testing

The project includes comprehensive test suites for all contracts, covering donation flows, NFT minting, fund claiming, and administrative functions.

## Deployment

The deployment script handles the following steps in the correct order:

1. Deploy CampaignFactory
2. Deploy CampaignNFT with the factory address
3. Deploy final CampaignFactory with the NFT address
4. Create a sample campaign for testing

## Implementation Details

I've implemented the Web3 crowdfunding smart contract architecture for your platform. The system features:

1. A factory pattern with three main contracts:
    
    - `CampaignFactory`: Deploys individual campaign contracts and tracks them
    - `Campaign`: Handles donations, NFT rewards, and fund claiming for specific fundraisers
    - `CampaignNFT`: Mints NFTs to donors as receipts and rewards
2. Key capabilities:
    
    - Support for both ETH and ERC20 token donations
    - NFT rewards for donors automatically minted on contribution
    - Goal enforcement (Kickstarter model) with creator fund claiming
    - Campaign management (pause/resume)
    - Complete testing suite with mocks
3. Security features:
    
    - OpenZeppelin's contracts for security best practices
    - Non-reentrant functions for donation and claiming
    - Proper access control throughout
    - Safe token transfer handling

The deployment script correctly handles the interdependency between factory and NFT contracts, and comprehensive tests cover all core functionality. The architecture follows a modular design that allows for easy extension and maintenance.

## Deployment Guide

For detailed instructions on deploying the smart contracts, please refer to the DEPLOYMENT_GUIDE.md file.