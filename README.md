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

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Start local blockchain node
npm run node

# Deploy to local network
npm run deploy:local
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