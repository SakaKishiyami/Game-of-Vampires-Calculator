"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { initialBooks, type BooksState } from '@/data/books'
import { createInitialFamiliarsState, type FamiliarsState } from '@/data/familiars'
import { initialAuras } from '@/data/auras'
import { domIncreasePerStarData } from '@/data/talent_stars'
import { wardenGroups, wardenAttributes } from '@/data/wardens'
import { scarletBondData, scarletBondLevels, getOffSingle, getOffAffinity } from '@/data/scarletBonds'
import { courtyardLevels } from '@/data/courtyard'
import { conclaveLevels } from '@/data/conclave'
import { bookBonuses } from '@/data/books'
import { calculateDynamicAuraLevels, calculateAuraBonuses } from '@/utils/calculators/auraCalculations'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier } from '@/utils/loverScarletBondAuras'
import { calculateTotalConclaveBonus, calculateConclaveUpgrades } from '@/utils/calculators/conclaveCalculations'
import { calculateCourtyardDom } from '@/utils/calculators/courtyardCalculations'
import { formatItemName, getItemCategory, getItemsByCategory, groupItemsByType, renderStars, getDisplayValue } from '@/utils/helpers'
import type {
  BaseAttributes,
  ConclaveState,
  ConclaveUpgrade,
  CourtyardState,
  WardenCounts,
  SelectedWardens,
  WardenSkins,
  WardenStats,
  UploadedWardenData,
  Inventory,
  InventoryImages,
  ScarletBondLevel,
  ScarletBondAffinity,
  DomIncreasePerStar,
  GameCalculatorState,
} from '@/types'

interface GameCalculatorContextType {
  // Base state
  baseAttributes: BaseAttributes
  setBaseAttributes: React.Dispatch<React.SetStateAction<BaseAttributes>>
  vipLevel: number
  setVipLevel: React.Dispatch<React.SetStateAction<number>>
  lordLevel: string
  setLordLevel: React.Dispatch<React.SetStateAction<string>>
  
  // Books
  books: BooksState
  setBooks: React.Dispatch<React.SetStateAction<BooksState>>
  
  // Conclave
  conclave: ConclaveState
  setConclave: React.Dispatch<React.SetStateAction<ConclaveState>>
  conclaveUpgrade: ConclaveUpgrade
  setConclaveUpgrade: React.Dispatch<React.SetStateAction<ConclaveUpgrade>>
  
  // Courtyard
  courtyard: CourtyardState
  setCourtyard: React.Dispatch<React.SetStateAction<CourtyardState>>
  
  // Wardens
  wardenCounts: WardenCounts
  setWardenCounts: React.Dispatch<React.SetStateAction<WardenCounts>>
  selectedWardens: SelectedWardens
  setSelectedWardens: React.Dispatch<React.SetStateAction<SelectedWardens>>
  wardenSkins: WardenSkins
  setWardenSkins: React.Dispatch<React.SetStateAction<WardenSkins>>
  wardenStats: WardenStats
  setWardenStats: React.Dispatch<React.SetStateAction<WardenStats>>
  uploadedWardenData: UploadedWardenData
  setUploadedWardenData: React.Dispatch<React.SetStateAction<UploadedWardenData>>
  
  // Special Wardens
  hasNyx: boolean
  setHasNyx: React.Dispatch<React.SetStateAction<boolean>>
  hasDracula: boolean
  setHasDracula: React.Dispatch<React.SetStateAction<boolean>>
  hasVictor: boolean
  setHasVictor: React.Dispatch<React.SetStateAction<boolean>>
  hasFrederick: boolean
  setHasFrederick: React.Dispatch<React.SetStateAction<boolean>>
  
  // Lovers
  hasAgneyi: boolean
  setHasAgneyi: React.Dispatch<React.SetStateAction<boolean>>
  hasCulann: boolean
  setHasCulann: React.Dispatch<React.SetStateAction<boolean>>
  hasHela: boolean
  setHasHela: React.Dispatch<React.SetStateAction<boolean>>
  hasDionysus: boolean
  setHasDionysus: React.Dispatch<React.SetStateAction<boolean>>
  hasMaya: boolean
  setHasMaya: React.Dispatch<React.SetStateAction<boolean>>
  hasEmber: boolean
  setHasEmber: React.Dispatch<React.SetStateAction<boolean>>
  hasAsh: boolean
  setHasAsh: React.Dispatch<React.SetStateAction<boolean>>
  
  // Summonable characters (simplified - can expand later)
  summonableCharacters: { [key: string]: boolean }
  setSummonableCharacter: (name: string, value: boolean) => void
  
  // Familiars
  familiars: FamiliarsState
  setFamiliars: React.Dispatch<React.SetStateAction<FamiliarsState>>
  
  // Inventory
  inventory: Inventory
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>
  inventoryImages: InventoryImages
  setInventoryImages: React.Dispatch<React.SetStateAction<InventoryImages>>
  
  // Scarlet Bond
  scarletBond: ScarletBondLevel
  setScarletBond: React.Dispatch<React.SetStateAction<ScarletBondLevel>>
  scarletBondAffinity: ScarletBondAffinity
  setScarletBondAffinity: React.Dispatch<React.SetStateAction<ScarletBondAffinity>>
  optimizedBondLevels: ScarletBondLevel
  setOptimizedBondLevels: React.Dispatch<React.SetStateAction<ScarletBondLevel>>
  
  // Talents
  domIncreasePerStar: DomIncreasePerStar
  setDomIncreasePerStar: React.Dispatch<React.SetStateAction<DomIncreasePerStar>>
  
  // Auras
  auras: any
  setAuras: React.Dispatch<React.SetStateAction<any>>
  
  // Talent Scrolls and Scripts
  talentScrolls: any
  setTalentScrolls: React.Dispatch<React.SetStateAction<any>>
  talentScripts: any
  setTalentScripts: React.Dispatch<React.SetStateAction<any>>
  
  // Export/Import
  exportGameData: () => void
  getExportState: () => Partial<GameCalculatorState>
  importGameData: (data: Partial<GameCalculatorState>) => void
  
  // Helper functions
  syncBooksToInventory: (category: string, bookName: string, count: number) => void
  syncTalentsToInventory: (talentKey: string, count: number) => void
  updateInventoryItem: (itemName: string, count: number) => void
  handleWardenSelection: (group: string, warden: string) => void
  handleSkinToggle: (wardenName: string, skinName: string) => void
  formatItemName: (fileName: string) => string
  getItemCategory: (itemName: string) => string
  getItemsByCategory: (category: string) => string[]
  groupItemsByType: (items: string[]) => Record<string, string[]>
  renderStars: (tier: number) => React.ReactNode
  handleInventoryImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  removeInventoryItem: (itemName: string) => void
  getAllSelectedWardens: () => any[]
  
  // Talents
  talents: any
  setTalents: React.Dispatch<React.SetStateAction<any>>
  
  // UI States
  activeWardenTab: string
  setActiveWardenTab: React.Dispatch<React.SetStateAction<string>>
  isUploading: boolean
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  uploadError: string | null
  setUploadError: React.Dispatch<React.SetStateAction<string | null>>
  ocrProgress: string
  setOcrProgress: React.Dispatch<React.SetStateAction<string>>
  isProcessingInventory: boolean
  setIsProcessingInventory: React.Dispatch<React.SetStateAction<boolean>>
  inventoryProgress: string
  setInventoryProgress: React.Dispatch<React.SetStateAction<string>>
  inventoryError: string | null
  setInventoryError: React.Dispatch<React.SetStateAction<string | null>>
  
  // Calculation results (computed)
  totals: any
  optimizedBonuses: any
  currentScarletBondBonuses: any
  suggestedIncrease: any
  dynamicAuras: any
  auraBonuses: any
}

const GameCalculatorContext = createContext<GameCalculatorContextType | undefined>(undefined)

export function GameCalculatorProvider({ children }: { children: ReactNode }) {
  // Base attributes
  const [baseAttributes, setBaseAttributes] = useState<BaseAttributes>({
    strength: 0,
    allure: 0,
    intellect: 0,
    spirit: 0,
  })

  const [vipLevel, setVipLevel] = useState(0)
  const [lordLevel, setLordLevel] = useState("Fledgling 1")
  const [books, setBooks] = useState<BooksState>(initialBooks)

  // Conclave
  const [conclave, setConclave] = useState<ConclaveState>({
    "Seal of Strength": 0,
    "Seal of Allure": 0,
    "Seal of Intellect": 0,
    "Seal of Spirit": 0,
  })

  const [conclaveUpgrade, setConclaveUpgrade] = useState<ConclaveUpgrade>({
    savedSeals: 0,
    upgradeSeals: {
      "Seal of Strength": true,
      "Seal of Allure": true,
      "Seal of Intellect": true,
      "Seal of Spirit": true,
    }
  })

  // Courtyard
  const [courtyard, setCourtyard] = useState<CourtyardState>({
    currentLevel: 1,
    currentPoints: 0,
  })

  // Wardens
  const [wardenCounts, setWardenCounts] = useState<WardenCounts>({
    circus: 0,
    tyrants: 0,
    noir: 0,
    hunt: 0,
  })

  const [selectedWardens, setSelectedWardens] = useState<SelectedWardens>({
    circus: [],
    tyrants: [],
    noir: [],
    hunt: [],
  })

  const [wardenSkins, setWardenSkins] = useState<WardenSkins>({})
  const [wardenStats, setWardenStats] = useState<WardenStats>({})
  const [uploadedWardenData, setUploadedWardenData] = useState<UploadedWardenData>({})

  // Special Wardens
  const [hasNyx, setHasNyx] = useState(false)
  const [hasDracula, setHasDracula] = useState(false)
  const [hasVictor, setHasVictor] = useState(false)
  const [hasFrederick, setHasFrederick] = useState(false)

  // Lovers
  const [hasAgneyi, setHasAgneyi] = useState(false)
  const [hasCulann, setHasCulann] = useState(false)
  const [hasHela, setHasHela] = useState(false)
  const [hasDionysus, setHasDionysus] = useState(false)
  const [hasMaya, setHasMaya] = useState(false)
  const [hasEmber, setHasEmber] = useState(false)
  const [hasAsh, setHasAsh] = useState(false)

  // Summonable characters
  const [summonableCharacters, setSummonableCharacters] = useState<{ [key: string]: boolean }>({})
  const setSummonableCharacter = useCallback((name: string, value: boolean) => {
    setSummonableCharacters(prev => ({ ...prev, [name]: value }))
  }, [])

  // Inventory
  const [familiars, setFamiliars] = useState<FamiliarsState>(createInitialFamiliarsState())
  const [inventory, setInventory] = useState<Inventory>({})
  const [inventoryImages, setInventoryImages] = useState<InventoryImages>({})

  // Scarlet Bond
  const [scarletBond, setScarletBond] = useState<ScarletBondLevel>({})
  const [scarletBondAffinity, setScarletBondAffinity] = useState<ScarletBondAffinity>({})
  const [optimizedBondLevels, setOptimizedBondLevels] = useState<ScarletBondLevel>({})

  // Talents
  const [domIncreasePerStar, setDomIncreasePerStar] = useState<DomIncreasePerStar>({
    domIncreasePerStarData,
    currentStrengthStars: 0,
    currentAllureStars: 0,
    currentIntellectStars: 0,
    currentSpiritStars: 0,
    currentTotalStars: 0,
    currentTotalDomGain: 0,
    currentTotalStrengthDomGain: 0,
    currentTotalAllureDomGain: 0,
    currentTotalIntellectDomGain: 0,
    currentTotalSpiritDomGain: 0,
    newStrengthStars: 0,
    newAllureStars: 0,
    newIntellectStars: 0,
    newSpiritStars: 0,
    newTotalStars: 0,
    newTotalDomGain: 0,
    newTotalStrengthDomGain: 0,
    newTotalAllureDomGain: 0,
    newTotalIntellectDomGain: 0,
    newTotalSpiritDomGain: 0,
  })

  // Auras
  const [auras, setAuras] = useState(initialAuras)

  // Talent Scrolls and Scripts (combined into one state like original)
  const [talents, setTalents] = useState<any>({
    randomTalentScroll: { count: 0, exp: 502.5 },
    talentScrollLvl4: { count: 0, exp: 60.5 },
    talentScrollLvl3: { count: 0, exp: 30.5 },
    talentScrollLvl2: { count: 0, exp: 13 },
    talentScrollLvl1: { count: 0, exp: 3 },
    basicTalentScroll: { count: 0, exp: 50 },
    fineTalentScroll: { count: 0, exp: 100 },
    superiorTalentScroll: { count: 0, exp: 200 },
    strengthScript: { selectedStar: 0, quantity: 0, wardenLevel: 1 },
    allureScript: { selectedStar: 0, quantity: 0, wardenLevel: 1 },
    intellectScript: { selectedStar: 0, quantity: 0, wardenLevel: 1 },
    spiritScript: { selectedStar: 0, quantity: 0, wardenLevel: 1 }
  })
  
  // Legacy separate states for compatibility
  const [talentScrolls, setTalentScrolls] = useState<any>({})
  const [talentScripts, setTalentScripts] = useState<any>({})
  
  // Additional state for UI
  const [activeWardenTab, setActiveWardenTab] = useState("summons")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<string>('')
  const [isProcessingInventory, setIsProcessingInventory] = useState(false)
  const [inventoryProgress, setInventoryProgress] = useState('')
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  // Export/Import functions
  const exportGameData = useCallback(() => {
    const state: Partial<GameCalculatorState> = {
      baseAttributes,
      vipLevel,
      lordLevel,
      books,
      conclave,
      conclaveUpgrade,
      courtyard,
      wardenCounts,
      selectedWardens,
      wardenSkins,
      wardenStats,
      uploadedWardenData,
      inventory,
      inventoryImages,
      scarletBond,
      scarletBondAffinity,
      optimizedBondLevels,
      domIncreasePerStar,
      hasNyx,
      hasDracula,
      hasVictor,
      hasFrederick,
      hasAgneyi,
      hasCulann,
      hasHela,
      hasDionysus,
      hasMaya,
      hasEmber,
      hasAsh,
      auras,
      talentScrolls,
      talentScripts,
      familiars,
    }
    
    const { exportGameData: exportFn } = require('@/utils/exportImport')
    exportFn(state)
  }, [
    baseAttributes, vipLevel, lordLevel, books, conclave, conclaveUpgrade,
    courtyard, wardenCounts, selectedWardens, wardenSkins, wardenStats,
    uploadedWardenData, inventory, inventoryImages, scarletBond,
    scarletBondAffinity, optimizedBondLevels, domIncreasePerStar,
    hasNyx, hasDracula, hasVictor, hasFrederick, hasAgneyi, hasCulann,
    hasHela, hasDionysus, hasMaya, hasEmber, hasAsh, auras, talentScrolls, talentScripts, familiars
  ])

  const getExportState = useCallback((): Partial<GameCalculatorState> => {
    return {
    baseAttributes,
    vipLevel,
    lordLevel,
    books,
    conclave,
    conclaveUpgrade,
    courtyard,
    wardenCounts,
    selectedWardens,
    wardenSkins,
    wardenStats,
    uploadedWardenData,
    inventory,
    inventoryImages,
    scarletBond,
    scarletBondAffinity,
    optimizedBondLevels,
    domIncreasePerStar,
    hasNyx,
    hasDracula,
    hasVictor,
    hasFrederick,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    auras,
    talentScrolls,
    talentScripts,
    familiars,
    }
  }, [
    baseAttributes, vipLevel, lordLevel, books, conclave, conclaveUpgrade,
    courtyard, wardenCounts, selectedWardens, wardenSkins, wardenStats,
    uploadedWardenData, inventory, inventoryImages, scarletBond,
    scarletBondAffinity, optimizedBondLevels, domIncreasePerStar,
    hasNyx, hasDracula, hasVictor, hasFrederick, hasAgneyi, hasCulann,
    hasHela, hasDionysus, hasMaya, hasEmber, hasAsh, auras, talentScrolls, talentScripts, familiars
  ])

  const importGameData = useCallback((data: Partial<GameCalculatorState>) => {
    if (data.baseAttributes) setBaseAttributes(data.baseAttributes)
    if (data.vipLevel !== undefined) setVipLevel(data.vipLevel)
    if (data.lordLevel) setLordLevel(data.lordLevel)
    if (data.books) setBooks(data.books)
    if (data.conclave) setConclave(data.conclave)
    if (data.conclaveUpgrade) setConclaveUpgrade(data.conclaveUpgrade)
    if (data.courtyard) setCourtyard(data.courtyard)
    if (data.wardenCounts) setWardenCounts(data.wardenCounts)
    if (data.selectedWardens) setSelectedWardens(data.selectedWardens)
    if (data.wardenSkins) setWardenSkins(data.wardenSkins)
    if (data.wardenStats) setWardenStats(data.wardenStats)
    if (data.uploadedWardenData) setUploadedWardenData(data.uploadedWardenData)
    if (data.inventory) setInventory(data.inventory)
    if (data.inventoryImages) setInventoryImages(data.inventoryImages)
    if (data.scarletBond) setScarletBond(data.scarletBond)
    if (data.scarletBondAffinity) setScarletBondAffinity(data.scarletBondAffinity)
    if (data.optimizedBondLevels) setOptimizedBondLevels(data.optimizedBondLevels)
    if (data.domIncreasePerStar) setDomIncreasePerStar(data.domIncreasePerStar)
    if (data.hasNyx !== undefined) setHasNyx(data.hasNyx)
    if (data.hasDracula !== undefined) setHasDracula(data.hasDracula)
    if (data.hasVictor !== undefined) setHasVictor(data.hasVictor)
    if (data.hasFrederick !== undefined) setHasFrederick(data.hasFrederick)
    if (data.hasAgneyi !== undefined) setHasAgneyi(data.hasAgneyi)
    if (data.hasCulann !== undefined) setHasCulann(data.hasCulann)
    if (data.hasHela !== undefined) setHasHela(data.hasHela)
    if (data.hasDionysus !== undefined) setHasDionysus(data.hasDionysus)
    if (data.hasMaya !== undefined) setHasMaya(data.hasMaya)
    if (data.hasEmber !== undefined) setHasEmber(data.hasEmber)
    if (data.hasAsh !== undefined) setHasAsh(data.hasAsh)
    if (data.auras) setAuras(data.auras)
    if (data.talentScrolls) setTalentScrolls(data.talentScrolls)
    if (data.talentScripts) setTalentScripts(data.talentScripts)
    if ((data as any).familiars) setFamiliars((data as any).familiars)
  }, [])

  // Helper function to sync inventory items with other systems
  const syncInventoryWithOtherSystems = useCallback((itemName: string, newCount: number) => {
    // Map talent scrolls
    if (itemName === 'TalentScroll1') {
      setTalents((prev: any) => ({ ...prev, talentScrollLvl1: { ...prev.talentScrollLvl1, count: newCount } }))
    } else if (itemName === 'TalentScroll2') {
      setTalents((prev: any) => ({ ...prev, talentScrollLvl2: { ...prev.talentScrollLvl2, count: newCount } }))
    } else if (itemName === 'TalentScroll3') {
      setTalents((prev: any) => ({ ...prev, talentScrollLvl3: { ...prev.talentScrollLvl3, count: newCount } }))
    } else if (itemName === 'TalentScroll4') {
      setTalents((prev: any) => ({ ...prev, talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount } }))
    } else if (itemName === 'TalentScroll50') {
      setTalents((prev: any) => ({ ...prev, basicTalentScroll: { ...prev.basicTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentScroll100') {
      setTalents((prev: any) => ({ ...prev, fineTalentScroll: { ...prev.fineTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentScroll200') {
      setTalents((prev: any) => ({ ...prev, superiorTalentScroll: { ...prev.superiorTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentRandom5') {
      setTalents((prev: any) => ({ ...prev, randomTalentScroll: { ...prev.randomTalentScroll, count: newCount } }))
    }
    
    // Map books
    if (itemName === 'Strength1') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare I": newCount } }))
    } else if (itemName === 'Strength2') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare II": newCount } }))
    } else if (itemName === 'Strength3') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare III": newCount } }))
    } else if (itemName === 'Strength4') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare IV": newCount } }))
    } else if (itemName === 'Strength6') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare V": newCount } }))
    } else if (itemName === 'Strength15(1)') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Combat I": newCount } }))
    } else if (itemName === 'Strength15(2)') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Combat II": newCount } }))
    } else if (itemName === 'Allure1') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor I": newCount } }))
    } else if (itemName === 'Allure2') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor II": newCount } }))
    } else if (itemName === 'Allure3') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor III": newCount } }))
    } else if (itemName === 'Allure4') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor IV": newCount } }))
    } else if (itemName === 'Allure5') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor V": newCount } }))
    } else if (itemName === 'Allure15(1)') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Beauty I": newCount } }))
    } else if (itemName === 'Allure15(2)') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Beauty II": newCount } }))
    } else if (itemName === 'Intellect1') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy I": newCount } }))
    } else if (itemName === 'Intellect2') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy II": newCount } }))
    } else if (itemName === 'Intellect3') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy III": newCount } }))
    } else if (itemName === 'Intellect4') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy IV": newCount } }))
    } else if (itemName === 'Intellect5') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy V": newCount } }))
    } else if (itemName === 'Intellect15(1)') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "History I": newCount } }))
    } else if (itemName === 'Intellect15(2)') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "History II": newCount } }))
    } else if (itemName === 'Spirit1') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult I": newCount } }))
    } else if (itemName === 'Spirit2') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult II": newCount } }))
    } else if (itemName === 'Spirit3') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult III": newCount } }))
    } else if (itemName === 'Spirit4') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult IV": newCount } }))
    } else if (itemName === 'Spirit5') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult V": newCount } }))
    } else if (itemName === 'Spirit15(1)') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Mysticism I": newCount } }))
    } else if (itemName === 'Spirit15(2)') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Mysticism II": newCount } }))
    } else if (itemName === 'Mystery1') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-E": newCount } }))
    } else if (itemName === 'Mystery2') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-J": newCount } }))
    } else if (itemName === 'Mystery3') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-O": newCount } }))
    } else if (itemName === 'Mystery4') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-T": newCount } }))
    } else if (itemName === 'Mystery5') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-Z": newCount } }))
    } else if (itemName === 'Mystery15(1)') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Arcana I": newCount } }))
    } else if (itemName === 'Mystery15(2)') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Arcana II": newCount } }))
    }
  }, [setTalents, setBooks])

  // Update inventory item
  const updateInventoryItem = useCallback((itemName: string, newCount: number) => {
    setInventory(prev => ({
      ...prev,
      [itemName]: {
        count: Math.max(0, newCount),
        lastUpdated: new Date().toISOString(),
        imageUrl: prev[itemName]?.imageUrl
      }
    }))
    syncInventoryWithOtherSystems(itemName, newCount)
  }, [syncInventoryWithOtherSystems])

  // Sync books to inventory
  const syncBooksToInventory = useCallback((category: string, bookName: string, newCount: number) => {
    let inventoryItemName = ''
    if (category === 'Strength') {
      if (bookName === 'Warfare I') inventoryItemName = 'Strength1'
      else if (bookName === 'Warfare II') inventoryItemName = 'Strength2'
      else if (bookName === 'Warfare III') inventoryItemName = 'Strength3'
      else if (bookName === 'Warfare IV') inventoryItemName = 'Strength4'
      else if (bookName === 'Warfare V') inventoryItemName = 'Strength6'
      else if (bookName === 'Combat I') inventoryItemName = 'Strength15(1)'
      else if (bookName === 'Combat II') inventoryItemName = 'Strength15(2)'
    } else if (category === 'Allure') {
      if (bookName === 'Glamor I') inventoryItemName = 'Allure1'
      else if (bookName === 'Glamor II') inventoryItemName = 'Allure2'
      else if (bookName === 'Glamor III') inventoryItemName = 'Allure3'
      else if (bookName === 'Glamor IV') inventoryItemName = 'Allure4'
      else if (bookName === 'Glamor V') inventoryItemName = 'Allure5'
      else if (bookName === 'Beauty I') inventoryItemName = 'Allure15(1)'
      else if (bookName === 'Beauty II') inventoryItemName = 'Allure15(2)'
    } else if (category === 'Intellect') {
      if (bookName === 'Alchemy I') inventoryItemName = 'Intellect1'
      else if (bookName === 'Alchemy II') inventoryItemName = 'Intellect2'
      else if (bookName === 'Alchemy III') inventoryItemName = 'Intellect3'
      else if (bookName === 'Alchemy IV') inventoryItemName = 'Intellect4'
      else if (bookName === 'Alchemy V') inventoryItemName = 'Intellect5'
      else if (bookName === 'History I') inventoryItemName = 'Intellect15(1)'
      else if (bookName === 'History II') inventoryItemName = 'Intellect15(2)'
    } else if (category === 'Spirit') {
      if (bookName === 'Occult I') inventoryItemName = 'Spirit1'
      else if (bookName === 'Occult II') inventoryItemName = 'Spirit2'
      else if (bookName === 'Occult III') inventoryItemName = 'Spirit3'
      else if (bookName === 'Occult IV') inventoryItemName = 'Spirit4'
      else if (bookName === 'Occult V') inventoryItemName = 'Spirit5'
      else if (bookName === 'Mysticism I') inventoryItemName = 'Spirit15(1)'
      else if (bookName === 'Mysticism II') inventoryItemName = 'Spirit15(2)'
    } else if (category === 'Balanced') {
      if (bookName === 'Encyclopedia A-E') inventoryItemName = 'Mystery1'
      else if (bookName === 'Encyclopedia A-J') inventoryItemName = 'Mystery2'
      else if (bookName === 'Encyclopedia A-O') inventoryItemName = 'Mystery3'
      else if (bookName === 'Encyclopedia A-T') inventoryItemName = 'Mystery4'
      else if (bookName === 'Encyclopedia A-Z') inventoryItemName = 'Mystery5'
      else if (bookName === 'Arcana I') inventoryItemName = 'Mystery15(1)'
      else if (bookName === 'Arcana II') inventoryItemName = 'Mystery15(2)'
    }
    
    if (inventoryItemName) {
      setInventory(prev => ({
        ...prev,
        [inventoryItemName]: {
          count: newCount,
          lastUpdated: new Date().toISOString(),
          imageUrl: prev[inventoryItemName]?.imageUrl
        }
      }))
    }
  }, [])

  // Sync talents to inventory
  const syncTalentsToInventory = useCallback((talentType: string, newCount: number) => {
    let inventoryItemName = ''
    if (talentType === 'randomTalentScroll') inventoryItemName = 'TalentRandom5'
    else if (talentType === 'talentScrollLvl1') inventoryItemName = 'TalentScroll1'
    else if (talentType === 'talentScrollLvl2') inventoryItemName = 'TalentScroll2'
    else if (talentType === 'talentScrollLvl3') inventoryItemName = 'TalentScroll3'
    else if (talentType === 'talentScrollLvl4') inventoryItemName = 'TalentScroll4'
    else if (talentType === 'basicTalentScroll') inventoryItemName = 'TalentScroll50'
    else if (talentType === 'fineTalentScroll') inventoryItemName = 'TalentScroll100'
    else if (talentType === 'superiorTalentScroll') inventoryItemName = 'TalentScroll200'
    
    if (inventoryItemName) {
      setInventory(prev => ({
        ...prev,
        [inventoryItemName]: {
          count: newCount,
          lastUpdated: new Date().toISOString(),
          imageUrl: prev[inventoryItemName]?.imageUrl
        }
      }))
    }
  }, [])

  // Remove inventory item
  const removeInventoryItem = useCallback((itemName: string) => {
    setInventory(prev => {
      const newInventory = { ...prev }
      delete newInventory[itemName]
      return newInventory
    })
    
    setInventoryImages(prev => {
      const newImages = { ...prev }
      delete newImages[itemName]
      return newImages
    })
  }, [])

  // Get all selected wardens
  const getAllSelectedWardens = useCallback(() => {
    const allSelected: any[] = []
    Object.entries(selectedWardens).forEach(([group, wardens]) => {
      wardens.forEach((wardenName: string) => {
        const wardenData = wardenGroups[group as keyof typeof wardenGroups]?.find((w) => w.name === wardenName)
        if (wardenData) {
          allSelected.push({ ...wardenData, group })
        }
      })
    })
    if (hasNyx) allSelected.push({ name: "Nyx", attributes: ["Balance"], tier: 5, group: "special" })
    if (hasDracula) allSelected.push({ name: "Dracula", attributes: ["Balance"], tier: 5, group: "special" })
    if (hasVictor) allSelected.push({ name: "Victor", attributes: ["Balance"], tier: 5, group: "special" })
    if (hasFrederick) allSelected.push({ name: "Frederick", attributes: ["Balance"], tier: 5, group: "special" })
    return allSelected
  }, [selectedWardens, hasNyx, hasDracula, hasVictor, hasFrederick])

  // Handle warden selection
  const handleWardenSelection = useCallback((group: string, warden: string) => {
    setSelectedWardens((prev: any) => {
      const currentSelected = prev[group] || []
      const isSelected = currentSelected.includes(warden)
      if (isSelected) {
        return {
          ...prev,
          [group]: currentSelected.filter((w: string) => w !== warden),
        }
      } else if (currentSelected.length < wardenCounts[group as keyof typeof wardenCounts]) {
        return {
          ...prev,
          [group]: [...currentSelected, warden],
        }
      }
      return prev
    })
  }, [wardenCounts])

  // Handle skin toggle
  const handleSkinToggle = useCallback((wardenName: string, skinName: string) => {
    setWardenSkins((prev) => ({
      ...prev,
      [wardenName]: {
        ...prev[wardenName],
        [skinName]: !prev[wardenName]?.[skinName],
      },
    }))
  }, [])

  // Handle inventory image upload
  const handleInventoryImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessingInventory(true)
    setInventoryError(null)
    setInventoryProgress('')

    try {
      const newInventory = { ...inventory }
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setInventoryProgress(`Processing image ${i + 1}/${files.length}: ${file.name}`)
        try {
          const imageUrl = URL.createObjectURL(file)
          const itemName = file.name.replace(/\.[^/.]+$/, "")
          setInventoryImages(prev => ({
            ...prev,
            [itemName]: imageUrl
          }))
          if (!newInventory[itemName]) {
            newInventory[itemName] = {
              count: 1,
              lastUpdated: new Date().toISOString()
            }
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error)
          setInventoryError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      setInventory(newInventory)
    } catch (error) {
      setInventoryError(`Inventory processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingInventory(false)
      setInventoryProgress('')
      event.target.value = ''
    }
  }, [inventory])

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let totalStrength = baseAttributes.strength
    let totalAllure = baseAttributes.allure
    let totalIntellect = baseAttributes.intellect
    let totalSpirit = baseAttributes.spirit

    const conclaveBonus = calculateTotalConclaveBonus(conclave)

    // Add book bonuses with conclave multipliers
    Object.entries(books).forEach(([category, bookCollection]) => {
      Object.entries(bookCollection).forEach(([bookName, count]) => {
        const categoryBonuses = bookBonuses[category as keyof typeof bookBonuses]
        const bookBonus = categoryBonuses ? categoryBonuses[bookName as keyof typeof categoryBonuses] || 0 : 0
        const baseBonus = (count as number) * bookBonus
        
        if (category === "Strength" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana") 
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.strength
          totalStrength += baseBonus * (multiplier / 100)
        }
        if (category === "Allure" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.allure
          totalAllure += baseBonus * (multiplier / 100)
        }
        if (category === "Intellect" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.intellect
          totalIntellect += baseBonus * (multiplier / 100)
        }
        if (category === "Spirit" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.spirit
          totalSpirit += baseBonus * (multiplier / 100)
        }
      })
    })

    // Add conclave warden bonuses
    const allWardens = [
      ...wardenGroups.circus,
      ...wardenGroups.tyrants,
      ...wardenGroups.noir,
      ...wardenGroups.hunt
    ]
    
    const wardenCountsByAttr = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
    allWardens.forEach(warden => {
      if (warden.attributes.includes("Strength")) wardenCountsByAttr.strength++
      if (warden.attributes.includes("Allure")) wardenCountsByAttr.allure++
      if (warden.attributes.includes("Intellect")) wardenCountsByAttr.intellect++
      if (warden.attributes.includes("Spirit")) wardenCountsByAttr.spirit++
    })

    totalStrength += wardenCountsByAttr.strength * conclaveBonus.wardenBonuses.strength
    totalAllure += wardenCountsByAttr.allure * conclaveBonus.wardenBonuses.allure
    totalIntellect += wardenCountsByAttr.intellect * conclaveBonus.wardenBonuses.intellect
    totalSpirit += wardenCountsByAttr.spirit * conclaveBonus.wardenBonuses.spirit

    // Add warden stat bonuses
    Object.values(wardenStats).forEach((stats: any) => {
      if (stats) {
        totalStrength += stats.strength || 0
        totalAllure += stats.allure || 0
        totalIntellect += stats.intellect || 0
        totalSpirit += stats.spirit || 0
      }
    })

    // Add scarlet bond bonuses (using optimized levels)
    Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
      if (bond) {
        const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
        if (bondData) {
          const optimizedBond = optimizedBondLevels[bondKey]
          if (!optimizedBond) return
          
          // Calculate bonuses for each attribute
          (['strength', 'allure', 'intellect', 'spirit'] as const).forEach((attr) => {
            const level = optimizedBond[`${attr}Level` as keyof typeof optimizedBond] as number || 0
            const percent = optimizedBond[`${attr}Percent` as keyof typeof optimizedBond] as number || 0
            
            if (level > 0) {
              const levelData = scarletBondLevels.find(l => l.level === level)
              if (levelData) {
                let flatBonus = 0
                if (bondData.type === 'All') {
                  flatBonus = levelData.all || 0
                } else if (bondData.type === 'Dual') {
                  flatBonus = levelData.dual || 0
                } else {
                  flatBonus = levelData.single || 0
                }
                
                const s = resolveLoverSummonFlags(
                  { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
                  hasNyx,
                  inventory
                )
                const multiplier = getLoverScarletBondAuraMultiplier(attr, s)
                
                const attrTotal = flatBonus * multiplier
                if (percent > 0) {
                  const percentBonus = (percent / 100) * flatBonus * multiplier
                  if (attr === 'strength') totalStrength += attrTotal + percentBonus
                  else if (attr === 'allure') totalAllure += attrTotal + percentBonus
                  else if (attr === 'intellect') totalIntellect += attrTotal + percentBonus
                  else if (attr === 'spirit') totalSpirit += attrTotal + percentBonus
                } else {
                  if (attr === 'strength') totalStrength += attrTotal
                  else if (attr === 'allure') totalAllure += attrTotal
                  else if (attr === 'intellect') totalIntellect += attrTotal
                  else if (attr === 'spirit') totalSpirit += attrTotal
                }
              }
            }
          })
        }
      }
    })

    // Add courtyard bonuses
    const courtyardDom = calculateCourtyardDom(courtyard, courtyard.currentLevel)
    totalStrength += courtyardDom.strength
    totalAllure += courtyardDom.allure
    totalIntellect += courtyardDom.intellect
    totalSpirit += courtyardDom.spirit

    // Calculate DOM
    const baseDom = Math.min(totalStrength, totalAllure, totalIntellect, totalSpirit)
    const totalDom = (totalStrength + totalAllure + totalIntellect + totalSpirit) / 4
    const domIncrease = totalDom - baseDom

    return {
      totalStrength,
      totalAllure,
      totalIntellect,
      totalSpirit,
      baseDom,
      totalDom,
      domIncrease
    }
  }, [baseAttributes, books, conclave, wardenStats, scarletBond, optimizedBondLevels, courtyard, hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh, hasNyx, inventory])

  // Calculate optimized scarlet bond bonuses
  const calculateOptimizedScarletBondBonuses = useCallback(() => {
    let optimizedStrength = 0
    let optimizedAllure = 0
    let optimizedIntellect = 0
    let optimizedSpirit = 0

    Object.entries(optimizedBondLevels).forEach(([bondKey, optimizedBond]: [string, any]) => {
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (bondData && optimizedBond) {
        ['strength', 'allure', 'intellect', 'spirit'].forEach((attr) => {
          const level = optimizedBond[`${attr}Level`] || 0
          const percent = optimizedBond[`${attr}Percent`] || 0
          
          if (level > 0) {
            const levelData = scarletBondLevels.find(l => l.level === level)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              
              if (attr === 'strength') optimizedStrength += flatBonus
              else if (attr === 'allure') optimizedAllure += flatBonus
              else if (attr === 'intellect') optimizedIntellect += flatBonus
              else if (attr === 'spirit') optimizedSpirit += flatBonus
              
              if (percent > 0) {
                const percentBonus = (percent / 100) * flatBonus
                if (attr === 'strength') optimizedStrength += percentBonus
                else if (attr === 'allure') optimizedAllure += percentBonus
                else if (attr === 'intellect') optimizedIntellect += percentBonus
                else if (attr === 'spirit') optimizedSpirit += percentBonus
              }
            }
          }
        })
      }
    })

    return {
      optimizedStrength,
      optimizedAllure,
      optimizedIntellect,
      optimizedSpirit,
    }
  }, [optimizedBondLevels])

  // Calculate current scarlet bond bonuses
  const calculateCurrentScarletBondBonuses = useCallback(() => {
    let currentStrength = 0
    let currentAllure = 0
    let currentIntellect = 0
    let currentSpirit = 0

    Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
      if (bond) {
        const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
        if (bondData) {
          (['strength', 'allure', 'intellect', 'spirit'] as const).forEach((attr: 'strength' | 'allure' | 'intellect' | 'spirit') => {
            const level = (bond as any)[`${attr}Level`] || 0
            const percent = (bond as any)[`${attr}Percent`] || 0
            
            if (level > 0) {
              const levelData = scarletBondLevels.find(l => l.level === level)
              if (levelData) {
                let flatBonus = 0
                if (bondData.type === 'All') {
                  flatBonus = levelData.all || 0
                } else if (bondData.type === 'Dual') {
                  flatBonus = levelData.dual || 0
                } else {
                  flatBonus = levelData.single || 0
                }
                
                const s = resolveLoverSummonFlags(
                  { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
                  hasNyx,
                  inventory
                )
                const multiplier = getLoverScarletBondAuraMultiplier(attr, s)
                
                const attrTotal = Math.round(flatBonus * multiplier)
                if (attr === 'strength') currentStrength += attrTotal
                else if (attr === 'allure') currentAllure += attrTotal
                else if (attr === 'intellect') currentIntellect += attrTotal
                else if (attr === 'spirit') currentSpirit += attrTotal
                
                if (percent > 0) {
                  const percentBonus = Math.round(((percent / 100) * flatBonus) * multiplier)
                  if (attr === 'strength') currentStrength += percentBonus
                  else if (attr === 'allure') currentAllure += percentBonus
                  else if (attr === 'intellect') currentIntellect += percentBonus
                  else if (attr === 'spirit') currentSpirit += percentBonus
                }
              }
            }
          })
        }
      }
    })

    return {
      currentStrength,
      currentAllure,
      currentIntellect,
      currentSpirit
    }
  }, [scarletBond, hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh, hasNyx, inventory])

  // Calculate suggested scarlet bond increase (simplified - returns empty for now)
  const calculateSuggestedScarletBondIncrease = useCallback(() => {
    return {
      increaseStrength: 0,
      increaseAllure: 0,
      increaseIntellect: 0,
      increaseSpirit: 0,
      increaseDom: 0
    }
  }, [])

  // Calculate dynamic auras and aura bonuses
  const computedDynamicAuras = calculateDynamicAuraLevels(
    auras,
    selectedWardens,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    hasNyx,
    inventory
  )
  const computedAuraBonuses = calculateAuraBonuses(
    auras,
    selectedWardens,
    vipLevel,
    hasNyx,
    hasDracula,
    hasVictor,
    hasFrederick,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    inventory
  )
  const computedTotals = calculateTotals()
  const computedOptimizedBonuses = calculateOptimizedScarletBondBonuses()
  const computedCurrentScarletBondBonuses = calculateCurrentScarletBondBonuses()
  const computedSuggestedIncrease = calculateSuggestedScarletBondIncrease()

  const value: GameCalculatorContextType = {
    baseAttributes,
    setBaseAttributes,
    vipLevel,
    setVipLevel,
    lordLevel,
    setLordLevel,
    books,
    setBooks,
    conclave,
    setConclave,
    conclaveUpgrade,
    setConclaveUpgrade,
    courtyard,
    setCourtyard,
    wardenCounts,
    setWardenCounts,
    selectedWardens,
    setSelectedWardens,
    wardenSkins,
    setWardenSkins,
    wardenStats,
    setWardenStats,
    uploadedWardenData,
    setUploadedWardenData,
    hasNyx,
    setHasNyx,
    hasDracula,
    setHasDracula,
    hasVictor,
    setHasVictor,
    hasFrederick,
    setHasFrederick,
    hasAgneyi,
    setHasAgneyi,
    hasCulann,
    setHasCulann,
    hasHela,
    setHasHela,
    hasDionysus,
    setHasDionysus,
    hasMaya,
    setHasMaya,
    hasEmber,
    setHasEmber,
    hasAsh,
    setHasAsh,
    summonableCharacters,
    setSummonableCharacter,
    familiars,
    setFamiliars,
    inventory,
    setInventory,
    inventoryImages,
    setInventoryImages,
    scarletBond,
    setScarletBond,
    scarletBondAffinity,
    setScarletBondAffinity,
    optimizedBondLevels,
    setOptimizedBondLevels,
    domIncreasePerStar,
    setDomIncreasePerStar,
    auras,
    setAuras,
    talentScrolls,
    setTalentScrolls,
    talentScripts,
    setTalentScripts,
    exportGameData,
    getExportState,
    importGameData,
    syncBooksToInventory,
    syncTalentsToInventory,
    updateInventoryItem,
    handleWardenSelection,
    handleSkinToggle,
    formatItemName,
    getItemCategory,
    getItemsByCategory,
    groupItemsByType,
    renderStars,
    totals: computedTotals,
    optimizedBonuses: computedOptimizedBonuses,
    currentScarletBondBonuses: computedCurrentScarletBondBonuses,
    suggestedIncrease: computedSuggestedIncrease,
    dynamicAuras: computedDynamicAuras,
    auraBonuses: computedAuraBonuses,
    talents,
    setTalents,
    activeWardenTab,
    setActiveWardenTab,
    isUploading,
    setIsUploading,
    uploadError,
    setUploadError,
    ocrProgress,
    setOcrProgress,
    isProcessingInventory,
    setIsProcessingInventory,
    inventoryProgress,
    setInventoryProgress,
    inventoryError,
    setInventoryError,
    handleInventoryImageUpload,
    removeInventoryItem,
    getAllSelectedWardens,
  }

  return (
    <GameCalculatorContext.Provider value={value}>
      {children}
    </GameCalculatorContext.Provider>
  )
}

export function useGameCalculator() {
  const context = useContext(GameCalculatorContext)
  if (context === undefined) {
    throw new Error('useGameCalculator must be used within a GameCalculatorProvider')
  }
  return context
}
