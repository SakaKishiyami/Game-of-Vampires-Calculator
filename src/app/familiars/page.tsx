'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  familiarDefinitions,
  nests,
  buildFamiliarSummaries,
  getUniqueCoreTypes,
  getUniqueBondTypes,
  type UserFamiliarInstance,
  type FamiliarGrade,
  type FamiliarRarity,
} from '@/data/familiars'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FamiliarTypeSummary } from '@/data/familiars'

const RARITY_ORDER: FamiliarRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const GRADE_ORDER: FamiliarGrade[] = ['D', 'C', 'B', 'A', 'S', 'SS']

type LifeStageFilter = 'all' | 'baby' | 'adult'
type MutationFilter = 'all' | 'normal' | 'mutated'
type SortKey = 'name' | 'rarity' | 'nest' | 'owned' | 'bestGrade' | 'coreType' | 'bondType'

const RARITY_COLOR: Record<FamiliarRarity, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}
const RARITY_BG: Record<FamiliarRarity, string> = {
  common: 'bg-gray-600/40',
  uncommon: 'bg-green-900/40',
  rare: 'bg-blue-900/40',
  epic: 'bg-purple-900/40',
  legendary: 'bg-amber-900/40',
}

export default function FamiliarsPage() {
  const [instances, setInstances] = useState<UserFamiliarInstance[]>([])
  const [coreTypeFilter, setCoreTypeFilter] = useState<string>('all')
  const [bondTypeFilter, setBondTypeFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [lifeStage, setLifeStage] = useState<LifeStageFilter>('all')
  const [mutation, setMutation] = useState<MutationFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')

  const summaries = useMemo(() => buildFamiliarSummaries(instances), [instances])

  const coreTypes = useMemo(() => getUniqueCoreTypes(), [])
  const bondTypes = useMemo(() => getUniqueBondTypes(), [])

  const filteredAndSorted = useMemo(() => {
    let list: FamiliarTypeSummary[] = [...summaries]

    if (ownedOnly) list = list.filter((s) => s.owned > 0)
    if (coreTypeFilter !== 'all') list = list.filter((s) => s.definition.coreType === coreTypeFilter)
    if (bondTypeFilter !== 'all') list = list.filter((s) => s.definition.bondType === bondTypeFilter)
    if (rarityFilter !== 'all') list = list.filter((s) => s.definition.rarity === rarityFilter)
    if (lifeStage === 'baby') list = list.filter((s) => s.babyCount > 0)
    if (lifeStage === 'adult') list = list.filter((s) => s.adultCount > 0)
    if (mutation === 'normal') list = list.filter((s) => s.normalCount > 0)
    if (mutation === 'mutated') list = list.filter((s) => s.mutatedCount > 0)

    const cmp = (a: FamiliarTypeSummary, b: FamiliarTypeSummary): number => {
      switch (sortBy) {
        case 'name':
          return a.definition.name.localeCompare(b.definition.name)
        case 'rarity':
          return RARITY_ORDER.indexOf(a.definition.rarity) - RARITY_ORDER.indexOf(b.definition.rarity)
        case 'nest':
          return a.nest.name.localeCompare(b.nest.name)
        case 'owned':
          return b.owned - a.owned
        case 'bestGrade':
          const ga = a.bestGrade ? GRADE_ORDER.indexOf(a.bestGrade) : -1
          const gb = b.bestGrade ? GRADE_ORDER.indexOf(b.bestGrade) : -1
          return gb - ga
        case 'coreType':
          return a.definition.coreType.localeCompare(b.definition.coreType)
        case 'bondType':
          return a.definition.bondType.localeCompare(b.definition.bondType)
        default:
          return 0
      }
    }
    list.sort(cmp)
    return list
  }, [summaries, ownedOnly, coreTypeFilter, bondTypeFilter, rarityFilter, lifeStage, mutation, sortBy])

  const addOne = (definitionId: string, isAdult: boolean, isMutated: boolean) => {
    setInstances((prev) => [
      ...prev,
      { definitionId, grade: 'D', isAdult, isMutated },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Familiar Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track which familiars you own, baby vs adult, mutated or normal, and by type. Link to{' '}
            <Link href="/calculator" className="text-purple-300 hover:text-purple-200 underline">
              Courtyard
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Filters & sort */}
      <Card className="bg-gray-800/60 border-gray-600">
        <CardHeader className="py-3">
          <CardTitle className="text-base text-white">Filters & sort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
                className="rounded border-gray-500"
              />
              Owned only
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Core:</span>
              <select
                value={coreTypeFilter}
                onChange={(e) => setCoreTypeFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All</option>
                {coreTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Bond:</span>
              <select
                value={bondTypeFilter}
                onChange={(e) => setBondTypeFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All</option>
                {bondTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Rarity:</span>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All</option>
                {RARITY_ORDER.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Stage:</span>
              <select
                value={lifeStage}
                onChange={(e) => setLifeStage(e.target.value as LifeStageFilter)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="baby">Has baby</option>
                <option value="adult">Has adult</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Mutation:</span>
              <select
                value={mutation}
                onChange={(e) => setMutation(e.target.value as MutationFilter)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="normal">Normal only</option>
                <option value="mutated">Mutated only</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="name">Name</option>
                <option value="rarity">Rarity</option>
                <option value="nest">Nest</option>
                <option value="owned">Owned count</option>
                <option value="bestGrade">Best grade</option>
                <option value="coreType">Core type</option>
                <option value="bondType">Bond type</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAndSorted.map((summary) => {
          const { definition, nest, owned, adultCount, babyCount, mutatedCount, normalCount, bestGrade } = summary
          const rarityColor = RARITY_COLOR[definition.rarity] ?? 'text-gray-400'
          const rarityBg = RARITY_BG[definition.rarity] ?? 'bg-gray-700/40'
          const imgSrc =
            definition.images?.baby ??
            definition.images?.adult ??
            null

          return (
            <Card key={definition.id} className={`bg-gray-800/60 border-gray-600 overflow-hidden ${owned > 0 ? 'ring-1 ring-purple-500/40' : ''}`}>
              <div className="aspect-square bg-gray-900/80 flex items-center justify-center p-2">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={definition.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-600 text-4xl">?</div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white truncate">{definition.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${rarityBg} ${rarityColor}`}>
                    {definition.rarity}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  <span className="text-gray-500">Nest:</span> {nest.name}
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="text-gray-500">{definition.coreType}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{definition.bondType}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-300">
                  <span>Owned: {owned}</span>
                  {owned > 0 && (
                    <>
                      <span>Baby: {babyCount}</span>
                      <span>Adult: {adultCount}</span>
                      <span>Normal: {normalCount}</span>
                      <span>Mutated: {mutatedCount}</span>
                      {bestGrade && (
                        <span className="text-amber-400">Best: {bestGrade}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs border-gray-600"
                    onClick={() => addOne(definition.id, false, false)}
                  >
                    + Baby
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs border-gray-600"
                    onClick={() => addOne(definition.id, true, false)}
                  >
                    + Adult
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-gray-600"
                    onClick={() => addOne(definition.id, false, true)}
                  >
                    + Mutant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="text-center text-gray-400 text-sm">
          No familiars match the current filters. Try changing filters or add some with the buttons above.
        </p>
      )}
    </div>
  )
}
