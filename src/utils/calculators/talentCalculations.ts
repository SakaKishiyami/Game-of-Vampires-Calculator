// Talent calculation functions
import type { DomIncreasePerStar } from '@/types'
import { domIncreasePerStarData } from '@/data/talent_stars'

export interface ScriptResult {
  selectedStar: number
  quantity: number
  wardenLevel: number
}

export function calculateScriptResults(script: ScriptResult): number {
  if (script.selectedStar === 0 || script.quantity === 0) {
    return 0
  }
  
  const successRates = [1.0, 0.833, 0.666, 0.5, 0.333, 0.166]
  const rate = successRates[script.selectedStar - 1]
  const successfulUpgrades = script.quantity * rate
  return successfulUpgrades * script.selectedStar
}

export function getStarBonus(wardenLevel: number, starCount: number): number {
  const levelData = domIncreasePerStarData.find(data => wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1]
  return levelData.constant * starCount
}

export function calculateDomGainPerStar(
  level: number,
  domIncreasePerStar: DomIncreasePerStar,
  auras: any
): number {
  const data = domIncreasePerStarData.find(d => d.level === level)
  if (!data) return 0
  
  const totalStrength = data.constant * domIncreasePerStar.currentStrengthStars * auras.wildHunt.Rudra.baseValue
  const totalAllure = data.constant * domIncreasePerStar.currentAllureStars * auras.wildHunt.Woden.baseValue
  const totalIntellect = data.constant * domIncreasePerStar.currentIntellectStars * auras.wildHunt.Artemis.baseValue
  const totalSpirit = data.constant * domIncreasePerStar.currentSpiritStars * auras.wildHunt.Finn.baseValue
  const totalDomGain = totalStrength + totalAllure + totalIntellect + totalSpirit
  return totalDomGain
}

export function calculateTalentScrollStars(talentScrolls: any): number {
  const totalExp = 
    (talentScrolls.randomTalentScroll?.count || 0) * (talentScrolls.randomTalentScroll?.exp || 0) +
    (talentScrolls.talentScrollLvl4?.count || 0) * (talentScrolls.talentScrollLvl4?.exp || 0) +
    (talentScrolls.talentScrollLvl3?.count || 0) * (talentScrolls.talentScrollLvl3?.exp || 0) +
    (talentScrolls.talentScrollLvl2?.count || 0) * (talentScrolls.talentScrollLvl2?.exp || 0) +
    (talentScrolls.talentScrollLvl1?.count || 0) * (talentScrolls.talentScrollLvl1?.exp || 0) +
    (talentScrolls.basicTalentScroll?.count || 0) * (talentScrolls.basicTalentScroll?.exp || 0) +
    (talentScrolls.fineTalentScroll?.count || 0) * (talentScrolls.fineTalentScroll?.exp || 0) +
    (talentScrolls.superiorTalentScroll?.count || 0) * (talentScrolls.superiorTalentScroll?.exp || 0)
  
  return Math.floor(totalExp / 200)
}
