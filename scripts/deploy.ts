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

  /*   console.log("Give roles to users");
  await instance
    .connect(admin_wallet)
    .giveUserRole(breeder_wallet.address, "BREEDER");

  console.log("Mint sheep");
  const jsonObject = {
    placeOfOrigin: "Random Place",
    dateOfBirth: Math.floor(Math.random() * 1000000000),
    gender: Math.random() < 0.5 ? "Male" : "Female",
    weight: Math.random() * 100,
  };

  const mutton = await instance
    .connect(breeder_wallet)
    .mintRessource(1, 1, JSON.stringify(jsonObject), []);

  const muttonReceipt = await mutton.wait();

  console.log(muttonReceipt); */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
