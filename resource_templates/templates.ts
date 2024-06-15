export const ressourceTemplates = [
  {

    ressource_id: 1,
    ressource_name: "Sheep",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Animal"
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
    ressource_type : "Animal"
  },

  {

    ressource_id: 3,
    ressource_name: "Sheep carcass",
    needed_resources: [1],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Carcass"
  },
  
  {
    ressource_id: 58,
    ressource_name: "Sheep demi carcass",
    needed_resources: [3],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [20, 21, 22, 23, 24],
    produces_resources_amounts: [2, 1, 1, 2, 1],
    ressource_type : "Demi Carcass"
  },

  {
    ressource_id: 5,
    ressource_name: "Chicken",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Animal"
  },
  {
    ressource_id: 6,
    ressource_name: "Chicken carcass",
    needed_resources: [5],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Carcass"
  },
  {
    ressource_id: 51,
    ressource_name: "Chicken demi carcass",
    needed_resources: [6],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [40, 41, 42],
    produces_resources_amounts: [2, 2, 2],
    ressource_type : "Demi Carcass"
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
    ressource_type : "Meat"
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
    ressource_type : "Meat"
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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

  },
  {

    ressource_id: 4,
    ressource_name: "Cow carcass",
    needed_resources: [2],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Carcass"

  },
  {

    ressource_id: 59,
    ressource_name: "Cow Demi carcass",
    needed_resources: [4],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [30, 31, 32, 33, 34],
    produces_resources_amounts: [2, 1, 1, 2, 1],
    ressource_type : "Demi Carcass"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Meat"

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
    ressource_type : "Product"

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
    ressource_type : "Product"

  },
  {
    ressource_id: 40,
    ressource_name: "Chicken wings",
    needed_resources: [6],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"

  },
  {
    ressource_id: 41,
    ressource_name: "Chicken thighs",
    needed_resources: [6],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"

  },
  {
    ressource_id: 42,
    ressource_name: "Chicken breasts",
    needed_resources: [6],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"

  },
  {
    ressource_id: 50,
    ressource_name: "Complex Recipe",
    needed_resources: [20, 31, 42], // Sheep shoulder, Cow hip, Chicken breasts
    needed_resources_amounts: [500, 500, 500],
    initial_amount_minted: 1500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"

  }
];
