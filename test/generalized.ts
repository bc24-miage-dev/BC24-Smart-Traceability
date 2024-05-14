import { expect, assert } from "chai";
import { ethers } from "hardhat";

describe("BC24", function () {
  let bc24Contract: any;

  let defaultAdmin: any;
  let breeder: any;
  let slaughterer: any;
  let manufactuerer: any;

  this.beforeEach(async function () {
    defaultAdmin = (await ethers.getSigners())[0];
    breeder = (await ethers.getSigners())[1];
    slaughterer = (await ethers.getSigners())[2];
    manufactuerer = (await ethers.getSigners())[3];
    /* This it the general setup needed for all the contracts*/
    /* If a new contract is put into an interface it needs to be added likewise in the SetupService */

    const ressourceTemplates = [
      {
        // raisE mutton
        ressource_id: 1,
        ressource_name: "Sheep",
        ressources_needed: [],
        ressources_needed_amounts: [],
        initialAmountFromTemplate: 1,
        required_role: "BREEDER",
      },
      {
        // rais cow
        ressource_id: 2,
        ressource_name: "Cow",
        ressources_needed: [],
        ressources_needed_amounts: [],
        initialAmountFromTemplate: 1,
        required_role: "BREEDER",
      },

      {
        // kill mutton
        ressource_id: 3,
        ressource_name: "Sheep carcass",
        ressources_needed: [1],
        ressources_needed_amounts: [1],
        initialAmountFromTemplate: 1,
        required_role: "SLAUGHTERER",
      },
      {
        // kill cow
        ressource_id: 4,
        ressource_name: "Cow carcass",
        ressources_needed: [2],
        ressources_needed_amounts: [1],
        initialAmountFromTemplate: 1,
        required_role: "SLAUGHTERER",
      },

      {
        // Create mutton shoulder
        ressource_id: 5,
        ressource_name: "Sheep shoulder",
        ressources_needed: [3],
        ressources_needed_amounts: [1],
        initialAmountFromTemplate: 10000,
        required_role: "MANUFACTURER",
      },
      // create beef shoulder
      {
        ressource_id: 6,
        ressource_name: "Beef shoulder",
        ressources_needed: [4],
        ressources_needed_amounts: [1],
        initialAmountFromTemplate: 20000,
        required_role: "MANUFACTURER",
      },

      // Processor can turn 50g of mutton shoulder and 20g of beef shoulder in 100g of mergez patty
      {
        ressource_id: 7,
        ressource_name: "Mergez Patty",
        ressources_needed: [5, 6],
        ressources_needed_amounts: [50, 20],
        initialAmountFromTemplate: 100,
        required_role: "MANUFACTURER",
      },
      //  # butcher can turn 100g of mergez patty into 1 mergez
      {
        ressource_id: 8,
        ressource_name: "Mergeze",
        ressources_needed: [7],
        ressources_needed_amounts: [100],
        initialAmountFromTemplate: 1,
        required_role: "MANUFACTURER",
      },
      //  distributor can turn 2 mergez into 1 mergez sandwich
      {
        ressource_id: 9,
        ressource_name: "Mergez sandwich",
        ressources_needed: [8],
        ressources_needed_amounts: [2],
        initialAmountFromTemplate: 1,
        required_role: "MANUFACTURER",
      },
    ];

    const bc24 = await ethers.getContractFactory("BC24");
    bc24Contract = await bc24.deploy(ressourceTemplates);
    await bc24Contract.waitForDeployment();

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(breeder.address, "BREEDER");

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(slaughterer.address, "SLAUGHTERER");

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(manufactuerer.address, "MANUFACTURER");

    bc24Contract.on(
      "RessourceEvent",
      async (event, tokenId, ressourceName, message) => {
        console.log("Event: ", event);
        console.log("Token ID: ", tokenId);
        console.log("ressourceName: ", ressourceName);
        console.log("Message: ", message);
      }
    );

    /*    const transaction = await bc24Contract
      .connect(breeder)
      .test("This is the first test"); */

    //console.log(receipt);
  });
  it("tests breed", async () => {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
      timingInfo: {
        start: Math.floor(Math.random() * 1000000000),
        end: Math.floor(Math.random() * 1000000000),
      },
      isLifeCycleOver: Math.random() < 0.5,
      category: "Random Category",
      animalType: "Random Animal Type",
      isContaminated: Math.random() < 0.5,
      sicknessList: [
        {
          name: "Random Sickness",
          severity: Math.floor(Math.random() * 10),
        },
      ],
      vaccinationList: [
        {
          name: "Random Vaccine",
          date: Math.floor(Math.random() * 1000000000),
        },
      ],
      foodList: [
        {
          name: "Random Food",
          quantity: Math.random() * 100,
        },
      ],
    };

    JSON.stringify(jsonObject);
    const mutton = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(jsonObject));

    const receipt = await mutton.wait();

    const metaData = await bc24Contract.connect(breeder).getMetaData(1);

    expect(metaData.data).to.equal(JSON.stringify(jsonObject));
  });

  it("should not allow to slaughter a sheep without possessing a sheep", async () => {
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "I am a dumb sheep with no sicknesses.");

    const sheep = await bc24Contract.connect(breeder).getMetaData(1);

    expect(sheep.data).to.equal("I am a dumb sheep with no sicknesses.");

    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(3, 1, "I am a sheep carcass with no sicknesses.")
    ).to.be.revertedWith(
      "You do not have the required ressources to perform this action."
    );
  });
  it("should allow to slaughter a sheep if the slaughterer posseses a sheep", async () => {
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "I am a dumb sheep with no sicknesses.");

    const sheep = await bc24Contract.connect(breeder).getMetaData(1);

    expect(sheep.data).to.equal("I am a dumb sheep with no sicknesses.");

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 1, 1, "0x");

    const balance = await bc24Contract
      .connect(slaughterer)
      .balanceOf(slaughterer.address, 1);

    expect(balance).to.equal(1);

    await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "I am a sheep carcass with no sicknesses.");

    const sheepCarcass = await bc24Contract.connect(slaughterer).getMetaData(2);

    expect(sheepCarcass.data).to.equal(
      "I am a sheep carcass with no sicknesses."
    );
  });

  it("should only allow to create a maximum of 200 mergez patties from 10kg sheep shoulder and 20kg beef shoulder. ", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "I am a dumb sheep with no sicknesses.");

    const beef = await bc24Contract
      .connect(breeder)
      .mintRessource(2, 1, "I am a dumb cow with no sicknesses.");

    // Transfer sheep to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 1, 1, "0x");

    // Transfer beef to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 2, 1, "0x");

    // Slaughter sheep
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "I am a sheep carcass with no sicknesses.");

    // Slaughter beef
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(4, 1, "I am a beef carcass with no sicknesses.");

    // transfer sheep carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufactuerer.address, 3, 1, "0x");

    // transfer beef carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufactuerer.address, 4, 1, "0x");

    // create sheep shoulder
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(5, 1, "I am a sheep shoulder.");

    // create beef shoulder
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(6, 1, "I am a beef shoulder.");

    // create 20 mergez patty
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(7, 200, "I am a mergez patty.");

    // check quantity of sheep shoulder
    const sheepShoulder = await bc24Contract
      .connect(manufactuerer)
      .balanceOf(manufactuerer.address, 5);

    expect(sheepShoulder).to.equal(10000 - 200 * 50);

    const beefShoulder = await bc24Contract
      .connect(manufactuerer)
      .balanceOf(manufactuerer.address, 6);

    expect(beefShoulder).to.equal(20000 - 200 * 20);

    const mergezPatty = await bc24Contract
      .connect(manufactuerer)
      .balanceOf(manufactuerer.address, 7);

    expect(mergezPatty).to.equal(200 * 100);

    await expect(
      bc24Contract.connect(manufactuerer).mintRessource(7, 1, "I am too much. ")
    ).to.be.revertedWith(
      "You do not have the required ressources to perform this action."
    );
  });

  it("should create a mergeze", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "I am a dumb sheep with no sicknesses.");

    const beef = await bc24Contract
      .connect(breeder)
      .mintRessource(2, 1, "I am a dumb cow with no sicknesses.");

    // Transfer sheep to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 1, 1, "0x");

    // Transfer beef to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 2, 1, "0x");

    // Slaughter sheep
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "I am a sheep carcass with no sicknesses.");

    // Slaughter beef
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(4, 1, "I am a beef carcass with no sicknesses.");

    // transfer sheep carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufactuerer.address, 3, 1, "0x");

    // transfer beef carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufactuerer.address, 4, 1, "0x");

    // create sheep shoulder
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(5, 1, "I am a sheep shoulder.");

    // create beef shoulder
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(6, 1, "I am a beef shoulder.");

    // create mergez patty
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(7, 1, "I am a mergez patty.");

    // create mergeze
    await bc24Contract
      .connect(manufactuerer)
      .mintRessource(8, 1, "I am a mergeze.");

  });
});
