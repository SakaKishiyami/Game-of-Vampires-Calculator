/** From `SLGSplitMapPrefab.json` — terrain tiles are laid out on this grid. */
export const SLG_MAP_CELL_SIZE = 40
export const SLG_MAP_CHUNK_SIZE = 100

/** Tilemap cells inside a chunk ground bake (typically 40×40 over 100×100 world units). */
export const SLG_CHUNK_GROUND_CELL_COUNT = 40
export const SLG_CHUNK_GROUND_CELL_SIZE = SLG_MAP_CHUNK_SIZE / SLG_CHUNK_GROUND_CELL_COUNT

/** Overview/terrain art is already Y-down; structure JSON uses the opposite Y axis. */
export const SLG_MAP_VIEW_PADDING = 80

/** Flip structure/region Y so markers align with the overview image. */
export function flipSlgY(bounds: { minY: number; maxY: number }, y: number): number {
  return bounds.minY + bounds.maxY - y
}

/** Default chunk-ground shift (cells). Tune live via Terrain Align debug panel. */
export const SLG_CHUNK_GROUND_Y_NUDGE = 4 * SLG_MAP_CELL_SIZE

/** Default extra prefab-layer shift inside the mirror (cells). Positive moves prefabs up. */
export const SLG_DEFAULT_PREFAB_Y_NUDGE = 0

/** Default prefab-layer X shift (cells). Positive moves prefabs right. */
export const SLG_DEFAULT_PREFAB_X_NUDGE = 0

/** Default chunk-ground X shift (cells). Positive moves chunk tiles right. */
export const SLG_DEFAULT_CHUNK_GROUND_X_NUDGE = 0

/** Mirror the whole prefab overlay; edge/corner pieces get local fixes inside this group. */
export function slgPrefabLayerTransform(
  bounds: { minY: number; maxY: number },
  extraYNudge = 0,
): string {
  const axis = bounds.minY + bounds.maxY
  if (extraYNudge === 0) {
    return `translate(0 ${axis}) scale(1 -1)`
  }
  return `translate(0 ${axis}) scale(1 -1) translate(0 ${extraYNudge})`
}

export function flipSlgRectY(
  bounds: { minY: number; maxY: number },
  rect: { x: number; y: number; w: number; h: number },
): { x: number; y: number; w: number; h: number } {
  return {
    x: rect.x,
    y: flipSlgY(bounds, rect.y + rect.h),
    w: rect.w,
    h: rect.h,
  }
}
