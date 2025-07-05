const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignFactory Contract", function () {
  let CampaignFactory;
  let CampaignNFT;
  let campaignFactory;
  let campaignNFT;
  let owner;
  let creator;
  
  const GOAL_AMOUNT = ethers.parseEther("10"); // 10 ETH
  const CAMPAIGN_URI = "ipfs://QmTest";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator] = await ethers.getSigners();
    
    // Deploy contracts
    CampaignNFT = await ethers.getContractFactory("CampaignNFT");
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    
    // Deploy a temporary factory with zero address as NFT
    const tempFactory = await CampaignFactory.deploy(ethers.ZeroAddress, owner.address);
    await tempFactory.waitForDeployment();
    const tempFactoryAddress = await tempFactory.getAddress();
    
    // Deploy NFT contract with the factory address
    campaignNFT = await CampaignNFT.deploy(tempFactoryAddress, "ipfs://", owner.address);
    await campaignNFT.waitForDeployment();
    const nftAddress = await campaignNFT.getAddress();
    
    // Deploy the real factory with NFT address
    campaignFactory = await CampaignFactory.deploy(nftAddress, owner.address);
    await campaignFactory.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the correct NFT contract address", async function () {
      expect(await campaignFactory.nftContractAddress()).to.equal(await campaignNFT.getAddress());
    });
    
    it("Should set the correct owner", async function () {
      expect(await campaignFactory.owner()).to.equal(owner.address);
    });
  });
  
  describe("Campaign Creation", function () {
    it("Should create a new campaign", async function () {
      // Create campaign
      await expect(campaignFactory.createCampaign(
        creator.address,
        GOAL_AMOUNT,
        ethers.ZeroAddress, // Using ETH
        CAMPAIGN_URI
      ))
        .to.emit(campaignFactory, "CampaignCreated")
        .withArgs(
          creator.address,
          await ethers.resolveAddress(expect.any(String)), // Campaign address
          GOAL_AMOUNT,
          ethers.ZeroAddress,
          CAMPAIGN_URI
        );
      
      // Get deployed campaigns
      const deployedCampaigns = await campaignFactory.getDeployedCampaigns();
      expect(deployedCampaigns.length).to.equal(1);
      
      // Verify the campaign is registered
      expect(await campaignFactory.isCampaign(deployedCampaigns[0])).to.equal(true);
    });
    
    it("Should not allow non-owners to create campaigns", async function () {
      // Try creating a campaign from non-owner account
      await expect(campaignFactory.connect(creator).createCampaign(
        creator.address,
        GOAL_AMOUNT,
        ethers.ZeroAddress,
        CAMPAIGN_URI
      )).to.be.revertedWithCustomError(campaignFactory, "OwnableUnauthorizedAccount");
    });
    
    it("Should reject invalid parameters", async function () {
      // Try with zero address as creator
      await expect(campaignFactory.createCampaign(
        ethers.ZeroAddress,
        GOAL_AMOUNT,
        ethers.ZeroAddress,
        CAMPAIGN_URI
      )).to.be.revertedWith("Invalid creator address");
      
      // Try with zero goal amount
      await expect(campaignFactory.createCampaign(
        creator.address,
        0, // Invalid goal
        ethers.ZeroAddress,
        CAMPAIGN_URI
      )).to.be.revertedWith("Goal must be greater than zero");
    });
  });
  
  describe("Campaign Tracking", function () {
    it("Should track multiple campaigns", async function () {
      // Create first campaign
      await campaignFactory.createCampaign(
        creator.address,
        GOAL_AMOUNT,
        ethers.ZeroAddress,
        CAMPAIGN_URI
      );
      
      // Create second campaign
      await campaignFactory.createCampaign(
        creator.address,
        GOAL_AMOUNT.mul(2), // Different goal
        ethers.ZeroAddress,
        CAMPAIGN_URI + "/campaign2"
      );
      
      // Get deployed campaigns
      const deployedCampaigns = await campaignFactory.getDeployedCampaigns();
      expect(deployedCampaigns.length).to.equal(2);
      
      // Both should be valid campaigns
      expect(await campaignFactory.isCampaign(deployedCampaigns[0])).to.equal(true);
      expect(await campaignFactory.isCampaign(deployedCampaigns[1])).to.equal(true);
      
      // Random address should not be a valid campaign
      expect(await campaignFactory.isCampaign(creator.address)).to.equal(false);
    });
  });
});
