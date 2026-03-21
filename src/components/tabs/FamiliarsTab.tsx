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
  type FamiliarAttribute,
  type FamiliarOwnedEntry,
  type FamiliarKnack,
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
  // D=turquoise, C=blue, B=purple, A=orange, S=red, SS=rainbow
  D: 'bg-cyan-500/25',
  C: 'bg-blue-500/25',
  B: 'bg-purple-500/25',
  A: 'bg-orange-500/25',
  S: 'bg-red-500/25',
  SS: 'bg-pink-100/40',
}

const GRADE_BORDER: Record<FamiliarGrade, string> = {
  D: 'border-cyan-300/45',
  C: 'border-blue-300/45',
  B: 'border-purple-300/45',
  A: 'border-orange-300/45',
  S: 'border-red-300/45',
  SS: 'border-pink-100/80',
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

const KNACK_OPTIONS: FamiliarKnack[] = [
  'Gym',
  'Conclave',
  'Arena',
  'League',
  'Date',
  'Crystal',
  'Fishing',
  "Lover's Lodge",
  'Workshop',
  'Well',
  'Mushroom',
  'Dark Chasm',
  'Other',
]

const DEFAULT_ATTRIBUTES: Record<FamiliarAttribute, number> = {
  Loyalty: 0,
  Ferocity: 0,
  Tenacity: 0,
  Instinct: 0,
  Mischief: 0,
}

const GRADE_ORDER: FamiliarGrade[] = ['D', 'C', 'B', 'A', 'S', 'SS']

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
  state?: FamiliarOwnedEntry | null
  size?: number
  showStageLabel?: boolean
}) {
  const owned = !!state
  const grade = state?.grade ?? 'D'
  const isAdult = state?.isAdult ?? false
  const isMutated = state?.isMutated ?? false
  const level = state?.level ?? 1
  const bondId = state?.bondId ?? null
  const knacks = state?.knacks ?? []

  const bg = owned ? `${GRADE_BG[grade]}` : 'bg-gray-900/60'
  const border = owned ? `${GRADE_BORDER[grade]}` : 'border-gray-800/40'

  const imgSrc = owned ? getPreviewImageSrc(familiar, isAdult, isMutated) : familiar.images.baby

  return (
    <div
      className={`relative w-20 h-20 rounded-lg border ${bg} ${border} overflow-hidden flex items-center justify-center`}
    >
      <div className="absolute top-0 left-0 p-1 flex flex-col items-start gap-0.5">
        {owned ? (
          <>
            <img src={rankIconSrc(grade)} alt={`${grade} rank`} className="w-7 h-7 object-contain" />
            {knacks.slice(0, 2).map((k) => (
              <div
                key={k}
                className="text-[8px] leading-none px-1 py-0.5 rounded bg-black/30 text-gray-100"
              >
                {k}
              </div>
            ))}
          </>
        ) : (
          <div className="w-5 h-5" />
        )}
      </div>
      {bondId ? (
        <img
          src={`/FamiliarAssets/Bonds/${bondId}.png`}
          alt={`${bondId} bond`}
          className="absolute bottom-0 left-0 w-8 h-8 object-contain"
        />
      ) : null}
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
  count,
  onEditLatest,
  onAddAnother,
  onRemove,
}: {
  familiar: FamiliarDefinition
  state?: FamiliarOwnedEntry | null
  count: number
  onEditLatest: () => void
  onAddAnother: () => void
  onRemove: () => void
}) {
  const owned = !!state
  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-900/40 p-2">
      <div className="flex flex-col items-center gap-2">
        <FamiliarSquare familiar={familiar} state={state} />
        <div className="text-[11px] text-gray-200 font-medium text-center">{familiar.name}</div>
        {owned ? <div className="text-[10px] text-gray-400">{count} owned</div> : null}
        {owned ? (
          <div className="flex gap-1 pt-1">
            <button
              onClick={onEditLatest}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-blue-600/20 text-blue-200 hover:bg-blue-600/35"
            >
              Edit
            </button>
            <button
              onClick={onAddAnother}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-green-600/20 text-green-200 hover:bg-green-600/35"
            >
              + Copy
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
            onClick={onAddAnother}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors bg-green-600/20 text-green-200 hover:bg-green-600/35"
          >
            Add
          </button>
        )}
      </div>
    </div>
  )
}

/** Levels + active bonuses only (no duplicate familiar row — familiars live in parent). */
function NestLevelsAndBonuses({ nest, familiars }: { nest: NestDefinition; familiars: Record<string, FamiliarOwnedEntry[]> }) {
  const level = getNestLevel(nest, familiars)
  const bonuses = getNestBonuses(nest, level)

  return (
    <div className="space-y-3 pt-1 border-t border-gray-700/50">
      <div className="space-y-1">
        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Levels</div>
        <div className="flex flex-wrap gap-1.5">
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
                  <img src={rankIconSrc(grade)} alt={`${grade} rank`} className="w-4 h-4 object-contain shrink-0" />
                ) : (
                  <span className="w-4 h-4 shrink-0" />
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
    </div>
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [mutationMode, setMutationMode] = useState<'normal' | 'mutated'>('normal')
  const [selectedGrade, setSelectedGrade] = useState<FamiliarGrade>('D')
  const [selectedLevel, setSelectedLevel] = useState<number>(FAMILIAR_GRADE_MAX_LEVEL.D)
  const [selectedBondId, setSelectedBondId] = useState<FamiliarBondId | null>(null)
  const [mainAttr1, setMainAttr1] = useState<FamiliarAttribute>('Loyalty')
  const [mainAttr2, setMainAttr2] = useState<FamiliarAttribute>('Ferocity')
  const [attrValues, setAttrValues] = useState<Record<FamiliarAttribute, number>>(DEFAULT_ATTRIBUTES)
  const [selectedKnacks, setSelectedKnacks] = useState<FamiliarKnack[]>(['Other'])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [rankFilter, setRankFilter] = useState<'all' | FamiliarGrade>('all')
  const [bondFilter, setBondFilter] = useState<'all' | FamiliarBondId>('all')
  const [knackFilter, setKnackFilter] = useState<'all' | FamiliarKnack>('all')

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
  const knackSlots = selectedGrade === 'S' || selectedGrade === 'SS' ? 2 : 1

  const scrollToAddForm = () => {
    document.getElementById('familiar-add-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const applySelected = () => {
    if (!selectedFamiliar) return
    if (mainAttr1 === mainAttr2) return
    const entry: FamiliarOwnedEntry = {
      id: editingEntryId ?? `${selectedFamiliarId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      grade: selectedGrade,
      level: selectedLevel,
      isAdult: computedIsAdult,
      isMutated: computedIsMutated,
      attributes: { ...attrValues },
      mainAttributes: [mainAttr1, mainAttr2],
      bondId: selectedBondId,
      knacks: selectedKnacks.slice(0, knackSlots),
    }
    setFamiliars((prev) => ({
      ...prev,
      [selectedFamiliarId]: [
        ...(prev[selectedFamiliarId] ?? []).filter((x: FamiliarOwnedEntry) => x.id !== entry.id),
        entry,
      ],
    }))
    setEditingEntryId(null)
    scrollToAddForm()
  }

  const removeFamiliar = (familiarId: string) => {
    setFamiliars((prev) => ({
      ...prev,
      [familiarId]: [],
    }))
  }

  const editFamiliar = (familiarId: string, entryId?: string) => {
    const list = familiars[familiarId] ?? []
    if (list.length === 0) return
    const st = entryId ? list.find((x: FamiliarOwnedEntry) => x.id === entryId) ?? list[0] : list[0]
    setSelectedFamiliarId(familiarId)
    setEditingEntryId(st.id)
    setMutationMode(st.isMutated ? 'mutated' : 'normal')
    setSelectedGrade(st.grade)
    const grade = st.grade
    const level = st.level
    setSelectedLevel(Math.min(level, FAMILIAR_GRADE_MAX_LEVEL[grade]))
    setSelectedBondId(st.bondId)
    setMainAttr1(st.mainAttributes[0])
    setMainAttr2(st.mainAttributes[1])
    setAttrValues({ ...st.attributes })
    setSelectedKnacks(st.knacks.length > 0 ? st.knacks : ['Other'])
    scrollToAddForm()
  }

  const addAnother = (familiarId: string) => {
    setEditingEntryId(null)
    setSelectedFamiliarId(familiarId)
    setMutationMode('normal')
    setSelectedGrade('D')
    setSelectedLevel(FAMILIAR_GRADE_MAX_LEVEL.D)
    setSelectedBondId(null)
    setMainAttr1('Loyalty')
    setMainAttr2('Ferocity')
    setAttrValues(DEFAULT_ATTRIBUTES)
    setSelectedKnacks(['Other'])
    scrollToAddForm()
  }

  const stepNestProgress = (familiarId: string, direction: -1 | 1) => {
    const list = familiars[familiarId] ?? []
    const best = list[0]
    const idx = best ? GRADE_ORDER.indexOf(best.grade) : -1
    const nextIdx = Math.max(-1, Math.min(GRADE_ORDER.length - 1, idx + direction))

    if (nextIdx === -1) {
      setFamiliars((prev) => ({ ...prev, [familiarId]: [] }))
      return
    }
    const nextGrade = GRADE_ORDER[nextIdx]
    const nextLevel = FAMILIAR_GRADE_MAX_LEVEL[nextGrade]
    const next: FamiliarOwnedEntry = {
      id: best?.id ?? `${familiarId}-nest-${Date.now()}`,
      grade: nextGrade,
      level: nextLevel,
      isAdult: true,
      isMutated: best?.isMutated ?? false,
      attributes: best?.attributes ?? { ...DEFAULT_ATTRIBUTES },
      mainAttributes: best?.mainAttributes ?? ['Loyalty', 'Ferocity'],
      bondId: best?.bondId ?? null,
      knacks: (best?.knacks ?? ['Other']).slice(0, nextGrade === 'S' || nextGrade === 'SS' ? 2 : 1),
    }
    setFamiliars((prev) => ({ ...prev, [familiarId]: [next, ...list.filter((x: FamiliarOwnedEntry) => x.id !== next.id)] }))
  }

  const totalBonuses = getTotalFamiliarBonuses(familiars)
  const hasAnyBonus = ALL_FAMILIAR_ATTRIBUTES.some((a) => totalBonuses[a] > 0)
  const ownedCount = releasedFamiliars.reduce((sum, f) => sum + ((familiars[f.id] ?? []).length > 0 ? 1 : 0), 0)
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
              {nests.map((nest) => {
                const isExclusive = nest.id === 'mythborn'
                const nestLv = getNestLevel(nest, familiars)
                const maxLv = nest.levels.length
                return (
                  <Card
                    key={nest.id}
                    className={`border overflow-hidden ${
                      isExclusive
                        ? 'bg-gradient-to-b from-amber-950/30 to-gray-900/60 border-amber-500/30'
                        : 'bg-gray-900/60 border-gray-700'
                    }`}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle
                          className={`text-sm font-semibold ${isExclusive ? 'text-amber-400' : 'text-white'}`}
                        >
                          {nest.name}
                          {isExclusive && (
                            <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                              Exclusive
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400">Nest Lv</span>
                          <span className={`text-sm font-bold ${nestLv > 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                            {nestLv}/{maxLv}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0 space-y-3">
                      {/* Single horizontal row: portrait → arrows → name; no second row */}
                      <div className="flex flex-nowrap gap-4 sm:gap-5 items-start justify-start overflow-x-auto pb-1 -mx-1 px-1">
                        {nest.familiarIds.map((fid) => {
                          const fam = familiarDefinitions.find((x) => x.id === fid)
                          if (!fam) return null
                          const best = (familiars[fid] ?? [])[0] ?? null
                          return (
                            <div
                              key={fid}
                              className="flex flex-col items-center gap-1.5 w-[4.75rem] sm:w-[5rem] shrink-0"
                            >
                              <FamiliarSquare familiar={fam} state={best} />
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => stepNestProgress(fid, -1)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                                >
                                  ◀
                                </button>
                                <button
                                  type="button"
                                  onClick={() => stepNestProgress(fid, 1)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
                                >
                                  ▶
                                </button>
                              </div>
                              <div className="text-[10px] text-gray-300 text-center leading-tight line-clamp-2 w-full">
                                {fam.name}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <NestLevelsAndBonuses nest={nest} familiars={familiars} />
                    </CardContent>
                  </Card>
                )
              })}
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

                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-500">Main Attributes (highlighted)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={mainAttr1}
                          onChange={(e) => setMainAttr1(e.target.value as FamiliarAttribute)}
                          className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-100 text-sm rounded px-2 py-2"
                        >
                          {ALL_FAMILIAR_ATTRIBUTES.map((a) => (
                            <option key={`m1-${a}`} value={a}>{a}</option>
                          ))}
                        </select>
                        <select
                          value={mainAttr2}
                          onChange={(e) => setMainAttr2(e.target.value as FamiliarAttribute)}
                          className="bg-orange-500/20 border border-orange-500/40 text-orange-100 text-sm rounded px-2 py-2"
                        >
                          {ALL_FAMILIAR_ATTRIBUTES.map((a) => (
                            <option key={`m2-${a}`} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                      {mainAttr1 === mainAttr2 ? (
                        <div className="text-[10px] text-red-300">Main attributes must be different.</div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-500">Attributes (5 stats)</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {ALL_FAMILIAR_ATTRIBUTES.map((attr) => {
                          const highlighted = attr === mainAttr1 || attr === mainAttr2
                          return (
                            <div key={attr} className={`rounded border p-2 ${highlighted ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-700/50 bg-gray-800/30'}`}>
                              <div className={`text-[10px] ${highlighted ? 'text-yellow-200' : 'text-gray-300'}`}>{attr}</div>
                              <input
                                type="number"
                                min={0}
                                value={attrValues[attr]}
                                onChange={(e) =>
                                  setAttrValues((prev) => ({
                                    ...prev,
                                    [attr]: Math.max(0, parseInt(e.target.value || '0', 10) || 0),
                                  }))
                                }
                                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-500">Bond</div>
                      <select
                        value={selectedBondId ?? ''}
                        onChange={(e) => setSelectedBondId((e.target.value || null) as FamiliarBondId | null)}
                        className="w-full bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                      >
                        <option value="">None</option>
                        {familiarBondDefinitions.map((b) => (
                          <option key={b.id} value={b.id}>{b.displayName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-gray-500">
                        Knacks ({knackSlots} slot{knackSlots > 1 ? 's' : ''})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={selectedKnacks[0] ?? 'Other'}
                          onChange={(e) => setSelectedKnacks((prev) => [e.target.value as FamiliarKnack, prev[1] ?? 'Other'])}
                          className="bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                        >
                          {KNACK_OPTIONS.map((k) => (
                            <option key={`k1-${k}`} value={k}>{k}</option>
                          ))}
                        </select>
                        {knackSlots > 1 ? (
                          <select
                            value={selectedKnacks[1] ?? 'Other'}
                            onChange={(e) => setSelectedKnacks((prev) => [prev[0] ?? 'Other', e.target.value as FamiliarKnack])}
                            className="bg-gray-800 border-gray-700 text-white text-sm rounded px-2 py-2"
                          >
                            {KNACK_OPTIONS.map((k) => (
                              <option key={`k2-${k}`} value={k}>{k}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-gray-500 flex items-center">Rank A or below: one knack slot.</div>
                        )}
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
                          disabled={mainAttr1 === mainAttr2}
                        >
                          {editingEntryId ? 'Update' : 'Add'}
                        </Button>
                        <Button
                          onClick={() => {
                            if (editingEntryId) {
                              setFamiliars((prev) => ({
                                ...prev,
                                [selectedFamiliarId]: (prev[selectedFamiliarId] ?? []).filter(
                                  (x: FamiliarOwnedEntry) => x.id !== editingEntryId
                                ),
                              }))
                              setEditingEntryId(null)
                            } else {
                              removeFamiliar(selectedFamiliarId)
                            }
                          }}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 h-10"
                        >
                          {editingEntryId ? 'Remove This Copy' : 'Remove All'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-gray-700 mb-4">
              <CardContent className="py-3 px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search familiar..."
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  />
                  <select
                    value={rankFilter}
                    onChange={(e) => setRankFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Ranks</option>
                    {GRADE_ORDER.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={bondFilter}
                    onChange={(e) => setBondFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Bonds</option>
                    {familiarBondDefinitions.map((b) => (
                      <option key={b.id} value={b.id}>{b.displayName}</option>
                    ))}
                  </select>
                  <select
                    value={knackFilter}
                    onChange={(e) => setKnackFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Knacks</option>
                    {KNACK_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-200">Owned / Trackable Familiars</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {releasedFamiliars
                  .filter((f) => f.name.toLowerCase().includes(searchText.toLowerCase()))
                  .filter((f) => {
                    const list = familiars[f.id] ?? []
                    if (rankFilter === 'all') return true
                    return list.some((x: FamiliarOwnedEntry) => x.grade === rankFilter)
                  })
                  .filter((f) => {
                    const list = familiars[f.id] ?? []
                    if (bondFilter === 'all') return true
                    return list.some((x: FamiliarOwnedEntry) => x.bondId === bondFilter)
                  })
                  .filter((f) => {
                    const list = familiars[f.id] ?? []
                    if (knackFilter === 'all') return true
                    return list.some((x: FamiliarOwnedEntry) => x.knacks.includes(knackFilter))
                  })
                  .map((f) => (
                    <OwnedFamiliarCard
                      key={f.id}
                      familiar={f}
                      state={(familiars[f.id] ?? [])[0] ?? null}
                      count={(familiars[f.id] ?? []).length}
                      onEditLatest={() => editFamiliar(f.id)}
                      onAddAnother={() => addAnother(f.id)}
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
                const entries = releasedFamiliars.flatMap((f) =>
                  (familiars[f.id] ?? []).map((entry: FamiliarOwnedEntry) => ({ familiar: f, entry }))
                )
                const withBond = entries.filter((x) => x.entry.bondId === def.id)
                const bestUnlocked = withBond.reduce((best, x) => {
                  const [a1, a2] = x.entry.mainAttributes
                  const minMain = Math.min(x.entry.attributes[a1] || 0, x.entry.attributes[a2] || 0)
                  let unlocked = 1
                  for (const test of [2, 3, 4, 5, 6] as const) {
                    if (minMain >= getBondValue(def, test)) unlocked = test
                  }
                  return Math.max(best, unlocked)
                }, 1)
                const activeLevel = Math.min(lvl, bestUnlocked)
                const effect = activeLevel >= 2 ? def.effectsByLevel[activeLevel as 2 | 3 | 4 | 5 | 6] : 'Locked'
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
                              Req @ Lv{lvl}: {value}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Active Lv {activeLevel}
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
                      <div className="text-[10px] text-gray-500">
                        {withBond.length} familiar(s) have this bond. Highest qualifying one counts.
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
