/** @format */

import { ethers, network } from "hardhat";
const hre = require("hardhat");

import { Logger } from "@ethersproject/logger";
export const version = "bytes/5.7.0";
const logger = new Logger(version);

// async function getCounterFactualAddress() {
//   const initCode = this.getAccountInitCode();
//   // use entryPoint to query account address (factory can provide a helper method to do the same, but
//   // this method attempts to be generic
//   try {
//     await this.entryPointView.callStatic.getSenderAddress(initCode);
//   } catch (e) {
//     return e.errorArgs.sender;
//   }
//   throw new Error("must handle revert");
// }

export type Bytes = ArrayLike<number>;

export type BytesLike = Bytes | string;

export type DataOptions = {
  allowMissingPrefix?: boolean;
  hexPad?: "left" | "right" | null;
};

export interface Hexable {
  toHexString(): string;
}

const entryPointAddress = "0x0576a174D229E3cFA37253523E645A78A0C91B57";

const simpleAccountFactoryAddress =
  "0x71D63edCdA95C61D6235552b5Bc74E32d8e2527B";

const HexCharacters: string = "0123456789abcdef";

function isHexable(value: any): value is Hexable {
  return !!value.toHexString;
}

export function isHexString(value: any, length?: number): boolean {
  if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false;
  }
  if (length && value.length !== 2 + 2 * length) {
    return false;
  }
  return true;
}

function isInteger(value: number) {
  return typeof value === "number" && value == value && value % 1 === 0;
}

export function isBytes(value: any): value is Bytes {
  if (value == null) {
    return false;
  }

  if (value.constructor === Uint8Array) {
    return true;
  }
  if (typeof value === "string") {
    return false;
  }
  if (!isInteger(value.length) || value.length < 0) {
    return false;
  }

  for (let i = 0; i < value.length; i++) {
    const v = value[i];
    if (!isInteger(v) || v < 0 || v >= 256) {
      return false;
    }
  }
  return true;
}

export function hexlify(
  value: BytesLike | Hexable | number | bigint,
  options?: DataOptions
): string {
  if (!options) {
    options = {};
  }

  if (typeof value === "number") {
    logger.checkSafeUint53(value, "invalid hexlify value");

    let hex = "";
    while (value) {
      hex = HexCharacters[value & 0xf] + hex;
      value = Math.floor(value / 16);
    }

    if (hex.length) {
      if (hex.length % 2) {
        hex = "0" + hex;
      }
      return "0x" + hex;
    }

    return "0x00";
  }

  if (typeof value === "bigint") {
    value = value.toString(16);
    if (value.length % 2) {
      return "0x0" + value;
    }
    return "0x" + value;
  }

  if (
    options.allowMissingPrefix &&
    typeof value === "string" &&
    value.substring(0, 2) !== "0x"
  ) {
    value = "0x" + value;
  }

  if (isHexable(value)) {
    return value.toHexString();
  }

  if (isHexString(value)) {
    if ((<string>value).length % 2) {
      if (options.hexPad === "left") {
        value = "0x0" + (<string>value).substring(2);
      } else if (options.hexPad === "right") {
        value += "0";
      } else {
        logger.throwArgumentError("hex data is odd-length", "value", value);
      }
    }
    return (<string>value).toLowerCase();
  }

  if (isBytes(value)) {
    let result = "0x";
    for (let i = 0; i < value.length; i++) {
      let v = value[i];
      result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
    }
    return result;
  }

  return logger.throwArgumentError("invalid hexlify value", "value", value);
}

function hexConcat(items: ReadonlyArray<BytesLike>): string {
  let result = "0x";
  items.forEach((item) => {
    result += hexlify(item).substring(2);
  });
  return result;
}

async function main() {
  const [bundler] = await ethers.getSigners();

  const owner = new ethers.Wallet(ethers.utils.randomBytes(32));
  const signinKey = owner.privateKey;

  const SimpleAccountFactory = await ethers.getContractFactory(
    "SimpleAccountFactory"
  );
  const simpleAccountFactory = new ethers.Contract(
    simpleAccountFactoryAddress,
    SimpleAccountFactory.interface
  );

  const initCode = hexConcat([
    simpleAccountFactoryAddress,
    simpleAccountFactory.interface.encodeFunctionData("createAccount", [
      owner.address,
      0,
    ]),
  ]);

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const entryPoint = new ethers.Contract(
    entryPointAddress,
    EntryPoint.interface,
    bundler
  );

  console.log("InitCode:" + initCode);

  const errorIface = new ethers.utils.Interface([
    "error SenderAddressResult(address sender)",
  ]);

  try {
    await entryPoint.getSenderAddress(initCode);
  } catch (e: any) {
    const data = e.transaction.data;
    console.log(e);
    console.log(e.transaction);
    console.log("data: " + data);
    const sig = data.slice(0, 10);
    // const error = errorIface.getError(sig);
    // console.log("Error: " + error);
    // console.log(errorIface.decodeErrorResult(error, data));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
