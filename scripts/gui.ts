import { ethers } from "hardhat";
import readline from "readline";

import * as dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

let listenerAdded = false;
let transferSingleListenerAdded = false;

let contractExists = false;
let instance: any;

async function main() {
  if (!contractExists) {
    const ContractFactory = await ethers.getContractFactory("BC24");
    const contractAddress = process.env.CONTRACT_ADDRESS!;

    instance = ContractFactory.attach(contractAddress);
    contractExists = true;
  }

  if (!listenerAdded) {
    instance.on("ResourceMetaDataChangedEvent", (tokenId, metaData, caller) => {
      console.log(
        `ResourceMetaDataChangedEvent: TokenId: ${tokenId}, MetaData: ${metaData}, Caller: ${caller}`
      );
    });

    instance.on("TransferSingle", (operator, from, to, id, value, event) => {
      console.log(
        `TransferSingle: operator=${operator}, from=${from}, to=${to}, id=${id}, value=${value}`
      );
    });

    instance.on(
      "ResourceCreatedEvent",
      (tokenId, ressourceName, message, caller) => {
        console.log(
          `ResourceCreatedEvent: TokenId: ${tokenId}, ResourceName: ${ressourceName}, Message: ${message}, Caller: ${caller}`
        );
      }
    );

    listenerAdded = true;
  }

  const admin = (await ethers.getSigners())[0];
  const breeder = (await ethers.getSigners())[1];
  const breeder2 = (await ethers.getSigners())[2];
  const transporter = (await ethers.getSigners())[3];
  const transporter2 = (await ethers.getSigners())[4];
  const slaughterer = (await ethers.getSigners())[5];
  const slaughterer2 = (await ethers.getSigners())[6];
  const manufacturer = (await ethers.getSigners())[7];
  const manufacturer2 = (await ethers.getSigners())[8];

  const availableRoles = [
    {
      role: "ADMIN",
      wallet: admin,
    },
    {
      role: "BREEDER",
      wallet: breeder,
    },
    {
      role: "BREEDER",
      wallet: breeder2,
    },
    {
      role: "TRANSPORTER",
      wallet: transporter,
    },
    {
      role: "TRANSPORTER",
      wallet: transporter2,
    },
    {
      role: "SLAUGHTERER",
      wallet: slaughterer,
    },
    {
      role: "SLAUGHTERER",
      wallet: slaughterer2,
    },
    {
      role: "MANUFACTURER",
      wallet: manufacturer,
    },
    {
      role: "MANUFACTURER",
      wallet: manufacturer2,
    },
  ];

  try {
    console.log("Available roles: ");
    availableRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.role}`);
    });

    const selectedRoleIndex = parseInt(
      await askQuestion("Select your role by number: "),
      10
    );

    const selctedRole = availableRoles[selectedRoleIndex - 1].wallet;

    if (!selctedRole) {
      console.log("Invalid selection.");
      rl.close();
      return;
    }
    const action = await askQuestion(
      "What would you like to do? (giveRole/mint/oneToMany/change/transfer/restart): "
    );

    if (action === "giveRole") {
      console.log("Available roles: ");
      availableRoles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.role}`);
      });

      const selectedReceiverIndex = parseInt(
        await askQuestion("Select the receiver by number: "),
        10
      );

      const receiver = availableRoles[selectedReceiverIndex - 1].wallet;

      const role = await askQuestion("Enter the role you want to give: ");

      const transaction = await instance
        .connect(selctedRole)
        .giveUserRole(receiver.address, role);

      await transaction.wait();

      main(); // Restart the main function
    } else if (action.toLowerCase() === "mint") {
      console.log("Available resources:");
      ressourceTemplates.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.ressource_name}`);
      });

      const selectedResourceIndex = parseInt(
        await askQuestion("Select the resource you want to create by number: "),
        10
      );
      const selectedResource = ressourceTemplates[selectedResourceIndex - 1];

      if (!selectedResource) {
        console.log("Invalid selection.");
        rl.close();
        return;
      }

      const quantity = parseInt(
        await askQuestion(
          `Enter the quantity to mint for ${selectedResource.ressource_name}: `
        ),
        10
      );

      let selectedIngredients: number[] = [];

      if (selectedResource.needed_resources.length > 0) {
        const ingredientNames = selectedResource.needed_resources.map(
          (ingredientId) => {
            const ingredientType = ressourceTemplates.find(
              (resource) => resource.ressource_id === ingredientId
            );
            return ingredientType?.ressource_name;
          }
        );

        const ingredientNamesAndAmounts = ingredientNames.map(
          (name, index) =>
            `${name} ( ${quantity} * ${
              selectedResource.needed_resources_amounts[index]
            } = ${quantity * selectedResource.needed_resources_amounts[index]})`
        );

        console.log(
          `This resource requires the following ingredients: ${ingredientNamesAndAmounts.join(
            ", "
          )}`
        );
        for (let i = 0; i < selectedResource.needed_resources.length; i++) {
          const ingredientId = selectedResource.needed_resources[i];
          const ingredientType = ressourceTemplates.find(
            (resource) => resource.ressource_id === ingredientId
          );
          const selectedTokenIds = await askQuestion(
            `Enter the tokenId of type ${ingredientType?.ressource_name}: (if multiple comma seperated) `
          );

          for (let selectedTokenId of selectedTokenIds.split(",")) {
            selectedIngredients.push(parseInt(selectedTokenId, 10));
          }
        }
      }

      const metaData = await askQuestion(
        "Enter the metadata for the resource: "
      );

      const transaction = await instance.connect(selctedRole).mintRessource(
        selectedResourceIndex,
        quantity,
        JSON.stringify(metaData),
        selectedIngredients
        /*  {
            maxPriorityFeePerGas: 0,
            maxFeePerGas: 0,
          } */
      );
      const logs = await transaction.wait();
      console.log(logs.logs);

      main(); // Restart the main function
    } else if (action.toLowerCase() === "transfer") {
      const tokenId = parseInt(
        await askQuestion("Enter the token ID you want to transfer: "),
        10
      );

      const amount = parseInt(
        await askQuestion("Enter the amount to transfer: "),
        10
      );

      console.log("Available receivers: ");
      availableRoles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.role}`);
      });

      const selectedReceiverIndex = parseInt(
        await askQuestion("Select the receiver by number: "),
        10
      );

      const receiver = availableRoles[selectedReceiverIndex - 1].wallet;

      const transaction = await instance
        .connect(selctedRole)
        .safeTransferFrom(
          selctedRole.address,
          receiver.address,
          tokenId,
          amount,
          "0x00",
          {
            maxPriorityFeePerGas: 0,
            maxFeePerGas: 0,
          }
        );

      await transaction.wait();

      main(); // Restart the main function
    } else if (action.toLowerCase() === "change") {
      const tokenId = parseInt(
        await askQuestion("Enter the token ID you want to change: "),
        10
      );

      const metaData = await askQuestion(
        "Enter the new metadata for the resource: "
      );

      const transaction = await instance
        .connect(selctedRole)
        .setMetaData(tokenId, JSON.stringify(metaData), {
          maxPriorityFeePerGas: 0,
          maxFeePerGas: 0,
        });

      await transaction.wait();

      main(); // Restart the main function
    } else if (action.toLowerCase() === "onetomany") {
      const tokenId = parseInt(
        await askQuestion(
          "Enter the token ID you want to create resources from: "
        ),
        10
      );

      const metaData = await askQuestion(
        "Enter the new metadata for the new dresource: "
      );

      const transaction = await instance
        .connect(selctedRole)
        .mintOneToMany(tokenId, JSON.stringify(metaData), {
          maxPriorityFeePerGas: 0,
          maxFeePerGas: 0,
        });

      await transaction.wait();

      main(); // Restart the main function
    } else if (action.toLowerCase() === "restart") {
      console.log("Exiting...");
      main(); // Restart the main function
    } else {
      console.log("Invalid action.");
      main(); // Restart the main function
    }
  } catch (error) {
    console.error("Error occurred:", error);
    rl.close();
  }
}

const ressourceTemplates = [
  {
    ressource_id: 1,
    ressource_name: "Sheep",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 2,
    ressource_name: "Cow",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
  },

  {
    ressource_id: 3,
    ressource_name: "Sheep carcass",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [20, 21, 22, 23, 24],
    produces_resources_amounts: [2, 1, 1, 2, 1],
  },
  {
    ressource_id: 20,
    ressource_name: "Sheep shoulder",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 2500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 21,
    ressource_name: "Sheep hip",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 5000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 22,
    ressource_name: "Sheep back",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 5000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 23,
    ressource_name: "Sheep rips",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 7500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 24,
    ressource_name: "Sheep brains",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 700,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 4,
    ressource_name: "Cow carcass",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [30, 31, 32, 33, 34],
    produces_resources_amounts: [2, 1, 1, 2, 1],
  },
  {
    ressource_id: 30,
    ressource_name: "Cow shoulder",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 3500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 31,
    ressource_name: "Cow hip",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 1000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 32,
    ressource_name: "Cow back",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 2000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 33,
    ressource_name: "Cow rips",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 1500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 34,
    ressource_name: "Cow brains",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 1400,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 7,
    ressource_name: "Mergez Patty",
    needed_resources: [20, 30],
    needed_resources_amounts: [50, 50],
    initial_amount_minted: 100,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 8,
    ressource_name: "Mergez",
    needed_resources: [7],
    needed_resources_amounts: [100],
    initial_amount_minted: 1,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
  {
    ressource_id: 9,
    ressource_name: "Mergez sandwich",
    needed_resources: [8],
    needed_resources_amounts: [2],
    initial_amount_minted: 1,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
  },
];

main();
