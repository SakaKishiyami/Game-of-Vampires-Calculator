import fs from 'node:fs'
import path from 'node:path'
import { SLG_CHUNK_GROUND_Y_NUDGE, SLG_DEFAULT_CHUNK_GROUND_X_NUDGE, SLG_DEFAULT_PREFAB_X_NUDGE, SLG_DEFAULT_PREFAB_Y_NUDGE, SLG_MAP_CELL_SIZE, SLG_MAP_CHUNK_SIZE } from '@/lib/sinistra/constants'
import { getBakedTerrainPrefab, getPrefabManifestInfo, hasBakedPrefabs } from '@/lib/sinistra/prefabManifest'
import { loadSinistraMapData, discoverChunkMapFiles } from '@/lib/sinistra/loadSinistraMapData'
import type { SinistraWorldBounds } from '@/lib/sinistra/types'

const DATA_MINE_ROOT = path.join(process.cwd(), 'DataMineRaw')
const SPLIT_MAP_PREFAB_PATH = path.join(
  DATA_MINE_ROOT,
  'Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip',
  'base_assets',
  'formatted',
  'MonoBehaviour',
  'SLGSplitMapPrefab.json',
)

export type SinistraAssetProbe = {
  label: string
  relativePath: string
  fileExists: boolean
  sizeBytes: number | null
  apiUrl: string
}

export type SinistraBakedSample = {
  name: string
  imagePath: string
  fileExists: boolean
  width: number
  height: number
  originOffsetX: number
  originOffsetY: number
  pixelWidth: number | null
  pixelHeight: number | null
}

export type SinistraDebugReport = {
  generatedAt: string
  mapAvailable: boolean
  mapVariant: string | null
  chunkFile: string | null
  worldBounds: SinistraWorldBounds | null
  grid: {
    cellSize: number
    chunkTiles: number
    chunkWorldUnits: number
    source: string
  }
  terrain: {
    pipeline: string
    useBakedPrefabs: boolean
    prefabManifestBakedCount: number
    placementCount: number
    bakedPlacementCount: number
    uniqueTerrainInChunk: number
    missingBakeCount: number
    missingBakeSample: string[]
    bakedSamples: SinistraBakedSample[]
    alignment: {
      chunkGroundYNudgeCells: number
      chunkGroundXNudgeCells: number
      prefabYNudgeCells: number
      prefabXNudgeCells: number
      mirrorAxisY: number | null
      note: string
    }
  }
  overview: {
    path: string | null
    fileExists: boolean
    sizeBytes: number | null
  }
  assetProbes: SinistraAssetProbe[]
  pipelineNotes: string[]
  beaconPlanningNotes: string[]
}

function readSplitMapCellSize(): number {
  try {
    const raw = JSON.parse(fs.readFileSync(SPLIT_MAP_PREFAB_PATH, 'utf8')) as { cellSize?: number }
    return typeof raw.cellSize === 'number' ? raw.cellSize : SLG_MAP_CELL_SIZE
  } catch {
    return SLG_MAP_CELL_SIZE
  }
}

function resolveWorkspacePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath)
}

function buildApiUrl(relativePath: string): string {
  return `/api/raw-asset/?path=${encodeURIComponent(relativePath.replace(/\\/g, '/'))}`
}

function probeFile(label: string, relativePath: string): SinistraAssetProbe {
  const absolute = resolveWorkspacePath(relativePath)
  const fileExists = fs.existsSync(absolute)
  let sizeBytes: number | null = null
  if (fileExists) {
    sizeBytes = fs.statSync(absolute).size
  }

  return {
    label,
    relativePath: relativePath.replace(/\\/g, '/'),
    fileExists,
    sizeBytes,
    apiUrl: buildApiUrl(relativePath),
  }
}

const CHUNK_FILE_NAMES = ['SLGMapChuck1.json', 'SLGMapChuck2.json', 'SLGMapChuck.json']

function discoverAllChunkTerrainNames(monoBehaviourDir: string | null): string[] {
  if (!monoBehaviourDir) {
    return []
  }

  const names = new Set<string>()
  for (const fileName of CHUNK_FILE_NAMES) {
    const filePath = path.join(monoBehaviourDir, fileName)
    if (!fs.existsSync(filePath)) {
      continue
    }

    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        chucks?: Array<{ terrains?: Array<{ name: string }> }>
      }
      for (const chunk of raw.chucks ?? []) {
        for (const terrain of chunk.terrains ?? []) {
          names.add(terrain.name)
        }
      }
    } catch {
      continue
    }
  }

  return [...names].sort()
}

function inferChunkSources(mapData: NonNullable<ReturnType<typeof loadSinistraMapData>>): string[] {
  const monoDir = path.join(
    DATA_MINE_ROOT,
    'Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip',
    'base_assets',
    'formatted',
    'MonoBehaviour',
  )
  return discoverChunkMapFiles(monoDir).map((filePath) => path.basename(filePath))
}

export function loadSinistraDebugReport(): SinistraDebugReport {
  const cellSize = readSplitMapCellSize()
  const mapData = loadSinistraMapData()
  const chunkSources = mapData ? inferChunkSources(mapData) : []
  const monoDir =
    chunkSources.length > 0
      ? path.join(
          DATA_MINE_ROOT,
          'Game of Vampires_ Twilight Sun_1.048.007_APKPure.zip',
          'base_assets',
          'formatted',
          'MonoBehaviour',
        )
      : null
  const terrainNames = discoverAllChunkTerrainNames(monoDir)
  const missingBake = terrainNames.filter((name) => !getBakedTerrainPrefab(name))
  const bakedSamples: SinistraBakedSample[] = []

  for (const name of terrainNames) {
    if (bakedSamples.length >= 8) {
      break
    }
    const baked = getBakedTerrainPrefab(name)
    if (!baked) {
      continue
    }
    const absolute = resolveWorkspacePath(baked.imagePath)
    bakedSamples.push({
      name,
      imagePath: baked.imagePath,
      fileExists: fs.existsSync(absolute),
      width: baked.width,
      height: baked.height,
      originOffsetX: baked.originOffsetX,
      originOffsetY: baked.originOffsetY,
      pixelWidth: baked.pixelWidth ?? null,
      pixelHeight: baked.pixelHeight ?? null,
    })
  }

  const overviewPath = mapData?.overview.path ?? null
  const overviewAbsolute = overviewPath ? resolveWorkspacePath(overviewPath) : null

  const assetProbes: SinistraAssetProbe[] = []
  if (overviewPath) {
    assetProbes.push(probeFile('Overview PNG', overviewPath))
  }
  for (const sample of bakedSamples.slice(0, 4)) {
    assetProbes.push(probeFile(`Baked: ${sample.name}`, sample.imagePath))
  }

  const pipelineNotes = [
    'Structures (mansions, forts, coalition starts, etc.) come from clientMapData JSON coordinates.',
    'Terrain placement anchors come from terrains[].position in all SLGMapChuck*.json chunk files (merged).',
    'Chunk ground renders Y-down; baked prefabs render inside a vertical mirror (translate(0,minY+maxY) scale(1,-1)).',
    'Tune alignment live on /sinistra via Terrain Align panel — offsets are client-side (localStorage), not server cache.',
    'If tiles are missing, the terrain name has no baked PNG in terrains bundles — see missing bake list.',
  ]

  const beaconPlanningNotes = [
    'This map shows fixed Sinistra structures (coalition starts, mansions, forts, bridges, citadel).',
    'Coven fortress + beacon placement uses the same SLG world grid: cellSize from SLGSplitMapPrefab.json.',
    'Each coven places one coven fortress first; beacons chain off same-coalition structures/beacons only.',
    'Multiple covens can share a zone — use coalition starts + forts/mansions as anchor points for chains.',
    'Exported APK does not include a separate beacon placement table in MonoBehaviour JSON (search found SLGSplitMapPrefab only).',
    'Use the 40×40 world-unit placement grid overlay on the map to align planned beacon steps with in-game snapping.',
  ]

  return {
    generatedAt: new Date().toISOString(),
    mapAvailable: mapData !== null,
    mapVariant: mapData ? getPrefabManifestInfo().chunkSource.replace('SLGMapChuck', 'clientMapData').replace('.json', '') : null,
    chunkFile: chunkSources.length > 0 ? chunkSources.join(' + ') : null,
    worldBounds: mapData?.worldBounds ?? null,
    grid: {
      cellSize,
      chunkTiles: SLG_MAP_CHUNK_SIZE,
      chunkWorldUnits: SLG_MAP_CHUNK_SIZE * cellSize,
      source: 'SLGSplitMapPrefab.json + SLGMapChuck chunk layout',
    },
    terrain: {
      pipeline: 'baked-prefab-png + chunk-ground (SVG layers, mirrored prefabs)',
      useBakedPrefabs: hasBakedPrefabs(),
      prefabManifestBakedCount: getPrefabManifestInfo().bakedCount,
      placementCount: mapData?.terrainPlacements.length ?? 0,
      bakedPlacementCount: mapData?.terrainSummary?.bakedPrefabCount ?? 0,
      uniqueTerrainInChunk: terrainNames.length,
      missingBakeCount: missingBake.length,
      missingBakeSample: missingBake.slice(0, 40),
      bakedSamples,
      alignment: {
        chunkGroundYNudgeCells: SLG_CHUNK_GROUND_Y_NUDGE / SLG_MAP_CELL_SIZE,
        chunkGroundXNudgeCells: SLG_DEFAULT_CHUNK_GROUND_X_NUDGE / SLG_MAP_CELL_SIZE,
        prefabYNudgeCells: SLG_DEFAULT_PREFAB_Y_NUDGE / SLG_MAP_CELL_SIZE,
        prefabXNudgeCells: SLG_DEFAULT_PREFAB_X_NUDGE / SLG_MAP_CELL_SIZE,
        mirrorAxisY: mapData ? mapData.worldBounds.minY + mapData.worldBounds.maxY : null,
        note:
          'Prefabs anchor at terrains[].position from SLGMapChuck*.json; PNG draw corner = anchor minus baked originOffset. Yellow + in Terrain Align shows the JSON anchor. Tune prefabCellsX negative if prefabs sit right of chunk ground.',
      },
    },
    overview: {
      path: overviewPath,
      fileExists: overviewAbsolute ? fs.existsSync(overviewAbsolute) : false,
      sizeBytes:
        overviewAbsolute && fs.existsSync(overviewAbsolute) ? fs.statSync(overviewAbsolute).size : null,
    },
    assetProbes,
    pipelineNotes,
    beaconPlanningNotes,
  }
}
