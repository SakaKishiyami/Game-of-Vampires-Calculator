import type { Inventory, ChildPlannerEntry } from '@/types'
import { CHILD_RING_KEY_ALIASES } from '@/data/childrenPlanner'

export type { ChildPlannerEntry }

export type ChildRankTier =
  | { rank: 1; label: 'Diamond'; ring: 'blackPearl' }
  | { rank: 2; label: 'Ruby (rank)'; ring: 'blackPearl' }
  | { rank: 3; label: 'Platinum'; ring: 'ruby' }
  | { rank: 4; label: 'Gold'; ring: 'ruby' }
  | { rank: 5; label: 'Silver'; ring: 'amethyst' }

/** Below 5K total attributes: excluded from ring planner. */
export function childRankFromTotalAttributes(total: number): ChildRankTier | null {
  if (total < 5000) return null
  if (total >= 70000) return { rank: 1, label: 'Diamond', ring: 'blackPearl' }
  if (total >= 40000) return { rank: 2, label: 'Ruby (rank)', ring: 'blackPearl' }
  if (total >= 20000) return { rank: 3, label: 'Platinum', ring: 'ruby' }
  if (total >= 10000) return { rank: 4, label: 'Gold', ring: 'ruby' }
  return { rank: 5, label: 'Silver', ring: 'amethyst' }
}

export function getInventoryRingCount(inventory: Inventory, canonicalKey: string): number {
  const aliases = CHILD_RING_KEY_ALIASES[canonicalKey] ?? [canonicalKey]
  for (const k of aliases) {
    const c = inventory[k]?.count
    if (c !== undefined && c !== null) return Math.max(0, Math.floor(Number(c)))
  }
  return 0
}

export function computeMarriageSelection(
  entries: ChildPlannerEntry[],
  ringCounts: { blackPearl: number; ruby: number; amethyst: number }
): {
  selectedBlackPearl: ChildPlannerEntry[]
  selectedRuby: ChildPlannerEntry[]
  selectedAmethyst: ChildPlannerEntry[]
  projectedMarriageDom: number
} {
  const bpPool = entries
    .filter((e) => e.totalAttributes >= 40000)
    .sort((a, b) => b.totalAttributes - a.totalAttributes)
  const rubyPool = entries
    .filter((e) => e.totalAttributes >= 10000 && e.totalAttributes < 40000)
    .sort((a, b) => b.totalAttributes - a.totalAttributes)
  const amyPool = entries
    .filter((e) => e.totalAttributes >= 5000 && e.totalAttributes < 10000)
    .sort((a, b) => b.totalAttributes - a.totalAttributes)

  const selectedBlackPearl = bpPool.slice(0, Math.min(ringCounts.blackPearl, bpPool.length))
  const selectedRuby = rubyPool.slice(0, Math.min(ringCounts.ruby, rubyPool.length))
  const selectedAmethyst = amyPool.slice(0, Math.min(ringCounts.amethyst, amyPool.length))

  /**
   * Incremental DOM from marrying off the selected children only (spouse side).
   * Each child's own total is already in your current DOM; a spouse matched via the ring
   * contributes roughly the same attribute total again → net gain ≈ sum of those child totals
   * (e.g. 100K child + ~100K spouse ⇒ 200K on the pair, +100K vs today).
   */
  const projectedMarriageDom =
    selectedBlackPearl.reduce((s, e) => s + e.totalAttributes, 0) +
    selectedRuby.reduce((s, e) => s + e.totalAttributes, 0) +
    selectedAmethyst.reduce((s, e) => s + e.totalAttributes, 0)

  return { selectedBlackPearl, selectedRuby, selectedAmethyst, projectedMarriageDom }
}

export function readAllRingCounts(inventory: Inventory) {
  const bp = CHILD_RING_KEY_ALIASES.BlackPearlRing3[0]
  const rb = CHILD_RING_KEY_ALIASES.RubyRing2[0]
  const am = CHILD_RING_KEY_ALIASES.AmethystRing1[0]
  return {
    blackPearl: getInventoryRingCount(inventory, bp),
    ruby: getInventoryRingCount(inventory, rb),
    amethyst: getInventoryRingCount(inventory, am),
  }
}
