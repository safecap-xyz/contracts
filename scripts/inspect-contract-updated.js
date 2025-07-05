// scripts/inspect-contract-updated.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Inspecting campaign contract...");

  try {
    // Connect to your factory contract
    const factoryAddress = "0x1E5C37687A4b93172aef6aC00265379012dF0097";
    const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);
    
    // Get deployed campaigns
    const campaignAddresses = await factory.getDeployedCampaigns();
    console.log("Deployed campaigns:", campaignAddresses);
    
    if (campaignAddresses.length === 0) {
      console.log("No campaigns found.");
      return;
    }
    
    // Connect to the first campaign
    const campaignAddress = campaignAddresses[0];
    console.log("Examining campaign at:", campaignAddress);
    const campaign = await ethers.getContractAt("Campaign", campaignAddress);
    
    // Print out information about the interface
    console.log("\nInterface functions:");
    const functionFragments = campaign.interface.fragments.filter(f => f.type === 'function');
    functionFragments.forEach(fragment => {
      console.log(`- ${fragment.name}`);
    });
    
    // Try to call some functions
    console.log("\nTrying to call functions:");
    
    for (const fragment of functionFragments) {
      const funcName = fragment.name;
      // Only try to call view/pure functions with no parameters
      if ((fragment.stateMutability === 'view' || fragment.stateMutability === 'pure') && 
          fragment.inputs.length === 0) {
        try {
          const result = await campaign[funcName]();
          console.log(`${funcName}() => ${result.toString()}`);
        } catch (error) {
          console.log(`${funcName}() Error: ${error.message}`);
        }
      } else {
        console.log(`${funcName}() - Not a parameter-less view/pure function, skipping...`);
      }
    }
    
    // Check factory functions
    console.log("\nFactory Interface functions:");
    const factoryFunctionFragments = factory.interface.fragments.filter(f => f.type === 'function');
    factoryFunctionFragments.forEach(fragment => {
      console.log(`- ${fragment.name}`);
    });
    
    // Try to call view functions on factory
    console.log("\nTrying to call factory functions:");
    for (const fragment of factoryFunctionFragments) {
      const funcName = fragment.name;
      // Only try to call view/pure functions with no parameters
      if ((fragment.stateMutability === 'view' || fragment.stateMutability === 'pure') && 
          fragment.inputs.length === 0) {
        try {
          const result = await factory[funcName]();
          console.log(`${funcName}() => ${result.toString()}`);
        } catch (error) {
          console.log(`${funcName}() Error: ${error.message}`);
        }
      } else {
        console.log(`${funcName}() - Not a parameter-less view/pure function, skipping...`);
      }
    }
    
  } catch (error) {
    console.error("Error inspecting contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });