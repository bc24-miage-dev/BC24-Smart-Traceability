export const ressourceTemplates = [
  // <------------------------> Animal
  {
    ressource_id: 45,
    ressource_name: "Sheep",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type: "Animal",
  },

  {
    ressource_id: 46,
    ressource_name: "Cow",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type: "Animal",
  },

  {
    ressource_id: 47,
    ressource_name: "Chicken",
    needed_resources: [],
    needed_resources_amounts: [],
    initial_amount_minted: 1,
    required_role: "BREEDER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type: "Animal",
  },

// <------------------------> Carcass

  {
    ressource_id: 48,
    ressource_name: "Sheep carcass",
    needed_resources: [45],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type: "Carcass",
  },

  {

    ressource_id: 49,
    ressource_name: "Cow carcass",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Carcass"

  },

  {
    ressource_id: 50,
    ressource_name: "Chicken carcass",
    needed_resources: [47],
    needed_resources_amounts: [1],
    initial_amount_minted: 1,
    required_role: "SLAUGHTERER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Carcass"
  },

//<------------------> Demi Carcass

  {
    ressource_id: 51,
    ressource_name: "Sheep demi carcass",
    needed_resources: [48],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [54, 55, 56, 57, 58],
    produces_resources_amounts: [1, 1, 1, 1, 1],
    ressource_type : "Demi Carcass"
  },

  {
    ressource_id: 52,
    ressource_name: "Cow Demi carcass",
    needed_resources: [49],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [59, 60, 61, 62, 63],
    produces_resources_amounts: [1, 1, 1, 1, 1],
    ressource_type : "Demi Carcass"
  },

  {
    ressource_id: 53,
    ressource_name: "Chicken demi carcass",
    needed_resources: [50],
    needed_resources_amounts: [1],
    initial_amount_minted: 2,
    required_role: "SLAUGHTERER",
    produces_resources: [64, 65, 69],
    produces_resources_amounts: [1, 1, 1],
    ressource_type : "Demi Carcass"
  },

// <---------------------> Meat 
  
  {
    ressource_id: 54,
    ressource_name: "Sheep shoulder",
    needed_resources: [45], //maybe put 0 as a reserved id so u cant mint it from nothing 
    needed_resources_amounts: [1],
    initial_amount_minted: 2500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type: "Meat",
  },
  {
    ressource_id: 55,
    ressource_name: "Sheep hip",
    needed_resources: [45],
    needed_resources_amounts: [1],
    initial_amount_minted: 5000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 56,
    ressource_name: "Sheep back",
    needed_resources: [45],
    needed_resources_amounts: [1],
    initial_amount_minted: 5000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 57,
    ressource_name: "Sheep rips",
    needed_resources: [45],
    needed_resources_amounts: [1],
    initial_amount_minted: 7500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 58,
    ressource_name: "Sheep brains",
    needed_resources: [45],
    needed_resources_amounts: [1],
    initial_amount_minted: 700,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 59,
    ressource_name: "Cow shoulder",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 3500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 60,
    ressource_name: "Cow hip",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 1000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 61,
    ressource_name: "Cow back",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 2000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 62,
    ressource_name: "Cow rips",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 1500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 63,
    ressource_name: "Cow brains",
    needed_resources: [46],
    needed_resources_amounts: [1],
    initial_amount_minted: 1690,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 64,
    ressource_name: "Chicken thighs",
    needed_resources: [50],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 65,
    ressource_name: "Chicken breasts",
    needed_resources: [50],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },

  {
    ressource_id: 66,
    ressource_name: "Mergez Patty",
    needed_resources: [54, 59],
    needed_resources_amounts: [30, 70],
    initial_amount_minted: 100,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Meat"
  },
// <----------------------> Product
  {
    ressource_id: 67,
    ressource_name: "Mergez",
    needed_resources: [66],
    needed_resources_amounts: [100],
    initial_amount_minted: 100,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"
  },

  {
    ressource_id: 68,
    ressource_name: "Mergez sandwich",
    needed_resources: [67],
    needed_resources_amounts: [100],
    initial_amount_minted: 1,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"
  },

  {
    ressource_id: 69,
    ressource_name: "Chicken wings",
    needed_resources: [50],
    needed_resources_amounts: [1],
    initial_amount_minted: 3000,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"
  },

  {
    ressource_id: 70,
    ressource_name: "Weird mix",
    needed_resources: [54, 60, 65], // Sheep shoulder, Cow hip, Chicken breasts
    needed_resources_amounts: [500, 500, 500],
    initial_amount_minted: 1500,
    required_role: "MANUFACTURER",
    produces_resources: [],
    produces_resources_amounts: [],
    ressource_type : "Product"
  }
];
