# SafeCap Fixed Architecture Guide

This guide explains the changes made to fix the circular dependency issue in the SafeCap contracts and provides instructions for deploying and testing the improved architecture.

## The Problem

The original architecture had a circular dependency between the CampaignFactory and CampaignNFT contracts:

1. The CampaignNFT contract had an `immutable` factory address parameter, which couldn't be changed after deployment.
2. The CampaignFactory needed the NFT address to create campaigns that could mint NFTs.
3. This created a "chicken and egg" problem that couldn't be solved with the existing architecture.

## The Solution

1. Made `campaignFactoryAddress` in the CampaignNFT contract mutable (removed `immutable` keyword).
2. Created a deployment process that:
   - Deploys a temporary factory
   - Deploys the NFT contract pointing to this temporary factory
   - Deploys the final factory pointing to the NFT contract
   - Updates the NFT contract to point to the final factory
   - Creates a test campaign

This approach breaks the circular dependency by allowing the NFT contract's factory reference to be updated after deployment.

## Deployment Steps

1. **Deploy the contracts using the fixed script**:
   ```
   npx hardhat run scripts/deploy-fixed.js --network <network>
   ```
   This script will:
   - Deploy all contracts in the correct order
   - Set up the proper references between contracts
   - Create a sample campaign for testing
   - Save all addresses to `deployed-addresses.json`

2. **Verify the contracts on the blockchain explorer**:
   ```
   npx hardhat run scripts/verify-fixed.js --network <network>
   ```
   This verifies all contracts so their code is visible and interactable on Etherscan or similar explorers.

3. **Test the donation flow**:
   ```
   npx hardhat run scripts/test-donation.js --network <network>
   ```
   This script will:
   - Connect to all contracts
   - Verify the contract references are set up correctly
   - Attempt to make a donation
   - Check if an NFT is minted correctly

## Integration with Frontend

After deployment, you'll need to update your frontend application with the new contract addresses:

1. Use the addresses from `deployed-addresses.json`:
   - `nftAddress`: The address of the CampaignNFT contract
   - `factoryAddress`: The address of the CampaignFactory contract
   - `sampleCampaignAddress`: The address of the sample campaign (optional)

2. Make sure your frontend interacts with the contracts in this order:
   - Connect to the CampaignFactory first
   - Use the factory to create and track campaigns
   - Campaigns will automatically interact with the NFT contract when donations are made

## Troubleshooting

If you encounter issues after deployment:

1. **"Caller is not a valid campaign" error when donating**:
   - This indicates that the NFT contract is still pointing to an old factory address
   - Solution: Call `updateFactoryAddress()` on the NFT contract with the correct factory address

2. **Factory doesn't recognize campaigns**:
   - Check that campaigns were created by the current factory
   - Campaigns created by previous factory versions won't be recognized

3. **NFTs not being minted**:
   - Verify the CampaignNFT contract has the correct factoryAddress
   - Ensure the Campaign has the correct NFT address

## Contract Addresses

Keep track of your deployed contracts in a separate file for reference:

```
NFT Contract: 0x...
Factory Contract: 0x...
Sample Campaign: 0x...
```

## Future Improvements

1. Implement a proper factory upgradeability pattern
2. Add a registry contract to manage factory versions
3. Consider using OpenZeppelin's proxy contracts for upgradeability

## Conclusion

With these changes, the circular dependency issue is resolved, allowing the contracts to function properly. The key insight was making the NFT contract's factory reference mutable, which allows for a proper deployment sequence.