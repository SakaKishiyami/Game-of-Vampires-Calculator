"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDisplayValue } from '@/utils/helpers'
import { calculateMaxCourtyardLevel } from '@/utils/calculators/courtyardCalculations'

export default function CourtyardTab() {
  const { courtyard, setCourtyard } = useGameCalculator()
  
  const projectedLevel = calculateMaxCourtyardLevel(courtyard)

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-red-400">Courtyard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-white">Current Level</Label>
            <Input
              type="number"
              value={courtyard.currentLevel}
              onChange={(e) =>
                setCourtyard((prev) => ({
                  ...prev,
                  currentLevel: Number.parseInt(e.target.value) || 1,
                }))
              }
              className="mt-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <Label className="text-white">Current Points</Label>
            <Input
              type="number"
              value={getDisplayValue(courtyard.currentPoints)}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || value === '-') {
                  return
                }
                const numValue = parseInt(value) || 0
                setCourtyard((prev) => ({
                  ...prev,
                  currentPoints: numValue,
                }))
              }}
              onBlur={(e) => {
                const value = e.target.value
                const numValue = value === '' ? 0 : parseInt(value) || 0
                setCourtyard((prev) => ({
                  ...prev,
                  currentPoints: numValue,
                }))
              }}
              className="mt-2 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
        <div className="text-center p-4 bg-gray-700 rounded">
          <div className="text-xl font-bold text-green-400">Projected Level: {projectedLevel}</div>
          <div className="text-sm text-gray-300 mt-2">Based on current points and selected wardens</div>
        </div>
      </CardContent>
    </Card>
  )
}
