import type { SinistraStructureKind } from '@/lib/sinistra/types'

export type MapUiPreferences = {
  mapMode: 'explore' | 'plan'
  showGameArt: boolean
  showChunkTerrain: boolean
  showRegions: boolean
  showRegionLabels: boolean
  showTerrainGrid: boolean
  showAlignClickMarker: boolean
  showTerrainAlignDebug: boolean
  showPlannerGrid: boolean
  terrainAlignPanelOpen: boolean
  visibleKinds: Record<SinistraStructureKind, boolean>
}

const STORAGE_KEY = 'sinistra-map-ui-preferences-v1'

const STRUCTURE_KINDS: SinistraStructureKind[] = [
  'coalitionHome',
  'mansion',
  'fort',
  'bridge',
  'sanctum',
  'turret',
  'citadel',
  'tree',
]

export function defaultMapUiPreferences(): MapUiPreferences {
  return {
    mapMode: 'explore',
    showGameArt: true,
    showChunkTerrain: true,
    showRegions: false,
    showRegionLabels: false,
    showTerrainGrid: true,
    showAlignClickMarker: true,
    showTerrainAlignDebug: false,
    showPlannerGrid: true,
    terrainAlignPanelOpen: true,
    visibleKinds: {
      coalitionHome: true,
      mansion: true,
      fort: true,
      bridge: true,
      sanctum: true,
      turret: true,
      citadel: true,
      tree: false,
    },
  }
}

function parseVisibleKinds(raw: unknown): Record<SinistraStructureKind, boolean> {
  const defaults = defaultMapUiPreferences().visibleKinds
  if (!raw || typeof raw !== 'object') {
    return defaults
  }

  const parsed = raw as Partial<Record<SinistraStructureKind, boolean>>
  const next = { ...defaults }
  for (const kind of STRUCTURE_KINDS) {
    if (typeof parsed[kind] === 'boolean') {
      next[kind] = parsed[kind]
    }
  }
  return next
}

export function loadMapUiPreferences(): MapUiPreferences {
  const defaults = defaultMapUiPreferences()
  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaults
    }

    const parsed = JSON.parse(raw) as Partial<MapUiPreferences>
    return {
      mapMode: parsed.mapMode === 'plan' ? 'plan' : 'explore',
      showGameArt: typeof parsed.showGameArt === 'boolean' ? parsed.showGameArt : defaults.showGameArt,
      showChunkTerrain:
        typeof parsed.showChunkTerrain === 'boolean' ? parsed.showChunkTerrain : defaults.showChunkTerrain,
      showRegions: typeof parsed.showRegions === 'boolean' ? parsed.showRegions : defaults.showRegions,
      showRegionLabels:
        typeof parsed.showRegionLabels === 'boolean' ? parsed.showRegionLabels : defaults.showRegionLabels,
      showTerrainGrid:
        typeof parsed.showTerrainGrid === 'boolean' ? parsed.showTerrainGrid : defaults.showTerrainGrid,
      showAlignClickMarker:
        typeof parsed.showAlignClickMarker === 'boolean'
          ? parsed.showAlignClickMarker
          : defaults.showAlignClickMarker,
      showTerrainAlignDebug:
        typeof parsed.showTerrainAlignDebug === 'boolean'
          ? parsed.showTerrainAlignDebug
          : defaults.showTerrainAlignDebug,
      showPlannerGrid:
        typeof parsed.showPlannerGrid === 'boolean' ? parsed.showPlannerGrid : defaults.showPlannerGrid,
      terrainAlignPanelOpen:
        typeof parsed.terrainAlignPanelOpen === 'boolean'
          ? parsed.terrainAlignPanelOpen
          : defaults.terrainAlignPanelOpen,
      visibleKinds: parseVisibleKinds(parsed.visibleKinds),
    }
  } catch {
    return defaults
  }
}

export function saveMapUiPreferences(prefs: MapUiPreferences): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}
