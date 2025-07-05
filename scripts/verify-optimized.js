const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Verifying Optimized SafeCap Contracts on Etherscan");
  console.log("===================================================");

  // Load deployment data
  if (!fs.existsSync("./optimized-deployment.json")) {
    console.error("❌ Deployment data not found. Run deploy-optimized.js first.");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync("./optimized-deployment.json", "utf8"));
  const contracts = deploymentData.contracts;
  const deployer = deploymentData.deployer;

  console.log("📄 Contract Addresses to Verify:");
  console.log("   Registry:", contracts.registry);
  console.log("   Factory:", contracts.factory);
  console.log("   NFT:", contracts.nft);
  console.log("   Sample Campaign:", contracts.sampleCampaign);
  console.log("");

  try {
    // Verify CampaignRegistry
    console.log("1️⃣ Verifying CampaignRegistry...");
    try {
      await hre.run("verify:verify", {
        address: contracts.registry,
        constructorArguments: [
          deployer // initialOwner
        ],
        contract: "contracts/optimized/CampaignRegistry.sol:CampaignRegistry"
      });
      console.log("   ✅ CampaignRegistry verified successfully");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("   ✅ CampaignRegistry already verified");
      } else {
        console.log("   ❌ CampaignRegistry verification failed:", error.message);
      }
    }

    // Verify OptimizedCampaignFactory
    console.log("\n2️⃣ Verifying OptimizedCampaignFactory...");
    try {
      await hre.run("verify:verify", {
        address: contracts.factory,
        constructorArguments: [
          contracts.registry, // registry address
          deployer // initialOwner
        ],
        contract: "contracts/optimized/OptimizedCampaignFactory.sol:OptimizedCampaignFactory"
      });
      console.log("   ✅ OptimizedCampaignFactory verified successfully");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("   ✅ OptimizedCampaignFactory already verified");
      } else {
        console.log("   ❌ OptimizedCampaignFactory verification failed:", error.message);
      }
    }

    // Verify UniversalCampaignNFT
    console.log("\n3️⃣ Verifying UniversalCampaignNFT...");
    try {
      await hre.run("verify:verify", {
        address: contracts.nft,
        constructorArguments: [
          contracts.registry, // registry address
          "https://api.safecap.org/nft/metadata/", // baseURI
          deployer // initialOwner
        ],
        contract: "contracts/optimized/UniversalCampaignNFT.sol:UniversalCampaignNFT"
      });
      console.log("   ✅ UniversalCampaignNFT verified successfully");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("   ✅ UniversalCampaignNFT already verified");
      } else {
        console.log("   ❌ UniversalCampaignNFT verification failed:", error.message);
      }
    }

    // Verify Sample Campaign
    if (contracts.sampleCampaign) {
      console.log("\n4️⃣ Verifying Sample Campaign...");
      try {
        await hre.run("verify:verify", {
          address: contracts.sampleCampaign,
          constructorArguments: [
            deployer, // creator
            ethers.parseEther("0.1"), // goal
            ethers.ZeroAddress, // token (ETH)
            contracts.nft, // nftContract
            "https://api.safecap.org/campaigns/test-campaign" // uri
          ],
          contract: "contracts/Campaign.sol:Campaign"
        });
        console.log("   ✅ Sample Campaign verified successfully");
      } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
          console.log("   ✅ Sample Campaign already verified");
        } else {
          console.log("   ❌ Sample Campaign verification failed:", error.message);
        }
      }
    }

    console.log("\n🎉 VERIFICATION SUMMARY");
    console.log("======================");
    console.log("✅ Contract verification process completed!");
    console.log("");
    console.log("🔗 View verified contracts on Etherscan:");
    console.log(`   Registry: https://sepolia.etherscan.io/address/${contracts.registry}`);
    console.log(`   Factory: https://sepolia.etherscan.io/address/${contracts.factory}`);
    console.log(`   NFT: https://sepolia.etherscan.io/address/${contracts.nft}`);
    if (contracts.sampleCampaign) {
      console.log(`   Campaign: https://sepolia.etherscan.io/address/${contracts.sampleCampaign}`);
    }
    console.log("");
    console.log("📖 Benefits of verification:");
    console.log("   • Source code is publicly viewable");
    console.log("   • Contract functions can be called directly from Etherscan");
    console.log("   • Enhanced transparency and trust");
    console.log("   • Easier debugging and interaction");
    console.log("");
    console.log("🚀 Next Steps:");
    console.log("   • Update frontend with verified contract addresses");
    console.log("   • Configure creation fees if needed");
    console.log("   • Deploy to mainnet using same process");

  } catch (error) {
    console.error("\n❌ Verification process failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script execution failed:");
    console.error(error);
    process.exit(1);
  });