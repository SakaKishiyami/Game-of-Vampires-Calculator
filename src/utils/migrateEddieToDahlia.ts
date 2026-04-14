import type { GameCalculatorState, Inventory, SelectedWardens, WardenActiveSkins, WardenSkins } from '@/types'

/**
 * Migration helper:
 * - Keep Eddie as the Monster Noir warden.
 * - Keep Dahlia as lover token naming (EddieLoverToken -> DahliaToken).
 * - Normalize any accidental warden-side Dahlia keys back to Eddie.
 */
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

  if (out.selectedWardens && typeof out.selectedWardens === 'object') {
    const sw = { ...(out.selectedWardens as SelectedWardens) }
    if (Array.isArray(sw.noir)) {
      sw.noir = sw.noir.map((n) => (n === 'Dahlia' ? 'Eddie' : n))
    }
    out.selectedWardens = sw
  }

  const moveWardenKey = <T extends Record<string, unknown>>(rec: T | undefined, from: string, to: string): T | undefined => {
    if (!rec || rec[from] === undefined) return rec
    const copy: Record<string, unknown> = { ...rec }
    copy[to] = copy[from]
    delete copy[from]
    return copy as T
  }

  if (out.wardenSkins && typeof out.wardenSkins === 'object') {
    const ws = moveWardenKey(out.wardenSkins as WardenSkins, 'Dahlia', 'Eddie')
    if (ws) out.wardenSkins = ws
  }

  if (out.wardenActiveSkins && typeof out.wardenActiveSkins === 'object') {
    const was0 = { ...(out.wardenActiveSkins as WardenActiveSkins) }
    const was = moveWardenKey(was0, 'Dahlia', 'Eddie') ?? was0
    for (const k of Object.keys(was)) {
      if (was[k] === 'DahliaSkin1') was[k] = 'EddieSkin1'
    }
    out.wardenActiveSkins = was
  }

  const normalizeSkinKeys = (obj: Record<string, Record<string, unknown>> | undefined) => {
    if (!obj) return obj
    const copy: Record<string, Record<string, unknown>> = { ...obj }
    if (copy.Dahlia !== undefined) {
      copy.Eddie = { ...(copy.Eddie ?? {}), ...copy.Dahlia }
      delete copy.Dahlia
    }
    for (const [w, skins] of Object.entries(copy)) {
      if (skins?.DahliaSkin1 !== undefined) {
        const n = { ...skins }
        if (n.EddieSkin1 === undefined) n.EddieSkin1 = n.DahliaSkin1
        delete n.DahliaSkin1
        copy[w] = n
      }
    }
    return copy
  }

  if (out.wardenSkinLevels) {
    out.wardenSkinLevels = normalizeSkinKeys(out.wardenSkinLevels as Record<string, Record<string, unknown>>) as GameCalculatorState['wardenSkinLevels']
  }
  if (out.wardenSkinRarityOverrides) {
    out.wardenSkinRarityOverrides = normalizeSkinKeys(out.wardenSkinRarityOverrides as Record<string, Record<string, unknown>>) as GameCalculatorState['wardenSkinRarityOverrides']
  }

  if (out.wardenStats && typeof out.wardenStats === 'object') {
    out.wardenStats = moveWardenKey(out.wardenStats as Record<string, unknown>, 'Dahlia', 'Eddie') as Record<string, unknown>
  }

  if (out.uploadedWardenData && typeof out.uploadedWardenData === 'object') {
    out.uploadedWardenData = moveWardenKey(out.uploadedWardenData as Record<string, unknown>, 'Dahlia', 'Eddie') as Record<string, unknown>
  }

  if (out.auras && typeof out.auras === 'object') {
    const a = JSON.parse(JSON.stringify(out.auras)) as Record<string, unknown>
    const mn = a.monsterNoir as Record<string, unknown> | undefined
    if (mn?.Dahlia) {
      mn.Eddie = mn.Dahlia
      delete mn.Dahlia
    }
    const sec = a.secondaryAuras as Record<string, unknown> | undefined
    const smn = sec?.monsterNoir as Record<string, unknown> | undefined
    if (smn?.Dahlia) {
      smn.Eddie = smn.Dahlia
      delete smn.Dahlia
    }
    out.auras = a
  }

  return out as Partial<GameCalculatorState> & Record<string, unknown>
}
