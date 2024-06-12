import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { ressourceTemplates } from "../resource_templates/templates";

describe("BC24", function () {
  let bc24Contract: any;

  let defaultAdmin: any;
  let breeder: any;
  let breeder2: any;
  let slaughterer: any;
  let slaughterer2: any;
  let transporter: any;
  let transporter2: any;
  let manufacturer: any;
  let manufacturer2: any;

  this.beforeEach(async function () {
    defaultAdmin = (await ethers.getSigners())[0];
    breeder = (await ethers.getSigners())[1];
    breeder2 = (await ethers.getSigners())[2];
    transporter = (await ethers.getSigners())[3];
    transporter2 = (await ethers.getSigners())[4];
    slaughterer = (await ethers.getSigners())[5];
    slaughterer2 = (await ethers.getSigners())[6];
    manufacturer = (await ethers.getSigners())[7];
    manufacturer2 = (await ethers.getSigners())[8];

    /* This it the general setup needed for all the contracts*/
    /* If a new contract is put into an interface it needs to be added likewise in the SetupService */

    const bc24 = await ethers.getContractFactory("BC24");
    bc24Contract = await bc24.deploy(defaultAdmin, ressourceTemplates);
    await bc24Contract.waitForDeployment();

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(breeder.address, "BREEDER");

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(transporter.address, "TRANSPORTER");

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(slaughterer.address, "SLAUGHTERER");

    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(manufacturer.address, "MANUFACTURER");
  });

  it("should read the templates", async function () {
    const templates = await bc24Contract.getResourceTemplates();
    // Assuming `templates` and `ressourceTemplates` are the arrays to compare
    // Extract and sort the resource_id from both arrays
    const sortedTemplateIds = templates
      .map((template) => template.resource_id)
      .sort();
    const sortedRessourceTemplateIds = ressourceTemplates
      .map((template) => template.resource_id)
      .sort();

    // Use deep equality to compare the sorted arrays of resource_id
    expect(sortedTemplateIds).to.deep.equal(sortedRessourceTemplateIds);
  });

  it("should assign BREEDER role correctly", async function () {
    const breederRole = await bc24Contract.userRoles(breeder.address);
    expect(breederRole).to.equal("BREEDER");
  });

  it("should assign TRANSPORTER role correctly", async function () {
    const transporterRole = await bc24Contract.userRoles(transporter.address);
    expect(transporterRole).to.equal("TRANSPORTER");
  });

  it("should assign SLAUGHTERER role correctly", async function () {
    const slaughtererRole = await bc24Contract.userRoles(slaughterer.address);
    expect(slaughtererRole).to.equal("SLAUGHTERER");
  });

  it("should assign MANUFACTURER role correctly", async function () {
    const manufacturerRole = await bc24Contract.userRoles(manufacturer.address);
    expect(manufacturerRole).to.equal("MANUFACTURER");
  });

  it("should not allow non-admin to assign roles", async function () {
    await expect(
      bc24Contract.connect(breeder).giveUserRole(breeder2.address, "BREEDER")
    ).to.be.revertedWith("Only admin can assign role");
  });

  it("should allow admin to assign different to one", async function () {
    // Attribuer initialement un rôle différent à breeder2
    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(breeder2.address, "TRANSPORTER");
    let initialRole = await bc24Contract.userRoles(breeder2.address);
    expect(initialRole).to.equal("TRANSPORTER");

    // set un autre rôle a breeder2
    await bc24Contract
      .connect(defaultAdmin)
      .giveUserRole(breeder2.address, "BREEDER");
    const changedRole = await bc24Contract.userRoles(breeder2.address);
    expect(changedRole).to.equal("BREEDER");
  });

  it("should allow BREEDER to mint Sheep resource", async function () {
    await expect(
      bc24Contract.connect(breeder).mintRessource(1, 1, "Sheep metadata", [])
    ).to.emit(bc24Contract, "ResourceCreatedEvent");

    const breederBalance = await bc24Contract.balanceOf(breeder.address, 65);
    expect(breederBalance).to.equal(1);
  });

  it("should not allow TRANSPORTER to mint Sheep resource", async () => {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };
    await expect(
      bc24Contract
        .connect(transporter)
        .mintRessource(1, 1, JSON.stringify(jsonObject), [])
    ).to.be.revertedWith("Caller does not have the right to use the process");
  });

  it("should allow BREEDER to set metadata", async function () {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(jsonObject), []);
    const tokenId = 65;
    const newMetaData = "New Metadata for Breeder";
    await bc24Contract.connect(breeder).setMetaData(tokenId, newMetaData);

    const metaData = await bc24Contract.getMetaData(tokenId);
    expect(metaData.data[0].dataString).to.equal(newMetaData);
  });

  it("should not allow TRANSPORTER to set metadata", async function () {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(jsonObject), []);
    const tokenId = 65;
    const newMetaData = "New Metadata for Transporter";
    expect(
      bc24Contract.connect(transporter).setMetaData(tokenId, newMetaData)
    ).to.be.revertedWith("Only admin or owner can set metadata");
  });

  it("should allow BREEDER to mint resource with valid template", async function () {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };

    const mintTx = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(jsonObject), []);
    const receipt = await mintTx.wait();

    expect(receipt.status).to.equal(1);
  });

  it("should burn required resources correctly when minting 'Sheep carcass'", async function () {
    // Mint a Sheep resource first to be used in minting Sheep carcass
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "Sheep metadata", []);
    const sheepBalanceBefore = await bc24Contract.balanceOf(
      breeder.address,
      65
    );
    expect(sheepBalanceBefore).to.equal(1);

    // Transfer Sheep resource to Slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 65, 1, "0x");

    // Verify Slaughterer received the Sheep resource
    const slaughtererSheepBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      65
    );
    expect(slaughtererSheepBalanceBefore).to.equal(1);

    // Mint Sheep carcass by Slaughterer and check the event
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "Sheep carcass metadata", [65]);

    // Verify Sheep resource was burned
    const slaughtererSheepBalanceAfter = await bc24Contract.balanceOf(
      slaughterer.address,
      65
    );
    expect(slaughtererSheepBalanceAfter).to.equal(0);

    // Verify Sheep carcass resource was minted
    const sheepCarcassBalance = await bc24Contract.balanceOf(
      slaughterer.address,
      66
    ); // Assuming 3 is the token ID for Sheep carcass
    expect(sheepCarcassBalance).to.equal(1);
  });

  it("should revert with an error if required ingredients are missing or insufficient", async function () {
    // Try to mint Sheep carcass without having a Sheep resource
    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(3, 1, "Sheep carcass metadata", [])
    ).to.be.revertedWith(
      "\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items."
    );

    // Mint a Sheep resource first
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "Sheep metadata", []);
    const sheepBalanceBefore = await bc24Contract.balanceOf(
      breeder.address,
      65
    );
    expect(sheepBalanceBefore).to.equal(1);

    // Transfer Sheep resource to Slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 65, 1, "0x");

    // Verify Slaughterer received the Sheep resource
    const slaughtererSheepBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      65
    );
    expect(slaughtererSheepBalanceBefore).to.equal(1);

    // Mint Sheep carcass with only 1 Sheep resource, but request minting of 2 Sheep carcasses
    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(3, 2, "Sheep carcass metadata", [65])
    ).to.be.revertedWith(
      "\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 1\nYou need: 2\nWith the resources in your possession, you could create 1 items."
    );

    // Verify Sheep resource balance is still the same
    const slaughtererSheepBalanceAfter = await bc24Contract.balanceOf(
      slaughterer.address,
      65
    );
    expect(slaughtererSheepBalanceAfter).to.equal(1);
  });
  it("should mint multiple tokens from a single producer token using mintOneToMany", async function () {
    await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "Sheep metadata", []);

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 65, 1, "0x");

    const slaughtererSheepBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      65
    );
    expect(slaughtererSheepBalanceBefore).to.equal(1);
    // Mint a Sheep carcass resource first to be used as a producer token
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "Sheep carcass metadata", [65]);

    // Verify initial balances
    let sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      66
    );

    // Ensure the slaughterer has at least 1 Sheep carcass token
    expect(sheepCarcassBalanceBefore).to.equal(1);

    //transfer carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 66, 1, "0x");

    sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      manufacturer.address,
      66
    );

    expect(sheepCarcassBalanceBefore).to.equal(1);

    // Call mintOneToMany to create multiple tokens from the Sheep carcass token
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(66, "New tokens created from Sheep carcass");

    // Verify that the Sheep carcass token has been burned
    const sheepCarcassBalanceAfter = await bc24Contract.balanceOf(
      manufacturer.address,
      66
    );
    expect(sheepCarcassBalanceAfter).to.equal(0);

    // Verify the balances of the newly minted tokens
    const sheepShoulderBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      67
    ); //  67 is the token ID for Sheep shoulder
    const sheepShoulderBalance2 = await bc24Contract.balanceOf(
      manufacturer.address,
      68
    ); //  token ID for the 2nd Sheep shoulder
    const sheepHipBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      69
    ); //  token ID for Sheep hip
    const sheepBackBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      70
    ); //  token ID for Sheep back
    const sheepRibsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      71
    ); //  token ID for Sheep rips
    const sheepRibsBalance2 = await bc24Contract.balanceOf(
      manufacturer.address,
      72
    ); //  token ID for Sheep rips
    const sheepBrainsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      73
    ); //  token ID for Sheep brains

    // Ensure the correct quantities of new tokens have been minted based on initial_amount_minted in the templates
    expect(sheepShoulderBalance).to.equal(2500); // 5000
    expect(sheepShoulderBalance2).to.equal(2500); // 5000
    expect(sheepHipBalance).to.equal(1 * 5000); // 5000
    expect(sheepBackBalance).to.equal(1 * 5000); // 5000
    expect(sheepRibsBalance).to.equal(7500); // 15000
    expect(sheepRibsBalance2).to.equal(7500); // 15000
    expect(sheepBrainsBalance).to.equal(1 * 700); // 700
  });

  //@TODO it("should not allow BREEDER to mint resource with invalid template", async function () {
  //   let invalidTemplate = {
  //     ressource_id: 0,  // Invalid because ressource_id is 0
  //     ressource_name: "",
  //     needed_resources: [],
  //     needed_resources_amounts: [],
  //     initial_amount_minted: 1,
  //     required_role: "",
  //     produces_resources: [],
  //     produces_resources_amounts: [],
  //   };

  //   const jsonObject = {
  //     placeOfOrigin: "Random Place",
  //     dateOfBirth: Math.floor(Math.random() * 1000000000),
  //     gender: Math.random() < 0.5 ? "Male" : "Female",
  //     weight: Math.random() * 100,
  //   };

  //   await expect(
  //     bc24Contract.connect(breeder).mintRessource(0, 1, JSON.stringify(jsonObject), [])
  //   ).to.be.revertedWith("Resource does not seem to exists in the system. Please check the id and try again. Otherwise contact the admin to add a new ressource to the system.");
  // });

  it("test all chain complex recipe", async function () {
    let sheepId = 1,
      cowId = 2,
      chickenId = 5;
    let sheepCarcassId = 3,
      cowCarcassId = 4,
      chickenCarcassId = 6;
    let sheepShoulderId = 20,
      cowHipId = 31,
      chickenBreastsId = 42;
    let complexRecipeId = 50;

    // Step 1: Breeder mints Sheep, Cow, and Chicken
    await bc24Contract
      .connect(breeder)
      .mintRessource(sheepId, 1, "Sheep metadata", []);
    await bc24Contract
      .connect(breeder)
      .mintRessource(cowId, 1, "Cow metadata", []);
    await bc24Contract
      .connect(breeder)
      .mintRessource(chickenId, 1, "Chicken metadata", []);

    // Verify initial mint
    expect(await bc24Contract.balanceOf(breeder.address, 65)).to.equal(1);
    expect(await bc24Contract.balanceOf(breeder.address, 66)).to.equal(1);
    expect(await bc24Contract.balanceOf(breeder.address, 67)).to.equal(1);

    //transfer to slaughterer

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 65, 1, "0x");
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 66, 1, "0x");
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, 67, 1, "0x");

    // Step 2: Slaughterer transforms Sheep, Cow, and Chicken into carcasses

    await bc24Contract
      .connect(slaughterer)
      .mintRessource(sheepCarcassId, 1, "Sheep carcass metadata", [65]);
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(cowCarcassId, 1, "Cow carcass metadata", [66]);
    await bc24Contract
      .connect(slaughterer)
      .mintRessource(chickenCarcassId, 1, "Chicken carcass metadata", [67]);
    // transfer slaughterer to manufacturer

    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 68, 1, "0x");
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 69, 1, "0x");
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 70, 1, "0x");

    // Step 3: Manufacturer transforms carcasses into specific parts
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(68, "Sheep shoulder metadata");
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(69, "Cow hip metadata");
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(70, "Chicken breasts metadata");
    const sheepShoulderBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      71
    );
    const cowHipBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      80
    );
    const chickenBreastsBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      89
    );
    const complexRecipeBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      95
    );
    // Step 4: Manufacturer creates the complex recipe
    await bc24Contract
      .connect(manufacturer)
      .mintRessource(
        complexRecipeId,
        1,
        "Complex Recipe metadata",
        [71, 80, 89]
      );

    // Verify the balances of the newly minted tokens
    const sheepShoulderBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      71
    );
    const cowHipBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      80
    );
    const chickenBreastsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      89
    );
    const complexRecipeBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      95
    );
  });
  it("test breed", async () => {
    const jsonObject = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };

    const mutton = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(jsonObject), []);

    const muttonReceipt = await mutton.wait();

    const tokenId = getTokenIdFromReceipt(muttonReceipt);
    const metaData = await getLatestMetaData(tokenId);

    expect(JSON.parse(metaData.metaData.data[0].dataString)).to.deep.equal(
      jsonObject
    );
  });

  it("test adding new metaData", async () => {
    const initialData = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };

    const mutton = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(initialData), []);

    const muttonReceipt = await mutton.wait();
    const tokenId = getTokenIdFromReceipt(muttonReceipt);

    const updateData = {
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

    const metaData = await getLatestMetaData(tokenId);
    const metaDataJson = JSON.parse(metaData.metaData.data[0].dataString);

    const newData = { ...updateData, ...metaDataJson };

    const setMetaDataTransaction = await bc24Contract
      .connect(breeder)
      .setMetaData(tokenId, JSON.stringify(newData));

    await setMetaDataTransaction.wait();

    const newMetaData = await getLatestMetaData(tokenId);

    const newMetaDataJson = JSON.parse(newMetaData.metaData.data[0].dataString);

    expect(newMetaDataJson).to.deep.equal({ ...updateData, ...initialData });
  });

  it("test transporting resource", async () => {
    const initialData = {
      placeOfOrigin: "Random Place",
      dateOfBirth: Math.floor(Math.random() * 1000000000),
      gender: Math.random() < 0.5 ? "Male" : "Female",
      weight: Math.random() * 100,
    };

    const mutton = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, JSON.stringify(initialData), []);

    const muttonReceipt = await mutton.wait();
    const tokenId = getTokenIdFromReceipt(muttonReceipt);

    const transferTransaction = await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, transporter.address, tokenId, 1, "0x");

    const transferReceit = await transferTransaction.wait();

    const transferData = {
      start: "Random Place",
      end: "Zurich",
      start_date: Math.floor(Math.random() * 1000000000),
      temperature: Math.random() * 100,
    };

    await bc24Contract
      .connect(transporter)
      .setMetaData(tokenId, JSON.stringify(transferData));

    let metaData = await getLatestMetaData(tokenId);

    expect(JSON.parse(metaData.metaData.data[0].dataString)).to.deep.equal(
      initialData
    );
    expect(JSON.parse(metaData.metaData.data[1].dataString)).to.deep.equal(
      transferData
    );

    const transferData2 = {
      start: "Random Place",
      end: "Zurich",
      end_date: Math.floor(Math.random() * 1000000000),
      temperature: Math.random() * 100,
    };

    let newMetaData;

    for (let dataItem of metaData.metaData.data) {
      if (dataItem.required_role == "TRANSPORTER") {
        newMetaData = { ...JSON.parse(dataItem.dataString), ...transferData2 };
      }
    }

    await bc24Contract
      .connect(transporter)
      .setMetaData(tokenId, JSON.stringify(newMetaData));

    metaData = await getLatestMetaData(tokenId);

    expect(JSON.parse(metaData.metaData.data[0].dataString)).to.deep.equal(
      initialData
    );
    expect(JSON.parse(metaData.metaData.data[1].dataString)).to.deep.equal(
      newMetaData
    );
  });

  it("should not allow to create resource if one does not own the necessary ingredients", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "", []);

    const muttonReceipt = await sheep.wait();
    const tokenId = getTokenIdFromReceipt(muttonReceipt);

    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(3, 1, "Caracass of a sheep.", [tokenId])
    ).to.be.revertedWith(
      `\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items.`
    );
  });

  it("should allow to create resource if one does own the necessary ingredients", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "", []);

    const muttonReceipt = await sheep.wait();
    const tokenId = getTokenIdFromReceipt(muttonReceipt);

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, tokenId, 1, "0x");

    const sheepCarcass = await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "Sheep carcass.", [tokenId]);

    const sheepCarcassReceipt = await sheepCarcass.wait();
    const sheepCarcassTokenId = getTokenIdFromReceipt(sheepCarcassReceipt);

    const carcassMetaDataEvent = await getLatestMetaData(sheepCarcassTokenId);

    expect(carcassMetaDataEvent.metaData.data[0].dataString).to.equal(
      "Sheep carcass."
    );
    expect(carcassMetaDataEvent.metaData.ingredients).to.deep.equal([tokenId]);
  });

  it("should not allow to create resource if wrong ingredients provided", async () => {
    const cow = await bc24Contract.connect(breeder).mintRessource(2, 1, "", []);

    const cowReceit = await cow.wait();
    const tokenId = getTokenIdFromReceipt(cowReceit);

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, tokenId, 1, "0x");

    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(3, 1, "Sheep carcass.", [tokenId])
    ).to.be.revertedWith(
      `\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items.`
    );
  });

  it("Should switch to the next ingredient when one is exausted", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(1, 1, "Sheep", []);

    const sheepReceipt = await sheep.wait();
    const sheepTokenId = getTokenIdFromReceipt(sheepReceipt);

    const beef = await bc24Contract
      .connect(breeder)
      .mintRessource(2, 1, "Beef", []);

    const beefReceipt = await beef.wait();
    const beefTokenId = getTokenIdFromReceipt(beefReceipt);

    // Transfer sheep to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(
        breeder.address,
        slaughterer.address,
        sheepTokenId,
        1,
        "0x"
      );
    // Transfer sheep to slaughterer
    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(
        breeder.address,
        slaughterer.address,
        beefTokenId,
        1,
        "0x"
      );

    // Slaughter sheep
    const sheepCarcas = await bc24Contract
      .connect(slaughterer)
      .mintRessource(3, 1, "Sheep carcass", [sheepTokenId]);
    const sheepCarcasReceipt = await sheepCarcas.wait();
    const sheepCarcasTokenId = getTokenIdFromReceipt(sheepCarcasReceipt);

    // Slaughter beef
    const beefCarcas = await bc24Contract
      .connect(slaughterer)
      .mintRessource(4, 1, "Beef carcass", [beefTokenId]);

    const beefCarcasReceipt = await beefCarcas.wait();
    const beefCarcasTokenId = getTokenIdFromReceipt(beefCarcasReceipt);

    // transfer sheep carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(
        slaughterer.address,
        manufacturer.address,
        sheepCarcasTokenId,
        1,
        "0x"
      );

    // transfer beef carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(
        slaughterer.address,
        manufacturer.address,
        beefCarcasTokenId,
        1,
        "0x"
      );

    // create products form carcasses
    const producesSheepCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        sheepCarcasTokenId,
        "Butchering the first sheep real good."
      );

    const producesBeefCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(beefCarcasTokenId, "Butchering this beef real good.");

    let sheepShoulderTokenId = [];
    let beefShoulderTokenId = [];

    const filter = bc24Contract.filters.ResourceMetaDataChangedEvent(); // Replace with your event name
    const events = await bc24Contract.queryFilter(filter);

    for (let event of events) {
      if (
        event.args.metaData.resourceId == 20 &&
        event.args.metaData.ingredients[0] == sheepCarcasTokenId
      ) {
        sheepShoulderTokenId.push(event.args.tokenId);
      }
      if (
        event.args.metaData.resourceId == 30 &&
        event.args.metaData.ingredients[0] == beefCarcasTokenId
      ) {
        beefShoulderTokenId.push(event.args.tokenId);
      }
    }

    // create X patties
    const x = 51;
    const mergezPatty = await bc24Contract
      .connect(manufacturer)
      .mintRessource(7, x, "Mergez Patty", [
        ...sheepShoulderTokenId,
        ...beefShoulderTokenId,
      ]);

    //printMetaData()

    const mergezPattyReceipt = await mergezPatty.wait();

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, beefShoulderTokenId[0])
    ).to.equal(3500 - x * 50);

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, sheepShoulderTokenId[0])
    ).to.equal(2500 - (x - 1) * 50);

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, sheepShoulderTokenId[1])
    ).to.equal(2500 - (x - 2500 / 50) * 50);
  });

  const getTokenIdFromReceipt = (receipt: any) => {
    const resourceCreatedEvents = receipt.logs.filter(
      (log) => log.fragment.name === "ResourceCreatedEvent"
    );
    return resourceCreatedEvents[0].args.tokenId;
  };

  const printCreatedResources = async () => {
    const filter = bc24Contract.filters.ResourceCreatedEvent(); // Replace with your event name
    const events = await bc24Contract.queryFilter(filter);

    for (let event of events) {
      console.log(event.args);
    }
  };

  const printMetaData = async () => {
    const filter = bc24Contract.filters.ResourceMetaDataChangedEvent(); // Replace with your event name
    const events = await bc24Contract.queryFilter(filter);

    for (let event of events) {
      console.log(event.args.metaData.data);
    }
  };

  const getLatestMetaData = async (tokenId: any) => {
    const filter = bc24Contract.filters.ResourceMetaDataChangedEvent(); // Replace with your event name
    const events = await bc24Contract.queryFilter(filter);

    const tokenEvents = [];
    for (let event of events) {
      if (event.args.tokenId == tokenId) {
        tokenEvents.push(event);
      }
    }
    return tokenEvents[tokenEvents.length - 1].args;
  };
});
