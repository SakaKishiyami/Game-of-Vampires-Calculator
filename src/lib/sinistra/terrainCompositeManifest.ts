import chunkCompositeFile from '@/data/sinistraChunkCompositeManifest.json'
import fullCompositeFile from '@/data/sinistraFullCompositeManifest.json'
import spriteManifestFile from '@/data/sinistraSpriteManifest.json'

export type ChunkCompositeEntry = {
  chunkKey: string
  imagePath: string
  worldX: number
  worldY: number
  worldWidth: number
  worldHeight: number
  spriteCount: number
  pixelWidth: number
  pixelHeight: number
}

export type SpriteManifestEntry = {
  name: string
  prefabName: string
  anchorX: number
  anchorY: number
  wx: number
  wy: number
  w: number
  h: number
  tileW: number
  tileH: number
  drawMode: number
  sortLayer: number
  sortOrder: number
  imagePath: string
}

type ChunkCompositeManifestFile = {
  bakedCount: number
  pixelsPerUnit: number
  profile: string
  chunks: Record<string, ChunkCompositeEntry>
}

type FullCompositeManifestFile = {
  baked: boolean
  pixelsPerUnit: number
  profile: string
  worldX: number
  worldY: number
  worldWidth: number
  worldHeight: number
  imagePath: string
  pixelWidth: number
  pixelHeight: number
  spriteCount: number
}

type SpriteManifestFile = {
  spriteCount: number
  pixelsPerUnit: number
  profile: string
  sprites: SpriteManifestEntry[]
}

const chunkComposite = chunkCompositeFile as ChunkCompositeManifestFile
const fullComposite = fullCompositeFile as FullCompositeManifestFile
const spriteManifest = spriteManifestFile as SpriteManifestFile

export function hasChunkCompositeBakes(): boolean {
  return chunkComposite.bakedCount > 0
}

export function listChunkCompositeEntries(): ChunkCompositeEntry[] {
  return Object.values(chunkComposite.chunks)
}

export function hasFullCompositeBake(): boolean {
  return fullComposite.baked && Boolean(fullComposite.imagePath)
}

export function getFullCompositeEntry(): FullCompositeManifestFile | null {
  return hasFullCompositeBake() ? fullComposite : null
}

export function hasSpriteManifest(): boolean {
  return spriteManifest.spriteCount > 0 && spriteManifest.sprites.length > 0
}

export function listSpriteManifestEntries(): SpriteManifestEntry[] {
  return spriteManifest.sprites
}

export function getCompositeManifestInfo() {
  return {
    chunkCompositeCount: chunkComposite.bakedCount,
    fullCompositeBaked: hasFullCompositeBake(),
    spriteManifestCount: spriteManifest.spriteCount,
  }
}
