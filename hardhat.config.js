// Required plugins
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("dotenv").config();
require("./tasks/balance");

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
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 11155111
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 84532,
      gasPrice: 100000000, // 0.1 gwei - much lower
      gas: 8000000 // Higher gas limit
    },
    base: {
      url: "https://mainnet.base.org", 
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 8453,
      gasPrice: "auto"
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 1,
      gasPrice: "auto"
    },
    // Legacy Base testnet config (kept for backward compatibility)
    base_testnet: {
      url: process.env.BASE_TESTNET_RPC_URL || "https://goerli.base.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasPrice: 5000000000 // 5 gwei
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    excludeContracts: [],
    src: "./contracts"
  },
  // Coverage configuration
  coverageConfig: {
    excludeContracts: ["mocks/"]
  }
};
