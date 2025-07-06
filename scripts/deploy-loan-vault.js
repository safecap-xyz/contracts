const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SafeCapLoanVault...");

  // Mock addresses for Base Sepolia (replace with actual when available)
  const EULER_SWAP_FACTORY = hre.ethers.getAddress("0x1234567890123456789012345678901234567890"); // Placeholder
  const EVC_ADDRESS = hre.ethers.getAddress("0x1234567890123456789012345678901234567891"); // Placeholder
  const FEE_RECIPIENT = hre.ethers.getAddress("0x742d35Cc6676C4C8D5f8e8E4f4F7AF6B5E0b5F8D"); // Your address with proper checksum
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance (updated for ethers v6)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy SafeCapLoanVault
  const SafeCapLoanVault = await hre.ethers.getContractFactory("SafeCapLoanVault");
  const loanVault = await SafeCapLoanVault.deploy(
    EULER_SWAP_FACTORY,
    EVC_ADDRESS, 
    FEE_RECIPIENT,
    deployer.address // Initial owner
  );

  await loanVault.waitForDeployment();

  const deployedAddress = await loanVault.getAddress();
  console.log("✅ SafeCapLoanVault deployed to:", deployedAddress);
  console.log("🏗️ Transaction hash:", loanVault.deploymentTransaction()?.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: deployedAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: loanVault.deploymentTransaction()?.hash
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file for easy access
  const fs = require('fs');
  fs.writeFileSync(
    './loan-vault-deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to: loan-vault-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });