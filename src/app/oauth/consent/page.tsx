"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// OAuth consent/callback page — handles redirects from Google and Discord OAuth flows.
// Supabase exchanges the code for a session, then we redirect home.
export default function OAuthConsent() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const code = params.get('code')
      const accessToken = hashParams.get('access_token')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { router.replace('/'); return }
      }

      if (accessToken) {
        // Implicit flow (some providers use hash fragments)
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') ?? '',
        })
        if (!error) { router.replace('/'); return }
      }

      router.replace('/auth/auth-code-error')
    }

    handle()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
        <p className="text-white text-lg">Signing you in...</p>
        <p className="text-gray-400 text-sm mt-2">Completing authentication, please wait.</p>
      </div>
    </div>
  )
}
