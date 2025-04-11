// scripts/test-campaign-updated.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing campaign interactions...");

  try {
    // Connect to your factory contract
    const factory = await ethers.getContractAt("CampaignFactory", "0x1E5C37687A4b93172aef6aC00265379012dF0097");
    
    // Get deployed campaigns
    const campaigns = await factory.getDeployedCampaigns();
    console.log("Deployed campaigns:", campaigns);
    
    if (campaigns.length === 0) {
      console.log("No campaigns found. You might need to deploy one first.");
      return;
    }
    
    // Connect to a specific campaign (the first one in the list)
    const campaign = await ethers.getContractAt("Campaign", campaigns[0]);
    
    // First, let's try to get the goal value directly
    try {
      // Try as property access first (automatically generated getter)
      const goal = await campaign.goal();
      console.log("Goal (direct access):", ethers.formatEther(goal), "ETH");
    } catch (error) {
      console.log("Could not access goal directly:", error.message);
      
      // Try with explicit call to the getter
      try {
        const goal = await campaign.goal.call();
        console.log("Goal (call method):", ethers.formatEther(goal), "ETH");
      } catch (error) {
        console.log("Could not access goal with call method:", error.message);
      }
    }
    
    // Try getting other campaign properties
    try {
      const creator = await campaign.creator();
      console.log("Creator:", creator);
    } catch (error) {
      console.log("Could not access creator:", error.message);
    }
    
    try {
      const amountRaised = await campaign.amountRaised();
      console.log("Amount raised:", ethers.formatEther(amountRaised), "ETH");
    } catch (error) {
      console.log("Could not access amountRaised:", error.message);
    }
    
    try {
      const isActive = await campaign.isActive();
      console.log("Campaign active:", isActive);
    } catch (error) {
      console.log("Could not access isActive:", error.message);
    }
    
    try {
      // Get the NFT contract address
      const nftAddress = await factory.campaignNFT();
      console.log("Campaign NFT contract:", nftAddress);
      
      // Connect to the NFT contract
      const nft = await ethers.getContractAt("CampaignNFT", nftAddress);
      
      // Get your current account
      const [account] = await ethers.getSigners();
      console.log("Your address:", account.address);
      
      // Check your NFT balance
      const nftBalance = await nft.balanceOf(account.address);
      console.log("Your NFT balance:", nftBalance.toString());
    } catch (error) {
      console.log("Error accessing NFT contract:", error.message);
    }
    
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
