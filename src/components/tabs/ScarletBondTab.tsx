"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getAttributeColor, getAttributeBg } from '@/utils/helpers'
import { scarletBondData, scarletBondLevels, getOffSingle } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'

const attributeOrder = ['strength', 'allure', 'intellect', 'spirit'] as const

export default function ScarletBondTab() {
  const {
    vipLevel,
    scarletBond, setScarletBond,
    scarletBondAffinity, setScarletBondAffinity,
    optimizedBondLevels,
    hasAgneyi, setHasAgneyi,
    hasCulann, setHasCulann,
    hasHela, setHasHela,
    inventory,
  } = useGameCalculator()

  const calculateScarletBondContribution = (bondKey: string, attribute: string) => {
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    if (!bondData) return { flatBonus: 0, percentBonus: 0, totalBonus: 0, loverMultiplier: 0 }

    const optimizedBond = optimizedBondLevels[bondKey] || currentBond
    let flatBonus = 0
    let percentBonus = 0

    const flatLevel = optimizedBond[`${attribute}Level`] || 0
    if (flatLevel > 0) {
      const levelData = scarletBondLevels.find(l => l.level === flatLevel)
      if (levelData) {
        if (bondData.type === 'All') flatBonus = levelData.all || 0
        else if (bondData.type === 'Dual') flatBonus = levelData.dual || 0
        else flatBonus = levelData.single || 0
      }
    }

    const percentLevel = optimizedBond[`${attribute}Percent`] || 0
    if (percentLevel > 0 && flatBonus > 0) {
      percentBonus = (percentLevel / 100) * flatBonus
    }

    let loverMultiplier = 1
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100

    if (attribute === 'strength' && canSummonAgneyi) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    } else if (attribute === 'intellect' && canSummonCulann) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    } else if (attribute === 'spirit' && canSummonHela) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    }

    const totalBonus = (flatBonus + percentBonus) * loverMultiplier
    return {
      flatBonus: Math.round(flatBonus),
      percentBonus: Math.round(percentBonus * 100) / 100,
      totalBonus: Math.round(totalBonus),
      loverMultiplier: Math.round((loverMultiplier - 1) * 100)
    }
  }

  const calculateBondDomGain = (bondType: string, currentLevel: number, newLevel: number, bondKey: string) => {
    const attr = bondType.replace('Level', '').replace('Percent', '')
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    const [, warden] = bondKey.split("-")
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
        currentBonus = currentData?.all || 0; newBonus = newData?.all || 0
      } else if (bondData?.type === 'Dual') {
        currentBonus = currentData?.dual || 0; newBonus = newData?.dual || 0
      } else {
        currentBonus = currentData?.single || 0; newBonus = newData?.single || 0
      }
      return newBonus - currentBonus
    } else if (bondType.endsWith('Percent')) {
      const currentBondData = scarletBond[bondKey] || {}
      const flatLevel = currentBondData[`${attr}Level`] || 0
      const flatData = scarletBondLevels.find(l => l.level === flatLevel)
      let flatBonus = 0
      if (!mainAttrs.has(attr)) flatBonus = getOffSingle(flatLevel)
      else if (bondData?.type === 'All') flatBonus = flatData?.all || 0
      else if (bondData?.type === 'Dual') flatBonus = flatData?.dual || 0
      else flatBonus = flatData?.single || 0
      return (newLevel * (flatBonus / 100)) - (currentLevel * (flatBonus / 100))
    }
    return 0
  }

  const calculateSuggestedUpgrades = (bondKey: string, availableAffinity: number) => {
    const [, warden] = bondKey.split("-")
    const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    if (!wardenData || !bondData) return {}

    const bondTypes: string[] = []
    wardenData.forEach(attr => {
      if (attr.toLowerCase() !== 'balance') {
        bondTypes.push(`${attr.toLowerCase()}Level`)
        bondTypes.push(`${attr.toLowerCase()}Percent`)
      }
    })
    if (wardenData.some(attr => attr === 'All') || wardenData.some(attr => attr === 'Balance')) {
      bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent',
        'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
    }

    const suggestedUpgrades: Record<string, any> = {}
    let remainingAffinity = availableAffinity
    const tempCurrentLevels: Record<string, number> = {}
    bondTypes.forEach(bt => { tempCurrentLevels[bt] = currentBond[bt] || 0 })

    let canAffordMore = true
    while (canAffordMore && remainingAffinity > 0) {
      canAffordMore = false
      const availableUpgrades: any[] = []
      bondTypes.forEach(bt => {
        const tempCurrentLevel = tempCurrentLevels[bt]
        if (tempCurrentLevel < 205) {
          const nextLevel = tempCurrentLevel + 1
          const levelData = scarletBondLevels.find(l => l.level === nextLevel)
          if (levelData) {
            let cost = 0
            if (bondData.type === 'All') cost = levelData.all_affinity || 0
            else if (bondData.type === 'Dual') cost = levelData.dual_affinity || 0
            else cost = levelData.affinity || 0
            if (cost >= 0 && remainingAffinity >= cost) {
              const domGain = calculateBondDomGain(bt, tempCurrentLevel, nextLevel, bondKey)
              availableUpgrades.push({
                bondType: bt, currentLevel: tempCurrentLevel, newLevel: nextLevel,
                cost, domGain, efficiency: cost === 0 ? Infinity : domGain / cost
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
        if (!suggestedUpgrades[best.bondType]) {
          suggestedUpgrades[best.bondType] = {
            increase: 0, newLevel: currentBond[best.bondType] || 0, cost: 0, domGain: 0
          }
        }
        suggestedUpgrades[best.bondType].increase += 1
        suggestedUpgrades[best.bondType].newLevel = best.newLevel
        suggestedUpgrades[best.bondType].cost += best.cost
        suggestedUpgrades[best.bondType].domGain += best.domGain
        tempCurrentLevels[best.bondType] = best.newLevel
        remainingAffinity -= best.cost
        canAffordMore = true
      }
    }
    return suggestedUpgrades
  }

  const calculateCurrentScarletBondBonuses = () => {
    let currentStrength = 0, currentAllure = 0, currentIntellect = 0, currentSpirit = 0

    Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
      if (!bond) return
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (!bondData) return
      const wardenAttrs = wardenAttributes[bondData.warden as keyof typeof wardenAttributes] || []

      const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
      const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
      const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length

      const processAttr = (attrKey: string, levelKey: string, percentKey: string, checker: string) => {
        if (!bond[levelKey] || bond[levelKey] <= 0) return 0
        const levelData = scarletBondLevels.find(l => l.level === bond[levelKey])
        if (!levelData) return 0
        let flatBonus = 0
        if (bondData.type === 'All') flatBonus = levelData.all || 0
        else if (bondData.type === 'Dual') flatBonus = levelData.dual || 0
        else flatBonus = levelData.single || 0
        let multiplier = 1.0
        if (wardenAttrs.includes(checker)) {
          if (loverCount === 1) multiplier = 1.2
          else if (loverCount === 2) multiplier = 1.25
          else if (loverCount === 3) multiplier = 1.3
        }
        let total = Math.round(flatBonus * multiplier)
        if (bond[percentKey] && bond[percentKey] > 0) {
          total += Math.round(((bond[percentKey] || 0) / 100) * flatBonus * multiplier)
        }
        return total
      }

      currentStrength += processAttr('strength', 'strengthLevel', 'strengthPercent', 'Strength')
      currentAllure += processAttr('allure', 'allureLevel', 'allurePercent', 'Allure')
      currentIntellect += processAttr('intellect', 'intellectLevel', 'intellectPercent', 'Intellect')
      currentSpirit += processAttr('spirit', 'spiritLevel', 'spiritPercent', 'Spirit')
    })

    return { currentStrength, currentAllure, currentIntellect, currentSpirit }
  }

  const calculateSuggestedScarletBondIncrease = () => {
    let increaseStrength = 0, increaseAllure = 0, increaseIntellect = 0, increaseSpirit = 0, increaseDom = 0

    Object.entries(scarletBondAffinity).forEach(([bondKey, affinity]) => {
      if (!affinity || affinity <= 0) return
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (!bondData) return
      const wardenAttrs = wardenAttributes[bondData.warden as keyof typeof wardenAttributes] || []
      const currentBond = scarletBond[bondKey]
      const suggestedUpgradesResult = calculateSuggestedUpgrades(bondKey, affinity)
      if (!currentBond) return

      ;['strength', 'allure', 'intellect', 'spirit'].forEach((attr) => {
        const isMainStat = wardenAttrs.some(a => a.toLowerCase() === attr || a.toLowerCase() === "balance")
        if (!isMainStat) return
        const flatSuggestion = suggestedUpgradesResult[`${attr}Level`]
        const percentSuggestion = suggestedUpgradesResult[`${attr}Percent`]
        let totalIncrease = 0
        if (flatSuggestion?.increase > 0) totalIncrease += flatSuggestion.domGain || 0
        if (percentSuggestion?.increase > 0) totalIncrease += percentSuggestion.domGain || 0
        if (totalIncrease > 0) {
          if (attr === 'strength') increaseStrength += totalIncrease
          else if (attr === 'allure') increaseAllure += totalIncrease
          else if (attr === 'intellect') increaseIntellect += totalIncrease
          else if (attr === 'spirit') increaseSpirit += totalIncrease
          increaseDom += totalIncrease
        }
      })
    })

    return { increaseStrength, increaseAllure, increaseIntellect, increaseSpirit, increaseDom }
  }

  const calculateOptimizedScarletBondBonuses = () => {
    let optimizedStrength = 0, optimizedAllure = 0, optimizedIntellect = 0, optimizedSpirit = 0

    Object.entries(optimizedBondLevels).forEach(([bondKey, optimizedBond]: [string, any]) => {
      if (!optimizedBond) return
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (!bondData) return

      const processAttr = (levelKey: string, percentKey: string) => {
        const level = optimizedBond[levelKey] || 0
        if (level <= 0) return 0
        const levelData = scarletBondLevels.find(l => l.level === level)
        if (!levelData) return 0
        let flatBonus = 0
        if (bondData.type === 'All') flatBonus = levelData.all || 0
        else if (bondData.type === 'Dual') flatBonus = levelData.dual || 0
        else flatBonus = levelData.single || 0
        let result = flatBonus
        if (optimizedBond[percentKey] && optimizedBond[percentKey] > 0) {
          result += ((optimizedBond[percentKey] || 0) / 100) * flatBonus
        }
        return result
      }

      optimizedStrength += processAttr('strengthLevel', 'strengthPercent')
      optimizedAllure += processAttr('allureLevel', 'allurePercent')
      optimizedIntellect += processAttr('intellectLevel', 'intellectPercent')
      optimizedSpirit += processAttr('spiritLevel', 'spiritPercent')
    })

    return { optimizedStrength, optimizedAllure, optimizedIntellect, optimizedSpirit }
  }

  const currentScarletBondBonuses = calculateCurrentScarletBondBonuses()
  const suggestedIncrease = calculateSuggestedScarletBondIncrease()
  const optimizedBonuses = calculateOptimizedScarletBondBonuses()

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-red-400">Scarlet Bond</CardTitle>
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-3 mt-4">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-400 font-bold text-sm">⚠️ PSA:</div>
            <div className="text-yellow-200 text-sm">
              Most numbers past level 100 are not 100% accurate yet. We're still collecting and verifying data for higher levels.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lovers Section */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-pink-400">Lovers (Need to be Summoned)</CardTitle>
              <div className="text-sm text-gray-300">
                Select which lovers you have summoned. Each increases ALL lover scarlet bond bonuses for their attribute.
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="agneyi" checked={hasAgneyi} onCheckedChange={setHasAgneyi} className="border-gray-400" />
                  <Label htmlFor="agneyi" className="text-red-400 font-medium">Agneyi (Strength Scarlet Bond Aura)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="culann" checked={hasCulann} onCheckedChange={setHasCulann} className="border-gray-400" />
                  <Label htmlFor="culann" className="text-green-400 font-medium">Culann (Intellect Scarlet Bond Aura)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hela" checked={hasHela} onCheckedChange={setHasHela} className="border-gray-400" />
                  <Label htmlFor="hela" className="text-blue-400 font-medium">Hela (Spirit Scarlet Bond Aura)</Label>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Summonable with Coins</span>
              </div>
              <div className="mt-4 p-3 bg-gray-600/50 rounded">
                <div className="text-sm text-gray-300">
                  <strong>Lover Aura System:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>1 Lover: +20% to ALL lover scarlet bond bonuses for their attribute</li>
                    <li>2 Lovers: +25% to ALL lover scarlet bond bonuses for their attributes</li>
                    <li>3 Lovers: +30% to ALL lover scarlet bond bonuses for their attributes</li>
                  </ul>
                </div>
                <div className="text-sm text-yellow-400 mt-2">
                  Currently: {[hasAgneyi, hasCulann, hasHela].filter(Boolean).length}/3 lovers summoned
                  {(() => {
                    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
                    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
                    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
                    const tokenSummoned = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                    const checkboxSummoned = [hasAgneyi, hasCulann, hasHela].filter(Boolean).length
                    if (tokenSummoned > checkboxSummoned) {
                      return <div className="text-green-400 text-xs mt-1">(Can summon {tokenSummoned - checkboxSummoned} more with tokens)</div>
                    }
                    return null
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scarlet Bond Totals Summary */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-orange-400">Scarlet Bond Totals</CardTitle>
              <div className="text-sm text-gray-300">Current bonuses from your scarlet bond levels</div>
              {suggestedIncrease.increaseDom > 0 && (
                <div className="text-green-400 text-sm font-bold mt-2">
                  Total DOM from suggestions: +{suggestedIncrease.increaseDom.toLocaleString()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {attributeOrder.map((attr) => (
                  <div key={attr} className={`p-3 rounded ${getAttributeBg(attr)}`}>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${getAttributeColor(attr)} capitalize`}>{attr}</div>
                      <div className="text-white font-medium">
                        {currentScarletBondBonuses[`current${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof currentScarletBondBonuses]?.toLocaleString() || 0}
                        {optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses] > 0 && (
                          <span className="text-green-400 ml-2">
                            +{optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses].toLocaleString()}
                          </span>
                        )}
                        {suggestedIncrease[`increase${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof suggestedIncrease] > 0 && (
                          <div className="text-green-400 text-sm mt-1 font-bold">
                            [+{suggestedIncrease[`increase${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof suggestedIncrease].toLocaleString()} from suggestions]
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {scarletBondData
            .filter((bond) => bond.vip <= vipLevel)
            .map((bond) => {
              const wardenData = wardenAttributes[bond.warden as keyof typeof wardenAttributes]
              const bondKey = `${bond.lover}-${bond.warden}`
              return (
                <Card key={bondKey} className="bg-gray-700/50 border-gray-600">
                  <div className="flex">
                    {/* Lover Images - Left Side */}
                    <div className="w-56 h-80 flex-shrink-0 flex">
                      {(() => {
                        if (bond.lover.includes('/')) {
                          const names = bond.lover.split('/').map(s => s.trim())
                          const sameName = names[0].toLowerCase() === names[1].toLowerCase()
                          if (sameName) {
                            return names.map((name, index) => {
                              const base = name.toLowerCase()
                              const genderSuffix = index === 0 ? 'female' : 'male'
                              const imageName = `${base}${genderSuffix}`
                              return (
                                <div key={`${name}-${index}`} className="w-1/2 h-full flex items-center justify-center">
                                  <img src={`/Gov/Lovers/BaseLovers/${imageName}.png`} alt={name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement
                                      if (!img.src.includes('.PNG')) img.src = `/Gov/Lovers/BaseLovers/${imageName}.PNG`
                                      else img.style.display = 'none'
                                    }} />
                                </div>
                              )
                            })
                          }
                          return names.map((name) => (
                            <div key={name} className="w-1/2 h-full flex items-center justify-center">
                              <img src={`/Gov/Lovers/BaseLovers/${name}.PNG`} alt={name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement
                                  if (!img.src.includes('.png')) img.src = `/Gov/Lovers/BaseLovers/${name}.png`
                                  else img.style.display = 'none'
                                }} />
                            </div>
                          ))
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <img src={`/Gov/Lovers/BaseLovers/${bond.lover}.PNG`} alt={bond.lover}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                if (!img.src.includes('.png')) img.src = `/Gov/Lovers/BaseLovers/${bond.lover}.png`
                                else if (!img.src.includes('.jpg')) img.src = `/Gov/Lovers/BaseLovers/${bond.lover}.jpg`
                                else if (!img.src.includes('_')) img.src = `/Gov/Lovers/BaseLovers/${bond.lover.replace(/([A-Z])/g, '_$1').toLowerCase()}.PNG`
                                else img.style.display = 'none'
                              }} />
                          </div>
                        )
                      })()}
                    </div>

                    {/* Content - Right Side */}
                    <div className="flex-1 min-w-0">
                      <CardHeader className="pb-0 pt-2">
                        <CardTitle className="flex items-center gap-1 flex-wrap text-xs">
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col gap-0">
                              <span className="text-white text-xs font-bold">{bond.lover}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-300 text-xs">with</span>
                                <span className="text-white font-semibold text-xs">{bond.warden}</span>
                                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                  <img src={`/Gov/Wardens/BaseWardens/${bond.warden}.png`} alt={bond.warden}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            bond.type === "All" ? "bg-yellow-500/20 text-yellow-400"
                            : bond.type === "Dual" ? "bg-purple-500/20 text-purple-400"
                            : "bg-blue-500/20 text-blue-400"
                          }`}>{bond.type}</span>
                          {bond.vip === 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Summonable</span>
                          )}
                          {wardenData && (
                            <div className="flex gap-1">
                              {wardenData.map((attr) => (
                                <span key={attr} className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}>{attr}</span>
                              ))}
                            </div>
                          )}
                          <div className="ml-auto flex flex-col gap-2">
                            <Label className="text-white text-sm">Affinity Points</Label>
                            <Input
                              type="number"
                              value={scarletBondAffinity[bondKey] || 0}
                              onChange={(e) => setScarletBondAffinity((prev) => ({
                                ...prev, [bondKey]: Number.parseInt(e.target.value) || 0
                              }))}
                              className="w-24 bg-gray-600 border-gray-500 text-white text-sm"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-400">Suggestions shown automatically</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-2">
                        <div className="grid grid-cols-8 gap-2">
                          {["strength", "allure", "intellect", "spirit"].map((attr) => {
                            const isMainStat = wardenData?.some((a) => a.toLowerCase() === attr || a === "Balance")
                            const suggestedUpgradesResult = calculateSuggestedUpgrades(bondKey, scarletBondAffinity[bondKey] || 0)
                            const flatSuggestion = isMainStat ? suggestedUpgradesResult[`${attr}Level`] : null
                            const percentSuggestion = isMainStat ? suggestedUpgradesResult[`${attr}Percent`] : null
                            const contribution = calculateScarletBondContribution(bondKey, attr)
                            return (
                              <div key={attr} className="col-span-2">
                                <div className="text-center mb-1">
                                  <div className={`text-sm font-bold ${getAttributeColor(attr)}`}>{contribution.totalBonus}</div>
                                  <div className="text-xs text-gray-400 capitalize">{attr}</div>
                                </div>
                                <div>
                                  <Label className={`capitalize text-xs ${getAttributeColor(attr)}`}>{attr} Flat</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number" min="0" max="205"
                                      value={(scarletBond[bondKey] as any)?.[`${attr}Level`] || 0}
                                      onChange={(e) => setScarletBond((prev) => ({
                                        ...prev, [bondKey]: { ...prev[bondKey], [`${attr}Level`]: Number.parseInt(e.target.value) || 0 }
                                      }))}
                                      className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                      placeholder="Level"
                                    />
                                    {flatSuggestion && (
                                      <div className="text-xs text-green-400">+{flatSuggestion.increase} ({flatSuggestion.newLevel})</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label className={`capitalize text-xs ${getAttributeColor(attr)}`}>{attr} %</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number" min="0" max="205"
                                      value={(scarletBond[bondKey] as any)?.[`${attr}Percent`] || 0}
                                      onChange={(e) => setScarletBond((prev) => ({
                                        ...prev, [bondKey]: { ...prev[bondKey], [`${attr}Percent`]: Number.parseInt(e.target.value) || 0 }
                                      }))}
                                      className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                      placeholder="%"
                                    />
                                    {percentSuggestion && (
                                      <div className="text-xs text-green-400">+{percentSuggestion.increase} ({percentSuggestion.newLevel})</div>
                                    )}
                                  </div>
                                </div>
                                {contribution.loverMultiplier > 0 && (
                                  <div className="text-center mt-1">
                                    <div className="text-xs text-orange-400">+{contribution.loverMultiplier}% lover bonus</div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
