const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SafeCapLoanVault...");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Mainnet Euler addresses
  const EULER_SWAP_FACTORY = "0xf0CFe22d23699ff1B2CFe6B8f706A6DB63911262";
  const EVC_ADDRESS = "0x5301c7dD20bD945D2013b48ed0DEE3A284ca8989";
  const FEE_RECIPIENT = deployer.address; // Use deployer address to avoid checksum issues
  
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