"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { attributeOrder, getAttributeColor, nonNegativeIntInputProps } from '@/utils/helpers'
import { calculateDynamicAuraLevels, calculateAuraBonuses } from '@/utils/calculators/auraCalculations'
import { useCalculatorSettings } from '@/components/layout/MainLayout'

export default function AuraBonusesTab() {
  const {
    auras,
    setAuras,
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
  } = useGameCalculator()
  const { density } = useCalculatorSettings()
  const compact = density === 'compact'

  const dynamicAuras = calculateDynamicAuraLevels(
    auras,
    selectedWardens,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    inventory
  )
  const auraBonuses = calculateAuraBonuses(
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

  return (
    <div className="space-y-6">
      {/* Current Aura Bonuses Display */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Current Aura Bonuses</CardTitle>
          <div className="text-sm text-gray-300">
            Showing current percentage bonuses from all aura sources (base 100% + aura bonuses)
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Talent Bonuses */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-yellow-400">Talent Bonuses</h3>
              <div className="space-y-3">
                {attributeOrder.map((attribute) => (
                  <div key={attribute} className="flex justify-between items-center p-3 rounded bg-gray-700/50">
                    <span className={`capitalize font-medium ${getAttributeColor(attribute)}`}>
                      {attribute} Talents
                    </span>
                    <span className="text-xl font-bold text-white">
                      {auraBonuses.talents[attribute as keyof typeof auraBonuses.talents].toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Bonuses */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-400">Book Bonuses</h3>
              <div className="space-y-3">
                {attributeOrder.map((attribute) => (
                  <div key={attribute} className="flex justify-between items-center p-3 rounded bg-gray-700/50">
                    <span className={`capitalize font-medium ${getAttributeColor(attribute)}`}>
                      {attribute} Books
                    </span>
                    <span className="text-xl font-bold text-white">
                      {auraBonuses.books[attribute as keyof typeof auraBonuses.books].toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aura Breakdown by Source */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Aura Sources Breakdown</CardTitle>
          <div className="text-sm text-gray-300">
            Detailed breakdown of bonuses from each aura source
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Aura source group renderer */}
            {([
              {
                key: 'wildHunt', data: dynamicAuras.wildHunt, secondaryKey: 'wildHunt', selKey: 'hunt',
                title: 'Wild Hunt Wardens (Talent Bonuses)', max: 4, baseOffset: 9,
                titleCls: 'text-green-400', activeBg: 'bg-green-500/20 border border-green-500/30',
                activeText: 'text-green-300', activeBonus: 'text-green-400',
              },
              {
                key: 'monsterNoir', data: dynamicAuras.monsterNoir, secondaryKey: 'monsterNoir', selKey: 'noir',
                title: 'Monster Noir Wardens (Book Bonuses)', max: 4, baseOffset: 9,
                titleCls: 'text-purple-400', activeBg: 'bg-purple-500/20 border border-purple-500/30',
                activeText: 'text-purple-300', activeBonus: 'text-purple-400',
              },
              {
                key: 'bloodyTyrants', data: dynamicAuras.bloodyTyrants, secondaryKey: 'bloodyTyrants', selKey: 'tyrants',
                title: 'Bloody Tyrants Wardens (Book Bonuses)', max: 5, baseOffset: 10,
                titleCls: 'text-red-400', activeBg: 'bg-red-500/20 border border-red-500/30',
                activeText: 'text-red-300', activeBonus: 'text-red-400',
              },
              {
                key: 'cirque', data: dynamicAuras.cirque, secondaryKey: 'cirque', selKey: 'circus',
                title: 'Cirque du Macabre Wardens (Book Bonuses)', max: 5, baseOffset: 10,
                titleCls: 'text-orange-400', activeBg: 'bg-orange-500/20 border border-orange-500/30',
                activeText: 'text-orange-300', activeBonus: 'text-orange-400',
              },
            ] as const).map((group) => {
              const selected = (selectedWardens[group.selKey as keyof typeof selectedWardens] || []) as string[]
              return (
                <div key={group.key}>
                  <h3 className={`text-lg font-semibold ${group.titleCls} mb-3`}>{group.title}</h3>
                  <div className="text-sm text-gray-300 mb-3">
                    Selected: {selected.length}/{group.max} |{' '}
                    Base Level: {selected.length > 0 ? group.baseOffset + Math.max(0, selected.length - 1) : 0}
                  </div>
                  <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                    {Object.entries(group.data).map(([wardenName, wardenData]: [string, any]) => {
                      const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                      const isSelected = selected.includes(wardenName)
                      const secondaryAura = auras.secondaryAuras?.[group.secondaryKey]?.[wardenName]
                      const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                      return (
                        <div key={wardenName} className={`p-2 rounded ${isSelected ? group.activeBg : 'bg-gray-700/30'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={`/Gov/Wardens/BaseWardens/${wardenName}.png`}
                              alt={wardenName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium text-xs ${isSelected ? group.activeText : 'text-gray-500'}`}>{wardenName}</span>
                              <div className="text-[10px] text-gray-400">{wardenData.type} &middot; Lv {wardenData.current}/{wardenData.max}</div>
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? group.activeBonus : 'text-gray-500'}`}>
                              +{currentBonus}%
                            </span>
                          </div>
                          {secondaryAura && (
                            <div className="border-t border-gray-600 pt-1 mt-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Label className="text-[11px] text-gray-300">2nd:</Label>
                                  <Input
                                    className="w-14 h-5 text-[11px] bg-gray-600 border-gray-500 text-white"
                                    {...nonNegativeIntInputProps(secondaryAura.current, (n) =>
                                      setAuras((prev: any) => ({
                                        ...prev,
                                        secondaryAuras: {
                                          ...prev.secondaryAuras,
                                          [group.secondaryKey]: {
                                            ...prev.secondaryAuras[group.secondaryKey],
                                            [wardenName]: {
                                              ...prev.secondaryAuras[group.secondaryKey][wardenName],
                                              current: Math.min(20, Math.max(0, n)),
                                            },
                                          },
                                        },
                                      }))
                                    )}
                                  />
                                  <span className="text-[11px] text-gray-400">/20</span>
                                </div>
                                <span className="text-xs font-semibold text-yellow-400">+{secondaryBonus}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Lovers (if any are active) */}
            {(hasAgneyi || hasCulann || hasHela || hasDionysus || hasMaya || hasEmber || hasAsh) && (
              <div>
                <h3 className="text-lg font-semibold text-pink-400 mb-3">Lovers (Scarlet Bond Bonuses)</h3>
                <div className="text-sm text-gray-300 mb-3">
                  Wild Hunt: {[hasAgneyi, hasCulann, hasHela, hasDionysus].filter(Boolean).length}/4 · Monster Noir: {[hasMaya].filter(Boolean).length}/4 · Ember/Ash: {hasEmber && hasAsh ? 'on' : 'off'}
                </div>
                <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {Object.entries(dynamicAuras.lovers || {}).map(([loverName, loverData]: [string, any]) => {
                    const isSelected =
                      (loverName === 'Agneyi' && hasAgneyi) ||
                      (loverName === 'Culann' && hasCulann) ||
                      (loverName === 'Hela' && hasHela) ||
                      (loverName === 'Dionysus' && hasDionysus) ||
                      (loverName === 'Maya' && hasMaya) ||
                      (loverName === 'EmberAsh' && hasEmber && hasAsh)
                    const imgSrc =
                      loverName === 'EmberAsh'
                        ? '/Gov/Lovers/BaseLovers/Ember.png'
                        : `/Gov/Lovers/BaseLovers/${loverName}.png`
                    return (
                      <div key={loverName} className={`p-2 rounded flex items-center gap-2 ${isSelected ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-gray-700/30'}`}>
                        <img
                          src={imgSrc}
                          alt={loverName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            if (!img.src.includes('.PNG')) img.src = imgSrc.replace('.png', '.PNG')
                            else img.style.display = 'none'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`font-medium text-xs ${isSelected ? 'text-pink-300' : 'text-gray-500'}`}>{loverName}</span>
                          <div className="text-[10px] text-gray-400">{loverData.type} &middot; {isSelected ? 'Active' : 'Inactive'}</div>
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-pink-400' : 'text-gray-500'}`}>
                          +{loverData.current}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* VIP Wardens (if any are active) */}
            {vipLevel > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">VIP Wardens (VIP {vipLevel})</h3>
                <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {Object.entries(auras.vip)
                    .filter(([_, wardenData]: [string, any]) => vipLevel >= wardenData.vipRequired)
                    .map(([wardenName, wardenData]: [string, any]) => (
                      <div key={wardenName} className="flex items-center gap-2 p-2 rounded bg-gray-700/30">
                        <img
                          src={`/Gov/Wardens/BaseWardens/${wardenName}.png`}
                          alt={wardenName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium text-xs">{wardenName}</span>
                          <div className="text-[10px] text-gray-400">VIP {wardenData.vipRequired}</div>
                        </div>
                        <div className="text-right">
                          {wardenData.talents ? (
                            <>
                              <div className="text-xs font-bold text-yellow-400">T: +{wardenData.talents.current}%</div>
                              <div className="text-xs font-bold text-blue-400">B: +{wardenData.books.current}%</div>
                            </>
                          ) : (
                            <span className="text-base font-bold text-yellow-400">+{wardenData.current}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Special Wardens (if any are active) */}
            {(hasNyx || hasDracula) && (
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-3">Special Wardens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {hasNyx && (
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-700/30">
                      <img src="/Gov/Wardens/BaseWardens/Nyx.png" alt="Nyx" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1">
                        <span className="text-white font-medium text-xs">Nyx</span>
                        <div className="text-[10px] text-gray-400">Balance &middot; All Attributes</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-yellow-400">T: +{auras.special.Nyx.talents.current}%</div>
                        <div className="text-xs font-bold text-blue-400">B: +{auras.special.Nyx.books.current}%</div>
                      </div>
                    </div>
                  )}
                  {hasDracula && (
                    <div className="flex items-center gap-2 p-2 rounded bg-gray-700/30">
                      <img src="/Gov/Wardens/BaseWardens/Dracula.png" alt="Dracula" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1">
                        <span className="text-white font-medium text-xs">Dracula</span>
                        <div className="text-[10px] text-gray-400">Balance &middot; All Attributes</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-yellow-400">T: +{auras.special.Dracula.talents.current}%</div>
                        <div className="text-xs font-bold text-blue-400">B: +{auras.special.Dracula.books.current}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
