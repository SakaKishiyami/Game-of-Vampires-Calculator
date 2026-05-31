import fullManifest from '@/data/sinistraPrefabManifest.json'
import edgesManifest from '@/data/sinistraPrefabManifestEdges.json'

export type PrefabBakeVariant = 'full' | 'edges'

export type BakedTerrainPrefab = {
  prefabName: string
  imagePath: string
  width: number
  height: number
  originOffsetX: number
  originOffsetY: number
  pixelWidth: number
  pixelHeight: number
  /** Present after rebake with fixed script; ~100. Stale bakes were ~4. */
  pixelsPerUnit?: number
  spriteCount: number
  bakeProfile?: PrefabBakeVariant
  sourceSpriteCount?: number
}

type PrefabManifestFile = {
  profile?: PrefabBakeVariant
  description?: string
  chunkSource: string
  bakedCount: number
  prefabs: Record<string, BakedTerrainPrefab>
}

const MANIFESTS: Record<PrefabBakeVariant, PrefabManifestFile> = {
  full: fullManifest as PrefabManifestFile,
  edges: edgesManifest as PrefabManifestFile,
}

export function getPrefabManifest(variant: PrefabBakeVariant = 'full'): PrefabManifestFile {
  return MANIFESTS[variant]
}

export function listBakedPrefabNames(variant: PrefabBakeVariant = 'full'): string[] {
  return Object.keys(MANIFESTS[variant].prefabs).sort()
}

export function getVariantBakedTerrainPrefab(
  terrainName: string,
  variant: PrefabBakeVariant,
): BakedTerrainPrefab | null {
  return MANIFESTS[variant].prefabs[terrainName] ?? null
}

export function getBakedTerrainPrefab(
  terrainName: string,
  variant: PrefabBakeVariant = 'full',
): BakedTerrainPrefab | null {
  const primary = MANIFESTS[variant].prefabs[terrainName] ?? null
  if (primary) {
    return primary
  }
  if (variant !== 'full') {
    return MANIFESTS.full.prefabs[terrainName] ?? null
  }
  return null
}

export function hasBakedPrefabs(variant: PrefabBakeVariant = 'full'): boolean {
  return MANIFESTS[variant].bakedCount > 0
}

export function getPrefabManifestInfo(variant: PrefabBakeVariant = 'full') {
  const file = MANIFESTS[variant]
  return {
    profile: file.profile ?? variant,
    chunkSource: file.chunkSource,
    bakedCount: file.bakedCount,
  }
}
