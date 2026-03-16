'use client'

import { useCalculatorSettings } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const { density, toggleDensity, theme, toggleTheme } = useCalculatorSettings()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Calculator Settings</h1>

      <Card className="bg-gray-800/60 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white text-lg">Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm text-gray-200">Theme</Label>
              <p className="text-xs text-gray-400">
                Light vs dark overall styling. Dark is currently optimized.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-gray-600 bg-gray-900 p-1 text-xs">
              <button
                type="button"
                onClick={theme === 'light' ? undefined : toggleTheme}
                className={`px-3 py-1 rounded-md ${
                  theme === 'light' ? 'bg-gray-200 text-gray-900' : 'text-gray-300'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={theme === 'dark' ? undefined : toggleTheme}
                className={`px-3 py-1 rounded-md ${
                  theme === 'dark' ? 'bg-purple-600 text-white' : 'text-gray-300'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm text-gray-200">Layout density</Label>
              <p className="text-xs text-gray-400">
                Compact squeezes more inputs per row; comfortable adds breathing room.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-gray-600 bg-gray-900 p-1 text-xs">
              <button
                type="button"
                onClick={density === 'comfortable' ? undefined : toggleDensity}
                className={`px-3 py-1 rounded-md ${
                  density === 'comfortable' ? 'bg-gray-200 text-gray-900' : 'text-gray-300'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={density === 'compact' ? undefined : toggleDensity}
                className={`px-3 py-1 rounded-md ${
                  density === 'compact' ? 'bg-purple-600 text-white' : 'text-gray-300'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/60 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white text-lg">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-300">
          <p>
            This area is where we can add more advanced options later (data preferences, default tab,
            experimental features, etc.), similar to what most web apps expose in their settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

