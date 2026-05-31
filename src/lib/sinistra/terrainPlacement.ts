import {
  SLG_CHUNK_GROUND_CELL_COUNT,
  SLG_CHUNK_GROUND_CELL_SIZE,
  SLG_MAP_CELL_SIZE,
  SLG_MAP_CHUNK_SIZE,
} from '@/lib/sinistra/constants'
import { getPrefabRootLocal } from '@/lib/sinistra/prefabRootLocals'

/** Large prefabs carry bake bounds offsets hundreds of units from their map anchor. */
const LARGE_PREFAB_ORIGIN_THRESHOLD = 50

/**
 * Resolve terrain anchor from SLGMapChuck JSON.
 * `terrain.position` is already in SLG world space (same axis as chunk-ground bakes).
 */
export function terrainWorldPosition(terrain: {
  position: { x: number; y: number }
}): { x: number; y: number } {
  return { x: terrain.position.x, y: terrain.position.y }
}

export type BakedPrefabDrawPlacement = {
  x: number
  y: number
}

function isCanonicalLargePlacement(
  anchorX: number,
  anchorY: number,
  rootLocalX: number,
  rootLocalY: number,
): boolean {
  return Math.abs(anchorX - rootLocalX) < 0.01 && Math.abs(anchorY - rootLocalY) < 0.01
}

/** In-place Y flip inside the mirrored prefab layer (draw box stays put, art flips). */
export function bakedPrefabShouldFlipY(terrainName: string): boolean {
  // Zone corners keep their 90° rotation fix instead of a Y-flip.
  return bakedPrefabCornerRotation(terrainName) === null
}

export type BakedPrefabCornerRotation = 'cw90' | 'ccw90'

/** Zone corner tiles — rotate in place inside the mirrored prefab layer. */
export function bakedPrefabCornerRotation(terrainName: string): BakedPrefabCornerRotation | null {
  const lowered = terrainName.toLowerCase()

  if (lowered.includes('leftup') || lowered.includes('lefttop')) {
    return 'ccw90'
  }

  if (lowered.includes('rightdown')) {
    return 'ccw90'
  }

  if (lowered.includes('leftdown')) {
    return 'cw90'
  }

  if (lowered.includes('rightup') || lowered.includes('righttop')) {
    return 'cw90'
  }

  return null
}

/**
 * Map draw corner for a baked prefab PNG.
 * `anchorX/Y` come from terrains[].position in SLGMapChuck*.json.
 * Small edge tiles: subtract bake padding so the JSON anchor lands on the prefab root.
 * Large composites: anchor is the prefab root; shift by root-local + bake bounds.
 */
export function bakedPrefabDrawPlacement(
  terrainName: string,
  anchorX: number,
  anchorY: number,
  originOffsetX: number,
  originOffsetY: number,
): BakedPrefabDrawPlacement {
  const originMagnitude = Math.max(Math.abs(originOffsetX), Math.abs(originOffsetY))

  if (originMagnitude < LARGE_PREFAB_ORIGIN_THRESHOLD) {
    return {
      x: anchorX - originOffsetX,
      y: anchorY - originOffsetY,
    }
  }

  const rootLocal = getPrefabRootLocal(terrainName)
  const canonical = isCanonicalLargePlacement(
    anchorX,
    anchorY,
    rootLocal.x,
    rootLocal.y,
  )

  return {
    x: canonical ? anchorX : anchorX - originOffsetX - rootLocal.x,
    y: originOffsetY + anchorY - rootLocal.y,
  }
}

export function snapToSlgGrid(value: number, cellSize = SLG_MAP_CELL_SIZE): number {
  return Math.round(value / cellSize) * cellSize
}

export function snapTerrainToGrid(
  x: number,
  y: number,
  cellSize = SLG_MAP_CELL_SIZE,
): { x: number; y: number } {
  return {
    x: snapToSlgGrid(x, cellSize),
    y: snapToSlgGrid(y, cellSize),
  }
}

/** Top-left corner of the SLG grid cell that contains a world point. */
export function gridCellContaining(
  x: number,
  y: number,
  cellSize = SLG_MAP_CELL_SIZE,
): { x: number; y: number; size: number } {
  const col = Math.floor(x / cellSize)
  const row = Math.floor(y / cellSize)
  return {
    x: col * cellSize,
    y: row * cellSize,
    size: cellSize,
  }
}

type ChunkGroundSnapBounds = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Snap a screen-space click to chunk-ground storage coords (raw, before alignment nudge).
 * Clicks land on nudged chunk art; stored tile coords must not include that nudge.
 */
export function chunkGroundStorageCellFromScreen(
  screenX: number,
  screenY: number,
  chunkGroundNudgeWorldX: number,
  chunkGroundNudgeWorldY: number,
  chunks?: ChunkGroundSnapBounds[],
): { x: number; y: number; size: number } {
  const rawX = screenX - chunkGroundNudgeWorldX
  const rawY = screenY - chunkGroundNudgeWorldY

  if (chunks) {
    for (const chunk of chunks) {
      if (
        rawX >= chunk.x &&
        rawX < chunk.x + chunk.width &&
        rawY >= chunk.y &&
        rawY < chunk.y + chunk.height
      ) {
        const cellSize = chunk.width / SLG_CHUNK_GROUND_CELL_COUNT
        const col = Math.floor((rawX - chunk.x) / cellSize)
        const row = Math.floor((rawY - chunk.y) / cellSize)
        return {
          x: chunk.x + col * cellSize,
          y: chunk.y + row * cellSize,
          size: cellSize,
        }
      }
    }
  }

  return gridCellContaining(rawX, rawY, SLG_CHUNK_GROUND_CELL_SIZE)
}

/** Each placed tile covers one SLG map cell on the world grid. */
export const TERRAIN_TILE_WORLD_SIZE = SLG_MAP_CELL_SIZE

export function isTerrainEdgePrefab(name: string): boolean {
  const lowered = name.toLowerCase()
  return (
    lowered.includes('bridge') ||
    lowered.includes('left') ||
    lowered.includes('right') ||
    lowered.includes('up') ||
    lowered.includes('down') ||
    lowered.includes('vertical') ||
    lowered.includes('horizontal') ||
    lowered.includes('castle') ||
    lowered.includes('special') ||
    lowered.includes('big') ||
    lowered.includes('_t_') ||
    lowered.includes('link')
  )
}

export function inferTerrainFillColor(name: string): string {
  const lowered = name.toLowerCase()
  if (lowered.includes('snow')) {
    return 'rgba(232, 242, 252, 0.92)'
  }
  if (lowered.includes('volcano')) {
    return 'rgba(92, 58, 42, 0.9)'
  }
  if (lowered.includes('grey') || lowered.includes('wild')) {
    return 'rgba(148, 138, 128, 0.9)'
  }
  return 'rgba(120, 112, 104, 0.88)'
}

export function inferChunkFillColor(terrainNames: string[]): string {
  if (terrainNames.length === 0) {
    return 'rgba(100, 96, 90, 0.35)'
  }

  const score = { snow: 0, volcano: 0, grey: 0 }
  for (const name of terrainNames) {
    const lowered = name.toLowerCase()
    if (lowered.includes('snow')) {
      score.snow += 1
    }
    if (lowered.includes('volcano')) {
      score.volcano += 1
    }
    if (lowered.includes('grey') || lowered.includes('wild')) {
      score.grey += 1
    }
  }

  const dominant =
    score.snow >= score.volcano && score.snow >= score.grey
      ? 'snow'
      : score.volcano >= score.grey
        ? 'volcano'
        : 'grey'

  return inferTerrainFillColor(dominant === 'snow' ? 'Snow' : dominant === 'volcano' ? 'Volcano' : 'Grey')
}

export function chunkWorldRect(chunkPosition: { x: number; y: number }): {
  x: number
  y: number
  width: number
  height: number
} {
  return {
    x: chunkPosition.x,
    y: chunkPosition.y,
    width: SLG_MAP_CHUNK_SIZE,
    height: SLG_MAP_CHUNK_SIZE,
  }
}

/** World AABB of a baked prefab drawn at its chunk JSON position. */
export function bakedPrefabWorldBounds(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: anchorX,
    maxX: anchorX + width,
    minY: anchorY,
    maxY: anchorY + height,
  }
}

/** SLG grid cells (40×40) that overlap a world-space rectangle. */
export function gridCellsOverlappingRect(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  cellSize = SLG_MAP_CELL_SIZE,
): Array<{ x: number; y: number; size: number }> {
  const startCol = Math.floor(bounds.minX / cellSize)
  const endCol = Math.floor(Math.max(bounds.minX, bounds.maxX - 1e-6) / cellSize)
  const startRow = Math.floor(bounds.minY / cellSize)
  const endRow = Math.floor(Math.max(bounds.minY, bounds.maxY - 1e-6) / cellSize)

  const cells: Array<{ x: number; y: number; size: number }> = []
  for (let col = startCol; col <= endCol; col += 1) {
    for (let row = startRow; row <= endRow; row += 1) {
      cells.push({
        x: col * cellSize,
        y: row * cellSize,
        size: cellSize,
      })
    }
  }

  return cells
}
