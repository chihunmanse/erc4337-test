/** @format */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers, expect } from "hardhat";

describe("Project", () => {
  let operatorMaster: SignerWithAddress,
    operatorManager: SignerWithAddress,
    creator: SignerWithAddress,
    newOperatorMaster: SignerWithAddress,
    newOperatorManager: SignerWithAddress,
    notOperator: SignerWithAddress,
    newCreator: SignerWithAddress;

  let project: Contract, operator: Contract, newOperator: Contract;

  before(async () => {
    [
      operatorMaster,
      operatorManager,
      notOperator,
      creator,
      newOperatorMaster,
      newOperatorManager,
      newCreator,
    ] = await ethers.getSigners();
    console.log(
      "Deploying contracts with the account: " + operatorMaster.address
    );

    // deploy operator wallet
    const RoleWallet = await ethers.getContractFactory("SLRoleWallet");
    operator = await RoleWallet.deploy(
      [operatorMaster.address],
      [operatorManager.address]
    );
    await operator.deployed();
    console.log(`Operator deployed to: ${operator.address}`);
  });

  //////////
  // Role //
  //////////

  describe("Role", async () => {
    it("Is Operator Master", async () => {
      const isOperatorMaster = await project.isOperatorMaster(
        operatorMaster.address
      );
      const isOperatorMaster2 = await project.isOperatorMaster(
        operatorManager.address
      );

      expect(isOperatorMaster).to.equal(true);
      expect(isOperatorMaster2).to.equal(false);
    });
  });
});
