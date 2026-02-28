import * as dotenv from "dotenv";
dotenv.config();

import "@nomicfoundation/hardhat-ethers";

const config = {
  solidity: "0.8.24",
  networks: {
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.TESTNET_OPERATOR_PRIVATE_KEY || "0x5e277ebcf54509c22ec46503a4ed8517d368a52dfec140e2f2e972a3211fe234"],
      chainId: 296,
      type: "http"
    }
  }
};

export default config;
