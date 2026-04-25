require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Ensure required environment variables are set and provide warnings if missing
const requiredEnvVars = ["SEPOLIA_RPC_URL", "PRIVATE_KEY", "ETHERSCAN_API_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[Warning] Environment variable ${envVar} is missing. Some features may not work as expected.`);
  }
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // 4. Set Solidity to 0.8.24 with optimizer enabled
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  
  // Network configurations
  networks: {
    // Localhost configuration for local testing
    localhost: {
      url: "http://127.0.0.1:8545",
      // Hardhat's default chainId for local network is 31337
    },
    // 2. Configure Sepolia network
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },

  // 3. Configure Etherscan block explorer for contract verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },

  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    // Optional: Uncomment and set COINMARKETCAP_API_KEY in .env for fiat conversion
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY, 
  },

  // 5. Include paths for contracts, tests, artifacts
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};