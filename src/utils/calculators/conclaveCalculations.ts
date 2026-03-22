// Conclave calculation functions
import type { BookCollection, ConclaveState, ConclaveUpgrade, BooksState, WardenCounts } from '@/types'
import { conclaveLevels } from '@/data/conclave'
import { wardenGroups } from '@/data/wardens'
import { bookBonuses } from '@/data/books'

export interface ConclaveBonus {
  wardenBonuses: {
    strength: number
    allure: number
    intellect: number
    spirit: number
  }
  bookMultipliers: {
    strength: number
    allure: number
    intellect: number
    spirit: number
  }
}

export interface ConclaveUpgradeResult {
  totalCost: number
  wardenBonuses: {
    strength: number
    allure: number
    intellect: number
    spirit: number
  }
  bookMultipliers: {
    strength: number
    allure: number
    intellect: number
    spirit: number
  }
  upgrades: Array<{
    sealType: string
    currentLevel: number
    targetLevel: number
    cost: number
    wardenBonus: number
    bookMultiplier: number
    domGain: number
    efficiency: number
  }>
}

export function calculateTotalConclaveBonus(conclave: ConclaveState): ConclaveBonus {
  const sealTypes = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"] as const
  const currentBonuses: ConclaveBonus = {
    wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
    bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 }
  }

  sealTypes.forEach(sealType => {
    const currentLevel = conclave[sealType]
    const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof currentBonuses.wardenBonuses
    
    let wardenBonus = 0
    let bookMultiplier = 0

    for (let level = 1; level <= currentLevel; level++) {
      const levelData = conclaveLevels[level - 1]
      if (levelData) {
        wardenBonus += levelData.warden
        bookMultiplier += levelData.books
      }
    }

    currentBonuses.wardenBonuses[attribute] = wardenBonus
    currentBonuses.bookMultipliers[attribute] = 1 + (bookMultiplier / 100)
  })

  return currentBonuses
}

export function calculateConclaveUpgrades(
  conclave: ConclaveState,
  conclaveUpgrade: ConclaveUpgrade,
  books: BooksState,
  wardenCounts: WardenCounts
): ConclaveUpgradeResult {
  const sealTypes = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"] as const
  const availableSeals = conclaveUpgrade.savedSeals
  
  const selectedSeals = sealTypes.filter(sealType => conclaveUpgrade.upgradeSeals[sealType])
  
  if (selectedSeals.length === 0 || availableSeals === 0) {
    return {
      totalCost: 0,
      wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
      bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 },
      upgrades: []
    }
  }

  // Calculate warden counts for DOM efficiency calculation
  const allWardens = [
    ...wardenGroups.circus,
    ...wardenGroups.tyrants,
    ...wardenGroups.noir,
    ...wardenGroups.hunt
  ]
  
  const calculatedWardenCounts = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
  allWardens.forEach(warden => {
    if (warden.attributes.includes("Strength")) calculatedWardenCounts.strength++
    if (warden.attributes.includes("Allure")) calculatedWardenCounts.allure++
    if (warden.attributes.includes("Intellect")) calculatedWardenCounts.intellect++
    if (warden.attributes.includes("Spirit")) calculatedWardenCounts.spirit++
    if (warden.attributes.includes("Balance")) {
      calculatedWardenCounts.strength++
      calculatedWardenCounts.allure++
      calculatedWardenCounts.intellect++
      calculatedWardenCounts.spirit++
    }
  })

  // Calculate book values for DOM efficiency calculation
  const bookValues = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
  Object.entries(books).forEach(([category, bookCollection]) => {
    Object.entries(bookCollection).forEach(([bookName, count]) => {
      const categoryBonuses = bookBonuses[category as keyof typeof bookBonuses]
      const bookBonus = categoryBonuses ? categoryBonuses[bookName as keyof typeof categoryBonuses] || 0 : 0
      const baseBonus = (count as number) * bookBonus
      
      if (category === "Strength" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
        bookValues.strength += baseBonus
      }
      if (category === "Allure" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
        bookValues.allure += baseBonus
      }
      if (category === "Intellect" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
        bookValues.intellect += baseBonus
      }
      if (category === "Spirit" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
        bookValues.spirit += baseBonus
      }
    })
  })

  // Create upgrade options for each seal
  const upgradeOptions: any[] = []
  
  selectedSeals.forEach(sealType => {
    const currentLevel = conclave[sealType]
    const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof calculatedWardenCounts
    
    for (let targetLevel = currentLevel + 1; targetLevel <= conclaveLevels.length && targetLevel <= currentLevel + 20; targetLevel++) {
      let totalCost = 0
      let wardenBonus = 0
      let bookMultiplier = 0
      
      for (let level = currentLevel + 1; level <= targetLevel; level++) {
        const levelData = conclaveLevels[level - 1]
        if (!levelData) break
        
        totalCost += levelData.cost
        wardenBonus += levelData.warden
        bookMultiplier += levelData.books
      }
      
      if (totalCost <= availableSeals) {
        const wardenDomGain = wardenBonus * calculatedWardenCounts[attribute]
        const bookDomGain = (bookValues[attribute] * bookMultiplier) / 100
        const totalDomGain = wardenDomGain + bookDomGain
        const efficiency = totalCost > 0 ? totalDomGain / totalCost : 0
        
        upgradeOptions.push({
          sealType,
          attribute,
          currentLevel,
          targetLevel,
          cost: totalCost,
          wardenBonus,
          bookMultiplier,
          domGain: totalDomGain,
          efficiency
        })
      }
    }
  })

  upgradeOptions.sort((a, b) => b.efficiency - a.efficiency)

  const selectedUpgrades: any[] = []
  let remainingSeals = availableSeals

  if (selectedSeals.length === 1) {
    const sealType = selectedSeals[0]
    let currentLevel = conclave[sealType]
    
    while (currentLevel < conclaveLevels.length) {
      const nextLevel = currentLevel + 1
      const levelData = conclaveLevels[nextLevel - 1]
      if (!levelData || levelData.cost > remainingSeals) break
      
      const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof calculatedWardenCounts
      const wardenDomGain = levelData.warden * calculatedWardenCounts[attribute]
      const bookDomGain = (bookValues[attribute] * levelData.books) / 100
      const totalDomGain = wardenDomGain + bookDomGain
      const efficiency = levelData.cost > 0 ? totalDomGain / levelData.cost : 0
      
      selectedUpgrades.push({
        sealType,
        attribute,
        currentLevel,
        targetLevel: nextLevel,
        cost: levelData.cost,
        wardenBonus: levelData.warden,
        bookMultiplier: levelData.books,
        domGain: totalDomGain,
        efficiency
      })
      
      remainingSeals -= levelData.cost
      currentLevel = nextLevel
    }
  } else {
    const usedSeals = new Set<string>()
    
    for (const option of upgradeOptions) {
      if (usedSeals.has(option.sealType) || option.cost > remainingSeals) continue
      
      selectedUpgrades.push(option)
      remainingSeals -= option.cost
      usedSeals.add(option.sealType)
    }
  }

  const results: ConclaveUpgradeResult = {
    totalCost: availableSeals - remainingSeals,
    wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
    bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 },
    upgrades: selectedUpgrades.map(upgrade => ({
      sealType: upgrade.sealType,
      currentLevel: upgrade.currentLevel,
      targetLevel: upgrade.targetLevel,
      cost: upgrade.cost,
      wardenBonus: upgrade.wardenBonus,
      bookMultiplier: upgrade.bookMultiplier,
      domGain: upgrade.domGain,
      efficiency: upgrade.efficiency
    }))
  }

  type AttrKey = keyof typeof results.wardenBonuses
  selectedUpgrades.forEach((upgrade: { attribute: AttrKey; wardenBonus: number; bookMultiplier: number }) => {
    results.wardenBonuses[upgrade.attribute] = upgrade.wardenBonus
    results.bookMultipliers[upgrade.attribute] = 1 + upgrade.bookMultiplier / 100
  })

  return results
}
