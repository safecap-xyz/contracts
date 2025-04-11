// scripts/test-original-factory.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing with original factory...");

  // Connect to the NFT contract first
  const nftAddress = "0x68f8c5d65C0d3ef6218784baF10cab3e75d373ED";
  const nft = await ethers.getContractAt("CampaignNFT", nftAddress);

  // Get the original factory address from the NFT
  const originalFactoryAddress = await nft.campaignFactoryAddress();
  console.log("Original factory address (from NFT):", originalFactoryAddress);

  // Connect to the original factory
  const originalFactory = await ethers.getContractAt("CampaignFactory", originalFactoryAddress);

  // Get campaigns from the original factory
  try {
    const originalCampaigns = await originalFactory.getDeployedCampaigns();
    console.log("Campaigns from original factory:", originalCampaigns);

    if (originalCampaigns.length > 0) {
      // We have campaigns from the original factory, we can test with these
      console.log("Found campaigns from original factory. We can test donation with these.");

      // Get the first campaign
      const campaignAddress = originalCampaigns[0];
      const campaign = await ethers.getContractAt("Campaign", campaignAddress);

      // Check campaign details
      const creator = await campaign.creator();
      const goal = await campaign.goalAmount();
      console.log(`Campaign at ${campaignAddress}:`);
      console.log(`- Creator: ${creator}`);
      console.log(`- Goal: ${ethers.formatEther(goal)} ETH`);

      // Get user balance
      const [account] = await ethers.getSigners();
      console.log("Your address:", account.address);
      const initialNFTBalance = await nft.balanceOf(account.address);
      console.log("Initial NFT balance:", initialNFTBalance.toString());

      // Make a donation
      console.log("\nMaking a test donation of 0.01 ETH...");
      const tx = await account.sendTransaction({
        to: campaignAddress,
        value: ethers.parseEther("0.01")
      });
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Donation confirmed!");

      // Check if NFT was received
      const newNFTBalance = await nft.balanceOf(account.address);
      console.log("New NFT balance:", newNFTBalance.toString());
      
      if (newNFTBalance > initialNFTBalance) {
        console.log("SUCCESS! You received an NFT for your donation.");
      } else {
        console.log("No new NFT received.");
      }
    } else {
      console.log("No campaigns found from original factory.");
      
      // Create a campaign with the original factory
      console.log("\nCreating a campaign with the original factory...");
      const [account] = await ethers.getSigners();
      const tx = await originalFactory.createCampaign(
        account.address, 
        ethers.parseEther("0.05"), 
        ethers.ZeroAddress, 
        "ipfs://test-uri"
      );
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Campaign created!");
      
      // Get the new campaign
      const updatedCampaigns = await originalFactory.getDeployedCampaigns();
      console.log("Updated campaigns:", updatedCampaigns);
    }
  } catch (error) {
    console.log("Error interacting with original factory:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });