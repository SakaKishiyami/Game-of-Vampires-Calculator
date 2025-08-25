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

        console.log('Auth callback - code:', code, 'next:', next)

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          console.log('Exchange result:', { data, error })
          
          if (!error && data.session) {
            console.log('Authentication successful, redirecting to:', next)
            // Successful authentication, redirect to the next page
            router.push(next)
            return
          } else {
            console.error('Exchange error:', error)
          }
        } else {
          console.log('No auth code found in URL')
        }

        // If we get here, there was an error or no code
        console.log('Redirecting to error page')
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