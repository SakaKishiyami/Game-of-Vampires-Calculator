import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const DATA_MINE_ROOT = path.join(process.cwd(), 'DataMineRaw')
const RESIZE_CACHE_DIR = path.join(process.cwd(), '.cache', 'raw-asset-resize')

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

function parseMaxDimension(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 64 || parsed > 4096) {
    return null
  }

  return parsed
}

async function readResizedPng(resolvedPath: string, maxDim: number): Promise<Buffer> {
  const stat = await fs.promises.stat(resolvedPath)
  const cacheKey = `${resolvedPath}|${maxDim}|${stat.mtimeMs}|${stat.size}`
  const cacheHash = crypto.createHash('sha256').update(cacheKey).digest('hex')
  const cachePath = path.join(RESIZE_CACHE_DIR, `${cacheHash}.png`)

  try {
    return await fs.promises.readFile(cachePath)
  } catch {
    // Sharp premultiplies alpha before downscale (avoids mip-map dark fringe on transparency).
    // PNG output is uncompressed RGBA — equivalent to Unity RGBA 32-bit / no Crunch.
    const resized = await sharp(resolvedPath)
      .ensureAlpha()
      .resize(maxDim, maxDim, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 0 })
      .toBuffer()

    await fs.promises.mkdir(RESIZE_CACHE_DIR, { recursive: true })
    await fs.promises.writeFile(cachePath, resized)
    return resized
  }
}

export async function GET(request: NextRequest) {
  const relativePath = request.nextUrl.searchParams.get('path')
  if (!relativePath) {
    return new NextResponse('Missing asset path', { status: 400 })
  }

  const normalizedRoot = path.resolve(DATA_MINE_ROOT)
  const resolvedPath = path.resolve(process.cwd(), relativePath)
  if (!resolvedPath.startsWith(normalizedRoot)) {
    return new NextResponse('Asset path is outside DataMineRaw', { status: 403 })
  }

  const extension = path.extname(resolvedPath).toLowerCase()
  const contentType = MIME_TYPES[extension]
  if (!contentType) {
    return new NextResponse('Unsupported asset type', { status: 415 })
  }

  if (!fs.existsSync(resolvedPath)) {
    return new NextResponse('Asset not found', { status: 404 })
  }

  const maxDim = parseMaxDimension(request.nextUrl.searchParams.get('max'))
  const isVolatileTerrainAsset =
    resolvedPath.includes(`${path.sep}terrain_prefabs${path.sep}`) ||
    resolvedPath.includes(`${path.sep}terrain_prefabs_edges${path.sep}`) ||
    resolvedPath.includes(`${path.sep}chunk_grounds${path.sep}`) ||
    resolvedPath.includes(`${path.sep}plot_tiles${path.sep}`)

  let fileBuffer: Buffer
  if (maxDim != null && extension === '.png') {
    fileBuffer = await readResizedPng(resolvedPath, maxDim)
  } else {
    fileBuffer = await fs.promises.readFile(resolvedPath)
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control':
        maxDim != null
          ? 'public, max-age=86400, immutable'
          : isVolatileTerrainAsset
            ? 'no-store, must-revalidate'
            : 'public, max-age=3600',
    },
  })
}
