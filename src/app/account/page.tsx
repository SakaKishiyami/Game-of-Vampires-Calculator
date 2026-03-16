import dynamic from 'next/dynamic'

const UserMenu = dynamic(() => import('@/components/UserMenu'), { ssr: false })

export default function AccountPage() {
  // For now we only render the menu shell; GameCalculator still owns the data wiring.
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Accounts</h1>
      <p className="text-sm text-gray-300 max-w-2xl">
        Sign in with Discord to enable cloud saves and manage how your calculator data is loaded.
      </p>
      <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3 text-xs text-gray-400">
        <span>
          The account widget is available from any page in the future. For now, use the calculator&apos;s
          built-in menu; this page will host a dedicated account dashboard later.
        </span>
      </div>
    </div>
  )
}

