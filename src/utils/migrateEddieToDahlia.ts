import type { GameCalculatorState, Inventory } from '@/types'

/** Migration helper: only rename old lover token key EddieLoverToken -> DahliaToken. */
export function migrateEddieToDahliaInPartialState(
  data: Partial<GameCalculatorState> & Record<string, unknown>
): Partial<GameCalculatorState> & Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }

  if (out.inventory && typeof out.inventory === 'object') {
    const inv = { ...(out.inventory as Inventory) }
    const legacy = inv.EddieLoverToken
    if (legacy) {
      const next = inv.DahliaToken
      inv.DahliaToken = {
        count: (next?.count ?? 0) + legacy.count,
        lastUpdated: next?.lastUpdated ?? legacy.lastUpdated,
      }
      delete inv.EddieLoverToken
      out.inventory = inv
    }
  }

  if (out.inventoryImages && typeof out.inventoryImages === 'object') {
    const img = { ...(out.inventoryImages as Record<string, string>) }
    if (img.EddieLoverToken !== undefined) {
      img.DahliaToken = img.EddieLoverToken
      delete img.EddieLoverToken
      out.inventoryImages = img
    }
  }

  return out as Partial<GameCalculatorState> & Record<string, unknown>
}
