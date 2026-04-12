/**
 * Skin collection ledger: thresholds on total collection EXP from owned skins.
 * Benefits from tier 1..N stack when collection EXP reaches each threshold.
 */

/**
 * Cosmetic rarity is stored as small integers everywhere (saves, overrides, UI value=):
 *   1 = purple
 *   2 = orange
 *   3 = red (warden skins only; lovers use 1–2)
 */
export type WardenSkinRarity = 1 | 2 | 3
/** Lover skins only use purple (1) and orange (2). */
export type LoverSkinRarity = 1 | 2

/** Named constants for readability at call sites (values still 1 / 2 / 3). */
export const SKIN_RARITY_WARDEN: { readonly PURPLE: 1; readonly ORANGE: 2; readonly RED: 3 } = {
  PURPLE: 1,
  ORANGE: 2,
  RED: 3,
}

export const SKIN_RARITY_LOVER: { readonly PURPLE: 1; readonly ORANGE: 2 } = {
  PURPLE: 1,
  ORANGE: 2,
}

export const SKIN_LEDGER_ROWS = [
  { tier: 1, minCollection: 100, childrenTotalAttrsPct: 2, wardenAllFlat: 400, skinBaseBoostSteps: 0 },
  { tier: 2, minCollection: 200, childrenTotalAttrsPct: 0, wardenAllFlat: 600, skinBaseBoostSteps: 0 },
  { tier: 3, minCollection: 400, childrenTotalAttrsPct: 4, wardenAllFlat: 800, skinBaseBoostSteps: 0 },
  { tier: 4, minCollection: 600, childrenTotalAttrsPct: 0, wardenAllFlat: 1000, skinBaseBoostSteps: 1 },
  { tier: 5, minCollection: 1000, childrenTotalAttrsPct: 0, wardenAllFlat: 2000, skinBaseBoostSteps: 1 },
  { tier: 6, minCollection: 1500, childrenTotalAttrsPct: 6, wardenAllFlat: 3000, skinBaseBoostSteps: 0 },
  { tier: 7, minCollection: 2000, childrenTotalAttrsPct: 0, wardenAllFlat: 3500, skinBaseBoostSteps: 1 },
  { tier: 8, minCollection: 3000, childrenTotalAttrsPct: 8, wardenAllFlat: 8000, skinBaseBoostSteps: 0 },
] as const

/** Tier-1 lover skin bonuses; keys 1 = purple, 2 = orange. */
export const LOVER_SKIN_TIER1: Record<LoverSkinRarity, { intimacy: number; collectionExp: number; affinityGainPct: number }> = {
  1: { intimacy: 200, collectionExp: 50, affinityGainPct: 1 },
  2: { intimacy: 500, collectionExp: 100, affinityGainPct: 2 },
}

/** Tier-1 warden skin bonuses; keys 1 = purple, 2 = orange, 3 = red. */
export const WARDEN_SKIN_TIER1: Record<WardenSkinRarity, { attributeFlat: number; collectionExp: number }> = {
  1: { attributeFlat: 5, collectionExp: 50 },
  2: { attributeFlat: 10, collectionExp: 100 },
  3: { attributeFlat: 20, collectionExp: 400 },
}

export function describeWardenSkinRarity(r: WardenSkinRarity): string {
  switch (r) {
    case 1:
      return '1 — purple'
    case 2:
      return '2 — orange'
    case 3:
      return '3 — red'
  }
}

export function describeLoverSkinRarity(r: LoverSkinRarity): string {
  switch (r) {
    case 1:
      return '1 — purple'
    case 2:
      return '2 — orange'
  }
}
