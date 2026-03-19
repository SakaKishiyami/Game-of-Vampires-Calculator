"use client"

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { familiarBondDefinitions, getBondValue, type FamiliarBondId } from '@/data/familiarBonds'
import { Button } from "@/components/ui/button"

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

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ATTR_COLORS: Record<string, string> = {
  Loyalty: 'text-rose-400',
  Ferocity: 'text-orange-400',
  Tenacity: 'text-cyan-400',
  Instinct: 'text-emerald-400',
  Mischief: 'text-violet-400',
}

const GRADE_BG: Record<FamiliarGrade, string> = {
  D: 'bg-gray-700/60',
  C: 'bg-green-700/50',
  B: 'bg-blue-700/50',
  A: 'bg-purple-700/50',
  S: 'bg-amber-600/50',
  SS: 'bg-red-600/50',
}

const GRADE_BORDER: Record<FamiliarGrade, string> = {
  D: 'border-gray-500/40',
  C: 'border-green-500/40',
  B: 'border-blue-500/40',
  A: 'border-purple-500/40',
  S: 'border-amber-400/40',
  SS: 'border-red-400/40',
}

function rankIconSrc(grade: FamiliarGrade): string {
  return `/FamiliarAssets/Ranks/${grade}.png`
}

function getPreviewImageSrc(familiar: FamiliarDefinition, isAdult: boolean, isMutated: boolean): string | undefined {
  if (isAdult) {
    return isMutated
      ? (familiar.images.adultMutation ?? familiar.images.babyMutation)
      : (familiar.images.adult ?? familiar.images.baby)
  }
  return isMutated ? familiar.images.babyMutation : familiar.images.baby
}

function getRankFromRequirement(req: string): FamiliarGrade | null {
  if (req.includes(' at C')) return 'C'
  if (req.includes(' at B')) return 'B'
  if (req.includes(' at A')) return 'A'
  if (req.includes(' at S')) return 'S'
  return null
}

function FamiliarSquare({
  familiar,
  state,
  size = 16,
  showStageLabel = false,
}: {
  familiar: FamiliarDefinition
  state?: { owned: boolean; grade: FamiliarGrade; level: number; isAdult: boolean; isMutated: boolean }
  size?: number
  showStageLabel?: boolean
}) {
  const owned = state?.owned ?? false
  const grade = state?.grade ?? 'D'
  const isAdult = state?.isAdult ?? false
  const isMutated = state?.isMutated ?? false
  const level = state?.level ?? 1

  const bg = owned ? `${GRADE_BG[grade]}` : 'bg-gray-900/60'
  const border = owned ? `${GRADE_BORDER[grade]}` : 'border-gray-800/40'

  const imgSrc = owned ? getPreviewImageSrc(familiar, isAdult, isMutated) : familiar.images.baby

  return (
    <div
      className={`relative w-16 h-16 rounded-lg border ${bg} ${border} overflow-hidden flex items-center justify-center`}
    >
      <div className="absolute top-0 left-0 p-1">
        {owned ? (
          <img src={rankIconSrc(grade)} alt={`${grade} rank`} className="w-5 h-5 object-contain" />
        ) : (
          <div className="w-5 h-5" />
        )}
      </div>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={familiar.name}
          className={`w-full h-full object-contain ${owned ? '' : 'grayscale opacity-70'}`}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="text-gray-600 text-2xl">?</div>
      )}
      {showStageLabel && owned && (
        <div className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-100 font-medium bg-black/20 rounded px-1 py-0.5 truncate">
          {grade} Lv {level}
        </div>
      )}
    </div>
  )
}

function OwnedFamiliarCard({
  familiar,
  state,
  onEdit,
  onRemove,
}: {
  familiar: FamiliarDefinition
  state?: { owned: boolean; grade: FamiliarGrade; level: number; isAdult: boolean; isMutated: boolean }
  onEdit: () => void
  onRemove: () => void
}) {
  const owned = state?.owned ?? false
  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-900/40 p-2">
      <div className="flex flex-col items-center gap-2">
        <FamiliarSquare familiar={familiar} state={state} />
        <div className="text-[11px] text-gray-200 font-medium text-center">{familiar.name}</div>
        {owned ? (
          <div className="flex gap-1 pt-1">
            <button
              onClick={onEdit}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-blue-600/20 text-blue-200 hover:bg-blue-600/35"
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-red-600/20 text-red-200 hover:bg-red-600/35"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-green-600/20 text-green-200 hover:bg-green-600/35"
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

function NestCardReadOnly({ nest, familiars }: { nest: NestDefinition; familiars: Record<string, any> }) {
  const level = getNestLevel(nest, familiars)
  const bonuses = getNestBonuses(nest, level)
  const maxLevel = nest.levels.length
  const nestFamiliars = familiarDefinitions.filter((f) => f.nestId === nest.id)
  const isExclusive = nest.id === 'mythborn'

  return (
    <Card
      className={`border ${
        isExclusive
          ? 'bg-gradient-to-b from-amber-950/30 to-gray-900/60 border-amber-500/30'
          : 'bg-gray-900/60 border-gray-700'
      }`}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className={`text-sm font-semibold ${isExclusive ? 'text-amber-400' : 'text-white'}`}>
            {nest.name}
            {isExclusive && (
              <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                Exclusive
              </span>
            )}
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
        <div className={`flex flex-wrap gap-2 justify-start`}>
          {nestFamiliars.map((f) => (
            <div key={f.id} className="w-16">
              <FamiliarSquare familiar={f} state={familiars[f.id]} />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Levels</div>
          <div className="flex flex-wrap gap-1">
            {nest.levels.map((lv, i) => {
              const achieved = i < level
              const grade = getRankFromRequirement(lv.requirement)
              return (
                <div
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-2 ${
                    achieved
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-gray-800/60 text-gray-500 border border-gray-700/30'
                  }`}
                >
                  {grade ? (
                    <img src={rankIconSrc(grade)} alt={`${grade} rank`} className="w-4 h-4 object-contain" />
                  ) : (
                    <span className="w-4 h-4" />
                  )}
                  <span>
                    Lv{i + 1}: {lv.requirement}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {level > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Active Bonuses</div>
            <div className="flex flex-wrap gap-2">
              {ALL_FAMILIAR_ATTRIBUTES.filter((a) => bonuses[a] > 0).map((attr) => (
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
  const [activeTab, setActiveTab] = useState<'nests' | 'tracker' | 'bonds'>('tracker')

  const releasedFamiliars = useMemo(
    () => familiarDefinitions.filter((f) => f.nestId !== null),
    []
  )

  const nestWithoutNest = useMemo(
    () => familiarDefinitions.filter((f) => f.nestId === null),
    []
  )

  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string>(releasedFamiliars[0]?.id ?? '')
  const [mutationMode, setMutationMode] = useState<'normal' | 'mutated'>('normal')
  const [selectedGrade, setSelectedGrade] = useState<FamiliarGrade>('D')
  const [selectedLevel, setSelectedLevel] = useState<number>(FAMILIAR_GRADE_MAX_LEVEL.D)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!selectedFamiliarId && releasedFamiliars.length > 0) {
      setSelectedFamiliarId(releasedFamiliars[0].id)
    }
  }, [selectedFamiliarId, releasedFamiliars])

  useEffect(() => {
    const max = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
    setSelectedLevel((prev) => Math.min(prev, max))
  }, [selectedGrade])

  const selectedFamiliar =
    releasedFamiliars.find((f) => f.id === selectedFamiliarId) ?? null

  const maxLevel = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
  const computedIsAdult = selectedLevel === maxLevel
  const computedIsMutated = mutationMode === 'mutated'

  const scrollToAddForm = () => {
    document.getElementById('familiar-add-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const applySelected = () => {
    if (!selectedFamiliar) return
    setFamiliars((prev) => ({
      ...prev,
      [selectedFamiliarId]: {
        ...(prev[selectedFamiliarId] ?? {}),
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
    if (!st) return
    setSelectedFamiliarId(familiarId)
    setMutationMode(st.isMutated ? 'mutated' : 'normal')
    setSelectedGrade((st.grade ?? 'D') as FamiliarGrade)
    const grade = (st.grade ?? 'D') as FamiliarGrade
    const level = st.level ?? FAMILIAR_GRADE_MAX_LEVEL[grade]
    setSelectedLevel(Math.min(level, FAMILIAR_GRADE_MAX_LEVEL[grade]))
    scrollToAddForm()
  }

  const totalBonuses = getTotalFamiliarBonuses(familiars)
  const hasAnyBonus = ALL_FAMILIAR_ATTRIBUTES.some((a) => totalBonuses[a] > 0)
  const ownedCount = releasedFamiliars.filter((f) => familiars[f.id]?.owned).length
  const totalCount = releasedFamiliars.length

  // bonds tab (local state for now)
  const [bondLevels, setBondLevels] = useState<Record<FamiliarBondId, number>>(() => {
    const obj = {} as Record<FamiliarBondId, number>
    for (const d of familiarBondDefinitions) obj[d.id] = 1
    return obj
  })

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

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full grid grid-cols-3 bg-gray-800">
            <TabsTrigger value="nests" className="data-[state=active]:bg-red-600">
              Nest
            </TabsTrigger>
            <TabsTrigger value="tracker" className="data-[state=active]:bg-red-600">
              Tracker
            </TabsTrigger>
            <TabsTrigger value="bonds" className="data-[state=active]:bg-red-600">
              Bonds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nests" className="pt-4">
            {hasAnyBonus && (
              <Card className="bg-gray-900/60 border-gray-700 mb-4">
                <CardContent className="py-3 px-4">
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">
                    Total Nest Bonuses
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {ALL_FAMILIAR_ATTRIBUTES.map((attr) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nests.map((nest) => (
                <NestCardReadOnly key={nest.id} nest={nest} familiars={familiars} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tracker" className="pt-4">
            <Card id="familiar-add-form" className="bg-gray-900/60 border-gray-700 mb-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold text-gray-200">Add / Upgrade Familiar</CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-3 pt-0 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {selectedFamiliar ? (
                      <div className="relative">
                        <FamiliarSquare
                          familiar={selectedFamiliar}
                          state={{
                            owned: true,
                            grade: selectedGrade,
                            level: selectedLevel,
                            isAdult: computedIsAdult,
                            isMutated: computedIsMutated,
                          }}
                          showStageLabel
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-800 rounded" />
                    )}

                    <div className="text-[10px] text-gray-500 mt-2">
                      If Level == max, it auto-switches to Adult.
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="text-[11px] text-gray-500 w-full">Mutation</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={mutationMode === 'normal' ? 'default' : 'outline'}
                          className={mutationMode === 'normal' ? 'bg-blue-600/70 hover:bg-blue-600/70' : 'border-gray-700 text-gray-200 h-8 text-xs'}
                          onClick={() => setMutationMode('normal')}
                        >
                          Normal
                        </Button>
                        <Button
                          size="sm"
                          variant={mutationMode === 'mutated' ? 'default' : 'outline'}
                          className={mutationMode === 'mutated' ? 'bg-purple-600/70 hover:bg-purple-600/70' : 'border-gray-700 text-gray-200 h-8 text-xs'}
                          onClick={() => setMutationMode('mutated')}
                        >
                          Mutated
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] text-gray-500">Familiar</div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setPickerOpen((v) => !v)}
                            className="text-[11px] text-gray-200 hover:text-white px-2 py-1 rounded bg-gray-800/60 border border-gray-700"
                          >
                            {pickerOpen ? 'Close' : 'Pick'}
                          </button>
                        </div>
                      </div>

                      {/* Pop-down image picker */}
                      {pickerOpen && (
                        <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {releasedFamiliars.map((f) => {
                              const isSelected = f.id === selectedFamiliarId
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFamiliarId(f.id)
                                    setPickerOpen(false)
                                  }}
                                  className={`rounded-lg border p-1 transition ${
                                    isSelected ? 'border-red-400/70 bg-red-950/30' : 'border-gray-700/50 bg-gray-800/40 hover:bg-gray-800/60'
                                  }`}
                                >
                                  <div className="w-full h-14 flex items-center justify-center overflow-hidden rounded">
                                    <img
                                      src={f.images.baby}
                                      alt={f.name}
                                      className="w-full h-full object-contain grayscale opacity-90"
                                      onError={(e) => {
                                        ;(e.target as HTMLImageElement).style.display = 'none'
                                      }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-gray-300 mt-1 truncate">{f.name}</div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-500">Rank (D-SS)</div>
                      <div className="flex flex-wrap gap-2">
                        {FAMILIAR_GRADES.map((g) => {
                          const active = g === selectedGrade
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setSelectedGrade(g)}
                              className={`w-11 h-11 rounded-lg border flex items-center justify-center transition ${
                                active
                                  ? `${GRADE_BORDER[g]} ${GRADE_BG[g]}`
                                  : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800/60'
                              }`}
                            >
                              <img src={rankIconSrc(g)} alt={`${g} rank`} className="w-9 h-9 object-contain" />
                            </button>
                          )
                        })}
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
                        <div className="text-[10px] text-gray-500">Max for {selectedGrade} is {maxLevel}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={applySelected}
                          className="bg-red-700 hover:bg-red-600 text-white border border-red-600 h-10"
                        >
                          {(familiars[selectedFamiliarId]?.owned ?? false) ? 'Update' : 'Add'}
                        </Button>
                        <Button
                          onClick={() => removeFamiliar(selectedFamiliarId)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 h-10"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-200">Released Familiars</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {releasedFamiliars.map((f) => (
                  <OwnedFamiliarCard
                    key={f.id}
                    familiar={f}
                    state={familiars[f.id]}
                    onEdit={() => editFamiliar(f.id)}
                    onRemove={() => removeFamiliar(f.id)}
                  />
                ))}
              </div>

              {nestWithoutNest.length > 0 && (
                <Card className="bg-gray-900/40 border-gray-700/50">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                      Coming Soon
                      <span className="text-[10px] text-gray-600">(not yet in game)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {nestWithoutNest.map((f) => (
                        <div
                          key={f.id}
                          className="rounded-lg border p-2 bg-gray-900/30 border-gray-700/30 opacity-45 pointer-events-none select-none"
                        >
                          <div className="relative w-16 h-16 mx-auto flex items-center justify-center grayscale">
                            <img
                              src={f.images.baby}
                              alt={f.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-500 mt-2 text-center truncate">{f.name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bonds" className="pt-4">
            <div className="text-sm font-semibold text-gray-200 mb-3">Familiar Bonds</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {familiarBondDefinitions.map((def) => {
                const lvl = bondLevels[def.id] ?? 1
                const value = getBondValue(def, lvl)
                const effect = lvl >= 2 ? def.effectsByLevel[lvl as 2 | 3 | 4 | 5 | 6] : '—'
                return (
                  <Card key={def.id} className="bg-gray-900/60 border-gray-700">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/FamiliarAssets/Bonds/${def.assetFile}`}
                            alt={def.displayName}
                            className="w-10 h-10 object-contain"
                          />
                          <div>
                            <CardTitle className="text-sm text-gray-100">{def.displayName}</CardTitle>
                            <div className="text-[10px] text-gray-400 mt-1">
                              Value: {value}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Lv {lvl}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0 space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6].map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => setBondLevels((prev) => ({ ...prev, [def.id]: x }))}
                            className={`text-[11px] px-2 py-1 rounded border transition ${
                              lvl === x
                                ? 'bg-red-700/30 border-red-400/60 text-red-100'
                                : 'bg-gray-800/40 border-gray-700 text-gray-300 hover:bg-gray-800/60'
                            }`}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                      <div className="text-[12px] text-gray-200 leading-snug">
                        {effect}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
