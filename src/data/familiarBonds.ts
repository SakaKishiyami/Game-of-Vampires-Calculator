export type FamiliarBondId =
  | 'Gym2'
  | 'Gym1'
  | 'Conclave'
  | 'Arena'
  | 'League'
  | 'Date'
  | 'Crystal'
  | 'Fishing'
  | "Lover'sLodge"
  | 'Workshop2'
  | 'Workshop1'
  | 'Well'
  | 'Mushroom'
  | 'DarkChasm'

export type FamiliarBondType = 'normal' | 'workshop'

export interface FamiliarBondDefinition {
  id: FamiliarBondId
  displayName: string
  assetFile: string
  type: FamiliarBondType
  // effects for levels 2..6 (level 1 gives nothing)
  effectsByLevel: Record<2 | 3 | 4 | 5 | 6, string>
}

const NORMAL_VALUES_BY_LEVEL: Record<2 | 3 | 4 | 5 | 6, number> = {
  2: 60,
  3: 90,
  4: 120,
  5: 150,
  6: 180,
}

const WORKSHOP_VALUES_BY_LEVEL: Record<2 | 3 | 4 | 5 | 6, number> = {
  2: 50,
  3: 80,
  4: 110,
  5: 140,
  6: 170,
}

export function getBondValue(def: FamiliarBondDefinition, level: number): number {
  if (level < 2) return 0
  const lvl = level as 2 | 3 | 4 | 5 | 6
  return def.type === 'workshop' ? WORKSHOP_VALUES_BY_LEVEL[lvl] : NORMAL_VALUES_BY_LEVEL[lvl]
}

export const familiarBondDefinitions: FamiliarBondDefinition[] = [
  {
    id: 'Gym2',
    displayName: 'Gym2',
    assetFile: 'Gym2.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Skill Points received by 10%',
      3: 'Increases Skill Points received by 20%',
      4: 'Increases Skill Points received by 30%',
      5: 'Increases Skill Points received by 40%',
      6: 'Increases Skill Points received by 50%',
    },
  },
  {
    id: 'Conclave',
    displayName: 'Conclave',
    assetFile: 'Conclave.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Assembly Points received by 2%',
      3: 'Increases Assembly Points received by 4%',
      4: 'Increases Assembly Points received by 6%',
      5: 'Increases Assembly Points received by 8%',
      6: 'Increases Assembly Points received by 10%',
    },
  },
  {
    id: 'Arena',
    displayName: 'Arena',
    assetFile: 'Arena.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Doublecard rewards for the first 1 Warden',
      3: 'Doublecard rewards for the first 2 Wardens',
      4: 'Doublecard rewards for the first 3 Wardens',
      5: 'Doublecard rewards for the first 4 Wardens',
      6: 'Doublecard rewards for the first 5 Wardens',
    },
  },
  {
    id: 'League',
    displayName: 'League',
    assetFile: 'League.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Prestige received by 50',
      3: 'Increases Prestige received by 100',
      4: 'Increases Prestige received by 150',
      5: 'Increases Prestige received by 200',
      6: 'Increases Prestige received by 250',
    },
  },
  {
    id: 'Date',
    displayName: 'Date',
    assetFile: 'Date.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Affinity Points received by 20%',
      3: 'Increases Affinity Points received by 40%',
      4: 'Increases Affinity Points received by 60%',
      5: 'Increases Affinity Points received by 80%',
      6: 'Increases Affinity Points received by 100%',
    },
  },
  {
    id: 'Crystal',
    displayName: 'Crystal',
    assetFile: 'Crystal.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Soul Crystal rewards: +10% Guild Wealth and Contribution',
      3: 'Soul Crystal rewards: +20% Guild Wealth and Contribution',
      4: 'Soul Crystal rewards: +30% Guild Wealth and Contribution',
      5: 'Soul Crystal rewards: +40% Guild Wealth and Contribution',
      6: 'Soul Crystal rewards: +50% Guild Wealth and Contribution',
    },
  },
  {
    id: 'Fishing',
    displayName: 'Fishing',
    assetFile: 'Fishing.png',
    type: 'normal',
    effectsByLevel: {
      2: 'First daily recovery for 1 Warden is free',
      3: 'First daily recovery for 2 Wardens is free',
      4: 'First daily recovery for 3 Wardens is free',
      5: 'First daily recovery for 4 Wardens is free',
      6: 'First daily recovery for 5 Wardens is free',
    },
  },
  {
    id: "Lover'sLodge",
    displayName: "Lover's Lodge",
    assetFile: "Lover'sLodge.png",
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Affinity Points received by 20%',
      3: 'Increases Affinity Points received by 40%',
      4: 'Increases Affinity Points received by 60%',
      5: 'Increases Affinity Points received by 80%',
      6: 'Increases Affinity Points received by 100%',
    },
  },
  {
    id: 'Workshop2',
    displayName: 'Workshop2',
    assetFile: 'Workshop2.png',
    type: 'workshop',
    effectsByLevel: {
      2: '20% chance: +100% Blood/Bats from Retort of Intimacy/Strength/Intellect/Talent',
      3: '40% chance: +100% Blood/Bats from Retort of Intimacy/Strength/Intellect/Talent',
      4: '60% chance: +100% Blood/Bats from Retort of Intimacy/Strength/Intellect/Talent',
      5: '80% chance: +100% Blood/Bats from Retort of Intimacy/Strength/Intellect/Talent',
      6: '100% chance: +100% Blood/Bats from Retort of Intimacy/Strength/Intellect/Talent',
    },
  },
  {
    id: 'Workshop1',
    displayName: 'Workshop1',
    assetFile: 'Workshop1.png',
    type: 'workshop',
    effectsByLevel: {
      2: '20% chance: +100% Blood/Bats from Retort of Chaos/Attraction/Allure/Spirit',
      3: '40% chance: +100% Blood/Bats from Retort of Chaos/Attraction/Allure/Spirit',
      4: '60% chance: +100% Blood/Bats from Retort of Chaos/Attraction/Allure/Spirit',
      5: '80% chance: +100% Blood/Bats from Retort of Chaos/Attraction/Allure/Spirit',
      6: '100% chance: +100% Blood/Bats from Retort of Chaos/Attraction/Allure/Spirit',
    },
  },
  {
    id: 'Gym1',
    displayName: 'Gym1',
    assetFile: 'Gym1.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Talent EXP received by 20%',
      3: 'Increases Talent EXP received by 40%',
      4: 'Increases Talent EXP received by 60%',
      5: 'Increases Talent EXP received by 80%',
      6: 'Increases Talent EXP received by 100%',
    },
  },
  {
    id: 'Well',
    displayName: 'Well',
    assetFile: 'Well.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Prestige received from Wells of Tears by 10%',
      3: 'Increases Prestige received from Wells of Tears by 20%',
      4: 'Increases Prestige received from Wells of Tears by 30%',
      5: 'Increases Prestige received from Wells of Tears by 40%',
      6: 'Increases Prestige received from Wells of Tears by 50%',
    },
  },
  {
    id: 'Mushroom',
    displayName: 'Mushroom',
    assetFile: 'Mushroom.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases Talent EXP received from corpseshrooms by 10%',
      3: 'Increases Talent EXP received from corpseshrooms by 20%',
      4: 'Increases Talent EXP received from corpseshrooms by 30%',
      5: 'Increases Talent EXP received from corpseshrooms by 40%',
      6: 'Increases Talent EXP received from corpseshrooms by 50%',
    },
  },
  {
    id: 'DarkChasm',
    displayName: 'Dark Chasm',
    assetFile: 'DarkChasm.png',
    type: 'normal',
    effectsByLevel: {
      2: 'Increases dark lake coins received by 10%',
      3: 'Increases dark lake coins received by 20%',
      4: 'Increases dark lake coins received by 30%',
      5: 'Increases dark lake coins received by 40%',
      6: 'Increases dark lake coins received by 50%',
    },
  },
]

