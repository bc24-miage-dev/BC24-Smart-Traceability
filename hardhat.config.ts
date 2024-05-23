import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    besu: {
      url: "https://validator3.rpc.bc24.miage.dev", // replace with your Besu node RPC URL
      accounts: [
        process.env.ADMIN_PRIVATE_KEY,
        process.env.BREEDER_PRIVATE_KEY,
      ],
      gasPrice: 0,
      gas: 0x1ffffffffffffe,
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "london", // required for Besu
      optimizer: {
        enabled: true,
      },
    },
  },
};

export default config;
