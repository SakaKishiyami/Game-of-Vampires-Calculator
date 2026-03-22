"use client"

import { useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getAttributeColor, getAttributeBg, nonNegativeIntInputProps } from '@/utils/helpers'
import { scarletBondData, scarletBondLevels, getOffSingle } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier, wildHuntSummonedCount, monsterNoirSummonedCount, tierPercentFromCount, heartOfWarCount } from '@/utils/loverScarletBondAuras'
import { getLoverPortraitSrcs } from '@/utils/loverImagePaths'
import { cn } from '@/lib/utils'

const attributeOrder = ['strength', 'allure', 'intellect', 'spirit'] as const

function getAttributeRingClass(attr: string): string {
  switch (attr.toLowerCase()) {
    case 'strength': return 'ring-red-500'
    case 'allure': return 'ring-purple-500'
    case 'intellect': return 'ring-green-500'
    case 'spirit': return 'ring-blue-500'
    case 'all': return 'ring-amber-400'
    default: return 'ring-gray-500'
  }
}

type LoverAttr = 'strength' | 'allure' | 'intellect' | 'spirit' | 'all'

function LoverSummonPickCard({
  loverName,
  wardenName,
  attrKey,
  imgCandidates,
  checked,
  setChecked,
  tokenHint,
}: {
  loverName: string
  wardenName: string
  attrKey: LoverAttr
  imgCandidates: string[]
  checked: boolean
  setChecked: (v: boolean) => void
  tokenHint: string
}) {
  const ring = getAttributeRingClass(attrKey)
  const toggle = () => setChecked(!checked)
  const attrBadge =
    attrKey === 'all' ? (
      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200">All attributes</span>
    ) : (
      <span className={`text-xs px-2 py-0.5 rounded capitalize ${getAttributeBg(attrKey)} ${getAttributeColor(attrKey)}`}>
        {attrKey}
      </span>
    )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
      className={cn(
        'flex items-stretch rounded-lg overflow-hidden border min-h-[118px] cursor-pointer transition-all select-none text-left w-full',
        checked
          ? cn('ring-2 ring-offset-2 ring-offset-gray-900 border-transparent', ring, attrKey === 'all' ? 'bg-amber-500/15' : '')
          : 'border-gray-600 bg-gray-800/40 hover:bg-gray-800/70',
        checked && attrKey !== 'all' && getAttributeBg(attrKey)
      )}
    >
      <div className="w-[100px] sm:w-[112px] flex-shrink-0 bg-gray-900/90 flex items-center justify-center p-2 border-r border-gray-700/80">
        <LoverPortraitThumb
          candidates={imgCandidates}
          label={loverName}
          imgClassName="w-full h-full min-h-[100px] max-h-[120px] object-contain"
          emptyClassName="w-full min-h-[100px] rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 text-center p-2"
        />
      </div>
      <div className="flex-1 flex items-stretch p-3 min-w-0 gap-2">
        <div onClick={(e) => e.stopPropagation()} className="shrink-0 pt-0.5">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="border-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 justify-center">
          <span className={cn('font-semibold text-sm leading-tight', checked ? 'text-white' : 'text-gray-400')}>{loverName}</span>
          <span className="text-sm text-gray-300 leading-tight">{wardenName}</span>
          <div className="flex flex-wrap gap-1">{attrBadge}</div>
          <span className="text-[10px] text-gray-500 leading-snug">{tokenHint}</span>
        </div>
      </div>
    </div>
  )
}

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
    inventory,
  } = useGameCalculator()

  const summonState = resolveLoverSummonFlags(
    { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
    inventory
  )

  const calculateScarletBondContribution = (bondKey: string, attribute: string) => {
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    if (!bondData) return { flatBonus: 0, percentBonus: 0, totalBonus: 0, loverMultiplier: 0 }

    const optimizedBond = (optimizedBondLevels[bondKey] || currentBond) as Record<string, number | undefined>
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
      const currentBondData = (scarletBond[bondKey] || {}) as Record<string, number | undefined>
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
    const currentBondNum = currentBond as Record<string, number | undefined>
    bondTypes.forEach((bt) => {
      tempCurrentLevels[bt] = currentBondNum[bt] || 0
    })

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
            increase: 0,
            newLevel: currentBondNum[best.bondType] || 0,
            cost: 0,
            domGain: 0,
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
              Most numbers past level 100 are not 100% accurate yet. We&apos;re still collecting and verifying data for higher levels.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lovers Section */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-pink-400">Lovers (Need to be Summoned)</CardTitle>
              <p className="text-xs text-gray-500">
                Click a row to toggle. Wild Hunt tier {tierPercentFromCount(wildHuntSummonedCount(summonState))}% · Monster Noir tier{' '}
                {tierPercentFromCount(monsterNoirSummonedCount(summonState))}%
              </p>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div>
                <div className="text-xs font-semibold text-green-300 mb-3">Wild Hunt (Rudra / Woden / Artemis / Finn)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <LoverSummonPickCard
                    loverName="Agneyi"
                    wardenName="Rudra"
                    attrKey="strength"
                    imgCandidates={getLoverPortraitSrcs('Agneyi').flat()}
                    checked={hasAgneyi}
                    setChecked={setHasAgneyi}
                    tokenHint={`AgneyiToken in inventory: ${inventory['AgneyiToken']?.count ?? 0}/100`}
                  />
                  <LoverSummonPickCard
                    loverName="Hela"
                    wardenName="Woden"
                    attrKey="allure"
                    imgCandidates={getLoverPortraitSrcs('Hela').flat()}
                    checked={hasHela}
                    setChecked={setHasHela}
                    tokenHint={`HelaToken in inventory: ${inventory['HelaToken']?.count ?? 0}/100`}
                  />
                  <LoverSummonPickCard
                    loverName="Dionysus"
                    wardenName="Artemis"
                    attrKey="intellect"
                    imgCandidates={getLoverPortraitSrcs('Dionysus').flat()}
                    checked={hasDionysus}
                    setChecked={setHasDionysus}
                    tokenHint={`DionysusToken in inventory: ${inventory['DionysusToken']?.count ?? 0}/100`}
                  />
                  <LoverSummonPickCard
                    loverName="Culann"
                    wardenName="Finn"
                    attrKey="spirit"
                    imgCandidates={getLoverPortraitSrcs('Culann').flat()}
                    checked={hasCulann}
                    setChecked={setHasCulann}
                    tokenHint={`CulannToken in inventory: ${inventory['CulannToken']?.count ?? 0}/100`}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-purple-300 mb-3">Monster Noir</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <LoverSummonPickCard
                    loverName="Maya"
                    wardenName="Grendel"
                    attrKey="spirit"
                    imgCandidates={getLoverPortraitSrcs('Maya').flat()}
                    checked={hasMaya}
                    setChecked={setHasMaya}
                    tokenHint={`MayaToken in inventory: ${inventory['MayaToken']?.count ?? 0}/100`}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-amber-300 mb-3">Ember / Ash</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                  <LoverSummonPickCard
                    loverName="Ember"
                    wardenName="Nyx"
                    attrKey="all"
                    imgCandidates={getLoverPortraitSrcs('Ember').flat()}
                    checked={hasEmber}
                    setChecked={setHasEmber}
                    tokenHint={`Heart of War tokens: ${heartOfWarCount(inventory)}/400 (counts toward both). PNG name may change later.`}
                  />
                  <LoverSummonPickCard
                    loverName="Ash"
                    wardenName="Nyx"
                    attrKey="all"
                    imgCandidates={getLoverPortraitSrcs('Ash').flat()}
                    checked={hasAsh}
                    setChecked={setHasAsh}
                    tokenHint={`Heart of War tokens: ${heartOfWarCount(inventory)}/400 (counts toward both). PNG name may change later.`}
                  />
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
                              className="w-24 bg-gray-600 border-gray-500 text-white text-sm"
                              placeholder="0"
                              {...nonNegativeIntInputProps(scarletBondAffinity[bondKey] || 0, (n) =>
                                setScarletBondAffinity((prev) => ({ ...prev, [bondKey]: n }))
                              )}
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
                                      className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                      placeholder="Level"
                                      {...nonNegativeIntInputProps((scarletBond[bondKey] as any)?.[`${attr}Level`] || 0, (n) =>
                                        setScarletBond((prev) => ({
                                          ...prev,
                                          [bondKey]: {
                                            ...prev[bondKey],
                                            [`${attr}Level`]: Math.min(205, Math.max(0, n)),
                                          },
                                        }))
                                      )}
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
                                      className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                      placeholder="%"
                                      {...nonNegativeIntInputProps((scarletBond[bondKey] as any)?.[`${attr}Percent`] || 0, (n) =>
                                        setScarletBond((prev) => ({
                                          ...prev,
                                          [bondKey]: {
                                            ...prev[bondKey],
                                            [`${attr}Percent`]: Math.min(205, Math.max(0, n)),
                                          },
                                        }))
                                      )}
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
