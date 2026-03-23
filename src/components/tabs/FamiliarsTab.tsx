"use client"

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  familiarBondDefinitions,
  getBondValue,
  type FamiliarBondDefinition,
  type FamiliarBondId,
} from '@/data/familiarBonds'
import { Button } from "@/components/ui/button"

import {
  nests,
  familiarDefinitions,
  FAMILIAR_GRADES,
  FAMILIAR_GRADE_MAX_LEVEL,
  ALL_FAMILIAR_ATTRIBUTES,
  getNestLevel,
  getNestBonuses,
  type FamiliarGrade,
  type FamiliarDefinition,
  type NestDefinition,
  type FamiliarAttribute,
  type FamiliarOwnedEntry,
  type FamiliarKnack,
  type FamiliarsState,
} from '@/data/familiars'

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { nonNegativeIntInputProps } from '@/utils/helpers'

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

function knackIconSrc(k: FamiliarKnack): string | null {
  if (k === 'Other') return null
  return `/FamiliarAssets/Chores/Knacks/${k}.png`
}

function bondIconSrcFromId(bondId: FamiliarBondId | null): string | null {
  if (!bondId) return null
  const def = familiarBondDefinitions.find((b) => b.id === bondId)
  return def ? `/FamiliarAssets/Bonds/${def.assetFile}` : null
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
  'Cleaning',
  'Cooking',
  'Crafting',
  'Delivery',
  'Entertaining',
  'Foraging',
  'Gardening',
  'Playing',
  'Repairing',
  'Security',
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

/** Highest bond tier (1–6) unlocked by any owned familiar with this bond (main-attribute gates). */
function getBestUnlockedBondTier(
  def: FamiliarBondDefinition,
  withBond: { familiar: FamiliarDefinition; entry: FamiliarOwnedEntry }[]
): number {
  if (withBond.length === 0) return 1
  return withBond.reduce((best, x) => {
    const [a1, a2] = x.entry.mainAttributes
    const minMain = Math.min(x.entry.attributes[a1] || 0, x.entry.attributes[a2] || 0)
    let unlocked = 1
    for (const test of [2, 3, 4, 5, 6] as const) {
      if (minMain >= getBondValue(def, test)) unlocked = test
    }
    return Math.max(best, unlocked)
  }, 1)
}

/** Highlights numeric values and percentages in bond effect copy. */
function BondEffectHighlight({ text }: { text: string }) {
  const parts = text.split(/(\d+(?:\.\d+)?%?)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^\d+(?:\.\d+)?%?$/.test(part) ? (
          <span key={i} className="text-amber-300 font-bold tabular-nums">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function FamiliarSquare({
  familiar,
  state,
  showStageLabel = false,
}: {
  familiar: FamiliarDefinition
  state?: FamiliarOwnedEntry | null
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

/**
 * Large roster / form preview: portrait with a left column — big rank, small knack icons, space, big bond.
 * Icons only on the overlay (no rank/bond text on the art).
 */
function TrackerPortrait({
  familiar,
  state,
  className = '',
}: {
  familiar: FamiliarDefinition | null
  state: FamiliarOwnedEntry | null
  className?: string
}) {
  if (!familiar) {
    return (
      <div
        className={`rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/30 flex items-center justify-center text-gray-500 text-sm text-center px-2 w-[13rem] h-[13rem] sm:w-[15rem] sm:h-[15rem] ${className}`}
      >
        Pick a familiar
      </div>
    )
  }

  const owned = !!state
  const grade = state?.grade ?? 'D'
  const isAdult = state?.isAdult ?? false
  const isMutated = state?.isMutated ?? false
  const bondSrc = bondIconSrcFromId(state?.bondId ?? null)
  const knackSlots = state && (state.grade === 'S' || state.grade === 'SS') ? 2 : 1
  const knackList = (state?.knacks ?? []).slice(0, knackSlots)

  const bg = owned ? GRADE_BG[grade] : 'bg-gray-900/60'
  const border = owned ? GRADE_BORDER[grade] : 'border-gray-700/60'
  const imgSrc = owned ? getPreviewImageSrc(familiar, isAdult, isMutated) : familiar.images.baby

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden flex-shrink-0 ${bg} ${border} w-[13rem] h-[13rem] sm:w-[15rem] sm:h-[15rem] ${className}`}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={familiar.name}
          className={`absolute inset-0 w-full h-full object-contain p-2 pl-[3.35rem] sm:pl-[3.75rem] ${owned ? '' : 'grayscale opacity-65'}`}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-4xl">?</div>
      )}

      {owned ? (
        <div className="absolute left-0 top-0 bottom-0 w-[3.25rem] sm:w-[3.5rem] flex flex-col justify-between py-1.5 pl-1 pr-0.5 z-10 pointer-events-none">
          <div className="flex flex-col items-start gap-1">
            <img
              src={rankIconSrc(grade)}
              alt=""
              className="w-[2.85rem] h-[2.85rem] sm:w-14 sm:h-14 object-contain drop-shadow-md"
            />
            {Array.from({ length: knackSlots }).map((_, i) => {
              const k = knackList[i]
              if (!k) return <div key={`k-${i}`} className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-black/25" />
              const src = knackIconSrc(k)
              return src ? (
                <img key={`${k}-${i}`} src={src} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow" />
              ) : (
                <div
                  key={`${k}-${i}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-700/80 border border-gray-600/50"
                  title={k}
                />
              )
            })}
          </div>
          <div className="min-h-[3rem] flex items-end">
            {bondSrc ? (
              <img src={bondSrc} alt="" className="w-[2.65rem] h-[2.65rem] sm:w-12 sm:h-12 object-contain drop-shadow-md" />
            ) : (
              <div className="w-[2.65rem] h-[2.65rem] sm:w-12 sm:h-12 rounded-md bg-black/20 border border-white/5" />
            )}
          </div>
        </div>
      ) : null}
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
          <p className="text-[10px] text-gray-500 leading-snug mb-1.5">
            These attribute boosts apply only to familiars in <span className="text-gray-400">{nest.name}</span> — not
            to familiars from other nests (e.g. an Imp only gets Shadewoods nest bonuses, not Briargrove or Hollowmoor).
          </p>
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
  const { familiars, setFamiliars, nestProgress, setNestProgress } = useGameCalculator()
  const [activeTab, setActiveTab] = useState<'nests' | 'tracker' | 'bonds'>('tracker')

  const releasedFamiliars = useMemo(
    () => familiarDefinitions.filter((f) => f.nestId !== null),
    []
  )

  const [selectedFamiliarId, setSelectedFamiliarId] = useState<string>(releasedFamiliars[0]?.id ?? '')
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [mutationMode, setMutationMode] = useState<'normal' | 'mutated'>('normal')
  const [selectedGrade, setSelectedGrade] = useState<FamiliarGrade>('D')
  const [selectedLevel, setSelectedLevel] = useState<number>(FAMILIAR_GRADE_MAX_LEVEL.D)
  const [levelDraft, setLevelDraft] = useState<string>(() => String(FAMILIAR_GRADE_MAX_LEVEL.D))
  const [selectedBondId, setSelectedBondId] = useState<FamiliarBondId | null>(null)
  const [mainAttr1, setMainAttr1] = useState<FamiliarAttribute>('Loyalty')
  const [mainAttr2, setMainAttr2] = useState<FamiliarAttribute>('Ferocity')
  const [attrValues, setAttrValues] = useState<Record<FamiliarAttribute, number>>(DEFAULT_ATTRIBUTES)
  const [selectedKnacks, setSelectedKnacks] = useState<FamiliarKnack[]>(['Other'])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [rankFilter, setRankFilter] = useState<'all' | FamiliarGrade>('all')
  const [bondFilter, setBondFilter] = useState<'all' | FamiliarBondId | 'none'>('all')
  const [knackFilter, setKnackFilter] = useState<'all' | FamiliarKnack>('all')

  useEffect(() => {
    if (!selectedFamiliarId && releasedFamiliars.length > 0) {
      setSelectedFamiliarId(releasedFamiliars[0].id)
    }
  }, [selectedFamiliarId, releasedFamiliars])

  useEffect(() => {
    const max = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
    setSelectedLevel((prev) => {
      const next = Math.min(prev, max)
      setLevelDraft(String(next))
      return next
    })
  }, [selectedGrade])

  useEffect(() => {
    setLevelDraft(String(selectedLevel))
  }, [selectedFamiliarId, editingEntryId])

  const selectedFamiliar =
    releasedFamiliars.find((f) => f.id === selectedFamiliarId) ?? null

  const maxLevel = FAMILIAR_GRADE_MAX_LEVEL[selectedGrade]
  const computedIsAdult = selectedLevel === maxLevel
  const computedIsMutated = mutationMode === 'mutated'
  const knackSlots = selectedGrade === 'S' || selectedGrade === 'SS' ? 2 : 1

  const previewEntry: FamiliarOwnedEntry | null = useMemo(() => {
    if (!selectedFamiliar) return null
    return {
      id: 'preview',
      grade: selectedGrade,
      level: selectedLevel,
      isAdult: computedIsAdult,
      isMutated: computedIsMutated,
      attributes: { ...attrValues },
      mainAttributes: [mainAttr1, mainAttr2],
      bondId: selectedBondId,
      knacks: selectedKnacks.slice(0, knackSlots),
    }
  }, [
    selectedFamiliar,
    selectedGrade,
    selectedLevel,
    computedIsAdult,
    computedIsMutated,
    attrValues,
    mainAttr1,
    mainAttr2,
    selectedBondId,
    selectedKnacks,
    knackSlots,
  ])

  const scrollToAddForm = () => {
    document.getElementById('familiar-add-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const scrollToRoster = () => {
    document.getElementById('familiar-roster')?.scrollIntoView({
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
    scrollToRoster()
  }

  const removeFamiliar = (familiarId: string) => {
    setFamiliars((prev) => ({
      ...prev,
      [familiarId]: [],
    }))
  }

  const removeEntry = (familiarId: string, entryId: string) => {
    setFamiliars((prev) => ({
      ...prev,
      [familiarId]: (prev[familiarId] ?? []).filter((x: FamiliarOwnedEntry) => x.id !== entryId),
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

  const nestFamiliarsState: FamiliarsState = useMemo(() => {
    const result: FamiliarsState = {}
    for (const [fid, grade] of Object.entries(nestProgress)) {
      if (grade) {
        result[fid] = [{
          id: `nest-${fid}`,
          grade: grade as FamiliarGrade,
          level: FAMILIAR_GRADE_MAX_LEVEL[grade as FamiliarGrade],
          isAdult: false,
          isMutated: false,
          attributes: { ...DEFAULT_ATTRIBUTES },
          mainAttributes: ['Loyalty', 'Ferocity'],
          bondId: null,
          knacks: ['Other'],
        }]
      }
    }
    return result
  }, [nestProgress])

  const stepNestProgress = (familiarId: string, direction: -1 | 1) => {
    const currentGrade = (nestProgress[familiarId] ?? null) as FamiliarGrade | null
    const idx = currentGrade ? GRADE_ORDER.indexOf(currentGrade) : -1
    const nextIdx = Math.max(-1, Math.min(GRADE_ORDER.length - 1, idx + direction))
    if (nextIdx === -1) {
      setNestProgress((prev) => { const next = { ...prev }; delete next[familiarId]; return next })
    } else {
      setNestProgress((prev) => ({ ...prev, [familiarId]: GRADE_ORDER[nextIdx] }))
    }
  }

  const totalCopies = useMemo(
    () => Object.values(familiars).reduce((sum, arr) => sum + (arr?.length ?? 0), 0),
    [familiars]
  )

  const filteredRoster = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const rows: { familiar: FamiliarDefinition; entry: FamiliarOwnedEntry }[] = []
    for (const f of familiarDefinitions) {
      for (const entry of familiars[f.id] ?? []) {
        if (q && !f.name.toLowerCase().includes(q)) continue
        if (rankFilter !== 'all' && entry.grade !== rankFilter) continue
        if (bondFilter !== 'all') {
          if (bondFilter === 'none' && entry.bondId !== null) continue
          if (bondFilter !== 'none' && entry.bondId !== bondFilter) continue
        }
        if (knackFilter !== 'all' && !entry.knacks.includes(knackFilter)) continue
        rows.push({ familiar: f, entry })
      }
    }
    rows.sort(
      (a, b) =>
        a.familiar.name.localeCompare(b.familiar.name) || a.entry.id.localeCompare(b.entry.id)
    )
    return rows
  }, [familiars, searchText, rankFilter, bondFilter, knackFilter])

  const trackerEntriesForBonds = useMemo(
    () =>
      releasedFamiliars.flatMap((f) =>
        (familiars[f.id] ?? []).map((entry: FamiliarOwnedEntry) => ({ familiar: f, entry }))
      ),
    [familiars, releasedFamiliars]
  )

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-red-400">Familiars</CardTitle>
          <div className="text-xs text-gray-400">{totalCopies} in roster</div>
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
            <div className="text-xs text-gray-400 mb-4 rounded-lg border border-amber-900/30 bg-amber-950/15 px-3 py-2.5 leading-relaxed">
              <strong className="text-amber-200/90">Per-nest bonuses:</strong> each nest unlocks stats for{' '}
              <span className="text-gray-300">that nest&apos;s familiars only</span>. They are not added together
              across all nests — e.g. Shadewoods progress helps Imp / Griphalkin / etc., not Gremlin or Zombunny.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nests.map((nest) => {
                const isExclusive = nest.id === 'mythborn'
                const nestLv = getNestLevel(nest, nestFamiliarsState)
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
                          const nestGrade = (nestProgress[fid] ?? null) as FamiliarGrade | null
                          const best = nestGrade ? { id: `nest-${fid}`, grade: nestGrade, level: FAMILIAR_GRADE_MAX_LEVEL[nestGrade], isAdult: false, isMutated: false, attributes: { ...DEFAULT_ATTRIBUTES }, mainAttributes: ['Loyalty', 'Ferocity'] as [FamiliarAttribute, FamiliarAttribute], bondId: null, knacks: [] as FamiliarKnack[] } : null
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
                      <NestLevelsAndBonuses nest={nest} familiars={nestFamiliarsState} />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="tracker" className="pt-4">
            <Card id="familiar-roster" className="bg-gray-900/60 border-gray-700 mb-4">
              <CardHeader className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-gray-200">Your roster</CardTitle>
                  <button
                    type="button"
                    onClick={scrollToAddForm}
                    className="text-xs text-red-300 hover:text-red-200 underline text-left sm:text-right"
                  >
                    + Add / edit familiar (below)
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  />
                  <select
                    value={rankFilter}
                    onChange={(e) => setRankFilter(e.target.value as 'all' | FamiliarGrade)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Ranks</option>
                    {GRADE_ORDER.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={bondFilter}
                    onChange={(e) => setBondFilter(e.target.value as 'all' | FamiliarBondId | 'none')}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Bonds</option>
                    <option value="none">No bond</option>
                    {familiarBondDefinitions.map((b) => (
                      <option key={b.id} value={b.id}>{b.displayName}</option>
                    ))}
                  </select>
                  <select
                    value={knackFilter}
                    onChange={(e) => setKnackFilter(e.target.value as 'all' | FamiliarKnack)}
                    className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-2"
                  >
                    <option value="all">All Knacks</option>
                    {KNACK_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {filteredRoster.length === 0 ? (
                  <div className="min-h-[12rem] rounded-xl border-2 border-dashed border-gray-600/80 bg-gray-950/40 flex flex-col items-center justify-center gap-2 px-4 text-center py-8">
                    <p className="text-sm text-gray-400">Nothing tracked yet — roster is empty.</p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Use the form below to add familiars. You can add multiple copies of the same species (each with its own rank, bond, and knacks).
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 border-gray-600 text-gray-200"
                      onClick={scrollToAddForm}
                    >
                      Open add form
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredRoster.map(({ familiar: f, entry }) => (
                      <div
                        key={`${f.id}-${entry.id}`}
                        className="rounded-xl border border-gray-700/60 bg-gray-950/30 py-3 px-1 flex flex-col items-center gap-2"
                      >
                        <TrackerPortrait familiar={f} state={entry} />
                        <div className="text-sm font-medium text-gray-100 text-center leading-tight px-1">{f.name}</div>
                        <div className="text-[11px] text-gray-500 text-center">
                          Lv {entry.level}
                          {entry.isAdult ? ' · Adult' : ''}
                          {entry.isMutated ? ' · Mutated' : ''}
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => editFamiliar(f.id, entry.id)}
                            className="text-[10px] px-2 py-1 rounded-full bg-blue-600/25 text-blue-200 hover:bg-blue-600/40"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => addAnother(f.id)}
                            className="text-[10px] px-2 py-1 rounded-full bg-green-600/20 text-green-200 hover:bg-green-600/35"
                          >
                            + Same species
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry(f.id, entry.id)}
                            className="text-[10px] px-2 py-1 rounded-full bg-red-600/20 text-red-200 hover:bg-red-600/35"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="familiar-add-form" className="bg-gray-900/60 border-gray-700 mb-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold text-gray-200">Add / Upgrade Familiar</CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-3 pt-0 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    <TrackerPortrait familiar={selectedFamiliar} state={previewEntry} />
                    <div className="text-[10px] text-gray-500 mt-2 max-w-[15rem]">
                      If level reaches max for rank, it counts as Adult. Preview matches roster cards.
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
                                className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs text-white"
                                {...nonNegativeIntInputProps(attrValues[attr], (n) =>
                                  setAttrValues((prev) => ({ ...prev, [attr]: n }))
                                )}
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
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={levelDraft}
                          onChange={(e) => {
                            const v = e.target.value
                            setLevelDraft(v)
                            if (v === '') return
                            const n = parseInt(v, 10)
                            if (!Number.isNaN(n)) setSelectedLevel(Math.max(1, Math.min(n, maxLevel)))
                          }}
                          onBlur={() => {
                            if (levelDraft.trim() === '') {
                              setLevelDraft('1')
                              setSelectedLevel(1)
                              return
                            }
                            const n = parseInt(levelDraft, 10)
                            if (Number.isNaN(n)) {
                              setLevelDraft(String(selectedLevel))
                            } else {
                              const cl = Math.max(1, Math.min(n, maxLevel))
                              setSelectedLevel(cl)
                              setLevelDraft(String(cl))
                            }
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
          </TabsContent>

          <TabsContent value="bonds" className="pt-4">
            <div className="text-sm font-semibold text-gray-200 mb-3">Familiar Bonds</div>
            <p className="text-xs text-gray-500 mb-4 max-w-3xl">
              Tier is based on your <span className="text-gray-400">lowest main attribute</span> vs each threshold
              (workshop bonds use different numbers than standard). Each card shows the{' '}
              <span className="text-amber-300/90">highest tier</span> any of your familiars with this bond qualify for —
              it updates when you add or change familiars in the tracker.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {familiarBondDefinitions.map((def) => {
                const withBond = trackerEntriesForBonds.filter((x) => x.entry.bondId === def.id)
                const bestUnlocked = getBestUnlockedBondTier(def, withBond)
                const activeLevel = bestUnlocked
                const effectText =
                  activeLevel >= 2 ? def.effectsByLevel[activeLevel as 2 | 3 | 4 | 5 | 6] : null
                const nextTier = activeLevel < 6 ? ((activeLevel + 1) as 2 | 3 | 4 | 5 | 6) : null
                const nextThreshold = nextTier ? getBondValue(def, nextTier) : null
                const tier2Threshold = getBondValue(def, 2)

                return (
                  <Card key={def.id} className="bg-gray-900/60 border-gray-700 overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch">
                        <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 items-center sm:items-start shrink-0 sm:w-[7.5rem]">
                          <img
                            src={`/FamiliarAssets/Bonds/${def.assetFile}`}
                            alt=""
                            className="w-[4.5rem] h-[4.5rem] sm:w-[6.5rem] sm:h-[6.5rem] object-contain drop-shadow-lg mx-auto sm:mx-0"
                          />
                          <div className="flex-1 sm:flex-none min-w-0 text-center sm:text-left">
                            <div className="text-base font-semibold text-gray-100 leading-tight">{def.displayName}</div>
                            <div className="text-[11px] text-gray-400 mt-1">
                              {def.type === 'workshop' ? (
                                <span className="text-violet-300/90">Workshop bond</span>
                              ) : (
                                <span>Standard bond</span>
                              )}
                            </div>
                            <div className="mt-2 inline-flex items-center rounded-md border border-amber-500/35 bg-amber-950/30 px-2 py-1">
                              <span className="text-[10px] text-gray-400 mr-1">Active tier</span>
                              <span className="text-lg font-bold text-amber-300 tabular-nums">{bestUnlocked}</span>
                              <span className="text-[10px] text-gray-500 ml-0.5">/ 6</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-3 sm:border-l sm:border-gray-700/50 sm:pl-5">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Current effect</div>
                            {effectText ? (
                              <p className="text-sm text-gray-100 leading-relaxed">
                                <BondEffectHighlight text={effectText} />
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Locked — add a familiar with this bond and raise both{' '}
                                <span className="text-gray-400">main attributes</span> to at least{' '}
                                <span className="text-amber-300 font-bold tabular-nums">{tier2Threshold}</span> for tier
                                2.
                              </p>
                            )}
                          </div>

                          <div className="rounded-lg bg-gray-950/60 border border-gray-700/60 px-3 py-2.5 space-y-1.5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Thresholds</div>
                            {bestUnlocked >= 2 ? (
                              <>
                                <div className="text-xs text-gray-300 leading-snug">
                                  Tier <span className="text-amber-300 font-bold tabular-nums">{bestUnlocked}</span> needs
                                  both mains ≥{' '}
                                  <span className="text-amber-300 font-bold tabular-nums">
                                    {getBondValue(def, bestUnlocked as 2 | 3 | 4 | 5 | 6)}
                                  </span>
                                  .
                                </div>
                                {nextTier != null && nextThreshold != null && (
                                  <div className="text-[11px] text-gray-500">
                                    Next: tier <span className="text-gray-300 font-medium">{nextTier}</span> at{' '}
                                    <span className="text-amber-300 font-bold tabular-nums">{nextThreshold}</span> on both
                                    mains.
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 leading-snug">
                                Tier 2 unlocks when both mains are ≥{' '}
                                <span className="text-amber-300 font-bold tabular-nums">{tier2Threshold}</span>.
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-gray-500 mt-auto pt-1">
                            {withBond.length === 0
                              ? 'No familiars with this bond yet.'
                              : `${withBond.length} familiar(s) have this bond — highest qualifying tier applies.`}
                          </div>
                        </div>
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
