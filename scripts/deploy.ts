import { ethers, network } from "hardhat";
import { ressourceTemplates } from "../resource_templates/templates";

async function main() {
  const ContractFactory = await ethers.getContractFactory("BC24_Update");

  const admin = (await ethers.getSigners())[0];

  const instance = await ContractFactory.deploy(
    admin.address,
    ressourceTemplates
  );

  console.log(
    `Contract deployed to ${await instance.getAddress()} by ${admin.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
