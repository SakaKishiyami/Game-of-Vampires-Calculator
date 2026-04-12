import type { WardenSkinRarity } from '@/data/skinLedger'
import { SKIN_RARITY_WARDEN } from '@/data/skinLedger'

/**
 * Explicit defaults where PNG color ≠ heuristic.
 * Values: 1 = purple, 2 = orange, 3 = red (see `skinLedger.ts`).
 *
 * Heuristic when not listed: one skin → 1 (purple); two skins → first 1, second 2.
 */
export const WARDEN_SKIN_RARITY_DEFAULTS: Record<string, Partial<Record<string, WardenSkinRarity>>> = {
  Rudra: { RudraSkin1: SKIN_RARITY_WARDEN.ORANGE, RudraSkin2: SKIN_RARITY_WARDEN.RED },
}

export function getDefaultWardenSkinRarity(
  wardenName: string,
  skinKey: string,
  skinIndex: number,
  totalSkins: number
): WardenSkinRarity {
  const explicit = WARDEN_SKIN_RARITY_DEFAULTS[wardenName]?.[skinKey]
  if (explicit !== undefined) return explicit
  if (totalSkins >= 2) return skinIndex === 0 ? SKIN_RARITY_WARDEN.PURPLE : SKIN_RARITY_WARDEN.ORANGE
  return SKIN_RARITY_WARDEN.PURPLE
}
