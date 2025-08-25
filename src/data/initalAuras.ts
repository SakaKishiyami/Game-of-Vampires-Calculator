// Auras - Comprehensive warden data structure

export const initialAuras = {
  // Wild Hunt Wardens
  wildHunt: {
    "Rudra": { current: 0, max: 12, type: "Strength Talent %", baseValue: 9, increment: 1 },
    "Woden": { current: 0, max: 12, type: "Allure Talent %", baseValue: 9, increment: 1 },
    "Artemis": { current: 0, max: 12, type: "Intellect Talent %", baseValue: 9, increment: 1 },
    "Finn": { current: 0, max: 12, type: "Spirit Talent %", baseValue: 9, increment: 1 }
  },
  // Monster Noir Wardens
  monsterNoir: {
    "Eddie": { current: 0, max: 12, type: "Strength Books %", baseValue: 9, increment: 1 },
    "Scarlet": { current: 0, max: 12, type: "Allure Books %", baseValue: 9, increment: 1 },
    "Sam": { current: 0, max: 12, type: "Intellect Books %", baseValue: 9, increment: 1 },
    "Grendel": { current: 0, max: 12, type: "Spirit Books %", baseValue: 9, increment: 1 }
  },
  // Bloody Tyrants Wardens
  bloodyTyrants: {
    "Cesare": { current: 0, max: 14, type: "Strength/Intellect Books %", baseValue: 10, increment: 1 },
    "Max": { current: 0, max: 14, type: "Strength/Spirit Books %", baseValue: 10, increment: 1 },
    "Erzsebet": { current: 0, max: 14, type: "Allure/Intellect Books %", baseValue: 10, increment: 1 },
    "Ivan": { current: 0, max: 14, type: "Allure/Spirit Books %", baseValue: 10, increment: 1 },
    "Maria": { current: 0, max: 7, type: "All Talent %", baseValue: 5, increment: 0.5 }
  },
  // Cirque du Macabre Wardens
  cirque: {
    "Thorgrim": { current: 0, max: 14, type: "Strength/Intellect Books %", baseValue: 10, increment: 1 },
    "Naja": { current: 0, max: 14, type: "Allure/Spirit Books %", baseValue: 10, increment: 1 },
    "Diavolo": { current: 0, max: 14, type: "Strength/Spirit Books %", baseValue: 10, increment: 1 },
    "Jester": { current: 0, max: 14, type: "Allure/Intellect Books %", baseValue: 10, increment: 1 },
    "Dominique": { current: 0, max: 7, type: "All Books %", baseValue: 5, increment: 0.5 }
  },
  // VIP Wardens
  vip: {
    "Tomas": { current: 0, max: 6, type: "Strength/Intellect Talent %", vipRequired: 1 },
    "Cleo": { current: 0, max: 6, type: "Allure/Spirit Talent %", vipRequired: 3 },
    "Aurelia": { current: 0, max: 6, type: "Strength/Spirit Talent %", vipRequired: 5 },
    "William": { current: 0, max: 6, type: "Allure/Intellect Talent %", vipRequired: 7 },
    "Poe": { 
      talents: { current: 0, max: 6, type: "All Talent %" },
      books: { current: 0, max: 6, type: "All Books %" },
      vipRequired: 9 
    },
    "Damian": { 
      talents: { current: 0, max: 8, type: "All Talent %" },
      books: { current: 0, max: 8, type: "All Books %" },
      vipRequired: 10 
    },
    "Vance": { 
      talents: { current: 0, max: 10, type: "All Talent %" },
      books: { current: 0, max: 10, type: "All Books %" },
      vipRequired: 11 
    },
    "Diana": { 
      talents: { current: 0, max: 12, type: "All Talent %" },
      books: { current: 0, max: 12, type: "All Books %" },
      vipRequired: 12 
    }
  },
  // Paid Pack Wardens
  paidPacks: {
    "Victor": { current: 0, max: 6, type: "Strength Talent %" },
    "Frederick": { 
      talents: { current: 0, max: 6, type: "Allure Talent %" },
      books: { current: 0, max: 20, type: "Allure Books %", baseValue: 0, increment: 1 }
    }
  },
  // Special Wardens
  special: {
    "Dracula": { 
      talents: { current: 0, max: 25, type: "All Talent %", baseValue: 0, increment: 1  },
      books: { current: 0, max: 25, type: "All Books %", baseValue: 0, increment: 1 }
    },
    "Nyx": { 
      talents: { current: 0, max: 35, type: "All Talent %", baseValue: 0, increment: 1 },
      books: { current: 0, max: 35, type: "All Books %", baseValue: 0, increment: 1 }
    }
  }
};