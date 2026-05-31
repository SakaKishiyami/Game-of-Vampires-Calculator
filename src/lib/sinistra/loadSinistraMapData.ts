import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import { SLG_MAP_VIEW_PADDING } from '@/lib/sinistra/constants'
import {
  chunkGroundKey,
  hasChunkGroundBakes,
  listChunkGroundEntries,
} from '@/lib/sinistra/chunkGroundManifest'
import {
  chunkWorldRect,
  gridCellContaining,
  inferChunkFillColor,
  inferTerrainFillColor,
  TERRAIN_TILE_WORLD_SIZE,
  bakedPrefabDrawPlacement,
  bakedPrefabWorldBounds,
  terrainWorldPosition,
} from '@/lib/sinistra/terrainPlacement'
import { getBakedTerrainPrefab, hasBakedPrefabs } from '@/lib/sinistra/prefabManifest'
import type {
  SinistraArea,
  SinistraMapData,
  SinistraOverviewAsset,
  SinistraStructure,
  SinistraStructureKind,
  SinistraTerrainPlacement,
  SinistraTerrainSummary,
  SinistraWorldBounds,
} from '@/lib/sinistra/types'

export type {
  SinistraArea,
  SinistraAreaBoundary,
  SinistraMapData,
  SinistraOverviewAsset,
  SinistraStructure,
  SinistraStructureKind,
  SinistraTerrainPlacement,
  SinistraTerrainSummary,
  SinistraWorldBounds,
} from '@/lib/sinistra/types'

type RawColor = {
  r: number
  g: number
  b: number
  a: number
}

type RawMapPoint = {
  id: number
  type: number
  x: number
  y: number
  rgn: number
  level: number
  ud: number
  a?: number
  b?: number
}

type RawBoundary = {
  id: number
  x: number
  y: number
  w: number
  h: number
}

type RawArea = {
  id: number
  color: RawColor
  isConfederation: number
  minPveLv: number
  maxPveLv: number
  minGveLv: number
  maxGveLv: number
  minResLv: number
  maxResLv: number
}

type RawClientMapData = {
  m_Name: string
  regionOutposts: RawMapPoint[]
  regionForts: RawMapPoint[]
  resourceHubs?: RawMapPoint[]
  buffBuildings: RawMapPoint[]
  regionCastles: RawMapPoint[]
  centralCastle?: RawMapPoint
  bridges: RawMapPoint[]
  areas: RawArea[]
  boundaries: RawBoundary[]
  gunEmplacements: RawMapPoint[]
}

type RawTerrainChunk = {
  position: {
    x: number
    y: number
    z: number
  }
  name: string
  terrains: Array<{
    position: {
      x: number
      y: number
      z: number
    }
    name: string
  }>
}

type RawChunkMap = {
  chucks: RawTerrainChunk[]
}

type MapCandidate = {
  filePath: string
  fileName: string
  monoBehaviourDir: string
  raw: RawClientMapData
  score: number
}

const DATA_MINE_ROOT = path.join(process.cwd(), 'DataMineRaw')
const MAP_FILE_PATTERN = /^clientMapData(.*)\.json$/i

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function fromWorkspacePath(...segments: string[]): string {
  return segments.join('/').replaceAll('\\', '/')
}

function toRgba(color: RawColor, alphaOverride?: number): string {
  const alpha = alphaOverride ?? color.a
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha.toFixed(3)})`
}

function getVariantSuffix(fileName: string): string {
  const match = fileName.match(MAP_FILE_PATTERN)
  return match?.[1] ?? ''
}

function discoverMonoBehaviourDirs(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return []
  }

  const directCandidate = path.join(rootDir, 'base_assets', 'formatted', 'MonoBehaviour')
  const results = fs.existsSync(directCandidate) ? [directCandidate] : []

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const candidate = path.join(rootDir, entry.name, 'base_assets', 'formatted', 'MonoBehaviour')
    if (fs.existsSync(candidate)) {
      results.push(candidate)
    }
  }

  return results
}

type CastleSideCounts = {
  left: number
  right: number
  middleTop: number
  middleBottom: number
}

function countCastleSides(castles: RawMapPoint[]): CastleSideCounts {
  if (castles.length === 0) {
    return { left: 0, right: 0, middleTop: 0, middleBottom: 0 }
  }

  const xs = castles.map((castle) => castle.x)
  const ys = castles.map((castle) => castle.y)
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2

  const counts: CastleSideCounts = { left: 0, right: 0, middleTop: 0, middleBottom: 0 }

  for (const castle of castles) {
    const isLeft = castle.x < centerX - 50
    const isRight = castle.x > centerX + 50
    const isMiddle = !isLeft && !isRight
    const isTop = castle.y < centerY - 50
    const isBottom = castle.y > centerY + 50

    if (isLeft) {
      counts.left += 1
    } else if (isRight) {
      counts.right += 1
    } else if (isMiddle && isTop) {
      counts.middleTop += 1
    } else if (isMiddle && isBottom) {
      counts.middleBottom += 1
    }
  }

  return counts
}

/** Classic Sinistra: 6 coalition starts — 2 per flank, 1 north, 1 south (not 3 per side). */
function scoreClassicSinistraCastleLayout(raw: RawClientMapData): number {
  const castles = raw.regionCastles
  if (castles.length !== 6) {
    return 0
  }

  const sides = countCastleSides(castles)
  if (
    sides.left === 2 &&
    sides.right === 2 &&
    sides.middleTop === 1 &&
    sides.middleBottom === 1
  ) {
    return 10_000
  }

  if (sides.left === 3 && sides.right === 3) {
    return -5_000
  }

  return 0
}

function scoreCandidate(raw: RawClientMapData, suffix: string): number {
  const structureCount =
    raw.regionForts.length +
    raw.regionCastles.length +
    raw.bridges.length +
    raw.buffBuildings.length +
    raw.gunEmplacements.length +
    (raw.centralCastle ? 1 : 0)

  const boundaryCount = raw.boundaries.length
  const maxCoord = Math.max(
    0,
    ...raw.regionForts.map((item) => Math.max(item.x, item.y)),
    ...raw.regionCastles.map((item) => Math.max(item.x, item.y)),
    ...raw.bridges.map((item) => Math.max(item.x, item.y)),
    ...raw.buffBuildings.map((item) => Math.max(item.x, item.y)),
    ...raw.gunEmplacements.map((item) => Math.max(item.x, item.y)),
    raw.centralCastle ? Math.max(raw.centralCastle.x, raw.centralCastle.y) : 0,
  )

  const variantBoost = suffix === '2' ? -2_000 : suffix === '1' || suffix === '' ? 500 : 0

  return (
    structureCount * 100 +
    boundaryCount * 10 +
    maxCoord +
    variantBoost +
    scoreClassicSinistraCastleLayout(raw)
  )
}

function buildAreaData(areas: RawArea[], boundaries: RawBoundary[]): SinistraArea[] {
  const boundaryGroups = new Map<number, RawBoundary[]>()

  for (const boundary of boundaries) {
    const existing = boundaryGroups.get(boundary.id) ?? []
    existing.push(boundary)
    boundaryGroups.set(boundary.id, existing)
  }

  return areas
    .map((area) => {
      const rects = boundaryGroups.get(area.id) ?? []
      if (rects.length === 0) {
      return {
        id: area.id,
        label: `R${area.id}`,
        fill: toRgba(area.color, 0.18),
        stroke: toRgba(area.color, 0.9),
        center: {
          x: 0,
          y: 0,
        },
          rects,
          isConfederation: area.isConfederation === 1,
          pveRange: [area.minPveLv, area.maxPveLv] as [number, number],
          gveRange: [area.minGveLv, area.maxGveLv] as [number, number],
          resourceRange: [area.minResLv, area.maxResLv] as [number, number],
        }
      }

      const minX = Math.min(...rects.map((rect) => rect.x))
      const minY = Math.min(...rects.map((rect) => rect.y))
      const maxX = Math.max(...rects.map((rect) => rect.x + rect.w))
      const maxY = Math.max(...rects.map((rect) => rect.y + rect.h))

      return {
        id: area.id,
        label: `R${area.id}`,
        fill: toRgba(area.color, 0.18),
        stroke: toRgba(area.color, 0.9),
        center: {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
        },
        rects,
        isConfederation: area.isConfederation === 1,
        pveRange: [area.minPveLv, area.maxPveLv],
        gveRange: [area.minGveLv, area.maxGveLv],
        resourceRange: [area.minResLv, area.maxResLv],
      }
    })
    .sort((left, right) => left.id - right.id)
}

function describeSinistraZone(regionId: number): string {
  if (regionId >= 101 && regionId <= 106) {
    return 'Zone 1 — coalition starting territory'
  }

  if (regionId >= 201 && regionId <= 206) {
    return 'Zone 2 — shared border (two coalitions per slice)'
  }

  if (regionId === 301) {
    return 'Zone 3 — inner ring where PvP begins'
  }

  if (regionId === 401) {
    return 'Zone 4 — citadel and final bridges'
  }

  if (regionId === 0) {
    return 'Links between zone rings'
  }

  return `Region ${regionId}`
}

function fortTitle(point: RawMapPoint): string {
  if (point.level === 1) {
    return 'Zone 2 Fort'
  }

  if (point.level === 2) {
    return 'Zone 3 Fort'
  }

  return 'Zone 4 Fort'
}

function buildStructures(raw: RawClientMapData): SinistraStructure[] {
  const structures: SinistraStructure[] = []

  const pushStructure = (
    kind: SinistraStructureKind,
    title: string,
    shortLabel: string,
    point: RawMapPoint,
    detail: string | null = null,
    bridgeRegions?: [number, number],
  ) => {
    const zoneDetail = describeSinistraZone(point.rgn)

    structures.push({
      id: `${kind}-${point.id}`,
      numericId: point.id,
      kind,
      title,
      shortLabel,
      x: point.x,
      y: point.y,
      regionId: point.rgn,
      level: point.level,
      rawType: point.type,
      detail: detail ? `${zoneDetail}. ${detail}` : zoneDetail,
      bridgeRegions,
    })
  }

  raw.regionCastles.forEach((point) =>
    pushStructure('coalitionHome', 'Coalition Start', 'Z1', point),
  )

  raw.regionOutposts.forEach((point) =>
    pushStructure('mansion', `Mansion L${point.level}`, 'M', point),
  )

  raw.regionForts.forEach((point) =>
    pushStructure('fort', `${fortTitle(point)} L${point.level}`, `${point.level}`, point),
  )

  raw.bridges.forEach((point) =>
    pushStructure(
      'bridge',
      `Bridge L${point.level}`,
      `${point.level}`,
      point,
      point.a && point.b ? `Connects regions ${point.a} and ${point.b}` : null,
      point.a && point.b ? [point.a, point.b] : undefined,
    ),
  )

  raw.buffBuildings.forEach((point) =>
    pushStructure('sanctum', 'UR Sanctum', 'S', point),
  )

  raw.gunEmplacements.forEach((point) =>
    pushStructure('turret', 'Citadel Turret', 'T', point),
  )

  if (raw.centralCastle) {
    pushStructure('citadel', 'Citadel', 'C', raw.centralCastle)
  }

  for (const point of raw.resourceHubs ?? []) {
    pushStructure('tree', `Gathering site L${point.level}`, '·', point)
  }

  return structures
}

function buildCounts(structures: SinistraStructure[]): Record<SinistraStructureKind, number> {
  return structures.reduce<Record<SinistraStructureKind, number>>(
    (counts, structure) => {
      counts[structure.kind] += 1
      return counts
    },
    {
      coalitionHome: 0,
      mansion: 0,
      fort: 0,
      bridge: 0,
      sanctum: 0,
      turret: 0,
      citadel: 0,
      tree: 0,
    },
  )
}

function buildChunkGroundPlacements(): SinistraTerrainPlacement[] {
  if (!hasChunkGroundBakes()) {
    return []
  }

  return listChunkGroundEntries().map((entry) => ({
    mode: 'chunkGround' as const,
    x: entry.worldX,
    y: entry.worldY,
    name: entry.chunkKey,
    imagePath: entry.imagePath,
    width: entry.worldWidth,
    height: entry.worldHeight,
  }))
}

function terrainPlacementKey(name: string, x: number, y: number): string {
  const round = (value: number) => Math.round(value * 1000) / 1000
  return `${name}|${round(x)}|${round(y)}`
}

function bakedDrawPlacementKey(x: number, y: number, width: number, height: number): string {
  const round = (value: number) => Math.round(value * 1000) / 1000
  return `${round(x)}|${round(y)}|${round(width)}|${round(height)}`
}

const CHUNK_MAP_FILE_NAMES = ['SLGMapChuck1.json', 'SLGMapChuck2.json', 'SLGMapChuck.json'] as const

function discoverChunkMapFiles(monoBehaviourDir: string): string[] {
  const results: string[] = []

  for (const fileName of CHUNK_MAP_FILE_NAMES) {
    const filePath = path.join(monoBehaviourDir, fileName)
    if (!fs.existsSync(filePath)) {
      continue
    }

    // SLGMapChuck.json duplicates SLGMapChuck1.json byte-for-byte in the datamine.
    if (fileName === 'SLGMapChuck.json') {
      const chuck1Path = path.join(monoBehaviourDir, 'SLGMapChuck1.json')
      if (fs.existsSync(chuck1Path)) {
        continue
      }
    }

    results.push(filePath)
  }

  return results
}

function buildEdgeTerrainPlacements(chunkFiles: string[]): {
  summary: Omit<SinistraTerrainSummary, 'chunkGroundCount'> | null
  placements: SinistraTerrainPlacement[]
} {
  if (chunkFiles.length === 0) {
    return { summary: null, placements: [] }
  }

  const placements: SinistraTerrainPlacement[] = []
  const seenBaked = new Set<string>()
  const seenBakedDraw = new Set<string>()
  let bakedPrefabCount = 0
  const useBakedPrefabs = hasBakedPrefabs()
  const useChunkGround = hasChunkGroundBakes()
  const bakedChunkKeys = new Set(listChunkGroundEntries().map((entry) => entry.chunkKey))
  const seenChunkFills = new Set<string>()

  for (const filePath of chunkFiles) {
    const raw = readJsonFile<RawChunkMap>(filePath)
    if (!raw) {
      continue
    }

    for (const chunk of raw.chucks) {
      const terrainNames = chunk.terrains.map((terrain) => terrain.name)
      const groundKey = chunkGroundKey(chunk.position)
      const hasGroundBake = bakedChunkKeys.has(groundKey)

      if (terrainNames.length > 0 && !useChunkGround && !hasGroundBake) {
        const fillKey = groundKey
        if (!seenChunkFills.has(fillKey)) {
          seenChunkFills.add(fillKey)
          const chunkRect = chunkWorldRect(chunk.position)
          placements.push({
            mode: 'fill',
            x: chunkRect.x,
            y: chunkRect.y,
            width: chunkRect.width,
            height: chunkRect.height,
            fill: inferChunkFillColor(terrainNames),
            name: `chunk-${chunk.position.x}-${chunk.position.y}`,
            kind: 'chunk',
          })
        }
      }

      for (const terrain of chunk.terrains) {
        const world = terrainWorldPosition(terrain)

        if (useBakedPrefabs) {
          const baked = getBakedTerrainPrefab(terrain.name)
          if (baked) {
            const dedupeKey = terrainPlacementKey(terrain.name, world.x, world.y)
            if (seenBaked.has(dedupeKey)) {
              continue
            }
            seenBaked.add(dedupeKey)
            const draw = bakedPrefabDrawPlacement(
              terrain.name,
              world.x,
              world.y,
              baked.originOffsetX,
              baked.originOffsetY,
            )
            const drawKey = bakedDrawPlacementKey(
              draw.x,
              draw.y,
              baked.width,
              baked.height,
            )
            if (seenBakedDraw.has(drawKey)) {
              continue
            }
            seenBakedDraw.add(drawKey)
            bakedPrefabCount += 1
            placements.push({
              mode: 'baked',
              x: draw.x,
              y: draw.y,
              anchorX: world.x,
              anchorY: world.y,
              name: terrain.name,
              imagePath: baked.imagePath,
              width: baked.width,
              height: baked.height,
              originOffsetX: baked.originOffsetX,
              originOffsetY: baked.originOffsetY,
              displayWidth: baked.width,
              displayHeight: baked.height,
            })
            continue
          }
        }

        if (!useChunkGround) {
          const cell = gridCellContaining(world.x, world.y)
          placements.push({
            mode: 'fill',
            x: cell.x,
            y: cell.y,
            width: TERRAIN_TILE_WORLD_SIZE,
            height: TERRAIN_TILE_WORLD_SIZE,
            fill: inferTerrainFillColor(terrain.name),
            name: terrain.name,
            kind: 'cell',
          })
        }
      }
    }
  }

  if (placements.length === 0) {
    return { summary: null, placements: [] }
  }

  return {
    placements,
    summary: {
      placementCount: placements.length,
      bakedPrefabCount,
    },
  }
}

function buildTerrainPlacements(chunkFiles: string[]): {
  summary: SinistraTerrainSummary | null
  placements: SinistraTerrainPlacement[]
} {
  const chunkGroundPlacements = buildChunkGroundPlacements()
  const { summary: edgeSummary, placements: edgePlacements } = buildEdgeTerrainPlacements(chunkFiles)
  const placements = [...chunkGroundPlacements, ...edgePlacements]

  if (!edgeSummary && chunkGroundPlacements.length === 0) {
    return { summary: null, placements: [] }
  }

  return {
    placements,
    summary: {
      placementCount: placements.length,
      bakedPrefabCount: edgeSummary?.bakedPrefabCount ?? 0,
      chunkGroundCount: chunkGroundPlacements.length,
    },
  }
}

function extendBounds(bounds: SinistraWorldBounds, x: number, y: number): SinistraWorldBounds {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return bounds
  }

  return {
    minX: Math.min(bounds.minX, x),
    minY: Math.min(bounds.minY, y),
    maxX: Math.max(bounds.maxX, x),
    maxY: Math.max(bounds.maxY, y),
  }
}

function finalizeWorldBounds(bounds: SinistraWorldBounds): SinistraWorldBounds {
  const minX = Number(bounds.minX)
  const minY = Number(bounds.minY)
  const maxX = Number(bounds.maxX)
  const maxY = Number(bounds.maxY)

  if (
    Number.isFinite(minX) &&
    Number.isFinite(minY) &&
    Number.isFinite(maxX) &&
    Number.isFinite(maxY) &&
    maxX > minX &&
    maxY > minY
  ) {
    return { minX, minY, maxX, maxY }
  }

  return { minX: -20, minY: -20, maxX: 1220, maxY: 1260 }
}

function buildWorldBounds(placements: SinistraTerrainPlacement[]): SinistraWorldBounds {
  if (placements.length === 0) {
    return { minX: 0, minY: 0, maxX: 2400, maxY: 2400 }
  }

  return placements.reduce<SinistraWorldBounds>((bounds, placement) => {
    let next = extendBounds(bounds, placement.x, placement.y)

    if (placement.mode === 'fill' || placement.mode === 'chunkGround') {
      next = extendBounds(next, placement.x + placement.width, placement.y + placement.height)
    } else if (placement.mode === 'baked') {
      const bounds = bakedPrefabWorldBounds(
        placement.x,
        placement.y,
        placement.displayWidth,
        placement.displayHeight,
      )
      next = extendBounds(next, bounds.minX, bounds.minY)
      next = extendBounds(next, bounds.maxX, bounds.maxY)
    }

    return next
  }, extendBounds(
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    placements[0]?.x ?? 0,
    placements[0]?.y ?? 0,
  ))
}

function buildMapExtent(
  structures: SinistraStructure[],
  placements: SinistraTerrainPlacement[],
  areas: SinistraArea[],
  overview: SinistraOverviewAsset,
): SinistraWorldBounds {
  let bounds = buildWorldBounds(placements)

  for (const structure of structures) {
    bounds = extendBounds(bounds, structure.x, structure.y)
  }

  for (const area of areas) {
    for (const rect of area.rects) {
      bounds = extendBounds(bounds, rect.x, rect.y)
      bounds = extendBounds(bounds, rect.x + rect.w, rect.y + rect.h)
    }
  }

  bounds = extendBounds(bounds, overview.worldX, overview.worldY)
  bounds = extendBounds(
    bounds,
    overview.worldX + overview.worldWidth,
    overview.worldY + overview.worldHeight,
  )

  return bounds
}

function buildOverviewAsset(bounds: SinistraWorldBounds): SinistraOverviewAsset {
  const imageWidth = 1024
  const imageHeight = 2048
  const terrainWidth = bounds.maxX - bounds.minX
  const terrainHeight = bounds.maxY - bounds.minY
  const terrainCenterX = (bounds.minX + bounds.maxX) / 2
  const terrainCenterY = (bounds.minY + bounds.maxY) / 2
  const scale = Math.max(terrainWidth / imageWidth, terrainHeight / imageHeight)
  const worldWidth = imageWidth * scale
  const worldHeight = imageHeight * scale

  return {
    path: fromWorkspacePath('DataMineRaw', 'extracted', 'slg', 'slgbg__SLGBasicActivity_bg_atlas_pcmc0.png'),
    imageWidth,
    imageHeight,
    worldX: terrainCenterX - worldWidth / 2,
    worldY: terrainCenterY - worldHeight / 2,
    worldWidth,
    worldHeight,
  }
}


export { discoverChunkMapFiles }

function selectBestCandidate(monoBehaviourDirs: string[]): MapCandidate | null {
  const candidates: MapCandidate[] = []

  for (const monoBehaviourDir of monoBehaviourDirs) {
    for (const fileName of fs.readdirSync(monoBehaviourDir)) {
      if (!MAP_FILE_PATTERN.test(fileName)) {
        continue
      }

      const filePath = path.join(monoBehaviourDir, fileName)
      const raw = readJsonFile<RawClientMapData>(filePath)
      if (!raw) {
        continue
      }

      candidates.push({
        filePath,
        fileName,
        monoBehaviourDir,
        raw,
        score: scoreCandidate(raw, getVariantSuffix(fileName)),
      })
    }
  }

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((left, right) => right.score - left.score)
  return candidates[0] ?? null
}

export const loadSinistraMapData = cache((): SinistraMapData | null => {
  const monoBehaviourDirs = discoverMonoBehaviourDirs(DATA_MINE_ROOT)
  const bestCandidate = selectBestCandidate(monoBehaviourDirs)

  if (!bestCandidate) {
    return null
  }

  const chunkFiles = discoverChunkMapFiles(bestCandidate.monoBehaviourDir)
  const { summary: terrainSummary, placements: terrainPlacements } = buildTerrainPlacements(chunkFiles)

  const structures = buildStructures(bestCandidate.raw)
  const areas = buildAreaData(bestCandidate.raw.areas, bestCandidate.raw.boundaries)
  const counts = buildCounts(structures)
  const terrainBounds = buildWorldBounds(terrainPlacements)
  const overview = buildOverviewAsset(terrainBounds)
  const worldBounds = finalizeWorldBounds(
    buildMapExtent(structures, terrainPlacements, areas, overview),
  )
  const overviewAligned = buildOverviewAsset(worldBounds)
  const worldSize =
    Math.ceil(
      (Math.max(worldBounds.maxX - worldBounds.minX, worldBounds.maxY - worldBounds.minY) +
        SLG_MAP_VIEW_PADDING * 2) /
        50,
    ) * 50

  return {
    worldSize,
    worldBounds,
    areas,
    structures,
    counts,
    terrainSummary,
    terrainPlacements,
    overview: overviewAligned,
  }
})
