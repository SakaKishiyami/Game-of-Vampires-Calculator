import Link from 'next/link'

export default function FamiliarsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Familiar Tracker</h1>
      <p className="text-sm text-gray-300 max-w-2xl">
        This will become a dedicated familiar tracker / calculator: levels, bonuses, and how they
        flow into your wardens and total domination. For now it&apos;s a placeholder so we can
        wire up navigation and layout.
      </p>
      <div className="text-xs text-gray-400">
        Familiars live in the Courtyard. You can also adjust Courtyard levels and points from the{' '}
        <Link href="/calculator" className="text-purple-300 hover:text-purple-200 underline">
          main calculator Courtyard tab
        </Link>
        .
      </div>
    </div>
  )
}

