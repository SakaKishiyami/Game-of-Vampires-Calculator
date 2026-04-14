import type { SelectedWardens } from '@/types'
import type { WardenCatalogEntry } from '@/data/wardenCatalog'
import { initialAuras } from '@/data/auras'

/** Lord-level reward wardens (highest tiers). Order matters for grant count. */
export const LORD_UPGRADE_WARDENS = ['Temujin', 'Charlemagne', 'Josey', 'Erik'] as const

export type WardenOwnershipContext = {
  selectedWardens: SelectedWardens
  vipLevel: number
  lordLevel: string
  hasNyx: boolean
  hasDracula: boolean
  hasVictor: boolean
  hasFrederick: boolean
}

type LordTierParse = { tier: string; num: number }

/** Accepts values like "Fledgling Lord 1" (matches GameCalculator select). */
export function parseLordTier(lordLevel: string): LordTierParse | null {
  const m = lordLevel.trim().match(/^(.+?)\s+Lord\s+(\d+)$/i)
  if (!m) return null
  return { tier: m[1].trim(), num: parseInt(m[2], 10) }
}

/** Elder 1→1, Elder 2→2, Elder 3→2, Elder 4→3, Elder 5→4, Ancient *→4 */
export function elderLordWardenGrantCount(lordLevel: string): number {
  const p = parseLordTier(lordLevel)
  if (!p) return 0
  if (p.tier === 'Ancient') return 4
  if (p.tier === 'Elder') {
    if (p.num === 1) return 1
    if (p.num === 2) return 2
    if (p.num === 3) return 2
    if (p.num === 4) return 3
    if (p.num === 5) return 4
  }
  return 0
}

export function showElderLordWardenSection(lordLevel: string): boolean {
  const p = parseLordTier(lordLevel)
  if (!p) return false
  return p.tier === 'Elder' || p.tier === 'Ancient'
}

function vipRequiredForWarden(wardenName: string): number | null {
  const v = (initialAuras.vip as Record<string, { vipRequired?: number } | undefined>)[wardenName]
  if (!v || typeof v.vipRequired !== 'number') return null
  return v.vipRequired
}

/**
 * Warden is "owned" for UI filtering: summons, VIP unlock, lord-tier unlock, or special toggles.
 * Does not include the Summons/Acquired picker itself (that list stays full so you can add owners).
 */
export function isWardenOwned(
  wardenName: string,
  ctx: WardenOwnershipContext,
  catalog: WardenCatalogEntry[],
): boolean {
  if (wardenName === 'Nyx') return ctx.hasNyx
  if (wardenName === 'Dracula') return ctx.hasDracula
  if (wardenName === 'Victor') return ctx.hasVictor
  if (wardenName === 'Frederick') return ctx.hasFrederick

  const grant = elderLordWardenGrantCount(ctx.lordLevel)
  const lordIdx = (LORD_UPGRADE_WARDENS as readonly string[]).indexOf(wardenName)
  if (lordIdx !== -1 && lordIdx < grant) return true

  const vipReq = vipRequiredForWarden(wardenName)
  if (vipReq !== null && ctx.vipLevel >= vipReq) return true

  const entry = catalog.find((w) => w.name === wardenName)
  if (!entry) return false

  const g = entry.group
  if (g === 'circus' || g === 'tyrants' || g === 'noir' || g === 'hunt') {
    return ctx.selectedWardens[g]?.includes(wardenName) ?? false
  }

  return false
}

export type ScarletBondVisibilityContext = WardenOwnershipContext & {
  hasAgneyi: boolean
  hasCulann: boolean
  hasHela: boolean
  hasDionysus: boolean
  hasMaya: boolean
  hasEmber: boolean
  hasAsh: boolean
}

export function isScarletBondCardVisible(
  bond: { lover: string; warden: string; vip: number },
  ctx: ScarletBondVisibilityContext,
  catalog: WardenCatalogEntry[],
): boolean {
  if (bond.vip > ctx.vipLevel) return false

  if (bond.lover === 'Agneyi' && !ctx.hasAgneyi) return false
  if (bond.lover === 'Culann' && !ctx.hasCulann) return false
  if (bond.lover === 'Hela' && !ctx.hasHela) return false
  if (bond.lover === 'Dionysus' && !ctx.hasDionysus) return false
  if (bond.lover === 'Maya' && !ctx.hasMaya) return false
  if (bond.lover === 'Ember/Ash') {
    if (!ctx.hasNyx) return false
    if (!ctx.hasEmber || !ctx.hasAsh) return false
  }

  return isWardenOwned(bond.warden, ctx, catalog)
}
