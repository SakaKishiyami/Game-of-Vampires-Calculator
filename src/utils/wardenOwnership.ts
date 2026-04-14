import type { Inventory, SelectedWardens } from '@/types'
import type { WardenCatalogEntry } from '@/data/wardenCatalog'
import { initialAuras } from '@/data/auras'
import { resolveLoverSummonFlags } from '@/utils/loverScarletBondAuras'

/** Lord-level reward wardens (Elder/Ancient picks). Player chooses which of the four they own up to their grant cap. */
export const LORD_UPGRADE_WARDENS = ['Temujin', 'Charlemagne', 'Josey', 'Erik'] as const

const LORD_SET = new Set<string>(LORD_UPGRADE_WARDENS as unknown as string[])

/** Keep only valid names, preserve order, dedupe, cap at `grant` (0 clears). */
export function normalizeLordTierRewardWardens(selected: readonly string[], grant: number): string[] {
  if (grant <= 0) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of selected) {
    if (!LORD_SET.has(name) || seen.has(name)) continue
    seen.add(name)
    out.push(name)
    if (out.length >= grant) break
  }
  return out
}

export type WardenOwnershipContext = {
  selectedWardens: SelectedWardens
  vipLevel: number
  lordLevel: string
  /** Subset of LORD_UPGRADE_WARDENS chosen by the player; length capped by elderLordWardenGrantCount(lordLevel). */
  lordTierRewardWardens: string[]
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

/** Load from save: explicit list is normalized; missing key keeps legacy “first N in catalog order” for Elder+. */
export function resolveLordTierRewardWardensFromSave(
  raw: string[] | undefined,
  lordLevelForGrant: string,
): string[] {
  const grant = elderLordWardenGrantCount(lordLevelForGrant)
  if (raw !== undefined) return normalizeLordTierRewardWardens(raw, grant)
  if (grant <= 0) return []
  return (LORD_UPGRADE_WARDENS as readonly string[]).slice(0, grant) as string[]
}

function vipRequiredForWarden(wardenName: string): number | null {
  const v = (initialAuras.vip as Record<string, { vipRequired?: number } | undefined>)[wardenName]
  if (!v || typeof v.vipRequired !== 'number') return null
  return v.vipRequired
}

/**
 * Warden is "owned" for UI filtering.
 * Exceptions (must be unlocked): specials, lord-tier picks, VIP shop wardens, circus/tyrants/noir/hunt summons.
 * All other catalog wardens (group `other`) default to owned. Unknown names → not owned.
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

  if (LORD_SET.has(wardenName)) return ctx.lordTierRewardWardens.includes(wardenName)

  const vipReq = vipRequiredForWarden(wardenName)
  if (vipReq !== null) return ctx.vipLevel >= vipReq

  const entry = catalog.find((w) => w.name === wardenName)
  if (!entry) return false

  const g = entry.group
  if (g === 'circus' || g === 'tyrants' || g === 'noir' || g === 'hunt') {
    return ctx.selectedWardens[g]?.includes(wardenName) ?? false
  }

  return true
}

export type ScarletBondVisibilityContext = WardenOwnershipContext & {
  hasAgneyi: boolean
  hasCulann: boolean
  hasHela: boolean
  hasDionysus: boolean
  hasMaya: boolean
  hasDahlia: boolean
  hasEmber: boolean
  hasAsh: boolean
  /** Used with summon flags so token thresholds match Scarlet Bond / aura logic (100 tokens, Heart of War, etc.). */
  inventory: Inventory
}

/**
 * Scarlet bond card: VIP gate, summon lovers (Wild Hunt singles, Maya, Ember/Ash) via checkbox **or** token rules
 * (`resolveLoverSummonFlags`), then warden ownership.
 * Dual and other lovers default to “owned” (no checkbox); only those series require flags/tokens above.
 */
export function isScarletBondCardVisible(
  bond: { lover: string; warden: string; vip: number },
  ctx: ScarletBondVisibilityContext,
  catalog: WardenCatalogEntry[],
): boolean {
  if (bond.vip > ctx.vipLevel) return false

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
    ctx.inventory ?? {},
  )

  if (bond.lover === 'Agneyi' && !s.canAgneyi) return false
  if (bond.lover === 'Culann' && !s.canCulann) return false
  if (bond.lover === 'Hela' && !s.canHela) return false
  if (bond.lover === 'Dionysus' && !s.canDionysus) return false
  if (bond.lover === 'Maya' && !s.canMaya) return false
  if (bond.lover === 'Dahlia' && !s.canDahlia) return false
  if (bond.lover === 'Ember/Ash') {
    if (!ctx.hasNyx) return false
    if (!s.canEmber || !s.canAsh) return false
  }

  return isWardenOwned(bond.warden, ctx, catalog)
}
