"use client"

import { useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getAttributeColor, getAttributeBg } from '@/utils/helpers'
import { scarletBondData, scarletBondLevels, getOffSingle } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier, wildHuntSummonedCount, monsterNoirSummonedCount, tierPercentFromCount } from '@/utils/loverScarletBondAuras'
import { getLoverPortraitSrcs } from '@/utils/loverImagePaths'

const attributeOrder = ['strength', 'allure', 'intellect', 'spirit'] as const

function LoverPortraitThumb({
  candidates,
  label,
  imgClassName,
  emptyClassName,
}: {
  candidates: string[]
  label: string
  imgClassName?: string
  emptyClassName?: string
}) {
  const [idx, setIdx] = useState(0)
  const imgCls = imgClassName ?? 'w-14 h-14 rounded object-cover border border-gray-600'
  const emptyCls = emptyClassName ?? 'w-14 h-14 rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-[9px] text-gray-400 text-center p-1'
  if (idx >= candidates.length) {
    return <div className={emptyCls}>{label}</div>
  }
  return (
    <img
      src={candidates[idx]}
      alt={label}
      className={imgCls}
      onError={() => setIdx((i) => i + 1)}
    />
  )
}

export default function ScarletBondTab() {
  const {
    vipLevel,
    scarletBond, setScarletBond,
    scarletBondAffinity, setScarletBondAffinity,
    optimizedBondLevels,
    hasAgneyi, setHasAgneyi,
    hasCulann, setHasCulann,
    hasHela, setHasHela,
    hasDionysus, setHasDionysus,
    hasMaya, setHasMaya,
    hasEmber, setHasEmber,
    hasAsh, setHasAsh,
    hasNyx,
    inventory,
  } = useGameCalculator()

  const summonState = resolveLoverSummonFlags(
    { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
    hasNyx,
    inventory
  )

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

    const s = resolveLoverSummonFlags(
      { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
      hasNyx,
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

      const s = resolveLoverSummonFlags(
        { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
        hasNyx,
        inventory
      )

      const processAttr = (attrKey: 'strength' | 'allure' | 'intellect' | 'spirit', levelKey: string, percentKey: string) => {
        if (!bond[levelKey] || bond[levelKey] <= 0) return 0
        const levelData = scarletBondLevels.find(l => l.level === bond[levelKey])
        if (!levelData) return 0
        let flatBonus = 0
        if (bondData.type === 'All') flatBonus = levelData.all || 0
        else if (bondData.type === 'Dual') flatBonus = levelData.dual || 0
        else flatBonus = levelData.single || 0
        const multiplier = getLoverScarletBondAuraMultiplier(attrKey, s)
        let total = Math.round(flatBonus * multiplier)
        if (bond[percentKey] && bond[percentKey] > 0) {
          total += Math.round(((bond[percentKey] || 0) / 100) * flatBonus * multiplier)
        }
        return total
      }

      currentStrength += processAttr('strength', 'strengthLevel', 'strengthPercent')
      currentAllure += processAttr('allure', 'allureLevel', 'allurePercent')
      currentIntellect += processAttr('intellect', 'intellectLevel', 'intellectPercent')
      currentSpirit += processAttr('spirit', 'spiritLevel', 'spiritPercent')
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
                Wild Hunt and Monster Noir tiers are <strong>independent</strong>: 1/2/3/4 lovers in a set → 20%/25%/30%/35% to scarlet bonds for that set&apos;s attributes.
                Ember/Ash (with Nyx) add up to +25% on <strong>all four</strong> attributes.
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-xs font-semibold text-green-300 mb-2">Wild Hunt (Rudra / Woden / Artemis / Finn)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { id: 'agneyi', label: 'Agneyi', sub: 'Rudra · Str', checked: hasAgneyi, set: setHasAgneyi, color: 'text-red-300' },
                    { id: 'hela', label: 'Hela', sub: 'Woden · Allure', checked: hasHela, set: setHasHela, color: 'text-pink-300' },
                    { id: 'dionysus', label: 'Dionysus', sub: 'Artemis · Int', checked: hasDionysus, set: setHasDionysus, color: 'text-cyan-300' },
                    { id: 'culann', label: 'Culann', sub: 'Finn · Spirit', checked: hasCulann, set: setHasCulann, color: 'text-green-300' },
                  ] as const).map((row) => (
                    <div key={row.id} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-800/60 border border-gray-600/80">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={row.id}
                          checked={row.checked}
                          onCheckedChange={(v) => row.set(v === true)}
                          className="border-gray-400 mt-1"
                        />
                        <div className="min-w-0">
                          <Label htmlFor={row.id} className={`${row.color} font-medium text-sm`}>{row.label}</Label>
                          <div className="text-[10px] text-gray-500">{row.sub}</div>
                        </div>
                      </div>
                      <LoverPortraitThumb candidates={getLoverPortraitSrcs(row.label).flat()} label={row.label} />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Wild Hunt tier: {tierPercentFromCount(wildHuntSummonedCount(summonState))}% (from {wildHuntSummonedCount(summonState)}/4 summoned)
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-purple-300 mb-2">Monster Noir (Grendel line — more coming)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-800/60 border border-gray-600/80">
                    <div className="flex items-start gap-2">
                      <Checkbox id="maya" checked={hasMaya} onCheckedChange={(v) => setHasMaya(v === true)} className="border-gray-400 mt-1" />
                      <div>
                        <Label htmlFor="maya" className="text-purple-200 font-medium text-sm">Maya</Label>
                        <div className="text-[10px] text-gray-500">Grendel · Spirit</div>
                      </div>
                    </div>
                    <LoverPortraitThumb candidates={getLoverPortraitSrcs('Maya').flat()} label="Maya" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Monster Noir tier: {tierPercentFromCount(monsterNoirSummonedCount(summonState))}% (from {monsterNoirSummonedCount(summonState)}/4 — only Maya in data for now)
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-amber-300 mb-2">Nyx · Ember / Ash</div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-800/60 border border-gray-600/80">
                    <div className="flex items-start gap-2">
                      <Checkbox id="ember" checked={hasEmber} onCheckedChange={(v) => setHasEmber(v === true)} className="border-gray-400 mt-1" />
                      <Label htmlFor="ember" className="text-amber-200 font-medium text-sm">Ember</Label>
                    </div>
                    <LoverPortraitThumb candidates={getLoverPortraitSrcs('Ember').flat()} label="Ember" />
                  </div>
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-800/60 border border-gray-600/80">
                    <div className="flex items-start gap-2">
                      <Checkbox id="ash" checked={hasAsh} onCheckedChange={(v) => setHasAsh(v === true)} className="border-gray-400 mt-1" />
                      <Label htmlFor="ash" className="text-amber-200 font-medium text-sm">Ash</Label>
                    </div>
                    <LoverPortraitThumb candidates={getLoverPortraitSrcs('Ash').flat()} label="Ash" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Requires <strong>Nyx</strong> unlocked + both lovers for +25% on Str/Allure/Int/Spirit scarlet bonds.</div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Many summonable with coins / tokens</span>
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
                      {getLoverPortraitSrcs(bond.lover).map((candidates, idx, arr) => (
                        <div
                          key={idx}
                          className={`${arr.length > 1 ? 'w-1/2' : 'w-full'} h-full flex items-center justify-center p-1`}
                        >
                          <LoverPortraitThumb
                            candidates={candidates}
                            label={bond.lover}
                            imgClassName="w-full h-full object-contain max-h-80"
                            emptyClassName="w-full min-h-[120px] rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] text-gray-400 text-center p-2"
                          />
                        </div>
                      ))}
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
