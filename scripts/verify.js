const hre = require("hardhat");

async function main() {
  console.log("Verifying contract...");
  
  try {
    // The contract address to verify
    const contractAddress = "0x1E5C37687A4b93172aef6aC00265379012dF0097";
    
    // Constructor arguments
    const args = [
      "0x68f8c5d65C0d3ef6218784baF10cab3e75d373ED",
      "0xFd638308290BD73ab40F1C04d9EB9c1e93525c31"
    ];
    
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      network: "sepolia"
    });
    
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });