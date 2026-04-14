export type TalentAttr = 'strength' | 'allure' | 'intellect' | 'spirit'

export type WardenTalentProfile = {
  name: string
  mainStat: 'Balance' | 'Strength' | 'Allure' | 'Intellect' | 'Spirit'
  offStat?: 'Strength' | 'Allure' | 'Intellect' | 'Spirit'
  baseStars: Record<TalentAttr, number>
}

/** Level caps by awakening tier (from user spec). */
export function talentCapFromWardenLevel(level: number): number {
  if (level >= 400) return 320
  if (level >= 350) return 280
  if (level >= 300) return 240
  if (level >= 250) return 200
  if (level >= 200) return 160
  if (level >= 150) return 120
  if (level >= 100) return 80
  return 40
}

/** Level-1 star totals per attribute from the provided sheet. */
export const WARDEN_TALENT_PROFILES: Record<string, WardenTalentProfile> = {
  // 8 talents per type: (5 x 6★) + (3 x 5★) = 45 stars per attribute, total 180 stars.
  // Base talent total at level 10 (sum across attributes) = 1,800.
  Thanatos: { name: 'Thanatos', mainStat: 'Balance', baseStars: { strength: 45, allure: 45, intellect: 45, spirit: 45 } },
  // 10 talents per type: (5 x 6★) + (5 x 5★) = 55 stars per attribute, total 220 stars.
  // Base talent total at level 10 (sum across attributes) = 2,200.
  Mara: { name: 'Mara', mainStat: 'Balance', baseStars: { strength: 55, allure: 55, intellect: 55, spirit: 55 } },
  Diana: { name: 'Diana', mainStat: 'Balance', baseStars: { strength: 35, allure: 35, intellect: 35, spirit: 35 } },
  Vance: { name: 'Vance', mainStat: 'Balance', baseStars: { strength: 30, allure: 30, intellect: 30, spirit: 30 } },
  Damian: { name: 'Damian', mainStat: 'Balance', baseStars: { strength: 25, allure: 25, intellect: 25, spirit: 25 } },
  Poe: { name: 'Poe', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 18, allure: 12, intellect: 18, spirit: 12 } },
  Nyx: { name: 'Nyx', mainStat: 'Balance', baseStars: { strength: 9, allure: 9, intellect: 9, spirit: 9 } },
  Diavolo: { name: 'Diavolo', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 10, allure: 6, intellect: 6, spirit: 10 } },
  Thorgrim: { name: 'Thorgrim', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 10, allure: 6, intellect: 10, spirit: 6 } },
  Cesare: { name: 'Cesare', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 10, allure: 6, intellect: 10, spirit: 6 } },
  Max: { name: 'Max', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 10, allure: 6, intellect: 6, spirit: 10 } },
  Dominique: { name: 'Dominique', mainStat: 'Balance', baseStars: { strength: 8, allure: 8, intellect: 8, spirit: 8 } },
  Maria: { name: 'Maria', mainStat: 'Balance', baseStars: { strength: 8, allure: 8, intellect: 8, spirit: 8 } },
  Jester: { name: 'Jester', mainStat: 'Allure', offStat: 'Intellect', baseStars: { strength: 6, allure: 10, intellect: 10, spirit: 6 } },
  Naja: { name: 'Naja', mainStat: 'Allure', offStat: 'Spirit', baseStars: { strength: 6, allure: 10, intellect: 6, spirit: 10 } },
  Erzsebet: { name: 'Erzsebet', mainStat: 'Allure', offStat: 'Intellect', baseStars: { strength: 6, allure: 10, intellect: 10, spirit: 6 } },
  Ivan: { name: 'Ivan', mainStat: 'Allure', offStat: 'Spirit', baseStars: { strength: 6, allure: 10, intellect: 6, spirit: 10 } },
  William: { name: 'William', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 13, allure: 3, intellect: 2, spirit: 12 } },
  Aurelia: { name: 'Aurelia', mainStat: 'Allure', offStat: 'Strength', baseStars: { strength: 11, allure: 11, intellect: 3, spirit: 3 } },
  Dracula: { name: 'Dracula', mainStat: 'Balance', baseStars: { strength: 7, allure: 7, intellect: 7, spirit: 7 } },
  Tomas: { name: 'Tomas', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 9, allure: 3, intellect: 9, spirit: 3 } },
  Victor: { name: 'Victor', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 9, allure: 3, intellect: 3, spirit: 9 } },
  Cleo: { name: 'Cleo', mainStat: 'Balance', baseStars: { strength: 6, allure: 6, intellect: 6, spirit: 6 } },
  Eddie: { name: 'Eddie', mainStat: 'Strength', baseStars: { strength: 9, allure: 4, intellect: 4, spirit: 5 } },
  Rudra: { name: 'Rudra', mainStat: 'Strength', baseStars: { strength: 9, allure: 3, intellect: 5, spirit: 5 } },
  Grendel: { name: 'Grendel', mainStat: 'Spirit', baseStars: { strength: 5, allure: 3, intellect: 5, spirit: 9 } },
  Scarlet: { name: 'Scarlet', mainStat: 'Allure', baseStars: { strength: 4, allure: 9, intellect: 5, spirit: 4 } },
  Gilgamesh: { name: 'Gilgamesh', mainStat: 'Allure', offStat: 'Intellect', baseStars: { strength: 4, allure: 7, intellect: 7, spirit: 4 } },
  Artemis: { name: 'Artemis', mainStat: 'Intellect', baseStars: { strength: 4, allure: 5, intellect: 9, spirit: 4 } },
  Finn: { name: 'Finn', mainStat: 'Spirit', baseStars: { strength: 4, allure: 4, intellect: 5, spirit: 9 } },
  Woden: { name: 'Woden', mainStat: 'Allure', baseStars: { strength: 3, allure: 9, intellect: 5, spirit: 5 } },
  Sam: { name: 'Sam', mainStat: 'Intellect', baseStars: { strength: 3, allure: 5, intellect: 9, spirit: 5 } },
  Temujin: { name: 'Temujin', mainStat: 'Allure', offStat: 'Strength', baseStars: { strength: 7, allure: 7, intellect: 3, spirit: 3 } },
  Josey: { name: 'Josey', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 7, allure: 3, intellect: 7, spirit: 3 } },
  Mike: { name: 'Mike', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 7, allure: 3, intellect: 7, spirit: 3 } },
  Erik: { name: 'Erik', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 7, allure: 3, intellect: 3, spirit: 7 } },
  Candace: { name: 'Candace', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 6, allure: 3, intellect: 8, spirit: 3 } },
  Frederick: { name: 'Frederick', mainStat: 'Allure', baseStars: { strength: 5, allure: 8, intellect: 3, spirit: 4 } },
  Charlemagne: { name: 'Charlemagne', mainStat: 'Balance', baseStars: { strength: 5, allure: 5, intellect: 5, spirit: 5 } },
  Vicente: { name: 'Vicente', mainStat: 'Spirit', offStat: 'Strength', baseStars: { strength: 7, allure: 2, intellect: 2, spirit: 7 } },
  Alastair: { name: 'Alastair', mainStat: 'Spirit', baseStars: { strength: 3, allure: 2, intellect: 3, spirit: 10 } },
  Harker: { name: 'Harker', mainStat: 'Strength', baseStars: { strength: 9, allure: 3, intellect: 1, spirit: 3 } },
  Morien: { name: 'Morien', mainStat: 'Strength', baseStars: { strength: 9, allure: 2, intellect: 2, spirit: 3 } },
  Pavan: { name: 'Pavan', mainStat: 'Strength', baseStars: { strength: 8, allure: 3, intellect: 1, spirit: 4 } },
  Cornelius: { name: 'Cornelius', mainStat: 'Strength', baseStars: { strength: 8, allure: 2, intellect: 2, spirit: 4 } },
  Carmilla: { name: 'Carmilla', mainStat: 'Balance', baseStars: { strength: 4, allure: 4, intellect: 4, spirit: 4 } },
  Piper: { name: 'Piper', mainStat: 'Spirit', baseStars: { strength: 3, allure: 2, intellect: 3, spirit: 8 } },
  John: { name: 'John', mainStat: 'Spirit', baseStars: { strength: 3, allure: 2, intellect: 2, spirit: 9 } },
  Julie: { name: 'Julie', mainStat: 'Allure', offStat: 'Intellect', baseStars: { strength: 2, allure: 6, intellect: 6, spirit: 2 } },
  Elsie: { name: 'Elsie', mainStat: 'Allure', offStat: 'Spirit', baseStars: { strength: 2, allure: 6, intellect: 2, spirit: 6 } },
  Robert: { name: 'Robert', mainStat: 'Allure', offStat: 'Spirit', baseStars: { strength: 2, allure: 6, intellect: 2, spirit: 6 } },
  Lorenzo: { name: 'Lorenzo', mainStat: 'Intellect', baseStars: { strength: 2, allure: 4, intellect: 8, spirit: 2 } },
  Nostradamus: { name: 'Nostradamus', mainStat: 'Intellect', baseStars: { strength: 2, allure: 3, intellect: 8, spirit: 3 } },
  Hans: { name: 'Hans', mainStat: 'Spirit', baseStars: { strength: 2, allure: 2, intellect: 3, spirit: 9 } },
  Franco: { name: 'Franco', mainStat: 'Allure', baseStars: { strength: 1, allure: 9, intellect: 3, spirit: 3 } },
  Rollo: { name: 'Rollo', mainStat: 'Allure', baseStars: { strength: 2, allure: 6, intellect: 2, spirit: 2 } },
  Asra: { name: 'Asra', mainStat: 'Allure', offStat: 'Intellect', baseStars: { strength: 1, allure: 5, intellect: 5, spirit: 1 } },
  Ulfred: { name: 'Ulfred', mainStat: 'Strength', baseStars: { strength: 6, allure: 1, intellect: 2, spirit: 1 } },
  Saber: { name: 'Saber', mainStat: 'Strength', baseStars: { strength: 5, allure: 2, intellect: 1, spirit: 2 } },
  Nikolai: { name: 'Nikolai', mainStat: 'Intellect', offStat: 'Strength', baseStars: { strength: 4, allure: 1, intellect: 4, spirit: 1 } },
  Mortimer: { name: 'Mortimer', mainStat: 'Balance', baseStars: { strength: 3, allure: 3, intellect: 2, spirit: 2 } },
  Drusilla: { name: 'Drusilla', mainStat: 'Allure', baseStars: { strength: 2, allure: 4, intellect: 2, spirit: 2 } },
  Edward: { name: 'Edward', mainStat: 'Intellect', baseStars: { strength: 2, allure: 2, intellect: 5, spirit: 1 } },
}
