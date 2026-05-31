import { bakedPrefabDrawPlacement, bakedPrefabShouldFlipY, bakedPrefabCornerRotation } from '@/lib/sinistra/terrainPlacement'
import { SLG_CHUNK_GROUND_CELL_SIZE } from '@/lib/sinistra/constants'
import { getBakedTerrainPrefab, getVariantBakedTerrainPrefab, type PrefabBakeVariant } from '@/lib/sinistra/prefabManifest'
import {
  ensureBundledSinistraDefaults,
  getBundledPrefabOverrideDocument,
} from '@/lib/sinistra/bundledSinistraDefaults'
import type { SinistraTerrainPlacement } from '@/lib/sinistra/types'

export type PrefabRotationOverride = 'default' | 'none' | 'cw90' | 'ccw90' | 'flipY' | '180'

export type PrefabInstanceOverride = {
  deltaX: number
  deltaY: number
  rotation: PrefabRotationOverride
  /** Higher values draw on top of other prefabs (SVG paint order). */
  zOrder?: number
  hidden?: boolean
  /** When set, overrides the map-wide default bake variant for this instance only. */
  bakeVariant?: PrefabBakeVariant
}

export type ManualPrefabInstance = {
  id: string
  name: string
  anchorX: number
  anchorY: number
}

export type ManualGroundTileInstance = {
  id: string
  tileKey: string
  /** Top-left world position (snapped to SLG cell grid). */
  x: number
  y: number
  /** Square footprint in SLG cells (1 = 1×1, 2 = 2×2, etc.). */
  cells: number
  deltaX?: number
  deltaY?: number
  hidden?: boolean
}

/** Move prefabs and/or ground tiles together during alignment tuning. */
export type AlignmentEditorGroup = {
  id: string
  name: string
  prefabKeys: string[]
  groundTileIds: string[]
  deltaX: number
  deltaY: number
}

export type PrefabOverrideDocument = {
  version: 1
  overrides: Record<string, PrefabInstanceOverride>
  manual: ManualPrefabInstance[]
  manualGroundTiles: ManualGroundTileInstance[]
  groups: AlignmentEditorGroup[]
  /** Shifts every prefab + ground tile together (no grouping required). */
  globalMoveDeltaX?: number
  globalMoveDeltaY?: number
}

const STORAGE_KEY = 'sinistra-prefab-overrides-v1'

export function emptyPrefabOverrideDocument(): PrefabOverrideDocument {
  return { version: 1, overrides: {}, manual: [], manualGroundTiles: [], groups: [] }
}

export function prefabInstanceKey(name: string, anchorX: number, anchorY: number): string {
  const round = (value: number) => Math.round(value * 1000) / 1000
  return `${name}|${round(anchorX)}|${round(anchorY)}`
}

export function loadPrefabOverrideDocument(): PrefabOverrideDocument {
  if (typeof window === 'undefined') {
    return getBundledPrefabOverrideDocument()
  }

  try {
    ensureBundledSinistraDefaults()

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return getBundledPrefabOverrideDocument()
    }
    const parsed = JSON.parse(raw) as Partial<PrefabOverrideDocument>
    return {
      version: 1,
      overrides: parsed.overrides ?? {},
      manual: parsed.manual ?? [],
      manualGroundTiles: parsed.manualGroundTiles ?? [],
      groups: parsed.groups ?? [],
      globalMoveDeltaX: parsed.globalMoveDeltaX ?? 0,
      globalMoveDeltaY: parsed.globalMoveDeltaY ?? 0,
    }
  } catch {
    return getBundledPrefabOverrideDocument()
  }
}

export function savePrefabOverrideDocument(doc: PrefabOverrideDocument): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
}

export function getPrefabOverride(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
): PrefabInstanceOverride | null {
  const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
  return doc.overrides[key] ?? null
}

export function buildManualBakedPlacement(
  manual: ManualPrefabInstance,
): Extract<SinistraTerrainPlacement, { mode: 'baked' }> | null {
  const baked = getBakedTerrainPrefab(manual.name)
  if (!baked) {
    return null
  }

  const draw = bakedPrefabDrawPlacement(
    manual.name,
    manual.anchorX,
    manual.anchorY,
    baked.originOffsetX,
    baked.originOffsetY,
  )

  return {
    mode: 'baked',
    x: draw.x,
    y: draw.y,
    anchorX: manual.anchorX,
    anchorY: manual.anchorY,
    name: manual.name,
    imagePath: baked.imagePath,
    width: baked.width,
    height: baked.height,
    originOffsetX: baked.originOffsetX,
    originOffsetY: baked.originOffsetY,
    displayWidth: baked.width,
    displayHeight: baked.height,
  }
}

export function mergeBakedPlacements(
  mapPlacements: SinistraTerrainPlacement[],
  doc: PrefabOverrideDocument,
): Extract<SinistraTerrainPlacement, { mode: 'baked' }>[] {
  const fromMap = mapPlacements.filter(
    (placement): placement is Extract<SinistraTerrainPlacement, { mode: 'baked' }> => {
      if (placement.mode !== 'baked') {
        return false
      }
      const override = getPrefabOverride(doc, placement)
      return !override?.hidden
    },
  )

  const manualPlacements = doc.manual
    .map((entry) => buildManualBakedPlacement(entry))
    .filter((placement): placement is Extract<SinistraTerrainPlacement, { mode: 'baked' }> => {
      if (!placement) {
        return false
      }
      const override = getPrefabOverride(doc, placement)
      return !override?.hidden
    })

  return sortBakedPlacementsForRender([...fromMap, ...manualPlacements], doc)
}

export function prefabRenderZOrder(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
): number {
  return getPrefabOverride(doc, placement)?.zOrder ?? 0
}

export function sortBakedPlacementsForRender(
  placements: Extract<SinistraTerrainPlacement, { mode: 'baked' }>[],
  doc: PrefabOverrideDocument,
): Extract<SinistraTerrainPlacement, { mode: 'baked' }>[] {
  return placements
    .map((placement, index) => ({ placement, index }))
    .sort((left, right) => {
      const zDiff =
        prefabRenderZOrder(doc, left.placement) - prefabRenderZOrder(doc, right.placement)
      if (zDiff !== 0) {
        return zDiff
      }
      // Preserve chunk JSON iteration order when z is tied — matches in-game interleaved overlaps.
      return left.index - right.index
    })
    .map(({ placement }) => placement)
}

export function resolvePrefabBakeVariant(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  globalDefault: PrefabBakeVariant,
): PrefabBakeVariant {
  return getPrefabOverride(doc, placement)?.bakeVariant ?? globalDefault
}

function isEmptyPrefabOverride(override: PrefabInstanceOverride): boolean {
  return (
    override.deltaX === 0 &&
    override.deltaY === 0 &&
    override.rotation === 'default' &&
    (override.zOrder ?? 0) === 0 &&
    !override.hidden &&
    !override.bakeVariant
  )
}

export function setPrefabBakeVariantOverride(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  bakeVariant: PrefabBakeVariant | null,
): PrefabOverrideDocument {
  const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
  const current = doc.overrides[key] ?? { deltaX: 0, deltaY: 0, rotation: 'default' as const }

  if (bakeVariant == null) {
    if (!current.bakeVariant) {
      return doc
    }
    const { bakeVariant: _removed, ...rest } = current
    if (isEmptyPrefabOverride(rest as PrefabInstanceOverride)) {
      return clearPrefabOverride(doc, placement)
    }
    return {
      ...doc,
      overrides: { ...doc.overrides, [key]: rest as PrefabInstanceOverride },
    }
  }

  return upsertPrefabOverride(doc, placement, { bakeVariant })
}

export function flipInstancePrefabBakeVariant(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  globalDefault: PrefabBakeVariant,
): PrefabOverrideDocument {
  const effective = resolvePrefabBakeVariant(doc, placement, globalDefault)
  const next = effective === 'full' ? 'edges' : 'full'
  return setPrefabBakeVariantOverride(
    doc,
    placement,
    next === globalDefault ? null : next,
  )
}

/** Flip global default and any per-instance overrides — each square swaps tile mode; click again to undo. */
export function flipAllPrefabBakeVariants(
  doc: PrefabOverrideDocument,
  globalDefault: PrefabBakeVariant,
): { doc: PrefabOverrideDocument; globalDefault: PrefabBakeVariant } {
  const newGlobalDefault: PrefabBakeVariant = globalDefault === 'full' ? 'edges' : 'full'
  const newOverrides: Record<string, PrefabInstanceOverride> = {}

  for (const [key, override] of Object.entries(doc.overrides)) {
    if (override.bakeVariant) {
      newOverrides[key] = {
        ...override,
        bakeVariant: override.bakeVariant === 'full' ? 'edges' : 'full',
      }
    } else {
      newOverrides[key] = override
    }
  }

  return {
    doc: { ...doc, overrides: newOverrides },
    globalDefault: newGlobalDefault,
  }
}

export function effectiveDrawPosition(
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  doc: PrefabOverrideDocument,
  globalDefault: PrefabBakeVariant = 'full',
): { x: number; y: number } {
  const render = effectiveBakedRender(placement, doc, globalDefault)
  if (render) {
    return { x: render.x, y: render.y }
  }
  const override = getPrefabOverride(doc, placement)
  return {
    x: placement.x + (override?.deltaX ?? 0),
    y: placement.y + (override?.deltaY ?? 0),
  }
}

export type EffectiveBakedRender = {
  x: number
  y: number
  width: number
  height: number
  imagePath: string
}

export function effectiveBakedRender(
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  doc: PrefabOverrideDocument,
  globalDefault: PrefabBakeVariant,
): EffectiveBakedRender | null {
  const variant = resolvePrefabBakeVariant(doc, placement, globalDefault)
  const baked = getVariantBakedTerrainPrefab(placement.name, variant)
  if (!baked) {
    return null
  }

  // Keep draw box anchored to the full prefab so toggling full ↔ edges stays in place.
  const layout = getBakedTerrainPrefab(placement.name, 'full') ?? baked

  const base = bakedPrefabDrawPlacement(
    placement.name,
    placement.anchorX,
    placement.anchorY,
    layout.originOffsetX,
    layout.originOffsetY,
  )
  const override = getPrefabOverride(doc, placement)
  const groupDelta = groupDeltaForPrefabKey(doc, prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY))
  const globalDelta = globalMoveDelta(doc)
  return {
    x: base.x + (override?.deltaX ?? 0) + groupDelta.deltaX + globalDelta.deltaX,
    y: base.y + (override?.deltaY ?? 0) + groupDelta.deltaY + globalDelta.deltaY,
    width: layout.width,
    height: layout.height,
    imagePath: baked.imagePath,
  }
}

export function resolvePrefabRotation(
  terrainName: string,
  override: PrefabInstanceOverride | null,
): PrefabRotationOverride {
  if (override?.rotation && override.rotation !== 'default') {
    return override.rotation
  }
  if (bakedPrefabCornerRotation(terrainName) === 'cw90') {
    return 'cw90'
  }
  if (bakedPrefabCornerRotation(terrainName) === 'ccw90') {
    return 'ccw90'
  }
  if (bakedPrefabShouldFlipY(terrainName)) {
    return 'flipY'
  }
  return 'none'
}

export function prefabLocalTransformString(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: PrefabRotationOverride,
): string | null {
  if (rotation === 'cw90') {
    return `translate(${x + width / 2} ${y + height / 2}) rotate(90) translate(${-width / 2} ${-height / 2})`
  }
  if (rotation === 'ccw90') {
    return `translate(${x + width / 2} ${y + height / 2}) rotate(-90) translate(${-width / 2} ${-height / 2})`
  }
  if (rotation === '180') {
    return `translate(${x + width / 2} ${y + height / 2}) rotate(180) translate(${-width / 2} ${-height / 2})`
  }
  if (rotation === 'flipY') {
    return `translate(${x} ${y + height}) scale(1 -1)`
  }
  return null
}

/** Scale prefab art toward its vertical center (top/bottom move in, center stays put). */
export function prefabSquishAroundCenterTransform(
  width: number,
  height: number,
  scaleY: number,
): string | null {
  if (scaleY === 1) {
    return null
  }
  const cx = width / 2
  const cy = height / 2
  return `translate(${cx} ${cy}) scale(1 ${scaleY}) translate(${-cx} ${-cy})`
}

/**
 * One global scaleY applied to every prefab: squish around each tile's center in layer
 * space so the center stays put while top/bottom move in (same amount for all tiles).
 */
export function buildPrefabDrawTransform(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: PrefabRotationOverride,
  scaleY: number,
): string {
  const cx = x + width / 2
  const cy = y + height / 2
  const halfW = width / 2
  const halfH = height / 2

  if (rotation === 'cw90') {
    if (scaleY === 1) {
      return `translate(${cx} ${cy}) rotate(90) translate(${-halfW} ${-halfH})`
    }
    return `translate(${cx} ${cy}) scale(1 ${scaleY}) rotate(90) translate(${-halfW} ${-halfH})`
  }
  if (rotation === 'ccw90') {
    if (scaleY === 1) {
      return `translate(${cx} ${cy}) rotate(-90) translate(${-halfW} ${-halfH})`
    }
    return `translate(${cx} ${cy}) scale(1 ${scaleY}) rotate(-90) translate(${-halfW} ${-halfH})`
  }
  if (rotation === '180') {
    if (scaleY === 1) {
      return `translate(${cx} ${cy}) rotate(180) translate(${-halfW} ${-halfH})`
    }
    return `translate(${cx} ${cy}) scale(1 ${scaleY}) rotate(180) translate(${-halfW} ${-halfH})`
  }
  if (rotation === 'flipY') {
    if (scaleY === 1) {
      return `translate(${x} ${y + height}) scale(1 -1)`
    }
    return `translate(${cx} ${cy}) scale(1 ${scaleY}) scale(1 -1) translate(${-halfW} ${-halfH})`
  }

  if (scaleY === 1) {
    return `translate(${x} ${y})`
  }
  return `translate(${cx} ${cy}) scale(1 ${scaleY}) translate(${-halfW} ${-halfH})`
}

export function upsertPrefabOverride(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  patch: Partial<PrefabInstanceOverride>,
): PrefabOverrideDocument {
  const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
  const current = doc.overrides[key] ?? { deltaX: 0, deltaY: 0, rotation: 'default' as const }
  return {
    ...doc,
    overrides: {
      ...doc.overrides,
      [key]: {
        ...current,
        ...patch,
      },
    },
  }
}

export function clearPrefabOverride(
  doc: PrefabOverrideDocument,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
): PrefabOverrideDocument {
  const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
  const nextOverrides = { ...doc.overrides }
  delete nextOverrides[key]
  return { ...doc, overrides: nextOverrides }
}

export function addManualGroundTile(
  doc: PrefabOverrideDocument,
  tileKey: string,
  x: number,
  y: number,
  cells: number,
): PrefabOverrideDocument {
  return {
    ...doc,
    manualGroundTiles: [
      ...doc.manualGroundTiles,
      {
        id: `ground-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tileKey,
        x,
        y,
        cells,
      },
    ],
  }
}

export function removeManualGroundTile(doc: PrefabOverrideDocument, id: string): PrefabOverrideDocument {
  return removeMemberFromAlignmentGroups(
    {
      ...doc,
      manualGroundTiles: doc.manualGroundTiles.filter((entry) => entry.id !== id),
    },
    { groundTileId: id },
  )
}

export function updateManualGroundTile(
  doc: PrefabOverrideDocument,
  id: string,
  patch: Partial<Pick<ManualGroundTileInstance, 'deltaX' | 'deltaY' | 'x' | 'y' | 'cells' | 'tileKey' | 'hidden'>>,
): PrefabOverrideDocument {
  return {
    ...doc,
    manualGroundTiles: doc.manualGroundTiles.map((entry) =>
      entry.id === id ? { ...entry, ...patch } : entry,
    ),
  }
}

export function groundTileDrawPosition(
  tile: ManualGroundTileInstance,
  chunkGroundNudgeWorldX: number,
  chunkGroundNudgeWorldY: number,
  doc?: PrefabOverrideDocument,
): { x: number; y: number; size: number } {
  const groupDelta = doc ? groupDeltaForGroundTileId(doc, tile.id) : { deltaX: 0, deltaY: 0 }
  const globalDelta = doc ? globalMoveDelta(doc) : { deltaX: 0, deltaY: 0 }
  return {
    x: tile.x + (tile.deltaX ?? 0) + groupDelta.deltaX + globalDelta.deltaX + chunkGroundNudgeWorldX,
    y: tile.y + (tile.deltaY ?? 0) + groupDelta.deltaY + globalDelta.deltaY + chunkGroundNudgeWorldY,
    size: tile.cells * SLG_CHUNK_GROUND_CELL_SIZE,
  }
}

export function findGroupForPrefabKey(
  doc: PrefabOverrideDocument,
  prefabKey: string,
): AlignmentEditorGroup | null {
  return doc.groups.find((group) => group.prefabKeys.includes(prefabKey)) ?? null
}

export function findGroupForGroundTileId(
  doc: PrefabOverrideDocument,
  groundTileId: string,
): AlignmentEditorGroup | null {
  return doc.groups.find((group) => group.groundTileIds.includes(groundTileId)) ?? null
}

export function groupDeltaForPrefabKey(
  doc: PrefabOverrideDocument,
  prefabKey: string,
): { deltaX: number; deltaY: number } {
  const group = findGroupForPrefabKey(doc, prefabKey)
  return group ? { deltaX: group.deltaX, deltaY: group.deltaY } : { deltaX: 0, deltaY: 0 }
}

export function groupDeltaForGroundTileId(
  doc: PrefabOverrideDocument,
  groundTileId: string,
): { deltaX: number; deltaY: number } {
  const group = findGroupForGroundTileId(doc, groundTileId)
  return group ? { deltaX: group.deltaX, deltaY: group.deltaY } : { deltaX: 0, deltaY: 0 }
}

export function globalMoveDelta(doc: PrefabOverrideDocument): { deltaX: number; deltaY: number } {
  return {
    deltaX: doc.globalMoveDeltaX ?? 0,
    deltaY: doc.globalMoveDeltaY ?? 0,
  }
}

export function updateGlobalMove(
  doc: PrefabOverrideDocument,
  patch: { deltaX?: number; deltaY?: number },
): PrefabOverrideDocument {
  return {
    ...doc,
    globalMoveDeltaX: patch.deltaX !== undefined ? patch.deltaX : (doc.globalMoveDeltaX ?? 0),
    globalMoveDeltaY: patch.deltaY !== undefined ? patch.deltaY : (doc.globalMoveDeltaY ?? 0),
  }
}

export function createAlignmentGroup(
  doc: PrefabOverrideDocument,
  name: string,
  prefabKeys: string[] = [],
  groundTileIds: string[] = [],
): PrefabOverrideDocument {
  const cleanedPrefabKeys = prefabKeys.filter(
    (key) => !doc.groups.some((group) => group.prefabKeys.includes(key)),
  )
  const cleanedGroundTileIds = groundTileIds.filter(
    (id) => !doc.groups.some((group) => group.groundTileIds.includes(id)),
  )
  if (cleanedPrefabKeys.length === 0 && cleanedGroundTileIds.length === 0) {
    return doc
  }

  const group: AlignmentEditorGroup = {
    id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    prefabKeys: cleanedPrefabKeys,
    groundTileIds: cleanedGroundTileIds,
    deltaX: 0,
    deltaY: 0,
  }

  return {
    ...doc,
    groups: [...doc.groups, group],
  }
}

export function addMemberToAlignmentGroup(
  doc: PrefabOverrideDocument,
  groupId: string,
  member: { prefabKey?: string; groundTileId?: string },
): PrefabOverrideDocument {
  return {
    ...doc,
    groups: doc.groups.map((group) => {
      if (group.id !== groupId) {
        return group
      }

      const prefabKeys = [...group.prefabKeys]
      const groundTileIds = [...group.groundTileIds]

      if (member.prefabKey && !prefabKeys.includes(member.prefabKey)) {
        const alreadyGrouped = doc.groups.some(
          (other) => other.id !== groupId && other.prefabKeys.includes(member.prefabKey!),
        )
        if (!alreadyGrouped) {
          prefabKeys.push(member.prefabKey)
        }
      }

      if (member.groundTileId && !groundTileIds.includes(member.groundTileId)) {
        const alreadyGrouped = doc.groups.some(
          (other) => other.id !== groupId && other.groundTileIds.includes(member.groundTileId!),
        )
        if (!alreadyGrouped) {
          groundTileIds.push(member.groundTileId)
        }
      }

      return { ...group, prefabKeys, groundTileIds }
    }),
  }
}

export function updateAlignmentGroup(
  doc: PrefabOverrideDocument,
  groupId: string,
  patch: Partial<Pick<AlignmentEditorGroup, 'name' | 'deltaX' | 'deltaY'>>,
): PrefabOverrideDocument {
  return {
    ...doc,
    groups: doc.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
  }
}

/** Fold a group's shared offset into each member's individual offset. */
function applyGroupDeltaToMembers(
  doc: PrefabOverrideDocument,
  group: AlignmentEditorGroup,
): PrefabOverrideDocument {
  const { deltaX, deltaY } = group
  if (deltaX === 0 && deltaY === 0) {
    return doc
  }

  const overrides = { ...doc.overrides }
  for (const key of group.prefabKeys) {
    const current = overrides[key] ?? { deltaX: 0, deltaY: 0, rotation: 'default' as const }
    overrides[key] = {
      ...current,
      deltaX: (current.deltaX ?? 0) + deltaX,
      deltaY: (current.deltaY ?? 0) + deltaY,
    }
  }

  return {
    ...doc,
    overrides,
    manualGroundTiles: doc.manualGroundTiles.map((tile) =>
      group.groundTileIds.includes(tile.id)
        ? {
            ...tile,
            deltaX: (tile.deltaX ?? 0) + deltaX,
            deltaY: (tile.deltaY ?? 0) + deltaY,
          }
        : tile,
    ),
  }
}

function hidePrefabKeysInOverrides(
  doc: PrefabOverrideDocument,
  prefabKeys: string[],
): PrefabOverrideDocument {
  if (prefabKeys.length === 0) {
    return doc
  }

  const overrides = { ...doc.overrides }
  for (const key of prefabKeys) {
    const current = overrides[key] ?? { deltaX: 0, deltaY: 0, rotation: 'default' as const }
    overrides[key] = { ...current, hidden: true }
  }

  return { ...doc, overrides }
}

/** Ungroup: fold the group's shared offset into each member so pieces stay put. */
export function removeAlignmentGroup(doc: PrefabOverrideDocument, groupId: string): PrefabOverrideDocument {
  const group = doc.groups.find((entry) => entry.id === groupId)
  if (!group) {
    return doc
  }

  return {
    ...applyGroupDeltaToMembers(doc, group),
    groups: doc.groups.filter((entry) => entry.id !== groupId),
  }
}

/** Hide every member, dissolve the group (prefabs restorable from Hidden list). */
export function hideAlignmentGroup(doc: PrefabOverrideDocument, groupId: string): PrefabOverrideDocument {
  const group = doc.groups.find((entry) => entry.id === groupId)
  if (!group) {
    return doc
  }

  let next = applyGroupDeltaToMembers(doc, group)
  next = hidePrefabKeysInOverrides(next, group.prefabKeys)

  return {
    ...next,
    manualGroundTiles: next.manualGroundTiles.map((tile) =>
      group.groundTileIds.includes(tile.id) ? { ...tile, hidden: true } : tile,
    ),
    groups: next.groups.filter((entry) => entry.id !== groupId),
  }
}

/**
 * Delete a group: remove manual ground tiles and added prefabs; hide map prefabs.
 * Group offset is baked into members first so positions stay put until removed/hidden.
 */
export function deleteAlignmentGroup(doc: PrefabOverrideDocument, groupId: string): PrefabOverrideDocument {
  const group = doc.groups.find((entry) => entry.id === groupId)
  if (!group) {
    return doc
  }

  const prefabKeySet = new Set(group.prefabKeys)
  let next = applyGroupDeltaToMembers(doc, group)

  next = {
    ...next,
    manual: next.manual.filter((entry) => {
      const key = prefabInstanceKey(entry.name, entry.anchorX, entry.anchorY)
      return !prefabKeySet.has(key)
    }),
    manualGroundTiles: next.manualGroundTiles.filter((tile) => !group.groundTileIds.includes(tile.id)),
    groups: next.groups.filter((entry) => entry.id !== groupId),
  }

  const mapPrefabKeys = group.prefabKeys.filter((key) =>
    next.manual.every(
      (entry) => prefabInstanceKey(entry.name, entry.anchorX, entry.anchorY) !== key,
    ),
  )

  return hidePrefabKeysInOverrides(next, mapPrefabKeys)
}

export function removeMemberFromAlignmentGroups(
  doc: PrefabOverrideDocument,
  member: { prefabKey?: string; groundTileId?: string },
): PrefabOverrideDocument {
  return {
    ...doc,
    groups: doc.groups
      .map((group) => ({
        ...group,
        prefabKeys: member.prefabKey
          ? group.prefabKeys.filter((key) => key !== member.prefabKey)
          : group.prefabKeys,
        groundTileIds: member.groundTileId
          ? group.groundTileIds.filter((id) => id !== member.groundTileId)
          : group.groundTileIds,
      }))
      .filter((group) => group.prefabKeys.length > 0 || group.groundTileIds.length > 0),
  }
}

export function addManualPrefab(
  doc: PrefabOverrideDocument,
  name: string,
  anchorX: number,
  anchorY: number,
): PrefabOverrideDocument {
  return {
    ...doc,
    manual: [
      ...doc.manual,
      {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        anchorX,
        anchorY,
      },
    ],
  }
}

export function removeManualPrefab(doc: PrefabOverrideDocument, id: string): PrefabOverrideDocument {
  return {
    ...doc,
    manual: doc.manual.filter((entry) => entry.id !== id),
  }
}

export type PrefabOverrideExportEntry = {
  key: string
  name: string
  anchorX: number
  anchorY: number
  baseDrawX: number
  baseDrawY: number
  deltaX: number
  deltaY: number
  rotation: PrefabRotationOverride
  zOrder: number
  hidden: boolean
  bakeVariant?: PrefabBakeVariant
  source: 'map' | 'manual'
}

export function buildOverrideExportReport(
  mapPlacements: SinistraTerrainPlacement[],
  doc: PrefabOverrideDocument,
): {
  exportedAt: string
  changedCount: number
  hiddenCount: number
  manualCount: number
  entries: PrefabOverrideExportEntry[]
} {
  const entries: PrefabOverrideExportEntry[] = []
  const seen = new Set<string>()

  for (const placement of mapPlacements) {
    if (placement.mode !== 'baked') {
      continue
    }
    const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
    seen.add(key)
    const override = doc.overrides[key]
    if (!override) {
      continue
    }
    if (
      override.hidden ||
      override.deltaX !== 0 ||
      override.deltaY !== 0 ||
      override.rotation !== 'default' ||
      (override.zOrder ?? 0) !== 0 ||
      override.bakeVariant
    ) {
      entries.push({
        key,
        name: placement.name,
        anchorX: placement.anchorX,
        anchorY: placement.anchorY,
        baseDrawX: placement.x,
        baseDrawY: placement.y,
        deltaX: override.deltaX,
        deltaY: override.deltaY,
        rotation: override.rotation,
        zOrder: override.zOrder ?? 0,
        hidden: Boolean(override.hidden),
        bakeVariant: override.bakeVariant,
        source: 'map',
      })
    }
  }

  for (const manual of doc.manual) {
    const placement = buildManualBakedPlacement(manual)
    if (!placement) {
      continue
    }
    const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
    const override = doc.overrides[key] ?? { deltaX: 0, deltaY: 0, rotation: 'default' as const }
    entries.push({
      key,
      name: placement.name,
      anchorX: placement.anchorX,
      anchorY: placement.anchorY,
      baseDrawX: placement.x,
      baseDrawY: placement.y,
      deltaX: override.deltaX,
      deltaY: override.deltaY,
      rotation: override.rotation,
      zOrder: override.zOrder ?? 0,
      hidden: Boolean(override.hidden),
      bakeVariant: override.bakeVariant,
      source: 'manual',
    })
  }

  return {
    exportedAt: new Date().toISOString(),
    changedCount: entries.filter((entry) => !entry.hidden && entry.source === 'map').length,
    hiddenCount: entries.filter((entry) => entry.hidden).length,
    manualCount: entries.filter((entry) => entry.source === 'manual' && !entry.hidden).length,
    entries,
  }
}

export function formatOverrideExportJson(
  mapPlacements: SinistraTerrainPlacement[],
  doc: PrefabOverrideDocument,
  layerAlignment?: Record<string, number>,
): string {
  return JSON.stringify(
    {
      ...buildOverrideExportReport(mapPlacements, doc),
      layerAlignment: layerAlignment ?? null,
      prefabOverrideDoc: {
        version: 1 as const,
        overrides: doc.overrides,
        manual: doc.manual,
        manualGroundTiles: doc.manualGroundTiles,
        groups: doc.groups,
        globalMoveDeltaX: doc.globalMoveDeltaX ?? 0,
        globalMoveDeltaY: doc.globalMoveDeltaY ?? 0,
      },
      manualGroundTiles: doc.manualGroundTiles,
      groups: doc.groups,
    },
    null,
    2,
  )
}

export type OverrideBackupImport = {
  doc: PrefabOverrideDocument
  layerAlignment: Partial<{
    chunkGroundCells: number
    chunkGroundCellsX: number
    prefabCells: number
    prefabCellsX: number
    prefabScaleY: number
  }> | null
}

export function normalizePrefabOverrideDocument(raw: Partial<PrefabOverrideDocument>): PrefabOverrideDocument {
  return {
    version: 1,
    overrides: raw.overrides ?? {},
    manual: Array.isArray(raw.manual) ? raw.manual : [],
    manualGroundTiles: Array.isArray(raw.manualGroundTiles) ? raw.manualGroundTiles : [],
    groups: Array.isArray(raw.groups) ? raw.groups : [],
    globalMoveDeltaX: typeof raw.globalMoveDeltaX === 'number' ? raw.globalMoveDeltaX : 0,
    globalMoveDeltaY: typeof raw.globalMoveDeltaY === 'number' ? raw.globalMoveDeltaY : 0,
  }
}

function docFromExportEntries(
  entries: PrefabOverrideExportEntry[],
  manualGroundTiles: ManualGroundTileInstance[],
  groups: AlignmentEditorGroup[],
  globalMove: { deltaX?: number; deltaY?: number },
): PrefabOverrideDocument {
  const overrides: Record<string, PrefabInstanceOverride> = {}
  const manual: ManualPrefabInstance[] = []

  for (const entry of entries) {
    overrides[entry.key] = {
      deltaX: entry.deltaX,
      deltaY: entry.deltaY,
      rotation: entry.rotation,
      zOrder: entry.zOrder,
      hidden: entry.hidden,
      bakeVariant: entry.bakeVariant,
    }
    if (entry.source === 'manual') {
      manual.push({
        id: `manual-import-${entry.key.replace(/[^a-zA-Z0-9|._-]/g, '_')}`,
        name: entry.name,
        anchorX: entry.anchorX,
        anchorY: entry.anchorY,
      })
    }
  }

  return normalizePrefabOverrideDocument({
    overrides,
    manual,
    manualGroundTiles,
    groups,
    globalMoveDeltaX: globalMove.deltaX,
    globalMoveDeltaY: globalMove.deltaY,
  })
}

function parseLayerAlignment(raw: unknown): OverrideBackupImport['layerAlignment'] {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const parsed = raw as Record<string, unknown>
  const next: NonNullable<OverrideBackupImport['layerAlignment']> = {}
  if (typeof parsed.chunkGroundCells === 'number') {
    next.chunkGroundCells = parsed.chunkGroundCells
  }
  if (typeof parsed.chunkGroundCellsX === 'number') {
    next.chunkGroundCellsX = parsed.chunkGroundCellsX
  }
  if (typeof parsed.prefabCells === 'number') {
    next.prefabCells = parsed.prefabCells
  }
  if (typeof parsed.prefabCellsX === 'number') {
    next.prefabCellsX = parsed.prefabCellsX
  }
  if (typeof parsed.prefabScaleY === 'number') {
    next.prefabScaleY = parsed.prefabScaleY
  }
  return Object.keys(next).length > 0 ? next : null
}

export function importOverrideBackupJson(text: string): { ok: true; data: OverrideBackupImport } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Invalid JSON — could not parse the file.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Backup must be a JSON object.' }
  }

  const file = parsed as Record<string, unknown>
  const layerAlignment = parseLayerAlignment(file.layerAlignment)

  if (file.prefabOverrideDoc && typeof file.prefabOverrideDoc === 'object') {
    return {
      ok: true,
      data: {
        doc: normalizePrefabOverrideDocument(file.prefabOverrideDoc as Partial<PrefabOverrideDocument>),
        layerAlignment,
      },
    }
  }

  if (file.version === 1 && file.overrides && typeof file.overrides === 'object') {
    return {
      ok: true,
      data: {
        doc: normalizePrefabOverrideDocument(file as Partial<PrefabOverrideDocument>),
        layerAlignment,
      },
    }
  }

  const entries = Array.isArray(file.entries) ? (file.entries as PrefabOverrideExportEntry[]) : null
  if (entries) {
    return {
      ok: true,
      data: {
        doc: docFromExportEntries(
          entries,
          Array.isArray(file.manualGroundTiles) ? (file.manualGroundTiles as ManualGroundTileInstance[]) : [],
          Array.isArray(file.groups) ? (file.groups as AlignmentEditorGroup[]) : [],
          {
            deltaX: typeof file.globalMoveDeltaX === 'number' ? file.globalMoveDeltaX : 0,
            deltaY: typeof file.globalMoveDeltaY === 'number' ? file.globalMoveDeltaY : 0,
          },
        ),
        layerAlignment,
      },
    }
  }

  return {
    ok: false,
    error: 'Unrecognized backup format. Use a file from Copy/Download override JSON.',
  }
}
