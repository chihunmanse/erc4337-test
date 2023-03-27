/** @format */

import { ethers } from "hardhat";
import {
  EntryPointAddress,
  RPC_URL,
  SimpleAccountFactoryAddress,
} from "../src/constant";
import { getSimpleAccount } from "../src/getSimpleAccount";
import config from "../config.json";
import { getGasFee } from "../src/getGasFee";
import { printOp } from "../src/printOp";
import { getUserOPEvent } from "../src/eventParser";

async function main() {
  const [bundler] = await ethers.getSigners();

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const accountAPI = getSimpleAccount(
    provider,
    config.privateKey,
    EntryPointAddress,
    SimpleAccountFactoryAddress
  );

  const value = ethers.utils.parseEther("0.1");
  const op = await accountAPI.createSignedUserOp({
    target: bundler.address,
    value,
    data: "0x",
    ...(await getGasFee(provider)),
  });
  console.log("Signed UserOperation: " + (await printOp(op)));

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPoint.interface,
    bundler
  );

  const handleOpsTx = await entryPoint.handleOps([op], bundler.address);
  const receipt = await handleOpsTx.wait();
  const event = getUserOPEvent(receipt.events);

  console.log("Transaction Hash: " + receipt.transactionHash);
  console.log("User Operation Event: ");
  console.log(event);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
