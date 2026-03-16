import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Sparkles, Map, BarChart2, User, Database } from 'lucide-react'

const tiles = [
  {
    href: '/calculator',
    title: 'Main Calculator',
    description: 'The full Game of Vampires domination calculator with auras, wardens, talents, books, and more.',
    icon: Calculator,
    accent: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/40',
  },
  {
    href: '/familiars',
    title: 'Familiar Tracker',
    description: 'Track familiar levels, bonuses, and how they feed into your wardens and overall domination.',
    icon: Sparkles,
    accent: 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/40',
  },
  {
    href: '/sinistra',
    title: 'Sinistra Tools',
    description: 'Sinistra event planner, calculator, and interactive map-style overview (coming together here).',
    icon: Map,
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/40',
  },
  {
    href: '/events',
    title: 'Event Tracker & Stats',
    description: 'Log key events, rewards, and stats so you can compare runs and plan future pushes.',
    icon: BarChart2,
    accent: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40',
  },
  {
    href: '/account',
    title: 'Accounts',
    description: 'Manage logins and account-specific settings; will tie into Supabase / Discord auth.',
    icon: User,
    accent: 'from-pink-500/20 to-rose-500/10 border-pink-500/40',
  },
  {
    href: '/data',
    title: 'Data & Import / Export',
    description: 'Cloud saves, local saves, import/export from files or browser storage, and future Google Drive hooks.',
    icon: Database,
    accent: 'from-lime-500/20 to-green-500/10 border-lime-500/40',
  },
]

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Game of Vampires Toolkit
        </h1>
        <p className="text-sm md:text-base text-gray-300 max-w-2xl">
          Central hub for all your calculators and tools. Pick a section below, or use the sidebar
          to jump between areas without losing your work.
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card
              key={tile.href}
              className={`relative overflow-hidden border bg-gradient-to-br ${tile.accent}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-purple-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg text-white">
                    {tile.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-4">
                <p className="text-sm text-gray-200">{tile.description}</p>
                <div>
                  <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Link href={tile.href}>
                      Open {tile.title}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 