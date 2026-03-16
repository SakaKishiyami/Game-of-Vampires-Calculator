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
  },
  {
    href: '/familiars',
    title: 'Familiar Tracker',
    description: 'Track familiar levels, bonuses, and how they feed into your wardens and overall domination.',
    icon: Sparkles,
  },
  {
    href: '/sinistra',
    title: 'Sinistra Tools',
    description: 'Sinistra event planner, calculator, and interactive map-style overview (coming together here).',
    icon: Map,
  },
  {
    href: '/events',
    title: 'Event Tracker & Stats',
    description: 'Log key events, rewards, and stats so you can compare runs and plan future pushes.',
    icon: BarChart2,
  },
  {
    href: '/account',
    title: 'Accounts',
    description: 'Manage logins and account-specific settings; will tie into Supabase / Discord auth.',
    icon: User,
  },
  {
    href: '/data',
    title: 'Data & Import / Export',
    description: 'Cloud saves, local saves, import/export from files or browser storage, and future Google Drive hooks.',
    icon: Database,
  },
]

export default function Home() {
  return (
    <div className="space-y-10 w-full">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
          Game of Vampires Toolkit
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-2xl">
          Choose a section below—each opens in a full page. Use the menu icon above to open or close the sidebar anytime.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card
              key={tile.href}
              className="relative overflow-hidden border border-red-950/50 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center text-red-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg text-red-400">
                    {tile.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-4">
                <p className="text-sm text-gray-300">{tile.description}</p>
                <div>
                  <Button asChild size="sm" className="bg-red-700 hover:bg-red-600 text-white border border-red-600">
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