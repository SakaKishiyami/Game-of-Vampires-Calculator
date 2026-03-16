// Core game types and interfaces

export type Attribute = 'strength' | 'allure' | 'intellect' | 'spirit'
export type AttributeOrder = Attribute[]

export interface BaseAttributes {
  strength: number
  allure: number
  intellect: number
  spirit: number
}

export interface ConclaveState {
  "Seal of Strength": number
  "Seal of Allure": number
  "Seal of Intellect": number
  "Seal of Spirit": number
}

export interface ConclaveUpgrade {
  savedSeals: number
  upgradeSeals: {
    "Seal of Strength": boolean
    "Seal of Allure": boolean
    "Seal of Intellect": boolean
    "Seal of Spirit": boolean
  }
}

export interface CourtyardState {
  currentLevel: number
  currentPoints: number
}

export interface WardenCounts {
  circus: number
  tyrants: number
  noir: number
  hunt: number
}

export interface SelectedWardens {
  circus: string[]
  tyrants: string[]
  noir: string[]
  hunt: string[]
}

export interface WardenSkins {
  [wardenName: string]: {
    [skinName: string]: boolean
  }
}

export interface Warden {
  name: string
  group: string
  attributes: string[]
  tier: number
  skins: string[]
}

export interface WardenStats {
  [wardenName: string]: {
    strength?: number
    allure?: number
    intellect?: number
    spirit?: number
  }
}

export interface UploadedWardenData {
  [wardenName: string]: {
    totalAttributes: number
    strength: AttributeBreakdown
    allure: AttributeBreakdown
    intellect: AttributeBreakdown
    spirit: AttributeBreakdown
  }
}

export interface AttributeBreakdown {
  total: number
  talentBonus: number
  bookBonus: number
  scarletBondBonus: number
  presenceBonus: number
  auraBonus: number
  conclaveBonus: number
  avatarBonus: number
  familiarBonus: number
}

export interface InventoryItem {
  count: number
  lastUpdated: string
  imageUrl?: string
}

export interface Inventory {
  [itemName: string]: InventoryItem
}

export interface InventoryImages {
  [itemName: string]: string
}

export interface ScarletBondLevel {
  [key: string]: {
    strengthLevel?: number
    strengthPercent?: number
    allureLevel?: number
    allurePercent?: number
    intellectLevel?: number
    intellectPercent?: number
    spiritLevel?: number
    spiritPercent?: number
  }
}

export interface ScarletBondAffinity {
  [bondKey: string]: number
}

export interface DomIncreasePerStar {
  domIncreasePerStarData: any
  currentStrengthStars: number
  currentAllureStars: number
  currentIntellectStars: number
  currentSpiritStars: number
  currentTotalStars: number
  currentTotalDomGain: number
  currentTotalStrengthDomGain: number
  currentTotalAllureDomGain: number
  currentTotalIntellectDomGain: number
  currentTotalSpiritDomGain: number
  newStrengthStars: number
  newAllureStars: number
  newIntellectStars: number
  newSpiritStars: number
  newTotalStars: number
  newTotalDomGain: number
  newTotalStrengthDomGain: number
  newTotalAllureDomGain: number
  newTotalIntellectDomGain: number
  newTotalSpiritDomGain: number
}

// Game Calculator State (for export/import)
export interface GameCalculatorState {
  version: string
  baseAttributes: BaseAttributes
  vipLevel: number
  lordLevel: string
  books: any // BooksState from books.ts
  conclave: ConclaveState
  conclaveUpgrade: ConclaveUpgrade
  courtyard: CourtyardState
  wardenCounts: WardenCounts
  selectedWardens: SelectedWardens
  wardenSkins: WardenSkins
  wardenStats: WardenStats
  uploadedWardenData: UploadedWardenData
  inventory: Inventory
  inventoryImages: InventoryImages
  scarletBond: ScarletBondLevel
  scarletBondAffinity: ScarletBondAffinity
  optimizedBondLevels: ScarletBondLevel
  domIncreasePerStar: DomIncreasePerStar
  // Special wardens
  hasNyx: boolean
  hasDracula: boolean
  hasVictor: boolean
  hasFrederick: boolean
  // Lovers
  hasAgneyi: boolean
  hasCulann: boolean
  hasHela: boolean
  // Summonable characters
  hasFrances: boolean
  hasRaven: boolean
  hasMary: boolean
  hasInanna: boolean
  hasOtchigon: boolean
  hasSkylar: boolean
  hasBess: boolean
  hasRoxana: boolean
  hasAisha: boolean
  hasAntonia: boolean
  hasGabrielle: boolean
  hasMairi: boolean
  hasAretha: boolean
  hasRegina: boolean
  hasAva: boolean
  hasAlexis: boolean
  hasElaine: boolean
  hasSuria: boolean
  hasCordelia: boolean
  hasHanna: boolean
  hasElizabeth: boolean
  hasMichelle: boolean
  hasHarriet: boolean
  hasJohanna: boolean
  hasLucy: boolean
  hasRuna: boolean
  // Auras state (complex, will be typed properly when extracted)
  auras: any
  // Talent scrolls and scripts
  talentScrolls: any
  talentScripts: any
}
