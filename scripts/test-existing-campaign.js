// scripts/test-existing-campaign.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing existing campaign...");

  try {
    // 1. CONNECT TO CONTRACTS
    console.log("\n--- CONNECTING TO CONTRACTS ---");
    
    // Connect to factory
    const factoryAddress = "0x1E5C37687A4b93172aef6aC00265379012dF0097";
    const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);
    console.log("Connected to factory at:", factoryAddress);
    
    // Get NFT contract address from factory
    const nftAddress = await factory.nftContractAddress();
    console.log("NFT contract address:", nftAddress);
    
    // Connect to NFT contract
    const nft = await ethers.getContractAt("CampaignNFT", nftAddress);
    console.log("Connected to NFT contract at:", nftAddress);
    
    // Get existing campaigns
    const campaigns = await factory.getDeployedCampaigns();
    console.log("Existing campaigns:", campaigns);
    
    if (campaigns.length === 0) {
      console.log("No existing campaigns found!");
      return;
    }
    
    // Use the first existing campaign
    const existingCampaignAddress = campaigns[0];
    console.log("Using existing campaign at:", existingCampaignAddress);
    
    // Connect to the existing campaign
    const campaign = await ethers.getContractAt("Campaign", existingCampaignAddress);
    
    // Get current account
    const [account] = await ethers.getSigners();
    console.log("Your address:", account.address);
    
    // Check campaign details
    const creator = await campaign.creator();
    const goalAmount = await campaign.goalAmount();
    const acceptedToken = await campaign.acceptedToken();
    const totalRaised = await campaign.totalRaised();
    const isActive = await campaign.fundingActive();
    
    console.log("Campaign creator:", creator);
    console.log("Campaign goal:", ethers.formatEther(goalAmount), "ETH");
    console.log("Accepted token:", acceptedToken === ethers.ZeroAddress ? "ETH" : acceptedToken);
    console.log("Total raised so far:", ethers.formatEther(totalRaised), "ETH");
    console.log("Campaign active:", isActive);
    
    // Verify this campaign is recognized by the factory
    const isCampaign = await factory.isCampaign(existingCampaignAddress);
    console.log("Is recognized by factory:", isCampaign);
    
    // Calculate remaining amount needed to reach goal
    const remaining = goalAmount - totalRaised;
    console.log(`Remaining amount needed: ${ethers.formatEther(remaining)} ETH`);
    
    // Check if campaign is active before donating
    if (!isActive) {
      console.log("Campaign is not active, cannot donate!");
      return;
    }
    
    // 2. MAKE A DONATION
    console.log("\n--- MAKING DONATION ---");
    
    // Check initial NFT balance
    const initialNFTBalance = await nft.balanceOf(account.address);
    console.log("Initial NFT balance:", initialNFTBalance.toString());
    
    // Make donation with ETH - using the receive() function by directly sending ETH
    const donationAmount = ethers.parseEther("0.01"); // 0.01 ETH
    console.log(`Making donation of ${ethers.formatEther(donationAmount)} ETH`);
    
    // Test if the campaign is valid from the NFT's perspective
    try {
      const validCampaign = await factory.checkIsCampaign(existingCampaignAddress);
      console.log("Is campaign valid according to factory.checkIsCampaign():", validCampaign);
    } catch (error) {
      console.log("Error checking if campaign is valid:", error.message);
    }
    
    // Make the donation
    try {
      const donateTx = await account.sendTransaction({
        to: existingCampaignAddress,
        value: donationAmount
      });
      
      console.log("Donation transaction sent:", donateTx.hash);
      await donateTx.wait();
      console.log("Donation confirmed!");
      
      // Check if donation updated total raised
      const newTotalRaised = await campaign.totalRaised();
      console.log("New total raised:", ethers.formatEther(newTotalRaised), "ETH");
      
      // Check if NFT was received
      const newNFTBalance = await nft.balanceOf(account.address);
      console.log("New NFT balance:", newNFTBalance.toString());
      
      if (newNFTBalance > initialNFTBalance) {
        console.log("Successfully received NFT for donation!");
      } else {
        console.log("Did not receive NFT for donation.");
      }
    } catch (error) {
      console.log("Error making donation:", error.message);
    }
    
    console.log("\n--- TEST COMPLETE ---");
    
  } catch (error) {
    console.error("Error in test:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });