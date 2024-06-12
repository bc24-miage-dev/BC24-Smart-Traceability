import { ethers, network } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("BC24");

  const contractAddress = process.env.CONTRACT_ADDRESS!;

  const admin = (await ethers.getSigners())[0];
  const breeder = (await ethers.getSigners())[1];

  const instance = ContractFactory.attach(contractAddress);

  console.log(`Contract deployed to ${await instance.getAddress()}`);

  console.log("Give roles to users");

  const roleTransaction = await instance
    .connect(admin)
    .giveUserRole(breeder.address, "BREEDER", {});

  const roleReceipt = await roleTransaction.wait();
  console.log(roleReceipt.logs);

  const jsonObject = {
    placeOfOrigin: "Random Place",
    dateOfBirth: Math.floor(Math.random() * 1000000000),
    gender: Math.random() < 0.5 ? "Male" : "Female",
    weight: Math.random() * 100,
  };

  const mutton = await instance
    .connect(breeder)
    .mintRessource(1, 1, JSON.stringify(jsonObject), [], {});

  const muttonReceipt = await mutton.wait();
  console.log(muttonReceipt.logs);

  /*console.log("Mint sheep");

  const jsonObject = {
    placeOfOrigin: "Random Place",
    dateOfBirth: Math.floor(Math.random() * 1000000000),
    gender: Math.random() < 0.5 ? "Male" : "Female",
    weight: Math.random() * 100,
  };

  const mutton = await instance
    .connect(breeder)
    .mintRessource(1, 1, JSON.stringify(jsonObject), [], {
      maxPriorityFeePerGas: 0,
      maxFeePerGas: 0,
    });

  const muttonReceipt = await mutton.wait();
  console.log(muttonReceipt.logs); */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
