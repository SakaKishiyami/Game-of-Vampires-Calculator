import manifest from '@/data/sinistraChunkGroundManifest.json'

export type ChunkGroundEntry = {
  chunkKey: string
  imagePath: string
  worldX: number
  worldY: number
  worldWidth: number
  worldHeight: number
  tileCount: number
  pixelWidth: number
  pixelHeight: number
}

type ChunkGroundManifestFile = {
  bakedCount: number
  pixelsPerUnit: number
  chunks: Record<string, ChunkGroundEntry>
}

const file = manifest as ChunkGroundManifestFile

export function hasChunkGroundBakes(): boolean {
  return file.bakedCount > 0
}

export function getChunkGroundManifestInfo() {
  return {
    bakedCount: file.bakedCount,
    pixelsPerUnit: file.pixelsPerUnit,
  }
}

export function listChunkGroundEntries(): ChunkGroundEntry[] {
  return Object.values(file.chunks)
}

export function getChunkGroundByKey(chunkKey: string): ChunkGroundEntry | null {
  return file.chunks[chunkKey] ?? null
}

function formatChunkCoord(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  if (Math.abs(rounded - Math.round(rounded)) < 1e-6) {
    return String(Math.round(rounded))
  }
  return String(rounded)
}

/** Matches Unity groundtiles prefab names like `-15_90_100_100`. */
export function chunkGroundKey(position: { x: number; y: number }, size = 100): string {
  return `${formatChunkCoord(position.x)}_${formatChunkCoord(position.y)}_${size}_${size}`
}
