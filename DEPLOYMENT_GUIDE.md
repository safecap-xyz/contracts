# Deployment Guide for Crowdfunding DApp

This guide walks you through the process of deploying and testing the Web3 crowdfunding platform on Sepolia testnet.

## Prerequisites

- Node.js and npm installed
- Ethereum wallet with Sepolia ETH
- Alchemy or Infura account for RPC access

## Setup

1. Install project dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:
- `SEPOLIA_RPC_URL`: Your Sepolia RPC URL from Alchemy or Infura
- `PRIVATE_KEY`: Your wallet private key (with or without 0x prefix)
- `ETHERSCAN_API_KEY`: For contract verification (optional but recommended)

## Deployment to Sepolia

1. Compile the contracts:

```bash
npm run compile
```

2. Deploy to Sepolia testnet:

```bash
npm run deploy:testnet
```

The script will:
- Deploy the CampaignFactory contract (temporary)
- Deploy the CampaignNFT contract
- Deploy the final CampaignFactory with the NFT address
- Create a sample campaign

3. Save the deployed contract addresses that are logged in the console:

```
CampaignNFT deployed to: 0x...
Final CampaignFactory deployed to: 0x...
Sample campaign created at: 0x...
```

## Testing the Deployment

### 1. Verify Contracts (Optional but Recommended)

Verify your contracts on Etherscan for Sepolia:

#### Using the verification script:

```bash
# Update the script with your contract addresses and constructor arguments
# Edit the /scripts/verify.js file first, then run:
npm run verify
# or with pnpm
pnpm run verify
```

#### Manual verification:

```bash
npx hardhat verify --network sepolia <FACTORY_ADDRESS> <NFT_ADDRESS> <OWNER_ADDRESS>
npx hardhat verify --network sepolia <NFT_ADDRESS> <FACTORY_ADDRESS> "ipfs://" <OWNER_ADDRESS>
```

Make sure you have the `@nomicfoundation/hardhat-verify` plugin installed and configured in your hardhat.config.js file.

### 2. Interact with Deployed Contracts

You can interact with the contracts using:

- Etherscan (if verified)
- Hardhat console
- A frontend application

#### Using Hardhat Console:

```bash
npx hardhat console --network sepolia
```

Then:

```javascript
// Connect to the factory
const factory = await ethers.getContractAt("CampaignFactory", "YOUR_FACTORY_ADDRESS");

// Get deployed campaigns
const campaigns = await factory.getDeployedCampaigns();
console.log(campaigns);

// Connect to a campaign
const campaign = await ethers.getContractAt("Campaign", campaigns[0]);
const creator = await campaign.creator();
console.log("Creator:", creator);

// Make a donation (replace with your wallet's address)
const [sender] = await ethers.getSigners();
await sender.sendTransaction({
  to: campaigns[0],
  value: ethers.parseEther("0.01")
});
```

### 3. Check NFT Minting

After making a donation:

```javascript
// Connect to the NFT contract
const nft = await ethers.getContractAt("CampaignNFT", "YOUR_NFT_ADDRESS");

// Check NFT balance
const [sender] = await ethers.getSigners();
const balance = await nft.balanceOf(sender.address);
console.log("NFT balance:", balance);

// Get token ID and campaign link if balance > 0
if (balance > 0) {
  const tokenId = 0; // If this is your first NFT
  const campaign = await nft.campaignForTokenId(tokenId);
  console.log(`Token ${tokenId} is from campaign: ${campaign}`);
}
```

## Next Steps

1. **Create new campaigns**:

```javascript
await factory.createCampaign(
  "0xYourCreatorAddress", // Creator address
  ethers.parseEther("1"),  // Goal amount (1 ETH)
  ethers.ZeroAddress,     // Using ETH
  "ipfs://YourCampaignMetadataURI"
);
```

2. **Claim funds** (as creator):

```javascript
// Connect as creator
const campaign = await ethers.getContractAt("Campaign", "CAMPAIGN_ADDRESS");
await campaign.claimFunds();
```

## Common Issues

1. **Not enough Sepolia ETH**: Get some from a faucet
2. **Transaction failed**: Check gas settings and error message
3. **NFT not minting**: Verify campaign-factory-NFT connections are correct
