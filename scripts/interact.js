const { ethers } = require("hardhat");

/**
 * This script demonstrates how to interact with deployed contracts on testnet
 * Run with: npx hardhat run scripts/interact.js --network sepolia
 * 
 * Before running, update the addresses below with your deployed contract addresses
 */

// Update these with your deployed contract addresses
const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS_HERE";
const NFT_ADDRESS = "YOUR_NFT_ADDRESS_HERE"; 
const CAMPAIGN_ADDRESS = "YOUR_CAMPAIGN_ADDRESS_HERE"; // Optional, if you want to interact with a specific campaign

async function main() {
  console.log("Interacting with contracts on testnet...");
  
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  // Connect to the factory contract
  const factory = await ethers.getContractAt("CampaignFactory", FACTORY_ADDRESS);
  console.log("Connected to CampaignFactory at:", FACTORY_ADDRESS);
  
  // Connect to the NFT contract
  const nft = await ethers.getContractAt("CampaignNFT", NFT_ADDRESS);
  console.log("Connected to CampaignNFT at:", NFT_ADDRESS);
  
  // Get all deployed campaigns
  const campaigns = await factory.getDeployedCampaigns();
  console.log("\nDeployed campaigns:", campaigns);
  
  // Choose which campaign to interact with
  let campaignToInteract;
  if (CAMPAIGN_ADDRESS !== "YOUR_CAMPAIGN_ADDRESS_HERE") {
    // Use the specified campaign address
    campaignToInteract = CAMPAIGN_ADDRESS;
  } else if (campaigns.length > 0) {
    // Use the first deployed campaign
    campaignToInteract = campaigns[0];
  } else {
    console.log("No campaigns deployed yet. Creating a sample campaign...");
    
    // Create a new campaign
    const tx = await factory.createCampaign(
      signer.address, // Using the signer as the creator
      ethers.parseEther("0.1"), // 0.1 ETH goal
      ethers.ZeroAddress, // Using ETH
      "ipfs://QmSampleCampaignMetadata"
    );
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    
    // Extract campaign address from events
    const event = receipt.logs.filter(
      (log) => log.fragment && log.fragment.name === "CampaignCreated"
    )[0];
    
    campaignToInteract = event.args[1];
    console.log("New campaign created at:", campaignToInteract);
  }
  
  // Connect to the campaign
  const campaign = await ethers.getContractAt("Campaign", campaignToInteract);
  console.log("\nInteracting with campaign at:", campaignToInteract);
  
  // Get campaign info
  const creator = await campaign.creator();
  const goal = await campaign.goalAmount();
  const totalRaised = await campaign.totalRaised();
  const isActive = await campaign.fundingActive();
  const isClaimed = await campaign.fundsClaimed();
  
  console.log("Campaign Info:");
  console.log("- Creator:", creator);
  console.log("- Goal:", ethers.formatEther(goal), "ETH");
  console.log("- Total raised:", ethers.formatEther(totalRaised), "ETH");
  console.log("- Active:", isActive);
  console.log("- Funds claimed:", isClaimed);
  
  // Make a donation if active
  if (isActive && !isClaimed) {
    const donationAmount = ethers.parseEther("0.01"); // 0.01 ETH donation
    console.log("\nMaking a donation of", ethers.formatEther(donationAmount), "ETH");
    
    const tx = await signer.sendTransaction({
      to: campaignToInteract,
      value: donationAmount
    });
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Donation successful!");
    
    // Check updated campaign total
    const newTotal = await campaign.totalRaised();
    console.log("New campaign total:", ethers.formatEther(newTotal), "ETH");
    
    // Check NFT balance
    const nftBalance = await nft.balanceOf(signer.address);
    console.log("Your NFT balance:", nftBalance.toString());
    
    // Check campaign association for the latest NFT
    if (nftBalance > 0) {
      const tokenId = nftBalance - BigInt(1); // Latest token
      const linkedCampaign = await nft.campaignForTokenId(tokenId);
      console.log(`Token ${tokenId} is linked to campaign: ${linkedCampaign}`);
    }
  } else {
    console.log("\nCampaign is not active or funds already claimed. Skipping donation.");
  }
  
  // If you're the creator and goal is reached, claim funds
  if (creator.toLowerCase() === signer.address.toLowerCase() && 
      !isClaimed && 
      totalRaised >= goal) {
    console.log("\nYou are the creator and the goal is reached. Claiming funds...");
    
    const tx = await campaign.claimFunds();
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log("Funds successfully claimed!");
  } else if (creator.toLowerCase() === signer.address.toLowerCase() && !isClaimed) {
    console.log("\nYou are the creator but the goal is not yet reached.");
    console.log(`Current: ${ethers.formatEther(totalRaised)} ETH, Goal: ${ethers.formatEther(goal)} ETH`);
  }
  
  console.log("\nScript execution completed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
