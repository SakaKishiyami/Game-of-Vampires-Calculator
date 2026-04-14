import { scarletBondData } from '@/data/scarletBonds'
import type { WardenCatalogEntry } from '@/data/wardenCatalog'
import { getLoverSkinSlots } from '@/utils/loverImagePaths'
import { isScarletBondCardVisible, type ScarletBondVisibilityContext } from '@/utils/wardenOwnership'

/**
 * Lover skin UI base names (keys of LOVER_SKINS) that have at least one scarlet bond currently visible
 * (same rules as the Scarlet Bond tab: VIP, summon lovers, warden ownership, etc.).
 */
export function visibleLoverSkinBaseNames(
  ctx: ScarletBondVisibilityContext,
  catalog: WardenCatalogEntry[],
): Set<string> {
  const out = new Set<string>()
  for (const bond of scarletBondData) {
    if (!isScarletBondCardVisible(bond, ctx, catalog)) continue
    for (const slot of getLoverSkinSlots(bond.lover)) {
      out.add(slot.baseName)
    }
  }
  return out
}
