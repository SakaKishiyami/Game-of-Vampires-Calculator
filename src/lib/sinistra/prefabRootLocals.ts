import rootLocals from '@/data/sinistraPrefabRootLocals.json'

type PrefabRootLocalsFile = {
  prefabs: Record<string, { rootLocalX: number; rootLocalY: number }>
}

const file = rootLocals as PrefabRootLocalsFile

export function getPrefabRootLocal(terrainName: string): { x: number; y: number } {
  const entry = file.prefabs[terrainName]
  return {
    x: entry?.rootLocalX ?? 0,
    y: entry?.rootLocalY ?? 0,
  }
}
