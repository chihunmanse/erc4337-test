/** @format */

import fs from "fs";
import { ethers } from "hardhat";
import {
  EntryPointAddress,
  RPC_URL,
  SimpleAccountFactoryAddress,
} from "../src/constant";
import { getSimpleAccount } from "../src/getSimpleAccount";

async function main() {
  let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

  const owner = new ethers.Wallet(ethers.utils.randomBytes(32));
  const signinKey = owner.privateKey;

  config.owner = owner.address;
  config.privateKey = signinKey;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const accountAPI = getSimpleAccount(
    provider,
    signinKey,
    EntryPointAddress,
    SimpleAccountFactoryAddress
  );
  const account = await accountAPI.getCounterFactualAddress();

  console.log("Simple Account Address: " + account);
  config.account = account;
  config = JSON.stringify(config);
  fs.writeFileSync("./config.json", config);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
