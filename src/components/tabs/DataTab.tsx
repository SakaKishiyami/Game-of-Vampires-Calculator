"use client"

import { useState, useEffect } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { importGameData, validateImportedData, STORAGE_KEY } from '@/utils/exportImport'
import { supabase } from '@/lib/supabase'
import { getOrCreateFolder, listDriveSaves, saveToDrive, loadFromDrive, deleteFromDrive, DriveFile } from '@/lib/googleDrive'

export default function DataTab() {
  const { exportGameData, getExportState, importGameData: importData } = useGameCalculator()

  const [driveToken, setDriveToken] = useState<string | null>(null)
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null)
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [driveSaveName, setDriveSaveName] = useState('')
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveConnected, setDriveConnected] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.provider_token) setDriveToken(session.provider_token)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) setDriveToken(session.provider_token)
      else { setDriveToken(null); setDriveFolderId(null); setDriveFiles([]); setDriveConnected(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: 'https://www.googleapis.com/auth/drive.file', redirectTo: `${window.location.origin}/oauth/consent` },
    })
  }

  const connectDrive = async () => {
    if (!driveToken) return
    setDriveLoading(true); setDriveError(null)
    try {
      const fid = await getOrCreateFolder(driveToken)
      setDriveFolderId(fid)
      setDriveFiles(await listDriveSaves(driveToken, fid))
      setDriveConnected(true)
    } catch { setDriveError('Could not connect to Google Drive. Try signing in with Google again.') }
    setDriveLoading(false)
  }

  const saveToDriveHandler = async () => {
    if (!driveToken || !driveSaveName.trim()) return
    setDriveLoading(true); setDriveError(null)
    try {
      const fid = driveFolderId ?? await getOrCreateFolder(driveToken)
      if (!driveFolderId) setDriveFolderId(fid)
      const existing = driveFiles.find(f => f.name === `${driveSaveName.trim()}.json`)
      await saveToDrive(driveToken, fid, driveSaveName.trim(), getExportState(), existing?.id)
      setDriveSaveName('')
      setDriveFiles(await listDriveSaves(driveToken, fid))
    } catch { setDriveError('Failed to save to Google Drive.') }
    setDriveLoading(false)
  }

  const loadFromDriveHandler = async (fileId: string) => {
    if (!driveToken) return
    setDriveLoading(true); setDriveError(null)
    try {
      const data = await loadFromDrive(driveToken, fileId)
      importData(data as any)
      alert('Loaded from Google Drive!')
    } catch { setDriveError('Failed to load from Google Drive.') }
    setDriveLoading(false)
  }

  const deleteFromDriveHandler = async (fileId: string) => {
    if (!driveToken || !confirm('Delete this Drive save?')) return
    setDriveLoading(true)
    try {
      await deleteFromDrive(driveToken, fileId)
      if (driveFolderId) setDriveFiles(await listDriveSaves(driveToken, driveFolderId))
    } catch { setDriveError('Failed to delete.') }
    setDriveLoading(false)
  }

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

          {/* Google Drive */}
          <div className="space-y-3 border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white">Google Drive</h3>
            <p className="text-sm text-gray-300">
              Save JSON files directly to your Google Drive. Requires signing in with Google.
            </p>
            {driveError && <p className="text-red-400 text-sm">{driveError}</p>}
            {!driveToken && (
              <Button onClick={signInWithGoogle} className="bg-white hover:bg-gray-100 text-gray-900 font-medium flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google to use Drive
              </Button>
            )}
            {driveToken && !driveConnected && (
              <Button onClick={connectDrive} disabled={driveLoading} className="bg-yellow-600 hover:bg-yellow-700">
                {driveLoading ? 'Connecting...' : 'Load My Drive Saves'}
              </Button>
            )}
            {driveToken && driveConnected && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={driveSaveName} onChange={e => setDriveSaveName(e.target.value)} placeholder="Save name..." className="bg-gray-700 border-gray-600 text-white" />
                  <Button onClick={saveToDriveHandler} disabled={driveLoading || !driveSaveName.trim()} className="bg-green-600 hover:bg-green-700 shrink-0">Save</Button>
                </div>
                {driveFiles.length === 0 && !driveLoading && <p className="text-gray-500 text-sm">No Drive saves yet.</p>}
                {driveFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{f.name.replace(/\.json$/, '')}</p>
                      <p className="text-gray-400 text-xs">{new Date(f.modifiedTime).toLocaleString()}</p>
                    </div>
                    <Button onClick={() => loadFromDriveHandler(f.id)} disabled={driveLoading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">Load</Button>
                    <Button onClick={() => deleteFromDriveHandler(f.id)} disabled={driveLoading} size="sm" variant="destructive" className="text-xs">Delete</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
