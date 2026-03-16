"use client"

import Link from 'next/link'
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
        <CardTitle className="text-red-400">Courtyard & Familiars</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex flex-col justify-center rounded-lg bg-gray-900/60 px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">Familiars are part of the Courtyard system.</div>
            <Link
              href="/familiars"
              className="inline-flex items-center justify-center rounded-md border border-purple-500/60 bg-purple-700/40 px-3 py-1.5 text-xs font-medium text-purple-100 hover:bg-purple-700"
            >
              Open Familiar Tracker
            </Link>
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
