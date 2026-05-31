import { useCallback, useRef, useState } from 'react'
import type { PrefabBakeVariant } from '@/lib/sinistra/prefabManifest'
import type { PrefabOverrideDocument } from '@/lib/sinistra/prefabPlacementOverrides'
import type { TerrainAlignmentOffsets } from '@/lib/sinistra/terrainAlignment'

export type MapEditorSnapshot = {
  prefabOverrideDoc: PrefabOverrideDocument
  terrainAlignment: TerrainAlignmentOffsets
  prefabBakeDefault: PrefabBakeVariant
}

const HISTORY_LIMIT = 50
const HISTORY_DEBOUNCE_MS = 400

function cloneSnapshot(snapshot: MapEditorSnapshot): MapEditorSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as MapEditorSnapshot
}

function snapshotsEqual(a: MapEditorSnapshot, b: MapEditorSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useMapEditorHistory(initial: MapEditorSnapshot) {
  const [snapshot, setSnapshot] = useState<MapEditorSnapshot>(() => cloneSnapshot(initial))
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot

  const pastRef = useRef<MapEditorSnapshot[]>([])
  const futureRef = useRef<MapEditorSnapshot[]>([])
  const debounceTimerRef = useRef<number | null>(null)
  const debounceBaselineRef = useRef<MapEditorSnapshot | null>(null)

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0 || debounceBaselineRef.current !== null)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const flushDebounced = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    const baseline = debounceBaselineRef.current
    debounceBaselineRef.current = null
    if (baseline && !snapshotsEqual(baseline, snapshotRef.current)) {
      pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), cloneSnapshot(baseline)]
      futureRef.current = []
    }
    syncHistoryFlags()
  }, [syncHistoryFlags])

  const applySnapshot = useCallback(
    (next: MapEditorSnapshot) => {
      const cloned = cloneSnapshot(next)
      snapshotRef.current = cloned
      setSnapshot(cloned)
    },
    [],
  )

  const commit = useCallback(
    (next: MapEditorSnapshot, mode: 'immediate' | 'debounced' = 'debounced') => {
      if (snapshotsEqual(snapshotRef.current, next)) {
        return
      }

      if (mode === 'immediate') {
        flushDebounced()
        pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), cloneSnapshot(snapshotRef.current)]
        futureRef.current = []
        applySnapshot(next)
        syncHistoryFlags()
        return
      }

      if (!debounceBaselineRef.current) {
        debounceBaselineRef.current = cloneSnapshot(snapshotRef.current)
        syncHistoryFlags()
      }
      applySnapshot(next)

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null
        const baseline = debounceBaselineRef.current
        debounceBaselineRef.current = null
        if (baseline && !snapshotsEqual(baseline, snapshotRef.current)) {
          pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), baseline]
          futureRef.current = []
        }
        syncHistoryFlags()
      }, HISTORY_DEBOUNCE_MS)
    },
    [applySnapshot, flushDebounced, syncHistoryFlags],
  )

  const patch = useCallback(
    (
      patchFn: (current: MapEditorSnapshot) => MapEditorSnapshot,
      mode: 'immediate' | 'debounced' = 'debounced',
    ) => {
      commit(patchFn(snapshotRef.current), mode)
    },
    [commit],
  )

  const undo = useCallback(() => {
    flushDebounced()
    const past = pastRef.current
    if (past.length === 0) {
      return false
    }
    const previous = past[past.length - 1]
    pastRef.current = past.slice(0, -1)
    futureRef.current = [cloneSnapshot(snapshotRef.current), ...futureRef.current].slice(0, HISTORY_LIMIT)
    applySnapshot(previous)
    syncHistoryFlags()
    return true
  }, [applySnapshot, flushDebounced, syncHistoryFlags])

  const redo = useCallback(() => {
    flushDebounced()
    const future = futureRef.current
    if (future.length === 0) {
      return false
    }
    const next = future[0]
    futureRef.current = future.slice(1)
    pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), cloneSnapshot(snapshotRef.current)]
    applySnapshot(next)
    syncHistoryFlags()
    return true
  }, [applySnapshot, flushDebounced, syncHistoryFlags])

  const resetHistory = useCallback(
    (next: MapEditorSnapshot) => {
      flushDebounced()
      pastRef.current = []
      futureRef.current = []
      debounceBaselineRef.current = null
      applySnapshot(next)
      syncHistoryFlags()
    },
    [applySnapshot, flushDebounced, syncHistoryFlags],
  )

  return {
    snapshot,
    patch,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  }
}
