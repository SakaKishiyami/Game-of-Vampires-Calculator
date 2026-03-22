"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { nonNegativeIntInputProps } from '@/utils/helpers'
import { calculateConclaveUpgrades, calculateTotalConclaveBonus } from '@/utils/calculators/conclaveCalculations'
import { useCalculatorSettings } from '@/components/layout/MainLayout'

export default function ConclaveTab() {
  const { conclave, setConclave, conclaveUpgrade, setConclaveUpgrade, books, wardenCounts } = useGameCalculator()
  const { density } = useCalculatorSettings()
  const compact = density === 'compact'

  const upgradePreview = calculateConclaveUpgrades(conclave, conclaveUpgrade, books, wardenCounts)

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Current Seal Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            {Object.entries(conclave)
              .filter(([seal]) => seal !== "Conclave Points")
              .map(([seal, level]) => (
                <div key={seal}>
                  <Label className="text-white">{seal}</Label>
                  <Input
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                    {...nonNegativeIntInputProps(level, (numValue) =>
                      setConclave((prev) => ({
                        ...prev,
                        [seal]: numValue,
                      }))
                    )}
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Seal Upgrade Planning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-w-xs">
              <Label className="text-white">Saved Conclave Seals</Label>
              <Input
                className="mt-2 bg-gray-700 border-gray-600 text-white w-40"
                {...nonNegativeIntInputProps(conclaveUpgrade.savedSeals, (numValue) =>
                  setConclaveUpgrade((prev) => ({
                    ...prev,
                    savedSeals: numValue,
                  }))
                )}
              />
            </div>

            <div>
              <Label className="text-white text-lg block mb-3">Select Seals to Upgrade:</Label>
              <div className={`grid gap-3 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                {Object.entries(conclaveUpgrade.upgradeSeals).map(([seal, checked]) => (
                  <div key={seal} className="flex items-center space-x-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(checked) =>
                        setConclaveUpgrade((prev) => ({
                          ...prev,
                          upgradeSeals: {
                            ...prev.upgradeSeals,
                            [seal]: checked as boolean,
                          }
                        }))
                      }
                      className="border-gray-400"
                    />
                    <Label className="text-white">{seal}</Label>
                  </div>
                ))}
              </div>
            </div>

            {conclaveUpgrade.savedSeals > 0 && upgradePreview.upgrades.length > 0 && (
              <div className="border border-gray-600 rounded p-4 bg-gray-900/50">
                <h3 className="text-yellow-400 font-semibold mb-3">Optimal Upgrade Strategy</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <p className="text-white">
                      <span className="text-blue-400">Total Cost:</span> {upgradePreview.totalCost.toLocaleString()} seals
                    </p>
                    <p className="text-white">
                      <span className="text-green-400">Total DOM Gain:</span> {upgradePreview.upgrades.reduce((sum, u) => sum + u.domGain, 0).toLocaleString()}
                    </p>
                  </div>
                  {upgradePreview.upgrades
                    .sort((a, b) => {
                      const aIndex = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"].indexOf(a.sealType)
                      const bIndex = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"].indexOf(b.sealType)
                      if (aIndex !== bIndex) return aIndex - bIndex
                      return a.targetLevel - b.targetLevel
                    })
                    .map((upgrade, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-green-400 font-medium">{upgrade.sealType}</p>
                          <p className="text-yellow-400 text-xs">
                            {upgrade.efficiency.toFixed(1)} DOM/seal
                          </p>
                        </div>
                        <p className="text-gray-300">
                          Level {upgrade.currentLevel} → {upgrade.targetLevel} 
                          (Cost: {upgrade.cost.toLocaleString()})
                        </p>
                        <p className="text-gray-300">
                          +{upgrade.wardenBonus.toLocaleString()} warden DOM, 
                          +{upgrade.bookMultiplier.toFixed(1)}% book multiplier
                        </p>
                        <p className="text-blue-300 text-xs">
                          Total DOM gain: {upgrade.domGain.toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
