const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampaignNFT Contract", function () {
  let CampaignFactory;
  let CampaignNFT;
  let campaignFactory;
  let campaignNFT;
  let campaign;
  let owner;
  let creator;
  let donor1;
  
  const GOAL_AMOUNT = ethers.parseEther("10"); // 10 ETH
  const CAMPAIGN_URI = "ipfs://QmTest";
  const BASE_URI = "ipfs://";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator, donor1] = await ethers.getSigners();
    
    // Deploy NFT and Factory contracts with the correct initialization sequence
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    CampaignNFT = await ethers.getContractFactory("CampaignNFT");
    
    // First deploy a temporary factory with a zero address as NFT
    const tempFactory = await CampaignFactory.deploy(ethers.ZeroAddress, owner.address);
    await tempFactory.waitForDeployment();
    const tempFactoryAddress = await tempFactory.getAddress();
    
    // Now deploy the NFT contract with the factory address
    campaignNFT = await CampaignNFT.deploy(tempFactoryAddress, BASE_URI, owner.address);
    await campaignNFT.waitForDeployment();
    const nftAddress = await campaignNFT.getAddress();
    
    // Deploy the real factory with the NFT address
    campaignFactory = await CampaignFactory.deploy(nftAddress, owner.address);
    await campaignFactory.waitForDeployment();
    
    // Create a campaign to work with in tests
    const tx = await campaignFactory.createCampaign(
      creator.address, 
      GOAL_AMOUNT,
      ethers.ZeroAddress, // Using ETH for tests
      CAMPAIGN_URI
    );
    
    const receipt = await tx.wait();
    
    // Get the campaign address from the event
    const event = receipt.logs.filter(
      (log) => log.fragment && log.fragment.name === "CampaignCreated"
    )[0];
    
    const campaignAddress = event.args[1];
    
    // Get the Campaign contract at the deployed address
    const Campaign = await ethers.getContractFactory("Campaign");
    campaign = Campaign.attach(campaignAddress);
  });
  
  describe("Deployment", function () {
    it("Should set the correct factory address", async function () {
      const tempFactoryAddress = await campaignNFT.campaignFactoryAddress();
      expect(tempFactoryAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should have the correct name and symbol", async function () {
      expect(await campaignNFT.name()).to.equal("CampaignDonationNFT");
      expect(await campaignNFT.symbol()).to.equal("CDNFT");
    });
  });
  
  describe("Minting NFTs", function () {
    it("Should mint NFT when donation is made", async function () {
      // Make a donation to trigger NFT minting
      const donationAmount = ethers.parseEther("1");
      
      // Send ETH donation
      await donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: donationAmount
      });
      
      // Check if the donor has received an NFT
      expect(await campaignNFT.balanceOf(donor1.address)).to.equal(1);
      
      // Check if the NFT is linked to the correct campaign
      const tokenId = 0; // First token minted
      expect(await campaignNFT.campaignForTokenId(tokenId)).to.equal(await campaign.getAddress());
      
      // Make another donation and check if the donor gets a second NFT
      await donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: donationAmount
      });
      
      // Now the donor should have 2 NFTs
      expect(await campaignNFT.balanceOf(donor1.address)).to.equal(2);
    });
    
    it("Should not allow direct minting from unauthorized accounts", async function () {
      // Try to mint directly from an unauthorized address (should fail)
      await expect(
        campaignNFT.connect(donor1).mint(donor1.address, await campaign.getAddress())
      ).to.be.revertedWith("Caller is not a valid campaign");
    });
  });
  
  describe("Owner Functions", function () {
    it("Should allow owner to change base URI", async function () {
      const newBaseURI = "https://api.example.com/metadata/";
      
      // Set new base URI
      await campaignNFT.connect(owner).setBaseURI(newBaseURI);
      
      // Make a donation to mint an NFT
      await donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: ethers.parseEther("1")
      });
      
      // The token URI should now start with the new base URI
      const tokenId = 0;
      const tokenURI = await campaignNFT.tokenURI(tokenId);
      expect(tokenURI.startsWith(newBaseURI)).to.be.true;
    });
    
    it("Should not allow non-owner to change base URI", async function () {
      const newBaseURI = "https://api.example.com/metadata/";
      
      // Try to set new base URI from non-owner account (should fail)
      await expect(
        campaignNFT.connect(donor1).setBaseURI(newBaseURI)
      ).to.be.revertedWithCustomError(campaignNFT, "OwnableUnauthorizedAccount");
    });
  });
});
