'use client'

import { useRef, useState } from 'react'
import { SLG_CHUNK_GROUND_CELL_SIZE, SLG_MAP_CELL_SIZE } from '@/lib/sinistra/constants'
import { hasPlotTiles, listPlotTileKeys, getPlotTile } from '@/lib/sinistra/plotTileManifest'
import {
  addMemberToAlignmentGroup,
  clearPrefabOverride,
  createAlignmentGroup,
  flipInstancePrefabBakeVariant,
  formatOverrideExportJson,
  importOverrideBackupJson,
  prefabInstanceKey,
  prefabRenderZOrder,
  removeAlignmentGroup,
  hideAlignmentGroup,
  deleteAlignmentGroup,
  removeManualGroundTile,
  removeManualPrefab,
  resolvePrefabBakeVariant,
  setPrefabBakeVariantOverride,
  updateAlignmentGroup,
  updateGlobalMove,
  globalMoveDelta,
  updateManualGroundTile,
  upsertPrefabOverride,
  type AlignmentEditorGroup,
  type ManualGroundTileInstance,
  type PrefabOverrideDocument,
  type PrefabRotationOverride,
  type PrefabInstanceOverride,
  type OverrideBackupImport,
} from '@/lib/sinistra/prefabPlacementOverrides'
import { listBakedPrefabNames, hasBakedPrefabs, type PrefabBakeVariant } from '@/lib/sinistra/prefabManifest'
import type { TerrainAlignmentOffsets } from '@/lib/sinistra/terrainAlignment'
import type { SinistraTerrainPlacement } from '@/lib/sinistra/types'

const PREFAB_NAMES = listBakedPrefabNames()

const PREFAB_NUDGE_MIN = -320
const PREFAB_NUDGE_MAX = 320
const COARSE_NUDGE_SLIDER_STEP = 2
const COARSE_NUDGE_FINE_STEP = 1
const FINE_NUDGE_SLIDER_STEP = 0.5
const FINE_NUDGE_INPUT_STEP = 0.25
const FINE_NUDGE_STORAGE_KEY = 'sinistra-fine-nudge-v1'

function formatNudgeStep(step: number): string {
  return Number.isInteger(step) ? String(step) : String(step)
}

function PrefabDeltaSlider({
  label,
  value,
  colorClass,
  sliderStep,
  inputStep,
  onChange,
}: {
  label: string
  value: number
  colorClass: string
  sliderStep: number
  inputStep: number
  onChange: (next: number) => void
}) {
  const sliderMin = Math.min(PREFAB_NUDGE_MIN, value - SLG_MAP_CELL_SIZE)
  const sliderMax = Math.max(PREFAB_NUDGE_MAX, value + SLG_MAP_CELL_SIZE)
  const sliderValue = Math.min(sliderMax, Math.max(sliderMin, value))

  return (
    <div className="space-y-1">
      <span className={`text-[11px] font-medium ${colorClass}`}>{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(value - sliderStep)}
          className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
          title={`−${formatNudgeStep(sliderStep)}u`}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={sliderValue}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          className="min-w-0 flex-1 touch-auto accent-current"
          style={{ pointerEvents: 'auto', touchAction: 'auto' }}
        />
        <button
          type="button"
          onClick={() => onChange(value + sliderStep)}
          className="h-7 w-7 shrink-0 rounded border border-gray-600 bg-gray-800 text-xs text-gray-100 hover:bg-gray-700"
          title={`+${formatNudgeStep(sliderStep)}u`}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      <label className="flex items-center gap-1 text-[11px] text-gray-400">
        world u
        <input
          type="number"
          step={inputStep}
          value={value}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            if (Number.isFinite(parsed)) {
              onChange(parsed)
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded border border-gray-600 bg-gray-900 px-1.5 py-0.5 text-right text-[11px] text-gray-100"
        />
      </label>
    </div>
  )
}

export type PrefabEditTool = 'select' | 'add' | 'addGroundTile'

const PLOT_TILE_KEYS = listPlotTileKeys()

type BakedPlacement = Extract<SinistraTerrainPlacement, { mode: 'baked' }>

function findPlacementByKey(
  placements: BakedPlacement[],
  key: string | null,
): BakedPlacement | null {
  if (!key) {
    return null
  }
  return (
    placements.find(
      (placement) => prefabInstanceKey(placement.name, placement.anchorX, placement.anchorY) === key,
    ) ?? null
  )
}

function PrefabRotationButtons({
  value,
  onChange,
}: {
  value: PrefabRotationOverride
  onChange: (rotation: PrefabRotationOverride) => void
}) {
  const options: Array<{ id: PrefabRotationOverride; label: string }> = [
    { id: 'default', label: 'Auto' },
    { id: 'none', label: 'None' },
    { id: 'cw90', label: 'CW' },
    { id: 'ccw90', label: 'CCW' },
    { id: 'flipY', label: 'Flip Y' },
    { id: '180', label: '180°' },
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded border px-2 py-0.5 text-[10px] transition ${
            value === option.id
              ? 'border-emerald-500 bg-emerald-900/50 text-emerald-100'
              : 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function TerrainPrefabEditorPanel({
  allMapPlacements,
  visiblePlacements,
  overrideDoc,
  selectedKeys,
  selectedGroundTileIds,
  selectedGroupId,
  editTool,
  addPrefabName,
  terrainAlignment,
  prefabBakeDefault,
  addGroundTileKey,
  addGroundTileCells,
  onAddGroundTileKeyChange,
  onAddGroundTileCellsChange,
  onOverrideDocChange,
  onSelectedKeysChange,
  onSelectedGroundTileIdsChange,
  onSelectedGroupIdChange,
  onEditToolChange,
  onAddPrefabNameChange,
  onSelectModeHint,
  showMoveAllPanel,
  onShowMoveAllPanelChange,
  onImportBackup,
}: {
  allMapPlacements: SinistraTerrainPlacement[]
  visiblePlacements: BakedPlacement[]
  overrideDoc: PrefabOverrideDocument
  selectedKeys: string[]
  selectedGroundTileIds: string[]
  selectedGroupId: string | null
  editTool: PrefabEditTool
  addPrefabName: string
  terrainAlignment: TerrainAlignmentOffsets
  prefabBakeDefault: PrefabBakeVariant
  addGroundTileKey: string
  addGroundTileCells: number
  onAddGroundTileKeyChange: (key: string) => void
  onAddGroundTileCellsChange: (cells: number) => void
  onOverrideDocChange: (doc: PrefabOverrideDocument, immediate?: boolean) => void
  onSelectedKeysChange: (keys: string[]) => void
  onSelectedGroundTileIdsChange: (ids: string[]) => void
  onSelectedGroupIdChange: (id: string | null) => void
  onEditToolChange: (tool: PrefabEditTool) => void
  onAddPrefabNameChange: (name: string) => void
  onSelectModeHint?: () => void
  showMoveAllPanel: boolean
  onShowMoveAllPanelChange: (show: boolean) => void
  onImportBackup: (
    doc: PrefabOverrideDocument,
    layerAlignment: OverrideBackupImport['layerAlignment'],
  ) => void
}) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [fineNudge, setFineNudge] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    try {
      return window.localStorage.getItem(FINE_NUDGE_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const nudgeSliderStep = fineNudge ? FINE_NUDGE_SLIDER_STEP : COARSE_NUDGE_SLIDER_STEP
  const nudgeFineStep = fineNudge ? FINE_NUDGE_INPUT_STEP : COARSE_NUDGE_FINE_STEP
  const nudgeStepProps = { sliderStep: nudgeSliderStep, inputStep: nudgeFineStep }
  const primarySelectedKey = selectedKeys[selectedKeys.length - 1] ?? null
  const selected = findPlacementByKey(visiblePlacements, primarySelectedKey)
  const globalMove = globalMoveDelta(overrideDoc)
  const selectedGroundTile =
    selectedGroundTileIds.length === 1
      ? (overrideDoc.manualGroundTiles.find((tile) => tile.id === selectedGroundTileIds[0]) ?? null)
      : null
  const selectedGroup =
    overrideDoc.groups.find((group) => group.id === selectedGroupId) ?? null
  const selectedOverride = selected
    ? overrideDoc.overrides[prefabInstanceKey(selected.name, selected.anchorX, selected.anchorY)] ?? {
        deltaX: 0,
        deltaY: 0,
        rotation: 'default' as const,
        zOrder: 0,
      }
    : null

  const selectedZOrder = selectedOverride?.zOrder ?? 0
  const selectedEffectiveBakeVariant = selected
    ? resolvePrefabBakeVariant(overrideDoc, selected, prefabBakeDefault)
    : null
  const selectedExplicitBakeVariant = selectedOverride?.bakeVariant ?? null

  const maxVisibleZOrder = visiblePlacements.reduce(
    (max, placement) => Math.max(max, prefabRenderZOrder(overrideDoc, placement)),
    0,
  )
  const minVisibleZOrder = visiblePlacements.reduce(
    (min, placement) => Math.min(min, prefabRenderZOrder(overrideDoc, placement)),
    0,
  )

  const patchSelected = (patch: Partial<PrefabInstanceOverride>) => {
    if (!selected) {
      return
    }
    onOverrideDocChange(upsertPrefabOverride(overrideDoc, selected, patch))
  }

  const replaceOverrideDoc = (doc: PrefabOverrideDocument, immediate = false) => {
    onOverrideDocChange(doc, immediate)
  }

  const buildExportJson = () =>
    formatOverrideExportJson(allMapPlacements, overrideDoc, {
      chunkGroundCells: terrainAlignment.chunkGroundCells,
      chunkGroundCellsX: terrainAlignment.chunkGroundCellsX,
      prefabCells: terrainAlignment.prefabCells,
      prefabCellsX: terrainAlignment.prefabCellsX,
      prefabScaleY: terrainAlignment.prefabScaleY,
    })

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    const result = importOverrideBackupJson(text)
    if (!result.ok) {
      window.alert(result.error)
      return
    }
    const { doc, layerAlignment } = result.data
    const tileCount = doc.manualGroundTiles.length
    const overrideCount = Object.keys(doc.overrides).length
    const groupCount = doc.groups.length
    if (
      !window.confirm(
        `Restore backup?\n\n${overrideCount} prefab override(s)\n${tileCount} ground tile(s)\n${groupCount} group(s)\n\nThis replaces your current overrides.`,
      )
    ) {
      return
    }
    onImportBackup(doc, layerAlignment)
    onSelectedKeysChange([])
    onSelectedGroundTileIdsChange([])
    onSelectedGroupIdChange(null)
  }

  const hasSelection = selectedKeys.length > 0 || selectedGroundTileIds.length > 0

  const createGroupFromSelection = () => {
    if (!hasSelection) {
      return
    }
    const next = createAlignmentGroup(
      overrideDoc,
      `Group ${overrideDoc.groups.length + 1}`,
      selectedKeys,
      selectedGroundTileIds,
    )
    onOverrideDocChange(next, true)
    const created = next.groups[next.groups.length - 1]
    if (created) {
      onSelectedGroupIdChange(created.id)
    }
  }

  const addSelectionToGroup = (groupId: string) => {
    let next = overrideDoc
    for (const prefabKey of selectedKeys) {
      next = addMemberToAlignmentGroup(next, groupId, { prefabKey })
    }
    for (const groundTileId of selectedGroundTileIds) {
      next = addMemberToAlignmentGroup(next, groupId, { groundTileId })
    }
    if (next !== overrideDoc) {
      onOverrideDocChange(next, true)
      onSelectedGroupIdChange(groupId)
    }
  }

  const renderGroupSummary = (group: AlignmentEditorGroup) => {
    const parts: string[] = []
    if (group.prefabKeys.length > 0) {
      parts.push(`${group.prefabKeys.length} prefab${group.prefabKeys.length === 1 ? '' : 's'}`)
    }
    if (group.groundTileIds.length > 0) {
      parts.push(`${group.groundTileIds.length} ground tile${group.groundTileIds.length === 1 ? '' : 's'}`)
    }
    return parts.join(' · ') || 'empty'
  }

  const hiddenEntries = Object.entries(overrideDoc.overrides).filter(([, value]) => value.hidden)
  const hiddenGroundTiles = overrideDoc.manualGroundTiles.filter((tile) => tile.hidden)

  const dismissGroup = (groupId: string) => {
    if (selectedGroupId === groupId) {
      onSelectedGroupIdChange(null)
    }
  }

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4" data-prefab-editor-panel>
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Per-prefab editor</p>
      <p className="mt-2 text-xs text-gray-400">
        Select a prefab to nudge/rotate individually, or add new ones. Export JSON when done and send it
        back to bake fixes into the codebase.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ['select', 'Select'],
            ['add', 'Add prefab'],
            ...(hasPlotTiles() ? [['addGroundTile', 'Add ground tile'] as const] : []),
          ] as const
        ).map(([tool, label]) => (
          <button
            key={tool}
            type="button"
            onClick={() => {
              onEditToolChange(tool)
              if (tool === 'select') {
                onSelectModeHint?.()
              }
            }}
            className={`rounded-md border px-2.5 py-1 text-xs transition ${
              editTool === tool
                ? 'border-emerald-600 bg-emerald-900/50 text-emerald-50'
                : 'border-gray-700 bg-gray-800 text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-gray-400">
        <input
          type="checkbox"
          checked={fineNudge}
          onChange={(event) => {
            const next = event.target.checked
            setFineNudge(next)
            try {
              window.localStorage.setItem(FINE_NUDGE_STORAGE_KEY, next ? '1' : '0')
            } catch {
              // ignore
            }
          }}
          className="rounded border-gray-600"
        />
        Fine nudge (±{FINE_NUDGE_SLIDER_STEP}u slider / ±{FINE_NUDGE_INPUT_STEP}u steps)
      </label>

      {editTool === 'add' ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-gray-300">
            Prefab to add
            <select
              value={addPrefabName}
              onChange={(event) => onAddPrefabNameChange(event.target.value)}
              className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-xs text-gray-100"
            >
              {PREFAB_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-emerald-200/80">Click the map to place at that anchor position.</p>
        </div>
      ) : editTool === 'addGroundTile' ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-gray-300">
            Ground tile type
            <select
              value={addGroundTileKey}
              onChange={(event) => onAddGroundTileKeyChange(event.target.value)}
              className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-xs text-gray-100"
            >
              {PLOT_TILE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {getPlotTile(key)?.label ?? key}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="text-[11px] text-gray-400">Size (cells)</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((cells) => (
                <button
                  key={cells}
                  type="button"
                  onClick={() => onAddGroundTileCellsChange(cells)}
                  className={`rounded border px-2 py-0.5 text-[10px] transition ${
                    addGroundTileCells === cells
                      ? 'border-teal-500 bg-teal-900/50 text-teal-100'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {cells}×{cells}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-emerald-200/80">
            Click the map to place a {addGroundTileCells}×{addGroundTileCells} chunk ground cell block (snaps to{' '}
            {SLG_CHUNK_GROUND_CELL_SIZE}u grid — same scale as baked chunk tiles).
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-cyan-200/90">
          <strong>Select mode active.</strong> Click a prefab on the map, or a ground tile where prefabs
          don&apos;t cover it. Use the list below for ground tiles under prefabs.
        </p>
      )}

      {selectedGroundTile ? (
        <div className="mt-4 space-y-3 rounded-lg border border-teal-900/50 bg-teal-950/20 p-3">
          <div>
            <p className="font-medium text-teal-100">
              {getPlotTile(selectedGroundTile.tileKey)?.label ?? selectedGroundTile.tileKey}
            </p>
            <p className="text-[11px] text-gray-500">
              {selectedGroundTile.cells}×{selectedGroundTile.cells} · base ({selectedGroundTile.x.toFixed(0)},{' '}
              {selectedGroundTile.y.toFixed(0)})
            </p>
          </div>
          <PrefabDeltaSlider
            label="ΔX (+ = right)"
            value={selectedGroundTile.deltaX ?? 0}
            colorClass="text-sky-200"
            {...nudgeStepProps}
            onChange={(deltaX) =>
              onOverrideDocChange(
                updateManualGroundTile(overrideDoc, selectedGroundTile.id, { deltaX }),
              )
            }
          />
          <PrefabDeltaSlider
            label="ΔY (+ = down)"
            value={selectedGroundTile.deltaY ?? 0}
            colorClass="text-violet-200"
            {...nudgeStepProps}
            onChange={(deltaY) =>
              onOverrideDocChange(
                updateManualGroundTile(overrideDoc, selectedGroundTile.id, { deltaY }),
              )
            }
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onOverrideDocChange(
                  updateManualGroundTile(overrideDoc, selectedGroundTile.id, { deltaX: 0, deltaY: 0 }),
                )
              }
              className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
            >
              Reset position
            </button>
            <button
              type="button"
              onClick={() => {
                onOverrideDocChange(removeManualGroundTile(overrideDoc, selectedGroundTile.id), true)
                onSelectedGroundTileIdsChange([])
              }}
              className="rounded border border-red-800/60 bg-red-950/40 px-2 py-1 text-xs text-red-100"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {selectedKeys.length > 1 ? (
        <p className="mt-3 text-xs text-cyan-200">
          {selectedKeys.length} prefabs selected — sliders below apply to the last one clicked. Use
          &quot;New group from selection&quot; to move them together.
        </p>
      ) : null}

      {selectedGroundTileIds.length > 1 && !selected ? (
        <p className="mt-3 text-xs text-teal-200">
          {selectedGroundTileIds.length} ground tiles selected — use groups to move them together.
        </p>
      ) : null}

      {selected && selectedOverride ? (
        <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/40 p-3">
          <div>
            <p className="font-medium text-gray-100">{selected.name}</p>
            <p className="text-[11px] text-gray-500">
              anchor ({selected.anchorX.toFixed(2)}, {selected.anchorY.toFixed(2)}) · draw (
              {selected.x.toFixed(2)}, {selected.y.toFixed(2)})
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-gray-500">
              Drag sliders or type exact values. Slider ±{formatNudgeStep(nudgeSliderStep)}u · step buttons
              ±{formatNudgeStep(nudgeFineStep)}u · ±{SLG_MAP_CELL_SIZE}u cell buttons below.
            </p>
            <PrefabDeltaSlider
              label="ΔX (local, + = right)"
              value={selectedOverride.deltaX}
              colorClass="text-sky-200"
              {...nudgeStepProps}
              onChange={(deltaX) => patchSelected({ deltaX })}
            />
            <PrefabDeltaSlider
              label="ΔY (local, + = down in layer)"
              value={selectedOverride.deltaY}
              colorClass="text-violet-200"
              {...nudgeStepProps}
              onChange={(deltaY) => patchSelected({ deltaY })}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="w-full text-[10px] uppercase tracking-wider text-gray-500">Step buttons</span>
            <button
              type="button"
              onClick={() => patchSelected({ deltaX: selectedOverride.deltaX - nudgeFineStep })}
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              ΔX−{formatNudgeStep(nudgeFineStep)}
            </button>
            <button
              type="button"
              onClick={() => patchSelected({ deltaX: selectedOverride.deltaX + nudgeFineStep })}
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              ΔX+{formatNudgeStep(nudgeFineStep)}
            </button>
            <button
              type="button"
              onClick={() => patchSelected({ deltaY: selectedOverride.deltaY - nudgeFineStep })}
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              ΔY−{formatNudgeStep(nudgeFineStep)}
            </button>
            <button
              type="button"
              onClick={() => patchSelected({ deltaY: selectedOverride.deltaY + nudgeFineStep })}
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              ΔY+{formatNudgeStep(nudgeFineStep)}
            </button>
            <button
              type="button"
              onClick={() =>
                patchSelected({ deltaX: selectedOverride.deltaX - SLG_MAP_CELL_SIZE })
              }
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              −1 cell X
            </button>
            <button
              type="button"
              onClick={() =>
                patchSelected({ deltaX: selectedOverride.deltaX + SLG_MAP_CELL_SIZE })
              }
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              +1 cell X
            </button>
            <button
              type="button"
              onClick={() =>
                patchSelected({ deltaY: selectedOverride.deltaY - SLG_MAP_CELL_SIZE })
              }
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              −1 cell Y
            </button>
            <button
              type="button"
              onClick={() =>
                patchSelected({ deltaY: selectedOverride.deltaY + SLG_MAP_CELL_SIZE })
              }
              className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
            >
              +1 cell Y
            </button>
          </div>

          {hasBakedPrefabs('edges') ? (
            <div>
              <p className="mb-1 text-[11px] text-gray-400">Ground tiles in this prefab</p>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['inherit', 'Map default'],
                    ['full', 'With tiles'],
                    ['edges', 'No tiles'],
                  ] as const
                ).map(([mode, label]) => {
                  const active =
                    mode === 'inherit'
                      ? selectedExplicitBakeVariant == null
                      : selectedExplicitBakeVariant === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        if (!selected) {
                          return
                        }
                        onOverrideDocChange(
                          setPrefabBakeVariantOverride(
                            overrideDoc,
                            selected,
                            mode === 'inherit' ? null : mode,
                          ),
                        )
                      }}
                      className={`rounded border px-2 py-0.5 text-[10px] transition ${
                        active
                          ? 'border-teal-500 bg-teal-900/50 text-teal-100'
                          : 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    if (!selected) {
                      return
                    }
                    onOverrideDocChange(
                      flipInstancePrefabBakeVariant(overrideDoc, selected, prefabBakeDefault),
                    )
                  }}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300 hover:bg-gray-700"
                >
                  Toggle
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">
                Showing:{' '}
                {selectedEffectiveBakeVariant === 'full' ? 'with ground/water tiles' : 'edge art only'}
                {selectedExplicitBakeVariant
                  ? ' (this square overrides the map default)'
                  : ` (map default: ${prefabBakeDefault === 'full' ? 'with tiles' : 'no tiles'})`}
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[11px] text-gray-400">Rotation override</p>
            <PrefabRotationButtons
              value={selectedOverride.rotation}
              onChange={(rotation) => patchSelected({ rotation })}
            />
          </div>

          <div>
            <p className="mb-1 text-[11px] text-gray-400">Draw order (higher = on top of other prefabs)</p>
            <p className="mb-2 text-[10px] text-gray-500">
              Overlapping edges use chunk-file order by default (interleaved like in-game). Raise z on one
              piece if the whole prefab should sit above another.
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => patchSelected({ zOrder: selectedZOrder - 1 })}
                className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
              >
                Send back
              </button>
              <label className="flex items-center gap-1 text-[11px] text-gray-400">
                z
                <input
                  type="number"
                  step={1}
                  value={selectedZOrder}
                  onChange={(event) => {
                    const parsed = Number(event.target.value)
                    if (Number.isFinite(parsed)) {
                      patchSelected({ zOrder: parsed })
                    }
                  }}
                  className="w-16 rounded border border-gray-600 bg-gray-900 px-2 py-0.5 text-xs text-gray-100"
                />
              </label>
              <button
                type="button"
                onClick={() => patchSelected({ zOrder: selectedZOrder + 1 })}
                className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
              >
                Bring forward
              </button>
              <button
                type="button"
                onClick={() => patchSelected({ zOrder: maxVisibleZOrder + 1 })}
                className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
              >
                To front
              </button>
              <button
                type="button"
                onClick={() => patchSelected({ zOrder: minVisibleZOrder - 1 })}
                className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
              >
                To back
              </button>
              <button
                type="button"
                onClick={() => patchSelected({ zOrder: 0 })}
                className="rounded border border-gray-600 px-2 py-0.5 text-[10px] text-gray-300"
              >
                Reset z
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOverrideDocChange(clearPrefabOverride(overrideDoc, selected), true)}
              className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
            >
              Reset prefab
            </button>
            <button
              type="button"
              onClick={() => {
                patchSelected({ hidden: true })
                onSelectedKeysChange([])
              }}
              className="rounded border border-red-800/60 bg-red-950/40 px-2 py-1 text-xs text-red-100"
            >
              Hide / delete
            </button>
            {overrideDoc.manual.some(
              (entry) =>
                entry.name === selected.name &&
                Math.abs(entry.anchorX - selected.anchorX) < 0.01 &&
                Math.abs(entry.anchorY - selected.anchorY) < 0.01,
            ) ? (
              <button
                type="button"
                onClick={() => {
                  const manual = overrideDoc.manual.find(
                    (entry) =>
                      entry.name === selected.name &&
                      Math.abs(entry.anchorX - selected.anchorX) < 0.01 &&
                      Math.abs(entry.anchorY - selected.anchorY) < 0.01,
                  )
                  if (manual) {
                    onOverrideDocChange(removeManualPrefab(overrideDoc, manual.id), true)
                    onSelectedKeysChange([])
                  }
                }}
                className="rounded border border-red-800/60 bg-red-950/40 px-2 py-1 text-xs text-red-100"
              >
                Remove added
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500">No prefab selected.</p>
      )}

      {hiddenEntries.length > 0 ? (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">Hidden ({hiddenEntries.length})</p>
          {hiddenEntries.slice(0, 8).map(([key]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const next = { ...overrideDoc.overrides[key], hidden: false }
                onOverrideDocChange({
                  ...overrideDoc,
                  overrides: { ...overrideDoc.overrides, [key]: next },
                })
              }}
              className="block w-full truncate rounded border border-gray-700 bg-gray-800/80 px-2 py-1 text-left text-[10px] text-gray-300 hover:bg-gray-700"
            >
              Restore {key}
            </button>
          ))}
        </div>
      ) : null}

      {hiddenGroundTiles.length > 0 ? (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Hidden ground tiles ({hiddenGroundTiles.length})
          </p>
          {hiddenGroundTiles.slice(0, 8).map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() =>
                onOverrideDocChange(
                  updateManualGroundTile(overrideDoc, tile.id, { hidden: false }),
                  true,
                )
              }
              className="block w-full truncate rounded border border-gray-700 bg-gray-800/80 px-2 py-1 text-left text-[10px] text-gray-300 hover:bg-gray-700"
            >
              Restore {getPlotTile(tile.tileKey)?.label ?? tile.tileKey} @ ({tile.x.toFixed(0)},{' '}
              {tile.y.toFixed(0)})
            </button>
          ))}
        </div>
      ) : null}

      {overrideDoc.manualGroundTiles.length > 0 ? (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            Placed ground tiles ({overrideDoc.manualGroundTiles.length})
          </p>
          {overrideDoc.manualGroundTiles
            .filter((tile) => !tile.hidden)
            .slice(0, 12)
            .map((tile) => (
            <div
              key={tile.id}
              className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${
                selectedGroundTileIds.includes(tile.id)
                  ? 'border-teal-600 bg-teal-950/40'
                  : 'border-gray-700 bg-gray-800/80'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelectedGroundTileIdsChange([tile.id])
                  onSelectedKeysChange([])
                }}
                className="min-w-0 flex-1 truncate text-left text-[10px] text-gray-300 hover:text-teal-100"
              >
                {getPlotTile(tile.tileKey)?.label ?? tile.tileKey} · {tile.cells}×{tile.cells} @ (
                {tile.x.toFixed(0)}, {tile.y.toFixed(0)})
              </button>
              <button
                type="button"
                onClick={() => {
                  onOverrideDocChange(removeManualGroundTile(overrideDoc, tile.id), true)
                  if (selectedGroundTileIds.includes(tile.id)) {
                    onSelectedGroundTileIdsChange(selectedGroundTileIds.filter((id) => id !== tile.id))
                  }
                }}
                className="shrink-0 rounded border border-red-800/60 px-1.5 py-0.5 text-[10px] text-red-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
            Move all pieces
          </p>
          <button
            type="button"
            onClick={() => {
              onShowMoveAllPanelChange(true)
              onSelectedGroupIdChange(null)
            }}
            className={`rounded border px-2 py-1 text-[10px] transition ${
              showMoveAllPanel
                ? 'border-amber-500 bg-amber-950/60 text-amber-100'
                : 'border-amber-700/60 bg-amber-950/40 text-amber-100 hover:border-amber-500'
            }`}
          >
            Move all
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Shifts every edge prefab and every placed ground tile together — nothing to select. Stacks
          on top of each piece&apos;s own offset and any groups.
        </p>
        {showMoveAllPanel ? (
          <div className="space-y-2 border-t border-amber-900/40 pt-3">
            <PrefabDeltaSlider
              label="All ΔX (+ = right)"
              value={globalMove.deltaX}
              colorClass="text-sky-200"
              {...nudgeStepProps}
              onChange={(deltaX) =>
                onOverrideDocChange(updateGlobalMove(overrideDoc, { deltaX }), false)
              }
            />
            <PrefabDeltaSlider
              label="All ΔY (+ = down)"
              value={globalMove.deltaY}
              colorClass="text-violet-200"
              {...nudgeStepProps}
              onChange={(deltaY) =>
                onOverrideDocChange(updateGlobalMove(overrideDoc, { deltaY }), false)
              }
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onOverrideDocChange(updateGlobalMove(overrideDoc, { deltaX: 0, deltaY: 0 }), true)
                }
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
              >
                Reset move-all offset
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3 rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-200">Move groups</p>
          <button
            type="button"
            onClick={createGroupFromSelection}
            disabled={!hasSelection}
            className="rounded border border-indigo-700/60 bg-indigo-950/50 px-2 py-1 text-[10px] text-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            New group from selection
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Ctrl+click prefabs or ground tiles to select multiple (cyan/teal outline). Create a group or
          + add to move them together. Click empty map or outside to clear selection.
        </p>

        {overrideDoc.groups.length > 0 ? (
          <div className="space-y-1">
            {overrideDoc.groups.map((group) => (
              <div
                key={group.id}
                className={`rounded border px-2 py-1.5 ${
                  selectedGroupId === group.id
                    ? 'border-indigo-500 bg-indigo-950/50'
                    : 'border-gray-700 bg-gray-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectedGroupIdChange(group.id)}
                    className="min-w-0 flex-1 truncate text-left text-[11px] text-gray-200 hover:text-indigo-100"
                  >
                    {group.name} · {renderGroupSummary(group)}
                  </button>
                  <button
                    type="button"
                    onClick={() => addSelectionToGroup(group.id)}
                    disabled={!hasSelection}
                    className="shrink-0 rounded border border-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300 disabled:opacity-40"
                    title="Add current selection to this group"
                  >
                    + add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOverrideDocChange(removeAlignmentGroup(overrideDoc, group.id), true)
                      dismissGroup(group.id)
                    }}
                    className="shrink-0 rounded border border-gray-600 px-1.5 py-0.5 text-[10px] text-gray-300"
                    title="Dissolve group but keep pieces visible"
                  >
                    Ungroup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOverrideDocChange(hideAlignmentGroup(overrideDoc, group.id), true)
                      dismissGroup(group.id)
                    }}
                    className="shrink-0 rounded border border-amber-800/60 px-1.5 py-0.5 text-[10px] text-amber-200"
                    title="Hide all members (restorable from Hidden list)"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Delete ${group.name}? Map prefabs will be hidden; added prefabs and ground tiles are removed permanently.`,
                        )
                      ) {
                        return
                      }
                      onOverrideDocChange(deleteAlignmentGroup(overrideDoc, group.id), true)
                      dismissGroup(group.id)
                    }}
                    className="shrink-0 rounded border border-red-800/60 px-1.5 py-0.5 text-[10px] text-red-200"
                    title="Remove group and delete/hide all members"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-500">No groups yet.</p>
        )}

        {selectedGroup ? (
          <div className="space-y-2 border-t border-indigo-900/40 pt-3">
            <p className="text-[11px] font-medium text-indigo-100">Moving: {selectedGroup.name}</p>
            <PrefabDeltaSlider
              label="Group ΔX (+ = right)"
              value={selectedGroup.deltaX}
              colorClass="text-sky-200"
              {...nudgeStepProps}
              onChange={(deltaX) =>
                onOverrideDocChange(updateAlignmentGroup(overrideDoc, selectedGroup.id, { deltaX }))
              }
            />
            <PrefabDeltaSlider
              label="Group ΔY (+ = down)"
              value={selectedGroup.deltaY}
              colorClass="text-violet-200"
              {...nudgeStepProps}
              onChange={(deltaY) =>
                onOverrideDocChange(updateAlignmentGroup(overrideDoc, selectedGroup.id, { deltaY }))
              }
            />
            <button
              type="button"
              onClick={() =>
                onOverrideDocChange(
                  updateAlignmentGroup(overrideDoc, selectedGroup.id, { deltaX: 0, deltaY: 0 }),
                )
              }
              className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-gray-200"
            >
              Reset group offset
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onOverrideDocChange(hideAlignmentGroup(overrideDoc, selectedGroup.id), true)
                  dismissGroup(selectedGroup.id)
                }}
                className="rounded border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-xs text-amber-100"
              >
                Hide group
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Delete ${selectedGroup.name}? Map prefabs will be hidden; added prefabs and ground tiles are removed permanently.`,
                    )
                  ) {
                    return
                  }
                  onOverrideDocChange(deleteAlignmentGroup(overrideDoc, selectedGroup.id), true)
                  dismissGroup(selectedGroup.id)
                }}
                className="rounded border border-red-800/60 bg-red-950/40 px-2 py-1 text-xs text-red-100"
              >
                Delete group
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(buildExportJson())
          }}
          className="rounded-md border border-emerald-700/60 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-100"
        >
          Copy override JSON
        </button>
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([buildExportJson()], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
            link.href = url
            link.download = `sinistra-overrides-${stamp}.json`
            link.click()
            URL.revokeObjectURL(url)
          }}
          className="rounded-md border border-emerald-800/50 bg-emerald-950/25 px-2 py-1 text-xs text-emerald-100"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="rounded-md border border-sky-700/60 bg-sky-950/40 px-2 py-1 text-xs text-sky-100"
        >
          Import JSON backup
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) {
              void handleImportFile(file)
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (
              !window.confirm(
                'Clear ALL overrides, ground tiles, groups, and move-all offsets? Use Undo (Ctrl+Z) if you make a mistake.',
              )
            ) {
              return
            }
            onOverrideDocChange(
              { version: 1, overrides: {}, manual: [], manualGroundTiles: [], groups: [] },
              true,
            )
            onSelectedKeysChange([])
            onSelectedGroundTileIdsChange([])
            onSelectedGroupIdChange(null)
          }}
          className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200"
        >
          Clear all overrides
        </button>
      </div>
    </div>
  )
}
