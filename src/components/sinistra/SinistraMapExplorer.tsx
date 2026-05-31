"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  flipSlgRectY,
  flipSlgY,
  SLG_MAP_CELL_SIZE,
  SLG_MAP_VIEW_PADDING,
  SLG_CHUNK_GROUND_CELL_SIZE,
  SLG_CHUNK_GROUND_Y_NUDGE,
  slgPrefabLayerTransform,
} from '@/lib/sinistra/constants'
import {
  effectiveDrawPosition,
  effectiveBakedRender,
  flipAllPrefabBakeVariants,
  getPrefabOverride,
  loadPrefabOverrideDocument,
  mergeBakedPlacements,
  emptyPrefabOverrideDocument,
  prefabInstanceKey,
  prefabRenderZOrder,
  buildPrefabDrawTransform,
  resolvePrefabRotation,
  savePrefabOverrideDocument,
  addManualPrefab,
  addManualGroundTile,
  groundTileDrawPosition,
  updateManualGroundTile,
  type ManualGroundTileInstance,
  type PrefabOverrideDocument,
} from '@/lib/sinistra/prefabPlacementOverrides'
import { listBakedPrefabNames, hasBakedPrefabs, type PrefabBakeVariant } from '@/lib/sinistra/prefabManifest'
import {
  TerrainPrefabEditorPanel,
  type PrefabEditTool,
} from '@/components/sinistra/TerrainPrefabEditorPanel'
import {
  bakedPrefabAnchorScreen,
  bakedPrefabScreenBounds,
  cellsToWorld,
  clampAlignmentCells,
  clampAlignmentScaleY,
  chunkGroundScreenBounds,
  chunkGroundScreenY,
  defaultTerrainAlignmentOffsets,
  formatAlignmentConstantsSnippet,
  loadTerrainAlignmentOffsets,
  parseAlignmentCellInput,
  probeTerrainAlignment,
  saveTerrainAlignmentOffsets,
  TERRAIN_ALIGN_CELL_MAX,
  TERRAIN_ALIGN_CELL_MIN,
  TERRAIN_ALIGN_CELL_STEP,
  TERRAIN_ALIGN_SCALE_Y_MAX,
  TERRAIN_ALIGN_SCALE_Y_MIN,
  TERRAIN_ALIGN_SCALE_Y_STEP,
  type TerrainAlignmentOffsets,
  type TerrainAlignmentProbe,
} from '@/lib/sinistra/terrainAlignment'
import {
  COALITION_COLORS,
  createPlannerMarker,
  linkTargetKey,
  loadPlannerState,
  resolveLinkTargetPosition,
  savePlannerState,
  snapPlannerPoint,
  type PlannerLinkTarget,
  type PlannerMarker,
  type PlannerTool,
} from '@/lib/sinistra/planner'
import {
  buildRawAssetUrl,
  lodMaxPx,
  shouldShowBakedPrefabs,
  shouldShowChunkGroundLayer,
  shouldShowOverviewLayer,
} from '@/lib/sinistra/mapAssetUrl'
import { loadMapUiPreferences, saveMapUiPreferences } from '@/lib/sinistra/mapUiPreferences'
import {
  defaultTerrainRenderMode,
  loadTerrainRenderMode,
  saveTerrainRenderMode,
  TERRAIN_RENDER_MODE_INFO,
  TERRAIN_RENDER_MODES,
  type TerrainRenderMode,
} from '@/lib/sinistra/terrainRenderMode'
import {
  getFullCompositeEntry,
  hasChunkCompositeBakes,
  hasFullCompositeBake,
  hasSpriteManifest,
  listChunkCompositeEntries,
  listSpriteManifestEntries,
  type ChunkCompositeEntry,
  type SpriteManifestEntry,
} from '@/lib/sinistra/terrainCompositeManifest'
import { useMapEditorHistory } from '@/lib/sinistra/mapEditorHistory'
import { getPlotTile, hasPlotTiles, listPlotTileKeys } from '@/lib/sinistra/plotTileManifest'
import { chunkGroundStorageCellFromScreen } from '@/lib/sinistra/terrainPlacement'
import type {
  SinistraMapData,
  SinistraStructure,
  SinistraStructureKind,
  SinistraTerrainPlacement,
} from '@/lib/sinistra/types'

import chunkGroundManifest from '@/data/sinistraChunkGroundManifest.json'
import prefabManifest from '@/data/sinistraPrefabManifest.json'
import prefabEdgesManifest from '@/data/sinistraPrefabManifestEdges.json'

const PREFAB_VARIANT_STORAGE_KEY = 'sinistra-prefab-bake-variant'

function terrainPrefabAssetVersion(globalDefault: PrefabBakeVariant): string {
  return `def-${globalDefault}-full-${prefabManifest.bakedCount}-edges-${prefabEdgesManifest.bakedCount}-${prefabManifest.pixelsPerUnit ?? 100}-cg${SLG_CHUNK_GROUND_Y_NUDGE}-layer-${chunkGroundManifest.bakedCount}`
}

type ViewBoxState = {
  x: number
  y: number
  size: number
}

type CameraState = {
  /** 1 = full map fit; larger = zoomed in */
  scale: number
  panX: number
  panY: number
}

type DragState = {
  startX: number
  startY: number
  origin: CameraState
}

type PendingMapClick = {
  startX: number
  startY: number
  moved: boolean
}

const CLICK_DRAG_THRESHOLD_PX = 8
const ALIGN_CLICK_DRAG_THRESHOLD_PX = 22

const MIN_CAMERA_SCALE = 0.4
const MAX_CAMERA_SCALE = 22
const MAP_VIEW_PADDING = SLG_MAP_VIEW_PADDING

const KIND_LABELS: Record<SinistraStructureKind, string> = {
  coalitionHome: 'Coalition Starts (Z1)',
  mansion: 'Mansions',
  fort: 'Forts',
  bridge: 'Bridges',
  sanctum: 'UR Sanctums (Z3)',
  turret: 'Citadel Turrets',
  citadel: 'Citadel',
  tree: 'Trees / Gathering',
}

const KIND_STYLES: Record<
  SinistraStructureKind,
  {
    fill: string
    stroke: string
    markerSize: number
  }
> = {
  coalitionHome: { fill: '#8b5cf6', stroke: '#ddd6fe', markerSize: 26 },
  mansion: { fill: '#a16207', stroke: '#fde68a', markerSize: 14 },
  fort: { fill: '#ef4444', stroke: '#fecaca', markerSize: 22 },
  bridge: { fill: '#38bdf8', stroke: '#bae6fd', markerSize: 18 },
  sanctum: { fill: '#22c55e', stroke: '#bbf7d0', markerSize: 20 },
  turret: { fill: '#e879f9', stroke: '#f5d0fe', markerSize: 16 },
  citadel: { fill: '#facc15', stroke: '#fef08a', markerSize: 30 },
  tree: { fill: '#4d7c0f', stroke: '#bef264', markerSize: 6 },
}

function buildBaseViewBox(bounds: SinistraMapData['worldBounds']): ViewBoxState {
  const minX = Number(bounds.minX)
  const minY = Number(bounds.minY)
  const maxX = Number(bounds.maxX)
  const maxY = Number(bounds.maxY)

  const width = maxX - minX
  const height = maxY - minY
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    const span = 1200
    return { x: 0, y: 0, size: span }
  }

  const span = Math.max(width, height, 400) + MAP_VIEW_PADDING * 2
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return {
    x: centerX - span / 2,
    y: centerY - span / 2,
    size: span,
  }
}

function cameraToViewBox(base: ViewBoxState, camera: CameraState): ViewBoxState {
  const scale = Number.isFinite(camera.scale) && camera.scale > 0 ? camera.scale : 1
  const size = base.size / scale
  const panX = Number.isFinite(camera.panX) ? camera.panX : 0
  const panY = Number.isFinite(camera.panY) ? camera.panY : 0

  return {
    size,
    x: base.x + (base.size - size) / 2 + panX,
    y: base.y + (base.size - size) / 2 + panY,
  }
}

function viewBoxAttribute(view: ViewBoxState): string {
  return `${view.x} ${view.y} ${view.size} ${view.size}`
}

function quantizeViewBox(view: ViewBoxState, step: number): ViewBoxState {
  return {
    x: Math.floor(view.x / step) * step,
    y: Math.floor(view.y / step) * step,
    size: Math.ceil(view.size / step) * step,
  }
}

function clampCamera(camera: CameraState): CameraState {
  return {
    panX: camera.panX,
    panY: camera.panY,
    scale: Math.min(MAX_CAMERA_SCALE, Math.max(MIN_CAMERA_SCALE, camera.scale)),
  }
}

function readInitialMapUi() {
  return loadMapUiPreferences()
}

function shouldRenderStructure(structure: SinistraStructure, viewSize: number): boolean {
  if (structure.kind === 'citadel' || structure.kind === 'coalitionHome') {
    return true
  }

  if (structure.kind === 'tree') {
    return viewSize < 950
  }

  if (structure.kind === 'mansion' && viewSize > 1500) {
    return false
  }

  if (viewSize > 1700 && structure.kind === 'turret') {
    return false
  }

  if (viewSize > 2100 && (structure.kind === 'bridge' || structure.kind === 'sanctum')) {
    return false
  }

  return true
}

/** Trailing slash required — Next.js redirects without it and SVG <image> won't follow 308s. */
function terrainPrefabUrl(imagePath: string, maxPx: number, assetVersion: string): string {
  return buildRawAssetUrl(imagePath, {
    maxPx,
    version: assetVersion,
  })
}

const TERRAIN_CULL_QUANTIZE_DIVISOR = 16
const TERRAIN_CULL_PADDING_MIN = 640
const TERRAIN_CULL_PADDING_RATIO = 0.85
const TERRAIN_LOD_SETTLE_MS = 450

function terrainDrawPriority(placement: SinistraTerrainPlacement): number {
  if (placement.mode === 'chunkGround') {
    return 8
  }

  if (placement.mode === 'fill') {
    return placement.kind === 'chunk' ? 0 : 5
  }

  const lowered = placement.name.toLowerCase()
  if (lowered.includes('bridge')) {
    return 40
  }
  if (lowered.includes('centralcastle') || lowered.includes('castle')) {
    return 35
  }
  return 25
}

function placementDrawArea(placement: SinistraTerrainPlacement): number {
  if (placement.mode === 'fill' || placement.mode === 'chunkGround') {
    return placement.width * placement.height
  }
  return placement.displayWidth * placement.displayHeight
}

function sortTerrainForDraw(
  placements: SinistraTerrainPlacement[],
  overrideDoc: PrefabOverrideDocument,
): SinistraTerrainPlacement[] {
  return placements
    .map((placement, index) => ({ placement, index }))
    .sort((left, right) => {
      if (left.placement.mode === 'baked' && right.placement.mode === 'baked') {
        const zDelta =
          prefabRenderZOrder(overrideDoc, left.placement) -
          prefabRenderZOrder(overrideDoc, right.placement)
        if (zDelta !== 0) {
          return zDelta
        }
        // Same z: keep chunk-file order so overlapping edge pieces interleave like in-game.
        return left.index - right.index
      }

      const priorityDelta = terrainDrawPriority(left.placement) - terrainDrawPriority(right.placement)
      if (priorityDelta !== 0) {
        return priorityDelta
      }

      return placementDrawArea(left.placement) - placementDrawArea(right.placement)
    })
    .map(({ placement }) => placement)
}

function renderTerrainFill(
  placement: Extract<SinistraTerrainPlacement, { mode: 'fill' }>,
  index: number,
) {
  return (
    <rect
      key={`fill-${placement.name}-${placement.x}-${placement.y}-${index}`}
      x={placement.x}
      y={placement.y}
      width={placement.width}
      height={placement.height}
      fill={placement.fill}
      stroke="rgba(255,255,255,0.04)"
      strokeWidth={1}
    />
  )
}

function renderManualGroundTile(
  tile: ManualGroundTileInstance,
  maxPx: number,
  chunkGroundNudgeWorldX: number,
  chunkGroundNudgeWorldY: number,
  overrideDoc: PrefabOverrideDocument,
  selectedGroundTileIds: string[],
) {
  const entry = getPlotTile(tile.tileKey)
  if (!entry) {
    return null
  }

  const cellSize = entry.cellWorldSize || SLG_CHUNK_GROUND_CELL_SIZE
  const draw = groundTileDrawPosition(tile, chunkGroundNudgeWorldX, chunkGroundNudgeWorldY, overrideDoc)
  const x = draw.x
  const y = draw.y
  const size = draw.size
  const href = buildRawAssetUrl(entry.imagePath, { maxPx })

  const images = []
  for (let row = 0; row < tile.cells; row += 1) {
    for (let col = 0; col < tile.cells; col += 1) {
      images.push(
        <image
          key={`${row}-${col}`}
          href={href}
          x={x + col * cellSize}
          y={y + row * cellSize}
          width={cellSize}
          height={cellSize}
          preserveAspectRatio="none"
        />,
      )
    }
  }

  const inSelection = selectedGroundTileIds.includes(tile.id)

  return (
    <g key={tile.id}>
      {images}
      {inSelection ? (
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          fill="none"
          stroke="#5eead4"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
    </g>
  )
}

function renderChunkGround(
  placement: Extract<SinistraTerrainPlacement, { mode: 'chunkGround' }>,
  index: number,
  maxPx: number,
  chunkGroundNudgeWorldX: number,
  chunkGroundNudgeWorldY: number,
) {
  return (
    <image
      key={`ground-${placement.name}-${placement.x}-${placement.y}`}
      href={buildRawAssetUrl(placement.imagePath, { maxPx })}
      x={placement.x + chunkGroundNudgeWorldX}
      y={placement.y + chunkGroundNudgeWorldY}
      width={placement.width}
      height={placement.height}
      preserveAspectRatio="none"
    />
  )
}

function renderTerrainBaked(
  placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>,
  index: number,
  maxPx: number,
  overrideDoc: PrefabOverrideDocument,
  selectedPrefabKeys: string[],
  pickEnabled: boolean,
  onPick: ((placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>, additive: boolean) => void) | null,
  globalDefault: PrefabBakeVariant,
  assetVersion: string,
  prefabScaleY: number,
) {
  const render = effectiveBakedRender(placement, overrideDoc, globalDefault)
  if (!render) {
    return null
  }

  const width = render.width
  const height = render.height
  const draw = { x: render.x, y: render.y }
  const squishHeight = height * prefabScaleY
  const squishOffsetY = (height - squishHeight) / 2
  const instanceKey = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
  const inSelection = selectedPrefabKeys.includes(instanceKey)
  const key = `baked-${instanceKey}`
  const href = terrainPrefabUrl(render.imagePath, maxPx, assetVersion)
  const override = getPrefabOverride(overrideDoc, placement)
  const rotation = resolvePrefabRotation(placement.name, override)
  const drawTransform = buildPrefabDrawTransform(draw.x, draw.y, width, height, rotation, prefabScaleY)
  const hitTarget = pickEnabled ? (
    <rect
      x={0}
      y={0}
      width={width}
      height={height}
      fill="rgba(0,0,0,0.001)"
      pointerEvents="all"
    />
  ) : null
  const content = (
    <g transform={drawTransform}>
      {hitTarget}
      <image href={href} x={0} y={0} width={width} height={height} preserveAspectRatio="none" />
    </g>
  )

  return (
    <g
      key={key}
      opacity={inSelection ? 1 : 0.98}
      style={{
        pointerEvents: pickEnabled ? 'auto' : 'none',
        cursor: pickEnabled ? 'pointer' : undefined,
      }}
      onPointerDown={(event) => {
        if (!pickEnabled || !onPick) {
          return
        }
        event.stopPropagation()
        event.preventDefault()
        onPick(placement, event.ctrlKey || event.metaKey)
      }}
    >
      {inSelection ? (
        <rect
          x={draw.x - 1}
          y={draw.y + squishOffsetY - 1}
          width={width + 2}
          height={squishHeight + 2}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
      {content}
    </g>
  )
}

function renderChunkComposite(
  entry: ChunkCompositeEntry,
  maxPx: number,
  prefabNudgeWorldX: number,
  prefabNudgeWorldY: number,
) {
  return (
    <image
      key={`chunk-composite-${entry.chunkKey}`}
      href={buildRawAssetUrl(entry.imagePath, { maxPx })}
      x={entry.worldX + prefabNudgeWorldX}
      y={entry.worldY + prefabNudgeWorldY}
      width={entry.worldWidth}
      height={entry.worldHeight}
      preserveAspectRatio="none"
    />
  )
}

function renderFullComposite(
  entry: NonNullable<ReturnType<typeof getFullCompositeEntry>>,
  maxPx: number,
  prefabNudgeWorldX: number,
  prefabNudgeWorldY: number,
) {
  return (
    <image
      key="full-composite"
      href={buildRawAssetUrl(entry.imagePath, { maxPx })}
      x={entry.worldX + prefabNudgeWorldX}
      y={entry.worldY + prefabNudgeWorldY}
      width={entry.worldWidth}
      height={entry.worldHeight}
      preserveAspectRatio="none"
    />
  )
}

function renderSpriteManifestEntry(
  sprite: SpriteManifestEntry,
  index: number,
  maxPx: number,
  prefabScaleY: number,
) {
  const width = sprite.w
  const height = sprite.h
  const squishHeight = height * prefabScaleY
  const squishOffsetY = (height - squishHeight) / 2
  const x = sprite.wx - width / 2
  const y = sprite.wy - height / 2 + squishOffsetY

  return (
    <image
      key={`sprite-manifest-${index}-${sprite.name}-${sprite.wx}-${sprite.wy}`}
      href={buildRawAssetUrl(sprite.imagePath, { maxPx })}
      x={x}
      y={y}
      width={width}
      height={squishHeight}
      preserveAspectRatio="none"
      opacity={0.98}
    />
  )
}

function clientToWorld(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  view: ViewBoxState,
): { x: number; y: number } {
  const nx = (clientX - rect.left) / rect.width
  const ny = (clientY - rect.top) / rect.height

  return {
    x: view.x + view.size * nx,
    y: view.y + view.size * ny,
  }
}

function renderPlannerMarker(
  marker: PlannerMarker,
  selected: boolean,
  connectSource: PlannerLinkTarget | null,
) {
  const colors = COALITION_COLORS[marker.coalition] ?? COALITION_COLORS[1]
  const radius = marker.kind === 'covenFortress' ? 18 : 12
  const isConnectSource =
    connectSource?.type === 'planner' && connectSource.id === marker.id

  return (
    <g key={marker.id}>
      {marker.kind === 'covenFortress' ? (
        <polygon
          points={`${marker.x},${marker.y - radius} ${marker.x + radius},${marker.y + radius} ${marker.x - radius},${marker.y + radius}`}
          fill={colors.fill}
          stroke={isConnectSource ? '#fff' : colors.stroke}
          strokeWidth={selected || isConnectSource ? 5 : 3}
          opacity={0.95}
        />
      ) : (
        <circle
          cx={marker.x}
          cy={marker.y}
          r={radius}
          fill={colors.fill}
          stroke={isConnectSource ? '#fff' : colors.stroke}
          strokeWidth={selected || isConnectSource ? 5 : 3}
          opacity={0.95}
        />
      )}
      <text
        x={marker.x}
        y={marker.y + 4}
        textAnchor="middle"
        className="pointer-events-none"
        style={{ fill: '#0c0a0b', fontSize: '11px', fontWeight: 800 }}
      >
        {marker.label}
      </text>
    </g>
  )
}

function TerrainAlignmentSliders({
  terrainAlignment,
  onChange,
  compact = false,
}: {
  terrainAlignment: TerrainAlignmentOffsets
  onChange: (next: TerrainAlignmentOffsets) => void
  compact?: boolean
}) {
  const setField = (field: keyof TerrainAlignmentOffsets, cells: number) => {
    onChange({
      ...terrainAlignment,
      [field]: clampAlignmentCells(cells),
    })
  }

  const stepField = (
    field: keyof TerrainAlignmentOffsets,
    label: string,
    colorClass: string,
  ) => {
    const value = terrainAlignment[field]
    const worldUnits = cellsToWorld(value)

    return (
      <div className="space-y-1">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setField(field, value - TERRAIN_ALIGN_CELL_STEP)}
            className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
            title={`−${TERRAIN_ALIGN_CELL_STEP} cells (${TERRAIN_ALIGN_CELL_STEP * SLG_MAP_CELL_SIZE}u)`}
            aria-label={`Decrease ${label} slightly`}
          >
            −
          </button>
          <input
            type="range"
            min={TERRAIN_ALIGN_CELL_MIN}
            max={TERRAIN_ALIGN_CELL_MAX}
            step={TERRAIN_ALIGN_CELL_STEP}
            value={value}
            onChange={(event) => setField(field, Number(event.target.value))}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            className="min-w-0 flex-1 touch-auto accent-current"
            style={{ pointerEvents: 'auto', touchAction: 'auto' }}
          />
          <button
            type="button"
            onClick={() => setField(field, value + TERRAIN_ALIGN_CELL_STEP)}
            className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
            title={`+${TERRAIN_ALIGN_CELL_STEP} cells (${TERRAIN_ALIGN_CELL_STEP * SLG_MAP_CELL_SIZE}u)`}
            aria-label={`Increase ${label} slightly`}
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
            cells
            <input
              type="number"
              min={TERRAIN_ALIGN_CELL_MIN}
              max={TERRAIN_ALIGN_CELL_MAX}
              step={TERRAIN_ALIGN_CELL_STEP}
              value={Number(value.toFixed(3))}
              onChange={(event) => {
                const parsed = parseAlignmentCellInput(event.target.value)
                if (parsed !== null) {
                  setField(field, parsed)
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="w-[4.5rem] rounded border border-gray-600 bg-gray-900 px-1.5 py-0.5 text-right text-[11px] text-gray-100"
            />
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-1 text-[11px] text-gray-400">
            world u
            <input
              type="number"
              min={TERRAIN_ALIGN_CELL_MIN * SLG_MAP_CELL_SIZE}
              max={TERRAIN_ALIGN_CELL_MAX * SLG_MAP_CELL_SIZE}
              step={TERRAIN_ALIGN_CELL_STEP * SLG_MAP_CELL_SIZE}
              value={Number(worldUnits.toFixed(2))}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                if (Number.isFinite(parsed)) {
                  setField(field, parsed / SLG_MAP_CELL_SIZE)
                }
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="w-full min-w-0 rounded border border-gray-600 bg-gray-900 px-1.5 py-0.5 text-right text-[11px] text-gray-100"
            />
          </label>
          <button
            type="button"
            onClick={() => setField(field, value - 1)}
            className="shrink-0 rounded border border-gray-700 bg-gray-800/80 px-1.5 py-0.5 text-[10px] text-gray-400 hover:bg-gray-700"
            title="−1 cell"
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => setField(field, value + 1)}
            className="shrink-0 rounded border border-gray-700 bg-gray-800/80 px-1.5 py-0.5 text-[10px] text-gray-400 hover:bg-gray-700"
            title="+1 cell"
          >
            +1
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-3' : 'mt-4 space-y-4'}>
      <p className="text-[11px] text-gray-500">
        ± buttons = {TERRAIN_ALIGN_CELL_STEP} cells ({TERRAIN_ALIGN_CELL_STEP * SLG_MAP_CELL_SIZE}u). Type exact
        values in the number boxes.
      </p>
      <div className="text-xs text-gray-300">
        {stepField('chunkGroundCellsX', 'Chunk ground X (+ = right)', 'text-violet-200')}
      </div>
      <div className="text-xs text-gray-300">
        {stepField('chunkGroundCells', 'Chunk ground Y (+ = down)', 'text-violet-200')}
      </div>
      <div className="text-xs text-gray-300">
        {stepField('prefabCellsX', 'Edge prefabs X (+ = right)', 'text-emerald-200')}
      </div>
      <div className="text-xs text-gray-300">
        {stepField('prefabCells', 'Edge prefabs Y (+ = up)', 'text-emerald-200')}
      </div>
      <div className="space-y-1 text-xs text-gray-300">
        <span className="font-medium text-amber-200">Prefab vertical squish (all tiles)</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...terrainAlignment,
                prefabScaleY: clampAlignmentScaleY(terrainAlignment.prefabScaleY - TERRAIN_ALIGN_SCALE_Y_STEP),
              })
            }
            className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
            title={`−${TERRAIN_ALIGN_SCALE_Y_STEP}`}
            aria-label="Decrease prefab vertical scale"
          >
            −
          </button>
          <input
            type="range"
            min={TERRAIN_ALIGN_SCALE_Y_MIN}
            max={TERRAIN_ALIGN_SCALE_Y_MAX}
            step={TERRAIN_ALIGN_SCALE_Y_STEP}
            value={terrainAlignment.prefabScaleY}
            onChange={(event) =>
              onChange({
                ...terrainAlignment,
                prefabScaleY: clampAlignmentScaleY(Number(event.target.value)),
              })
            }
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
            className="min-w-0 flex-1 touch-auto accent-amber-400"
            style={{ pointerEvents: 'auto', touchAction: 'auto' }}
          />
          <button
            type="button"
            onClick={() =>
              onChange({
                ...terrainAlignment,
                prefabScaleY: clampAlignmentScaleY(terrainAlignment.prefabScaleY + TERRAIN_ALIGN_SCALE_Y_STEP),
              })
            }
            className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
            title={`+${TERRAIN_ALIGN_SCALE_Y_STEP}`}
            aria-label="Increase prefab vertical scale"
          >
            +
          </button>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-gray-400">
          scale Y
          <input
            type="number"
            min={TERRAIN_ALIGN_SCALE_Y_MIN}
            max={TERRAIN_ALIGN_SCALE_Y_MAX}
            step={TERRAIN_ALIGN_SCALE_Y_STEP}
            value={terrainAlignment.prefabScaleY}
            onChange={(event) => {
              const parsed = Number(event.target.value)
              if (Number.isFinite(parsed)) {
                onChange({ ...terrainAlignment, prefabScaleY: clampAlignmentScaleY(parsed) })
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="w-full rounded border border-gray-600 bg-gray-900 px-1.5 py-0.5 text-right text-[11px] text-gray-100"
          />
        </label>
        <p className="text-[10px] text-gray-500">
          One slider squashes every prefab by the same amount. Each tile&apos;s center stays fixed; top
          and bottom move inward.
        </p>
      </div>
      <p className="text-[11px] text-gray-500">
        Yellow + = JSON anchor from chunk file · green box = baked PNG · purple = chunk tile
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(defaultTerrainAlignmentOffsets())}
          className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200"
        >
          Reset defaults
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(formatAlignmentConstantsSnippet(terrainAlignment))
          }}
          className="rounded-md border border-orange-800/60 bg-orange-950/40 px-2 py-1 text-xs text-orange-100"
        >
          Copy constants
        </button>
      </div>
    </div>
  )
}

function renderTerrainPlacement(
  placement: SinistraTerrainPlacement,
  index: number,
  viewSize: number,
  chunkGroundNudgeWorldX: number,
  chunkGroundNudgeWorldY: number,
  overrideDoc: PrefabOverrideDocument,
  selectedPrefabKeys: string[],
  prefabPickEnabled: boolean,
  onPickPrefab: ((placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>, additive: boolean) => void) | null,
  prefabBakeDefault: PrefabBakeVariant,
  prefabAssetVersion: string,
  prefabScaleY = 1,
) {
  if (placement.mode === 'chunkGround') {
    return renderChunkGround(
      placement,
      index,
      lodMaxPx(viewSize, 'chunk'),
      chunkGroundNudgeWorldX,
      chunkGroundNudgeWorldY,
    )
  }

  if (placement.mode === 'fill') {
    return renderTerrainFill(placement, index)
  }

  if (placement.mode === 'baked') {
    return renderTerrainBaked(
      placement,
      index,
      lodMaxPx(viewSize, 'prefab'),
      overrideDoc,
      selectedPrefabKeys,
      prefabPickEnabled,
      onPickPrefab,
      prefabBakeDefault,
      prefabAssetVersion,
      prefabScaleY,
    )
  }

  return null
}

function renderMarker(
  structure: SinistraStructure,
  selected: boolean,
  x: number,
  y: number,
) {
  const style = KIND_STYLES[structure.kind]
  const radius = style.markerSize / 2
  const strokeWidth = selected ? 6 : 3

  switch (structure.kind) {
    case 'coalitionHome':
      return (
        <polygon
          points={`${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'mansion':
      return (
        <rect
          x={x - radius}
          y={y - radius}
          width={radius * 2}
          height={radius * 2}
          rx={2}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'fort':
      return (
        <rect
          x={x - radius}
          y={y - radius}
          width={radius * 2}
          height={radius * 2}
          rx={3}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'bridge':
      return (
        <rect
          x={x - radius}
          y={y - radius / 2}
          width={radius * 2}
          height={radius}
          rx={radius / 4}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'sanctum':
      return (
        <polygon
          points={`${x},${y - radius} ${x + radius},${y + radius} ${x - radius},${y + radius}`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'turret':
      return (
        <polygon
          points={`${x},${y - radius} ${x + radius},${y + radius} ${x - radius},${y + radius}`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'tree':
      return (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={selected ? 2 : 1}
          opacity={0.85}
        />
      )

    case 'citadel':
      return (
        <>
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={x}
            cy={y}
            r={radius / 2}
            fill="rgba(12, 10, 11, 0.7)"
            stroke={style.stroke}
            strokeWidth={2}
          />
        </>
      )

    default:
      return (
        <circle
          cx={structure.x}
          cy={structure.y}
          r={radius}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
        />
      )
  }
}

export function SinistraMapExplorer({ data }: { data: SinistraMapData }) {
  const baseViewBox = useMemo(() => buildBaseViewBox(data.worldBounds), [data.worldBounds])
  const [camera, setCamera] = useState<CameraState>({ scale: 1, panX: 0, panY: 0 })
  const viewBox = useMemo(() => cameraToViewBox(baseViewBox, camera), [baseViewBox, camera])
  const safeViewBox = useMemo(() => {
    if (!Number.isFinite(viewBox.x + viewBox.y + viewBox.size) || viewBox.size <= 0) {
      return baseViewBox
    }
    return viewBox
  }, [baseViewBox, viewBox])
  const viewSize = baseViewBox.size / camera.scale
  const [lodViewSize, setLodViewSize] = useState(viewSize)
  const lodSettleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (viewSize < lodViewSize) {
      if (lodSettleRef.current) {
        clearTimeout(lodSettleRef.current)
        lodSettleRef.current = null
      }
      setLodViewSize(viewSize)
      return
    }

    if (Math.abs(viewSize - lodViewSize) < 1) {
      return
    }

    if (lodSettleRef.current) {
      clearTimeout(lodSettleRef.current)
    }
    lodSettleRef.current = setTimeout(() => {
      lodSettleRef.current = null
      setLodViewSize(viewSize)
    }, TERRAIN_LOD_SETTLE_MS)

    return () => {
      if (lodSettleRef.current) {
        clearTimeout(lodSettleRef.current)
        lodSettleRef.current = null
      }
    }
  }, [lodViewSize, viewSize])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cameraRef = useRef(camera)
  const baseViewBoxRef = useRef(baseViewBox)
  const liveViewRef = useRef(viewBox)
  cameraRef.current = camera
  baseViewBoxRef.current = baseViewBox
  liveViewRef.current = viewBox

  const [terrainCullView, setTerrainCullView] = useState(viewBox)
  const cullRafRef = useRef<number | null>(null)

  const applyLiveViewBox = useCallback((visible: ViewBoxState) => {
    if (!Number.isFinite(visible.x + visible.y + visible.size) || visible.size <= 0) {
      return
    }

    liveViewRef.current = visible
    const svg = svgRef.current
    if (svg) {
      svg.setAttribute('viewBox', viewBoxAttribute(visible))
    }

    if (cullRafRef.current != null) {
      cancelAnimationFrame(cullRafRef.current)
    }
    cullRafRef.current = requestAnimationFrame(() => {
      cullRafRef.current = null
      setTerrainCullView(visible)
    })
  }, [])

  useLayoutEffect(() => {
    applyLiveViewBox(safeViewBox)
  }, [applyLiveViewBox, safeViewBox])

  useEffect(() => {
    return () => {
      if (cullRafRef.current != null) {
        cancelAnimationFrame(cullRafRef.current)
      }
    }
  }, [])
  const initialMapUi = useMemo(() => readInitialMapUi(), [])
  const [showGameArt, setShowGameArt] = useState(initialMapUi.showGameArt)
  const [showChunkTerrain, setShowChunkTerrain] = useState(initialMapUi.showChunkTerrain)
  const mapEditorHistory = useMapEditorHistory({
    prefabOverrideDoc: emptyPrefabOverrideDocument(),
    terrainAlignment: defaultTerrainAlignmentOffsets(),
    prefabBakeDefault: 'full',
  })
  const {
    snapshot: editorSnapshot,
    patch: patchEditorSnapshot,
    undo: undoEditor,
    redo: redoEditor,
    resetHistory: resetEditorHistory,
    canUndo: canUndoEditor,
    canRedo: canRedoEditor,
  } = mapEditorHistory
  const prefabOverrideDoc = editorSnapshot.prefabOverrideDoc
  const terrainAlignment = editorSnapshot.terrainAlignment
  const prefabBakeDefault = editorSnapshot.prefabBakeDefault
  const prefabAssetVersion = useMemo(
    () => terrainPrefabAssetVersion(prefabBakeDefault),
    [prefabBakeDefault],
  )
  const [showRegions, setShowRegions] = useState(initialMapUi.showRegions)
  const [showRegionLabels, setShowRegionLabels] = useState(initialMapUi.showRegionLabels)
  const [visibleKinds, setVisibleKinds] = useState<Record<SinistraStructureKind, boolean>>(
    initialMapUi.visibleKinds,
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    data.structures.find((structure) => structure.kind === 'citadel')?.id ??
      data.structures.find((structure) => structure.kind === 'coalitionHome')?.id ??
      data.structures[0]?.id ??
      null,
  )

  const dragRef = useRef<DragState | null>(null)
  const dragCameraRef = useRef<CameraState | null>(null)
  const pendingClickRef = useRef<PendingMapClick | null>(null)
  const scrollLockYRef = useRef(0)
  const scrollLockActiveRef = useRef(false)

  const [mapMode, setMapMode] = useState<'explore' | 'plan'>(initialMapUi.mapMode)
  const [plannerTool, setPlannerTool] = useState<PlannerTool>('pan')
  const [plannerCoalition, setPlannerCoalition] = useState(1)
  const [plannerMarkers, setPlannerMarkers] = useState<PlannerMarker[]>([])
  const [selectedPlannerId, setSelectedPlannerId] = useState<string | null>(null)
  const [connectSource, setConnectSource] = useState<PlannerLinkTarget | null>(null)
  const [showPlannerGrid, setShowPlannerGrid] = useState(initialMapUi.showPlannerGrid)
  const [showTerrainGrid, setShowTerrainGrid] = useState(initialMapUi.showTerrainGrid)
  const [showAlignClickMarker, setShowAlignClickMarker] = useState(initialMapUi.showAlignClickMarker)
  const [showTerrainAlignDebug, setShowTerrainAlignDebug] = useState(initialMapUi.showTerrainAlignDebug)
  const [alignmentProbe, setAlignmentProbe] = useState<TerrainAlignmentProbe | null>(null)
  const [selectedPrefabKeys, setSelectedPrefabKeys] = useState<string[]>([])
  const [selectedGroundTileIds, setSelectedGroundTileIds] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showMoveAllPanel, setShowMoveAllPanel] = useState(true)
  const [prefabEditTool, setPrefabEditTool] = useState<PrefabEditTool>('select')
  const [addPrefabName, setAddPrefabName] = useState(() => listBakedPrefabNames()[0] ?? '')
  const [addGroundTileKey, setAddGroundTileKey] = useState(() => listPlotTileKeys()[0] ?? 'wild')
  const [addGroundTileCells, setAddGroundTileCells] = useState(1)
  const [prefabPickHint, setPrefabPickHint] = useState<string | null>(null)
  const [terrainAlignPanelOpen, setTerrainAlignPanelOpen] = useState(initialMapUi.terrainAlignPanelOpen)
  const [terrainRenderMode, setTerrainRenderMode] = useState<TerrainRenderMode>(() => {
    if (typeof window !== 'undefined') {
      return loadTerrainRenderMode()
    }
    return defaultTerrainRenderMode()
  })
  const showTerrainAlignDebugRef = useRef(showTerrainAlignDebug)
  showTerrainAlignDebugRef.current = showTerrainAlignDebug
  const editorHydratedRef = useRef(false)

  useEffect(() => {
    setPlannerMarkers(loadPlannerState().markers)
  }, [])

  useEffect(() => {
    savePlannerState({ markers: plannerMarkers })
  }, [plannerMarkers])

  const applyScrollLock = useCallback(() => {
    if (scrollLockActiveRef.current) {
      return
    }

    scrollLockActiveRef.current = true
    scrollLockYRef.current = window.scrollY
    document.documentElement.classList.add('sinistra-map-scroll-lock')
    document.body.classList.add('sinistra-map-scroll-lock')
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollLockYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
  }, [])

  const releaseScrollLock = useCallback(() => {
    if (!scrollLockActiveRef.current) {
      return
    }

    const scrollY = scrollLockYRef.current
    scrollLockActiveRef.current = false
    document.documentElement.classList.remove('sinistra-map-scroll-lock')
    document.body.classList.remove('sinistra-map-scroll-lock')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollY)
  }, [])

  const syncPageScrollLock = useCallback(() => {
    if (dragRef.current !== null) {
      applyScrollLock()
    } else {
      releaseScrollLock()
    }
  }, [applyScrollLock, releaseScrollLock])

  const isPointerOverMap = useCallback((clientX: number, clientY: number) => {
    const element = mapContainerRef.current
    if (!element) {
      return false
    }

    const rect = element.getBoundingClientRect()
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    )
  }, [])

  const culledViewBox = useMemo(() => {
    const step = Math.max(80, terrainCullView.size / TERRAIN_CULL_QUANTIZE_DIVISOR)
    return quantizeViewBox(terrainCullView, step)
  }, [terrainCullView])

  const filteredStructures = useMemo(() => {
    const viewPadding = 100
    const minX = culledViewBox.x - viewPadding
    const minY = culledViewBox.y - viewPadding
    const maxX = culledViewBox.x + culledViewBox.size + viewPadding
    const maxY = culledViewBox.y + culledViewBox.size + viewPadding

    return data.structures.filter((structure) => {
      if (!visibleKinds[structure.kind] || !shouldRenderStructure(structure, viewSize)) {
        return false
      }

      if (structure.kind === 'tree') {
        const displayY = flipSlgY(data.worldBounds, structure.y)
        return (
          structure.x >= minX &&
          structure.x <= maxX &&
          displayY >= minY &&
          displayY <= maxY
        )
      }

      return true
    })
  }, [culledViewBox, data.structures, data.worldBounds, viewSize, visibleKinds])

  const selectedStructure =
    data.structures.find((structure) => structure.id === selectedId) ??
    filteredStructures[0] ??
    null

  const structureDisplayPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>()
    for (const structure of data.structures) {
      positions.set(structure.id, {
        x: structure.x,
        y: flipSlgY(data.worldBounds, structure.y),
      })
    }
    return positions
  }, [data.structures, data.worldBounds])

  const plannerLinks = useMemo(() => {
    return plannerMarkers
      .filter((marker) => marker.parent)
      .map((marker) => {
        const parent = marker.parent!
        const from = resolveLinkTargetPosition(parent, plannerMarkers, structureDisplayPositions)
        const to = { x: marker.x, y: marker.y }
        if (!from) {
          return null
        }
        return { id: marker.id, from, to, coalition: marker.coalition }
      })
      .filter((link): link is NonNullable<typeof link> => link !== null)
  }, [plannerMarkers, structureDisplayPositions])

  const isPanInteraction =
    (mapMode === 'explore' && !showTerrainAlignDebug) ||
    plannerTool === 'pan' ||
    plannerTool === 'erase'

  const zoomPercent = Math.round(camera.scale * 100)
  useEffect(() => {
    let bakeDefault: PrefabBakeVariant = 'full'
    try {
      const saved = window.localStorage.getItem(PREFAB_VARIANT_STORAGE_KEY)
      if (saved === 'full' || saved === 'edges') {
        bakeDefault = saved
      }
    } catch {
      // ignore
    }
    resetEditorHistory({
      prefabOverrideDoc: loadPrefabOverrideDocument(),
      terrainAlignment: loadTerrainAlignmentOffsets(),
      prefabBakeDefault: bakeDefault,
    })
    editorHydratedRef.current = true
  }, [resetEditorHistory])

  useEffect(() => {
    if (!editorHydratedRef.current) {
      return
    }
    savePrefabOverrideDocument(editorSnapshot.prefabOverrideDoc)
    saveTerrainAlignmentOffsets(editorSnapshot.terrainAlignment)
    try {
      window.localStorage.setItem(PREFAB_VARIANT_STORAGE_KEY, editorSnapshot.prefabBakeDefault)
    } catch {
      // ignore
    }
  }, [editorSnapshot])

  useEffect(() => {
    saveMapUiPreferences({
      mapMode,
      showGameArt,
      showChunkTerrain,
      showRegions,
      showRegionLabels,
      showTerrainGrid,
      showAlignClickMarker,
      showTerrainAlignDebug,
      showPlannerGrid,
      terrainAlignPanelOpen,
      visibleKinds,
    })
  }, [
    mapMode,
    showGameArt,
    showChunkTerrain,
    showRegions,
    showRegionLabels,
    showTerrainGrid,
    showAlignClickMarker,
    showTerrainAlignDebug,
    showPlannerGrid,
    terrainAlignPanelOpen,
    visibleKinds,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!showTerrainAlignDebugRef.current) {
        return
      }
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      const mod = event.ctrlKey || event.metaKey
      if (!mod) {
        return
      }

      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undoEditor()
        return
      }
      if (event.key === 'y' || (event.key === 'z' && event.shiftKey) || (event.key === 'Z' && event.shiftKey)) {
        event.preventDefault()
        redoEditor()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redoEditor, undoEditor])

  const updatePrefabOverrideDoc = useCallback(
    (next: PrefabOverrideDocument, immediate = false) => {
      patchEditorSnapshot(
        (current) => ({ ...current, prefabOverrideDoc: next }),
        immediate ? 'immediate' : 'debounced',
      )
    },
    [patchEditorSnapshot],
  )

  const updateTerrainAlignment = useCallback(
    (next: TerrainAlignmentOffsets, immediate = false) => {
      patchEditorSnapshot(
        (current) => ({ ...current, terrainAlignment: next }),
        immediate ? 'immediate' : 'debounced',
      )
    },
    [patchEditorSnapshot],
  )

  const importOverrideBackup = useCallback(
    (
      doc: PrefabOverrideDocument,
      layerAlignment: Partial<TerrainAlignmentOffsets> | null,
    ) => {
      patchEditorSnapshot(
        (current) => ({
          ...current,
          prefabOverrideDoc: doc,
          terrainAlignment: layerAlignment
            ? { ...current.terrainAlignment, ...layerAlignment }
            : current.terrainAlignment,
        }),
        'immediate',
      )
    },
    [patchEditorSnapshot],
  )

  const effectiveBakedPlacements = useMemo(
    () => mergeBakedPlacements(data.terrainPlacements, prefabOverrideDoc),
    [data.terrainPlacements, prefabOverrideDoc],
  )

  const displayTerrainPlacements = useMemo(() => {
    const nonBaked = data.terrainPlacements.filter((placement) => placement.mode !== 'baked')
    return [...nonBaked, ...effectiveBakedPlacements]
  }, [data.terrainPlacements, effectiveBakedPlacements])

  const clearMapSelection = useCallback(() => {
    setSelectedPrefabKeys([])
    setSelectedGroundTileIds([])
  }, [])

  useEffect(() => {
    if (!showTerrainAlignDebug) {
      return
    }

    const onDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }
      if (
        target.closest('[data-sinistra-map]') ||
        target.closest('[data-prefab-editor-panel]') ||
        target.closest('[data-terrain-align-panel]')
      ) {
        return
      }
      clearMapSelection()
    }

    document.addEventListener('pointerdown', onDocumentPointerDown)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown)
  }, [clearMapSelection, showTerrainAlignDebug])

  const selectPrefabPlacement = useCallback(
    (placement: Extract<SinistraTerrainPlacement, { mode: 'baked' }>, additive: boolean) => {
      const key = prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY)
      setSelectedGroundTileIds([])
      setSelectedPrefabKeys((current) => {
        if (additive) {
          return current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]
        }
        return [key]
      })
      setPrefabPickHint(
        additive
          ? `Toggled ${placement.name} in selection (Ctrl+click for more)`
          : `Selected ${placement.name}`,
      )
    },
    [],
  )

  const selectGroundTile = useCallback((tileId: string, additive: boolean, label: string) => {
    setSelectedPrefabKeys([])
    setSelectedGroundTileIds((current) => {
      if (additive) {
        return current.includes(tileId) ? current.filter((entry) => entry !== tileId) : [...current, tileId]
      }
      return [tileId]
    })
    setPrefabPickHint(
      additive ? `Toggled ground tile in selection (Ctrl+click for more)` : label,
    )
  }, [])
  const chunkGroundNudgeWorldX = cellsToWorld(terrainAlignment.chunkGroundCellsX)
  const chunkGroundNudgeWorldY = cellsToWorld(terrainAlignment.chunkGroundCells)
  const prefabNudgeWorldX = cellsToWorld(terrainAlignment.prefabCellsX)
  const prefabNudgeWorldY = cellsToWorld(terrainAlignment.prefabCells)

  const showOverviewLayer = showGameArt && shouldShowOverviewLayer(viewSize)
  const showChunkLayer = showGameArt && showChunkTerrain && shouldShowChunkGroundLayer(viewSize)
  const showPrefabLayer = showGameArt && showChunkTerrain && shouldShowBakedPrefabs(viewSize)
  const showTerrainLayer = showChunkLayer || showPrefabLayer
  const compositeModeReady =
    (terrainRenderMode === 'chunkComposite' && hasChunkCompositeBakes()) ||
    (terrainRenderMode === 'fullComposite' && hasFullCompositeBake()) ||
    (terrainRenderMode === 'spriteManifest' && hasSpriteManifest())
  const showCompositeFallbackNotice = terrainRenderMode !== 'individual' && !compositeModeReady
  const effectivePrefabRenderMode: TerrainRenderMode =
    terrainRenderMode !== 'individual' && compositeModeReady ? terrainRenderMode : 'individual'
  const useIndividualPrefabs = effectivePrefabRenderMode === 'individual'
  const prefabPickEnabled =
    useIndividualPrefabs && showTerrainAlignDebug && prefabEditTool === 'select' && showPrefabLayer

  const visibleTerrain = useMemo(() => {
    if (!showTerrainLayer) {
      return []
    }

    const padding = Math.max(TERRAIN_CULL_PADDING_MIN, terrainCullView.size * TERRAIN_CULL_PADDING_RATIO)
    const minX = terrainCullView.x - padding
    const minY = terrainCullView.y - padding
    const maxX = terrainCullView.x + terrainCullView.size + padding
    const maxY = terrainCullView.y + terrainCullView.size + padding

    const inView = displayTerrainPlacements.filter((placement) => {
      if (placement.mode === 'chunkGround' && !showChunkLayer) {
        return false
      }
      if (placement.mode === 'baked' && !showPrefabLayer) {
        return false
      }

      if (placement.mode === 'fill' || placement.mode === 'chunkGround') {
        const bounds =
          placement.mode === 'chunkGround'
            ? chunkGroundScreenBounds(placement, terrainAlignment)
            : {
                minX: placement.x,
                minY: placement.y,
                maxX: placement.x + placement.width,
                maxY: placement.y + placement.height,
              }
        return bounds.maxX >= minX && bounds.minX <= maxX && bounds.maxY >= minY && bounds.minY <= maxY
      } else if (placement.mode === 'baked') {
        const draw = effectiveDrawPosition(placement, prefabOverrideDoc, prefabBakeDefault)
        const probePlacement = { ...placement, x: draw.x, y: draw.y }
        const bounds = bakedPrefabScreenBounds(data.worldBounds, probePlacement, terrainAlignment)
        return bounds.maxX >= minX && bounds.minX <= maxX && bounds.maxY >= minY && bounds.minY <= maxY
      } else {
        return false
      }
    })

    return sortTerrainForDraw(inView, prefabOverrideDoc)
  }, [
    terrainCullView,
    displayTerrainPlacements,
    data.worldBounds,
    prefabOverrideDoc,
    prefabBakeDefault,
    showChunkLayer,
    showPrefabLayer,
    showTerrainLayer,
    terrainAlignment,
  ])

  const visibleChunkComposites = useMemo(() => {
    if (!showPrefabLayer || effectivePrefabRenderMode !== 'chunkComposite') {
      return []
    }

    const padding = Math.max(TERRAIN_CULL_PADDING_MIN, terrainCullView.size * TERRAIN_CULL_PADDING_RATIO)
    const minX = terrainCullView.x - padding
    const minY = terrainCullView.y - padding
    const maxX = terrainCullView.x + terrainCullView.size + padding
    const maxY = terrainCullView.y + terrainCullView.size + padding

    return listChunkCompositeEntries().filter((entry) => {
      const bounds = {
        minX: entry.worldX,
        minY: entry.worldY,
        maxX: entry.worldX + entry.worldWidth,
        maxY: entry.worldY + entry.worldHeight,
      }
      return bounds.maxX >= minX && bounds.minX <= maxX && bounds.maxY >= minY && bounds.minY <= maxY
    })
  }, [showPrefabLayer, effectivePrefabRenderMode, terrainCullView])

  const visibleSpriteManifest = useMemo(() => {
    if (!showPrefabLayer || effectivePrefabRenderMode !== 'spriteManifest') {
      return []
    }

    const padding = Math.max(TERRAIN_CULL_PADDING_MIN, terrainCullView.size * TERRAIN_CULL_PADDING_RATIO)
    const minX = terrainCullView.x - padding
    const minY = terrainCullView.y - padding
    const maxX = terrainCullView.x + terrainCullView.size + padding
    const maxY = terrainCullView.y + terrainCullView.size + padding

    return listSpriteManifestEntries().filter((sprite) => {
      const halfW = sprite.w / 2
      const halfH = sprite.h / 2
      return (
        sprite.wx + halfW >= minX &&
        sprite.wx - halfW <= maxX &&
        sprite.wy + halfH >= minY &&
        sprite.wy - halfH <= maxY
      )
    })
  }, [showPrefabLayer, effectivePrefabRenderMode, terrainCullView])

  const fullCompositeEntry = useMemo(() => {
    if (!showPrefabLayer || effectivePrefabRenderMode !== 'fullComposite') {
      return null
    }
    return getFullCompositeEntry()
  }, [showPrefabLayer, effectivePrefabRenderMode])

  const terrainAlignGridLines = useMemo(() => {
    if (!showTerrainGrid || !showTerrainLayer) {
      return { vertical: [] as number[], horizontal: [] as number[] }
    }

    const padding = viewBox.size * 0.05
    const minX = Math.floor((viewBox.x - padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const maxX = Math.ceil((viewBox.x + viewBox.size + padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const minY = Math.floor((viewBox.y - padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const maxY = Math.ceil((viewBox.y + viewBox.size + padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE

    const vertical: number[] = []
    for (let x = minX; x <= maxX; x += SLG_MAP_CELL_SIZE) {
      vertical.push(x)
    }

    const horizontal: number[] = []
    for (let y = minY; y <= maxY; y += SLG_MAP_CELL_SIZE) {
      horizontal.push(y)
    }

    return { vertical, horizontal }
  }, [showTerrainGrid, showTerrainLayer, viewBox.size, viewBox.x, viewBox.y])

  const plannerGridLines = useMemo(() => {
    if (mapMode !== 'plan' || !showPlannerGrid) {
      return { vertical: [] as number[], horizontal: [] as number[] }
    }

    const padding = viewBox.size * 0.05
    const minX = Math.floor((viewBox.x - padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const maxX = Math.ceil((viewBox.x + viewBox.size + padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const minY = Math.floor((viewBox.y - padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE
    const maxY = Math.ceil((viewBox.y + viewBox.size + padding) / SLG_MAP_CELL_SIZE) * SLG_MAP_CELL_SIZE

    const vertical: number[] = []
    for (let x = minX; x <= maxX; x += SLG_MAP_CELL_SIZE) {
      vertical.push(x)
    }

    const horizontal: number[] = []
    for (let y = minY; y <= maxY; y += SLG_MAP_CELL_SIZE) {
      horizontal.push(y)
    }

    return { vertical, horizontal }
  }, [mapMode, showPlannerGrid, viewBox.size, viewBox.x, viewBox.y])

  const setClampedCamera = (next: CameraState) => {
    setCamera(clampCamera(next))
  }


  const endDrag = useCallback(
    (event?: PointerEvent) => {
      const element = mapContainerRef.current
      if (element && event?.pointerId != null && element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
      if (dragCameraRef.current) {
        setClampedCamera(dragCameraRef.current)
        dragCameraRef.current = null
      }
      dragRef.current = null
      syncPageScrollLock()
    },
    [syncPageScrollLock],
  )

  useLayoutEffect(() => {
    const element = mapContainerRef.current
    if (!element) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      const overMap = isPointerOverMap(event.clientX, event.clientY)
      if (!overMap && !dragRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (!overMap) {
        return
      }

      const currentCamera = cameraRef.current
      const currentView = cameraToViewBox(baseViewBoxRef.current, currentCamera)
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      const cursorX = (event.clientX - rect.left) / rect.width
      const cursorY = (event.clientY - rect.top) / rect.height
      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * rect.height
            : event.deltaY
      const zoomFactor = delta < 0 ? 1.12 : 1 / 1.12
      const nextScale = currentCamera.scale * zoomFactor
      const nextViewSize = baseViewBoxRef.current.size / nextScale
      const worldPointX = currentView.x + currentView.size * cursorX
      const worldPointY = currentView.y + currentView.size * cursorY
      const nextViewX = worldPointX - nextViewSize * cursorX
      const nextViewY = worldPointY - nextViewSize * cursorY
      const nextPanX = nextViewX - baseViewBoxRef.current.x - (baseViewBoxRef.current.size - nextViewSize) / 2
      const nextPanY = nextViewY - baseViewBoxRef.current.y - (baseViewBoxRef.current.size - nextViewSize) / 2

      const nextCamera = clampCamera({
        scale: nextScale,
        panX: nextPanX,
        panY: nextPanY,
      })
      applyLiveViewBox(cameraToViewBox(baseViewBoxRef.current, nextCamera))
      setClampedCamera(nextCamera)
    }

    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true })
      dragRef.current = null
      pendingClickRef.current = null
      releaseScrollLock()
    }
  }, [applyLiveViewBox, isPointerOverMap, releaseScrollLock])

  useEffect(() => {
    const preventTouchScroll = (event: TouchEvent) => {
      if (!scrollLockActiveRef.current) {
        return
      }

      event.preventDefault()
    }

    document.addEventListener('touchmove', preventTouchScroll, { passive: false, capture: true })
    return () => {
      document.removeEventListener('touchmove', preventTouchScroll, { capture: true })
    }
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault()

      const pending = pendingClickRef.current
      if (pending && !dragRef.current) {
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY)
        if (distance > (showTerrainAlignDebugRef.current ? ALIGN_CLICK_DRAG_THRESHOLD_PX : CLICK_DRAG_THRESHOLD_PX)) {
          pending.moved = true
          dragRef.current = {
            startX: pending.startX,
            startY: pending.startY,
            origin: cameraRef.current,
          }
          syncPageScrollLock()
        } else {
          return
        }
      }

      if (!dragRef.current || !mapContainerRef.current) {
        return
      }

      const rect = mapContainerRef.current.getBoundingClientRect()
      if (rect.width <= 0) {
        return
      }

      const worldUnitsPerPixel = liveViewRef.current.size / rect.width
      const deltaX = (event.clientX - dragRef.current.startX) * worldUnitsPerPixel
      const deltaY = (event.clientY - dragRef.current.startY) * worldUnitsPerPixel

      const nextCamera = clampCamera({
        ...dragRef.current.origin,
        panX: dragRef.current.origin.panX - deltaX,
        panY: dragRef.current.origin.panY - deltaY,
      })
      dragCameraRef.current = nextCamera
      applyLiveViewBox(cameraToViewBox(baseViewBoxRef.current, nextCamera))
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [applyLiveViewBox, endDrag, syncPageScrollLock])

  const handlePlannerMapClick = useCallback(
    (clientX: number, clientY: number) => {
      const element = mapContainerRef.current
      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()
      if (rect.width <= 0) {
        return
      }

      const world = clientToWorld(clientX, clientY, rect, liveViewRef.current)
      const snapped = snapPlannerPoint(world.x, world.y)

      if (plannerTool === 'covenFortress') {
        const hasFortress = plannerMarkers.some(
          (marker) => marker.kind === 'covenFortress' && marker.coalition === plannerCoalition,
        )
        if (hasFortress) {
          return
        }

        setPlannerMarkers((current) => [
          ...current,
          createPlannerMarker('covenFortress', plannerCoalition, snapped.x, snapped.y, current),
        ])
        return
      }

      if (plannerTool === 'beacon') {
        setPlannerMarkers((current) => [
          ...current,
          createPlannerMarker('beacon', plannerCoalition, snapped.x, snapped.y, current),
        ])
      }
    },
    [plannerCoalition, plannerMarkers, plannerTool],
  )

  const handlePlannerMarkerClick = useCallback(
    (marker: PlannerMarker) => {
      if (plannerTool === 'erase') {
        setPlannerMarkers((current) =>
          current
            .filter((entry) => entry.id !== marker.id)
            .map((entry) =>
              entry.parent?.type === 'planner' && entry.parent.id === marker.id
                ? { ...entry, parent: null }
                : entry,
            ),
        )
        if (selectedPlannerId === marker.id) {
          setSelectedPlannerId(null)
        }
        if (connectSource?.type === 'planner' && connectSource.id === marker.id) {
          setConnectSource(null)
        }
        return
      }

      if (plannerTool === 'connect') {
        const target: PlannerLinkTarget = { type: 'planner', id: marker.id }

        if (!connectSource) {
          setConnectSource(target)
          return
        }

        if (linkTargetKey(connectSource) === linkTargetKey(target)) {
          setConnectSource(null)
          return
        }

        if (marker.kind === 'beacon') {
          setPlannerMarkers((current) =>
            current.map((entry) =>
              entry.id === marker.id ? { ...entry, parent: connectSource } : entry,
            ),
          )
          setConnectSource(null)
          return
        }

        setConnectSource(target)
        return
      }

      setSelectedPlannerId(marker.id)
    },
    [connectSource, plannerTool, selectedPlannerId],
  )

  const handleStructurePlannerClick = useCallback(
    (structure: SinistraStructure) => {
      if (mapMode !== 'plan' || plannerTool !== 'connect') {
        setSelectedId(structure.id)
        return
      }

      const target: PlannerLinkTarget = { type: 'structure', id: structure.id }
      if (!connectSource) {
        setConnectSource(target)
        setSelectedId(structure.id)
        return
      }

      if (linkTargetKey(connectSource) === linkTargetKey(target)) {
        setConnectSource(null)
        return
      }

      setConnectSource(target)
      setSelectedId(structure.id)
      return
    },
    [connectSource, mapMode, plannerTool],
  )

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('[data-terrain-align-panel]') || target.closest('[data-prefab-editor-panel]')) {
      return
    }

    if (
      showTerrainAlignDebug &&
      mapMode === 'explore' &&
      (prefabEditTool === 'select' || prefabEditTool === 'add' || prefabEditTool === 'addGroundTile')
    ) {
      pendingClickRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }
      dragRef.current = null
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)

    if (isPanInteraction) {
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        origin: cameraRef.current,
      }
      pendingClickRef.current = null
    } else {
      pendingClickRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }
      dragRef.current = null
    }

    syncPageScrollLock()
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const pending = pendingClickRef.current
    if (pending && !pending.moved && mapMode === 'plan') {
      handlePlannerMapClick(event.clientX, event.clientY)
    } else if (
      pending &&
      !pending.moved &&
      mapMode === 'explore' &&
      showTerrainAlignDebug &&
      mapContainerRef.current
    ) {
      const rect = mapContainerRef.current.getBoundingClientRect()
      if (rect.width > 0) {
        const world = clientToWorld(event.clientX, event.clientY, rect, liveViewRef.current)

        if (prefabEditTool === 'add') {
          const next = addManualPrefab(prefabOverrideDoc, addPrefabName, world.x, world.y)
          updatePrefabOverrideDoc(next, true)
          const added = mergeBakedPlacements(data.terrainPlacements, next).find(
            (placement) =>
              placement.name === addPrefabName &&
              Math.abs(placement.anchorX - world.x) < 0.01 &&
              Math.abs(placement.anchorY - world.y) < 0.01,
          )
          if (added) {
            setSelectedPrefabKeys([prefabInstanceKey(added.name, added.anchorX, added.anchorY)])
            setSelectedGroundTileIds([])
          }
        } else if (prefabEditTool === 'addGroundTile') {
          const chunkBounds = displayTerrainPlacements
            .filter((placement) => placement.mode === 'chunkGround')
            .map((placement) => ({
              x: placement.x,
              y: placement.y,
              width: placement.width,
              height: placement.height,
            }))
          const cell = chunkGroundStorageCellFromScreen(
            world.x,
            world.y,
            chunkGroundNudgeWorldX,
            chunkGroundNudgeWorldY,
            chunkBounds,
          )
          const next = addManualGroundTile(
            prefabOverrideDoc,
            addGroundTileKey,
            cell.x,
            cell.y,
            addGroundTileCells,
          )
          updatePrefabOverrideDoc(next, true)
          const added = next.manualGroundTiles[next.manualGroundTiles.length - 1]
          if (added) {
            setSelectedGroundTileIds([added.id])
            setSelectedPrefabKeys([])
          }
        } else {
          const additive = event.ctrlKey || event.metaKey
          let hit: (typeof effectiveBakedPlacements)[number] | null = null
          let bestZ = -Infinity
          let smallestArea = Infinity
          for (const placement of effectiveBakedPlacements) {
            const draw = effectiveDrawPosition(placement, prefabOverrideDoc, prefabBakeDefault)
            const probePlacement = { ...placement, x: draw.x, y: draw.y }
            const bounds = bakedPrefabScreenBounds(data.worldBounds, probePlacement, terrainAlignment)
            if (
              world.x >= bounds.minX &&
              world.x <= bounds.maxX &&
              world.y >= bounds.minY &&
              world.y <= bounds.maxY
            ) {
              const z = prefabRenderZOrder(prefabOverrideDoc, placement)
              const area = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)
              if (z > bestZ || (z === bestZ && area < smallestArea)) {
                bestZ = z
                smallestArea = area
                hit = placement
              }
            }
          }
          if (hit) {
            selectPrefabPlacement(hit, additive)
          } else {
            let groundHit: ManualGroundTileInstance | null = null
            for (let i = prefabOverrideDoc.manualGroundTiles.length - 1; i >= 0; i -= 1) {
              const tile = prefabOverrideDoc.manualGroundTiles[i]
              const draw = groundTileDrawPosition(
                tile,
                chunkGroundNudgeWorldX,
                chunkGroundNudgeWorldY,
                prefabOverrideDoc,
              )
              if (
                world.x >= draw.x &&
                world.x <= draw.x + draw.size &&
                world.y >= draw.y &&
                world.y <= draw.y + draw.size
              ) {
                groundHit = tile
                break
              }
            }
            if (groundHit) {
              selectGroundTile(
                groundHit.id,
                additive,
                `Selected ground tile (${groundHit.cells}×${groundHit.cells})`,
              )
            } else {
              clearMapSelection()
              setPrefabPickHint('No prefab here — click directly on edge tile art, or zoom in more.')
            }
          }
        }

        if (showAlignClickMarker) {
          const probe = probeTerrainAlignment(
            world.x,
            world.y,
            displayTerrainPlacements,
            data.worldBounds,
            terrainAlignment,
            SLG_MAP_CELL_SIZE,
          )
          if (prefabEditTool === 'addGroundTile') {
            const chunkBounds = displayTerrainPlacements
              .filter((placement) => placement.mode === 'chunkGround')
              .map((placement) => ({
                x: placement.x,
                y: placement.y,
                width: placement.width,
                height: placement.height,
              }))
            const snap = chunkGroundStorageCellFromScreen(
              world.x,
              world.y,
              chunkGroundNudgeWorldX,
              chunkGroundNudgeWorldY,
              chunkBounds,
            )
            setAlignmentProbe({
              ...probe,
              gridCell: {
                x: snap.x + chunkGroundNudgeWorldX,
                y: snap.y + chunkGroundNudgeWorldY,
              },
              gridCellSize: snap.size,
            })
          } else {
            setAlignmentProbe(probe)
          }
        }
      }
    }

    dragRef.current = null
    pendingClickRef.current = null
    syncPageScrollLock()
  }

  const zoomIn = () => {
    setCamera((current) => clampCamera({ ...current, scale: current.scale * 1.25 }))
  }

  const zoomOut = () => {
    setCamera((current) => clampCamera({ ...current, scale: current.scale / 1.25 }))
  }

  const resetView = () => {
    setCamera({ scale: 1, panX: 0, panY: 0 })
  }

  const toggleKind = (kind: SinistraStructureKind) => {
    setVisibleKinds((current) => ({
      ...current,
      [kind]: !current[kind],
    }))
  }

  return (
    <Card className="relative isolate border border-red-950/50 bg-gray-900/60">
      <CardHeader className="relative z-20 space-y-3 bg-gray-900/60">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl text-red-300">Interactive Map</CardTitle>
            <p className="text-sm text-gray-400">
              Scroll to zoom, drag to pan. Use Beacon Planner to place coven fortresses and beacons, then Connect to
              chain them. Chunk terrain uses the same Y-down coordinates as the overview (only structure markers are Y-flipped).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-md border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-sm text-red-100 transition hover:bg-red-900/60"
            >
              Zoom In
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-md border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-sm text-red-100 transition hover:bg-red-900/60"
            >
              Zoom Out
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition hover:bg-gray-700"
            >
              Reset View
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            Object.keys(KIND_LABELS) as SinistraStructureKind[]
          ).map((kind) => {
            const active = visibleKinds[kind]
            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggleKind(kind)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? 'border-red-700 bg-red-950/50 text-red-100'
                    : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                {KIND_LABELS[kind]} ({data.counts[kind]})
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setShowGameArt((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showGameArt
                ? 'border-amber-700 bg-amber-950/40 text-amber-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Game Map Art
          </button>
          <button
            type="button"
            onClick={() => setShowChunkTerrain((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showChunkTerrain
                ? 'border-violet-700 bg-violet-950/40 text-violet-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Chunk Tiles (beta)
          </button>
          <label className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/90 px-3 py-1 text-xs text-gray-300">
            <span className="text-gray-500">Prefabs</span>
            <select
              value={terrainRenderMode}
              onChange={(event) => {
                const mode = event.target.value as TerrainRenderMode
                setTerrainRenderMode(mode)
                saveTerrainRenderMode(mode)
              }}
              className="max-w-[9.5rem] cursor-pointer bg-transparent text-gray-200 outline-none"
              title={TERRAIN_RENDER_MODE_INFO[terrainRenderMode].description}
            >
              {TERRAIN_RENDER_MODES.map((mode) => (
                <option key={mode} value={mode} className="bg-gray-900">
                  {TERRAIN_RENDER_MODE_INFO[mode].shortLabel}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowTerrainGrid((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showTerrainGrid
                ? 'border-cyan-700 bg-cyan-950/40 text-cyan-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Grid ({SLG_MAP_CELL_SIZE})
          </button>
          {showTerrainAlignDebug ? (
            <>
              <button
                type="button"
                disabled={!canUndoEditor}
                onClick={() => undoEditor()}
                className="rounded-full border border-gray-700 bg-gray-800/90 px-3 py-1 text-xs text-gray-300 transition hover:border-gray-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={!canRedoEditor}
                onClick={() => redoEditor()}
                className="rounded-full border border-gray-700 bg-gray-800/90 px-3 py-1 text-xs text-gray-300 transition hover:border-gray-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Redo (Ctrl+Y)"
              >
                Redo
              </button>
              <button
                type="button"
                onClick={() => setShowAlignClickMarker((current) => !current)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  showAlignClickMarker
                    ? 'border-orange-700 bg-orange-950/40 text-orange-100'
                    : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                Click marker
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={!hasBakedPrefabs('edges')}
            onClick={() => {
              patchEditorSnapshot((current) => {
                const flipped = flipAllPrefabBakeVariants(
                  current.prefabOverrideDoc,
                  current.prefabBakeDefault,
                )
                return {
                  ...current,
                  prefabOverrideDoc: flipped.doc,
                  prefabBakeDefault: flipped.globalDefault,
                }
              }, 'immediate')
            }}
            className="rounded-full border border-gray-700 bg-gray-800/90 px-3 py-1 text-xs text-gray-300 transition hover:border-teal-700/60 hover:bg-teal-950/30 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              hasBakedPrefabs('edges')
                ? 'Flip every prefab between with-tiles and without-tiles. Squares with individual overrides swap too. Click again to undo.'
                : 'Run: python scripts/bake-sinistra-terrain-prefabs.py --profile edges'
            }
          >
            Flip all tile modes
          </button>
          <span className="text-[10px] text-gray-500">
            Default: {prefabBakeDefault === 'full' ? 'with tiles' : 'no tiles'}
          </span>
          <button
            type="button"
            onClick={() => setShowTerrainAlignDebug((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showTerrainAlignDebug
                ? 'border-orange-700 bg-orange-950/40 text-orange-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Terrain Align
          </button>
          <button
            type="button"
            onClick={() => setShowRegions((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showRegions
                ? 'border-emerald-700 bg-emerald-950/40 text-emerald-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Region Blocks
          </button>
          <button
            type="button"
            onClick={() => setShowRegionLabels((current) => !current)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              showRegionLabels
                ? 'border-sky-700 bg-sky-950/40 text-sky-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Region Labels
          </button>
          <button
            type="button"
            onClick={() => {
              setMapMode((current) => {
                const next = current === 'explore' ? 'plan' : 'explore'
                if (next === 'explore') {
                  setPlannerTool('pan')
                  setConnectSource(null)
                }
                return next
              })
            }}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              mapMode === 'plan'
                ? 'border-cyan-700 bg-cyan-950/40 text-cyan-100'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            Beacon Planner
          </button>
        </div>

        {mapMode === 'plan' ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cyan-900/50 bg-cyan-950/20 px-3 py-2">
            <span className="text-xs font-medium text-cyan-200">Tool</span>
            {(
              [
                ['pan', 'Pan'],
                ['covenFortress', 'Coven Fortress'],
                ['beacon', 'Beacon'],
                ['connect', 'Connect'],
                ['erase', 'Erase'],
              ] as const
            ).map(([tool, label]) => (
              <button
                key={tool}
                type="button"
                onClick={() => {
                  setPlannerTool(tool)
                  setConnectSource(null)
                }}
                className={`rounded-md border px-2.5 py-1 text-xs transition ${
                  plannerTool === tool
                    ? 'border-cyan-600 bg-cyan-900/50 text-cyan-50'
                    : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-1 text-xs text-cyan-200/80">Coalition</span>
            {[1, 2, 3, 4, 5, 6].map((coalition) => (
              <button
                key={coalition}
                type="button"
                onClick={() => setPlannerCoalition(coalition)}
                className={`h-7 w-7 rounded-full border text-xs font-bold transition ${
                  plannerCoalition === coalition
                    ? 'border-white ring-2 ring-cyan-400/60'
                    : 'border-gray-600 opacity-80'
                }`}
                style={{
                  backgroundColor: COALITION_COLORS[coalition]?.fill,
                  color: '#0c0a0b',
                }}
                title={`Coalition ${coalition}`}
              >
                {coalition}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowPlannerGrid((current) => !current)}
              className={`rounded-md border px-2.5 py-1 text-xs transition ${
                showPlannerGrid
                  ? 'border-cyan-600 bg-cyan-900/40 text-cyan-100'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
            >
              Grid ({SLG_MAP_CELL_SIZE})
            </button>
            <button
              type="button"
              onClick={() => {
                setPlannerMarkers([])
                setConnectSource(null)
                setSelectedPlannerId(null)
              }}
              className="rounded-md border border-red-900/60 bg-red-950/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50"
            >
              Clear plan
            </button>
            {connectSource ? (
              <span className="text-xs text-amber-200">
                Link from: {connectSource.type === 'structure' ? 'structure' : 'marker'}{' '}
                {connectSource.id.slice(0, 12)}… — click a beacon to attach
              </span>
            ) : plannerTool === 'connect' ? (
              <span className="text-xs text-gray-400">
                Click parent (start, fortress, or beacon) then child beacon
              </span>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="relative z-0">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative z-0 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {showCompositeFallbackNotice
                  ? `${TERRAIN_RENDER_MODE_INFO[terrainRenderMode].shortLabel} not baked yet — showing per-prefab (current). Run: ${TERRAIN_RENDER_MODE_INFO[terrainRenderMode].bakeCommand ?? 'npm run bake:sinistra-composite'}`
                  : showOverviewLayer
                  ? showChunkTerrain
                    ? 'Overview — zoom in for chunk tiles (partial coverage).'
                    : 'Overview map — use for beacon / fortress planning.'
                  : showTerrainLayer
                    ? showPrefabLayer
                    ? effectivePrefabRenderMode === 'individual'
                      ? prefabBakeDefault === 'edges'
                        ? 'Terrain detail — chunk ground + edge art only (no prefab tiles). Editable per-prefab mode.'
                        : 'Terrain detail — chunk ground + full prefabs. Editable per-prefab mode.'
                      : `Terrain detail — ${TERRAIN_RENDER_MODE_INFO[effectivePrefabRenderMode].shortLabel} (read-only preview). Switch Prefabs to Per-prefab to edit.`
                    : 'Zoom in for chunk ground and prefabs.'
                    : showGameArt
                      ? 'Map art hidden at this zoom — zoom in or turn on Game Map Art.'
                      : 'Map art off — turn on Game Map Art above.'}
              </span>
              <span>Zoom {zoomPercent}%</span>
            </div>

            <div className="relative z-0">
            <div
              ref={mapContainerRef}
              data-sinistra-map
              className="relative aspect-square overflow-hidden overscroll-none rounded-xl border border-red-950/60 bg-[#080607] touch-none select-none [overscroll-behavior:contain]"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={handlePointerUp}
            >
              <svg
                ref={svgRef}
                viewBox={viewBoxAttribute(safeViewBox)}
                className={`h-full w-full ${prefabPickEnabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
                style={{ pointerEvents: prefabPickEnabled ? 'auto' : 'none' }}
              >
                <rect
                  x={safeViewBox.x - MAP_VIEW_PADDING}
                  y={safeViewBox.y - MAP_VIEW_PADDING}
                  width={safeViewBox.size + MAP_VIEW_PADDING * 2}
                  height={safeViewBox.size + MAP_VIEW_PADDING * 2}
                  fill="#120b0d"
                />

                {showGameArt && showOverviewLayer ? (
                  <image
                    href={buildRawAssetUrl(data.overview.path, {
                      maxPx: lodMaxPx(lodViewSize, 'overview'),
                    })}
                    x={data.overview.worldX}
                    y={data.overview.worldY}
                    width={data.overview.worldWidth}
                    height={data.overview.worldHeight}
                    preserveAspectRatio="none"
                  />
                ) : null}

                {showGameArt && showChunkTerrain ? (
                  <g opacity={showTerrainLayer ? 1 : 0}>
                    {visibleTerrain
                      .filter((placement) => placement.mode === 'fill')
                      .map((placement, index) =>
                        renderTerrainPlacement(
                          placement,
                          index,
                          viewSize,
                          chunkGroundNudgeWorldX,
                          chunkGroundNudgeWorldY,
                          prefabOverrideDoc,
                          selectedPrefabKeys,
                          false,
                          null,
                          prefabBakeDefault,
                          prefabAssetVersion,
                        ),
                      )}
                    {showChunkLayer
                      ? visibleTerrain
                          .filter((placement) => placement.mode === 'chunkGround')
                          .map((placement, index) =>
                            renderChunkGround(
                              placement,
                              index,
                              lodMaxPx(lodViewSize, 'chunk'),
                              chunkGroundNudgeWorldX,
                              chunkGroundNudgeWorldY,
                            ),
                          )
                      : null}
                    {showTerrainLayer && prefabOverrideDoc.manualGroundTiles.some((tile) => !tile.hidden)
                      ? prefabOverrideDoc.manualGroundTiles
                          .filter((tile) => !tile.hidden)
                          .map((tile) =>
                          renderManualGroundTile(
                            tile,
                            lodMaxPx(lodViewSize, 'chunk'),
                            chunkGroundNudgeWorldX,
                            chunkGroundNudgeWorldY,
                            prefabOverrideDoc,
                            selectedGroundTileIds,
                          ),
                        )
                      : null}
                    {showPrefabLayer ? (
                      <g transform={`translate(${prefabNudgeWorldX} 0)`}>
                        <g transform={slgPrefabLayerTransform(data.worldBounds, prefabNudgeWorldY)}>
                          {useIndividualPrefabs ? (
                            <g data-global-prefab-squish={terrainAlignment.prefabScaleY}>
                              {visibleTerrain
                                .filter((placement) => placement.mode === 'baked')
                                .map((placement, index) =>
                                  renderTerrainBaked(
                                    placement,
                                    index,
                                    lodMaxPx(lodViewSize, 'prefab'),
                                    prefabOverrideDoc,
                                    selectedPrefabKeys,
                                    prefabPickEnabled,
                                    selectPrefabPlacement,
                                    prefabBakeDefault,
                                    prefabAssetVersion,
                                    terrainAlignment.prefabScaleY,
                                  ),
                                )}
                            </g>
                          ) : effectivePrefabRenderMode === 'chunkComposite' ? (
                            visibleChunkComposites.map((entry) =>
                              renderChunkComposite(
                                entry,
                                lodMaxPx(lodViewSize, 'prefab'),
                                0,
                                0,
                              ),
                            )
                          ) : effectivePrefabRenderMode === 'fullComposite' && fullCompositeEntry ? (
                            renderFullComposite(
                              fullCompositeEntry,
                              lodMaxPx(lodViewSize, 'prefab'),
                              0,
                              0,
                            )
                          ) : effectivePrefabRenderMode === 'spriteManifest' ? (
                            <g data-global-prefab-squish={terrainAlignment.prefabScaleY}>
                              {visibleSpriteManifest.map((sprite, index) =>
                                renderSpriteManifestEntry(
                                  sprite,
                                  index,
                                  lodMaxPx(lodViewSize, 'prefab'),
                                  terrainAlignment.prefabScaleY,
                                ),
                              )}
                            </g>
                          ) : null}
                        </g>
                      </g>
                    ) : null}
                  </g>
                ) : null}

                {showTerrainGrid && showTerrainLayer ? (
                  <g className="pointer-events-none" opacity={0.35}>
                    {terrainAlignGridLines.vertical.map((x) => (
                      <line
                        key={`align-grid-v-${x}`}
                        x1={x}
                        y1={viewBox.y}
                        x2={x}
                        y2={viewBox.y + viewBox.size}
                        stroke="#fb923c"
                        strokeWidth={viewSize > 1200 ? 2 : 1}
                      />
                    ))}
                    {terrainAlignGridLines.horizontal.map((y) => (
                      <line
                        key={`align-grid-h-${y}`}
                        x1={viewBox.x}
                        y1={y}
                        x2={viewBox.x + viewBox.size}
                        y2={y}
                        stroke="#fb923c"
                        strokeWidth={viewSize > 1200 ? 2 : 1}
                      />
                    ))}
                  </g>
                ) : null}

                {showTerrainAlignDebug && showTerrainGrid && showTerrainLayer ? (
                  <g className="pointer-events-none" opacity={0.35}>
                    {visibleTerrain
                      .filter((placement) => placement.mode === 'chunkGround')
                      .slice(0, 24)
                      .map((placement, index) => {
                        const screen = chunkGroundScreenBounds(placement, terrainAlignment)
                        return (
                          <rect
                            key={`align-chunk-${placement.name}-${index}`}
                            x={screen.minX}
                            y={screen.minY}
                            width={screen.maxX - screen.minX}
                            height={screen.maxY - screen.minY}
                            fill="none"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                          />
                        )
                      })}
                    {visibleTerrain
                      .filter((placement) => placement.mode === 'baked')
                      .slice(0, 24)
                      .map((placement, index) => {
                        if (!useIndividualPrefabs) {
                          return null
                        }
                        const draw = effectiveDrawPosition(placement, prefabOverrideDoc, prefabBakeDefault)
                        const probePlacement = { ...placement, x: draw.x, y: draw.y }
                        const screen = bakedPrefabScreenBounds(
                          data.worldBounds,
                          probePlacement,
                          terrainAlignment,
                        )
                        const anchor = bakedPrefabAnchorScreen(
                          data.worldBounds,
                          probePlacement,
                          terrainAlignment,
                        )
                        return (
                          <g key={`align-prefab-${placement.name}-${index}`}>
                            <rect
                              x={screen.minX}
                              y={screen.minY}
                              width={screen.maxX - screen.minX}
                              height={screen.maxY - screen.minY}
                              fill="none"
                              stroke="#34d399"
                              strokeWidth={2}
                            />
                            <path
                              d={`M ${anchor.x - 6} ${anchor.y} H ${anchor.x + 6} M ${anchor.x} ${anchor.y - 6} V ${anchor.y + 6}`}
                              stroke="#fde047"
                              strokeWidth={2}
                            />
                          </g>
                        )
                      })}
                  </g>
                ) : null}

                {showTerrainAlignDebug && showTerrainLayer && showAlignClickMarker && alignmentProbe ? (
                  <g className="pointer-events-none" opacity={0.35}>
                        <circle
                          cx={alignmentProbe.worldX}
                          cy={alignmentProbe.worldY}
                          r={8}
                          fill="#fb923c"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <rect
                          x={alignmentProbe.gridCell.x}
                          y={alignmentProbe.gridCell.y}
                          width={alignmentProbe.gridCellSize}
                          height={alignmentProbe.gridCellSize}
                          fill="none"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                  </g>
                ) : null}

                {mapMode === 'plan' && showPlannerGrid ? (
                  <g className="pointer-events-none" opacity={0.2}>
                    {plannerGridLines.vertical.map((x) => (
                      <line
                        key={`grid-v-${x}`}
                        x1={x}
                        y1={viewBox.y}
                        x2={x}
                        y2={viewBox.y + viewBox.size}
                        stroke="#67e8f9"
                        strokeWidth={viewSize > 1200 ? 2 : 1}
                      />
                    ))}
                    {plannerGridLines.horizontal.map((y) => (
                      <line
                        key={`grid-h-${y}`}
                        x1={viewBox.x}
                        y1={y}
                        x2={viewBox.x + viewBox.size}
                        y2={y}
                        stroke="#67e8f9"
                        strokeWidth={viewSize > 1200 ? 2 : 1}
                      />
                    ))}
                  </g>
                ) : null}

                {plannerLinks.map((link) => {
                  const colors = COALITION_COLORS[link.coalition] ?? COALITION_COLORS[1]
                  return (
                    <line
                      key={`link-${link.id}`}
                      x1={link.from.x}
                      y1={link.from.y}
                      x2={link.to.x}
                      y2={link.to.y}
                      stroke={colors.stroke}
                      strokeWidth={4}
                      strokeDasharray="16 10"
                      opacity={0.85}
                      className="pointer-events-none"
                    />
                  )
                })}

                {showRegions
                  ? data.areas.map((area) => (
                      <g key={area.id}>
                        {area.rects.map((rect, index) => {
                          const displayRect = flipSlgRectY(data.worldBounds, rect)

                          return (
                            <rect
                              key={`${area.id}-${index}`}
                              x={displayRect.x}
                              y={displayRect.y}
                              width={displayRect.w}
                              height={displayRect.h}
                              fill={area.fill}
                              stroke={area.stroke}
                              strokeOpacity={0.4}
                              strokeWidth={6}
                              rx={10}
                            />
                          )
                        })}
                      </g>
                    ))
                  : null}

                {filteredStructures.map((structure) => {
                  const selected = structure.id === selectedStructure?.id
                  const markerY = flipSlgY(data.worldBounds, structure.y)
                  const isConnectSource =
                    connectSource?.type === 'structure' && connectSource.id === structure.id

                  return (
                    <g
                      key={structure.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleStructurePlannerClick(structure)
                      }}
                      className="cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {isConnectSource ? (
                        <circle
                          cx={structure.x}
                          cy={markerY}
                          r={KIND_STYLES[structure.kind].markerSize}
                          fill="none"
                          stroke="#fff"
                          strokeWidth={4}
                          strokeDasharray="8 6"
                        />
                      ) : null}
                      {renderMarker(structure, selected, structure.x, markerY)}
                    </g>
                  )
                })}

                {plannerMarkers.map((marker) => (
                  <g
                    key={marker.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePlannerMarkerClick(marker)
                    }}
                    className="cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {renderPlannerMarker(
                      marker,
                      marker.id === selectedPlannerId,
                      connectSource,
                    )}
                  </g>
                ))}

                {showRegionLabels
                  ? data.areas.map((area) => (
                      <text
                        key={`label-${area.id}`}
                        x={area.center.x}
                        y={flipSlgY(data.worldBounds, area.center.y)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white pointer-events-none"
                        style={{
                          fontSize: viewBox.size > 1800 ? '48px' : '34px',
                          fontWeight: 700,
                          opacity: 0.9,
                        }}
                      >
                        {area.id}
                      </text>
                    ))
                  : null}

                {filteredStructures.map((structure) => {
                  const markerY = flipSlgY(data.worldBounds, structure.y)

                  return (
                  <text
                    key={`${structure.id}-label`}
                    x={structure.x}
                    y={markerY + 4}
                    textAnchor="middle"
                    className="pointer-events-none"
                    style={{
                      fill: '#080607',
                      fontSize: `${Math.max(KIND_STYLES[structure.kind].markerSize * 0.7, 10)}px`,
                      fontWeight: 800,
                    }}
                  >
                    {structure.shortLabel}
                  </text>
                  )
                })}
              </svg>

              <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-red-950/50 bg-black/60 px-3 py-2 text-xs text-gray-300">
                <p className="font-semibold text-red-200">Sinistra</p>
                <p className="text-gray-400">
                  {showOverviewLayer ? 'Overview' : showTerrainLayer ? 'Terrain detail' : 'Markers'}
                </p>
              </div>
            </div>

              {showTerrainAlignDebug ? (
                <div
                  data-terrain-align-panel
                  className={`pointer-events-auto absolute right-3 top-3 z-30 touch-auto select-auto rounded-lg border border-orange-700/80 bg-black/95 text-xs shadow-lg ${
                    terrainAlignPanelOpen ? 'w-[min(calc(100%-1.5rem),300px)] p-3' : 'p-2'
                  }`}
                  style={{ touchAction: 'auto' }}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-orange-200">Terrain Align</p>
                    <button
                      type="button"
                      onClick={() => setTerrainAlignPanelOpen((open) => !open)}
                      className="shrink-0 rounded border border-orange-800/60 bg-orange-950/40 p-1 text-orange-100 hover:bg-orange-900/50"
                      aria-expanded={terrainAlignPanelOpen}
                      title={terrainAlignPanelOpen ? 'Collapse panel' : 'Expand panel'}
                    >
                      {terrainAlignPanelOpen ? (
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      )}
                      <span className="sr-only">
                        {terrainAlignPanelOpen ? 'Collapse terrain align panel' : 'Expand terrain align panel'}
                      </span>
                    </button>
                  </div>
                  {terrainAlignPanelOpen ? (
                    <>
                      <p className="mt-1 text-gray-400">
                        Use <strong className="text-white">− / +</strong> or drag the sliders. Map drag is outside this
                        box.
                      </p>
                      {!showPrefabLayer ? (
                        <p className="mt-2 rounded border border-amber-800/50 bg-amber-950/40 px-2 py-1 text-amber-100">
                          Zoom in more (Chunk Tiles on) to see and click prefabs.
                        </p>
                      ) : prefabEditTool === 'select' ? (
                        <p className="mt-2 rounded border border-cyan-800/50 bg-cyan-950/40 px-2 py-1 text-cyan-100">
                          Select mode: click <strong>on</strong> a prefab tile (edge art), not empty map.
                        </p>
                      ) : null}
                      {prefabPickHint ? (
                        <p className="mt-2 rounded border border-white/10 bg-black/50 px-2 py-1 text-gray-200">
                          {prefabPickHint}
                        </p>
                      ) : null}
                      <TerrainAlignmentSliders
                        terrainAlignment={terrainAlignment}
                        onChange={updateTerrainAlignment}
                        compact
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-red-950/50 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-red-400/80">Selection</p>
              {selectedStructure ? (
                <div className="mt-3 space-y-2">
                  <h3 className="text-lg font-semibold text-white">{selectedStructure.title}</h3>
                  <p className="text-sm text-gray-300">
                    Region {selectedStructure.regionId}
                    {selectedStructure.level > 0 ? ` • Level ${selectedStructure.level}` : ''}
                  </p>
                  <p className="text-sm text-gray-400">
                    Map position ({Math.round(selectedStructure.x)}, {Math.round(selectedStructure.y)})
                  </p>
                  {selectedStructure.detail ? (
                    <p className="text-sm text-gray-300">{selectedStructure.detail}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-400">Click a marker to inspect it.</p>
              )}
            </div>

            {mapMode === 'plan' ? (
              <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-400/80">Beacon plan</p>
                <p className="mt-2 text-xs text-gray-400">
                  One coven fortress per coalition. Beacons snap to a {SLG_MAP_CELL_SIZE}-unit grid. Connect chains from
                  coalition starts, fortresses, or other beacons.
                </p>
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                  {plannerMarkers.length === 0 ? (
                    <p className="text-gray-500">No markers yet — pick a tool and click the map.</p>
                  ) : (
                    plannerMarkers.map((marker) => (
                      <button
                        key={marker.id}
                        type="button"
                        onClick={() => setSelectedPlannerId(marker.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                          marker.id === selectedPlannerId
                            ? 'border-cyan-600 bg-cyan-900/30'
                            : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="text-gray-100">
                          {marker.label}{' '}
                          <span className="text-gray-500">
                            C{marker.coalition} •{' '}
                            {marker.kind === 'covenFortress' ? 'Fortress' : 'Beacon'}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {marker.parent ? 'linked' : 'free'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {showTerrainAlignDebug ? (
              <TerrainPrefabEditorPanel
                allMapPlacements={data.terrainPlacements}
                visiblePlacements={effectiveBakedPlacements}
                overrideDoc={prefabOverrideDoc}
                selectedKeys={selectedPrefabKeys}
                selectedGroundTileIds={selectedGroundTileIds}
                selectedGroupId={selectedGroupId}
                onSelectedGroupIdChange={setSelectedGroupId}
                editTool={prefabEditTool}
                addPrefabName={addPrefabName}
                terrainAlignment={terrainAlignment}
                prefabBakeDefault={prefabBakeDefault}
                addGroundTileKey={addGroundTileKey}
                addGroundTileCells={addGroundTileCells}
                onAddGroundTileKeyChange={setAddGroundTileKey}
                onAddGroundTileCellsChange={setAddGroundTileCells}
                onOverrideDocChange={updatePrefabOverrideDoc}
                onSelectedKeysChange={setSelectedPrefabKeys}
                onSelectedGroundTileIdsChange={setSelectedGroundTileIds}
                onEditToolChange={setPrefabEditTool}
                onAddPrefabNameChange={setAddPrefabName}
                onSelectModeHint={() =>
                  setPrefabPickHint(
                    useIndividualPrefabs
                      ? 'Click a prefab to select. Ctrl+click to add more. Cyan outline = selected.'
                      : 'Switch Prefabs to Per-prefab to select and edit individual placements.',
                  )
                }
                showMoveAllPanel={showMoveAllPanel}
                onShowMoveAllPanelChange={setShowMoveAllPanel}
                onImportBackup={importOverrideBackup}
              />
            ) : null}

            {showTerrainAlignDebug && !useIndividualPrefabs ? (
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-xs text-amber-100/90">
                Prefab editing is disabled in{' '}
                <strong>{TERRAIN_RENDER_MODE_INFO[terrainRenderMode].shortLabel}</strong> mode. Select{' '}
                <strong>Per-prefab</strong> in the Prefabs dropdown to restore the original editable setup
                (overrides, groups, nudge sliders).
              </div>
            ) : null}

            {showTerrainAlignDebug ? (
              <div className="rounded-xl border border-orange-900/50 bg-orange-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-400/80">Layer alignment</p>
                <p className="mt-2 text-xs text-gray-400">
                  Prefabs use <code className="text-orange-200">terrains[].position</code> from SLGMapChuck*.json
                  as the anchor (yellow +). The green box is the baked PNG offset by bake padding. Tune X/Y if
                  layers drift.
                </p>
                <TerrainAlignmentSliders
                  terrainAlignment={terrainAlignment}
                  onChange={updateTerrainAlignment}
                />
                  <p className="text-xs text-gray-500">
                    Mirror axis Y = {Math.round(data.worldBounds.minY + data.worldBounds.maxY)}.
                  </p>
                  {alignmentProbe ? (
                    <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-gray-300">
                      <p>
                        Click ({Math.round(alignmentProbe.worldX)}, {Math.round(alignmentProbe.worldY)}) → cell (
                        {alignmentProbe.gridCell.x}, {alignmentProbe.gridCell.y})
                      </p>
                      <p className="mt-1 text-gray-400">
                        Chunk hits: {alignmentProbe.chunkGroundHits.length || 'none'}
                        {alignmentProbe.chunkGroundHits[0]
                          ? ` (${alignmentProbe.chunkGroundHits[0].name}, rawY=${alignmentProbe.chunkGroundHits[0].rawY})`
                          : ''}
                      </p>
                      <p className="text-gray-400">
                        Prefab hits: {alignmentProbe.prefabHits.length || 'none'}
                        {alignmentProbe.prefabHits[0]
                          ? ` (${alignmentProbe.prefabHits[0].name}, anchor=(${alignmentProbe.prefabHits[0].anchorX.toFixed(1)}, ${alignmentProbe.prefabHits[0].anchorY.toFixed(1)}), draw=(${alignmentProbe.prefabHits[0].drawX.toFixed(1)}, ${alignmentProbe.prefabHits[0].drawY.toFixed(1)}))`
                          : ''}
                      </p>
                      {alignmentProbe.prefabHits[0] ? (
                        <p className="text-gray-500">
                          Anchor − draw = (
                          {(alignmentProbe.prefabHits[0].anchorX - alignmentProbe.prefabHits[0].drawX).toFixed(2)},{' '}
                          {(alignmentProbe.prefabHits[0].anchorY - alignmentProbe.prefabHits[0].drawY).toFixed(2)})
                          — should match baked originOffset
                        </p>
                      ) : null}
                      {alignmentProbe.nearestPrefab &&
                      alignmentProbe.chunkGroundHits[0] &&
                      alignmentProbe.prefabHits.length === 0 ? (
                        <p className="mt-2 text-orange-200">
                          Nearest prefab {alignmentProbe.nearestPrefab.name}: screen gap ≈{' '}
                          {Math.round(
                            alignmentProbe.nearestPrefab.screenTop -
                              chunkGroundScreenY(
                                alignmentProbe.chunkGroundHits[0].rawY,
                                terrainAlignment.chunkGroundCells,
                              ),
                          )}{' '}
                          world units (
                          {(
                            (alignmentProbe.nearestPrefab.screenTop -
                              chunkGroundScreenY(
                                alignmentProbe.chunkGroundHits[0].rawY,
                                terrainAlignment.chunkGroundCells,
                              )) /
                            SLG_MAP_CELL_SIZE
                          ).toFixed(1)}{' '}
                          cells)
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Click terrain while this panel is open to inspect.</p>
                  )}
              </div>
            ) : null}

            <div className="rounded-xl border border-red-950/50 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-red-400/80">Legend</p>
              <div className="mt-3 space-y-2">
                {(Object.keys(KIND_LABELS) as SinistraStructureKind[]).map((kind) => (
                  <div key={kind} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-200">
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{
                          backgroundColor: KIND_STYLES[kind].fill,
                          borderColor: KIND_STYLES[kind].stroke,
                        }}
                      />
                      <span>{KIND_LABELS[kind]}</span>
                    </div>
                    <span className="text-gray-400">{data.counts[kind]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-red-950/50 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-red-400/80">Region levels</p>
              <div className="mt-3 space-y-2 text-sm text-gray-300">
                {data.areas.slice(0, 6).map((area) => (
                  <div key={area.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                    <p className="font-medium text-gray-100">
                      {area.label}
                      {area.isConfederation ? ' • Confederation' : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      PvE {area.pveRange[0]}-{area.pveRange[1]} • GvE {area.gveRange[0]}-{area.gveRange[1]} • Resources{' '}
                      {area.resourceRange[0]}-{area.resourceRange[1]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
