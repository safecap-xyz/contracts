const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SafeCapLoanVault...");

  // Mock addresses for Base Sepolia (replace with actual when available)
  const EULER_SWAP_FACTORY = "0x1234567890123456789012345678901234567890"; // Placeholder
  const EVC_ADDRESS = "0x1234567890123456789012345678901234567891"; // Placeholder
  const FEE_RECIPIENT = "0x742d35Cc6676C4C8D5f8e8E4f4F7AF6B5E0b5F8D"; // Your address
  
  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  // Deploy SafeCapLoanVault
  const SafeCapLoanVault = await hre.ethers.getContractFactory("SafeCapLoanVault");
  const loanVault = await SafeCapLoanVault.deploy(
    EULER_SWAP_FACTORY,
    EVC_ADDRESS, 
    FEE_RECIPIENT,
    deployer.address // Initial owner
  );

  await loanVault.deployed();

  console.log("✅ SafeCapLoanVault deployed to:", loanVault.address);
  console.log("🏗️ Transaction hash:", loanVault.deployTransaction.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: loanVault.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: loanVault.deployTransaction.hash
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