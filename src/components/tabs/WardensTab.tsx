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
import { WARDEN_CATALOG as allWardens } from '@/data/wardenCatalog'
import { WARDEN_TALENT_PROFILES, talentCapFromWardenLevel, type TalentAttr } from '@/data/wardenTalentProfiles'
import {
  LORD_UPGRADE_WARDENS,
  elderLordWardenGrantCount,
  isWardenOwned,
  showElderLordWardenSection,
  type WardenOwnershipContext,
} from '@/utils/wardenOwnership'
import type { AttributeBreakdown, UploadedWardenData } from '@/types'

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

function getLevelStyle(level: number): { card: string; border: string } {
  if (level >= 401) return { card: 'bg-pink-900/40',    border: 'border-pink-400/50' }
  if (level >= 351) return { card: 'bg-yellow-400/25',  border: 'border-yellow-300/70' }
  if (level >= 301) return { card: 'bg-red-900/60',     border: 'border-red-700/60' }
  if (level >= 251) return { card: 'bg-yellow-900/50',  border: 'border-yellow-500/60' }
  if (level >= 201) return { card: 'bg-purple-900/60',  border: 'border-purple-700/60' }
  if (level >= 151) return { card: 'bg-blue-900/55',    border: 'border-blue-700/60' }
  if (level >= 101) return { card: 'bg-green-900/60',   border: 'border-green-700/60' }
  return                    { card: 'bg-gray-600/50',   border: 'border-gray-500' }
}

export default function WardensTab() {
  const {
    wardenCounts, setWardenCounts, selectedWardens, setSelectedWardens,
    wardenSkins, setWardenSkins, wardenActiveSkins, setWardenActiveSkins, setWardenSkinLevels, getWardenImageSrc,
    wardenStats, setWardenStats,
    uploadedWardenData, setUploadedWardenData,
    hasNyx, setHasNyx, hasDracula, setHasDracula,
    hasVictor, setHasVictor, hasFrederick, setHasFrederick,
    activeWardenTab, setActiveWardenTab,
    isUploading, setIsUploading, uploadError, setUploadError,
    ocrProgress, setOcrProgress,
    talents,
    vipLevel,
    lordLevel,
    lordTierRewardWardens,
    setLordTierRewardWardens,
  } = useGameCalculator()

  const wardenOwnershipCtx = React.useMemo<WardenOwnershipContext>(
    () => ({
      selectedWardens,
      vipLevel,
      lordLevel,
      lordTierRewardWardens,
      hasNyx,
      hasDracula,
      hasVictor,
      hasFrederick,
    }),
    [selectedWardens, vipLevel, lordLevel, lordTierRewardWardens, hasNyx, hasDracula, hasVictor, hasFrederick],
  )

  const ownedWardens = React.useMemo(
    () => allWardens.filter((w) => isWardenOwned(w.name, wardenOwnershipCtx, allWardens)),
    [wardenOwnershipCtx],
  )

  const [wardenTalentLevels, setWardenTalentLevels] = React.useState<Record<string, Record<TalentAttr, number[]>>>({})
  const [wardenTalentExp, setWardenTalentExp] = React.useState<Record<string, number>>({})
  const [talentFocusPriority, setTalentFocusPriority] = React.useState<Record<TalentAttr, [string, string, string]>>({
    strength: ['', '', ''],
    allure: ['', '', ''],
    intellect: ['', '', ''],
    spirit: ['', '', ''],
  })
  const [activePriorityPicker, setActivePriorityPicker] = React.useState<{ attr: TalentAttr; slot: 0 | 1 | 2 } | null>(null)

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
    setWardenSkins((prev) => {
      const owned = !!prev[wardenName]?.[skinName]
      const nextOwned = !owned
      if (nextOwned) {
        setWardenSkinLevels((lv) => ({
          ...lv,
          [wardenName]: { ...lv[wardenName], [skinName]: lv[wardenName]?.[skinName] ?? 1 },
        }))
      }
      return {
        ...prev,
        [wardenName]: { ...prev[wardenName], [skinName]: nextOwned },
      }
    })
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

  const scriptExpectedStarsByAttr = React.useMemo(() => {
    const rates = [1, 0.833, 0.666, 0.5, 0.333, 0.166]
    const calc = (script: any) => {
      const star = Number(script?.selectedStar || 0)
      const qty = Number(script?.quantity || 0)
      if (star <= 0 || qty <= 0) return 0
      return qty * (rates[star - 1] ?? 0)
    }
    return {
      strength: calc((talents as any)?.strengthScript),
      allure: calc((talents as any)?.allureScript),
      intellect: calc((talents as any)?.intellectScript),
      spirit: calc((talents as any)?.spiritScript),
    }
  }, [talents])

  const getTalentStarList = React.useCallback((totalStars: number) => {
    const stars: number[] = []
    let remaining = Math.max(0, totalStars)
    while (remaining > 0 && stars.length < 10) {
      if (remaining >= 6) {
        stars.push(6)
        remaining -= 6
      } else {
        stars.push(remaining)
        remaining = 0
      }
    }
    return stars
  }, [])

  const eligibleWardensForAttr = React.useCallback(
    (attr: TalentAttr) => {
      return allWardens
        .filter((w) => {
          const p = WARDEN_TALENT_PROFILES[w.name]
          if (!p) return false
          if (!isWardenOwned(w.name, wardenOwnershipCtx, allWardens)) return false
          return p.mainStat === 'Balance' || p.mainStat.toLowerCase() === attr || p.offStat?.toLowerCase() === attr
        })
        .map((w) => w.name)
        .sort((a, b) => a.localeCompare(b))
    },
    [wardenOwnershipCtx],
  )

  const getPriorityPickerChoices = (attr: TalentAttr, slot: 0 | 1 | 2) => {
    const eligible = eligibleWardensForAttr(attr)
    const selected = talentFocusPriority[attr]
    return eligible.filter((name) => {
      return selected.every((picked, idx) => {
        if (idx === slot) return true
        return picked !== name
      })
    })
  }

  const projectedFocus = (attr: TalentAttr) => {
    const priorities = talentFocusPriority[attr].filter(Boolean)
    let remainingScriptStars = scriptExpectedStarsByAttr[attr]
    const rows: Array<{ name: string; expUsedStars: number; scriptUsedStars: number; levelGain: number; leftStarsRoom: number }> = []
    priorities.forEach((name) => {
      const p = WARDEN_TALENT_PROFILES[name]
      if (!p) return
      const lvl = wardenStats[name]?.level ?? 1
      const cap = talentCapFromWardenLevel(lvl)
      const starList = getTalentStarList(p.baseStars[attr])
      const curLevels = wardenTalentLevels[name]?.[attr] ?? starList.map(() => 0)
      const roomStars = starList.reduce((sum, star, i) => sum + star * Math.max(0, cap - (curLevels[i] ?? 0)), 0)

      const expStarsAvailable = Math.max(0, Math.floor((wardenTalentExp[name] ?? 0) / 200))
      const expUsedStars = Math.min(expStarsAvailable, roomStars)
      const roomAfterExp = roomStars - expUsedStars
      const scriptUsedStars = Math.min(remainingScriptStars, roomAfterExp)
      remainingScriptStars -= scriptUsedStars

      const spentStars = expUsedStars + scriptUsedStars
      const levelGain = p.baseStars[attr] > 0 ? spentStars / p.baseStars[attr] : 0
      rows.push({
        name,
        expUsedStars,
        scriptUsedStars,
        levelGain,
        leftStarsRoom: roomStars - spentStars,
      })
    })
    return { rows, leftoverScriptStars: remainingScriptStars }
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
                className={`inline-flex w-fit max-w-full items-center gap-3 rounded-lg p-2 border ${
                  warden.checked ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-700/50 border-gray-600'
                }`}
              >
                <div className="w-24 flex-shrink-0 flex items-center justify-center bg-gray-800/50 rounded">
                  <img
                    src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                    alt={warden.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <Label htmlFor={warden.id} className="text-yellow-400 font-medium cursor-pointer">{warden.name}</Label>
                  <div className={`text-xs ${getAttributeColor(warden.type)}`}>{warden.type}</div>
                </div>
                <div className="flex items-center">
                  <Checkbox
                    id={warden.id}
                    checked={warden.checked}
                    onCheckedChange={(checked) => warden.onChange(checked === true)}
                  />
                </div>
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
            <Button
              variant={activeWardenTab === "talents" ? "default" : "outline"}
              onClick={() => setActiveWardenTab("talents")}
              className="bg-red-600 hover:bg-red-700"
            >
              Warden Talents
            </Button>
          </div>

          {/* Summons/Acquired Tab */}
          {activeWardenTab === "summons" && (
            <div className="space-y-6">
              {showElderLordWardenSection(lordLevel) && (
                <Card className="bg-gray-700/50 border-gray-600 border-amber-600/30">
                  <CardHeader>
                    <CardTitle className="text-amber-200">Lord tier reward wardens</CardTitle>
                    <p className="text-sm text-gray-300">
                      From Elder Lord onward you choose which of the four you own (not fixed order). Slots: Elder 1 → 1, Elder 2 → 2, Elder 3 → 2, Elder 4 → 3, Elder 5 → 4, Ancient → all 4.
                      Selected:{' '}
                      <span className="text-white font-medium">
                        {lordTierRewardWardens.length} / {elderLordWardenGrantCount(lordLevel)}
                      </span>
                      . Click a card to toggle (deselect to free a slot).
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {LORD_UPGRADE_WARDENS.map((name) => {
                        const grant = elderLordWardenGrantCount(lordLevel)
                        const chosen = lordTierRewardWardens.includes(name)
                        const atCap = lordTierRewardWardens.length >= grant
                        const canTurnOn = !chosen && !atCap
                        return (
                          <button
                            type="button"
                            key={name}
                            onClick={() => {
                              if (chosen) {
                                setLordTierRewardWardens((prev) => prev.filter((n) => n !== name))
                              } else if (canTurnOn) {
                                setLordTierRewardWardens((prev) => [...prev, name])
                              }
                            }}
                            disabled={!chosen && atCap}
                            className={`rounded-lg border p-2 flex flex-col items-center gap-1 text-left transition-opacity ${
                              chosen
                                ? 'border-green-500/60 bg-green-500/10 ring-1 ring-green-500/30'
                                : atCap
                                  ? 'border-gray-600 bg-gray-800/30 opacity-50 cursor-not-allowed'
                                  : 'border-amber-600/40 bg-gray-800/40 hover:bg-gray-800/70 cursor-pointer'
                            }`}
                          >
                            <div className="w-full h-28 flex items-center justify-center bg-gray-900/50 rounded pointer-events-none">
                              <img
                                src={getWardenImageSrc(name)}
                                alt={name}
                                className="max-h-full max-w-full object-contain object-top"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                            <div className="text-sm text-white font-medium">{name}</div>
                            <div className={`text-xs ${chosen ? 'text-green-400' : 'text-gray-400'}`}>
                              {chosen ? 'Selected (owned)' : atCap ? 'Slot full — deselect another' : 'Click to add'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                        {[...ownedWardens].sort((a, b) => {
                          const tot = (n: string) => (['strength', 'allure', 'intellect', 'spirit'] as const).reduce((s, k) => s + (wardenStats[n]?.[k] || 0), 0)
                          return tot(b.name) - tot(a.name)
                        }).map((warden) => {
                          const isSelected = selectedWardens[warden.group as keyof typeof selectedWardens]?.includes(warden.name) ||
                            warden.name === "Nyx" || warden.name === "Dracula"
                          const level = wardenStats[warden.name]?.level ?? 0
                          const { card: cardBg, border: cardBorder } = getLevelStyle(level)
                          const total = (['strength', 'allure', 'intellect', 'spirit'] as const).reduce((s, k) => s + (wardenStats[warden.name]?.[k] || 0), 0)
                          return (
                            <Card key={warden.name} className={`${cardBg} ${cardBorder}`}>
                              <CardContent className="p-2">
                                <div className="flex gap-2">
                                  <div className="w-[90px] flex-shrink-0 flex flex-col gap-1">
                                    <img
                                      src={getWardenImageSrc(warden.name)}
                                      alt={warden.name}
                                      className="w-full flex-1 object-contain object-top"
                                      style={{ minHeight: '7rem' }}
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                    {warden.skins.length > 0 && (
                                      <div className="flex gap-0.5">
                                        {(['base', ...warden.skins] as string[]).map((opt) => {
                                          const active = wardenActiveSkins[warden.name] ?? 'base'
                                          const label = opt === 'base' ? 'Base' : opt.replace(`${warden.name}Skin`, 'S')
                                          return (
                                            <label key={opt} className={`flex-1 text-center cursor-pointer text-[10px] py-0.5 rounded select-none ${active === opt ? 'bg-blue-600/60 text-white' : 'bg-gray-700/60 text-gray-400 hover:bg-gray-600/60'}`}>
                                              <input type="radio" className="sr-only" name={`ws-${warden.name}`} value={opt} checked={active === opt} onChange={() => setWardenActiveSkins(prev => ({ ...prev, [warden.name]: opt }))} />
                                              {label}
                                            </label>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-white font-semibold text-sm">{warden.name}</span>
                                      {isSelected && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Owned</span>
                                      )}
                                      <div className="flex items-center gap-1 ml-auto">
                                        <span className="text-[10px] text-gray-400">Lv</span>
                                        <Input
                                          placeholder="0"
                                          className="w-12 h-5 text-xs bg-gray-700/60 border-gray-600 text-white px-1"
                                          {...nonNegativeIntInputProps(level, (value) =>
                                            setWardenStats((prev) => ({
                                              ...prev,
                                              [warden.name]: { ...prev[warden.name], level: value },
                                            }))
                                          )}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-1 mb-2 flex-wrap">
                                      {warden.attributes.map((attr) => (
                                        <span key={attr} className={`text-xs px-1.5 py-0.5 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}>
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs w-12 text-gray-300">Total</span>
                                        <span className="w-16 h-6 text-xs text-white flex items-center font-semibold">{total > 0 ? total.toLocaleString() : '—'}</span>
                                      </div>
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
                                                src={`/Gov/SkinCards/WardenSkins/${skin}.png`}
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

          {activeWardenTab === "talents" && (
            <div className="space-y-4">
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Talent Focus Priority (Auto Rollover)</CardTitle>
                  <p className="text-sm text-gray-300">
                    Uses expected script stars from the Talents tab. Pick up to 3 priority wardens per attribute. When one hits cap,
                    remaining stars roll to the next.
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['strength', 'allure', 'intellect', 'spirit'] as TalentAttr[]).map((attr) => {
                    const eligible = eligibleWardensForAttr(attr)
                    const proj = projectedFocus(attr)
                    return (
                      <div key={attr} className="rounded border border-gray-700 bg-gray-900/40 p-3 space-y-2">
                        <div className={`font-semibold capitalize ${getAttributeColor(attr)}`}>{attr} focus</div>
                        <div className="text-xs text-gray-400">Expected stars from scripts: {scriptExpectedStarsByAttr[attr].toFixed(2)}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((idx) => {
                            const slot = idx as 0 | 1 | 2
                            const picked = talentFocusPriority[attr][slot]
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() =>
                                  setActivePriorityPicker((prev) =>
                                    prev?.attr === attr && prev.slot === slot ? null : { attr, slot }
                                  )
                                }
                                className={`rounded border p-2 text-left ${
                                  activePriorityPicker?.attr === attr && activePriorityPicker?.slot === slot
                                    ? 'border-red-500 bg-red-500/10'
                                    : 'border-gray-700 bg-gray-800/60'
                                }`}
                              >
                                <div className="text-[11px] text-gray-400 mb-1">Priority {slot + 1}</div>
                                {picked ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getWardenImageSrc(picked)}
                                      alt={picked}
                                      className="w-20 h-20 rounded-lg object-contain bg-gray-900/70 p-1"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                    <span className="text-xs text-white truncate">{picked}</span>
                                  </div>
                                ) : (
                                  <div className="h-20 rounded border border-dashed border-gray-600 flex items-center justify-center text-xs text-gray-500">
                                    Choose
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {activePriorityPicker?.attr === attr && (
                          <div className="rounded border border-gray-700 bg-gray-950/70 p-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-300">
                                Pick warden for Priority {activePriorityPicker.slot + 1}
                              </div>
                              <button
                                type="button"
                                className="text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  const slot = activePriorityPicker.slot
                                  setTalentFocusPriority((prev) => ({
                                    ...prev,
                                    [attr]: prev[attr].map((v, i) => (i === slot ? '' : v)) as [string, string, string],
                                  }))
                                }}
                              >
                                Clear
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                              {getPriorityPickerChoices(attr, activePriorityPicker.slot).map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => {
                                    const slot = activePriorityPicker.slot
                                    setTalentFocusPriority((prev) => ({
                                      ...prev,
                                      [attr]: prev[attr].map((v, i) => (i === slot ? w : v)) as [string, string, string],
                                    }))
                                    setActivePriorityPicker(null)
                                  }}
                                  className="rounded border border-gray-700 bg-gray-900/70 hover:bg-gray-800 p-2 flex items-center gap-2 text-left"
                                >
                                  <img
                                    src={getWardenImageSrc(w)}
                                    alt={w}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-contain bg-gray-950/60 p-1"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                  <span className="text-xs text-white truncate">{w}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 space-y-1">
                          {proj.rows.map((r) => (
                            <div key={r.name}>
                              {r.name}: +{r.levelGain.toFixed(2)} lv ({r.expUsedStars.toFixed(2)} EXP-stars, {r.scriptUsedStars.toFixed(2)} script-stars)
                            </div>
                          ))}
                          {proj.leftoverScriptStars > 0.0001 && <div className="text-amber-300">Unassigned script-stars: {proj.leftoverScriptStars.toFixed(2)}</div>}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Warden Talent Planner</CardTitle>
                  <p className="text-sm text-gray-300">
                    Level cap by warden level: 1-99→40, 100-149→80, 150-199→120, 200-249→160, 250-299→200, 300-349→240,
                    350-399→280, 400+→320.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ownedWardens.map((w) => {
                      const p = WARDEN_TALENT_PROFILES[w.name]
                      if (!p) return null
                      const plannerLevel = wardenStats[w.name]?.level ?? 1
                      const cap = talentCapFromWardenLevel(plannerLevel)
                      const defaultLevelsByAttr = {
                        strength: getTalentStarList(p.baseStars.strength).map(() => 0),
                        allure: getTalentStarList(p.baseStars.allure).map(() => 0),
                        intellect: getTalentStarList(p.baseStars.intellect).map(() => 0),
                        spirit: getTalentStarList(p.baseStars.spirit).map(() => 0),
                      }
                      const levels = wardenTalentLevels[w.name] ?? defaultLevelsByAttr
                      const totals = {
                        strength: getTalentStarList(p.baseStars.strength).reduce((sum, star, idx) => sum + star * (levels.strength?.[idx] ?? 0), 0),
                        allure: getTalentStarList(p.baseStars.allure).reduce((sum, star, idx) => sum + star * (levels.allure?.[idx] ?? 0), 0),
                        intellect: getTalentStarList(p.baseStars.intellect).reduce((sum, star, idx) => sum + star * (levels.intellect?.[idx] ?? 0), 0),
                        spirit: getTalentStarList(p.baseStars.spirit).reduce((sum, star, idx) => sum + star * (levels.spirit?.[idx] ?? 0), 0),
                      }
                      return (
                        <div key={w.name} className="rounded border border-gray-700 bg-gray-900/40 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-lg bg-gray-800/60 p-2 flex-shrink-0">
                                <img
                                  src={getWardenImageSrc(w.name)}
                                  alt={w.name}
                                  className="w-full h-full object-contain object-top"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium">{w.name}</div>
                                <div className="text-xs text-gray-400">
                                  {p.mainStat}{p.offStat ? ` / ${p.offStat}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <div>
                              <Label className="text-gray-400 text-xs">Warden level</Label>
                              <Input
                                className="mt-1 w-24 bg-gray-900 border-gray-600"
                                {...nonNegativeIntInputProps(plannerLevel, (n) =>
                                  setWardenStats((prev) => ({
                                    ...prev,
                                    [w.name]: { ...prev[w.name], level: Math.max(1, n) },
                                  }))
                                )}
                              />
                            </div>
                            <div>
                              <Label className="text-gray-400 text-xs">Talent EXP</Label>
                              <Input
                                className="mt-1 w-32 bg-gray-900 border-gray-600"
                                {...nonNegativeIntInputProps(wardenTalentExp[w.name] ?? 0, (n) =>
                                  setWardenTalentExp((prev) => ({ ...prev, [w.name]: Math.max(0, n) }))
                                )}
                              />
                            </div>
                            <div className="text-xs text-cyan-300 pb-2">Talent cap: {cap}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(['strength', 'allure', 'intellect', 'spirit'] as TalentAttr[]).map((attr) => (
                              <div key={attr} className="rounded border border-gray-800 p-2">
                                <Label className={`text-xs capitalize ${getAttributeColor(attr)}`}>{attr} talents</Label>
                                <div className="mt-1 grid grid-cols-5 gap-1">
                                  {getTalentStarList(p.baseStars[attr]).map((star, idx) => (
                                    <Input
                                      key={`${w.name}-${attr}-${idx}`}
                                      className="h-8 bg-gray-900 border-gray-600 text-xs px-1"
                                      placeholder="0"
                                      {...nonNegativeIntInputProps(levels[attr]?.[idx] ?? 0, (n) =>
                                        setWardenTalentLevels((prev) => {
                                          const prevWarden = prev[w.name] ?? {
                                            strength: getTalentStarList(p.baseStars.strength).map(() => 0),
                                            allure: getTalentStarList(p.baseStars.allure).map(() => 0),
                                            intellect: getTalentStarList(p.baseStars.intellect).map(() => 0),
                                            spirit: getTalentStarList(p.baseStars.spirit).map(() => 0),
                                          }
                                          const nextAttr = [...(prevWarden[attr] ?? [])]
                                          nextAttr[idx] = Math.min(cap, Math.max(0, n))
                                          return {
                                            ...prev,
                                            [w.name]: {
                                              ...prevWarden,
                                              [attr]: nextAttr,
                                            },
                                          }
                                        })
                                      )}
                                    />
                                  ))}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1">
                                  +{totals[attr].toLocaleString()} ({getTalentStarList(p.baseStars[attr]).map((s) => `${s}★`).join(' + ')})
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-300">
                            Total talents: {(totals.strength + totals.allure + totals.intellect + totals.spirit).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            Talent EXP stars available: {Math.floor((wardenTalentExp[w.name] ?? 0) / 200).toLocaleString()} ({(wardenTalentExp[w.name] ?? 0).toLocaleString()} EXP)
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
