// Core game types and interfaces

import type { BookCollection, BooksState } from '@/data/books'
import type { WardenSkinRarity, LoverSkinRarity } from '@/data/skinLedger'

export type { BookCollection, BooksState }

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

// Maps warden name → active skin key ('base' or e.g. 'RudraSkin2')
export type WardenActiveSkins = Record<string, string>

// Lover skins owned: keyed by lover base name (e.g. 'RavenFemale') → skin key → owned
export type LoverOwnedSkins = Record<string, Record<string, boolean>>
// Maps lover base name → active skin key ('base' or e.g. 'AgneyiSkin1')
export type LoverActiveSkins = Record<string, string>

/** User override for warden cosmetic skin rarity (purple / orange / red). */
export type WardenSkinRarityOverrides = Record<string, Record<string, WardenSkinRarity>>
/** Warden skin "star" level (1 = tier-1 only; each extra level doubles total after ledger-adjusted base). */
export type WardenSkinLevels = Record<string, Record<string, number>>
/** Lover skin color tier for collection / affinity / intimacy (purple or orange). */
export type LoverSkinRarities = Record<string, Record<string, LoverSkinRarity>>

/** Children marriage planner (Familiars → Children tab). */
export interface ChildPlannerEntry {
  id: string
  name: string
  totalAttributes: number
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
    level?: number
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
  /** Which of Temujin / Charlemagne / Josey / Erik are owned from Elder+ lord picks (see wardenOwnership). */
  lordTierRewardWardens?: string[]
  books: BooksState
  conclave: ConclaveState
  conclaveUpgrade: ConclaveUpgrade
  courtyard: CourtyardState
  wardenCounts: WardenCounts
  selectedWardens: SelectedWardens
  wardenSkins: WardenSkins
  wardenActiveSkins?: WardenActiveSkins
  wardenSkinLevels?: WardenSkinLevels
  wardenSkinRarityOverrides?: WardenSkinRarityOverrides
  loverOwnedSkins?: LoverOwnedSkins
  loverActiveSkins?: LoverActiveSkins
  loverSkinRarities?: LoverSkinRarities
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
  hasDionysus?: boolean
  hasMaya?: boolean
  hasEmber?: boolean
  hasAsh?: boolean
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
  // Familiars
  familiars: any
  /** Optional list for children marriage / ring planner */
  childrenPlannerEntries?: ChildPlannerEntry[]
}
