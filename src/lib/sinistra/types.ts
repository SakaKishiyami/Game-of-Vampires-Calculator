export type SinistraStructureKind =
  | 'coalitionHome'
  | 'mansion'
  | 'fort'
  | 'bridge'
  | 'sanctum'
  | 'turret'
  | 'citadel'
  | 'tree'

export type SinistraAreaBoundary = {
  id: number
  x: number
  y: number
  w: number
  h: number
}

export type SinistraStructure = {
  id: string
  numericId: number
  kind: SinistraStructureKind
  title: string
  shortLabel: string
  x: number
  y: number
  regionId: number
  level: number
  rawType: number
  detail: string | null
  bridgeRegions?: [number, number]
}

export type SinistraArea = {
  id: number
  label: string
  fill: string
  stroke: string
  center: {
    x: number
    y: number
  }
  rects: SinistraAreaBoundary[]
  isConfederation: boolean
  pveRange: [number, number]
  gveRange: [number, number]
  resourceRange: [number, number]
}

export type SinistraTerrainSummary = {
  placementCount: number
  bakedPrefabCount: number
  chunkGroundCount: number
}

type SinistraTerrainPlacementBase = {
  x: number
  y: number
  name: string
}

export type SinistraTerrainPlacement =
  | (SinistraTerrainPlacementBase & {
      mode: 'chunkGround'
      imagePath: string
      width: number
      height: number
    })
  | (SinistraTerrainPlacementBase & {
      mode: 'baked'
      imagePath: string
      width: number
      height: number
      /** Raw terrains[].position from SLGMapChuck*.json (Unity anchor). */
      anchorX: number
      anchorY: number
      originOffsetX: number
      originOffsetY: number
      displayWidth: number
      displayHeight: number
    })
  | (SinistraTerrainPlacementBase & {
      mode: 'fill'
      width: number
      height: number
      fill: string
      kind: 'chunk' | 'cell'
    })

export type SinistraOverviewAsset = {
  path: string
  imageWidth: number
  imageHeight: number
  worldX: number
  worldY: number
  worldWidth: number
  worldHeight: number
}

export type SinistraWorldBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type SinistraMapData = {
  worldSize: number
  worldBounds: SinistraWorldBounds
  areas: SinistraArea[]
  structures: SinistraStructure[]
  counts: Record<SinistraStructureKind, number>
  terrainSummary: SinistraTerrainSummary | null
  terrainPlacements: SinistraTerrainPlacement[]
  overview: SinistraOverviewAsset
}
