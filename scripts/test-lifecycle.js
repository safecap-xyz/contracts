// scripts/test-lifecycle.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing campaign lifecycle...");

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
    
    // Get current campaigns
    const campaigns = await factory.getDeployedCampaigns();
    console.log("Existing campaigns:", campaigns);
    
    // Get current account
    const [account] = await ethers.getSigners();
    console.log("Your address:", account.address);
    
    // 2. CREATE A NEW CAMPAIGN
    console.log("\n--- CREATING NEW CAMPAIGN ---");
    
    const goal = ethers.parseEther("0.05"); // 0.05 ETH
    const token = ethers.ZeroAddress; // Using ETH
    const uri = "ipfs://test-campaign-uri";
    
    console.log(`Creating campaign with goal of ${ethers.formatEther(goal)} ETH`);
    
    // Call createCampaign
    const createTx = await factory.createCampaign(
      account.address,
      goal,
      token,
      uri
    );
    
    console.log("Create transaction sent:", createTx.hash);
    await createTx.wait();
    
    // Get updated campaign list
    const updatedCampaigns = await factory.getDeployedCampaigns();
    const newCampaignAddress = updatedCampaigns[updatedCampaigns.length - 1];
    console.log("New campaign created at:", newCampaignAddress);
    
    // Connect to the new campaign
    const campaign = await ethers.getContractAt("Campaign", newCampaignAddress);
    
    // Verify the campaign details
    const creator = await campaign.creator();
    const goalAmount = await campaign.goalAmount();
    const campaignNFTAddress = await campaign.nftContractAddress();
    
    console.log("Campaign creator:", creator);
    console.log("Campaign goal:", ethers.formatEther(goalAmount), "ETH");
    console.log("Campaign NFT contract:", campaignNFTAddress);
    
    // 3. MAKE A DONATION
    console.log("\n--- MAKING DONATION ---");
    
    // Check initial NFT balance
    const initialNFTBalance = await nft.balanceOf(account.address);
    console.log("Initial NFT balance:", initialNFTBalance.toString());
    
    // Make donation with ETH
    const donationAmount = ethers.parseEther("0.02"); // 0.02 ETH
    console.log(`Making donation of ${ethers.formatEther(donationAmount)} ETH`);
    
    const donateTx = await account.sendTransaction({
      to: newCampaignAddress,
      value: donationAmount
    });
    
    console.log("Donation transaction sent:", donateTx.hash);
    await donateTx.wait();
    
    // Check if donation updated total raised
    const totalRaised = await campaign.totalRaised();
    console.log("Total raised:", ethers.formatEther(totalRaised), "ETH");
    
    // Check if NFT was received
    const newNFTBalance = await nft.balanceOf(account.address);
    console.log("New NFT balance:", newNFTBalance.toString());
    
    if (newNFTBalance > initialNFTBalance) {
      const tokenId = newNFTBalance - 1; // Assuming token IDs start at 0
      const campaignForToken = await nft.campaignForTokenId(tokenId);
      console.log(`NFT token ID ${tokenId} is for campaign:`, campaignForToken);
    }
    
    // 4. MAKE A SECOND DONATION TO REACH GOAL
    console.log("\n--- MAKING SECOND DONATION TO REACH GOAL ---");
    
    // Calculate remaining amount needed to reach goal
    const remaining = goalAmount - totalRaised;
    console.log(`Remaining amount needed: ${ethers.formatEther(remaining)} ETH`);
    
    // Make second donation with ETH
    console.log(`Making second donation of ${ethers.formatEther(remaining)} ETH`);
    
    const donate2Tx = await account.sendTransaction({
      to: newCampaignAddress,
      value: remaining
    });
    
    console.log("Second donation transaction sent:", donate2Tx.hash);
    await donate2Tx.wait();
    
    // Check updated total raised
    const updatedTotalRaised = await campaign.totalRaised();
    console.log("Updated total raised:", ethers.formatEther(updatedTotalRaised), "ETH");
    
    // 5. CLAIM FUNDS
    console.log("\n--- CLAIMING FUNDS ---");
    
    // Check if goal is reached
    const isFunded = updatedTotalRaised >= goalAmount;
    console.log("Goal reached:", isFunded);
    
    // Check balances before claiming
    const beforeBalance = await ethers.provider.getBalance(account.address);
    console.log("Creator balance before claiming:", ethers.formatEther(beforeBalance), "ETH");
    
    // Claim funds
    const claimTx = await campaign.claimFunds();
    console.log("Claim transaction sent:", claimTx.hash);
    const claimReceipt = await claimTx.wait();
    
    // Check balances after claiming
    const afterBalance = await ethers.provider.getBalance(account.address);
    console.log("Creator balance after claiming:", ethers.formatEther(afterBalance), "ETH");
    
    // Calculate gas used for the claim transaction
    const gasCost = claimReceipt.gasUsed * claimReceipt.gasPrice;
    console.log("Gas cost for claim:", ethers.formatEther(gasCost), "ETH");
    
    // Calculate net gain (should be approximately totalRaised minus gas)
    const netGain = afterBalance - beforeBalance + gasCost;
    console.log("Net gain from campaign:", ethers.formatEther(netGain), "ETH");
    
    // Verify campaign is empty
    const campaignBalance = await ethers.provider.getBalance(newCampaignAddress);
    console.log("Campaign final balance:", ethers.formatEther(campaignBalance), "ETH");
    
    // Check if funds were claimed flag is set
    const fundsClaimed = await campaign.fundsClaimed();
    console.log("Funds claimed status:", fundsClaimed);
    
    console.log("\n--- LIFECYCLE TEST COMPLETE ---");
    
  } catch (error) {
    console.error("Error in lifecycle test:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });