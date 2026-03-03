import { PropertyTemplate } from "@/lib/types";

export const MONOPOLY_PROPERTIES: PropertyTemplate[] = [
  {
    id: "mediterranean_avenue",
    name: "Mediterranean Avenue",
    type: "street",
    colorGroup: "Brown",
    purchasePrice: 60,
    mortgageValue: 30,
    rent: { base: 2, house1: 10, house2: 30, house3: 90, house4: 160, hotel: 250, houseCost: 50 }
  },
  {
    id: "baltic_avenue",
    name: "Baltic Avenue",
    type: "street",
    colorGroup: "Brown",
    purchasePrice: 60,
    mortgageValue: 30,
    rent: { base: 4, house1: 20, house2: 60, house3: 180, house4: 320, hotel: 450, houseCost: 50 }
  },

  {
    id: "reading_railroad",
    name: "Reading Railroad",
    type: "railroad",
    colorGroup: "Railroad",
    purchasePrice: 200,
    mortgageValue: 100,
    rent: { base: 25, railroadOwned2: 50, railroadOwned3: 100, railroadOwned4: 200 }
  },

  {
    id: "oriental_avenue",
    name: "Oriental Avenue",
    type: "street",
    colorGroup: "Light Blue",
    purchasePrice: 100,
    mortgageValue: 50,
    rent: { base: 6, house1: 30, house2: 90, house3: 270, house4: 400, hotel: 550, houseCost: 50 }
  },
  {
    id: "vermont_avenue",
    name: "Vermont Avenue",
    type: "street",
    colorGroup: "Light Blue",
    purchasePrice: 100,
    mortgageValue: 50,
    rent: { base: 6, house1: 30, house2: 90, house3: 270, house4: 400, hotel: 550, houseCost: 50 }
  },
  {
    id: "connecticut_avenue",
    name: "Connecticut Avenue",
    type: "street",
    colorGroup: "Light Blue",
    purchasePrice: 120,
    mortgageValue: 60,
    rent: { base: 8, house1: 40, house2: 100, house3: 300, house4: 450, hotel: 600, houseCost: 50 }
  },

  {
    id: "st_charles_place",
    name: "St. Charles Place",
    type: "street",
    colorGroup: "Pink",
    purchasePrice: 140,
    mortgageValue: 70,
    rent: { base: 10, house1: 50, house2: 150, house3: 450, house4: 625, hotel: 750, houseCost: 100 }
  },
  {
    id: "electric_company",
    name: "Electric Company",
    type: "utility",
    colorGroup: "Utility",
    purchasePrice: 150,
    mortgageValue: 75,
    rent: { base: 0, utilityOneMultiplier: 4, utilityBothMultiplier: 10 }
  },
  {
    id: "states_avenue",
    name: "States Avenue",
    type: "street",
    colorGroup: "Pink",
    purchasePrice: 140,
    mortgageValue: 70,
    rent: { base: 10, house1: 50, house2: 150, house3: 450, house4: 625, hotel: 750, houseCost: 100 }
  },
  {
    id: "virginia_avenue",
    name: "Virginia Avenue",
    type: "street",
    colorGroup: "Pink",
    purchasePrice: 160,
    mortgageValue: 80,
    rent: { base: 12, house1: 60, house2: 180, house3: 500, house4: 700, hotel: 900, houseCost: 100 }
  },

  {
    id: "pennsylvania_railroad",
    name: "Pennsylvania Railroad",
    type: "railroad",
    colorGroup: "Railroad",
    purchasePrice: 200,
    mortgageValue: 100,
    rent: { base: 25, railroadOwned2: 50, railroadOwned3: 100, railroadOwned4: 200 }
  },

  {
    id: "st_james_place",
    name: "St. James Place",
    type: "street",
    colorGroup: "Orange",
    purchasePrice: 180,
    mortgageValue: 90,
    rent: { base: 14, house1: 70, house2: 200, house3: 550, house4: 750, hotel: 950, houseCost: 100 }
  },
  {
    id: "tennessee_avenue",
    name: "Tennessee Avenue",
    type: "street",
    colorGroup: "Orange",
    purchasePrice: 180,
    mortgageValue: 90,
    rent: { base: 14, house1: 70, house2: 200, house3: 550, house4: 750, hotel: 950, houseCost: 100 }
  },
  {
    id: "new_york_avenue",
    name: "New York Avenue",
    type: "street",
    colorGroup: "Orange",
    purchasePrice: 200,
    mortgageValue: 100,
    rent: { base: 16, house1: 80, house2: 220, house3: 600, house4: 800, hotel: 1000, houseCost: 100 }
  },

  {
    id: "b_and_o_railroad",
    name: "B. & O. Railroad",
    type: "railroad",
    colorGroup: "Railroad",
    purchasePrice: 200,
    mortgageValue: 100,
    rent: { base: 25, railroadOwned2: 50, railroadOwned3: 100, railroadOwned4: 200 }
  },

  {
    id: "kentucky_avenue",
    name: "Kentucky Avenue",
    type: "street",
    colorGroup: "Red",
    purchasePrice: 220,
    mortgageValue: 110,
    rent: { base: 18, house1: 90, house2: 250, house3: 700, house4: 875, hotel: 1050, houseCost: 150 }
  },
  {
    id: "indiana_avenue",
    name: "Indiana Avenue",
    type: "street",
    colorGroup: "Red",
    purchasePrice: 220,
    mortgageValue: 110,
    rent: { base: 18, house1: 90, house2: 250, house3: 700, house4: 875, hotel: 1050, houseCost: 150 }
  },
  {
    id: "illinois_avenue",
    name: "Illinois Avenue",
    type: "street",
    colorGroup: "Red",
    purchasePrice: 240,
    mortgageValue: 120,
    rent: { base: 20, house1: 100, house2: 300, house3: 750, house4: 925, hotel: 1100, houseCost: 150 }
  },

  {
    id: "atlantic_avenue",
    name: "Atlantic Avenue",
    type: "street",
    colorGroup: "Yellow",
    purchasePrice: 260,
    mortgageValue: 130,
    rent: { base: 22, house1: 110, house2: 330, house3: 800, house4: 975, hotel: 1150, houseCost: 150 }
  },
  {
    id: "ventnor_avenue",
    name: "Ventnor Avenue",
    type: "street",
    colorGroup: "Yellow",
    purchasePrice: 260,
    mortgageValue: 130,
    rent: { base: 22, house1: 110, house2: 330, house3: 800, house4: 975, hotel: 1150, houseCost: 150 }
  },
  {
    id: "water_works",
    name: "Water Works",
    type: "utility",
    colorGroup: "Utility",
    purchasePrice: 150,
    mortgageValue: 75,
    rent: { base: 0, utilityOneMultiplier: 4, utilityBothMultiplier: 10 }
  },
  {
    id: "marvin_gardens",
    name: "Marvin Gardens",
    type: "street",
    colorGroup: "Yellow",
    purchasePrice: 280,
    mortgageValue: 140,
    rent: { base: 24, house1: 120, house2: 360, house3: 850, house4: 1025, hotel: 1200, houseCost: 150 }
  },

  {
    id: "short_line",
    name: "Short Line",
    type: "railroad",
    colorGroup: "Railroad",
    purchasePrice: 200,
    mortgageValue: 100,
    rent: { base: 25, railroadOwned2: 50, railroadOwned3: 100, railroadOwned4: 200 }
  },

  {
    id: "pacific_avenue",
    name: "Pacific Avenue",
    type: "street",
    colorGroup: "Green",
    purchasePrice: 300,
    mortgageValue: 150,
    rent: { base: 26, house1: 130, house2: 390, house3: 900, house4: 1100, hotel: 1275, houseCost: 200 }
  },
  {
    id: "north_carolina_avenue",
    name: "North Carolina Avenue",
    type: "street",
    colorGroup: "Green",
    purchasePrice: 300,
    mortgageValue: 150,
    rent: { base: 26, house1: 130, house2: 390, house3: 900, house4: 1100, hotel: 1275, houseCost: 200 }
  },
  {
    id: "pennsylvania_avenue",
    name: "Pennsylvania Avenue",
    type: "street",
    colorGroup: "Green",
    purchasePrice: 320,
    mortgageValue: 160,
    rent: { base: 28, house1: 150, house2: 450, house3: 1000, house4: 1200, hotel: 1400, houseCost: 200 }
  },

  {
    id: "park_place",
    name: "Park Place",
    type: "street",
    colorGroup: "Dark Blue",
    purchasePrice: 350,
    mortgageValue: 175,
    rent: { base: 35, house1: 175, house2: 500, house3: 1100, house4: 1300, hotel: 1500, houseCost: 200 }
  },
  {
    id: "boardwalk",
    name: "Boardwalk",
    type: "street",
    colorGroup: "Dark Blue",
    purchasePrice: 400,
    mortgageValue: 200,
    rent: { base: 50, house1: 200, house2: 600, house3: 1400, house4: 1700, hotel: 2000, houseCost: 200 }
  }
];

export const COLOR_GROUP_ORDER = [
  "Brown",
  "Light Blue",
  "Pink",
  "Orange",
  "Red",
  "Yellow",
  "Green",
  "Dark Blue"
];

export const COLOR_GROUP_COLORS: Record<string, string> = {
  Brown: "#8b5a2b",
  "Light Blue": "#86d6ff",
  Pink: "#f472b6",
  Orange: "#fb923c",
  Red: "#ef4444",
  Yellow: "#facc15",
  Green: "#22c55e",
  "Dark Blue": "#1d4ed8",
  Railroad: "#6b7280",
  Utility: "#0ea5e9"
};

export const PLAYER_COLOR_OPTIONS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Pink", value: "#f43f5e" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Lime", value: "#84cc16" }
];
