import dynamic from 'next/dynamic'

const AccountDashboard = dynamic(() => import('@/components/AccountDashboard'), { ssr: false })

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Account</h1>
      <AccountDashboard />
    </div>
  )
}
