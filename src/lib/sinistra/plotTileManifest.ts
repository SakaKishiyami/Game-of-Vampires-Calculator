import manifest from '@/data/sinistraPlotTileManifest.json'

export type PlotTileEntry = {
  tileKey: string
  label: string
  sourceSprite: string
  imagePath: string
  cellWorldSize: number
  pixelWidth: number
  pixelHeight: number
  pixelsPerUnit: number
}

type PlotTileManifestFile = {
  cellWorldSize: number
  pixelsPerUnit: number
  bakedCount: number
  tiles: Record<string, PlotTileEntry>
}

const file = manifest as PlotTileManifestFile

export function hasPlotTiles(): boolean {
  return file.bakedCount > 0
}

export function listPlotTileKeys(): string[] {
  return Object.keys(file.tiles).sort()
}

export function getPlotTile(tileKey: string): PlotTileEntry | null {
  return file.tiles[tileKey] ?? null
}

export function getPlotTileManifestInfo() {
  return {
    bakedCount: file.bakedCount,
    cellWorldSize: file.cellWorldSize,
    pixelsPerUnit: file.pixelsPerUnit,
  }
}
