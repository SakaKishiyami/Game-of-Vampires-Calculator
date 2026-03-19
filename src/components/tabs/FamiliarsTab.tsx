"use client"

import { useEffect, useMemo, useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  nests,
  familiarDefinitions,
  FAMILIAR_GRADES,
  FAMILIAR_GRADE_MAX_LEVEL,
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
  state,
  onEdit,
  onRemove,
}: {
  familiar: FamiliarDefinition
  state?: Partial<{
    owned: boolean
    grade: FamiliarGrade
    level: number
    isAdult: boolean
    isMutated: boolean
  }>
  onEdit: () => void
  onRemove: () => void
}) {
  const owned = state?.owned ?? false
  const grade = state?.grade ?? 'D'
  const level = state?.level ?? 1
  const isAdult = state?.isAdult ?? false
  const isMutated = state?.isMutated ?? false

  const imgSrc = owned
    ? isAdult
      ? isMutated
        ? (familiar.images.adultMutation ?? familiar.images.babyMutation)
        : (familiar.images.adult ?? familiar.images.baby)
      : isMutated
        ? familiar.images.babyMutation
        : familiar.images.baby
    : familiar.images.baby

  return (
    <div
      className={`rounded-lg border p-2 transition-all ${
        owned
          ? 'bg-gray-800/80 border-amber-500/40 shadow-md shadow-amber-900/20'
          : 'bg-gray-900/40 border-gray-700/50 opacity-60'
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={familiar.name}
              className={`w-full h-full object-contain ${owned ? '' : 'grayscale'}`}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="text-gray-600 text-2xl">?</div>
          )}
        </div>

        <div className="text-xs font-medium text-center text-gray-200 leading-tight">
          {familiar.name}
        </div>

        {owned ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className={`text-[11px] px-2 py-0.5 rounded ${GRADE_COLORS[grade]}`}>
              {grade} • Lv {level}
            </div>
            <div className="text-[10px] text-gray-400">
              {isMutated ? 'Mutated' : 'Normal'} {isAdult ? 'Adult' : 'Baby'}
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-gray-500">Not owned</div>
        )}

        <div className="flex gap-1 pt-1">
          <button
            onClick={onEdit}
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
              owned
                ? 'bg-blue-600/30 text-blue-200 hover:bg-blue-600/50'
                : 'bg-green-600/20 text-green-200 hover:bg-green-600/35'
            }`}
          >
            {owned ? 'Edit' : 'Add'}
          </button>

          {owned ? (
            <button
              onClick={onRemove}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-red-600/20 text-red-200 hover:bg-red-600/35"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function NestCard({
  nest,
  onEdit,
  onRemove,
}: {
  nest: NestDefinition
  onEdit: (familiarId: string) => void
  onRemove: (familiarId: string) => void
}) {
  const { familiars } = useGameCalculator()

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
              state={familiars[f.id]}
              onEdit={() => onEdit(f.id)}
              onRemove={() => onRemove(f.id)}
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

  const releasedFamiliars = useMemo(
    () => familiarDefinitions.filter((f) => f.nestId !== null),
    []
  )

  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string>(releasedFamiliars[0]?.id ?? '')
  const [mutationMode, setMutationMode] = useState<'normal' | 'mutated'>('normal')
  const [selectedGrade, setSelectedGrade] = useState<FamiliarGrade>('D')
  const [selectedLevel, setSelectedLevel] = useState<number>(FAMILIAR_GRADE_MAX_LEVEL.D)

  useEffect(() => {
    if (!selectedFamiliarId && releasedFamiliars.length > 0) {
      setSelectedFamiliarId(releasedFamiliars[0].id)
    }
  }, [selectedFamiliarId, releasedFamiliars])

  useEffect(() => {
    const max = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
    setSelectedLevel((prev) => Math.min(prev, max))
  }, [selectedGrade])

  const selectedFamiliar = releasedFamiliars.find((f) => f.id === selectedFamiliarId) ?? null
  const selectedState = familiars[selectedFamiliarId]

  const maxLevel = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
  const computedIsAdult = selectedLevel === maxLevel
  const computedIsMutated = mutationMode === 'mutated'

  const scrollToAddForm = () => {
    const el = document.getElementById('familiar-add-form')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const applySelected = () => {
    if (!selectedFamiliar) return
    const current = familiars[selectedFamiliarId]
    setFamiliars((prev) => ({
      ...prev,
      [selectedFamiliarId]: {
        ...(current ?? {}),
        owned: true,
        grade: selectedGrade,
        level: selectedLevel,
        isAdult: computedIsAdult,
        isMutated: computedIsMutated,
      },
    }))
    scrollToAddForm()
  }

  const removeFamiliar = (familiarId: string) => {
    setFamiliars((prev) => ({
      ...prev,
      [familiarId]: {
        ...(prev[familiarId] ?? {}),
        owned: false,
        grade: 'D',
        level: 1,
        isAdult: false,
        isMutated: false,
      },
    }))
  }

  const editFamiliar = (familiarId: string) => {
    const st = familiars[familiarId]
    setSelectedFamiliarId(familiarId)
    if (!st) return
    setMutationMode(st.isMutated ? 'mutated' : 'normal')
    setSelectedGrade(st.grade ?? 'D')
    const grade = st.grade ?? 'D'
    const level = st.level ?? FAMILIAR_GRADE_MAX_LEVEL[grade]
    setSelectedLevel(Math.min(level, FAMILIAR_GRADE_MAX_LEVEL[grade]))
    scrollToAddForm()
  }

  const totalBonuses = getTotalFamiliarBonuses(familiars)
  const hasAnyBonus = ALL_FAMILIAR_ATTRIBUTES.some(a => totalBonuses[a] > 0)

  const ownedCount = releasedFamiliars.filter((f) => familiars[f.id]?.owned).length
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
        {/* Add / Upgrade form */}
        <Card id="familiar-add-form" className="bg-gray-900/60 border-gray-700">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-gray-200">
              Add / Upgrade Familiar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-[11px] text-gray-500">Familiar</div>
                <select
                  value={selectedFamiliarId}
                  onChange={(e) => setSelectedFamiliarId(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                >
                  {releasedFamiliars.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-gray-500">Mutation</div>
                <select
                  value={mutationMode}
                  onChange={(e) => setMutationMode(e.target.value as 'normal' | 'mutated')}
                  className="w-full bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                >
                  <option value="normal">Normal</option>
                  <option value="mutated">Mutated</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-gray-500">Rank (D-SS)</div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as FamiliarGrade)}
                  className="w-full bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                >
                  {FAMILIAR_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px] space-y-1">
                <div className="text-[11px] text-gray-500">Level</div>
                <input
                  type="number"
                  min={1}
                  max={maxLevel}
                  value={selectedLevel}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10)
                    if (Number.isNaN(raw)) return
                    setSelectedLevel(Math.max(1, Math.min(raw, maxLevel)))
                  }}
                  className="w-full bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2 h-10"
                />
                <div className="text-[10px] text-gray-500">
                  Max for {selectedGrade} is {maxLevel}
                </div>
              </div>

              <div className="flex-1 min-w-[200px] space-y-1">
                <div className="text-[11px] text-gray-500">Stage Preview</div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                    {selectedFamiliar && (
                      <img
                        src={
                          computedIsAdult
                            ? computedIsMutated
                              ? selectedFamiliar.images.adultMutation ?? selectedFamiliar.images.babyMutation
                              : selectedFamiliar.images.adult ?? selectedFamiliar.images.baby
                            : computedIsMutated
                              ? selectedFamiliar.images.babyMutation
                              : selectedFamiliar.images.baby
                        }
                        alt={selectedFamiliar.name}
                        className="w-full h-full object-contain grayscale-0"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                  <div className="text-sm text-gray-200">
                    {computedIsAdult ? 'Adult' : 'Baby'} • {computedIsMutated ? 'Mutated' : 'Normal'} • {selectedGrade}
                  </div>
                </div>
                <div className="text-[10px] text-gray-500">
                  If Level == max, it auto-switches to Adult.
                </div>
              </div>

              <button
                onClick={applySelected}
                className="bg-red-700 hover:bg-red-600 text-white border border-red-600 rounded px-4 py-2 h-10 text-sm font-medium"
              >
                {(familiars[selectedFamiliarId]?.owned ?? false) ? 'Update' : 'Add'}
              </button>

              <button
                onClick={() => removeFamiliar(selectedFamiliarId)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded px-4 py-2 h-10 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </CardContent>
        </Card>

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
            <NestCard
              key={nest.id}
              nest={nest}
              onEdit={editFamiliar}
              onRemove={removeFamiliar}
            />
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
