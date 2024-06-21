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
      .map((template) => template.ressource_id)
      .sort();
    const sortedRessourceTemplateIds = ressourceTemplates
      .map((template) => template.ressource_id)
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
      bc24Contract.connect(breeder).mintRessource(42, 1, "Sheep metadata", [])
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
        .mintRessource(42, 1, JSON.stringify(jsonObject), [])
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
      .mintRessource(42, 1, JSON.stringify(jsonObject), []);
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
      .mintRessource(42, 1, JSON.stringify(jsonObject), []);
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
      .mintRessource(42, 1, JSON.stringify(jsonObject), []);
    const receipt = await mintTx.wait();

    expect(receipt.status).to.equal(1);
  });

  it("should burn required resources correctly when minting 'Sheep carcass'", async function () {
    // Mint a Sheep resource first to be used in minting Sheep carcass
    await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep metadata", []);
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
      .mintRessource(45, 1, "Sheep carcass metadata", [65]);

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
        .mintRessource(45, 1, "Sheep carcass metadata", [])
    ).to.be.revertedWith(
      "\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items."
    );

    // Mint a Sheep resource first
    await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep metadata", []);
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
        .mintRessource(45, 2, "Sheep carcass metadata", [65])
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

  it("should only mintOneToMany when resource really produces other resources", async function () {
    await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep metadata", []);

    await expect(
      bc24Contract.connect(breeder).mintOneToMany(1, "Sheep metadata")
    ).to.be.revertedWith("This Resource does not produce any other resources.");
  });

  it("should mint multiple tokens from a single producer token using mintOneToMany", async function () {
    await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep metadata", []);

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
      .mintRessource(45, 1, "Sheep carcass metadata", [65]); //token = 66

    // Verify initial balances
    let sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      66
    );

    // Ensure the slaughterer has at least 1 Sheep carcass token
    expect(sheepCarcassBalanceBefore).to.equal(1);

    await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(66, "Sheep Demi carcass metadata"); //token = 67 and 68

    //transfer carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 67, 1, "0x");

    sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      manufacturer.address,
      67
    );

    expect(sheepCarcassBalanceBefore).to.equal(1);

    // Call mintOneToMany to create multiple tokens from the Sheep carcass token
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(67, "New tokens created from Sheep carcass");
    // Verify that the Sheep carcass token has been burned
    const sheepCarcassBalanceAfter = await bc24Contract.balanceOf(
      manufacturer.address,
      67
    );
    expect(sheepCarcassBalanceAfter).to.equal(0);

    // Verify the balances of the newly minted tokens

    const sheepShoulderBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      69
    ); //  69 is the token ID for Sheep shoulder
    const sheepHipBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      70
    ); //  token ID for Sheep hip
    const sheepBackBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      71
    ); //  token ID for Sheep back
    const sheepRibsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      72
    ); //  token ID for Sheep ribs
    const sheepBrainsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      73
    ); //  token ID for Sheep brains

    // Ensure the correct quantities of new tokens have been minted based on initial_amount_minted in the templates
    expect(sheepShoulderBalance).to.equal(2500); // 2500
    expect(sheepHipBalance).to.equal(5000); // 5000
    expect(sheepBackBalance).to.equal(5000); // 5000
    expect(sheepRibsBalance).to.equal(7500); // 7500
    expect(sheepBrainsBalance).to.equal(1 * 700); // 700
  });

  it("should not let mint a resource which is in a the produces_resource array of another resource", async function () {
    await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep metadata", []);

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
      .mintRessource(45, 1, "Sheep carcass metadata", [65]); // token carcass = 66

    // Verify initial balances
    let sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      66
    );

    // Ensure the slaughterer has at least 1 Sheep carcass token
    expect(sheepCarcassBalanceBefore).to.equal(1);

    // create demi-carcass
    await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(66, "Sheep Demi carcass metadata"); //token = 67 and 68

    let sheepDemiCarcassBalanceBefore = await bc24Contract.balanceOf(
      slaughterer.address,
      67
    );

    expect(sheepDemiCarcassBalanceBefore).to.equal(1);

    //transfer demi carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 67, 1, "0x");

    sheepCarcassBalanceBefore = await bc24Contract.balanceOf(
      manufacturer.address,
      67
    );

    expect(sheepCarcassBalanceBefore).to.equal(1);

    await expect(
      bc24Contract
        .connect(manufacturer)
        .mintRessource(54, 1, "Sheep shoulder from sheepCarcass", [67])
    ).to.be.revertedWith(
      "This resource needs to be created from a producer resource."
    );
  });

  it("test all chain complex recipe", async function () {
    let sheepId = 42,
      cowId = 43,
      chickenId = 44;

    let sheepCarcassId = 45,
      cowCarcassId = 46,
      chickenCarcassId = 47;

    let sheepLeftDemiCarcassId = 48,
      sheepRightDemiCarcassId = 49,
      cowLeftDemiCarcassId = 50,
      cowRightDemiCarcassId = 51,
      chickenLeftDemiCarcassId = 52,
      chickenRightDemiCarcassId = 53;

    let sheepShoulderId = 54,
      cowHipId = 60,
      chickenBreastsId = 65;

    let complexRecipeId = 70;

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

    // Verify transfer
    expect(await bc24Contract.balanceOf(slaughterer.address, 65)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 66)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 67)).to.equal(1);

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

    // Verify carcass mint
    expect(await bc24Contract.balanceOf(slaughterer.address, 68)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 69)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 70)).to.equal(1);

    //carcass into DemiCarcass
    await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(68, "Sheep Demi carcass metadata");
    await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(69, "Cow Demi carcass metadata");
    await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(70, "Chicken Demi carcass metadata");

    expect(await bc24Contract.balanceOf(slaughterer.address, 71)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 72)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 73)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 74)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 75)).to.equal(1);
    expect(await bc24Contract.balanceOf(slaughterer.address, 76)).to.equal(1);
    // 71,72 => Demi carcass sheep
    // 73,74 => Demi carcass Cow
    // 75,76 => Demi carcass Chicken

    // transfer slaughterer to manufacturer

    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 71, 1, "0x");
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 73, 1, "0x");
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(slaughterer.address, manufacturer.address, 75, 1, "0x");

    // Step 3: Manufacturer transforms carcasses into specific parts
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(71, "Sheep Demi carcass metadata"); //77, 78,79,80, 81
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(73, "Cow carcass metadata"); //82, 83, 84, 85, 86
    await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(75, "Chicken  carcass metadata"); //87, 88, 89)

    const sheepShoulderBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      77
    );

    const cowHipBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      83
    );

    const chickenBreastsBalanceB4 = await bc24Contract.balanceOf(
      manufacturer.address,
      88
    );

    // Step 4: Manufacturer creates the complex recipe
    await bc24Contract
      .connect(manufacturer)
      .mintRessource(
        complexRecipeId,
        1,
        "Complex Recipe metadata",
        [77, 83, 88]
      );

    // Verify the balances of the newly minted tokens
    const sheepShoulderBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      77
    );
    const cowHipBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      83
    );
    const chickenBreastsBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      88
    );
    const complexRecipeBalance = await bc24Contract.balanceOf(
      manufacturer.address,
      90
    );
    expect(sheepShoulderBalance).to.equal(2000);
    expect(cowHipBalance).to.equal(500);
    expect(chickenBreastsBalance).to.equal(2500);
    expect(complexRecipeBalance).to.equal(1500);
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
      .mintRessource(42, 1, JSON.stringify(jsonObject), []); // => 65

    const muttonReceipt = await mutton.wait();

    const tokenId = getTokenIdsFromReceipt(muttonReceipt)[0];
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
      .mintRessource(42, 1, JSON.stringify(initialData), []);

    const muttonReceipt = await mutton.wait();
    const tokenId = getTokenIdsFromReceipt(muttonReceipt)[0];

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
      .mintRessource(42, 1, JSON.stringify(initialData), []);

    const muttonReceipt = await mutton.wait();
    const tokenId = getTokenIdsFromReceipt(muttonReceipt)[0];

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
      .mintRessource(42, 1, "sheep metadata", []);

    const muttonReceipt = await sheep.wait();
    const tokenId = getTokenIdsFromReceipt(muttonReceipt)[0];

    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(45, 1, "Caracass of a sheep.", [tokenId])
    ).to.be.revertedWith(
      `\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items.`
    );
  });

  it("should allow to create resource if one does own the necessary ingredients", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep", []);

    const muttonReceipt = await sheep.wait();
    const tokenId = getTokenIdsFromReceipt(muttonReceipt)[0];

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, tokenId, 1, "0x");

    const sheepCarcass = await bc24Contract
      .connect(slaughterer)
      .mintRessource(45, 1, "Sheep carcass.", [tokenId]);
    const sheepCarcassReceipt = await sheepCarcass.wait();
    const sheepCarcassTokenId = getTokenIdsFromReceipt(sheepCarcassReceipt)[0];

    const carcassMetaDataEvent = await getLatestMetaData(sheepCarcassTokenId);

    expect(carcassMetaDataEvent.metaData.data[0].dataString).to.equal(
      "Sheep carcass."
    );
    expect(carcassMetaDataEvent.metaData.ingredients).to.deep.equal([tokenId]);
  });

  it("should not allow to create resource if wrong ingredients provided", async () => {
    const cow = await bc24Contract
      .connect(breeder)
      .mintRessource(43, 1, "Cow", []);

    const cowReceit = await cow.wait();
    const tokenId = getTokenIdsFromReceipt(cowReceit)[0];

    await bc24Contract
      .connect(breeder)
      .safeTransferFrom(breeder.address, slaughterer.address, tokenId, 1, "0x");

    await expect(
      bc24Contract
        .connect(slaughterer)
        .mintRessource(45, 1, "Sheep carcass.", [tokenId])
    ).to.be.revertedWith(
      `\nYou do not have the required resource (Sheep) to perform this action.\nYou have: 0\nYou need: 1\nWith the resources in your possession, you could create 0 items.`
    );
  });

  it("Should switch to the next ingredient when one is exausted", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep", []);

    const sheepReceipt = await sheep.wait();
    const sheepTokenId = getTokenIdsFromReceipt(sheepReceipt)[0];

    const beef = await bc24Contract
      .connect(breeder)
      .mintRessource(43, 1, "Beef", []);

    const beefReceipt = await beef.wait();
    const beefTokenId = getTokenIdsFromReceipt(beefReceipt)[0];

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
    // Transfer beef to slaughterer
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
      .mintRessource(45, 1, "Sheep carcass", [sheepTokenId]);
    const sheepCarcasReceipt = await sheepCarcas.wait();
    const sheepCarcasTokenId = getTokenIdsFromReceipt(sheepCarcasReceipt)[0];

    // Slaughter beef
    const beefCarcas = await bc24Contract
      .connect(slaughterer)
      .mintRessource(46, 1, "Beef carcass", [beefTokenId]);

    const beefCarcasReceipt = await beefCarcas.wait();
    const beefCarcasTokenId = getTokenIdsFromReceipt(beefCarcasReceipt)[0];

    // Slaughter Demi sheep
    const sheepDemiCarcas = await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(sheepCarcasTokenId, "SheepDemi carcass");
    const sheepDemiCarcasReceipt = await sheepDemiCarcas.wait();
    const sheepDemiCarcasTokenIds = getTokenIdsFromReceipt(
      sheepDemiCarcasReceipt
    );

    // Slaughter Demi beef
    const beefDemiCarcas = await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(beefCarcasTokenId, "BeefDemi carcass");

    const beefDemiCarcasReceipt = await beefDemiCarcas.wait();
    const beefDemiCarcasTokenIds = getTokenIdsFromReceipt(
      beefDemiCarcasReceipt
    );

    // transfer sheeps carcass to manufacturer
    for (let i = 0; i < sheepDemiCarcasTokenIds.length; i++) {
      await bc24Contract
        .connect(slaughterer)
        .safeTransferFrom(
          slaughterer.address,
          manufacturer.address,
          sheepDemiCarcasTokenIds[i],
          1,
          "0x"
        );
    }

    // transfer beef carcass to manufacturer
    for (let i = 0; i < beefDemiCarcasTokenIds.length; i++) {
      await bc24Contract
        .connect(slaughterer)
        .safeTransferFrom(
          slaughterer.address,
          manufacturer.address,
          beefDemiCarcasTokenIds[i],
          1,
          "0x"
        );
    }

    // create products from carcasse
    const producesSheepCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        sheepDemiCarcasTokenIds[0],
        "Butchering the first sheep real good."
      );

    const producesBeefCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        beefDemiCarcasTokenIds[0],
        "Butchering this beef real good."
      );

    const producesBeefCarcassResources1 = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        beefDemiCarcasTokenIds[1],
        "Butchering this beef real good."
      );

    let sheepShoulderTokenId = [];
    let beefShoulderTokenId = [];

    const filter = bc24Contract.filters.ResourceMetaDataChangedEvent();
    const events = await bc24Contract.queryFilter(filter);

    for (let event of events) {
      if (event.args.metaData.resourceId == 54) {
        sheepShoulderTokenId.push(event.args.tokenId);
      }
      if (event.args.metaData.resourceId == 59) {
        beefShoulderTokenId.push(event.args.tokenId);
      }
    }

    // create X patties
    let x = 51;
    const mergezPatty = await bc24Contract
      .connect(manufacturer)
      .mintRessource(66, x, "Mergez Patty", [
        ...sheepShoulderTokenId,
        ...beefShoulderTokenId,
      ]);

    //printMetaData()

    const mergezPattyReceipt = await mergezPatty.wait();

    const max_number_of_patties_with_first_beef = Math.min(3500 / 70, x);

    const max_number_of_patties_with_second_beef =
      x - max_number_of_patties_with_first_beef;

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, beefShoulderTokenId[0])
    ).to.equal(3500 - max_number_of_patties_with_first_beef * 70);

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, beefShoulderTokenId[1])
    ).to.equal(3500 - max_number_of_patties_with_second_beef * 70);

    expect(
      await bc24Contract
        .connect(manufacturer)
        .balanceOf(manufacturer.address, sheepShoulderTokenId[0])
    ).to.equal(2500 - x * 30);
  });

  it("Should tell that the provided resources are not sufficient", async () => {
    const sheep = await bc24Contract
      .connect(breeder)
      .mintRessource(42, 1, "Sheep", []);

    const sheepReceipt = await sheep.wait();
    const sheepTokenId = getTokenIdsFromReceipt(sheepReceipt)[0];

    const beef = await bc24Contract
      .connect(breeder)
      .mintRessource(43, 1, "Beef", []);

    const beefReceipt = await beef.wait();
    const beefTokenId = getTokenIdsFromReceipt(beefReceipt)[0];

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
    // Transfer beef to slaughterer
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
      .mintRessource(45, 1, "Sheep carcass", [sheepTokenId]);
    const sheepCarcasReceipt = await sheepCarcas.wait();
    const sheepCarcasTokenId = getTokenIdsFromReceipt(sheepCarcasReceipt)[0];

    // Slaughter beef
    const beefCarcas = await bc24Contract
      .connect(slaughterer)
      .mintRessource(46, 1, "Beef carcass", [beefTokenId]);

    const beefCarcasReceipt = await beefCarcas.wait();
    const beefCarcasTokenId = getTokenIdsFromReceipt(beefCarcasReceipt)[0];

    // Slaughter Demi sheep
    const sheepDemiCarcas = await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(sheepCarcasTokenId, "SheepDemi carcass");
    const sheepDemiCarcasReceipt = await sheepDemiCarcas.wait();
    const sheepDemiCarcasTokenIds = getTokenIdsFromReceipt(
      sheepDemiCarcasReceipt
    );

    // Slaughter Demi beef
    const beefDemiCarcas = await bc24Contract
      .connect(slaughterer)
      .mintOneToMany(beefCarcasTokenId, "BeefDemi carcass");

    const beefDemiCarcasReceipt = await beefDemiCarcas.wait();
    const beefDemiCarcasTokenIds = getTokenIdsFromReceipt(
      beefDemiCarcasReceipt
    );

    // transfer sheeps carcass to manufacturer
    for (let i = 0; i < sheepDemiCarcasTokenIds.length; i++) {
      await bc24Contract
        .connect(slaughterer)
        .safeTransferFrom(
          slaughterer.address,
          manufacturer.address,
          sheepDemiCarcasTokenIds[i],
          1,
          "0x"
        );
    }

    // transfer beef carcass to manufacturer
    for (let i = 0; i < beefDemiCarcasTokenIds.length; i++) {
      await bc24Contract
        .connect(slaughterer)
        .safeTransferFrom(
          slaughterer.address,
          manufacturer.address,
          beefDemiCarcasTokenIds[i],
          1,
          "0x"
        );
    }

    // create products from carcasse
    const producesSheepCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        sheepDemiCarcasTokenIds[0],
        "Butchering the first sheep real good."
      );

    const producesBeefCarcassResources = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        beefDemiCarcasTokenIds[0],
        "Butchering this beef real good."
      );

    const producesBeefCarcassResources1 = await bc24Contract
      .connect(manufacturer)
      .mintOneToMany(
        beefDemiCarcasTokenIds[1],
        "Butchering this beef real good."
      );

    let sheepShoulderTokenId = [];
    let beefShoulderTokenId = [];

    const filter = bc24Contract.filters.ResourceMetaDataChangedEvent();
    const events = await bc24Contract.queryFilter(filter);

    for (let event of events) {
      if (event.args.metaData.resourceId == 54) {
        sheepShoulderTokenId.push(event.args.tokenId);
      }
      if (event.args.metaData.resourceId == 59) {
        beefShoulderTokenId.push(event.args.tokenId);
      }
    }

    const expectedRevertMessage =
      "\nYou do not have the required resource (Sheep shoulder) to perform this action.\nYou have: 2500\nYou need: 7500\nWith the resources in your possession, you could create 83 items.";
    // create X patties
    let x = 250;
    await expect(
      bc24Contract
        .connect(manufacturer)
        .mintRessource(66, x, "Mergez Patty", [
          ...sheepShoulderTokenId,
          ...beefShoulderTokenId,
        ])
    ).to.be.revertedWith(expectedRevertMessage);
  });

  const getTokenIdsFromReceipt = (receipt: any) => {
    const resourceCreatedEvents = receipt.logs.filter(
      (log) => log.fragment.name === "ResourceCreatedEvent"
    );
    const tokenIds = resourceCreatedEvents.map(
      (event: any) => event.args.tokenId
    );
    return tokenIds;
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
