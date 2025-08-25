"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="bg-gray-800/50 border-gray-600 max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-red-400">⚠️ Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-300">
            There was a problem signing you in. This could be due to:
          </p>
          <ul className="text-gray-400 text-sm space-y-1 text-left">
            <li>• The authentication link has expired</li>
            <li>• The authentication was cancelled</li>
            <li>• There was a network error</li>
          </ul>
          <div className="pt-4">
            <Button 
              onClick={() => router.push('/')}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
            >
              Return to Calculator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}