/** Build raw-asset API URLs with optional max-dimension resize for map LOD. */

export function buildRawAssetUrl(assetPath: string, options?: { maxPx?: number; version?: string }): string {
  const params = new URLSearchParams()
  params.set('path', assetPath)

  if (options?.maxPx != null && options.maxPx > 0) {
    params.set('max', String(Math.round(options.maxPx)))
  }

  if (options?.version) {
    params.set('v', options.version)
  }

  return `/api/raw-asset/?${params.toString()}`
}

/** Max PNG dimension to request based on how zoomed-in the view is (world units visible). */
export function lodMaxPx(viewSize: number, kind: 'overview' | 'chunk' | 'prefab'): number {
  if (kind === 'overview') {
    return viewSize > 1800 ? 1024 : 1536
  }

  if (kind === 'chunk') {
    // Chunk PNGs are 5000px — keep requested size modest to speed sharp resize + transfer.
    if (viewSize > 900) {
      return 384
    }
    if (viewSize > 600) {
      return 512
    }
    if (viewSize > 400) {
      return 640
    }
    return 768
  }

  if (viewSize > 500) {
    return 512
  }
  if (viewSize > 300) {
    return 640
  }
  return 768
}

export function shouldShowOverviewLayer(viewSize: number): boolean {
  return viewSize >= 1200
}

export function shouldShowChunkGroundLayer(viewSize: number): boolean {
  return viewSize < 1300
}

export function shouldShowBakedPrefabs(viewSize: number): boolean {
  // Same band as chunk ground — prefabs were hidden at default zoom when threshold was 480.
  return viewSize < 1300
}
