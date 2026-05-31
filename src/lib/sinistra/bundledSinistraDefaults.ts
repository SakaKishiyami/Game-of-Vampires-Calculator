import bundledJson from '@/data/sinistraAlignmentDefaults.json'
import {
  importOverrideBackupJson,
  normalizePrefabOverrideDocument,
  type PrefabOverrideDocument,
} from '@/lib/sinistra/prefabPlacementOverrides'
import {
  defaultTerrainAlignmentOffsets,
  type TerrainAlignmentOffsets,
} from '@/lib/sinistra/terrainAlignment'

/** Bump when replacing src/data/sinistraAlignmentDefaults.json — resets client overrides once. */
export const BUNDLED_SINISTRA_DEFAULTS_VERSION = '2026-05-31-04-35-02'

export const BUNDLED_DEFAULTS_VERSION_KEY = 'sinistra-bundled-defaults-version'

type BundledSinistraDefaults = {
  doc: PrefabOverrideDocument
  terrainAlignment: TerrainAlignmentOffsets
}

let cached: BundledSinistraDefaults | null = null

function loadBundledSinistraDefaults(): BundledSinistraDefaults {
  if (cached) {
    return cached
  }

  const parsed = importOverrideBackupJson(JSON.stringify(bundledJson))
  if (!parsed.ok) {
    throw new Error(`Bundled Sinistra defaults invalid: ${parsed.error}`)
  }

  const defaults = defaultTerrainAlignmentOffsets()
  const layer = parsed.data.layerAlignment

  cached = {
    doc: parsed.data.doc,
    terrainAlignment: {
      chunkGroundCells: layer?.chunkGroundCells ?? defaults.chunkGroundCells,
      chunkGroundCellsX: layer?.chunkGroundCellsX ?? defaults.chunkGroundCellsX,
      prefabCells: layer?.prefabCells ?? defaults.prefabCells,
      prefabCellsX: layer?.prefabCellsX ?? defaults.prefabCellsX,
      prefabScaleY: layer?.prefabScaleY ?? defaults.prefabScaleY,
    },
  }

  return cached
}

export function getBundledPrefabOverrideDocument(): PrefabOverrideDocument {
  return normalizePrefabOverrideDocument(loadBundledSinistraDefaults().doc)
}

export function getBundledTerrainAlignmentOffsets(): TerrainAlignmentOffsets {
  return loadBundledSinistraDefaults().terrainAlignment
}

export function bundledDefaultsNeedRefresh(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(BUNDLED_DEFAULTS_VERSION_KEY) !== BUNDLED_SINISTRA_DEFAULTS_VERSION
  } catch {
    return true
  }
}

const PREFAB_OVERRIDE_STORAGE_KEY = 'sinistra-prefab-overrides-v1'
const TERRAIN_ALIGNMENT_STORAGE_KEY = 'sinistra-terrain-alignment-v2'

let bundledDefaultsApplied = false

function applyBundledSinistraDefaultsToStorage(): BundledSinistraDefaults {
  const bundled = loadBundledSinistraDefaults()
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PREFAB_OVERRIDE_STORAGE_KEY, JSON.stringify(bundled.doc))
    window.localStorage.setItem(TERRAIN_ALIGNMENT_STORAGE_KEY, JSON.stringify(bundled.terrainAlignment))
    window.localStorage.setItem(BUNDLED_DEFAULTS_VERSION_KEY, BUNDLED_SINISTRA_DEFAULTS_VERSION)
  }
  bundledDefaultsApplied = true
  return bundled
}

export function ensureBundledSinistraDefaults(): void {
  if (typeof window === 'undefined' || bundledDefaultsApplied) {
    return
  }
  if (bundledDefaultsNeedRefresh()) {
    applyBundledSinistraDefaultsToStorage()
  }
}
