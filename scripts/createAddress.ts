/** @format */

const hre = require("hardhat");
import { ethers, network } from "hardhat";
import {
  EntryPointAddress,
  RPC_URL,
  SimpleAccountFactoryAddress,
} from "../src/config";
import { getInitCode } from "../src/getInitCode";
import { getSimpleAccount } from "../src/getSimpleAccount";

async function main() {
  const [bundler] = await ethers.getSigners();

  const owner = new ethers.Wallet(ethers.utils.randomBytes(32));
  const signinKey = owner.privateKey;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const accountAPI = getSimpleAccount(
    provider,
    signinKey,
    EntryPointAddress,
    SimpleAccountFactoryAddress
  );
  const address = await accountAPI.getCounterFactualAddress();
  console.log(address);

  const SimpleAccountFactory = await ethers.getContractFactory(
    "SimpleAccountFactory"
  );
  const simpleAccountFactory = new ethers.Contract(
    SimpleAccountFactoryAddress,
    SimpleAccountFactory.interface
  );

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPoint.interface,
    bundler
  );

  console.log(await accountAPI.getInitCode());
  console.log(await getInitCode(owner.address));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
