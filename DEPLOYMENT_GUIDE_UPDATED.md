# SafeCap Deployment Guide (Updated)

This updated guide provides step-by-step instructions for deploying the improved SafeCap contracts, which fix the circular dependency issue between the CampaignFactory and CampaignNFT contracts.

## Prerequisites

1. Node.js and npm/yarn installed
2. Access to an Ethereum testnet (like Sepolia) or mainnet
3. Etherscan API key (for contract verification)
4. Private key of a funded account on your target network

## Setup Environment

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/yourusername/safecap.git
   cd safecap/onchain-dapp
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file with the following variables:
   ```
   PRIVATE_KEY=your_private_key_without_0x_prefix
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   REPORT_GAS=true
   ```

## Deployment Process

### 1. Deploy Contracts

Run the improved deployment script:

```bash
npx hardhat run scripts/deploy-fixed.js --network sepolia
```

This script will:
- Deploy a temporary factory
- Deploy the NFT contract
- Deploy the final factory
- Update the NFT contract to point to the final factory
- Create a sample campaign
- Save all addresses to `deployed-addresses.json`

The script outputs detailed information about each step and provides a summary of all deployed contract addresses at the end.

### 2. Verify Contracts

Verify the contracts on Etherscan:

```bash
npx hardhat run scripts/verify-fixed.js --network sepolia
```

This makes your contract code visible and interactable on Etherscan.

### 3. Test Donation Flow

Test that everything works by making a donation:

```bash
npx hardhat run scripts/test-donation.js --network sepolia
```

This script checks:
- Contract connections are correct
- Campaign validation works properly
- Donations can be made successfully
- NFTs are minted correctly

## Interacting with Contracts

You can use the scripts provided to interact with your deployed contracts:

### Create a New Campaign

```javascript
// scripts/create-campaign.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const deployedAddresses = JSON.parse(fs.readFileSync("./deployed-addresses.json", "utf8"));
  const factory = await ethers.getContractAt("CampaignFactory", deployedAddresses.factoryAddress);
  
  const [creator] = await ethers.getSigners();
  const goal = ethers.parseEther("0.2"); // 0.2 ETH
  const token = ethers.ZeroAddress; // Using ETH
  const campaignURI = "ipfs://YOUR_IPFS_CID"; // Replace with your campaign metadata
  
  const tx = await factory.createCampaign(creator.address, goal, token, campaignURI);
  const receipt = await tx.wait();
  
  const event = receipt.logs.filter(
    (log) => log.fragment && log.fragment.name === "CampaignCreated"
  )[0];
  
  console.log("New campaign created at:", event.args[1]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Making a Donation

```javascript
// scripts/donate.js
const { ethers } = require("hardhat");

async function main() {
  const campaignAddress = "YOUR_CAMPAIGN_ADDRESS"; // Replace with your campaign address
  const campaign = await ethers.getContractAt("Campaign", campaignAddress);
  
  const [donor] = await ethers.getSigners();
  const donationAmount = ethers.parseEther("0.01"); // 0.01 ETH
  
  const tx = await donor.sendTransaction({
    to: campaignAddress,
    value: donationAmount
  });
  
  await tx.wait();
  console.log("Donation successful!");
  
  const totalRaised = await campaign.totalRaised();
  console.log("Total raised:", ethers.formatEther(totalRaised), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Frontend Integration

To integrate with your frontend:

1. Use the addresses from `deployed-addresses.json`
2. Connect to the contracts using ethers.js or web3.js
3. Implement functions for:
   - Creating campaigns
   - Listing active campaigns
   - Donating to campaigns
   - Checking NFT balances

Example frontend snippet:

```javascript
// Connect to contracts
const factory = new ethers.Contract(factoryAddress, factoryAbi, provider);
const nft = new ethers.Contract(nftAddress, nftAbi, provider);

// Get all campaigns
const campaigns = await factory.getDeployedCampaigns();

// Create a new campaign
const tx = await factory.connect(signer).createCampaign(
  creatorAddress,
  ethers.parseEther("0.1"),
  ethers.ZeroAddress,
  "ipfs://YOUR_CAMPAIGN_METADATA"
);

// Make a donation
const tx = await signer.sendTransaction({
  to: campaignAddress,
  value: ethers.parseEther("0.01")
});
```

## Troubleshooting

1. **Error: "Caller is not a valid campaign"**
   - The NFT contract doesn't recognize the campaign as valid
   - Solution: Verify that the NFT contract's `campaignFactoryAddress` points to the correct factory using:
     ```
     const factoryInNft = await nft.campaignFactoryAddress();
     ```
   - If incorrect, update it with:
     ```
     await nft.updateFactoryAddress(correctFactoryAddress);
     ```

2. **Transaction Failures**
   - Check that you have enough ETH for gas
   - Ensure contract addresses are correct
   - Verify function parameters match expected types

3. **Contract Verification Failures**
   - Ensure constructor arguments match exactly
   - Check that the contract code matches the deployed bytecode
   - Make sure your Etherscan API key is correct

## Conclusion

By following this guide, you should have successfully deployed the improved SafeCap contracts that fix the circular dependency issue. The system now properly allows campaign creation, donations, and NFT minting.

For more details on the architectural changes, see [FIXED_ARCHITECTURE.md](./FIXED_ARCHITECTURE.md).