/**
 * Coerce saved skin rarity values to numeric codes (1 = purple, 2 = orange, 3 = red).
 * Older JSON used strings 'purple' | 'orange' | 'red'.
 */
import type { WardenSkinRarityOverrides, LoverSkinRarities } from '@/types'
import type { WardenSkinRarity, LoverSkinRarity } from '@/data/skinLedger'

export function coerceWardenSkinRarity(v: unknown): WardenSkinRarity {
  if (v === 1 || v === 2 || v === 3) return v
  if (v === 'purple') return 1
  if (v === 'orange') return 2
  if (v === 'red') return 3
  return 1
}

export function coerceLoverSkinRarity(v: unknown): LoverSkinRarity {
  if (v === 1 || v === 2) return v
  if (v === 'purple') return 1
  if (v === 'orange') return 2
  return 1
}

export function normalizeWardenSkinRarityOverrides(raw: unknown): WardenSkinRarityOverrides {
  if (!raw || typeof raw !== 'object') return {}
  const out: WardenSkinRarityOverrides = {}
  for (const [warden, skins] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!skins || typeof skins !== 'object') continue
    out[warden] = {}
    for (const [skinKey, val] of Object.entries(skins)) {
      out[warden][skinKey] = coerceWardenSkinRarity(val)
    }
  }
  return out
}

export function normalizeLoverSkinRarities(raw: unknown): LoverSkinRarities {
  if (!raw || typeof raw !== 'object') return {}
  const out: LoverSkinRarities = {}
  for (const [base, skins] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!skins || typeof skins !== 'object') continue
    out[base] = {}
    for (const [skinKey, val] of Object.entries(skins)) {
      out[base][skinKey] = coerceLoverSkinRarity(val)
    }
  }
  return out
}
