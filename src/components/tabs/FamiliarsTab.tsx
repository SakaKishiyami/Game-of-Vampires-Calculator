"use client"

import { useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  nests,
  familiarDefinitions,
  FAMILIAR_GRADES,
  ALL_FAMILIAR_ATTRIBUTES,
  getNestLevel,
  getNestBonuses,
  getTotalFamiliarBonuses,
  type FamiliarGrade,
  type FamiliarDefinition,
  type NestDefinition,
} from '@/data/familiars'

const GRADE_COLORS: Record<FamiliarGrade, string> = {
  D: 'bg-gray-600 text-gray-300',
  C: 'bg-green-700/60 text-green-300',
  B: 'bg-blue-700/60 text-blue-300',
  A: 'bg-purple-700/60 text-purple-300',
  S: 'bg-amber-600/60 text-amber-200',
  SS: 'bg-red-600/60 text-red-200',
}

const ATTR_COLORS: Record<string, string> = {
  Loyalty: 'text-rose-400',
  Ferocity: 'text-orange-400',
  Tenacity: 'text-cyan-400',
  Instinct: 'text-emerald-400',
  Mischief: 'text-violet-400',
}

const nestWithoutNest = familiarDefinitions.filter(f => f.nestId === null)

function FamiliarCard({
  familiar,
  owned,
  grade,
  onToggleOwned,
  onSetGrade,
}: {
  familiar: FamiliarDefinition
  owned: boolean
  grade: FamiliarGrade
  onToggleOwned: () => void
  onSetGrade: (g: FamiliarGrade) => void
}) {
  const [showAdult, setShowAdult] = useState(false)
  const [showMutation, setShowMutation] = useState(false)

  const imgSrc = showAdult
    ? (showMutation ? familiar.images.adultMutation : familiar.images.adult)
    : (showMutation ? familiar.images.babyMutation : familiar.images.baby)

  const hasAdult = !!familiar.images.adult

  return (
    <div className={`rounded-lg border p-2 transition-all ${
      owned
        ? 'bg-gray-800/80 border-amber-500/40 shadow-md shadow-amber-900/20'
        : 'bg-gray-900/40 border-gray-700/50 opacity-60'
    }`}>
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={familiar.name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="text-gray-600 text-2xl">?</div>
          )}
        </div>

        <div className="text-xs font-medium text-center text-gray-200 leading-tight">
          {familiar.name}
        </div>

        <div className="flex gap-1">
          {hasAdult && (
            <button
              onClick={() => setShowAdult(a => !a)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                showAdult ? 'bg-blue-600/40 text-blue-300' : 'bg-gray-700/60 text-gray-400'
              }`}
            >
              {showAdult ? 'Adult' : 'Baby'}
            </button>
          )}
          <button
            onClick={() => setShowMutation(m => !m)}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              showMutation ? 'bg-purple-600/40 text-purple-300' : 'bg-gray-700/60 text-gray-400'
            }`}
          >
            {showMutation ? 'Mutant' : 'Normal'}
          </button>
        </div>

        <button
          onClick={onToggleOwned}
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
            owned
              ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50'
              : 'bg-gray-700/40 text-gray-500 hover:bg-gray-700/60'
          }`}
        >
          {owned ? 'Owned' : 'Not Owned'}
        </button>

        {owned && (
          <div className="flex gap-0.5 flex-wrap justify-center">
            {FAMILIAR_GRADES.map(g => (
              <button
                key={g}
                onClick={() => onSetGrade(g)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                  grade === g ? GRADE_COLORS[g] : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NestCard({ nest }: { nest: NestDefinition }) {
  const { familiars, setFamiliars } = useGameCalculator()

  const level = getNestLevel(nest, familiars)
  const bonuses = getNestBonuses(nest, level)
  const maxLevel = nest.levels.length
  const nestFamiliars = familiarDefinitions.filter(f => f.nestId === nest.id)

  const isExclusive = nest.id === 'mythborn'

  return (
    <Card className={`border ${
      isExclusive
        ? 'bg-gradient-to-b from-amber-950/30 to-gray-900/60 border-amber-500/30'
        : 'bg-gray-900/60 border-gray-700'
    }`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-semibold ${isExclusive ? 'text-amber-400' : 'text-white'}`}>
            {nest.name}
            {isExclusive && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Exclusive</span>}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">Nest Lv</span>
            <span className={`text-sm font-bold ${level > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
              {level}/{maxLevel}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-3">
        <div className={`grid gap-2 ${
          nestFamiliars.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'
        }`}>
          {nestFamiliars.map(f => (
            <FamiliarCard
              key={f.id}
              familiar={f}
              owned={familiars[f.id]?.owned ?? false}
              grade={familiars[f.id]?.grade ?? 'D'}
              onToggleOwned={() => setFamiliars(prev => ({
                ...prev,
                [f.id]: { ...prev[f.id], owned: !prev[f.id]?.owned }
              }))}
              onSetGrade={(g) => setFamiliars(prev => ({
                ...prev,
                [f.id]: { ...prev[f.id], grade: g }
              }))}
            />
          ))}
        </div>

        {/* Nest level requirements */}
        <div className="space-y-1">
          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Levels</div>
          <div className="flex flex-wrap gap-1">
            {nest.levels.map((lv, i) => {
              const achieved = i < level
              return (
                <div key={i} className={`text-[10px] px-2 py-0.5 rounded ${
                  achieved
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-gray-800/60 text-gray-500 border border-gray-700/30'
                }`}>
                  Lv{i + 1}: {lv.requirement}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active bonuses */}
        {level > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Active Bonuses</div>
            <div className="flex flex-wrap gap-2">
              {ALL_FAMILIAR_ATTRIBUTES.filter(a => bonuses[a] > 0).map(attr => (
                <span key={attr} className={`text-[11px] ${ATTR_COLORS[attr]}`}>
                  {attr} +{bonuses[attr]}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function FamiliarsTab() {
  const { familiars, setFamiliars } = useGameCalculator()
  const [showNestless, setShowNestless] = useState(false)

  const totalBonuses = getTotalFamiliarBonuses(familiars)
  const hasAnyBonus = ALL_FAMILIAR_ATTRIBUTES.some(a => totalBonuses[a] > 0)

  const releasedFamiliars = familiarDefinitions.filter(f => f.nestId !== null)
  const ownedCount = releasedFamiliars.filter(f => familiars[f.id]?.owned).length
  const totalCount = releasedFamiliars.length

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-red-400">Familiars</CardTitle>
          <div className="text-xs text-gray-400">
            {ownedCount}/{totalCount} owned
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total bonuses summary */}
        {hasAnyBonus && (
          <Card className="bg-gray-900/60 border-gray-700">
            <CardContent className="py-3 px-4">
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">
                Total Nest Bonuses
              </div>
              <div className="flex flex-wrap gap-4">
                {ALL_FAMILIAR_ATTRIBUTES.map(attr => (
                  <div key={attr} className="text-center">
                    <div className={`text-lg font-bold ${ATTR_COLORS[attr]}`}>
                      +{totalBonuses[attr]}
                    </div>
                    <div className="text-[10px] text-gray-400">{attr}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nests.map(nest => (
            <NestCard key={nest.id} nest={nest} />
          ))}
        </div>

        {/* Unreleased familiars */}
        {nestWithoutNest.length > 0 && (
          <Card className="bg-gray-900/40 border-gray-700/50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-500">
                  Coming Soon
                  <span className="ml-2 text-[10px] text-gray-600">Not yet in game</span>
                </CardTitle>
                <button
                  onClick={() => setShowNestless(v => !v)}
                  className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1 bg-gray-800/50 rounded"
                >
                  {showNestless ? 'Hide' : 'Show'}
                </button>
              </div>
            </CardHeader>
            {showNestless && (
              <CardContent className="px-4 pb-3 pt-0">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {nestWithoutNest.map(f => (
                    <div key={f.id} className="rounded-lg border p-2 bg-gray-900/30 border-gray-700/30 opacity-40 pointer-events-none select-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative w-16 h-16 flex items-center justify-center grayscale">
                          <img
                            src={f.images.baby}
                            alt={f.name}
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                        <div className="text-xs font-medium text-center text-gray-500 leading-tight">
                          {f.name}
                        </div>
                        <div className="text-[9px] text-gray-600 italic">Coming Soon</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
