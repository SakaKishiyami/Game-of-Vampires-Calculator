// Auras - Comprehensive warden data structure

export const initialAuras = {
  // Wild Hunt Wardens - levels are dynamic based on selected wardens
  wildHunt: {
    "Rudra": { current: 0, max: 12, type: "Strength Talent %", baseValue: 1, increment: 1 },
    "Woden": { current: 0, max: 12, type: "Allure Talent %", baseValue: 1, increment: 1 },
    "Artemis": { current: 0, max: 12, type: "Intellect Talent %", baseValue: 1, increment: 1 },
    "Finn": { current: 0, max: 12, type: "Spirit Talent %", baseValue: 1, increment: 1 }
  },
  // Monster Noir Wardens - levels are dynamic based on selected wardens
  monsterNoir: {
    "Eddie": { current: 0, max: 12, type: "Strength Books %", baseValue: 1, increment: 1 },
    "Scarlet": { current: 0, max: 12, type: "Allure Books %", baseValue: 1, increment: 1 },
    "Sam": { current: 0, max: 12, type: "Intellect Books %", baseValue: 1, increment: 1 },
    "Grendel": { current: 0, max: 12, type: "Spirit Books %", baseValue: 1, increment: 1 }
  },
  // Bloody Tyrants Wardens - levels are dynamic based on selected wardens
  bloodyTyrants: {
    "Cesare": { current: 0, max: 14, type: "Strength/Intellect Books %", baseValue: 1, increment: 1 },
    "Max": { current: 0, max: 14, type: "Strength/Spirit Books %", baseValue: 1, increment: 1 },
    "Erzsebet": { current: 0, max: 14, type: "Allure/Intellect Books %", baseValue: 1, increment: 1 },
    "Ivan": { current: 0, max: 14, type: "Allure/Spirit Books %", baseValue: 1, increment: 1 },
    "Maria": { current: 0, max: 7, type: "All Talent %", baseValue: 0.5, increment: 0.5 }
  },
  // Cirque du Macabre Wardens - levels are dynamic based on selected wardens
  cirque: {
    "Thorgrim": { current: 0, max: 14, type: "Strength/Intellect Books %", baseValue: 1, increment: 1 },
    "Naja": { current: 0, max: 14, type: "Allure/Spirit Books %", baseValue: 1, increment: 1 },
    "Diavolo": { current: 0, max: 14, type: "Strength/Spirit Books %", baseValue: 1, increment: 1 },
    "Jester": { current: 0, max: 14, type: "Allure/Intellect Books %", baseValue: 1, increment: 1 },
    "Dominique": { current: 0, max: 7, type: "All Books %", baseValue: 0.5, increment: 0.5 }
  },
  // Secondary Auras - upgradeable skills (0-20 levels, 1% per level, 0.5% for Maria/Dominique)
  secondaryAuras: {
    wildHunt: {
      "Rudra": { current: 0, max: 20, type: "Strength Talent %", baseValue: 0, increment: 1 },
      "Woden": { current: 0, max: 20, type: "Allure Talent %", baseValue: 0, increment: 1 },
      "Artemis": { current: 0, max: 20, type: "Intellect Talent %", baseValue: 0, increment: 1 },
      "Finn": { current: 0, max: 20, type: "Spirit Talent %", baseValue: 0, increment: 1 }
    },
    monsterNoir: {
      "Eddie": { current: 0, max: 20, type: "Strength Books %", baseValue: 0, increment: 1 },
      "Scarlet": { current: 0, max: 20, type: "Allure Books %", baseValue: 0, increment: 1 },
      "Sam": { current: 0, max: 20, type: "Intellect Books %", baseValue: 0, increment: 1 },
      "Grendel": { current: 0, max: 20, type: "Spirit Books %", baseValue: 0, increment: 1 }
    },
    bloodyTyrants: {
      "Cesare": { current: 0, max: 20, type: "Strength/Intellect Books %", baseValue: 0, increment: 1 },
      "Max": { current: 0, max: 20, type: "Strength/Spirit Books %", baseValue: 0, increment: 1 },
      "Erzsebet": { current: 0, max: 20, type: "Allure/Intellect Books %", baseValue: 0, increment: 1 },
      "Ivan": { current: 0, max: 20, type: "Allure/Spirit Books %", baseValue: 0, increment: 1 },
      "Maria": { current: 0, max: 20, type: "All Talent %", baseValue: 0, increment: 0.5 }
    },
    cirque: {
      "Thorgrim": { current: 0, max: 20, type: "Strength/Intellect Books %", baseValue: 0, increment: 1 },
      "Naja": { current: 0, max: 20, type: "Allure/Spirit Books %", baseValue: 0, increment: 1 },
      "Diavolo": { current: 0, max: 20, type: "Strength/Spirit Books %", baseValue: 0, increment: 1 },
      "Jester": { current: 0, max: 20, type: "Allure/Intellect Books %", baseValue: 0, increment: 1 },
      "Dominique": { current: 0, max: 20, type: "All Books %", baseValue: 0, increment: 0.5 }
    }
  },
  // Lovers - special aura system (20% base, +5% for each additional, 30% for all 3)
  // These increase ALL lover scarlet bond bonuses for their respective attribute by x%
  lovers: {
    "Agneyi": { current: 0, max: 30, type: "Strength Scarlet Bond %", baseValue: 20, increment: 5 },
    "Culann": { current: 0, max: 30, type: "Intellect Scarlet Bond %", baseValue: 20, increment: 5 },
    "Hela": { current: 0, max: 30, type: "Spirit Scarlet Bond %", baseValue: 20, increment: 5 }
  },
  // VIP Wardens
  vip: {
    "Tomas": { current: 6, max: 6, type: "Strength/Intellect Talent %", vipRequired: 1 },
    "Cleo": { current: 6, max: 6, type: "All Talent %", vipRequired: 3 },
    "Aurelia": { current: 6, max: 6, type: "Strength/Spirit Talent %", vipRequired: 5 },
    "William": { current: 6, max: 6, type: "Allure/Intellect Talent %", vipRequired: 7 },
    "Poe": { 
      talents: { current: 6, max: 6, type: "All Talent %" },
      books: { current: 6, max: 6, type: "All Books %" },
      vipRequired: 9 
    },
    "Damian": { 
      talents: { current: 8, max: 8, type: "All Talent %" },
      books: { current: 8, max: 8, type: "All Books %" },
      vipRequired: 10 
    },
    "Vance": { 
      talents: { current: 10, max: 10, type: "All Talent %" },
      books: { current: 10, max: 10, type: "All Books %" },
      vipRequired: 11 
    },
    "Diana": { 
      talents: { current: 12, max: 12, type: "All Talent %" },
      books: { current: 12, max: 12, type: "All Books %" },
      vipRequired: 12 
    }
  },
  // Paid Pack Wardens
  paidPacks: {
    "Victor": { current: 6, max: 6, type: "Strength Talent %" },
    "Frederick": { 
      talents: { current: 6, max: 6, type: "Allure Talent %" },
      books: { current: 1, max: 20, type: "Allure Books %", baseValue: 1, increment: 1 }
    }
  },
  // Special Wardens
  special: {
    "Dracula": { 
      talents: { current: 25, max: 25, type: "All Talent %" },
      books: { current: 25, max: 25, type: "All Books %" }
    },
    "Nyx": { 
      talents: { current: 35, max: 35, type: "All Talent %" },
      books: { current: 35, max: 35, type: "All Books %" }
    }
  }
};