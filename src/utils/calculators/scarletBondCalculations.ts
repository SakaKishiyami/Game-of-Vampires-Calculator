// Scarlet Bond calculation functions
import type { ScarletBondLevel, Inventory } from '@/types'
import { scarletBondData, scarletBondLevels, getOffSingle } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier } from '@/utils/loverScarletBondAuras'

export interface ScarletBondContribution {
  flatBonus: number
  percentBonus: number
  totalBonus: number
  loverMultiplier: number
}

export interface BondUpgrade {
  bondType: string
  currentLevel: number
  newLevel: number
  cost: number
  domGain: number
  efficiency?: number
}

export function calculateScarletBondContribution(
  bondKey: string,
  attribute: string,
  scarletBond: ScarletBondLevel,
  optimizedBondLevels: ScarletBondLevel,
  hasAgneyi: boolean,
  hasCulann: boolean,
  hasHela: boolean,
  hasDionysus: boolean,
  hasMaya: boolean,
  hasEmber: boolean,
  hasAsh: boolean,
  inventory: Inventory
): ScarletBondContribution {
  const currentBond = scarletBond[bondKey] || {}
  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
  
  if (!bondData) return { flatBonus: 0, percentBonus: 0, totalBonus: 0, loverMultiplier: 0 }
  
  const optimizedBond = optimizedBondLevels[bondKey] || currentBond
  
  let flatBonus = 0
  let percentBonus = 0
  
  const flatLevel = (optimizedBond as any)[`${attribute}Level`] || 0
  if (flatLevel > 0) {
    const levelData = scarletBondLevels.find(l => l.level === flatLevel)
    if (levelData) {
      if (bondData.type === 'All') {
        flatBonus = levelData.all || 0
      } else if (bondData.type === 'Dual') {
        flatBonus = levelData.dual || 0
      } else {
        flatBonus = levelData.single || 0
      }
    }
  }
  
  const percentLevel = (optimizedBond as any)[`${attribute}Percent`] || 0
  if (percentLevel > 0 && flatBonus > 0) {
    const percentageValue = percentLevel / 100
    percentBonus = percentageValue * flatBonus
  }
  
  const s = resolveLoverSummonFlags(
    { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
    inventory
  )
  const attr = attribute as 'strength' | 'allure' | 'intellect' | 'spirit'
  const loverMultiplier = getLoverScarletBondAuraMultiplier(attr, s)
  
  const totalBonus = (flatBonus + percentBonus) * loverMultiplier
  
  return { 
    flatBonus: Math.round(flatBonus), 
    percentBonus: Math.round(percentBonus * 100) / 100, 
    totalBonus: Math.round(totalBonus), 
    loverMultiplier: Math.round((loverMultiplier - 1) * 100) 
  }
}

export function calculateBondDomGain(
  bondType: string,
  currentLevel: number,
  newLevel: number,
  bondKey: string,
  scarletBond: ScarletBondLevel
): number {
  const attr = bondType.replace('Level', '').replace('Percent', '')
  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
  const [_, warden] = bondKey.split("-")
  const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
  const mainAttrs = new Set<string>()
  wardenData?.forEach(a => { if (a.toLowerCase() !== 'balance') mainAttrs.add(a.toLowerCase()) })
  
  if (bondType.endsWith('Level')) {
    const currentData = scarletBondLevels.find(l => l.level === currentLevel)
    const newData = scarletBondLevels.find(l => l.level === newLevel)
    
    let currentBonus = 0
    let newBonus = 0
    
    if (!mainAttrs.has(attr)) {
      currentBonus = getOffSingle(currentLevel)
      newBonus = getOffSingle(newLevel)
    } else if (bondData?.type === 'All') {
      currentBonus = currentData?.all || 0
      newBonus = newData?.all || 0
    } else if (bondData?.type === 'Dual') {
      currentBonus = currentData?.dual || 0
      newBonus = newData?.dual || 0
    } else if (bondData?.type === 'Single') {
      currentBonus = currentData?.single || 0
      newBonus = newData?.single || 0
    } else {
      currentBonus = currentData?.single || 0
      newBonus = newData?.single || 0
    }
    
    return newBonus - currentBonus
  } else if (bondType.endsWith('Percent')) {
    const currentBond = scarletBond[bondKey] || {}
    const flatLevel = (currentBond as any)[`${attr}Level`] || 0
    const flatData = scarletBondLevels.find(l => l.level === flatLevel)
    
    let flatBonus = 0
    if (!mainAttrs.has(attr)) {
      flatBonus = getOffSingle(flatLevel)
    } else if (bondData?.type === 'All') {
      flatBonus = flatData?.all || 0
    } else if (bondData?.type === 'Dual') {
      flatBonus = flatData?.dual || 0
    } else {
      flatBonus = flatData?.single || 0
    }
    
    const currentPercentBonus = currentLevel * (flatBonus / 100)
    const newPercentBonus = newLevel * (flatBonus / 100)
    return newPercentBonus - currentPercentBonus
  }
  
  return 0
}

export function calculateOptimalBondUpgrades(
  bondKey: string,
  availableAffinity: number,
  scarletBond: ScarletBondLevel
): BondUpgrade[] | null {
  const [lover, warden] = bondKey.split("-")
  const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
  const currentBond = scarletBond[bondKey] || {}
  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
  
  if (!wardenData || !bondData) {
    return null
  }
  
  const bondTypes: string[] = []
  wardenData.forEach(attr => {
    if (attr.toLowerCase() !== 'balance') {
      bondTypes.push(`${attr.toLowerCase()}Level`)
      bondTypes.push(`${attr.toLowerCase()}Percent`)
    }
  })
  
  if (wardenData.some(attr => attr === 'All')) {
    bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                  'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
  }
  
  if (wardenData.some(attr => attr === 'Balance')) {
    bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                  'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
  }
  
  const tempCurrentLevels: Record<string, number> = {}
  bondTypes.forEach(bondType => {
    tempCurrentLevels[bondType] = (currentBond as any)[bondType] || 0
  })
  
  const appliedUpgrades: BondUpgrade[] = []
  let remainingAffinity = availableAffinity
  
  let canAffordMore = true
  while (canAffordMore && remainingAffinity > 0) {
    canAffordMore = false
    const availableUpgrades: (BondUpgrade & { efficiency: number })[] = []
    
    bondTypes.forEach(bondType => {
      const tempLevel = tempCurrentLevels[bondType]
      if (tempLevel < 205) {
        const nextLevel = tempLevel + 1
        const levelData = scarletBondLevels.find(l => l.level === nextLevel)
        if (levelData) {
          let cost = 0
          if (bondData.type === 'All') {
            cost = levelData.all_affinity || 0
          } else if (bondData.type === 'Dual') {
            cost = levelData.dual_affinity || 0
          } else if (bondData.type === 'Single') {
            cost = levelData.affinity || 0
          } else {
            cost = levelData.affinity || 0
          }
          if (cost >= 0 && remainingAffinity >= cost) {
            let domGain = 0
            if (bondType.endsWith('Level')) {
              const currentData = scarletBondLevels.find(l => l.level === tempLevel)
              let currentBonus = 0
              let newBonus = 0
              if (bondData.type === 'All') {
                currentBonus = currentData?.all || 0
                newBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                currentBonus = currentData?.dual || 0
                newBonus = levelData.dual || 0
              } else {
                currentBonus = currentData?.single || 0
                newBonus = levelData.single || 0
              }
              domGain = newBonus - currentBonus
            } else {
              const attr = bondType.replace('Level', '').replace('Percent', '')
              const flatLevel = tempCurrentLevels[`${attr}Level`]
              const flatData = scarletBondLevels.find(l => l.level === flatLevel)
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = flatData?.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = flatData?.dual || 0
              } else {
                flatBonus = flatData?.single || 0
              }
              domGain = ((nextLevel - tempLevel) * flatBonus) / 100
            }
            availableUpgrades.push({
              bondType,
              currentLevel: tempLevel,
              newLevel: nextLevel,
              cost,
              domGain,
              efficiency: cost === 0 ? Infinity : domGain / cost
            })
          }
        }
      }
    })
    
    availableUpgrades.sort((a, b) => {
      if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
      if (a.cost === 0) return -1
      if (b.cost === 0) return 1
      return b.efficiency - a.efficiency
    })
    
    if (availableUpgrades.length > 0 && remainingAffinity >= availableUpgrades[0].cost) {
      const best = availableUpgrades[0]
      appliedUpgrades.push(best)
      tempCurrentLevels[best.bondType] = best.newLevel
      remainingAffinity -= best.cost
      canAffordMore = true
    }
  }
  
  return appliedUpgrades
}

export function calculateSuggestedUpgrades(
  bondKey: string,
  availableAffinity: number,
  scarletBond: ScarletBondLevel
): Record<string, { increase: number; newLevel: number; cost: number; domGain: number }> {
  const [lover, warden] = bondKey.split("-")
  const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
  const currentBond = scarletBond[bondKey] || {}
  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
  
  if (!wardenData || !bondData) {
    return {}
  }
  
  const bondTypes: string[] = []
  wardenData.forEach(attr => {
    if (attr.toLowerCase() !== 'balance') {
      bondTypes.push(`${attr.toLowerCase()}Level`)
      bondTypes.push(`${attr.toLowerCase()}Percent`)
    }
  })
  
  if (wardenData.some(attr => attr === 'All')) {
    bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                  'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
  }
  
  if (wardenData.some(attr => attr === 'Balance')) {
    bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                  'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
  }
  
  const upgrades: any[] = []
  bondTypes.forEach(bondType => {
    const currentLevel = (currentBond as any)[bondType] || 0
    if (currentLevel < 205) {
      const nextLevel = currentLevel + 1
      const levelData = scarletBondLevels.find(l => l.level === nextLevel)

      if (levelData) {
        let cost = 0
        if (bondData.type === 'All') {
          cost = levelData.all_affinity || 0
        } else if (bondData.type === 'Dual') {
          cost = levelData.dual_affinity || 0
        } else if (bondData.type === 'Single') {
          cost = levelData.affinity || 0
        } else {
          cost = levelData.affinity || 0
        }
        
        if (cost >= 0) {
          upgrades.push({
            bondType,
            currentLevel,
            newLevel: nextLevel,
            cost,
            domGain: calculateBondDomGain(bondType, currentLevel, nextLevel, bondKey, scarletBond)
          })
        }
      }
    }
  })
  
  upgrades.sort((a, b) => {
    if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
    if (a.cost === 0) return -1
    if (b.cost === 0) return 1
    return (b.domGain / b.cost) - (a.domGain / a.cost)
  })
  
  const suggestedUpgrades: Record<string, { increase: number; newLevel: number; cost: number; domGain: number }> = {}
  let remainingAffinity = availableAffinity
  
  const tempCurrentLevels: Record<string, number> = {}
  bondTypes.forEach(bondType => {
    tempCurrentLevels[bondType] = (currentBond as any)[bondType] || 0
  })
  
  let canAffordMore = true
  while (canAffordMore && remainingAffinity > 0) {
    canAffordMore = false
    
    const availableUpgrades: any[] = []
    bondTypes.forEach(bondType => {
      const tempCurrentLevel = tempCurrentLevels[bondType]
      if (tempCurrentLevel < 205) {
        const nextLevel = tempCurrentLevel + 1
        const levelData = scarletBondLevels.find(l => l.level === nextLevel)

        if (levelData) {
          let cost = 0
          if (bondData.type === 'All') {
            cost = levelData.all_affinity || 0
          } else if (bondData.type === 'Dual') {
            cost = levelData.dual_affinity || 0
          } else if (bondData.type === 'Single') {
            cost = levelData.affinity || 0
          } else {
            cost = levelData.affinity || 0
          }
          
          if (cost >= 0 && remainingAffinity >= cost) {
            const domGain = calculateBondDomGain(bondType, tempCurrentLevel, nextLevel, bondKey, scarletBond)
            availableUpgrades.push({
              bondType,
              currentLevel: tempCurrentLevel,
              newLevel: nextLevel,
              cost,
              domGain,
              efficiency: cost === 0 ? Infinity : domGain / cost
            })
          }
        }
      }
    })
    
    availableUpgrades.sort((a, b) => {
      if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
      if (a.cost === 0) return -1
      if (b.cost === 0) return 1
      return b.efficiency - a.efficiency
    })
    
    if (availableUpgrades.length > 0 && remainingAffinity >= availableUpgrades[0].cost) {
      const bestUpgrade = availableUpgrades[0]
      
      if (!suggestedUpgrades[bestUpgrade.bondType]) {
        suggestedUpgrades[bestUpgrade.bondType] = {
          increase: 0,
          newLevel: (currentBond as any)[bestUpgrade.bondType] || 0,
          cost: 0,
          domGain: 0
        }
      }
      
      suggestedUpgrades[bestUpgrade.bondType].increase += 1
      suggestedUpgrades[bestUpgrade.bondType].newLevel = bestUpgrade.newLevel
      suggestedUpgrades[bestUpgrade.bondType].cost += bestUpgrade.cost
      suggestedUpgrades[bestUpgrade.bondType].domGain += bestUpgrade.domGain
      
      tempCurrentLevels[bestUpgrade.bondType] = bestUpgrade.newLevel
      remainingAffinity -= bestUpgrade.cost
      canAffordMore = true
    }
  }
  
  return suggestedUpgrades
}
