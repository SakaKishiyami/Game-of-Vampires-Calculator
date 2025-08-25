"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      try {
        // Get the auth code from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const next = urlParams.get('next') ?? '/'

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            // Successful authentication, redirect to the next page
            router.push(next)
            return
          }
        }

        // If we get here, there was an error or no code
        router.push('/auth/auth-code-error')
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/auth-code-error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white">Processing authentication...</p>
      </div>
    </div>
  )
}