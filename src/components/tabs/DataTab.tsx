"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { importGameData, validateImportedData, STORAGE_KEY } from '@/utils/exportImport'

export default function DataTab() {
  const { exportGameData, getExportState, importGameData: importData } = useGameCalculator()

  const handleExportFile = () => {
    exportGameData()
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    importGameData(file)
      .then((data) => {
        if (validateImportedData(data)) {
          importData(data)
          alert('Data imported successfully!')
        } else {
          alert('Invalid data format')
        }
      })
      .catch((error) => {
        alert('Failed to import data: ' + error.message)
      })
    event.target.value = ''
  }

  const handleSaveLocal = () => {
    try {
      const state = getExportState()
      const withVersion = { version: '1.0.0', ...state }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withVersion))
      alert('Saved to local storage.')
    } catch (e) {
      alert('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  const handleLoadLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        alert('No save found in local storage.')
        return
      }
      const data = JSON.parse(raw)
      if (validateImportedData(data)) {
        importData(data)
        alert('Loaded from local storage.')
      } else {
        alert('Invalid data in local storage.')
      }
    } catch (e) {
      alert('Failed to load: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  const handleSaveSession = () => {
    try {
      const state = getExportState()
      const withVersion = { version: '1.0.0', ...state }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(withVersion))
      alert('Saved to session storage (this tab only).')
    } catch (e) {
      alert('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  const handleLoadSession = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) {
        alert('No save found in session storage.')
        return
      }
      const data = JSON.parse(raw)
      if (validateImportedData(data)) {
        importData(data)
        alert('Loaded from session storage.')
      } else {
        alert('Invalid data in session storage.')
      }
    } catch (e) {
      alert('Failed to load: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Data Management</CardTitle>
          <p className="text-sm text-gray-300">
            Save and load your calculator state from this device or a file.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local storage */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Local storage</h3>
            <p className="text-sm text-gray-300">
              Persists until you clear site data. Same storage used by the calculator&apos;s save/load.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveLocal} className="bg-amber-700 hover:bg-amber-800 text-white">
                Save to local storage
              </Button>
              <Button onClick={handleLoadLocal} variant="outline" className="border-gray-500 text-gray-200 hover:bg-gray-700">
                Load from local storage
              </Button>
            </div>
          </div>

          {/* Session storage (browser tab) */}
          <div className="space-y-2 border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white">Session storage</h3>
            <p className="text-sm text-gray-300">
              Persists only in this browser tab. Lost when you close the tab.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveSession} className="bg-indigo-700 hover:bg-indigo-800 text-white">
                Save to session storage
              </Button>
              <Button onClick={handleLoadSession} variant="outline" className="border-gray-500 text-gray-200 hover:bg-gray-700">
                Load from session storage
              </Button>
            </div>
          </div>

          {/* File export / import */}
          <div className="space-y-2 border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white">File</h3>
            <p className="text-sm text-gray-300">
              Export to a JSON file for backup or transfer; import from a previously exported file.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportFile} className="bg-red-600 hover:bg-red-700 text-white">
                Export to JSON file
              </Button>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                  id="data-tab-import-file"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('data-tab-import-file')?.click()}
                  variant="outline"
                  className="border-gray-500 text-gray-200 hover:bg-gray-700 cursor-pointer"
                >
                  Import from JSON file
                </Button>
              </label>
            </div>
          </div>

          {/* Google Drive placeholder */}
          <div className="space-y-2 border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white">Google Drive</h3>
            <p className="text-sm text-gray-300">
              Save and load from your Google Drive (coming soon). For now, use Export to file and upload the JSON to Drive manually.
            </p>
            <Button disabled className="bg-gray-600 text-gray-400 cursor-not-allowed">
              Google Drive (coming soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
