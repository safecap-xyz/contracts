const { task } = require("hardhat/config");

task("accounts", "Prints the list of accounts with balances", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(
      `${account.address} - ${hre.ethers.formatEther(balance)} ETH`
    );
  }
});

task("balance", "Prints an account's balance")
  .addPositionalParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });

task("campaign-info", "Gets information about a campaign")
  .addPositionalParam("address", "The campaign contract address")
  .setAction(async (taskArgs, hre) => {
    const Campaign = await hre.ethers.getContractFactory("Campaign");
    const campaign = Campaign.attach(taskArgs.address);

    const creator = await campaign.creator();
    const goalAmount = await campaign.goalAmount();
    const totalRaised = await campaign.totalRaised();
    const active = await campaign.fundingActive();
    const claimed = await campaign.fundsClaimed();
    const uri = await campaign.campaignURI();

    console.log({
      address: taskArgs.address,
      creator,
      goalAmount: hre.ethers.formatEther(goalAmount),
      totalRaised: hre.ethers.formatEther(totalRaised),
      progress: `${(totalRaised * 100n / goalAmount)}%`,
      active,
      claimed,
      uri
    });
  });
