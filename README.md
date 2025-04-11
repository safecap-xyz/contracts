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

```example deploy output

npx hardhat run scripts/deploy-fixed.js --network sepolia
Compiled 1 Solidity file successfully (evm target: paris).
Deploying contracts with the account: 0xFd638308290BD73ab40F1C04d9EB9c1e93525c31
Account balance: 0.49450364347326239

========== DEPLOYMENT PROCESS ==========
1. Deploy a temporary factory first (will be replaced)
   Temporary factory deployed to: 0xCf3296D63b25B69a7c6027ff21F49d94aB0A3AB5

2. Deploy the NFT contract with the temporary factory address


   NFT contract deployed to: 0x558Ad3978181FD4dD1F8a2B4053630B010830e8D

3. Deploy the final factory pointing to the NFT contract
   Final factory deployed to: 0x622862bB20cB29c8954FF32e10615e8526b199d4

4. Update the NFT contract to point to the final factory
   NFT contract updated to use final factory
   NFT now points to factory: 0x622862bB20cB29c8954FF32e10615e8526b199d4
   Expected factory address: 0x622862bB20cB29c8954FF32e10615e8526b199d4
   ✅ Update successful

5. Create a sample campaign for testing
   Creating campaign...
   Sample campaign created at: 0xDB432e59A3Ec627bc3B64bcb6b4c3e58b66dae55

6. Verify campaign is recognized by the factory and NFT
   Factory recognizes campaign: true
   Factory checkIsCampaign() gives: true

========== DEPLOYMENT SUMMARY ==========
CampaignNFT:       0x558Ad3978181FD4dD1F8a2B4053630B010830e8D
CampaignFactory:   0x622862bB20cB29c8954FF32e10615e8526b199d4
Sample Campaign:   0xDB432e59A3Ec627bc3B64bcb6b4c3e58b66dae55

Next Steps:
1. Run verification script: npx hardhat run scripts/verify-fixed.js --network <network>
2. Test the deployment: npx hardhat run scripts/test-donation.js --network <network>
3. Update these addresses in your frontend application

Addresses saved to deployed-addresses.json

Deployment completed successfully!
```

# test donation 

```
npx hardhat run scripts/test-donation.js --network sepolia
Testing donation flow with fixed contract architecture...

1. CONNECTING TO CONTRACTS
   Donor account: 0xFd638308290BD73ab40F1C04d9EB9c1e93525c31
   Campaign Factory: 0x622862bB20cB29c8954FF32e10615e8526b199d4
   NFT Contract: 0x558Ad3978181FD4dD1F8a2B4053630B010830e8D
   Sample Campaign: 0xDB432e59A3Ec627bc3B64bcb6b4c3e58b66dae55

2. VERIFYING CONTRACT CONNECTIONS
   NFT points to factory: 0x622862bB20cB29c8954FF32e10615e8526b199d4
   Expected factory: 0x622862bB20cB29c8954FF32e10615e8526b199d4
   ✅ NFT points to correct factory
   Factory recognizes campaign: true
   ✅ Campaign is recognized by factory
   Factory.checkIsCampaign() result: true
   ✅ Campaign passes validation check

3. CAMPAIGN DETAILS
   Creator: 0xFd638308290BD73ab40F1C04d9EB9c1e93525c31
   Goal: 0.1 ETH
   Accepted token: ETH
   Total raised: 0.0 ETH
   Active: true

4. MAKING A DONATION
   Initial NFT balance: 0
   Making donation of 0.01 ETH...
   Transaction sent: 0xf8d53d6ea9baceaba5e8518db657f50c26c9f20622d5365bfc154c39f3b89089
   ✅ Transaction confirmed
   New NFT balance: 1
   ✅ NFT successfully minted
   Token ID 0 is associated with campaign: 0xDB432e59A3Ec627bc3B64bcb6b4c3e58b66dae55
   ✅ Token correctly associated with campaign
   New campaign total: 0.01 ETH
   ✅ Campaign balance updated correctly

Test completed
```

# notes on nft failure 

```
The NFT contract verification failed because there's a mismatch in the constructor arguments. The verification script is trying to use the final factory address as the constructor argument, but when the NFT was deployed, it initially used the temporary factory address.
Here's what happened:

During deployment:

NFT was deployed with temporary factory address (0xCf3296D63b25B69a7c6027ff21F49d94aB0A3AB5)
Later, the updateFactoryAddress function was called to update it to the final factory address


During verification:

The script is trying to verify using the current/final factory address (0x622862bB20cB29c8954FF32e10615e8526b199d4)
Etherscan expects the original constructor arguments used at deployment



To fix this verification issue, you need to modify the verification script to use the temporary factory address for the NFT contract. Here's how to fix it:

Edit the scripts/verify-fixed.js file:

bashnpx hardhat run scripts/verify-fixed.js --network sepolia
Change this line in the NFT verification section:
javascriptconstructorArguments: [
  factoryAddress, // Change this to use the temporary factory address
  "ipfs://",
  deployerAddress
],
To:
javascriptconstructorArguments: [
  "0xCf3296D63b25B69a7c6027ff21F49d94aB0A3AB5", // Use the temporary factory address from deployment logs
  "ipfs://",
  deployerAddress
],

Run the verification again:

bashnpx hardhat run scripts/verify-fixed.js --network sepolia --force
You need the --force flag since you've already tried verification once.
Despite this verification issue, your contracts are working correctly:

The Factory contract verified successfully
The Sample Campaign verified successfully
Only the NFT contract verification had an issue, which is just about the verification process, not functionality

Your contracts are properly deployed and the architecture is fixed. You can use these contracts in your application without any issues.
```

