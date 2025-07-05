const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Campaign Contract", function () {
  let CampaignFactory;
  let CampaignNFT;
  let campaignFactory;
  let campaignNFT;
  let campaign;
  let owner;
  let creator;
  let donor1;
  let donor2;
  let erc20Token;
  
  const GOAL_AMOUNT = ethers.parseEther("10"); // 10 ETH
  const CAMPAIGN_URI = "ipfs://QmTest";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator, donor1, donor2] = await ethers.getSigners();
    
    // Deploy a mock ERC20 token for testing with tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    erc20Token = await MockERC20.deploy("Test Token", "TEST", 18);
    await erc20Token.waitForDeployment();
    
    // Mint some tokens to donors
    await erc20Token.mint(donor1.address, ethers.parseEther("100"));
    await erc20Token.mint(donor2.address, ethers.parseEther("100"));
    
    // Deploy NFT contract first
    CampaignNFT = await ethers.getContractFactory("CampaignNFT");
    
    // We'll need to deploy the factory first with a placeholder, then deploy NFT with the factory address,
    // and finally deploy the final factory with the NFT address
    
    // Temporary factory deployment
    CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    const tempFactory = await CampaignFactory.deploy(ethers.ZeroAddress, owner.address);
    await tempFactory.waitForDeployment();
    const tempFactoryAddress = await tempFactory.getAddress();
    
    // Deploy NFT with the factory address
    campaignNFT = await CampaignNFT.deploy(tempFactoryAddress, "ipfs://", owner.address);
    await campaignNFT.waitForDeployment();
    const nftAddress = await campaignNFT.getAddress();
    
    // Final factory deployment with the actual NFT address
    campaignFactory = await CampaignFactory.deploy(nftAddress, owner.address);
    await campaignFactory.waitForDeployment();
    
    // Create a campaign
    const tx = await campaignFactory.createCampaign(
      creator.address, 
      GOAL_AMOUNT,
      ethers.ZeroAddress, // Using ETH for default test
      CAMPAIGN_URI
    );
    
    const receipt = await tx.wait();
    
    // Get the campaign address from the event
    const event = receipt.logs.filter(
      (log) => log.fragment && log.fragment.name === "CampaignCreated"
    )[0];
    
    const campaignAddress = event.args[1]; // Second indexed parameter is the campaign address
    
    // Get the Campaign contract at the deployed address
    const Campaign = await ethers.getContractFactory("Campaign");
    campaign = Campaign.attach(campaignAddress);
  });
  
  describe("Deployment", function () {
    it("Should set the correct creator", async function () {
      expect(await campaign.creator()).to.equal(creator.address);
    });
    
    it("Should set the correct goal amount", async function () {
      expect(await campaign.goalAmount()).to.equal(GOAL_AMOUNT);
    });
    
    it("Should set the campaign as active by default", async function () {
      expect(await campaign.fundingActive()).to.equal(true);
    });
    
    it("Should set the correct campaign URI", async function () {
      expect(await campaign.campaignURI()).to.equal(CAMPAIGN_URI);
    });
  });
  
  describe("ETH Donations", function () {
    it("Should accept ETH donations and mint NFT", async function () {
      const donationAmount = ethers.parseEther("1");
      
      // Check initial state
      const initialTotalRaised = await campaign.totalRaised();
      
      // Donate ETH
      await expect(donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: donationAmount
      }))
        .to.emit(campaign, "DonationReceived")
        .withArgs(donor1.address, donationAmount, initialTotalRaised + donationAmount);
      
      // Verify total raised has increased
      expect(await campaign.totalRaised()).to.equal(initialTotalRaised + donationAmount);
    });
  });
  
  describe("Fund Claiming", function () {
    it("Should not allow claiming funds before goal is reached", async function () {
      // Try to claim funds (should revert)
      await expect(campaign.connect(creator).claimFunds())
        .to.be.revertedWith("Goal not reached");
    });
    
    it("Should allow creator to claim funds after goal is reached", async function () {
      // Donate enough to reach the goal
      const donationAmount = GOAL_AMOUNT;
      await donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: donationAmount
      });
      
      // Check total raised is at or above goal
      expect(await campaign.totalRaised()).to.be.at.least(GOAL_AMOUNT);
      
      // Get creator's balance before claiming
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      
      // Claim funds
      await expect(campaign.connect(creator).claimFunds())
        .to.emit(campaign, "FundsClaimed")
        .withArgs(creator.address, donationAmount);
      
      // Check creator's balance has increased
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter).to.be.gt(creatorBalanceBefore);
      
      // Check campaign state
      expect(await campaign.fundingActive()).to.equal(false);
      expect(await campaign.fundsClaimed()).to.equal(true);
      
      // Try claiming again (should revert)
      await expect(campaign.connect(creator).claimFunds())
        .to.be.revertedWith("Funds already claimed");
    });
    
    it("Should not allow non-creator to claim funds", async function () {
      // Donate enough to reach the goal
      await donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: GOAL_AMOUNT
      });
      
      // Try to claim as non-creator (should revert)
      await expect(campaign.connect(donor1).claimFunds())
        .to.be.revertedWith("Only creator can claim funds");
    });
  });
  
  describe("Campaign Status Control", function () {
    it("Should allow creator to pause and resume funding", async function () {
      // Pause funding
      await expect(campaign.connect(creator).setFundingActive(false))
        .to.emit(campaign, "FundingStatusChanged")
        .withArgs(false);
      
      expect(await campaign.fundingActive()).to.equal(false);
      
      // Try to donate (should revert)
      await expect(donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: ethers.parseEther("1")
      })).to.be.reverted;
      
      // Resume funding
      await expect(campaign.connect(creator).setFundingActive(true))
        .to.emit(campaign, "FundingStatusChanged")
        .withArgs(true);
      
      expect(await campaign.fundingActive()).to.equal(true);
      
      // Donation should work now
      await expect(donor1.sendTransaction({
        to: await campaign.getAddress(),
        value: ethers.parseEther("1")
      })).to.not.be.reverted;
    });
    
    it("Should not allow non-creator to change funding status", async function () {
      await expect(campaign.connect(donor1).setFundingActive(false))
        .to.be.revertedWith("Only creator can change status");
    });
  });
});
