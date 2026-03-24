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
  const [driveSaveName, setDriveSaveName] = useState('')
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveConnected, setDriveConnected] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) setDriveToken(session.provider_token)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) setDriveToken(session.provider_token)
      if (event === 'SIGNED_OUT') {
        setDriveToken(null); setDriveFolderId(null); setDriveFiles([]); setDriveConnected(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

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
          <p className="text-gray-400 text-sm">Saves as JSON files in your Google Drive — works even without an account.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {driveError && <p className="text-red-400 text-sm">{driveError}</p>}
          {!driveToken && (
            <Button onClick={signInWithGoogle} className="bg-white hover:bg-gray-100 text-gray-900 font-medium flex items-center gap-2 justify-center w-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Connect Google Drive
            </Button>
          )}
          {driveToken && !driveConnected && (
            <Button onClick={connectDrive} disabled={driveLoading} className="w-full bg-yellow-600 hover:bg-yellow-700">
              {driveLoading ? 'Connecting...' : 'Load My Drive Saves'}
            </Button>
          )}
          {driveToken && driveConnected && (
            <>
              <div className="flex gap-2">
                <Input value={driveSaveName} onChange={e => setDriveSaveName(e.target.value)} placeholder="Drive save name..." className="bg-gray-700 border-gray-600 text-white" />
                <Button onClick={saveToDriveHandler} disabled={driveLoading || !driveSaveName.trim()} className="bg-green-600 hover:bg-green-700 shrink-0">Save</Button>
              </div>
              {driveFiles.length === 0 && !driveLoading && <p className="text-gray-500 text-sm text-center py-2">No Drive saves yet.</p>}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
