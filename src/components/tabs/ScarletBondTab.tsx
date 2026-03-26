"use client"

import { useState, useEffect } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getAttributeColor, getAttributeBg, nonNegativeIntInputProps } from '@/utils/helpers'
import { scarletBondData, scarletBondLevels, getOffSingle } from '@/data/scarletBonds'
import { wardenAttributes } from '@/data/wardens'
import { resolveLoverSummonFlags, getLoverScarletBondAuraMultiplier, wildHuntSummonedCount, monsterNoirSummonedCount, tierPercentFromCount, heartOfWarCount } from '@/utils/loverScarletBondAuras'
import { getLoverPortraitSrcs, getLoverSkinSlots } from '@/utils/loverImagePaths'
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
  tokenCount,
  tokenMax,
  tokenImgSrc,
}: {
  loverName: string
  wardenName: string
  attrKey: LoverAttr
  imgCandidates: string[]
  checked: boolean
  setChecked: (v: boolean) => void
  tokenCount: number
  tokenMax: number
  tokenImgSrc: string | null
}) {
  const ring = getAttributeRingClass(attrKey)
  const toggle = () => setChecked(!checked)
  const attrBadge =
    attrKey === 'all' ? (
      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 whitespace-nowrap">All attrs</span>
    ) : (
      <span className={`text-xs px-1.5 py-0.5 rounded capitalize whitespace-nowrap ${getAttributeBg(attrKey)} ${getAttributeColor(attrKey)}`}>
        {attrKey}
      </span>
    )

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
      }}
      className={cn(
        'flex items-stretch rounded-lg overflow-hidden border cursor-pointer transition-all select-none text-left w-full',
        checked
          ? cn('ring-2 ring-offset-2 ring-offset-gray-900 border-transparent', ring, attrKey === 'all' ? 'bg-amber-500/15' : '')
          : 'border-gray-600 bg-gray-800/40 hover:bg-gray-800/70',
        checked && attrKey !== 'all' && getAttributeBg(attrKey)
      )}
    >
      <div className="w-24 flex-shrink-0 bg-gray-900/90 flex items-center justify-center border-r border-gray-700/80">
        <LoverPortraitThumb
          candidates={imgCandidates}
          label={loverName}
          imgClassName="w-full h-full object-contain"
          emptyClassName="w-full h-24 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-500 text-center p-1"
        />
      </div>
      <div className="flex-1 flex flex-col p-3 min-w-0 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="border-gray-400" />
          </div>
          <span className={cn('font-semibold text-base leading-tight', checked ? 'text-white' : 'text-gray-300')}>{loverName}</span>
          <span className="text-sm text-gray-400 leading-tight">with {wardenName}</span>
          {attrBadge}
        </div>
        <div className="flex flex-1 items-center gap-2">
          {tokenImgSrc && (
            <img src={tokenImgSrc} alt="token" className="w-6 h-6 object-contain flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <span className="text-sm text-white">Tokens Owned: {tokenCount}/{tokenMax}</span>
        </div>
      </div>
    </div>
  )
}

function TrimmedImg({
  src,
  alt,
  className,
  onError,
}: {
  src: string
  alt: string
  className?: string
  onError?: () => void
}) {
  const [trimmedSrc, setTrimmedSrc] = useState<string | null>(null)

  useEffect(() => {
    setTrimmedSrc(null)
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')
        if (!ctx) { setTrimmedSrc(src); return }
        ctx.drawImage(img, 0, 0)
        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
        let x0 = width, x1 = 0, y0 = height, y1 = 0
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 10) {
              if (x < x0) x0 = x
              if (x > x1) x1 = x
              if (y < y0) y0 = y
              if (y > y1) y1 = y
            }
          }
        }
        if (x1 < x0 || y1 < y0) { setTrimmedSrc(src); return }
        const tw = x1 - x0 + 1
        const th = y1 - y0 + 1
        const tc = document.createElement('canvas')
        tc.width = tw
        tc.height = th
        tc.getContext('2d')!.drawImage(c, x0, y0, tw, th, 0, 0, tw, th)
        setTrimmedSrc(tc.toDataURL())
      } catch {
        setTrimmedSrc(src)
      }
    }
    img.onerror = () => onError?.()
    img.src = src
  }, [src])

  if (!trimmedSrc) return null
  return <img src={trimmedSrc} alt={alt} className={className} />
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
    <TrimmedImg
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
    getWardenImageSrc,
    loverOwnedSkins, setLoverOwnedSkins,
    loverActiveSkins, setLoverActiveSkins,
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
                    tokenCount={inventory['AgneyiToken']?.count ?? 0}
                    tokenMax={100}
                    tokenImgSrc="/GoVAssets/AgneyiToken.png"
                  />
                  <LoverSummonPickCard
                    loverName="Hela"
                    wardenName="Woden"
                    attrKey="allure"
                    imgCandidates={getLoverPortraitSrcs('Hela').flat()}
                    checked={hasHela}
                    setChecked={setHasHela}
                    tokenCount={inventory['HelaToken']?.count ?? 0}
                    tokenMax={100}
                    tokenImgSrc="/GoVAssets/HelaToken.png"
                  />
                  <LoverSummonPickCard
                    loverName="Dionysus"
                    wardenName="Artemis"
                    attrKey="intellect"
                    imgCandidates={getLoverPortraitSrcs('Dionysus').flat()}
                    checked={hasDionysus}
                    setChecked={setHasDionysus}
                    tokenCount={inventory['DionysusToken']?.count ?? 0}
                    tokenMax={100}
                    tokenImgSrc="/GoVAssets/DionysusToken.png"
                  />
                  <LoverSummonPickCard
                    loverName="Culann"
                    wardenName="Finn"
                    attrKey="spirit"
                    imgCandidates={getLoverPortraitSrcs('Culann').flat()}
                    checked={hasCulann}
                    setChecked={setHasCulann}
                    tokenCount={inventory['CulannToken']?.count ?? 0}
                    tokenMax={100}
                    tokenImgSrc="/GoVAssets/CulannToken.png"
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
                    tokenCount={inventory['MayaToken']?.count ?? 0}
                    tokenMax={100}
                    tokenImgSrc={null}
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-amber-300 mb-3">Ember / Ash</div>
                <div className="max-w-xs">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { const next = !(hasEmber || hasAsh); setHasEmber(next); setHasAsh(next) }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = !(hasEmber || hasAsh); setHasEmber(next); setHasAsh(next) } }}
                    className={cn(
                      'flex items-stretch rounded-lg overflow-hidden border cursor-pointer transition-all select-none text-left',
                      (hasEmber || hasAsh)
                        ? 'ring-2 ring-offset-2 ring-offset-gray-900 border-transparent ring-amber-400 bg-amber-500/15'
                        : 'border-gray-600 bg-gray-800/40 hover:bg-gray-800/70'
                    )}
                  >
                    {/* Both portraits */}
                    <div className="w-24 flex-shrink-0 bg-gray-900/90 flex border-r border-gray-700/80">
                      <div className="w-1/2 flex items-center justify-center">
                        <LoverPortraitThumb
                          candidates={getLoverPortraitSrcs('Ember').flat()}
                          label="Ember"
                          imgClassName="w-full h-full object-contain"
                          emptyClassName="w-full h-12 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 text-center p-1"
                        />
                      </div>
                      <div className="w-1/2 flex items-center justify-center">
                        <LoverPortraitThumb
                          candidates={getLoverPortraitSrcs('Ash').flat()}
                          label="Ash"
                          imgClassName="w-full h-full object-contain"
                          emptyClassName="w-full h-12 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 text-center p-1"
                        />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between p-2 gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={hasEmber || hasAsh}
                            onCheckedChange={(v) => { setHasEmber(v === true); setHasAsh(v === true) }}
                            className="border-gray-400"
                          />
                        </div>
                        <span className="font-semibold text-sm text-white">Ember / Ash</span>
                        <span className="text-xs text-gray-400">with Nyx</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 whitespace-nowrap">All attrs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img src="/GoVAssets/HeartOfWarToken.png" alt="token" className="w-4 h-4 object-contain flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <span className="text-xs text-white">Tokens Owned: {heartOfWarCount(inventory)}/400</span>
                      </div>
                    </div>
                  </div>
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
              const loverSlots = getLoverSkinSlots(bond.lover)
              return (
                <Card key={bondKey} className="bg-gray-700/50 border-gray-600">
                  <div className="flex h-[280px]">
                    {/* Lover portraits — auto-width panel so portraits push the right pane naturally */}
                    <div className="flex-shrink-0 flex flex-col border-r border-gray-700/50 pt-1 px-1 pb-1">
                      <div className="flex flex-1 min-h-0 gap-1">
                        {loverSlots.map((slot) => (
                          <div key={slot.baseName} className="flex flex-col">
                            <div className="flex-1 min-h-0">
                              {(loverActiveSkins[slot.baseName] ?? 'base') !== 'base' ? (
                                <TrimmedImg
                                  src={`/Gov/Lovers/LoverSkins/${loverActiveSkins[slot.baseName]}.png`}
                                  alt={slot.displayName}
                                  className="h-full w-auto object-contain max-w-none"
                                  onError={() => setLoverActiveSkins((prev) => ({ ...prev, [slot.baseName]: 'base' }))}
                                />
                              ) : (
                                <LoverPortraitThumb
                                  candidates={slot.baseImgCandidates}
                                  label={slot.displayName}
                                  imgClassName="h-full w-auto object-contain max-w-none"
                                  emptyClassName="h-full w-[80px] rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] text-gray-400 text-center p-2"
                                />
                              )}
                            </div>
                            <div>
                              {loverSlots.length > 1 && <div className="text-[9px] text-gray-400 text-center mb-0.5">{slot.displayName}</div>}
                              <div className="flex gap-0.5">
                                {(['base', ...slot.skins] as string[]).map((opt) => {
                                  const active = loverActiveSkins[slot.baseName] ?? 'base'
                                  const label = opt === 'base' ? 'Base' : opt.replace(/^.*Skin/, 'S')
                                  return (
                                    <label key={opt} className={`flex-1 text-center cursor-pointer text-[9px] py-0.5 rounded select-none ${active === opt ? 'bg-blue-600/60 text-white' : 'bg-gray-700/60 text-gray-400 hover:bg-gray-600/60'}`}>
                                      <input type="radio" className="sr-only" name={`ls-${slot.baseName}`} value={opt} checked={active === opt} onChange={() => setLoverActiveSkins((prev) => ({ ...prev, [slot.baseName]: opt }))} />
                                      {label}
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex-1 min-w-0 flex flex-row overflow-hidden">

                      {/* Col 1: Lover name, warden name, warden image, skins */}
                      <div className="flex-shrink-0 w-[230px] flex flex-col px-2 pt-2 pb-1.5 gap-1">
                        <span className="text-lg font-bold text-white leading-none">{bond.lover}</span>
                        <span className="text-xs text-gray-400 leading-none">with {bond.warden}</span>
                        <div className="flex items-center justify-center h-[80px] w-full">
                          <img src={getWardenImageSrc(bond.warden)} alt={bond.warden}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                        {/* Skin ownership cards */}
                        {loverSlots.some((s) => s.skins.length > 0) && (
                          <div className="flex gap-2 flex-wrap">
                            {loverSlots.filter((s) => s.skins.length > 0).map((slot) => (
                              <div key={slot.baseName} className="flex flex-col gap-0.5">
                                {loverSlots.filter((s) => s.skins.length > 0).length > 1 && (
                                  <div className="text-[9px] text-gray-400">{slot.displayName}</div>
                                )}
                                <div className="flex gap-1.5">
                                  {slot.skins.map((skinKey) => (
                                    <div key={skinKey} className="flex flex-col items-center gap-0.5">
                                      <img src={`/Gov/SkinCards/LoverSkins/${skinKey}.png`} className="w-12 h-12 object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                      <div className="flex items-center gap-0.5">
                                        <Checkbox
                                          id={`ls-own-${slot.baseName}-${skinKey}`}
                                          checked={loverOwnedSkins[slot.baseName]?.[skinKey] || false}
                                          onCheckedChange={() => setLoverOwnedSkins((prev) => ({
                                            ...prev,
                                            [slot.baseName]: { ...prev[slot.baseName], [skinKey]: !prev[slot.baseName]?.[skinKey] },
                                          }))}
                                          className="border-gray-400 w-3 h-3"
                                        />
                                        <Label htmlFor={`ls-own-${slot.baseName}-${skinKey}`} className="text-[9px] text-gray-300 cursor-pointer">
                                          {skinKey.replace(/^.*Skin/, 'S')}
                                        </Label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Col 2: Tags + 2×2 attribute grid */}
                      <div className="flex-1 min-w-0 px-2 pt-2 pb-1.5 border-l border-gray-700/30 flex flex-col gap-1.5">
                        {/* Tags row */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            bond.type === 'All' ? 'bg-yellow-500/20 text-yellow-400'
                            : bond.type === 'Dual' ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                          }`}>{bond.type}</span>
                          {wardenData && wardenData.map((attr) => (
                            <span key={attr} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ring-1 ${getAttributeBg(attr)} ${getAttributeColor(attr)} ring-current`}>{attr}</span>
                          ))}
                        </div>
                        {/* 2×2 attribute grid */}
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          {["strength", "allure", "intellect", "spirit"].map((attr) => {
                            const isMainStat = wardenData?.some((a) => a.toLowerCase() === attr || a === "Balance")
                            const suggestedUpgradesResult = calculateSuggestedUpgrades(bondKey, scarletBondAffinity[bondKey] || 0)
                            const flatSuggestion = isMainStat ? suggestedUpgradesResult[`${attr}Level`] : null
                            const percentSuggestion = isMainStat ? suggestedUpgradesResult[`${attr}Percent`] : null
                            const contribution = calculateScarletBondContribution(bondKey, attr)
                            return (
                              <div key={attr} className={`flex flex-col gap-1 rounded p-2 ${isMainStat ? getAttributeBg(attr) + ' ring-1 ring-current/30' : 'bg-gray-800/30'}`}>
                                <div className="text-center">
                                  <div className={`text-base font-bold leading-none ${isMainStat ? getAttributeColor(attr) : 'text-gray-500'}`}>{contribution.totalBonus}</div>
                                  <div className={`text-xs capitalize leading-none mt-0.5 ${isMainStat ? getAttributeColor(attr) : 'text-gray-600'}`}>{attr}</div>
                                </div>
                                <Input className="h-7 text-xs px-1.5 py-0 bg-gray-600 border-gray-500 text-white w-full" placeholder="Flat"
                                  {...nonNegativeIntInputProps((scarletBond[bondKey] as any)?.[`${attr}Level`] || 0, (n) =>
                                    setScarletBond((prev) => ({ ...prev, [bondKey]: { ...prev[bondKey], [`${attr}Level`]: Math.min(205, Math.max(0, n)) } }))
                                  )}
                                />
                                {flatSuggestion && <div className="text-[9px] text-green-400 leading-none">+{flatSuggestion.increase}</div>}
                                <Input className="h-7 text-xs px-1.5 py-0 bg-gray-600 border-gray-500 text-white w-full" placeholder="%"
                                  {...nonNegativeIntInputProps((scarletBond[bondKey] as any)?.[`${attr}Percent`] || 0, (n) =>
                                    setScarletBond((prev) => ({ ...prev, [bondKey]: { ...prev[bondKey], [`${attr}Percent`]: Math.min(205, Math.max(0, n)) } }))
                                  )}
                                />
                                {percentSuggestion && <div className="text-[9px] text-green-400 leading-none">+{percentSuggestion.increase}</div>}
                                {contribution.loverMultiplier > 0 && <div className="text-[9px] text-orange-400 leading-none">+{contribution.loverMultiplier}%</div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Col 3: Affinity */}
                      <div className="flex-shrink-0 flex flex-col gap-1 px-2 pt-2 pb-1.5 border-l border-gray-700/30">
                        <span className="text-[10px] text-gray-400 leading-none">Affinity</span>
                        <Input
                          className="w-14 h-7 text-xs py-0 bg-gray-600 border-gray-500 text-white"
                          placeholder="0"
                          {...nonNegativeIntInputProps(scarletBondAffinity[bondKey] || 0, (n) =>
                            setScarletBondAffinity((prev) => ({ ...prev, [bondKey]: n }))
                          )}
                        />
                      </div>

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
