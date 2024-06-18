import { ethers, network } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("BC24");

  const contractAddress = process.env.CONTRACT_ADDRESS!;

  const admin = (await ethers.getSigners())[0];
  const breeder = (await ethers.getSigners())[1];
  const slaughterer = (await ethers.getSigners())[2];
  const manufacturer = (await ethers.getSigners())[3];

  const instance = ContractFactory.attach(contractAddress);

  console.log(`Contract deployed to ${await instance.getAddress()}`);

  console.log("Give roles to users. Please wait...");

  const roleTransaction = await instance
    .connect(admin)
    .giveUserRole(breeder.address, "BREEDER", {});

  const roleReceipt = await roleTransaction.wait();

  const roleTransaction2 = await instance
    .connect(admin)
    .giveUserRole(slaughterer.address, "SLAUGHTERER", {});

  const roleReceipt2 = await roleTransaction2.wait();

  const roleTransaction3 = await instance
    .connect(admin)
    .giveUserRole(manufacturer.address, "MANUFACTURER", {});

  const roleReceipt3 = await roleTransaction3.wait();

  console.log("Roles of users: ");
  console.log(`Admin: ${admin.address}`);
  console.log(`Breeder: ${breeder.address}`);
  console.log(`Slaughterer: ${slaughterer.address}`);
  console.log(`Manufacturer: ${manufacturer.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
