'use client'

import Link from 'next/link'

export default function FamiliarsPage() {
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Familiar Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">
          The familiar tracker has been moved into the main calculator.{' '}
          <Link href="/calculator" className="text-purple-300 hover:text-purple-200 underline">
            Go to Calculator → Familiars tab
          </Link>
        </p>
      </div>
    </div>
  )
}
