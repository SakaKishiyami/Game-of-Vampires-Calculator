import { SLG_MAP_CELL_SIZE } from '@/lib/sinistra/constants'

export type PlannerMarkerKind = 'covenFortress' | 'beacon'

export type PlannerLinkTarget =
  | { type: 'structure'; id: string }
  | { type: 'planner'; id: string }

export type PlannerMarker = {
  id: string
  kind: PlannerMarkerKind
  /** Coalition slot 1–6 (matches in-game coalition numbering for planning). */
  coalition: number
  x: number
  y: number
  label: string
  parent: PlannerLinkTarget | null
}

export type PlannerState = {
  markers: PlannerMarker[]
}

export type PlannerTool = 'pan' | 'covenFortress' | 'beacon' | 'connect' | 'erase'

const STORAGE_KEY = 'sinistra-beacon-planner-v1'

export const COALITION_COLORS: Record<number, { fill: string; stroke: string }> = {
  1: { fill: '#dc2626', stroke: '#fecaca' },
  2: { fill: '#2563eb', stroke: '#bfdbfe' },
  3: { fill: '#16a34a', stroke: '#bbf7d0' },
  4: { fill: '#ca8a04', stroke: '#fef08a' },
  5: { fill: '#9333ea', stroke: '#e9d5ff' },
  6: { fill: '#ea580c', stroke: '#fed7aa' },
}

export function snapPlannerPoint(x: number, y: number, cellSize = SLG_MAP_CELL_SIZE): { x: number; y: number } {
  return {
    x: Math.round(x / cellSize) * cellSize,
    y: Math.round(y / cellSize) * cellSize,
  }
}

export function loadPlannerState(): PlannerState {
  if (typeof window === 'undefined') {
    return { markers: [] }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { markers: [] }
    }

    const parsed = JSON.parse(raw) as PlannerState
    if (!parsed || !Array.isArray(parsed.markers)) {
      return { markers: [] }
    }

    return {
      markers: parsed.markers.filter(
        (marker) =>
          marker &&
          typeof marker.id === 'string' &&
          (marker.kind === 'covenFortress' || marker.kind === 'beacon') &&
          typeof marker.coalition === 'number' &&
          typeof marker.x === 'number' &&
          typeof marker.y === 'number',
      ),
    }
  } catch {
    return { markers: [] }
  }
}

export function savePlannerState(state: PlannerState): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createPlannerMarker(
  kind: PlannerMarkerKind,
  coalition: number,
  x: number,
  y: number,
  existing: PlannerMarker[],
): PlannerMarker {
  const coalitionFortresses = existing.filter(
    (marker) => marker.kind === 'covenFortress' && marker.coalition === coalition,
  )
  const index =
    kind === 'covenFortress'
      ? coalitionFortresses.length + 1
      : existing.filter((marker) => marker.kind === 'beacon' && marker.coalition === coalition).length + 1

  const prefix = kind === 'covenFortress' ? 'CF' : 'B'
  const label = `${prefix}${coalition}-${index}`

  return {
    id: `planner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    coalition,
    x,
    y,
    label,
    parent: null,
  }
}

export function linkTargetKey(target: PlannerLinkTarget): string {
  return `${target.type}:${target.id}`
}

export function resolveLinkTargetPosition(
  target: PlannerLinkTarget,
  markers: PlannerMarker[],
  structurePositions: Map<string, { x: number; y: number }>,
): { x: number; y: number } | null {
  if (target.type === 'planner') {
    const marker = markers.find((entry) => entry.id === target.id)
    return marker ? { x: marker.x, y: marker.y } : null
  }

  return structurePositions.get(target.id) ?? null
}
