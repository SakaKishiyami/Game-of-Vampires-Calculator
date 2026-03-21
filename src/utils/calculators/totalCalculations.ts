// Total DOM calculation functions
import type { BaseAttributes, BooksState, ConclaveState, WardenStats, ScarletBondLevel, CourtyardState, DomIncreasePerStar, Inventory } from '@/types'
import { bookBonuses } from '@/data/books'
import { wardenGroups } from '@/data/wardens'
import { scarletBondData, scarletBondLevels } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'
import { calculateTotalConclaveBonus } from './conclaveCalculations'
import { calculateCourtyardDom, calculateMaxCourtyardLevel } from './courtyardCalculations'
import { calculateDynamicAuraLevels } from './auraCalculations'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier } from '@/utils/loverScarletBondAuras'
import { calculateScriptResults, getStarBonus, calculateTalentScrollStars } from './talentCalculations'

export interface TotalCalculationResult {
  totalStrength: number
  totalAllure: number
  totalIntellect: number
  totalSpirit: number
  totalDom: number
  baseDom: number
  domIncrease: number
}

export function calculateTotals(
  baseAttributes: BaseAttributes,
  books: BooksState,
  conclave: ConclaveState,
  courtyard: CourtyardState,
  wardenStats: WardenStats,
  scarletBond: ScarletBondLevel,
  optimizedBondLevels: ScarletBondLevel,
  auras: any,
  selectedWardens: any,
  hasAgneyi: boolean,
  hasCulann: boolean,
  hasHela: boolean,
  hasDionysus: boolean,
  hasMaya: boolean,
  hasEmber: boolean,
  hasAsh: boolean,
  hasNyx: boolean,
  inventory: Inventory,
  talentScrolls: any,
  talentScripts: any,
  domIncreasePerStar: DomIncreasePerStar
): TotalCalculationResult {
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
  
  const wardenCounts = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
  allWardens.forEach(warden => {
    if (warden.attributes.includes("Strength")) wardenCounts.strength++
    if (warden.attributes.includes("Allure")) wardenCounts.allure++
    if (warden.attributes.includes("Intellect")) wardenCounts.intellect++
    if (warden.attributes.includes("Spirit")) wardenCounts.spirit++
  })

  totalStrength += wardenCounts.strength * conclaveBonus.wardenBonuses.strength
  totalAllure += wardenCounts.allure * conclaveBonus.wardenBonuses.allure
  totalIntellect += wardenCounts.intellect * conclaveBonus.wardenBonuses.intellect
  totalSpirit += wardenCounts.spirit * conclaveBonus.wardenBonuses.spirit

  // Add warden stat bonuses
  Object.values(wardenStats).forEach((stats: any) => {
    if (stats) {
      totalStrength += stats.strength || 0
      totalAllure += stats.allure || 0
      totalIntellect += stats.intellect || 0
      totalSpirit += stats.spirit || 0
    }
  })

  // Add scarlet bond bonuses
  Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
    if (bond) {
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (bondData) {
        const optimizedBond = optimizedBondLevels[bondKey]
        
        if (!optimizedBond) return
        
        // Calculate flat bonuses for each attribute
        if (optimizedBond.strengthLevel && optimizedBond.strengthLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.strengthLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            totalStrength += flatBonus
          }
        }
        
        if (optimizedBond.strengthPercent && optimizedBond.strengthPercent > 0) {
          const flatLevelData = scarletBondLevels.find(l => l.level === (optimizedBond.strengthLevel || 0))
          if (flatLevelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = flatLevelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = flatLevelData.dual || 0
            } else {
              flatBonus = flatLevelData.single || 0
            }
            const percentBonus = ((optimizedBond.strengthPercent || 0)/100) * flatBonus
            totalStrength += percentBonus
          }
        }
        
        // Repeat for allure, intellect, spirit
        if (optimizedBond.allureLevel && optimizedBond.allureLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.allureLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            totalAllure += flatBonus
          }
        }
        
        if (optimizedBond.allurePercent && optimizedBond.allurePercent > 0) {
          const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.allureLevel || 0))
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            const percentBonus = ((optimizedBond.allurePercent || 0)/100) * flatBonus
            totalAllure += percentBonus
          }
        }
        
        if (optimizedBond.intellectLevel && optimizedBond.intellectLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.intellectLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            totalIntellect += flatBonus
          }
        }
        
        if (optimizedBond.intellectPercent && optimizedBond.intellectPercent > 0) {
          const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.intellectLevel || 0))
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            const percentBonus = ((optimizedBond.intellectPercent || 0)/100) * flatBonus
            totalIntellect += percentBonus
          }
        }
        
        if (optimizedBond.spiritLevel && optimizedBond.spiritLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.spiritLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            totalSpirit += flatBonus
          }
        }
        
        if (optimizedBond.spiritPercent && optimizedBond.spiritPercent > 0) {
          const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.spiritLevel || 0))
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            const percentBonus = ((optimizedBond.spiritPercent || 0)/100) * flatBonus
            totalSpirit += percentBonus
          }
        }
      }
    }
  })

  // Apply lover aura bonuses to scarlet bond bonuses (additive layer: base already added above)
  const s = resolveLoverSummonFlags(
    { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
    hasNyx,
    inventory
  )
  calculateDynamicAuraLevels(
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

  Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
    if (!bond) return
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    if (!bondData) return
    const optimizedBond = optimizedBondLevels[bondKey] || bond
    ;(['strength', 'allure', 'intellect', 'spirit'] as const).forEach((attr) => {
      const level = optimizedBond[`${attr}Level`] || 0
      if (!level) return
      const levelData = scarletBondLevels.find(l => l.level === level)
      if (!levelData) return
      let flatBonus = 0
      if (bondData.type === 'All') flatBonus = levelData.all || 0
      else if (bondData.type === 'Dual') flatBonus = levelData.dual || 0
      else flatBonus = levelData.single || 0
      const pct = (optimizedBond[`${attr}Percent`] || 0) / 100
      const baseTotal = flatBonus * (1 + pct)
      const m = getLoverScarletBondAuraMultiplier(attr, s)
      const extra = baseTotal * (m - 1)
      if (extra <= 0) return
      if (attr === 'strength') totalStrength += extra
      else if (attr === 'allure') totalAllure += extra
      else if (attr === 'intellect') totalIntellect += extra
      else totalSpirit += extra
    })
  })

  // Add talent script bonuses
  if (talentScripts) {
    const strengthScriptStars = calculateScriptResults(talentScripts.strengthScript || { selectedStar: 0, quantity: 0, wardenLevel: 0 })
    const allureScriptStars = calculateScriptResults(talentScripts.allureScript || { selectedStar: 0, quantity: 0, wardenLevel: 0 })
    const intellectScriptStars = calculateScriptResults(talentScripts.intellectScript || { selectedStar: 0, quantity: 0, wardenLevel: 0 })
    const spiritScriptStars = calculateScriptResults(talentScripts.spiritScript || { selectedStar: 0, quantity: 0, wardenLevel: 0 })
    
    totalStrength += getStarBonus(talentScripts.strengthScript?.wardenLevel || 0, strengthScriptStars)
    totalAllure += getStarBonus(talentScripts.allureScript?.wardenLevel || 0, allureScriptStars)
    totalIntellect += getStarBonus(talentScripts.intellectScript?.wardenLevel || 0, intellectScriptStars)
    totalSpirit += getStarBonus(talentScripts.spiritScript?.wardenLevel || 0, spiritScriptStars)
  }

  // Add talent scroll experience bonuses
  if (talentScrolls) {
    const talentScrollStars = calculateTalentScrollStars(talentScrolls)
    const talentScrollDomBonus = getStarBonus(250, talentScrollStars)
    const talentScrollBonusPerAttribute = talentScrollDomBonus / 4
    totalStrength += talentScrollBonusPerAttribute
    totalAllure += talentScrollBonusPerAttribute
    totalIntellect += talentScrollBonusPerAttribute
    totalSpirit += talentScrollBonusPerAttribute
  }

  // Add courtyard DOM contribution
  const projectedLevel = calculateMaxCourtyardLevel(courtyard)
  const courtyardDom = calculateCourtyardDom(courtyard, projectedLevel)
  totalStrength += courtyardDom.strength
  totalAllure += courtyardDom.allure
  totalIntellect += courtyardDom.intellect
  totalSpirit += courtyardDom.spirit

  const totalDom = totalStrength + totalAllure + totalIntellect + totalSpirit
  const baseDom = baseAttributes.strength + baseAttributes.allure + baseAttributes.intellect + baseAttributes.spirit
  const domIncrease = totalDom - baseDom

  return {
    totalStrength,
    totalAllure,
    totalIntellect,
    totalSpirit,
    totalDom,
    baseDom,
    domIncrease,
  }
}
