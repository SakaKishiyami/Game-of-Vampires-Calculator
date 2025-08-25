'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, getCurrentUser, signOut } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthComponentProps {
  user: User | null
  onUserChange: (user: User | null) => void
}

export default function AuthComponent({ user, onUserChange }: AuthComponentProps) {
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      onUserChange(session?.user || null)
      if (event === 'SIGNED_IN') {
        setShowAuth(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [onUserChange])

  const handleSignOut = async () => {
    await signOut()
    onUserChange(null)
  }

  if (user) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-400">
          ✓ Signed in as {user.user_metadata?.full_name || user.email}
        </span>
        <Button 
          onClick={handleSignOut}
          variant="outline" 
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  if (showAuth) {
    return (
      <Card className="bg-gray-800/50 border-gray-600 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-white text-center">🎮 Sign In with Discord</CardTitle>
          <p className="text-gray-400 text-sm text-center">
            Save your calculator data to the cloud and access it from any device!
          </p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  background: '#374151',
                  color: 'white',
                  borderColor: '#4B5563',
                },
                anchor: { color: '#A78BFA' },
                message: { color: '#EF4444' },
                input: {
                  background: '#374151',
                  color: 'white',
                  borderColor: '#4B5563',
                }
              }
            }}
            providers={['discord']}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
          <Button 
            onClick={() => setShowAuth(false)}
            variant="ghost" 
            size="sm"
            className="w-full mt-4 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        onClick={() => setShowAuth(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
🎮 Sign In with Discord
      </Button>
      <span className="text-xs text-gray-500">
        Save your data to the cloud!
      </span>
    </div>
  )
}