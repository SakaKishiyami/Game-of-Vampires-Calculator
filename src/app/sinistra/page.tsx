import { Card, CardContent } from '@/components/ui/card'
import { SinistraMapExplorer } from '@/components/sinistra/SinistraMapExplorer'
import { loadSinistraMapData } from '@/lib/sinistra/loadSinistraMapData'
import type { SinistraStructureKind } from '@/lib/sinistra/types'

/** Map data is loaded from ~10GB local assets; skip static generation at build time. */
export const dynamic = 'force-dynamic'

const countLabels: Record<SinistraStructureKind, string> = {
  coalitionHome: 'Coalition Starts',
  mansion: 'Mansions',
  fort: 'Forts',
  bridge: 'Bridges',
  sanctum: 'UR Sanctums',
  turret: 'Citadel Turrets',
  citadel: 'Citadel',
  tree: 'Trees / Gathering',
}

export default function SinistraPage() {
  const mapData = loadSinistraMapData()

  if (!mapData) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Sinistra Map</h1>
        <p className="max-w-2xl text-sm text-gray-300">
          Map data is not available yet. Check back after the game map assets have been added to this project.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Sinistra Map</h1>
        <p className="max-w-3xl text-sm text-gray-300">
          Six coalition starting zones (Zone 1), shared border slices (Zone 2), the inner PvP ring (Zone 3), and the
          central citadel (Zone 4). Zoom in to see mansions, forts, bridges, sanctums, and gathering sites. Click any
          marker for its zone and level.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {(Object.keys(countLabels) as SinistraStructureKind[]).map((kind) => (
          <Card key={kind} className="border border-red-950/50 bg-gray-900/60">
            <CardContent className="px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-red-400/80">{countLabels[kind]}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{mapData.counts[kind]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <SinistraMapExplorer data={mapData} />
    </div>
  )
}
