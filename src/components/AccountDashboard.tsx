'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, signOut, UserSave } from '@/lib/supabase'
import { getOrCreateFolder, listDriveSaves, saveToDrive, loadFromDrive, deleteFromDrive, DriveFile } from '@/lib/googleDrive'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DRIVE_TOKEN_KEY = 'gov_drive_token'

export default function AccountDashboard() {
  const { getExportState, importGameData: importData } = useGameCalculator()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Supabase cloud saves
  const [saves, setSaves] = useState<UserSave[]>([])
  const [saveName, setSaveName] = useState('')
  const [cloudLoading, setCloudLoading] = useState(false)

  // Google Drive
  const [driveToken, setDriveToken] = useState<string | null>(null)
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null)
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveConnected, setDriveConnected] = useState(false)
  const [currentDriveFile, setCurrentDriveFile] = useState<DriveFile | null>(null)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) {
        localStorage.setItem(DRIVE_TOKEN_KEY, session.provider_token)
        setDriveToken(session.provider_token)
      } else {
        const stored = localStorage.getItem(DRIVE_TOKEN_KEY)
        if (stored) setDriveToken(stored)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) {
        localStorage.setItem(DRIVE_TOKEN_KEY, session.provider_token)
        setDriveToken(session.provider_token)
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(DRIVE_TOKEN_KEY)
        setDriveToken(null); setDriveFolderId(null); setDriveFiles([])
        setDriveConnected(false); setCurrentDriveFile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Auto-connect when token is available
  useEffect(() => {
    if (!driveToken || driveConnected) return
    setDriveLoading(true); setDriveError(null)
    getOrCreateFolder(driveToken)
      .then(fid => { setDriveFolderId(fid); return listDriveSaves(driveToken, fid) })
      .then(files => { setDriveFiles(files); setDriveConnected(true) })
      .catch(() => {
        localStorage.removeItem(DRIVE_TOKEN_KEY)
        setDriveToken(null)
        setDriveError('Google Drive session expired. Please sign in with Google again.')
      })
      .finally(() => setDriveLoading(false))
  }, [driveToken])

  useEffect(() => { if (user) loadCloudSaves() }, [user])

  const loadCloudSaves = async () => {
    if (!user) return
    const { data, error } = await supabase.from('user_saves').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
    if (!error && data) setSaves(data)
  }

  const saveToCloud = async () => {
    if (!user || !saveName.trim()) return
    setCloudLoading(true)
    try {
      await supabase.from('user_saves').upsert({ user_id: user.id, save_name: saveName.trim(), save_data: getExportState(), updated_at: new Date().toISOString() })
      setSaveName('')
      await loadCloudSaves()
    } catch { /* error handled silently, UI feedback via loading state */ }
    setCloudLoading(false)
  }

  const loadFromCloud = async (saveId: string) => {
    setCloudLoading(true)
    const { data, error } = await supabase.from('user_saves').select('save_data').eq('id', saveId).eq('user_id', user?.id).single()
    if (!error && data) { importData(data.save_data); alert('Loaded!') }
    setCloudLoading(false)
  }

  const deleteCloudSave = async (saveId: string) => {
    if (!confirm('Delete this save?')) return
    await supabase.from('user_saves').delete().eq('id', saveId).eq('user_id', user?.id)
    await loadCloudSaves()
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { scopes: 'https://www.googleapis.com/auth/drive.file', redirectTo: `${window.location.origin}/oauth/consent` },
    })
  }

  const handleDriveSave = async () => {
    if (!driveToken || !driveFolderId) return
    if (!currentDriveFile) { setShowSaveAs(true); return }
    setDriveLoading(true); setDriveError(null)
    try {
      await saveToDrive(driveToken, driveFolderId, currentDriveFile.name.replace(/\.json$/, ''), getExportState(), currentDriveFile.id)
      setDriveFiles(await listDriveSaves(driveToken, driveFolderId))
    } catch { setDriveError('Failed to save to Google Drive.') }
    setDriveLoading(false)
  }

  const handleDriveSaveAs = async () => {
    if (!driveToken || !driveFolderId || !saveAsName.trim()) return
    setDriveLoading(true); setDriveError(null)
    try {
      const existing = driveFiles.find(f => f.name === `${saveAsName.trim()}.json`)
      await saveToDrive(driveToken, driveFolderId, saveAsName.trim(), getExportState(), existing?.id)
      const updated = await listDriveSaves(driveToken, driveFolderId)
      setDriveFiles(updated)
      const saved = updated.find(f => f.name === `${saveAsName.trim()}.json`)
      if (saved) setCurrentDriveFile(saved)
      setShowSaveAs(false); setSaveAsName('')
    } catch { setDriveError('Failed to save to Google Drive.') }
    setDriveLoading(false)
  }

  const handleDriveLoad = async (file: DriveFile) => {
    if (!driveToken) return
    setDriveLoading(true); setDriveError(null)
    try {
      const data = await loadFromDrive(driveToken, file.id)
      importData(data as any)
      setCurrentDriveFile(file)
    } catch { setDriveError('Failed to load from Google Drive.') }
    setDriveLoading(false)
  }

  const handleDriveDelete = async (fileId: string) => {
    if (!driveToken || !confirm('Delete this Drive save?')) return
    setDriveLoading(true)
    try {
      await deleteFromDrive(driveToken, fileId)
      if (currentDriveFile?.id === fileId) setCurrentDriveFile(null)
      if (driveFolderId) setDriveFiles(await listDriveSaves(driveToken, driveFolderId))
    } catch { setDriveError('Failed to delete.') }
    setDriveLoading(false)
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  if (!user) {
    return (
      <Card className="bg-gray-800/50 border-gray-600 max-w-md">
        <CardHeader>
          <CardTitle className="text-white">Sign In</CardTitle>
          <p className="text-gray-400 text-sm">Sign in to enable cloud saves across devices.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={signInWithGoogle} className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google + Drive
          </Button>
          <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-700"/><span className="text-xs text-gray-500">or</span><div className="flex-1 h-px bg-gray-700"/></div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa, style: { button: { background: '#374151', color: 'white', borderColor: '#4B5563' }, anchor: { color: '#A78BFA' }, message: { color: '#EF4444' }, input: { background: '#374151', color: 'white', borderColor: '#4B5563' } } }}
            providers={['discord']}
            redirectTo={`${window.location.origin}/oauth/consent`}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* User info */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-green-400 font-medium">{user.user_metadata?.full_name || user.email}</p>
            <p className="text-gray-400 text-xs">{user.email}</p>
          </div>
          <Button onClick={async () => { await signOut(); setUser(null) }} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">Sign Out</Button>
        </CardContent>
      </Card>

      {/* Supabase cloud saves */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader><CardTitle className="text-blue-400">☁️ Cloud Saves</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Save name..." className="bg-gray-700 border-gray-600 text-white" />
            <Button onClick={saveToCloud} disabled={cloudLoading || !saveName.trim()} className="bg-green-600 hover:bg-green-700 shrink-0">Save</Button>
          </div>
          {saves.length === 0 && <p className="text-gray-500 text-sm text-center py-2">No cloud saves yet.</p>}
          {saves.map(save => (
            <div key={save.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{save.save_name}</p>
                <p className="text-gray-400 text-xs">{new Date(save.updated_at!).toLocaleString()}</p>
              </div>
              <Button onClick={() => loadFromCloud(save.id!)} disabled={cloudLoading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">Load</Button>
              <Button onClick={() => deleteCloudSave(save.id!)} disabled={cloudLoading} size="sm" variant="destructive" className="text-xs">Delete</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Google Drive saves */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-yellow-400">🗂 Google Drive Saves</CardTitle>
          <p className="text-gray-400 text-sm">Saves as JSON files in your Google Drive.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {driveError && <p className="text-red-400 text-sm">{driveError}</p>}
          {!driveToken && (
            <Button onClick={signInWithGoogle} className="bg-white hover:bg-gray-100 text-gray-900 font-medium flex items-center gap-2 justify-center w-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google to use Drive
            </Button>
          )}
          {driveToken && !driveConnected && driveLoading && (
            <p className="text-gray-400 text-sm">Connecting to Google Drive...</p>
          )}
          {driveToken && driveConnected && (
            <>
              {/* Current file + Save / Save As */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-300 flex-1 truncate">
                  {currentDriveFile ? `📄 ${currentDriveFile.name.replace(/\.json$/, '')}` : '📄 New file'}
                </span>
                <Button onClick={handleDriveSave} disabled={driveLoading} size="sm" className="bg-green-600 hover:bg-green-700">Save</Button>
                <Button onClick={() => { setSaveAsName(currentDriveFile?.name.replace(/\.json$/, '') ?? ''); setShowSaveAs(true) }} disabled={driveLoading} size="sm" variant="outline" className="border-gray-500 text-gray-200 hover:bg-gray-700">Save As</Button>
              </div>
              {showSaveAs && (
                <div className="flex gap-2">
                  <Input value={saveAsName} onChange={e => setSaveAsName(e.target.value)} placeholder="File name..." className="bg-gray-700 border-gray-600 text-white" autoFocus />
                  <Button onClick={handleDriveSaveAs} disabled={driveLoading || !saveAsName.trim()} className="bg-green-600 hover:bg-green-700 shrink-0">Save</Button>
                  <Button onClick={() => setShowSaveAs(false)} variant="ghost" size="sm" className="text-gray-400">✕</Button>
                </div>
              )}
              {driveFiles.length === 0 && !driveLoading && <p className="text-gray-500 text-sm text-center py-2">No Drive saves yet.</p>}
              {driveFiles.map(f => (
                <div key={f.id} className={`flex items-center gap-2 p-2 rounded ${currentDriveFile?.id === f.id ? 'bg-green-900/30 border border-green-700/40' : 'bg-gray-700/50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${currentDriveFile?.id === f.id ? 'text-green-300' : 'text-white'}`}>{f.name.replace(/\.json$/, '')}</p>
                    <p className="text-gray-400 text-xs">{new Date(f.modifiedTime).toLocaleString()}</p>
                  </div>
                  <Button onClick={() => handleDriveLoad(f)} disabled={driveLoading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">Load</Button>
                  <Button onClick={() => handleDriveDelete(f.id)} disabled={driveLoading} size="sm" variant="destructive" className="text-xs">Delete</Button>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
