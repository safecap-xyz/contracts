const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("💰 Checking wallet balance for deployment");
  console.log("=========================================");
  
  console.log("Wallet address:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log("Current balance:", balanceInEth, "ETH");
  
  // Estimate deployment cost
  const estimatedGas = 1880000; // Optimized deployment gas usage
  const gasPrice = await deployer.provider.getFeeData();
  const estimatedCostWei = BigInt(estimatedGas) * gasPrice.gasPrice;
  const estimatedCostEth = ethers.formatEther(estimatedCostWei);
  
  console.log("Estimated deployment cost:", estimatedCostEth, "ETH");
  console.log("Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
  
  const hasEnoughBalance = balance > estimatedCostWei * 2n; // 2x buffer
  
  if (hasEnoughBalance) {
    console.log("✅ Sufficient balance for deployment");
    console.log("💡 Ready to deploy optimized contracts!");
  } else {
    console.log("❌ Insufficient balance for deployment");
    console.log("💡 Please fund wallet with Base Sepolia ETH from faucet:");
    console.log("   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    console.log(`   Fund address: ${deployer.address}`);
  }
  
  console.log("\n🚀 Once funded, deploy with:");
  console.log("   npx hardhat run scripts/deploy-optimized.js --network base-sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });