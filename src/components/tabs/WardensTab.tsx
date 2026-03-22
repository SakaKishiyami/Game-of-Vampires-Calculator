"use client"

import React from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDisplayValue, getAttributeColor, getAttributeBg, renderStars, nonNegativeIntInputProps } from '@/utils/helpers'
import { wardenGroups } from '@/data/wardens'
import type { AttributeBreakdown, UploadedWardenData } from '@/types'

const allWardens = [
  { name: "Thorgrim", group: "circus", attributes: ["Intellect", "Strength"], tier: 5, skins: [] },
  { name: "Naja", group: "circus", attributes: ["Allure", "Spirit"], tier: 5, skins: [] },
  { name: "Diavolo", group: "circus", attributes: ["Spirit", "Strength"], tier: 5, skins: [] },
  { name: "Jester", group: "circus", attributes: ["Allure", "Intellect"], tier: 5, skins: [] },
  { name: "Dominique", group: "circus", attributes: ["Balance"], tier: 5, skins: [] },
  { name: "Ivan", group: "tyrants", attributes: ["Allure", "Spirit"], tier: 5, skins: ["IvanSkin1"] },
  { name: "Max", group: "tyrants", attributes: ["Spirit", "Strength"], tier: 5, skins: ["MaxSkin1"] },
  { name: "Erzsebet", group: "tyrants", attributes: ["Allure", "Intellect"], tier: 5, skins: ["ErzsebetSkin1"] },
  { name: "Maria", group: "tyrants", attributes: ["Balance"], tier: 5, skins: ["MariaSkin1"] },
  { name: "Eddie", group: "noir", attributes: ["Strength"], tier: 5, skins: ["EddieSkin1"] },
  { name: "Scarlet", group: "noir", attributes: ["Allure"], tier: 5, skins: ["ScarletSkin1"] },
  { name: "Sam", group: "noir", attributes: ["Intellect"], tier: 5, skins: ["SamSkin1"] },
  { name: "Grendel", group: "noir", attributes: ["Spirit"], tier: 5, skins: ["GrendelSkin1"] },
  { name: "Rudra", group: "hunt", attributes: ["Strength"], tier: 5, skins: ["RudraSkin1", "RudraSkin2"] },
  { name: "Woden", group: "hunt", attributes: ["Allure"], tier: 5, skins: ["WodenSkin1", "WodenSkin2"] },
  { name: "Artemis", group: "hunt", attributes: ["Intellect"], tier: 5, skins: ["ArtemisSkin1", "ArtemisSkin2"] },
  { name: "Finn", group: "hunt", attributes: ["Spirit"], tier: 5, skins: ["FinnSkin1", "FinnSkin2"] },
  { name: "Aurelia", group: "other", attributes: ["Allure", "Strength"], tier: 5, skins: ["AureliaSkin1"] },
  { name: "Asra", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: [] },
  { name: "Harker", group: "other", attributes: ["Strength"], tier: 5, skins: ["HarkerSkin1", "HarkerSkin2"] },
  { name: "Pavan", group: "other", attributes: ["Strength"], tier: 5, skins: ["PavanSkin1"] },
  { name: "Frederick", group: "other", attributes: ["Allure"], tier: 5, skins: ["FrederickSkin1"] },
  { name: "Carmilla", group: "other", attributes: ["Balance"], tier: 5, skins: ["CarmillaSkin1", "CarmillaSkin2"] },
  { name: "Gilgamesh", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: ["GilgameshSkin1"] },
  { name: "Drusilla", group: "other", attributes: ["Allure"], tier: 5, skins: [] },
  { name: "Tomas", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["TomasSkin1"] },
  { name: "Temujin", group: "other", attributes: ["Allure", "Strength"], tier: 5, skins: ["TemujinSkin1", "TemujinSkin2"] },
  { name: "Josey", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["JoseySkin1"] },
  { name: "Julie", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: ["JulieSkin1"] },
  { name: "Mortimer", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
  { name: "Cleo", group: "other", attributes: ["Balance"], tier: 5, skins: ["CleoSkin1"] },
  { name: "Mike", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["MikeSkin1"] },
  { name: "Ulfred", group: "other", attributes: ["Strength"], tier: 5, skins: [] },
  { name: "Diana", group: "other", attributes: ["Balance"], tier: 5, skins: ["DianaSkin1"] },
  { name: "Damian", group: "other", attributes: ["Balance"], tier: 5, skins: ["DamianSkin1"] },
  { name: "Vance", group: "other", attributes: ["Balance"], tier: 5, skins: ["VanceSkin1"] },
  { name: "Edward", group: "other", attributes: ["Intellect"], tier: 5, skins: [] },
  { name: "William", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: ["WilliamSkin1"] },
  { name: "Vicente", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: ["VicenteSkin1"] },
  { name: "Saber", group: "other", attributes: ["Strength"], tier: 5, skins: [] },
  { name: "Nikolai", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: [] },
  { name: "Cornelius", group: "other", attributes: ["Strength"], tier: 5, skins: ["CorneliusSkin1"] },
  { name: "Rollo", group: "other", attributes: ["Allure"], tier: 5, skins: ["RolloSkin1"] },
  { name: "Morien", group: "other", attributes: ["Strength"], tier: 5, skins: ["MorienSkin1", "MorienSkin2"] },
  { name: "Piper", group: "other", attributes: ["Spirit"], tier: 5, skins: ["PiperSkin1"] },
  { name: "Robert", group: "other", attributes: ["Allure", "Spirit"], tier: 5, skins: [] },
  { name: "John", group: "other", attributes: ["Spirit"], tier: 5, skins: ["JohnSkin1"] },
  { name: "Lorenzo", group: "other", attributes: ["Intellect"], tier: 5, skins: ["LorenzoSkin1"] },
  { name: "Hans", group: "other", attributes: ["Spirit"], tier: 5, skins: ["HansSkin1"] },
  { name: "Franco", group: "other", attributes: ["Allure"], tier: 5, skins: ["FrancoSkin1"] },
  { name: "Alastair", group: "other", attributes: ["Spirit"], tier: 5, skins: ["AlastairSkin1"] },
  { name: "Elsie", group: "other", attributes: ["Allure", "Spirit"], tier: 5, skins: ["ElsieSkin1"] },
  { name: "Nostradamus", group: "other", attributes: ["Intellect"], tier: 5, skins: ["NostradamusSkin1"] },
  { name: "Erik", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: ["ErikSkin1"] },
  { name: "Victor", group: "other", attributes: ["Balance"], tier: 5, skins: ["VictorSkin1"] },
  { name: "Poe", group: "other", attributes: ["Balance"], tier: 5, skins: ["PoeSkin1"] },
  { name: "Candace", group: "other", attributes: ["Balance"], tier: 5, skins: ["CandaceSkin1", "CandaceSkin2"] },
  { name: "Cesare", group: "other", attributes: [], tier: 5, skins: ["CesareSkin1"] },
  { name: "Charlemagne", group: "other", attributes: [], tier: 5, skins: ["CharlemagneSkin1"] },
  { name: "Thanatos", group: "other", attributes: [], tier: 5, skins: ["ThanatosSkin1"] },
]

function parseNumberWithSuffix(value: string): number {
  const numStr = value.toString().toLowerCase().replace(/,/g, '').trim()
  if (numStr.includes(' k')) return parseFloat(numStr.replace(' k', '')) * 1000
  else if (numStr.includes(' m')) return parseFloat(numStr.replace(' m', '')) * 1000000
  else if (numStr.includes('k')) return parseFloat(numStr.replace('k', '')) * 1000
  else if (numStr.includes('m')) {
    const numPart = numStr.replace('m', '')
    const num = parseFloat(numPart)
    if (num >= 100 && num < 1000) return (num / 100) * 1000000
    return num * 1000000
  }
  return parseFloat(numStr) || 0
}

function parseWardenData(content: string, fileName: string) {
  const wardenName = fileName.replace(/\.(txt|json|csv|png|jpg|jpeg)$/i, '')
  let lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  const splitLines: string[] = []
  const bonusPatterns = [
    'Talent Bonus:', 'Book Bonus:', 'Scarlet Bond Bonus:', 'Presence Bonus:',
    'Aura Bonus:', 'Conclave Bonus:', 'Avatar Bonus:', 'Familiar Bonus:'
  ]
  for (const line of lines) {
    if (line.includes('Talent Bonus') && line.includes('Book Bonus')) {
      let currentLine = line
      for (const pattern of bonusPatterns) {
        if (currentLine.includes(pattern)) {
          const startIndex = currentLine.indexOf(pattern)
          let endIndex = currentLine.length
          for (const nextPattern of bonusPatterns) {
            if (nextPattern !== pattern) {
              const nextIndex = currentLine.indexOf(nextPattern, startIndex + 1)
              if (nextIndex !== -1 && nextIndex < endIndex) endIndex = nextIndex
            }
          }
          const bonusLine = currentLine.substring(startIndex, endIndex).trim()
          if (bonusLine) splitLines.push(bonusLine)
          currentLine = currentLine.substring(0, startIndex) + currentLine.substring(endIndex)
        }
      }
    } else {
      splitLines.push(line)
    }
  }
  lines = splitLines

  let totalAttributes = 0
  const attributeData = {
    strength: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
    allure: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
    intellect: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
    spirit: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 }
  }

  let foundAttributeDetail = false
  const attributeOrder = ['strength', 'allure', 'intellect', 'spirit']

  for (const line of lines) {
    if (line.includes('Attribute Detail')) { foundAttributeDetail = true; continue }
    if (foundAttributeDetail && totalAttributes === 0) {
      const match = line.match(/([0-9,.]+[KM]?)/i)
      if (match) { totalAttributes = parseNumberWithSuffix(match[1]); break }
    }
  }

  const attributeTotalLines: string[] = []
  let foundFirstAttributeTotal = false
  for (const line of lines) {
    if (!foundAttributeDetail) continue
    if (!foundFirstAttributeTotal && line.match(/([0-9,.]+[KM]?)/i)) { foundFirstAttributeTotal = true; continue }
    if (line.match(/[0-9,.]+(?:\s*[KM])/) && !line.includes('Bonus:')) attributeTotalLines.push(line)
  }

  const individualAttributeTotals = attributeTotalLines.slice(-4)
  for (let i = 0; i < attributeOrder.length && i < individualAttributeTotals.length; i++) {
    const currentAttribute = attributeOrder[i]
    const attr = attributeData[currentAttribute as keyof typeof attributeData]
    const totalLine = individualAttributeTotals[i]
    const totalMatch = totalLine.match(/([0-9,.]+(?:\s*[KM]))/)
    if (totalMatch) attr.total = parseNumberWithSuffix(totalMatch[1])
  }

  const attributeTotalLineIndices: number[] = []
  let foundFirstIdx = false
  for (let i = 0; i < lines.length; i++) {
    if (!foundAttributeDetail) continue
    if (!foundFirstIdx && lines[i].match(/([0-9,.]+[KM]?)/i)) { foundFirstIdx = true; continue }
    if (lines[i].match(/[0-9,.]+(?:\s*[KM])/) && !lines[i].includes('Bonus:')) attributeTotalLineIndices.push(i)
  }
  const individualAttributeTotalLineIndices = attributeTotalLineIndices.slice(-4)

  const lineToAttributeMap: { [lineIndex: number]: string } = {}
  for (let i = 0; i < lines.length; i++) {
    if (!foundAttributeDetail) continue
    let attributeIndex = -1
    for (let j = 0; j < individualAttributeTotalLineIndices.length; j++) {
      if (i < individualAttributeTotalLineIndices[j]) { attributeIndex = j - 1; break }
    }
    if (attributeIndex === -1 && individualAttributeTotalLineIndices.length > 0) attributeIndex = individualAttributeTotalLineIndices.length - 1
    if (attributeIndex === -1 && individualAttributeTotalLineIndices.length > 0) attributeIndex = 0
    if (attributeIndex >= 0 && attributeIndex < attributeOrder.length) lineToAttributeMap[i] = attributeOrder[attributeIndex]
  }

  const bonusFields: [string, keyof typeof attributeData.strength][] = [
    ['Talent Bonus:', 'talentBonus'], ['Book Bonus:', 'bookBonus'], ['Scarlet Bond Bonus:', 'scarletBondBonus'],
    ['Presence Bonus:', 'presenceBonus'], ['Aura Bonus:', 'auraBonus'], ['Conclave Bonus:', 'conclaveBonus'],
    ['Avatar Bonus:', 'avatarBonus'], ['Familiar Bonus:', 'familiarBonus']
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const attributeName = lineToAttributeMap[i]
    if (!attributeName || !foundAttributeDetail) continue
    for (const [label, field] of bonusFields) {
      if (line.includes(label)) {
        const match = line.match(new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([0-9,.]+(?:\\s*[KM])?)`, 'i'))
        if (match) attributeData[attributeName as keyof typeof attributeData][field] = parseNumberWithSuffix(match[1])
      }
    }
  }

  let calculatedTotal = 0
  Object.values(attributeData).forEach(attr => {
    calculatedTotal += attr.talentBonus + attr.bookBonus + attr.scarletBondBonus +
      attr.presenceBonus + attr.auraBonus + attr.conclaveBonus + attr.avatarBonus + attr.familiarBonus
  })

  return { wardenName, data: { totalAttributes: calculatedTotal, ...attributeData } }
}

export default function WardensTab() {
  const {
    wardenCounts, setWardenCounts, selectedWardens, setSelectedWardens,
    wardenSkins, setWardenSkins, wardenStats, setWardenStats,
    uploadedWardenData, setUploadedWardenData,
    hasNyx, setHasNyx, hasDracula, setHasDracula,
    hasVictor, setHasVictor, hasFrederick, setHasFrederick,
    activeWardenTab, setActiveWardenTab,
    isUploading, setIsUploading, uploadError, setUploadError,
    ocrProgress, setOcrProgress,
  } = useGameCalculator()

  const handleWardenSelection = (group: string, warden: string) => {
    setSelectedWardens((prev: any) => {
      const currentSelected = prev[group] || []
      const isSelected = currentSelected.includes(warden)
      if (isSelected) {
        return { ...prev, [group]: currentSelected.filter((w: string) => w !== warden) }
      } else if (currentSelected.length < wardenCounts[group as keyof typeof wardenCounts]) {
        return { ...prev, [group]: [...currentSelected, warden] }
      }
      return prev
    })
  }

  const handleSkinToggle = (wardenName: string, skinName: string) => {
    setWardenSkins((prev) => ({
      ...prev,
      [wardenName]: { ...prev[wardenName], [skinName]: !prev[wardenName]?.[skinName] },
    }))
  }

  const processImageWithOCR = async (file: File): Promise<string> => {
    setOcrProgress('Loading OCR engine...')
    const Tesseract = await import('tesseract.js')
    try {
      setOcrProgress('Initializing OCR...')
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') setOcrProgress(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      })
      return text
    } finally {
      setOcrProgress('')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    setUploadError(null)
    setOcrProgress('')
    try {
      const newWardenData = { ...uploadedWardenData }
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          let content: string
          if (file.type.startsWith('image/')) {
            setOcrProgress(`Processing image ${i + 1}/${files.length}: ${file.name}`)
            content = await processImageWithOCR(file)
          } else {
            content = await file.text()
          }
          const parsed = parseWardenData(content, file.name)
          newWardenData[parsed.wardenName] = parsed.data
          successCount++
        } catch (error) {
          errorCount++
          errors.push(error instanceof Error ? error.message : `Failed to parse ${file.name}`)
        }
      }
      setUploadedWardenData(newWardenData)
      if (errorCount > 0) {
        setUploadError(`Successfully uploaded ${successCount} files. Errors: ${errors.join(', ')}`)
      } else {
        setUploadError(null)
      }
    } catch (error) {
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setOcrProgress('')
      event.target.value = ''
    }
  }

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-red-400">Wardens</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Special Wardens */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Special Wardens</h3>
          <div className="flex flex-wrap gap-3">
            {([
              { name: "Nyx", id: "nyx", checked: hasNyx, onChange: setHasNyx, type: "Balance" },
              { name: "Dracula", id: "dracula", checked: hasDracula, onChange: setHasDracula, type: "Balance" },
              { name: "Victor", id: "victor", checked: hasVictor, onChange: setHasVictor, type: "Balance" },
              { name: "Frederick", id: "frederick", checked: hasFrederick, onChange: setHasFrederick, type: "Allure" },
            ] as const).map((warden) => (
              <div
                key={warden.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                  warden.checked ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <img
                  src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                  alt={warden.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <Label htmlFor={warden.id} className="text-yellow-400 font-medium cursor-pointer">{warden.name}</Label>
                  <div className={`text-xs ${getAttributeColor(warden.type)}`}>{warden.type}</div>
                </div>
                <Checkbox
                  id={warden.id}
                  checked={warden.checked}
                  onCheckedChange={(checked) => warden.onChange(checked === true)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Warden Subtabs */}
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeWardenTab === "summons" ? "default" : "outline"}
              onClick={() => setActiveWardenTab("summons")}
              className="bg-red-600 hover:bg-red-700"
            >
              Summons/Acquired
            </Button>
            <Button
              variant={activeWardenTab === "stats" ? "default" : "outline"}
              onClick={() => setActiveWardenTab("stats")}
              className="bg-red-600 hover:bg-red-700"
            >
              Warden Stats
            </Button>
          </div>

          {/* Summons/Acquired Tab */}
          {activeWardenTab === "summons" && (
            <div className="space-y-6">
              {Object.entries(wardenGroups).map(([groupKey, wardens]) => (
                <Card key={groupKey} className="bg-gray-700/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white capitalize">
                      {groupKey === "circus" ? "Circus Wardens" : groupKey === "tyrants" ? "Bloody Tyrants" : groupKey === "noir" ? "Monster Noir" : "Wild Hunt"}{" "}
                      ({wardenCounts[groupKey as keyof typeof wardenCounts]}/{groupKey === "noir" || groupKey === "hunt" ? 4 : 5})
                    </CardTitle>
                    <div>
                      <Label className="text-white">Number of {groupKey} wardens:</Label>
                      <Input
                        className="w-20 mt-1 bg-gray-600 border-gray-500 text-white"
                        {...nonNegativeIntInputProps(wardenCounts[groupKey as keyof typeof wardenCounts], (n) =>
                          setWardenCounts((prev) => ({
                            ...prev,
                            [groupKey]: Math.min(groupKey === 'noir' || groupKey === 'hunt' ? 4 : 5, Math.max(0, n)),
                          }))
                        )}
                      />
                    </div>
                  </CardHeader>
                  {wardenCounts[groupKey as keyof typeof wardenCounts] > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wardens.map((warden) => (
                          <div key={warden.name} className="flex items-stretch gap-3 p-2 bg-gray-600/50 border border-gray-500 rounded">
                            <div className="w-24 flex-shrink-0 flex items-center justify-center bg-gray-800/50 rounded">
                              <img
                                src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                                alt={warden.name}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                            <Button
                              variant={selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name) ? "default" : "outline"}
                              onClick={() => handleWardenSelection(groupKey, warden.name)}
                              disabled={
                                !selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name) &&
                                selectedWardens[groupKey as keyof typeof selectedWardens]?.length >= wardenCounts[groupKey as keyof typeof wardenCounts]
                              }
                              className={`p-4 h-auto flex flex-col items-start flex-1 text-left ${
                                selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name)
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-gray-600 hover:bg-gray-500"
                              }`}
                            >
                              <div className="font-semibold text-white">{warden.name}</div>
                              <div className="flex gap-1 mt-1">
                                {warden.attributes.map((attr) => (
                                  <span key={attr} className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}>
                                    {attr}
                                  </span>
                                ))}
                              </div>
                              {renderStars(warden.tier)}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Warden Stats Tab */}
          {activeWardenTab === "stats" && (
            <div className="space-y-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4 bg-gray-800">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-red-600">Overview</TabsTrigger>
                  <TabsTrigger value="detailed" className="data-[state=active]:bg-red-600">Detailed (OCR)</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Warden Overview</CardTitle>
                      <p className="text-sm text-gray-300">
                        High-level view of uploaded wardens. Use the Detailed tab for full attribute breakdowns.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(uploadedWardenData).length === 0 ? (
                        <p className="text-sm text-gray-400">
                          No OCR data yet. Switch to the Detailed tab to upload screenshots or text files.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(uploadedWardenData).map(([wardenName, data]) => (
                            <div key={wardenName} className="flex items-center justify-between rounded bg-gray-800/70 border border-gray-700 px-3 py-2 text-sm">
                              <div className="flex items-center gap-3">
                                <span className="text-white">{wardenName}</span>
                                <span className="text-xs text-gray-500">
                                  Total:{' '}
                                  {data.totalAttributes >= 1000000
                                    ? `${(data.totalAttributes / 1000000).toFixed(2)}M`
                                    : data.totalAttributes >= 1000
                                      ? `${(data.totalAttributes / 1000).toFixed(2)}K`
                                      : data.totalAttributes.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex gap-2 text-[11px] text-gray-300">
                                <span>Str: {data.strength.total.toLocaleString()}</span>
                                <span>All: {data.allure.total.toLocaleString()}</span>
                                <span>Int: {data.intellect.total.toLocaleString()}</span>
                                <span>Spi: {data.spirit.total.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-blue-400">Upload Warden Data</CardTitle>
                      <div className="text-sm text-gray-300">
                        Upload files named after your wardens containing their attribute breakdowns:
                        <ul className="mt-2 list-disc list-inside">
                          <li><strong>Screenshots (PNG/JPG):</strong> &quot;Diana.png&quot;, &quot;Scarlet.jpg&quot; - Uses OCR to extract text</li>
                          <li><strong>Text files:</strong> &quot;Diana.txt&quot;, &quot;Scarlet.json&quot; - Parses text directly</li>
                        </ul>
                        The parser will automatically extract total attributes and all bonus breakdowns.
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".txt,.json,.csv,.png,.jpg,.jpeg"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:bg-gray-500"
                          />
                        </div>
                        {isUploading && (
                          <div className="text-yellow-400">{ocrProgress || "Uploading and parsing files..."}</div>
                        )}
                        {uploadError && <div className="text-red-400 text-sm">{uploadError}</div>}
                        {Object.keys(uploadedWardenData).length > 0 && (
                          <div className="text-green-400 text-sm">
                            Successfully uploaded data for: {Object.keys(uploadedWardenData).join(', ')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {Object.keys(uploadedWardenData).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white">Uploaded Warden Data</h3>
                      {Object.entries(uploadedWardenData).map(([wardenName, data]) => (
                        <Card key={wardenName} className="bg-gray-800/70 border-gray-600">
                          <CardHeader className="py-3">
                            <CardTitle className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-gray-900 flex items-center justify-center overflow-hidden">
                                  <img
                                    src={`/Gov/Wardens/BaseWardens/${wardenName}.png`}
                                    alt={wardenName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                </div>
                                <div>
                                  <span className="block text-white text-sm">{wardenName}</span>
                                  <span className="block text-[11px] text-gray-400">
                                    Total:{' '}
                                    {data.totalAttributes >= 1000000
                                      ? `${(data.totalAttributes / 1000000).toFixed(2)}M`
                                      : data.totalAttributes >= 1000
                                        ? `${(data.totalAttributes / 1000).toFixed(2)}K`
                                        : data.totalAttributes.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {(['strength', 'allure', 'intellect', 'spirit'] as const).map((attr) => {
                                const attrData = data[attr]
                                if (typeof attrData === 'object' && attrData.total !== undefined) {
                                  const bonusFields = [
                                    { key: 'total', label: 'Total' },
                                    { key: 'talentBonus', label: 'Talent Bonus' },
                                    { key: 'bookBonus', label: 'Book Bonus' },
                                    { key: 'scarletBondBonus', label: 'Scarlet Bond Bonus' },
                                    { key: 'presenceBonus', label: 'Presence Bonus' },
                                    { key: 'auraBonus', label: 'Aura Bonus' },
                                    { key: 'conclaveBonus', label: 'Conclave Bonus' },
                                    { key: 'avatarBonus', label: 'Avatar Bonus' },
                                    { key: 'familiarBonus', label: 'Familiar Bonus' },
                                  ]
                                  return (
                                    <div key={attr} className="space-y-3">
                                      <div className={`font-semibold capitalize ${getAttributeColor(attr)} text-lg`}>{attr}</div>
                                      <div className="space-y-2">
                                        {bonusFields.map(({ key, label }) => (
                                          <div key={key}>
                                            <Label className="text-sm text-gray-300">{label}</Label>
                                            <Input
                                              type="number"
                                              value={key === 'total' || key === 'talentBonus' || key === 'bookBonus' || key === 'scarletBondBonus' || key === 'presenceBonus' || key === 'auraBonus'
                                                ? getDisplayValue((attrData as any)[key])
                                                : (attrData as any)[key]
                                              }
                                              onChange={(e) => {
                                                const value = e.target.value
                                                if (
                                                  (key === 'total' || key === 'talentBonus' || key === 'bookBonus' || key === 'scarletBondBonus' || key === 'presenceBonus' || key === 'auraBonus') &&
                                                  value === ''
                                                ) {
                                                  setUploadedWardenData((prev: UploadedWardenData) => {
                                                    const w = prev[wardenName]
                                                    if (!w) return prev
                                                    const breakdown = w[attr]
                                                    return {
                                                      ...prev,
                                                      [wardenName]: {
                                                        ...w,
                                                        [attr]: {
                                                          ...breakdown,
                                                          [key as keyof AttributeBreakdown]: 0,
                                                        },
                                                      },
                                                    }
                                                  })
                                                  return
                                                }
                                                if (value === '-') return
                                                const newValue = parseInt(value) || 0
                                                setUploadedWardenData((prev: UploadedWardenData) => {
                                                  const w = prev[wardenName]
                                                  if (!w) return prev
                                                  const breakdown = w[attr]
                                                  return {
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...w,
                                                      [attr]: {
                                                        ...breakdown,
                                                        [key as keyof AttributeBreakdown]: newValue,
                                                      },
                                                    },
                                                  }
                                                })
                                              }}
                                              onBlur={(e) => {
                                                if (key === 'total' || key === 'talentBonus' || key === 'bookBonus' || key === 'scarletBondBonus' || key === 'presenceBonus' || key === 'auraBonus') {
                                                  const value = e.target.value
                                                  const newValue = value === '' ? 0 : parseInt(value) || 0
                                                  setUploadedWardenData((prev: UploadedWardenData) => {
                                                    const w = prev[wardenName]
                                                    if (!w) return prev
                                                    const breakdown = w[attr]
                                                    return {
                                                      ...prev,
                                                      [wardenName]: {
                                                        ...w,
                                                        [attr]: {
                                                          ...breakdown,
                                                          [key as keyof AttributeBreakdown]: newValue,
                                                        },
                                                      },
                                                    }
                                                  })
                                                }
                                              }}
                                              className="mt-1 bg-gray-600 border-gray-500 text-white"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* All Wardens with Images, Stats, and Skins */}
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">All Wardens</CardTitle>
                      <div className="text-sm text-gray-300">
                        Shows all wardens (including VIP and selected ones) with their stats and skins
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allWardens.map((warden) => {
                          const isSelected = selectedWardens[warden.group as keyof typeof selectedWardens]?.includes(warden.name) ||
                            warden.name === "Nyx" || warden.name === "Dracula"
                          return (
                            <Card key={warden.name} className="bg-gray-600/50 border-gray-500">
                              <CardContent className="p-2">
                                <div className="flex gap-2">
                                  <div className="w-[90px] h-full flex-shrink-0 flex items-center justify-center">
                                    <img
                                      src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                                      alt={warden.name}
                                      className="w-full h-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-white font-semibold text-sm">{warden.name}</span>
                                      {isSelected && (
                                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Owned</span>
                                      )}
                                    </div>
                                    <div className="flex gap-1 mb-2">
                                      {warden.attributes.map((attr) => (
                                        <span key={attr} className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}>
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="space-y-1">
                                      {(['strength', 'allure', 'intellect', 'spirit'] as const).map((attr) => (
                                        <div key={attr} className="flex items-center gap-1">
                                          <span className={`text-xs w-12 ${getAttributeColor(attr)}`}>{attr.charAt(0).toUpperCase()}</span>
                                          <Input
                                            placeholder="0"
                                            className="w-16 h-6 text-xs bg-gray-700 border-gray-600 text-white"
                                            {...nonNegativeIntInputProps(wardenStats[warden.name]?.[attr] || 0, (value) =>
                                              setWardenStats((prev) => ({
                                                ...prev,
                                                [warden.name]: { ...prev[warden.name], [attr]: value },
                                              }))
                                            )}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {warden.skins.length > 0 && (
                                    <div className="w-24 flex-shrink-0">
                                      <div className="text-xs text-gray-300 mb-1">Skins:</div>
                                      <div className="space-y-2">
                                        {warden.skins.map((skin) => (
                                          <div key={skin} className="flex flex-col items-center gap-1">
                                            <div className="w-16 h-16 flex items-center justify-center">
                                              <img
                                                src={`/Gov/Wardens/WardenSkins/${skin}.png`}
                                                alt={skin}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                              />
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Checkbox
                                                id={`skin-${warden.name}-${skin}`}
                                                checked={wardenSkins[warden.name]?.[skin] || false}
                                                onCheckedChange={() => handleSkinToggle(warden.name, skin)}
                                                className="border-gray-400"
                                              />
                                              <Label htmlFor={`skin-${warden.name}-${skin}`} className="text-xs text-gray-300">
                                                {skin.replace(`${warden.name}Skin`, 'S')}
                                              </Label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
