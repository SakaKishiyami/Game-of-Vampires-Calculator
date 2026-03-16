"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { attributeOrder, getAttributeColor } from '@/utils/helpers'
import { calculateDynamicAuraLevels, calculateAuraBonuses } from '@/utils/calculators/auraCalculations'

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
    inventory
  } = useGameCalculator()

  const dynamicAuras = calculateDynamicAuraLevels(auras, selectedWardens, hasAgneyi, hasCulann, hasHela, inventory)
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
          <div className="grid grid-cols-2 gap-6">
            {/* Talent Bonuses */}
            <div className="space-y-4">
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
            <div className="space-y-4">
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
            {/* Wild Hunt */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Wild Hunt Wardens (Talent Bonuses)</h3>
              <div className="text-sm text-gray-300 mb-3">
                Selected: {(selectedWardens.hunt || []).length}/4 | 
                Base Level: {(selectedWardens.hunt || []).length > 0 ? 9 + Math.max(0, (selectedWardens.hunt || []).length - 1) : 0}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dynamicAuras.wildHunt).map(([wardenName, wardenData]: [string, any]) => {
                  const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                  const isSelected = (selectedWardens.hunt || []).includes(wardenName)
                  const secondaryAura = auras.secondaryAuras?.wildHunt[wardenName]
                  const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                  return (
                    <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className={`font-medium ${isSelected ? 'text-green-300' : 'text-gray-500'}`}>{wardenName}</span>
                          <div className="text-xs text-gray-400">{wardenData.type}</div>
                          <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                        </div>
                        <span className={`text-lg font-bold ${isSelected ? 'text-green-400' : 'text-gray-500'}`}>
                          +{currentBonus}%
                        </span>
                      </div>
                      {secondaryAura && (
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={secondaryAura.current}
                                onChange={(e) =>
                                  setAuras((prev) => ({
                                    ...prev,
                                    secondaryAuras: {
                                      ...prev.secondaryAuras,
                                      wildHunt: {
                                        ...prev.secondaryAuras.wildHunt,
                                        [wardenName]: {
                                          ...prev.secondaryAuras.wildHunt[wardenName],
                                          current: Number.parseInt(e.target.value) || 0,
                                        },
                                      },
                                    },
                                  }))
                                }
                                className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                              />
                              <span className="text-xs text-gray-400">/20</span>
                            </div>
                            <span className="text-sm font-semibold text-yellow-400">
                              +{secondaryBonus}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monster Noir */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Monster Noir Wardens (Book Bonuses)</h3>
              <div className="text-sm text-gray-300 mb-3">
                Selected: {(selectedWardens.noir || []).length}/4 | 
                Base Level: {(selectedWardens.noir || []).length > 0 ? 9 + Math.max(0, (selectedWardens.noir || []).length - 1) : 0}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dynamicAuras.monsterNoir).map(([wardenName, wardenData]: [string, any]) => {
                  const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                  const isSelected = (selectedWardens.noir || []).includes(wardenName)
                  const secondaryAura = auras.secondaryAuras?.monsterNoir[wardenName]
                  const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                  return (
                    <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gray-700/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className={`font-medium ${isSelected ? 'text-purple-300' : 'text-gray-500'}`}>{wardenName}</span>
                          <div className="text-xs text-gray-400">{wardenData.type}</div>
                          <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                        </div>
                        <span className={`text-lg font-bold ${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>
                          +{currentBonus}%
                        </span>
                      </div>
                      {secondaryAura && (
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={secondaryAura.current}
                                onChange={(e) =>
                                  setAuras((prev) => ({
                                    ...prev,
                                    secondaryAuras: {
                                      ...prev.secondaryAuras,
                                      monsterNoir: {
                                        ...prev.secondaryAuras.monsterNoir,
                                        [wardenName]: {
                                          ...prev.secondaryAuras.monsterNoir[wardenName],
                                          current: Number.parseInt(e.target.value) || 0,
                                        },
                                      },
                                    },
                                  }))
                                }
                                className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                              />
                              <span className="text-xs text-gray-400">/20</span>
                            </div>
                            <span className="text-sm font-semibold text-yellow-400">
                              +{secondaryBonus}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bloody Tyrants */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Bloody Tyrants Wardens (Book Bonuses)</h3>
              <div className="text-sm text-gray-300 mb-3">
                Selected: {(selectedWardens.tyrants || []).length}/5 | 
                Base Level: {(selectedWardens.tyrants || []).length > 0 ? 10 + Math.max(0, (selectedWardens.tyrants || []).length - 1) : 0}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dynamicAuras.bloodyTyrants).map(([wardenName, wardenData]: [string, any]) => {
                  const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                  const isSelected = (selectedWardens.tyrants || []).includes(wardenName)
                  const secondaryAura = auras.secondaryAuras?.bloodyTyrants[wardenName]
                  const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                  return (
                    <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-red-500/20 border border-red-500/30' : 'bg-gray-700/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className={`font-medium ${isSelected ? 'text-red-300' : 'text-gray-500'}`}>{wardenName}</span>
                          <div className="text-xs text-gray-400">{wardenData.type}</div>
                          <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                        </div>
                        <span className={`text-lg font-bold ${isSelected ? 'text-red-400' : 'text-gray-500'}`}>
                          +{currentBonus}%
                        </span>
                      </div>
                      {secondaryAura && (
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={secondaryAura.current}
                                onChange={(e) =>
                                  setAuras((prev) => ({
                                    ...prev,
                                    secondaryAuras: {
                                      ...prev.secondaryAuras,
                                      bloodyTyrants: {
                                        ...prev.secondaryAuras.bloodyTyrants,
                                        [wardenName]: {
                                          ...prev.secondaryAuras.bloodyTyrants[wardenName],
                                          current: Number.parseInt(e.target.value) || 0,
                                        },
                                      },
                                    },
                                  }))
                                }
                                className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                              />
                              <span className="text-xs text-gray-400">/20</span>
                            </div>
                            <span className="text-sm font-semibold text-yellow-400">
                              +{secondaryBonus}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cirque du Macabre */}
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-3">Cirque du Macabre Wardens (Book Bonuses)</h3>
              <div className="text-sm text-gray-300 mb-3">
                Selected: {(selectedWardens.circus || []).length}/5 | 
                Base Level: {(selectedWardens.circus || []).length > 0 ? 10 + Math.max(0, (selectedWardens.circus || []).length - 1) : 0}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dynamicAuras.cirque).map(([wardenName, wardenData]: [string, any]) => {
                  const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                  const isSelected = (selectedWardens.circus || []).includes(wardenName)
                  const secondaryAura = auras.secondaryAuras?.cirque[wardenName]
                  const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                  return (
                    <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className={`font-medium ${isSelected ? 'text-orange-300' : 'text-gray-500'}`}>{wardenName}</span>
                          <div className="text-xs text-gray-400">{wardenData.type}</div>
                          <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                        </div>
                        <span className={`text-lg font-bold ${isSelected ? 'text-orange-400' : 'text-gray-500'}`}>
                          +{currentBonus}%
                        </span>
                      </div>
                      {secondaryAura && (
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={secondaryAura.current}
                                onChange={(e) =>
                                  setAuras((prev) => ({
                                    ...prev,
                                    secondaryAuras: {
                                      ...prev.secondaryAuras,
                                      cirque: {
                                        ...prev.secondaryAuras.cirque,
                                        [wardenName]: {
                                          ...prev.secondaryAuras.cirque[wardenName],
                                          current: Number.parseInt(e.target.value) || 0,
                                        },
                                      },
                                    },
                                  }))
                                }
                                className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                              />
                              <span className="text-xs text-gray-400">/20</span>
                            </div>
                            <span className="text-sm font-semibold text-yellow-400">
                              +{secondaryBonus}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Lovers (if any are active) */}
            {(hasAgneyi || hasCulann || hasHela) && (
              <div>
                <h3 className="text-lg font-semibold text-pink-400 mb-3">Lovers (Scarlet Bond Bonuses)</h3>
                <div className="text-sm text-gray-300 mb-3">
                  Summoned: {[hasAgneyi, hasCulann, hasHela].filter(Boolean).length}/3 | 
                  Bonus Level: {(() => {
                    const count = [hasAgneyi, hasCulann, hasHela].filter(Boolean).length
                    if (count === 0) return "0%"
                    if (count === 1) return "20%"
                    if (count === 2) return "25%"
                    return "30%"
                  })()}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(dynamicAuras.lovers || {}).map(([loverName, loverData]: [string, any]) => {
                    const isSelected = (loverName === "Agneyi" && hasAgneyi) || 
                                     (loverName === "Culann" && hasCulann) || 
                                     (loverName === "Hela" && hasHela)
                    const currentBonus = loverData.current
                    return (
                      <div key={loverName} className={`p-3 rounded ${isSelected ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-gray-700/30'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className={`font-medium ${isSelected ? 'text-pink-300' : 'text-gray-500'}`}>{loverName}</span>
                            <div className="text-xs text-gray-400">{loverData.type}</div>
                            <div className="text-xs text-gray-400">{isSelected ? 'Summoned' : 'Not Summoned'}</div>
                          </div>
                          <span className={`text-lg font-bold ${isSelected ? 'text-pink-400' : 'text-gray-500'}`}>
                            +{currentBonus}%
                          </span>
                        </div>
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
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(auras.vip)
                    .filter(([_, wardenData]: [string, any]) => vipLevel >= wardenData.vipRequired)
                    .map(([wardenName, wardenData]: [string, any]) => (
                      <div key={wardenName} className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                        <div>
                          <span className="text-white font-medium">{wardenName}</span>
                          <div className="text-xs text-gray-400">VIP {wardenData.vipRequired} Required</div>
                          {wardenData.talents ? (
                            <div className="text-xs text-gray-400">
                              Talents: {wardenData.talents.current}% | Books: {wardenData.books.current}%
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">{wardenData.type}: {wardenData.current}%</div>
                          )}
                        </div>
                        <div className="text-right">
                          {wardenData.talents ? (
                            <>
                              <div className="text-sm font-bold text-yellow-400">T: +{wardenData.talents.current}%</div>
                              <div className="text-sm font-bold text-blue-400">B: +{wardenData.books.current}%</div>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-yellow-400">
                              +{wardenData.current}%
                            </span>
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
                <div className="grid grid-cols-2 gap-4">
                  {hasNyx && (
                    <div className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                      <div>
                        <span className="text-white font-medium">Nyx</span>
                        <div className="text-xs text-gray-400">
                          Talents: {auras.special.Nyx.talents.current}% | Books: {auras.special.Nyx.books.current}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-yellow-400">T: +{auras.special.Nyx.talents.current}%</div>
                        <div className="text-sm font-bold text-blue-400">B: +{auras.special.Nyx.books.current}%</div>
                      </div>
                    </div>
                  )}
                  {hasDracula && (
                    <div className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                      <div>
                        <span className="text-white font-medium">Dracula</span>
                        <div className="text-xs text-gray-400">
                          Talents: {auras.special.Dracula.talents.current}% | Books: {auras.special.Dracula.books.current}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-yellow-400">T: +{auras.special.Dracula.talents.current}%</div>
                        <div className="text-sm font-bold text-blue-400">B: +{auras.special.Dracula.books.current}%</div>
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
