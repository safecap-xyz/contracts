const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment data
  if (!fs.existsSync("./optimized-deployment.json")) {
    console.error("❌ Deployment data not found. Run deploy-optimized.js first.");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync("./optimized-deployment.json", "utf8"));
  const contracts = deploymentData.contracts;

  const [deployer] = await ethers.getSigners();
  
  console.log("💰 Configuring Creation Fee");
  console.log("===========================");
  console.log("Deployer:", deployer.address);
  console.log("Factory:", contracts.factory);

  // Get factory contract
  const factory = await ethers.getContractAt("OptimizedCampaignFactory", contracts.factory);

  // Set creation fee using wei for precision
  const creationFee = ethers.parseUnits("2079711169712750", "wei"); // 0.0020797111697127505 ETH in wei
  console.log("\n📝 Setting creation fee to:", ethers.formatEther(creationFee), "ETH");
  
  const setFeeTx = await factory.setCreationFee(creationFee);
  await setFeeTx.wait();
  console.log("✅ Creation fee set successfully!");

  // Verify the fee was set
  const currentFee = await factory.campaignCreationFee();
  console.log("✅ Current creation fee:", ethers.formatEther(currentFee), "ETH");

  // Check fee collection balance
  const factoryBalance = await ethers.provider.getBalance(contracts.factory);
  console.log("✅ Factory fee balance:", ethers.formatEther(factoryBalance), "ETH");

  console.log("\n💡 Revenue Configuration Complete!");
  console.log("==================================");
  console.log("• Users will pay", ethers.formatEther(creationFee), "ETH per campaign");
  console.log("• Fees collected in factory contract");
  console.log("• Withdraw fees with: factory.withdrawFees(yourAddress)");
  
  console.log("\n🎉 Creation fee configured successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Configuration failed:");
    console.error(error);
    process.exit(1);
  });