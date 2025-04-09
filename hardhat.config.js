require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    baseTestnet: {
      url: process.env.BASE_TESTNET_RPC_URL || "https://goerli.base.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasPrice: 5000000000, // 5 gwei
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 11155111
    }
    // Add additional network configurations as needed
    // mainnet: {
    //   url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY].filter(Boolean)
    // },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // Etherscan API key for verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
