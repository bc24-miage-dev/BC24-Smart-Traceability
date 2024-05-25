import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { ressourceTemplates } from "../resource_templates/templates";

describe("BC24", function () {
  let bc24Contract: any;

  let defaultAdmin: any;
  let breeder: any;
  let slaughterer: any;
  let transporter: any;
  let manufactuerer: any;

  this.beforeEach(async function () {
    defaultAdmin = (await ethers.getSigners())[0];
    breeder = (await ethers.getSigners())[1];
    slaughterer = (await ethers.getSigners())[2];
    manufactuerer = (await ethers.getSigners())[3];
    transporter = (await ethers.getSigners())[4];
    /* This it the general setup needed for all the contracts*/
    /* If a new contract is put into an interface it needs to be added likewise in the SetupService */

    const bc24 = await ethers.getContractFactory("BC24_Update");
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
      .giveUserRole(manufactuerer.address, "MANUFACTURER");
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

    //console.log(metaData.metaData.data);

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
        manufactuerer.address,
        sheepCarcasTokenId,
        1,
        "0x"
      );

    // transfer beef carcass to manufacturer
    await bc24Contract
      .connect(slaughterer)
      .safeTransferFrom(
        slaughterer.address,
        manufactuerer.address,
        beefCarcasTokenId,
        1,
        "0x"
      );

    // create products form carcasses
    const producesSheepCarcassResources = await bc24Contract
      .connect(manufactuerer)
      .mintOneToMany(
        sheepCarcasTokenId,
        "Butchering the first sheep real good."
      );

    const producesBeefCarcassResources = await bc24Contract
      .connect(manufactuerer)
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
      .connect(manufactuerer)
      .mintRessource(7, x, "Mergez Patty", [
        ...sheepShoulderTokenId,
        ...beefShoulderTokenId,
      ]);

    const mergezPattyReceipt = await mergezPatty.wait();

    expect(
      await bc24Contract
        .connect(manufactuerer)
        .balanceOf(manufactuerer.address, beefShoulderTokenId[0])
    ).to.equal(3500 - x * 50);

    expect(
      await bc24Contract
        .connect(manufactuerer)
        .balanceOf(manufactuerer.address, sheepShoulderTokenId[0])
    ).to.equal(2500 - (x - 1) * 50);

    expect(
      await bc24Contract
        .connect(manufactuerer)
        .balanceOf(manufactuerer.address, sheepShoulderTokenId[1])
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
