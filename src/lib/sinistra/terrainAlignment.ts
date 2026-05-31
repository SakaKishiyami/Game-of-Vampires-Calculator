import {
  SLG_CHUNK_GROUND_Y_NUDGE,
  SLG_DEFAULT_CHUNK_GROUND_X_NUDGE,
  SLG_DEFAULT_PREFAB_X_NUDGE,
  SLG_DEFAULT_PREFAB_Y_NUDGE,
  SLG_CHUNK_GROUND_CELL_SIZE,
  SLG_MAP_CELL_SIZE,
} from '@/lib/sinistra/constants'
import {
  ensureBundledSinistraDefaults,
  getBundledTerrainAlignmentOffsets,
} from '@/lib/sinistra/bundledSinistraDefaults'
import type { SinistraTerrainPlacement, SinistraWorldBounds } from '@/lib/sinistra/types'

export type TerrainAlignmentOffsets = {
  /** Extra Y shift for chunk-ground tiles (SVG Y-down, positive = down). */
  chunkGroundCells: number
  /** Extra X shift for chunk-ground tiles (positive = right). */
  chunkGroundCellsX: number
  /** Extra Y shift inside mirrored prefab layer (positive = up on screen). */
  prefabCells: number
  /** Extra X shift for prefab layer in screen space (positive = right). */
  prefabCellsX: number
  /** Vertical scale for the whole prefab layer (1 = normal, <1 = squish shorter). */
  prefabScaleY: number
}

const STORAGE_KEY = 'sinistra-terrain-alignment-v2'

export function defaultTerrainAlignmentOffsets(): TerrainAlignmentOffsets {
  return {
    chunkGroundCells: SLG_CHUNK_GROUND_Y_NUDGE / SLG_MAP_CELL_SIZE,
    chunkGroundCellsX: SLG_DEFAULT_CHUNK_GROUND_X_NUDGE / SLG_MAP_CELL_SIZE,
    prefabCells: SLG_DEFAULT_PREFAB_Y_NUDGE / SLG_MAP_CELL_SIZE,
    prefabCellsX: SLG_DEFAULT_PREFAB_X_NUDGE / SLG_MAP_CELL_SIZE,
    prefabScaleY: 1,
  }
}

export const TERRAIN_ALIGN_SCALE_Y_MIN = 0.85
export const TERRAIN_ALIGN_SCALE_Y_MAX = 1.15
export const TERRAIN_ALIGN_SCALE_Y_STEP = 0.005

export function clampAlignmentScaleY(scaleY: number): number {
  const stepped = Math.round(scaleY / TERRAIN_ALIGN_SCALE_Y_STEP) * TERRAIN_ALIGN_SCALE_Y_STEP
  return Math.min(TERRAIN_ALIGN_SCALE_Y_MAX, Math.max(TERRAIN_ALIGN_SCALE_Y_MIN, stepped))
}

function normalizeOffsets(parsed: Partial<TerrainAlignmentOffsets>): TerrainAlignmentOffsets {
  const defaults = defaultTerrainAlignmentOffsets()
  return {
    chunkGroundCells:
      typeof parsed.chunkGroundCells === 'number' ? parsed.chunkGroundCells : defaults.chunkGroundCells,
    chunkGroundCellsX:
      typeof parsed.chunkGroundCellsX === 'number' ? parsed.chunkGroundCellsX : defaults.chunkGroundCellsX,
    prefabCells: typeof parsed.prefabCells === 'number' ? parsed.prefabCells : defaults.prefabCells,
    prefabCellsX: typeof parsed.prefabCellsX === 'number' ? parsed.prefabCellsX : defaults.prefabCellsX,
    prefabScaleY:
      typeof parsed.prefabScaleY === 'number'
        ? clampAlignmentScaleY(parsed.prefabScaleY)
        : defaults.prefabScaleY,
  }
}

export function loadTerrainAlignmentOffsets(): TerrainAlignmentOffsets {
  if (typeof window === 'undefined') {
    return getBundledTerrainAlignmentOffsets()
  }

  try {
    ensureBundledSinistraDefaults()

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return normalizeOffsets(JSON.parse(raw) as Partial<TerrainAlignmentOffsets>)
    }

    const legacyRaw = window.localStorage.getItem('sinistra-terrain-alignment-v1')
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Partial<TerrainAlignmentOffsets>
      return normalizeOffsets(legacy)
    }

    return getBundledTerrainAlignmentOffsets()
  } catch {
    return getBundledTerrainAlignmentOffsets()
  }
}

export function saveTerrainAlignmentOffsets(offsets: TerrainAlignmentOffsets): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets))
}

export function cellsToWorld(cells: number): number {
  return cells * SLG_MAP_CELL_SIZE
}

export const TERRAIN_ALIGN_CELL_MIN = -8
export const TERRAIN_ALIGN_CELL_MAX = 12
export const TERRAIN_ALIGN_CELL_STEP = 0.05

export function clampAlignmentCells(cells: number): number {
  const stepped = Math.round(cells / TERRAIN_ALIGN_CELL_STEP) * TERRAIN_ALIGN_CELL_STEP
  return Math.min(TERRAIN_ALIGN_CELL_MAX, Math.max(TERRAIN_ALIGN_CELL_MIN, stepped))
}

export function parseAlignmentCellInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '-' || trimmed === '.') {
    return null
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return clampAlignmentCells(parsed)
}

export function prefabMirrorAxis(bounds: SinistraWorldBounds): number {
  return bounds.minY + bounds.maxY
}

/** Top-left screen Y for a chunk-ground tile after alignment nudge. */
export function chunkGroundScreenY(rawY: number, chunkGroundCells: number): number {
  return rawY + cellsToWorld(chunkGroundCells)
}

/** Top-left screen X for a chunk-ground tile after alignment nudge. */
export function chunkGroundScreenX(rawX: number, chunkGroundCellsX: number): number {
  return rawX + cellsToWorld(chunkGroundCellsX)
}

/** Screen-space AABB for a baked prefab inside the mirrored layer. */
export function bakedPrefabScreenBounds(
  bounds: SinistraWorldBounds,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  offsets: Pick<TerrainAlignmentOffsets, 'prefabCells' | 'prefabCellsX' | 'prefabScaleY'>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const axis = prefabMirrorAxis(bounds)
  const nudgeY = cellsToWorld(offsets.prefabCells)
  const nudgeX = cellsToWorld(offsets.prefabCellsX)
  const scaleY = offsets.prefabScaleY ?? 1
  const squishHeight = placement.displayHeight * scaleY
  const centerY = axis - (placement.y + placement.displayHeight / 2) - nudgeY
  return {
    minX: placement.x + nudgeX,
    minY: centerY - squishHeight / 2,
    maxX: placement.x + placement.displayWidth + nudgeX,
    maxY: centerY + squishHeight / 2,
  }
}

/** JSON anchor from chunk file, in screen space after mirror + nudge. */
export function bakedPrefabAnchorScreen(
  bounds: SinistraWorldBounds,
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  offsets: Pick<TerrainAlignmentOffsets, 'prefabCells' | 'prefabCellsX' | 'prefabScaleY'>,
): { x: number; y: number } {
  const axis = prefabMirrorAxis(bounds)
  return {
    x: placement.anchorX + cellsToWorld(offsets.prefabCellsX),
    y: axis - placement.anchorY - cellsToWorld(offsets.prefabCells),
  }
}

export function chunkGroundScreenBounds(
  placement: Extract<SinistraTerrainPlacement, { mode: 'chunkGround' }>,
  offsets: Pick<TerrainAlignmentOffsets, 'chunkGroundCells' | 'chunkGroundCellsX'>,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const x = chunkGroundScreenX(placement.x, offsets.chunkGroundCellsX)
  const y = chunkGroundScreenY(placement.y, offsets.chunkGroundCells)
  return {
    minX: x,
    minY: y,
    maxX: x + placement.width,
    maxY: y + placement.height,
  }
}

export type TerrainAlignmentProbe = {
  worldX: number
  worldY: number
  gridCell: { x: number; y: number }
  gridCellSize: number
  mirrorAxis: number
  chunkGroundHits: Array<{ name: string; rawY: number; screenY: number }>
  prefabHits: Array<{
    name: string
    anchorX: number
    anchorY: number
    drawX: number
    drawY: number
    screenAnchorY: number
  }>
  nearestPrefab: {
    name: string
    anchorX: number
    anchorY: number
    drawX: number
    drawY: number
    screenTop: number
  } | null
}

export function probeTerrainAlignment(
  worldX: number,
  worldY: number,
  placements: SinistraTerrainPlacement[],
  worldBounds: SinistraWorldBounds,
  offsets: TerrainAlignmentOffsets,
  gridCellSize = SLG_MAP_CELL_SIZE,
): TerrainAlignmentProbe {
  const gridCell = {
    x: Math.floor(worldX / gridCellSize) * gridCellSize,
    y: Math.floor(worldY / gridCellSize) * gridCellSize,
  }

  const chunkGroundHits: TerrainAlignmentProbe['chunkGroundHits'] = []
  const prefabHits: TerrainAlignmentProbe['prefabHits'] = []

  for (const placement of placements) {
    if (placement.mode === 'chunkGround') {
      const screen = chunkGroundScreenBounds(placement, offsets)
      if (
        worldX >= screen.minX &&
        worldX <= screen.maxX &&
        worldY >= screen.minY &&
        worldY <= screen.maxY
      ) {
        chunkGroundHits.push({
          name: placement.name,
          rawY: placement.y,
          screenY: screen.minY,
        })
      }
    } else if (placement.mode === 'baked') {
      const screen = bakedPrefabScreenBounds(worldBounds, placement, offsets)
      if (
        worldX >= screen.minX &&
        worldX <= screen.maxX &&
        worldY >= screen.minY &&
        worldY <= screen.maxY
      ) {
        const anchor = bakedPrefabAnchorScreen(worldBounds, placement, offsets)
        prefabHits.push({
          name: placement.name,
          anchorX: placement.anchorX,
          anchorY: placement.anchorY,
          drawX: placement.x,
          drawY: placement.y,
          screenAnchorY: anchor.y,
        })
      }
    }
  }

  let nearestPrefab: TerrainAlignmentProbe['nearestPrefab'] = null
  let nearestDistance = Infinity

  for (const placement of placements) {
    if (placement.mode !== 'baked') {
      continue
    }
    const screen = bakedPrefabScreenBounds(worldBounds, placement, offsets)
    const cx = (screen.minX + screen.maxX) / 2
    const cy = (screen.minY + screen.maxY) / 2
    const distance = Math.hypot(worldX - cx, worldY - cy)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestPrefab = {
        name: placement.name,
        anchorX: placement.anchorX,
        anchorY: placement.anchorY,
        drawX: placement.x,
        drawY: placement.y,
        screenTop: screen.minY,
      }
    }
  }

  return {
    worldX,
    worldY,
    gridCell,
    gridCellSize,
    mirrorAxis: prefabMirrorAxis(worldBounds),
    chunkGroundHits,
    prefabHits,
    nearestPrefab: nearestDistance <= 200 ? nearestPrefab : null,
  }
}

export function formatAlignmentConstantsSnippet(offsets: TerrainAlignmentOffsets): string {
  const round = (value: number) => {
    const clamped = clampAlignmentCells(value)
    return Math.round(clamped * 1000) / 1000
  }
  return [
    `export const SLG_CHUNK_GROUND_Y_NUDGE = ${round(offsets.chunkGroundCells)} * SLG_MAP_CELL_SIZE`,
    `export const SLG_DEFAULT_CHUNK_GROUND_X_NUDGE = ${round(offsets.chunkGroundCellsX)} * SLG_MAP_CELL_SIZE`,
    `export const SLG_DEFAULT_PREFAB_Y_NUDGE = ${round(offsets.prefabCells)} * SLG_MAP_CELL_SIZE`,
    `export const SLG_DEFAULT_PREFAB_X_NUDGE = ${round(offsets.prefabCellsX)} * SLG_MAP_CELL_SIZE`,
    `// prefabScaleY = ${offsets.prefabScaleY}`,
  ].join('\n')
}
