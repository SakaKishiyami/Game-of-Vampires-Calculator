/** How terrain prefabs are drawn. Default `individual` preserves the original per-prefab pipeline. */

import { hasBakedPrefabs } from '@/lib/sinistra/prefabManifest'
import {
  hasChunkCompositeBakes,
  hasFullCompositeBake,
  hasSpriteManifest,
} from '@/lib/sinistra/terrainCompositeManifest'

export type TerrainRenderMode =
  | 'individual'
  | 'chunkComposite'
  | 'fullComposite'
  | 'spriteManifest'

export type TerrainRenderModeInfo = {
  label: string
  shortLabel: string
  description: string
  efficiency: 'fast' | 'medium' | 'slow' | 'heaviest'
  fidelity: 'editable' | 'good' | 'best'
  /** npm script to generate bake data for this mode (null = no extra bake). */
  bakeCommand: string | null
}

export const TERRAIN_RENDER_MODES: TerrainRenderMode[] = [
  'individual',
  'chunkComposite',
  'fullComposite',
  'spriteManifest',
]

export const TERRAIN_RENDER_MODE_INFO: Record<TerrainRenderMode, TerrainRenderModeInfo> = {
  individual: {
    label: 'Per-prefab (current)',
    shortLabel: 'Per-prefab',
    description:
      'One baked PNG per terrain prefab. Editable in Terrain Align. This is the original setup — always available.',
    efficiency: 'fast',
    fidelity: 'editable',
    bakeCommand: 'npm run bake:sinistra-terrain',
  },
  chunkComposite: {
    label: 'Chunk composite',
    shortLabel: 'Chunk composite',
    description:
      'One PNG per 100×100 map chunk with Unity-accurate sprite sort order within the chunk. Not editable.',
    efficiency: 'medium',
    fidelity: 'good',
    bakeCommand: 'npm run bake:sinistra-composite -- --modes chunk',
  },
  fullComposite: {
    label: 'Full map composite',
    shortLabel: 'Full composite',
    description: 'Single PNG for the entire map. Best overlap fidelity; large file; not editable.',
    efficiency: 'slow',
    fidelity: 'best',
    bakeCommand: 'npm run bake:sinistra-composite -- --modes full',
  },
  spriteManifest: {
    label: 'Sprite manifest',
    shortLabel: 'Sprite manifest',
    description:
      'Sorted per-sprite draw list rendered at runtime. Most accurate interleaving; heaviest in browser.',
    efficiency: 'heaviest',
    fidelity: 'best',
    bakeCommand: 'npm run bake:sinistra-composite -- --modes manifest',
  },
}

const STORAGE_KEY = 'sinistra-terrain-render-mode-v1'

export function defaultTerrainRenderMode(): TerrainRenderMode {
  return 'individual'
}

export function loadTerrainRenderMode(): TerrainRenderMode {
  if (typeof window === 'undefined') {
    return defaultTerrainRenderMode()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw && TERRAIN_RENDER_MODES.includes(raw as TerrainRenderMode)) {
      return raw as TerrainRenderMode
    }
  } catch {
    // ignore
  }

  return defaultTerrainRenderMode()
}

export function saveTerrainRenderMode(mode: TerrainRenderMode): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function isTerrainRenderModeReady(mode: TerrainRenderMode): boolean {
  switch (mode) {
    case 'individual':
      return hasBakedPrefabs('full') || hasBakedPrefabs('edges')
    case 'chunkComposite':
      return hasChunkCompositeBakes()
    case 'fullComposite':
      return hasFullCompositeBake()
    case 'spriteManifest':
      return hasSpriteManifest()
    default:
      return false
  }
}

export function terrainRenderModeStatusLabel(mode: TerrainRenderMode): string {
  if (isTerrainRenderModeReady(mode)) {
    return 'Ready'
  }
  if (mode === 'individual') {
    return 'Needs prefab bake'
  }
  return 'Needs composite bake'
}
