// Courtyard calculation functions
import type { CourtyardState } from '@/types'
import { courtyardLevels } from '@/data/courtyard'

export interface CourtyardDomResult {
  strength: number
  allure: number
  intellect: number
  spirit: number
}

export function calculateMaxCourtyardLevel(courtyard: CourtyardState): number {
  let availablePoints = courtyard.currentPoints
  let currentLevel = courtyard.currentLevel

  for (let i = currentLevel - 1; i < courtyardLevels.length; i++) {
    const nextLevel = courtyardLevels[i]
    if (availablePoints >= nextLevel.cost) {
      availablePoints -= nextLevel.cost
      currentLevel = nextLevel.level
    } else {
      break
    }
  }

  return currentLevel
}

export function calculateCourtyardDom(
  courtyard: CourtyardState,
  projectedLevel: number
): CourtyardDomResult {
  let strength = 0
  let allure = 0
  let intellect = 0
  let spirit = 0

  // Calculate DOM from current level to projected level
  for (let level = courtyard.currentLevel; level < projectedLevel; level++) {
    let levelType = "single"
    let targetAttributes: string[] = []
    
    if (level % 7 === 0) {
      levelType = "all"
      targetAttributes = ["strength", "allure", "intellect", "spirit"]
    } else if (level % 7 === 5 || level % 7 === 6) {
      levelType = "dual"
      if (level % 7 === 5) {
        targetAttributes = ["strength", "intellect"]
      } else {
        targetAttributes = ["allure", "spirit"]
      }
    } else {
      levelType = "single"
      const singleLevel = level % 7
      if (singleLevel === 1) targetAttributes = ["strength"]
      else if (singleLevel === 2) targetAttributes = ["allure"]
      else if (singleLevel === 3) targetAttributes = ["intellect"]
      else if (singleLevel === 4) targetAttributes = ["spirit"]
    }

    // Get points for this level from courtyardLevels data
    const levelData = courtyardLevels.find(l => l.level === level + 1)
    if (!levelData) continue
    
    const points = levelData.points

    targetAttributes.forEach(attr => {
      if (attr === "strength") strength += points
      if (attr === "allure") allure += points
      if (attr === "intellect") intellect += points
      if (attr === "spirit") spirit += points
    })
  }

  return { strength, allure, intellect, spirit }
}
