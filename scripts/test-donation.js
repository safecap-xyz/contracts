const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Testing donation flow with fixed contract architecture...");

  // Load deployed contract addresses
  let deployedAddresses;
  try {
    deployedAddresses = JSON.parse(fs.readFileSync("./deployed-addresses.json", "utf8"));
  } catch (error) {
    console.error("Failed to load deployed-addresses.json. Make sure you've run deploy-fixed.js first.");
    console.error(error);
    return;
  }

  const { nftAddress, factoryAddress, sampleCampaignAddress } = deployedAddresses;
  const [donor] = await ethers.getSigners();

  console.log("\n1. CONNECTING TO CONTRACTS");
  console.log("   Donor account:", donor.address);
  console.log("   Campaign Factory:", factoryAddress);
  console.log("   NFT Contract:", nftAddress);
  console.log("   Sample Campaign:", sampleCampaignAddress);

  // Connect to contracts
  const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);
  const nft = await ethers.getContractAt("CampaignNFT", nftAddress);
  const campaign = await ethers.getContractAt("Campaign", sampleCampaignAddress);

  // Verify the NFT contract points to the correct factory
  const factoryInNft = await nft.campaignFactoryAddress();
  console.log("\n2. VERIFYING CONTRACT CONNECTIONS");
  console.log(`   NFT points to factory: ${factoryInNft}`);
  console.log(`   Expected factory: ${factoryAddress}`);
  
  if (factoryInNft.toLowerCase() !== factoryAddress.toLowerCase()) {
    console.log("   ❌ ERROR: NFT contract is not pointing to the correct factory");
    console.log("   Fix this issue by calling updateFactoryAddress on the NFT contract");
    return;
  } else {
    console.log("   ✅ NFT points to correct factory");
  }

  // Verify the factory recognizes the campaign
  const isCampaign = await factory.isCampaign(sampleCampaignAddress);
  console.log(`   Factory recognizes campaign: ${isCampaign}`);
  
  if (!isCampaign) {
    console.log("   ❌ ERROR: Factory does not recognize this campaign");
    return;
  } else {
    console.log("   ✅ Campaign is recognized by factory");
  }

  // Check if campaign can be validated through the factory's checkIsCampaign function
  const isValidCampaign = await factory.checkIsCampaign(sampleCampaignAddress);
  console.log(`   Factory.checkIsCampaign() result: ${isValidCampaign}`);
  
  if (!isValidCampaign) {
    console.log("   ❌ ERROR: Campaign validation failed");
    return;
  } else {
    console.log("   ✅ Campaign passes validation check");
  }

  // Get campaign details
  console.log("\n3. CAMPAIGN DETAILS");
  const creator = await campaign.creator();
  const goalAmount = await campaign.goalAmount();
  const acceptedToken = await campaign.acceptedToken();
  const totalRaised = await campaign.totalRaised();
  const isActive = await campaign.fundingActive();

  console.log(`   Creator: ${creator}`);
  console.log(`   Goal: ${ethers.formatEther(goalAmount)} ETH`);
  console.log(`   Accepted token: ${acceptedToken === ethers.ZeroAddress ? "ETH" : acceptedToken}`);
  console.log(`   Total raised: ${ethers.formatEther(totalRaised)} ETH`);
  console.log(`   Active: ${isActive}`);

  if (!isActive) {
    console.log("   ❌ Campaign is not active, skipping donation test");
    return;
  }

  // Check initial NFT balance
  console.log("\n4. MAKING A DONATION");
  const initialNftBalance = await nft.balanceOf(donor.address);
  console.log(`   Initial NFT balance: ${initialNftBalance}`);

  // Make donation
  const donationAmount = ethers.parseEther("0.01");
  console.log(`   Making donation of ${ethers.formatEther(donationAmount)} ETH...`);
  
  try {
    const tx = await donor.sendTransaction({
      to: sampleCampaignAddress,
      value: donationAmount
    });
    
    console.log("   Transaction sent:", tx.hash);
    await tx.wait();
    console.log("   ✅ Transaction confirmed");

    // Check if NFT was minted
    const newNftBalance = await nft.balanceOf(donor.address);
    console.log(`   New NFT balance: ${newNftBalance}`);
    
    if (newNftBalance > initialNftBalance) {
      console.log("   ✅ NFT successfully minted");
      
      // Get token ID and campaign association
      const tokenId = newNftBalance - BigInt(1); // Latest token ID
      const associatedCampaign = await nft.campaignForTokenId(tokenId);
      console.log(`   Token ID ${tokenId} is associated with campaign: ${associatedCampaign}`);
      
      if (associatedCampaign.toLowerCase() === sampleCampaignAddress.toLowerCase()) {
        console.log("   ✅ Token correctly associated with campaign");
      } else {
        console.log("   ❌ Token associated with wrong campaign");
      }
    } else {
      console.log("   ❌ NFT not minted. Something went wrong.");
    }

    // Check updated campaign balance
    const newTotalRaised = await campaign.totalRaised();
    console.log(`   New campaign total: ${ethers.formatEther(newTotalRaised)} ETH`);
    
    if (newTotalRaised > totalRaised) {
      console.log("   ✅ Campaign balance updated correctly");
    } else {
      console.log("   ❌ Campaign balance not updated");
    }
  } catch (error) {
    console.log("   ❌ Error making donation:", error.message);
    
    // If the error contains "Caller is not a valid campaign", it indicates the circular dependency issue
    if (error.message.includes("Caller is not a valid campaign")) {
      console.log("\n🔄 CIRCULAR DEPENDENCY DETECTED");
      console.log("   The NFT contract is not recognizing campaigns from the factory.");
      console.log("   This likely means the NFT contract is still pointing to an old factory address.");
      console.log("   Solution: Update the NFT contract's factory address using updateFactoryAddress()");
    }
  }

  console.log("\nTest completed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });