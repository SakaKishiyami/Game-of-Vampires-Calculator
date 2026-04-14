import { scarletBondData } from '@/data/scarletBonds'
import type { WardenCatalogEntry } from '@/data/wardenCatalog'
import { LOVER_SKINS, getLoverSkinSlots } from '@/utils/loverImagePaths'
import { resolveLoverSummonFlags } from '@/utils/loverScarletBondAuras'
import { isScarletBondCardVisible, type ScarletBondVisibilityContext } from '@/utils/wardenOwnership'

/**
 * Lover skin UI base names (keys of LOVER_SKINS):
 * - Any slot from a scarlet bond row that passes `isScarletBondCardVisible`, and
 * - Wild Hunt / Noir / Ember–Ash lovers once they are unlocked via Scarlet Bond summon rules
 *   (checkbox or tokens), even if the bond row is still hidden because the warden is not owned yet.
 */
export function visibleLoverSkinBaseNames(
  ctx: ScarletBondVisibilityContext,
  catalog: WardenCatalogEntry[],
): Set<string> {
  const out = new Set<string>()
  const inv = ctx.inventory ?? {}

  for (const bond of scarletBondData) {
    if (!isScarletBondCardVisible(bond, ctx, catalog)) continue
    for (const slot of getLoverSkinSlots(bond.lover)) {
      if (LOVER_SKINS[slot.baseName]?.length) out.add(slot.baseName)
    }
  }

  const s = resolveLoverSummonFlags(
    {
      hasAgneyi: ctx.hasAgneyi,
      hasCulann: ctx.hasCulann,
      hasHela: ctx.hasHela,
      hasDionysus: ctx.hasDionysus,
      hasMaya: ctx.hasMaya,
      hasDahlia: ctx.hasDahlia,
      hasEmber: ctx.hasEmber,
      hasAsh: ctx.hasAsh,
    },
    inv,
  )

  const addIfSkins = (base: string, unlocked: boolean) => {
    if (!unlocked) return
    if (LOVER_SKINS[base]?.length) out.add(base)
  }

  addIfSkins('Agneyi', s.canAgneyi)
  addIfSkins('Culann', s.canCulann)
  addIfSkins('Hela', s.canHela)
  addIfSkins('Dionysus', s.canDionysus)
  addIfSkins('Maya', s.canMaya)
  addIfSkins('Dahlia', s.canDahlia)

  if (ctx.hasNyx && s.canEmber && s.canAsh) {
    for (const slot of getLoverSkinSlots('Ember/Ash')) {
      if (LOVER_SKINS[slot.baseName]?.length) out.add(slot.baseName)
    }
  }

  return out
}
