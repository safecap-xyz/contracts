const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the contracts in the correct order
  
  // Step 1: Get contract factories
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const CampaignNFT = await ethers.getContractFactory("CampaignNFT");
  
  // Step 2: Deploy the factory first with a placeholder NFT address (will be updated later)
  // Using zero address as placeholder
  console.log("Deploying CampaignFactory...");
  const tempNftAddress = ethers.ZeroAddress;
  const campaignFactory = await CampaignFactory.deploy(tempNftAddress, deployer.address);
  await campaignFactory.waitForDeployment();
  const factoryAddress = await campaignFactory.getAddress();
  console.log("CampaignFactory deployed to:", factoryAddress);
  
  // Step 3: Deploy the NFT contract with the factory address
  console.log("Deploying CampaignNFT...");
  // Use an IPFS gateway as base URI for NFT metadata
  const baseURI = "ipfs://"; // Will be appended with CID for each token
  const campaignNFT = await CampaignNFT.deploy(factoryAddress, baseURI, deployer.address);
  await campaignNFT.waitForDeployment();
  const nftAddress = await campaignNFT.getAddress();
  console.log("CampaignNFT deployed to:", nftAddress);
  
  // Step 4: Now we need to deploy a new instance of the factory with the correct NFT address
  console.log("Deploying final CampaignFactory with correct NFT address...");
  const finalFactory = await CampaignFactory.deploy(nftAddress, deployer.address);
  await finalFactory.waitForDeployment();
  const finalFactoryAddress = await finalFactory.getAddress();
  console.log("Final CampaignFactory deployed to:", finalFactoryAddress);
  
  // Step 5: For testing, create a sample campaign
  console.log("Creating a sample campaign...");
  // Parameters for a sample campaign
  const creator = deployer.address;
  const goal = ethers.parseEther("0.1"); // 0.1 ETH goal (smaller for easier testing)
  const token = ethers.ZeroAddress; // Using ETH for this sample
  const campaignURI = "ipfs://QmSampleCID"; // Example IPFS URI for campaign metadata
  
  // Create the campaign
  const tx = await finalFactory.createCampaign(creator, goal, token, campaignURI);
  const receipt = await tx.wait();
  
  // Extract campaign address from events
  const event = receipt.logs.filter(
    (log) => log.fragment && log.fragment.name === "CampaignCreated"
  )[0];
  
  if (event) {
    const campaignAddress = event.args[1]; // Second indexed parameter is the campaign address
    console.log("Sample campaign created at:", campaignAddress);
  }
  
  // Print a summary of all deployed contracts
  console.log("\nDeployment Summary:");
  console.log("---------------------");
  console.log("CampaignNFT: ", nftAddress);
  console.log("CampaignFactory: ", finalFactoryAddress);
  console.log("Sample Campaign: ", event ? event.args[1] : "Failed to create");
  console.log("\nNext Steps:");
  console.log("1. Update FACTORY_ADDRESS, NFT_ADDRESS, and CAMPAIGN_ADDRESS in scripts/interact.js");
  console.log("2. Run interaction script: npx hardhat run scripts/interact.js --network sepolia");
  console.log("3. Verify contracts on Etherscan (optional):\n   npx hardhat verify --network sepolia " + finalFactoryAddress + " " + nftAddress + " " + deployer.address);
  console.log("   npx hardhat verify --network sepolia " + nftAddress + " " + finalFactoryAddress + " \"ipfs://\" " + deployer.address);
  console.log("\nSee DEPLOYMENT_GUIDE.md for more detailed instructions.");
  
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
