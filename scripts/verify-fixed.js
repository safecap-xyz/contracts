const { run } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting contract verification...");

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
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log("Contracts to verify:");
  console.log("1. NFT Contract:", nftAddress);
  console.log("2. Factory Contract:", factoryAddress);
  console.log("3. Sample Campaign:", sampleCampaignAddress);

  // Verify NFT contract
  console.log("\nVerifying NFT contract...");
  try {
    await run("verify:verify", {
      address: nftAddress,
      constructorArguments: [
        factoryAddress, // Uses the final factory address
        "ipfs://",     // Base URI
        deployerAddress // Initial owner
      ],
    });
    console.log("✅ NFT contract verified successfully");
  } catch (error) {
    console.log("❌ NFT contract verification failed:", error.message);
  }

  // Verify Factory contract
  console.log("\nVerifying Factory contract...");
  try {
    await run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [
        nftAddress,     // NFT contract address
        deployerAddress // Initial owner
      ],
    });
    console.log("✅ Factory contract verified successfully");
  } catch (error) {
    console.log("❌ Factory contract verification failed:", error.message);
  }

  // Verify Sample Campaign
  if (sampleCampaignAddress) {
    console.log("\nVerifying Sample Campaign contract...");
    try {
      // Connect to sample campaign to get its parameters
      const campaign = await ethers.getContractAt("Campaign", sampleCampaignAddress);
      const goalAmount = await campaign.goalAmount();
      const acceptedToken = await campaign.acceptedToken();
      const campaignURI = await campaign.campaignURI();

      await run("verify:verify", {
        address: sampleCampaignAddress,
        constructorArguments: [
          deployerAddress, // Creator
          goalAmount,      // Goal amount
          acceptedToken,   // Accepted token
          nftAddress,      // NFT contract
          campaignURI      // Campaign URI
        ],
      });
      console.log("✅ Sample Campaign contract verified successfully");
    } catch (error) {
      console.log("❌ Sample Campaign verification failed:", error.message);
    }
  }

  console.log("\nVerification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });