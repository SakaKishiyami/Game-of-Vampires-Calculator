'use client'

import { useState, useRef, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase, getCurrentUser, signOut, UserSave } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserMenuProps {
  user: User | null
  onUserChange: (user: User | null) => void
  currentData: any
  onLoadCloudData: (data: any) => void
  onSaveData: () => void
  onLoadLocalData: () => void
  onExportData: () => void
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void
  autoLoadCloudSaves: boolean
  onToggleAutoLoadCloudSaves: () => void
  onCompareData: () => void
  dataLoadPreference: 'local' | 'cloud' | 'ask' | null
  onResetDataPreference: () => void
}

export default function UserMenu({ 
  user, 
  onUserChange, 
  currentData, 
  onLoadCloudData, 
  onSaveData,
  onLoadLocalData,
  onExportData,
  onImportData,
  autoLoadCloudSaves,
  onToggleAutoLoadCloudSaves,
  onCompareData,
  dataLoadPreference,
  onResetDataPreference
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showCloudSaves, setShowCloudSaves] = useState(false)
  const [saves, setSaves] = useState<UserSave[]>([])
  const [saveName, setSaveName] = useState('')
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowAuth(false)
        setShowCloudSaves(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      onUserChange(session?.user || null)
      if (event === 'SIGNED_IN') {
        setShowAuth(false)
        loadSaves()
      }
    })

    return () => subscription.unsubscribe()
  }, [onUserChange])

  // Load cloud saves
  const loadSaves = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_saves')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setSaves(data)
    }
  }

  useEffect(() => {
    if (user) {
      loadSaves()
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    onUserChange(null)
    setIsOpen(false)
  }

  const saveToCloud = async () => {
    if (!user || !saveName.trim()) return

    setLoading(true)
    try {
      const saveData = {
        user_id: user.id,
        save_name: saveName.trim(),
        save_data: currentData,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_saves')
        .upsert(saveData)

      if (error) throw error

      setSaveName('')
      await loadSaves()
      alert('Data saved to cloud successfully!')
    } catch (error) {
      console.error('Error saving to cloud:', error)
      alert('Error saving to cloud. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadFromCloud = async (saveId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_saves')
        .select('save_data')
        .eq('id', saveId)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error

      onLoadCloudData(data.save_data)
      setIsOpen(false)
      alert('Data loaded from cloud successfully!')
    } catch (error) {
      console.error('Error loading from cloud:', error)
      alert('Error loading from cloud. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteSave = async (saveId: string) => {
    if (!confirm('Are you sure you want to delete this save?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_saves')
        .delete()
        .eq('id', saveId)
        .eq('user_id', user?.id)

      if (error) throw error
      await loadSaves()
    } catch (error) {
      console.error('Error deleting save:', error)
      alert('Error deleting save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Button */}
      <div 
        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user ? (
          <>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
            </div>
            <span className="text-white text-sm hidden sm:block">
              {user.user_metadata?.full_name || user.email}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm">
              👤
            </div>
            <span className="text-gray-300 text-sm hidden sm:block">Sign In</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
          {user ? (
            <div className="p-4 space-y-4">
              {/* User Info */}
              <div className="border-b border-gray-700 pb-3">
                <p className="text-green-400 text-sm">
                  ✓ Signed in as {user.user_metadata?.full_name || user.email}
                </p>
              </div>

              {/* Cloud Saves Section */}
              <div className="space-y-3">
                <h3 className="text-white font-medium">☁️ Cloud Saves</h3>
                
                {/* Auto-load preference */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-load-cloud-saves"
                    checked={autoLoadCloudSaves}
                    onCheckedChange={onToggleAutoLoadCloudSaves}
                    className="border-gray-600 data-[state=checked]:bg-green-600"
                  />
                  <Label htmlFor="auto-load-cloud-saves" className="text-xs text-gray-300">
                    Auto-load latest save on page refresh
                  </Label>
                </div>

                {/* Data preference display */}
                {dataLoadPreference && (
                  <div className="bg-gray-700/30 p-2 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">
                        When both local & cloud data exist:
                      </span>
                      <span className={`font-medium ${
                        dataLoadPreference === 'local' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        Always load {dataLoadPreference === 'local' ? '💾 Local' : '☁️ Cloud'}
                      </span>
                    </div>
                    <Button 
                      onClick={onResetDataPreference}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 h-6 text-xs text-gray-500 hover:text-white"
                    >
                      Reset preference
                    </Button>
                  </div>
                )}
                
                {/* Save Current Data */}
                <div className="space-y-2">
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter save name..."
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                  <Button 
                    onClick={saveToCloud}
                    disabled={loading || !saveName.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-sm"
                  >
                    💾 Save to Cloud
                  </Button>
                </div>

                {/* Compare Data Button */}
                <Button 
                  onClick={onCompareData}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  ⚖️ Compare Local vs Cloud Data
                </Button>

                {/* Load Cloud Saves */}
                {saves.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-gray-400 text-xs">Your Cloud Saves:</p>
                    {saves.map((save) => (
                      <div key={save.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-white truncate">{save.save_name}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(save.updated_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          onClick={() => loadFromCloud(save.id!)}
                          disabled={loading}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 text-xs"
                        >
                          📂
                        </Button>
                        <Button 
                          onClick={() => deleteSave(save.id!)}
                          disabled={loading}
                          size="sm"
                          variant="destructive"
                          className="px-2 py-1 text-xs"
                        >
                          🗑️
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Local Save/Load */}
              <div className="border-t border-gray-700 pt-3 space-y-2">
                <h4 className="text-gray-300 text-sm">💾 Local Data</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={onSaveData}
                    className="bg-gray-600 hover:bg-gray-700 text-xs"
                  >
                    Save Local
                  </Button>
                  <Button 
                    onClick={onLoadLocalData}
                    className="bg-gray-600 hover:bg-gray-700 text-xs"
                  >
                    Load Local
                  </Button>
                  <Button 
                    onClick={onExportData}
                    className="bg-gray-600 hover:bg-gray-700 text-xs"
                  >
                    Export File
                  </Button>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 hover:bg-gray-700 text-xs"
                  >
                    Import File
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </div>

              {/* Sign Out */}
              <div className="border-t border-gray-700 pt-3">
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {showAuth ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-white font-medium">🎮 Sign In with Discord</h3>
                    <p className="text-gray-400 text-sm">
                      Save your data to the cloud!
                    </p>
                  </div>
                  <Auth
                    supabaseClient={supabase}
                    appearance={{ 
                      theme: ThemeSupa,
                      style: {
                        button: {
                          background: '#374151',
                          color: 'white',
                          borderColor: '#4B5563',
                          fontSize: '14px',
                        },
                        anchor: { color: '#A78BFA' },
                        message: { color: '#EF4444' },
                        input: {
                          background: '#374151',
                          color: 'white',
                          borderColor: '#4B5563',
                          fontSize: '14px',
                        }
                      }
                    }}
                    providers={['discord']}
                    redirectTo={`${window.location.origin}/auth/callback`}
                  />
                  <Button 
                    onClick={() => setShowAuth(false)}
                    variant="ghost" 
                    className="w-full text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowAuth(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🎮 Sign In with Discord
                  </Button>
                  
                  {/* Local Data Options for Non-Signed Users */}
                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <h4 className="text-gray-300 text-sm">💾 Local Data</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={onSaveData}
                        className="bg-gray-600 hover:bg-gray-700 text-xs"
                      >
                        Save Local
                      </Button>
                      <Button 
                        onClick={onLoadLocalData}
                        className="bg-gray-600 hover:bg-gray-700 text-xs"
                      >
                        Load Local
                      </Button>
                      <Button 
                        onClick={onExportData}
                        className="bg-gray-600 hover:bg-gray-700 text-xs"
                      >
                        Export File
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-600 hover:bg-gray-700 text-xs"
                      >
                        Import File
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={onImportData}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}