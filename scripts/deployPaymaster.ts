/** @format */

import { ethers } from "hardhat";
import { EntryPointAddress } from "../src/constant";

async function main() {
  const [bundler] = await ethers.getSigners();

  const Paymaster = await ethers.getContractFactory("Paymaster");
  const paymaster = await Paymaster.deploy(EntryPointAddress, bundler.address);
  console.log("Paymaster Address: " + paymaster.address);

  const depositTx = await paymaster.deposit({
    value: ethers.utils.parseEther("1"),
  });
  await depositTx.wait();

  console.log("Deposit Value: " + (await paymaster.getDeposit()));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
