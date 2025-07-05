// scripts/inspect-contract.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Inspecting campaign contract...");

  try {
    // Connect to your factory contract
    const factoryAddress = "0x1E5C37687A4b93172aef6aC00265379012dF0097";
    const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);

    // Get deployed campaigns
    const campaignAddresses = await factory.getDeployedCampaigns();
    console.log("Deployed campaigns:", campaignAddresses);

    if (campaignAddresses.length === 0) {
      console.log("No campaigns found.");
      return;
    }

    // Connect to the first campaign
    const campaignAddress = campaignAddresses[0];
    console.log("Examining campaign at:", campaignAddress);
    const campaign = await ethers.getContractAt("Campaign", campaignAddress);

    // Inspect what functions are available on the campaign contract
    console.log("\nFunction inspection:");
    console.log("Object keys:", Object.keys(campaign).slice(0, 20)); // Show first 20 keys
    console.log("Function keys:", Object.keys(campaign.functions));

    // Try to call some functions that are likely to exist
    console.log("\nTrying common functions:");

    try {
      const creator = await campaign.creator();
      console.log("creator():", creator);
    } catch (error) {
      console.log("creator() error:", error.message);
    }

    try {
      const getCreator = await campaign.getCreator();
      console.log("getCreator():", getCreator);
    } catch (error) {
      console.log("getCreator() error:", error.message);
    }

    // Try checking if we can access campaignNFT
    try {
      const nftContract = await campaign.campaignNFT();
      console.log("campaignNFT():", nftContract);
    } catch (error) {
      console.log("campaignNFT() error:", error.message);
    }

    try {
      const nftContractGetter = await campaign.getCampaignNFT();
      console.log("getCampaignNFT():", nftContractGetter);
    } catch (error) {
      console.log("getCampaignNFT() error:", error.message);
    }

    // Try to get the campaign factory
    try {
      const factoryFromCampaign = await factory.campaignNFT();
      console.log("Factory's campaignNFT():", factoryFromCampaign);
    } catch (error) {
      console.log("Factory's campaignNFT() error:", error.message);
    }

    try {
      const factoryGetter = await factory.getCampaignNFT();
      console.log("Factory's getCampaignNFT():", factoryGetter);
    } catch (error) {
      console.log("Factory's getCampaignNFT() error:", error.message);
    }

  } catch (error) {
    console.error("Error inspecting contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
