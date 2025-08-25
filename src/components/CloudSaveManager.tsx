'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, UserSave } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CloudSaveManagerProps {
  user: User | null
  currentData: any
  onLoadData: (data: any) => void
}

export default function CloudSaveManager({ user, currentData, onLoadData }: CloudSaveManagerProps) {
  const [saves, setSaves] = useState<UserSave[]>([])
  const [saveName, setSaveName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSaves()
    }
  }, [user])

  const loadSaves = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_saves')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading saves:', error)
      return
    }

    setSaves(data || [])
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

      onLoadData(data.save_data)
      setSelectedSaveId(saveId)
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
      if (selectedSaveId === saveId) {
        setSelectedSaveId(null)
      }
    } catch (error) {
      console.error('Error deleting save:', error)
      alert('Error deleting save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-gray-400">🔒 Cloud Saves</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Sign in to save your calculator data to the cloud and access it from any device!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-green-400">☁️ Cloud Saves</CardTitle>
        <p className="text-gray-400 text-sm">
          Your data is automatically saved and synced across devices!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Current Data */}
        <div className="space-y-2">
          <Label className="text-white">Save Current Setup</Label>
          <div className="flex gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter save name..."
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button 
              onClick={saveToCloud}
              disabled={loading || !saveName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              💾 Save
            </Button>
          </div>
        </div>

        {/* Load Existing Saves */}
        {saves.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Your Cloud Saves</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {saves.map((save) => (
                <div key={save.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{save.save_name}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(save.updated_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => loadFromCloud(save.id!)}
                    disabled={loading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    📂 Load
                  </Button>
                  <Button 
                    onClick={() => deleteSave(save.id!)}
                    disabled={loading}
                    size="sm"
                    variant="destructive"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {saves.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No cloud saves yet. Create your first save above!
          </p>
        )}
      </CardContent>
    </Card>
  )
}