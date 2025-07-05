const { ethers } = require("hardhat");

/**
 * This script helps migrate an existing deployment to fix the circular dependency issue.
 * It reads the address of the existing NFT contract and updates it to point to the correct factory.
 * 
 * Run with: npx hardhat run scripts/migrate-existing-deployment.js --network <network>
 */

// REPLACE THESE WITH YOUR ACTUAL DEPLOYED CONTRACT ADDRESSES
const EXISTING_NFT_ADDRESS = "0x68f8c5d8cfc78d4fd6eb7b41106077d5918fe31b"; // The already deployed NFT contract
const CURRENT_FACTORY_ADDRESS = "0x1E5C37687A4b93172aef6aC00265379012dF0097"; // Your current factory

async function main() {
  console.log("Starting migration of existing deployment...");
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  try {
    // 1. Connect to the existing NFT contract
    console.log(`Connecting to existing NFT contract at ${EXISTING_NFT_ADDRESS}...`);
    const nft = await ethers.getContractAt("CampaignNFT", EXISTING_NFT_ADDRESS);

    // 2. Check the current factory address in the NFT contract
    const currentFactoryInNFT = await nft.campaignFactoryAddress();
    console.log(`Current factory address in NFT: ${currentFactoryInNFT}`);
    console.log(`Target factory address: ${CURRENT_FACTORY_ADDRESS}`);

    if (currentFactoryInNFT.toLowerCase() === CURRENT_FACTORY_ADDRESS.toLowerCase()) {
      console.log("NFT is already pointing to the correct factory. No action needed.");
      return;
    }

    // 3. Check if the NFT contract allows updating the factory address
    // This can be done by checking if campaignFactoryAddress is immutable
    let canUpdate = true;
    try {
      // Try to call updateFactoryAddress to see if it exists
      const updateMethodExists = nft.updateFactoryAddress;
      if (!updateMethodExists) {
        canUpdate = false;
        console.log("The NFT contract does not have an updateFactoryAddress method.");
      }
    } catch (error) {
      canUpdate = false;
      console.log("Error checking update method:", error.message);
    }

    if (!canUpdate) {
      console.log("\n❌ MIGRATION FAILED: Cannot update the factory address.");
      console.log("The NFT contract likely has an immutable factory address reference.");
      console.log("You need to redeploy both contracts following the steps in FIXED_ARCHITECTURE.md");
      return;
    }

    // 4. Update the factory address in the NFT contract
    console.log("\nUpdating factory address in NFT contract...");
    const tx = await nft.updateFactoryAddress(CURRENT_FACTORY_ADDRESS);
    console.log("Transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("Transaction confirmed!");

    // 5. Verify the update
    const updatedFactoryInNFT = await nft.campaignFactoryAddress();
    console.log(`Updated factory address in NFT: ${updatedFactoryInNFT}`);

    if (updatedFactoryInNFT.toLowerCase() === CURRENT_FACTORY_ADDRESS.toLowerCase()) {
      console.log("\n✅ MIGRATION SUCCESSFUL: NFT now points to the correct factory.");
    } else {
      console.log("\n❌ MIGRATION FAILED: NFT still points to the wrong factory.");
    }

    // 6. Test a sample campaign (optional)
    console.log("\nWould you like to create a test campaign to verify the setup? (y/n)");
    // In an actual script, you'd wait for user input
    // For this example, we'll assume yes
    const shouldTest = true;

    if (shouldTest) {
      // Connect to the factory
      const factory = await ethers.getContractAt("CampaignFactory", CURRENT_FACTORY_ADDRESS);

      // Create a test campaign
      console.log("Creating a test campaign...");
      const testTx = await factory.createCampaign(
        deployer.address, 
        ethers.parseEther("0.05"), 
        ethers.ZeroAddress, 
        "ipfs://TestCampaignAfterMigration"
      );
      
      const receipt = await testTx.wait();
      const event = receipt.logs.filter(
        (log) => log.fragment && log.fragment.name === "CampaignCreated"
      )[0];

      if (event) {
        const campaignAddress = event.args[1];
        console.log("Test campaign created at:", campaignAddress);
        
        // Make a small donation to test the complete flow
        console.log("Making a test donation...");
        const donationTx = await deployer.sendTransaction({
          to: campaignAddress,
          value: ethers.parseEther("0.01")
        });
        
        await donationTx.wait();
        console.log("Test donation completed!");
        
        // Check NFT balance
        const nftBalance = await nft.balanceOf(deployer.address);
        console.log("Your NFT balance after donation:", nftBalance.toString());
        
        if (nftBalance > 0) {
          console.log("✅ FULL TEST SUCCESSFUL: NFT minted successfully!");
        } else {
          console.log("❌ FULL TEST FAILED: NFT was not minted. Check contract interactions.");
        }
      } else {
        console.log("Could not find campaign created event.");
      }
    }

  } catch (error) {
    console.error("Migration failed with error:", error);
    console.log("\nPossible solutions:");
    console.log("1. Check that contract addresses are correct");
    console.log("2. Ensure you have the right permissions (contract owner)");
    console.log("3. Verify that the NFT contract has been deployed with the updated code");
    console.log("4. Follow the instructions in FIXED_ARCHITECTURE.md for a complete redeployment");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });