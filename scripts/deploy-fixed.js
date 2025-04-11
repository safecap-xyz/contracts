const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Step 1: Get contract factories
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const CampaignNFT = await ethers.getContractFactory("CampaignNFT");

  console.log("\n========== DEPLOYMENT PROCESS ==========");
  console.log("1. Deploy a temporary factory first (will be replaced)");
  // Using zero address as placeholder for NFT
  const tempFactory = await CampaignFactory.deploy(ethers.ZeroAddress, deployer.address);
  await tempFactory.waitForDeployment();
  const tempFactoryAddress = await tempFactory.getAddress();
  console.log("   Temporary factory deployed to:", tempFactoryAddress);

  console.log("\n2. Deploy the NFT contract with the temporary factory address");
  const baseURI = "ipfs://"; // Will be appended with CID for each token
  const nft = await CampaignNFT.deploy(tempFactoryAddress, baseURI, deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   NFT contract deployed to:", nftAddress);

  console.log("\n3. Deploy the final factory pointing to the NFT contract");
  const finalFactory = await CampaignFactory.deploy(nftAddress, deployer.address);
  await finalFactory.waitForDeployment();
  const finalFactoryAddress = await finalFactory.getAddress();
  console.log("   Final factory deployed to:", finalFactoryAddress);

  console.log("\n4. Update the NFT contract to point to the final factory");
  const updateTx = await nft.updateFactoryAddress(finalFactoryAddress);
  await updateTx.wait();
  console.log("   NFT contract updated to use final factory");

  // Verify the update was successful
  const newFactoryInNft = await nft.campaignFactoryAddress();
  console.log("   NFT now points to factory:", newFactoryInNft);
  console.log("   Expected factory address:", finalFactoryAddress);
  if (newFactoryInNft.toLowerCase() === finalFactoryAddress.toLowerCase()) {
    console.log("   ✅ Update successful");
  } else {
    console.log("   ❌ Update failed");
  }

  console.log("\n5. Create a sample campaign for testing");
  // Parameters for a sample campaign
  const creator = deployer.address;
  const goal = ethers.parseEther("0.1"); // 0.1 ETH goal (smaller for easier testing)
  const token = ethers.ZeroAddress; // Using ETH for this sample
  const campaignURI = "ipfs://QmSampleCID"; // Example IPFS URI for campaign metadata

  // Create the campaign
  console.log("   Creating campaign...");
  const tx = await finalFactory.createCampaign(creator, goal, token, campaignURI);
  const receipt = await tx.wait();

  // Extract campaign address from events
  const event = receipt.logs.filter(
    (log) => log.fragment && log.fragment.name === "CampaignCreated"
  )[0];

  let sampleCampaignAddress;
  if (event) {
    sampleCampaignAddress = event.args[1]; // Second indexed parameter is the campaign address
    console.log("   Sample campaign created at:", sampleCampaignAddress);
  } else {
    console.log("   Failed to create sample campaign");
  }

  console.log("\n6. Verify campaign is recognized by the factory and NFT");
  // Check if factory recognizes the campaign
  const isCampaign = await finalFactory.isCampaign(sampleCampaignAddress);
  console.log(`   Factory recognizes campaign: ${isCampaign}`);

  // Check if campaign can be validated through the NFT contract
  const isRecognizedByCampaignFactory = await finalFactory.checkIsCampaign(sampleCampaignAddress);
  console.log(`   Factory checkIsCampaign() gives: ${isRecognizedByCampaignFactory}`);

  // Print deployment summary
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("CampaignNFT:      ", nftAddress);
  console.log("CampaignFactory:  ", finalFactoryAddress);
  console.log("Sample Campaign:  ", sampleCampaignAddress || "Failed to create");
  console.log("\nNext Steps:");
  console.log("1. Run verification script: npx hardhat run scripts/verify-fixed.js --network <network>");
  console.log("2. Test the deployment: npx hardhat run scripts/test-donation.js --network <network>");
  console.log("3. Update these addresses in your frontend application");
  
  // Save addresses to a file for future scripts
  const fs = require("fs");
  const data = {
    nftAddress,
    factoryAddress: finalFactoryAddress,
    sampleCampaignAddress
  };
  
  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(data, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });