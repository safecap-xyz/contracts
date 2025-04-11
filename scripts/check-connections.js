// scripts/check-connections.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Checking contract connections...");

  // Connect to factory
  const factoryAddress = "0x1E5C37687A4b93172aef6aC00265379012dF0097";
  const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);
  console.log("Factory address:", factoryAddress);
  
  // Get NFT contract address from factory
  const nftAddress = await factory.nftContractAddress();
  console.log("NFT address from factory:", nftAddress);
  
  // Connect to NFT contract
  const nft = await ethers.getContractAt("CampaignNFT", nftAddress);
  
  // Get factory address from NFT
  const factoryFromNFT = await nft.campaignFactoryAddress();
  console.log("Factory address from NFT:", factoryFromNFT);
  console.log("Do they match?", factoryAddress === factoryFromNFT);
  
  // Get existing campaigns
  const campaigns = await factory.getDeployedCampaigns();
  console.log("Campaign addresses:", campaigns);
  
  // Check if each campaign is recognized
  for (const campaignAddress of campaigns) {
    const isValidInMapping = await factory.isCampaign(campaignAddress);
    const isValidViaFunction = await factory.checkIsCampaign(campaignAddress);
    console.log(`Campaign ${campaignAddress}:`);
    console.log(`  - Valid via isCampaign mapping: ${isValidInMapping}`);
    console.log(`  - Valid via checkIsCampaign function: ${isValidViaFunction}`);
    
    // Connect to the campaign
    const campaign = await ethers.getContractAt("Campaign", campaignAddress);
    
    // Get NFT address from campaign
    const nftFromCampaign = await campaign.nftContractAddress();
    console.log(`  - NFT address from campaign: ${nftFromCampaign}`);
    console.log(`  - Matches factory's NFT? ${nftFromCampaign === nftAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });