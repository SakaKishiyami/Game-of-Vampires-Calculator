import { SKIN_LEDGER_ROWS, LOVER_SKIN_TIER1, WARDEN_SKIN_TIER1, type WardenSkinRarity, type LoverSkinRarity } from '@/data/skinLedger'
import { WARDEN_CATALOG } from '@/data/wardenCatalog'
import { wardenAttributes } from '@/data/wardens'
import { getDefaultWardenSkinRarity } from '@/data/wardenSkinDefaultRarity'
import type {
  LoverOwnedSkins,
  LoverActiveSkins,
  WardenSkins,
  WardenActiveSkins,
  WardenSkinRarityOverrides,
  WardenSkinLevels,
  LoverSkinRarities,
} from '@/types'
import { getLoverSkinSlots } from '@/utils/loverImagePaths'
import { coerceLoverSkinRarity, coerceWardenSkinRarity } from '@/utils/calculators/skinRarityNormalize'

export interface LedgerAggregate {
  tier: number
  childrenTotalAttrsPct: number
  wardenAllFlat: number
  skinBaseBoostSteps: number
}

export function aggregateLedger(collectionExp: number): LedgerAggregate {
  let tier = 0
  let childrenTotalAttrsPct = 0
  let wardenAllFlat = 0
  let skinBaseBoostSteps = 0
  for (const row of SKIN_LEDGER_ROWS) {
    if (collectionExp >= row.minCollection) {
      tier = row.tier
      childrenTotalAttrsPct += row.childrenTotalAttrsPct
      wardenAllFlat += row.wardenAllFlat
      skinBaseBoostSteps += row.skinBaseBoostSteps
    }
  }
  return { tier, childrenTotalAttrsPct, wardenAllFlat, skinBaseBoostSteps }
}

export function wardenSkinRarityFlat(r: WardenSkinRarity): number {
  return WARDEN_SKIN_TIER1[r].attributeFlat
}

export function wardenSkinCollectionExp(r: WardenSkinRarity): number {
  return WARDEN_SKIN_TIER1[r].collectionExp
}

/** Base attribute from rarity at skin level 1, before ledger boosts and star doubling. */
export function adjustedWardenSkinAttributeBase(rarityFlat: number, ledgerSkinBaseBoostSteps: number): number {
  return rarityFlat * (1 + ledgerSkinBaseBoostSteps)
}

/** Skin star level: 1 = base only, each +1 level doubles from previous tier (×2 per level after 1). */
export function wardenSkinAttributeTotal(
  rarityFlat: number,
  ledgerSkinBaseBoostSteps: number,
  skinStarLevel: number
): number {
  const base = adjustedWardenSkinAttributeBase(rarityFlat, ledgerSkinBaseBoostSteps)
  const lv = Math.max(1, Math.floor(skinStarLevel))
  return base * Math.pow(2, lv - 1)
}

function attrLabelToKey(a: string): 'strength' | 'allure' | 'intellect' | 'spirit' | null {
  const x = a.toLowerCase()
  if (x === 'strength') return 'strength'
  if (x === 'allure') return 'allure'
  if (x === 'intellect') return 'intellect'
  if (x === 'spirit') return 'spirit'
  return null
}

/** Which DOM attributes receive the warden skin flat (tier-1 logic; dual = first listed main). */
export function wardenSkinTargetKeys(catalogAttrs: readonly string[], wardenName: string): Array<'strength' | 'allure' | 'intellect' | 'spirit'> {
  const attrs = catalogAttrs.length > 0 ? [...catalogAttrs] : (wardenAttributes[wardenName as keyof typeof wardenAttributes] ?? [])
  if (attrs.length === 0 || attrs.some((a) => a === 'Balance' || a === 'All')) {
    return ['strength', 'allure', 'intellect', 'spirit']
  }
  const first = attrs[0]
  const k = attrLabelToKey(first)
  return k ? [k] : ['strength']
}

export function resolveWardenSkinRarity(
  wardenName: string,
  skinKey: string,
  skinIndex: number,
  totalSkins: number,
  overrides: WardenSkinRarityOverrides
): WardenSkinRarity {
  const o = overrides[wardenName]?.[skinKey]
  return o !== undefined
    ? coerceWardenSkinRarity(o)
    : getDefaultWardenSkinRarity(wardenName, skinKey, skinIndex, totalSkins)
}

export function totalCollectionExpFromSkins(params: {
  wardenSkins: WardenSkins
  wardenSkinRarityOverrides: WardenSkinRarityOverrides
  loverOwnedSkins: LoverOwnedSkins
  loverSkinRarities: LoverSkinRarities
}): number {
  let sum = 0
  for (const w of WARDEN_CATALOG) {
    const owned = params.wardenSkins[w.name]
    if (!owned) continue
    const skins = [...w.skins]
    skins.forEach((skinKey, idx) => {
      if (!owned[skinKey]) return
      const r = resolveWardenSkinRarity(w.name, skinKey, idx, skins.length, params.wardenSkinRarityOverrides)
      sum += wardenSkinCollectionExp(r)
    })
  }
  for (const [baseName, skinsOwned] of Object.entries(params.loverOwnedSkins)) {
    if (!skinsOwned) continue
    for (const skinKey of Object.keys(skinsOwned)) {
      if (!skinsOwned[skinKey]) continue
      const lr = coerceLoverSkinRarity(params.loverSkinRarities[baseName]?.[skinKey])
      sum += LOVER_SKIN_TIER1[lr].collectionExp
    }
  }
  return sum
}

function loverSkinAffinityPctOneBase(
  baseName: string,
  loverActiveSkins: LoverActiveSkins,
  loverSkinRarities: LoverSkinRarities,
  loverOwnedSkins: LoverOwnedSkins
): number {
  const active = loverActiveSkins[baseName]
  if (!active || active === 'base') return 0
  if (!loverOwnedSkins[baseName]?.[active]) return 0
  const r = coerceLoverSkinRarity(loverSkinRarities[baseName]?.[active])
  return LOVER_SKIN_TIER1[r].affinityGainPct
}

/** `loverBondField` is the bond CSV lover side, e.g. `Agneyi` or `Raven/Raven` or `Ember/Ash`. */
export function getLoverSkinAffinitySpeedPercent(
  loverBondField: string,
  loverActiveSkins: LoverActiveSkins,
  loverSkinRarities: LoverSkinRarities,
  loverOwnedSkins: LoverOwnedSkins
): number {
  return getLoverSkinSlots(loverBondField).reduce(
    (sum, slot) => sum + loverSkinAffinityPctOneBase(slot.baseName, loverActiveSkins, loverSkinRarities, loverOwnedSkins),
    0
  )
}

/** Sum intimacy from owned lover skins (tier-1 values). */
export function totalLoverSkinIntimacy(loverOwnedSkins: LoverOwnedSkins, loverSkinRarities: LoverSkinRarities): number {
  let sum = 0
  for (const [baseName, skinsOwned] of Object.entries(loverOwnedSkins)) {
    if (!skinsOwned) continue
    for (const skinKey of Object.keys(skinsOwned)) {
      if (!skinsOwned[skinKey]) continue
      const r = coerceLoverSkinRarity(loverSkinRarities[baseName]?.[skinKey])
      sum += LOVER_SKIN_TIER1[r].intimacy
    }
  }
  return sum
}

export function applyActiveWardenSkinBonusesToTotals(
  totals: { strength: number; allure: number; intellect: number; spirit: number },
  params: {
    wardenSkins: WardenSkins
    wardenActiveSkins: WardenActiveSkins
    wardenSkinLevels: WardenSkinLevels
    wardenSkinRarityOverrides: WardenSkinRarityOverrides
    ledgerSkinBaseBoostSteps: number
  }
): void {
  for (const w of WARDEN_CATALOG) {
    const skins = [...w.skins]
    if (skins.length === 0) continue
    const active = params.wardenActiveSkins[w.name]
    if (!active || active === 'base') continue
    if (!params.wardenSkins[w.name]?.[active]) continue
    const idx = (skins as readonly string[]).indexOf(active)
    const skinIndex = idx >= 0 ? idx : 0
    const rarity = resolveWardenSkinRarity(w.name, active, skinIndex, skins.length, params.wardenSkinRarityOverrides)
    const rarityFlat = wardenSkinRarityFlat(rarity)
    const star = params.wardenSkinLevels[w.name]?.[active] ?? 1
    const bonus = wardenSkinAttributeTotal(rarityFlat, params.ledgerSkinBaseBoostSteps, star)
    const keys = wardenSkinTargetKeys(w.attributes, w.name)
    for (const k of keys) {
      totals[k] += bonus
    }
  }
}
