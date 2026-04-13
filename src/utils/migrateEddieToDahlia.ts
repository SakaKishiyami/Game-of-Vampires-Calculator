import type { GameCalculatorState, Inventory, SelectedWardens, WardenActiveSkins, WardenSkins } from '@/types'

/** Renames Eddie → Dahlia (warden) and EddieLoverToken → DahliaToken for saved JSON / imports. */
export function migrateEddieToDahliaInPartialState(
  data: Partial<GameCalculatorState> & Record<string, unknown>
): Partial<GameCalculatorState> & Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }

  if (out.inventory && typeof out.inventory === 'object') {
    const inv = { ...(out.inventory as Inventory) }
    const legacy = inv.EddieLoverToken
    if (legacy) {
      const next = inv.DahliaToken
      const count = (next?.count ?? 0) + legacy.count
      inv.DahliaToken = {
        count,
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
      sw.noir = sw.noir.map((n) => (n === 'Eddie' ? 'Dahlia' : n))
    }
    out.selectedWardens = sw
  }

  /** Cosmetic skin file keys stay Eddie* (Eddie's art); only the warden display name is Dahlia. */
  const copySkinRecord = (rec: Record<string, boolean> | undefined) => {
    if (!rec) return undefined
    return { ...rec }
  }

  if (out.wardenSkins && typeof out.wardenSkins === 'object') {
    const ws = { ...(out.wardenSkins as WardenSkins) }
    if (ws.Eddie) {
      ws.Dahlia = copySkinRecord(ws.Eddie) ?? {}
      delete ws.Eddie
      out.wardenSkins = ws
    }
  }

  if (out.wardenActiveSkins && typeof out.wardenActiveSkins === 'object') {
    const was = { ...(out.wardenActiveSkins as WardenActiveSkins) }
    if (was.Eddie !== undefined) {
      was.Dahlia = was.Eddie === 'DahliaSkin1' ? 'EddieSkin1' : was.Eddie
      delete was.Eddie
      out.wardenActiveSkins = was
    }
  }

  const renameWardenKeyedSkins = (obj: Record<string, Record<string, unknown>> | undefined) => {
    if (!obj?.Eddie) return undefined
    const inner2: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj.Eddie)) {
      inner2[k === 'DahliaSkin1' ? 'EddieSkin1' : k] = v
    }
    const copy: Record<string, Record<string, unknown>> = { ...obj, Dahlia: inner2 }
    delete copy.Eddie
    return copy
  }

  if (out.wardenSkinLevels) {
    const next = renameWardenKeyedSkins(out.wardenSkinLevels as Record<string, Record<string, unknown>>)
    if (next) out.wardenSkinLevels = next as GameCalculatorState['wardenSkinLevels']
  }
  if (out.wardenSkinRarityOverrides) {
    const next = renameWardenKeyedSkins(out.wardenSkinRarityOverrides as Record<string, Record<string, unknown>>)
    if (next) out.wardenSkinRarityOverrides = next as GameCalculatorState['wardenSkinRarityOverrides']
  }

  if (out.wardenStats && typeof out.wardenStats === 'object' && (out.wardenStats as Record<string, unknown>).Eddie) {
    const ws = { ...(out.wardenStats as Record<string, unknown>) }
    ws.Dahlia = ws.Eddie
    delete ws.Eddie
    out.wardenStats = ws
  }

  if (
    out.uploadedWardenData &&
    typeof out.uploadedWardenData === 'object' &&
    (out.uploadedWardenData as Record<string, unknown>).Eddie
  ) {
    const u = { ...(out.uploadedWardenData as Record<string, unknown>) }
    u.Dahlia = u.Eddie
    delete u.Eddie
    out.uploadedWardenData = u
  }

  if (out.auras && typeof out.auras === 'object') {
    const a = JSON.parse(JSON.stringify(out.auras)) as Record<string, unknown>
    const mn = a.monsterNoir as Record<string, unknown> | undefined
    if (mn?.Eddie) {
      mn.Dahlia = mn.Eddie
      delete mn.Eddie
    }
    const sec = a.secondaryAuras as Record<string, unknown> | undefined
    const smn = sec?.monsterNoir as Record<string, unknown> | undefined
    if (smn?.Eddie) {
      smn.Dahlia = smn.Eddie
      delete smn.Eddie
    }
    out.auras = a
  }

  // Saves from the brief "DahliaSkin1" file rename: skin keys in app data are EddieSkin1 (Eddie's asset name).
  if (out.wardenSkins && typeof out.wardenSkins === 'object') {
    const ws = { ...(out.wardenSkins as WardenSkins) }
    for (const wname of Object.keys(ws)) {
      const skins = ws[wname]
      if (!skins || skins.DahliaSkin1 === undefined) continue
      const next = { ...skins }
      if (next.EddieSkin1 === undefined) next.EddieSkin1 = next.DahliaSkin1
      delete next.DahliaSkin1
      ws[wname] = next
    }
    out.wardenSkins = ws
  }

  if (out.wardenActiveSkins && typeof out.wardenActiveSkins === 'object') {
    const was = { ...(out.wardenActiveSkins as WardenActiveSkins) }
    for (const k of Object.keys(was)) {
      if (was[k] === 'DahliaSkin1') (was as Record<string, string>)[k] = 'EddieSkin1'
    }
    out.wardenActiveSkins = was
  }

  const stripDahliaSkin1Key = (obj: Record<string, Record<string, unknown>> | undefined) => {
    if (!obj) return
    const copy = { ...obj }
    let touched = false
    for (const [wname, skins] of Object.entries(copy)) {
      if (!skins || skins.DahliaSkin1 === undefined) continue
      const n = { ...skins }
      if (n.EddieSkin1 === undefined) n.EddieSkin1 = n.DahliaSkin1
      delete n.DahliaSkin1
      copy[wname] = n
      touched = true
    }
    return touched ? copy : undefined
  }

  const lv = stripDahliaSkin1Key(out.wardenSkinLevels as Record<string, Record<string, unknown>> | undefined)
  if (lv) out.wardenSkinLevels = lv as GameCalculatorState['wardenSkinLevels']
  const ro = stripDahliaSkin1Key(out.wardenSkinRarityOverrides as Record<string, Record<string, unknown>> | undefined)
  if (ro) out.wardenSkinRarityOverrides = ro as GameCalculatorState['wardenSkinRarityOverrides']

  return out as Partial<GameCalculatorState> & Record<string, unknown>
}
