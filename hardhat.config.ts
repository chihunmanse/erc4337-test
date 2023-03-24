/** @format */

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-truffle5";
import "@typechain/hardhat";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      accounts: { count: 1000 },
    },
    mumbai: {
      url: `https://rpc.ankr.com/polygon_mumbai`,
      chainId: 80001,
      accounts: [process.env.BUNDLER_PRIVATE_KEY || ""],
    },
  },
};

export default config;
