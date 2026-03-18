"use client"

import { useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDisplayValue, formatItemName, getItemCategory, getItemsByCategory, groupItemsByType } from '@/utils/helpers'

function organizeEquipmentBySets(items: string[]): { [setName: string]: string[] } {
  const sets: { [setName: string]: string[] } = {}

  items.forEach(item => {
    let setName = 'Other'
    if (item.includes('BloodMoon')) setName = 'Blood Moon'
    else if (item.includes('DarkSun')) setName = 'Dark Sun'
    else if (item.includes('Dusk')) setName = 'Dusk'
    else if (item.includes('FallenStar')) setName = 'Fallen Star'
    else if (item.includes('Midnight')) setName = 'Midnight'
    else if (item.includes('Nightfall')) setName = 'Nightfall'
    else if (item.includes('Twilight')) setName = 'Twilight'
    if (!sets[setName]) sets[setName] = []
    sets[setName].push(item)
  })

  Object.keys(sets).forEach(setName => {
    sets[setName].sort((a, b) => {
      const order = ['Equip', 'Medal', 'Ring', 'Suit']
      return order.findIndex(type => a.includes(type)) - order.findIndex(type => b.includes(type))
    })
  })

  const orderedSets: { [setName: string]: string[] } = {}
  const order = ['Dusk', 'Nightfall', 'Midnight', 'Twilight', 'Fallen Star', 'Blood Moon', 'Dark Sun']
  order.forEach(setName => { if (sets[setName]) orderedSets[setName] = sets[setName] })
  Object.keys(sets).forEach(setName => { if (!orderedSets[setName]) orderedSets[setName] = sets[setName] })
  return orderedSets
}

export default function InventoryTab() {
  const {
    inventory, setInventory,
    inventoryImages, setInventoryImages,
    isProcessingInventory, setIsProcessingInventory,
    inventoryProgress, setInventoryProgress,
    inventoryError, setInventoryError,
  } = useGameCalculator()

  const [inventoryItemsPerRow, setInventoryItemsPerRow] = useState(4)
  const inventoryGridCols: Record<number, string> = {
    2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
  }

  const handleInventoryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setIsProcessingInventory(true)
    setInventoryError(null)
    setInventoryProgress('')
    try {
      const newInventory = { ...inventory }
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setInventoryProgress(`Processing image ${i + 1}/${files.length}: ${file.name}`)
        try {
          const imageUrl = URL.createObjectURL(file)
          const itemName = file.name.replace(/\.[^/.]+$/, "")
          setInventoryImages(prev => ({ ...prev, [itemName]: imageUrl }))
          if (!newInventory[itemName]) {
            newInventory[itemName] = { count: 1, lastUpdated: new Date().toISOString() }
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error)
          setInventoryError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      setInventory(newInventory)
    } catch (error) {
      setInventoryError(`Inventory processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingInventory(false)
      setInventoryProgress('')
      event.target.value = ''
    }
  }

  const updateInventoryItem = (itemName: string, newCount: number) => {
    setInventory(prev => ({
      ...prev,
      [itemName]: { count: Math.max(0, newCount), lastUpdated: new Date().toISOString(), imageUrl: prev[itemName]?.imageUrl }
    }))
  }

  const renderItemCard = (itemName: string, assetPath: string) => (
    <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
      <img
        src={`/InventoryAssets/${assetPath}/${itemName}.PNG`}
        alt={itemName}
        className="w-20 h-20 object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
          className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6">-</Button>
        <input type="number" value={inventory[itemName]?.count || 0}
          onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1" />
        <Button size="sm" onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6">+</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-gray-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-red-600">All Items</TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-red-600">Resources</TabsTrigger>
          <TabsTrigger value="warden-items" className="data-[state=active]:bg-red-600">Warden Items</TabsTrigger>
          <TabsTrigger value="lover-child" className="data-[state=active]:bg-red-600">Lover & Child</TabsTrigger>
          <TabsTrigger value="familiar" className="data-[state=active]:bg-red-600">Familiar</TabsTrigger>
          <TabsTrigger value="misc" className="data-[state=active]:bg-red-600">Misc Items</TabsTrigger>
          <TabsTrigger value="warden-equip" className="data-[state=active]:bg-red-600">Warden Equipment</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <Label className="text-sm text-gray-300">Items per row:</Label>
          <select value={inventoryItemsPerRow} onChange={(e) => setInventoryItemsPerRow(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm">
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <TabsContent value="all" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600 mb-4">
            <CardHeader>
              <CardTitle className="text-blue-400">📸 Upload Inventory Images</CardTitle>
              <div className="text-sm text-gray-300">
                Upload images of your inventory items to track them visually (only on this tab).
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <input type="file" multiple accept=".png,.jpg,.jpeg" onChange={handleInventoryImageUpload}
                    disabled={isProcessingInventory}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:bg-gray-500" />
                </div>
                {isProcessingInventory && <div className="text-yellow-400">{inventoryProgress || "Processing images..."}</div>}
                {inventoryError && <div className="text-red-400 text-sm">{inventoryError}</div>}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-green-400">All Items</CardTitle>
              <div className="text-sm text-gray-300">
                {Object.keys(inventory).length === 0 ? 'No items in inventory' : `${Object.keys(inventory).length} items tracked`}
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(inventory).length === 0 ? (
                <div className="text-center text-gray-400 py-8">No items in inventory</div>
              ) : (
                <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                  {Object.entries(inventory).map(([itemName, itemData]) => (
                    <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                      <img
                        src={inventoryImages[itemName] || `/InventoryAssets/${getItemCategory(itemName)}/${itemName}.PNG`}
                        alt={itemName} className="w-20 h-20 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => updateInventoryItem(itemName, Math.max(0, itemData.count - 1))}
                          className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6">-</Button>
                        <input type="number" value={itemData.count}
                          onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1" />
                        <Button size="sm" onClick={() => updateInventoryItem(itemName, itemData.count + 1)}
                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6">+</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Resources</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupItemsByType(getItemsByCategory('Resources'))).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">{type}</h3>
                    <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                      {items.map((itemName) => renderItemCard(itemName, 'Resources'))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warden-items" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Warden Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupItemsByType(getItemsByCategory('WardenItems'))).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">{type}</h3>
                    <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                      {items.map((itemName) => renderItemCard(itemName, 'WardenItems'))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lover-child" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Lover & Child Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupItemsByType(getItemsByCategory('Lover+ChildItems'))).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">{type}</h3>
                    <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                      {items.map((itemName) => renderItemCard(itemName, 'Lover+ChildItems'))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="familiar" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Familiar Items</CardTitle></CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                {getItemsByCategory('FamiliarItems').map((itemName) => renderItemCard(itemName, 'FamiliarItems'))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="misc" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Misc Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(groupItemsByType(getItemsByCategory('MiscItems'))).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">{type}</h3>
                    <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]}`}>
                      {items.map((itemName) => renderItemCard(itemName, 'MiscItems'))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warden-equip" className="mt-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader><CardTitle className="text-green-400">Warden Equipment</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                {Object.entries(organizeEquipmentBySets(getItemsByCategory('WardenEquip'))).map(([setName, items]) => (
                  <div key={setName}>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">{setName}</h3>
                    <div className={`grid gap-4 ${inventoryGridCols[inventoryItemsPerRow]} ${setName === 'Dusk' ? 'justify-start' : ''}`}>
                      {items.map((itemName) => renderItemCard(itemName, 'WardenEquip'))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
