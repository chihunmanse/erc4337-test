/** @format */

import { getCurrentBlockTimestamp } from "../src/blockTimestamp";
import { PaymasterAddress } from "../src/constant";
import { ethers } from "hardhat";
import {
  EntryPointAddress,
  RPC_URL,
  SimpleAccountFactoryAddress,
} from "../src/constant";
import { getSimpleAccount } from "../src/getSimpleAccount";
import config from "../config.json";
import { getGasFee } from "../src/getGasFee";
import { getUserOPEvent } from "../src/eventParser";
import { hexConcat } from "../src/getInitCode";

const SIG_SIZE = 65;
const DUMMY_PAYMASTER_AND_DATA =
  "0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";

async function main() {
  const [bundler] = await ethers.getSigners();

  const owenr = new ethers.Wallet(config.privateKey);

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const accountAPI = getSimpleAccount(
    provider,
    config.privateKey,
    EntryPointAddress,
    SimpleAccountFactoryAddress
  );

  const value = ethers.utils.parseEther("0.1");
  const op = await accountAPI.createUnsignedUserOp({
    target: bundler.address,
    value,
    data: "0x",
    ...(await getGasFee(provider)),
  });
  op.paymasterAndData = DUMMY_PAYMASTER_AND_DATA;
  op.signature = ethers.utils.hexlify(Buffer.alloc(SIG_SIZE, 1));
  op.preVerificationGas = accountAPI.getPreVerificationGas(op);

  const Paymaster = await ethers.getContractFactory("Paymaster");
  const paymaster = new ethers.Contract(
    PaymasterAddress,
    Paymaster.interface,
    bundler
  );

  const untilTimestamp = (await getCurrentBlockTimestamp()) + 100;
  const afterTimestamp = 0;

  const hash = await paymaster.getHash(op, untilTimestamp, afterTimestamp);

  const hashBinary = ethers.utils.arrayify(hash);
  const signature = await bundler.signMessage(hashBinary);

  const timestamp = ethers.utils.defaultAbiCoder.encode(
    ["uint48", "uint48"],
    [untilTimestamp, afterTimestamp]
  );
  const paymasterData = hexConcat([paymaster.address, timestamp, signature]);
  op.paymasterAndData = paymasterData;

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPoint.interface,
    bundler
  );

  const opHash = await entryPoint.getUserOpHash(op);
  const binary = ethers.utils.arrayify(opHash);
  op.signature = await owenr.signMessage(binary);

  try {
    const handleOpsTx = await entryPoint.handleOps([op], bundler.address);
    const receipt = await handleOpsTx.wait();

    const event = getUserOPEvent(receipt.events);

    console.log("Transaction Hash: " + receipt.transactionHash);
    console.log("User Operation Event: ");
    console.log(event);
  } catch (error: any) {
    console.log(error);
  }

  console.log(await paymaster.getDeposit());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
