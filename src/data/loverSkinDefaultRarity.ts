import type { LoverSkinRarity, WardenSkinRarity } from '@/data/skinLedger'
import { SKIN_RARITY_LOVER } from '@/data/skinLedger'
import { scarletBondData } from '@/data/scarletBonds'
import { WARDEN_CATALOG } from '@/data/wardenCatalog'
import { getDefaultWardenSkinRarity } from '@/data/wardenSkinDefaultRarity'

/**
 * Optional explicit defaults per lover base + skin key (overrides pairing from warden row).
 * Edit when the game assigns a lover skin rarity that does not follow the paired warden’s cosmetic tier.
 */
export const LOVER_SKIN_RARITY_DEFAULTS: Record<string, Partial<Record<string, LoverSkinRarity>>> = {}

/**
 * Lover base name → bonded warden (from Scarlet Bond rows). Used to copy default cosmetic tiers from
 * `WARDEN_SKIN_RARITY_DEFAULTS` / `getDefaultWardenSkinRarity` by matching skin key on that warden, or by
 * skin index when keys differ (e.g. AgneyiSkin1 ↔ RudraSkin1 at index 0).
 */
export function buildLoverBaseToWardenFromBonds(): Record<string, string> {
  const m: Record<string, string> = {}
  for (const row of scarletBondData) {
    const lover = row.lover.trim()
    const { warden } = row
    if (lover.includes('/')) {
      for (const part of lover.split('/').map((s) => s.trim())) {
        if (part) m[part] = warden
      }
    } else {
      m[lover] = warden
    }
  }
  return m
}

export const LOVER_BASE_TO_WARDEN_DEFAULT_RARITY = buildLoverBaseToWardenFromBonds()

/** Map warden Epic/Legendary/Supreme (1/2/3) to lover Epic/Legendary (1/2). Supreme lines up with Legendary on lovers. */
export function wardenRarityToLoverDefault(wr: WardenSkinRarity): LoverSkinRarity {
  if (wr === 3) return SKIN_RARITY_LOVER.ORANGE
  return wr as LoverSkinRarity
}

export function getDefaultLoverSkinRarity(
  loverBase: string,
  skinKey: string,
  skinIndex: number,
  totalSkins: number
): LoverSkinRarity {
  const explicit = LOVER_SKIN_RARITY_DEFAULTS[loverBase]?.[skinKey]
  if (explicit !== undefined) return explicit

  const wardenName = LOVER_BASE_TO_WARDEN_DEFAULT_RARITY[loverBase]
  if (!wardenName) {
    if (totalSkins >= 2) return skinIndex === 0 ? SKIN_RARITY_LOVER.PURPLE : SKIN_RARITY_LOVER.ORANGE
    return SKIN_RARITY_LOVER.PURPLE
  }

  const catalog = WARDEN_CATALOG.find((w) => w.name === wardenName)
  const wardenSkins = catalog?.skins?.length ? [...catalog.skins] : []

  const idxByKey = wardenSkins.indexOf(skinKey)
  if (idxByKey >= 0) {
    const wr = getDefaultWardenSkinRarity(wardenName, skinKey, idxByKey, wardenSkins.length)
    return wardenRarityToLoverDefault(wr)
  }

  if (skinIndex < wardenSkins.length) {
    const wk = wardenSkins[skinIndex]
    const wr = getDefaultWardenSkinRarity(wardenName, wk, skinIndex, wardenSkins.length)
    return wardenRarityToLoverDefault(wr)
  }

  if (totalSkins >= 2) return skinIndex === 0 ? SKIN_RARITY_LOVER.PURPLE : SKIN_RARITY_LOVER.ORANGE
  return SKIN_RARITY_LOVER.PURPLE
}
