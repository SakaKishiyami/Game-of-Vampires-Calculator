"use client"

import { useMemo } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CHILD_MARRIAGE_RING_KEYS, CHILD_RING_IMAGES } from '@/data/childrenPlanner'
import {
  childRankFromTotalAttributes,
  computeMarriageSelection,
  readAllRingCounts,
} from '@/utils/calculators/childrenPlannerCalculations'
import { formatItemName, nonNegativeIntInputProps } from '@/utils/helpers'
import type { ChildPlannerEntry } from '@/types'

function newChildRow(): ChildPlannerEntry {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    totalAttributes: 0,
  }
}

export default function ChildrenPlannerTab() {
  const {
    inventory,
    updateInventoryItem,
    childrenPlannerEntries,
    setChildrenPlannerEntries,
  } = useGameCalculator()

  const ringCounts = useMemo(() => readAllRingCounts(inventory), [inventory])

  const selection = useMemo(
    () => computeMarriageSelection(childrenPlannerEntries, ringCounts),
    [childrenPlannerEntries, ringCounts]
  )

  const setRing = (canonicalKey: string, count: number) => {
    updateInventoryItem(canonicalKey, Math.max(0, Math.floor(count)))
  }

  const updateEntry = (id: string, patch: Partial<ChildPlannerEntry>) => {
    setChildrenPlannerEntries((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }

  const removeEntry = (id: string) => {
    setChildrenPlannerEntries((rows) => rows.filter((r) => r.id !== id))
  }

  const ringCards = [
    {
      key: 'blackPearl' as const,
      invKey: CHILD_MARRIAGE_RING_KEYS.blackPearl,
      title: 'Black Pearl ring',
      subtitle: 'Ranks 1–2 (Diamond / Ruby rank) — ≥40K total attributes',
      count: ringCounts.blackPearl,
    },
    {
      key: 'ruby' as const,
      invKey: CHILD_MARRIAGE_RING_KEYS.ruby,
      title: 'Ruby ring',
      subtitle: 'Ranks 3–4 (Platinum / Gold) — 10K–39,999',
      count: ringCounts.ruby,
    },
    {
      key: 'amethyst' as const,
      invKey: CHILD_MARRIAGE_RING_KEYS.amethyst,
      title: 'Amethyst ring',
      subtitle: 'Rank 5 (Silver) — 5K–9,999',
      count: ringCounts.amethyst,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ringCards.map((r) => (
          <Card key={r.key} className="bg-gray-800/50 border-gray-600 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex gap-3 items-start">
                <img
                  src={CHILD_RING_IMAGES[r.key]}
                  alt=""
                  className="w-16 h-16 object-contain shrink-0 rounded-md bg-gray-900/70 border border-gray-700 p-1"
                />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base text-red-300">{r.title}</CardTitle>
                  <p className="text-xs text-gray-500 font-mono">{formatItemName(r.invKey)}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.subtitle}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Label className="text-gray-400 text-xs">Owned (inventory)</Label>
              <Input
                className="mt-1 bg-gray-900 border-gray-600"
                {...nonNegativeIntInputProps(r.count, (n) => setRing(r.invKey, n), { zeroShowsEmpty: false })}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="bg-gray-800/50 border-green-900/40">
            <CardHeader>
              <CardTitle className="text-base text-green-300">Estimated DOM gain from marriages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-semibold text-green-200 tabular-nums">
                +{selection.projectedMarriageDom.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sum of the selected children&apos;s totals: each child&apos;s value is already in your current DOM; this
                is the modeled <strong className="text-gray-300">spouse-side</strong> bump when each marries at a
                similar tier. This amount is added to <strong className="text-gray-300">Current DOM</strong> and{' '}
                <strong className="text-gray-300">Total DOM</strong> at the top (split evenly across the four attributes
                so the per-stat rows stay consistent).
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-base text-amber-200">Selected for rings</CardTitle>
              <p className="text-xs text-gray-400">Highest total attributes first, up to ring counts.</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">
                  Black pearl ({selection.selectedBlackPearl.length} / {ringCounts.blackPearl})
                </div>
                <ul className="list-disc pl-5 text-gray-200 space-y-1">
                  {selection.selectedBlackPearl.length === 0 ? (
                    <li className="text-gray-500 list-none">None</li>
                  ) : (
                    selection.selectedBlackPearl.map((c) => (
                      <li key={c.id}>
                        {c.name || 'Child'} — {c.totalAttributes.toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">
                  Ruby ({selection.selectedRuby.length} / {ringCounts.ruby})
                </div>
                <ul className="list-disc pl-5 text-gray-200 space-y-1">
                  {selection.selectedRuby.length === 0 ? (
                    <li className="text-gray-500 list-none">None</li>
                  ) : (
                    selection.selectedRuby.map((c) => (
                      <li key={c.id}>
                        {c.name || 'Child'} — {c.totalAttributes.toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">
                  Amethyst ({selection.selectedAmethyst.length} / {ringCounts.amethyst})
                </div>
                <ul className="list-disc pl-5 text-gray-200 space-y-1">
                  {selection.selectedAmethyst.length === 0 ? (
                    <li className="text-gray-500 list-none">None</li>
                  ) : (
                    selection.selectedAmethyst.map((c) => (
                      <li key={c.id}>
                        {c.name || 'Child'} — {c.totalAttributes.toLocaleString()}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gray-800/50 border-gray-600 h-full">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg text-white">Children</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Rank: ≥70K Diamond (1), ≥40K Ruby rank (2), ≥20K Platinum (3), ≥10K Gold (4), ≥5K Silver (5). Under 5K
                  excluded.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-red-700 hover:bg-red-600 shrink-0"
                onClick={() => setChildrenPlannerEntries((prev) => [...prev, newChildRow()])}
              >
                Add child
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {childrenPlannerEntries.length === 0 ? (
                <p className="text-sm text-gray-500">No rows yet — add a child and enter total attributes.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-700 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900/90 text-gray-400 text-left">
                      <tr>
                        <th className="p-2 w-40">Name</th>
                        <th className="p-2 w-36">Total attrs</th>
                        <th className="p-2">Rank</th>
                        <th className="p-2 w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {childrenPlannerEntries.map((row) => {
                        const tier = childRankFromTotalAttributes(row.totalAttributes)
                        return (
                          <tr key={row.id} className="border-t border-gray-800">
                            <td className="p-2">
                              <Input
                                className="bg-gray-900 border-gray-600 h-8"
                                value={row.name}
                                placeholder="Optional"
                                onChange={(e) => updateEntry(row.id, { name: e.target.value })}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                className="bg-gray-900 border-gray-600 h-8"
                                {...nonNegativeIntInputProps(row.totalAttributes, (n) =>
                                  updateEntry(row.id, { totalAttributes: n })
                                )}
                              />
                            </td>
                            <td className="p-2 text-gray-200">
                              {tier ? (
                                <span>
                                  {tier.rank} — {tier.label}{' '}
                                  <span className="text-gray-500">
                                    (
                                    {tier.ring === 'blackPearl'
                                      ? 'Black pearl'
                                      : tier.ring === 'ruby'
                                        ? 'Ruby'
                                        : 'Amethyst'}
                                    )
                                  </span>
                                </span>
                              ) : (
                                <span className="text-gray-500">— (&lt;5K)</span>
                              )}
                            </td>
                            <td className="p-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-400"
                                onClick={() => removeEntry(row.id)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
