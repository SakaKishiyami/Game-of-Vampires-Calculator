"use client"

import React, { useState, useEffect } from "react"
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

// Data imports
import { initialBooks, bookBonuses, type BooksState, type BookCollection } from "@/data/books"
import { initialAuras } from "@/data/auras"
import { wardenGroups, wardenAttributes } from "@/data/wardens"
import { scarletBondData, scarletBondLevels, getOffSingle, getOffAffinity } from "@/data/scarletBonds"
import { courtyardLevels } from "@/data/courtyard"
import { conclaveLevels } from "@/data/conclave"
import { domIncreasePerStarData } from "@/data/talent_stars"

// Auth components
import UserMenu from "@/components/UserMenu"
import { getCurrentUser, supabase } from "@/lib/supabase"

export default function GameCalculator() {
  // Base attributes
  const [baseAttributes, setBaseAttributes] = useState({
    strength: 0,
    allure: 0,
    intellect: 0,
    spirit: 0,
  })

  // VIP and Lord Level
  const [vipLevel, setVipLevel] = useState(0)
  const [lordLevel, setLordLevel] = useState("Fledgling 1")

  const [books, setBooks] = useState<BooksState>(initialBooks);

  // Book bonus values are now imported from @/data/books

  // Conclave
  const [conclave, setConclave] = useState({
    "Seal of Strength": 0,
    "Seal of Allure": 0,
    "Seal of Intellect": 0,
    "Seal of Spirit": 0,
  })

  // Conclave seal upgrade settings
  const [conclaveUpgrade, setConclaveUpgrade] = useState({
    savedSeals: 0,
    upgradeSeals: {
      "Seal of Strength": true,
      "Seal of Allure": true,
      "Seal of Intellect": true,
      "Seal of Spirit": true,
    }
  })

  // Dom increase per star data
  const [domIncreasePerStar, setDomIncreasePerStar] = useState({
    domIncreasePerStarData,
    currentStrengthStars: 0,
    currentAllureStars: 0,
    currentIntellectStars: 0,
    currentSpiritStars: 0,
    currentTotalStars: 0,
    currentTotalDomGain: 0,
    currentTotalStrengthDomGain: 0,
    currentTotalAllureDomGain: 0,
    currentTotalIntellectDomGain: 0,
    currentTotalSpiritDomGain: 0,
    newStrengthStars: 0,
    newAllureStars: 0,
    newIntellectStars: 0,
    newSpiritStars: 0,
    newTotalStars: 0,
    newTotalDomGain: 0,
    newTotalStrengthDomGain: 0,
    newTotalAllureDomGain: 0,
    newTotalIntellectDomGain: 0,
    newTotalSpiritDomGain: 0,
  })

  // Courtyard
  const [courtyard, setCourtyard] = useState({
    currentLevel: 1,
    currentPoints: 0,
  })

  // Warden collections
  const [wardenCounts, setWardenCounts] = useState({
    circus: 0,
    tyrants: 0,
    noir: 0,
    hunt: 0,
  })

  // Selected wardens
  const [selectedWardens, setSelectedWardens] = useState({
    circus: [],
    tyrants: [],
    noir: [],
    hunt: [],
  })

  // Special wardens
  const [hasNyx, setHasNyx] = useState(false)
  const [hasDracula, setHasDracula] = useState(false)

  // All wardens with their skins
  const [wardenSkins, setWardenSkins] = useState<{
    [wardenName: string]: {
      [skinName: string]: boolean;
    };
  }>({})


  // Comprehensive warden list (excluding VIP and banner wardens)
  const allWardens = [
    // Circus Wardens
    { name: "Thorgrim", group: "circus", attributes: ["Intellect", "Strength"], tier: 5, skins: ["ThorgrimSkin1"] },
    { name: "Naja", group: "circus", attributes: ["Allure", "Spirit"], tier: 5, skins: [] },
    { name: "Diavolo", group: "circus", attributes: ["Spirit", "Strength"], tier: 5, skins: [] },
    { name: "Jester", group: "circus", attributes: ["Allure", "Intellect"], tier: 5, skins: [] },
    { name: "Dominique", group: "circus", attributes: ["Balance"], tier: 5, skins: [] },
    
    // Bloody Tyrants
    { name: "Ivan", group: "tyrants", attributes: ["Allure", "Spirit"], tier: 5, skins: ["IvanSkin1"] },
    { name: "Max", group: "tyrants", attributes: ["Spirit", "Strength"], tier: 5, skins: [] },
    { name: "Erzsebet", group: "tyrants", attributes: ["Allure", "Intellect"], tier: 5, skins: [] },
    { name: "Maria", group: "tyrants", attributes: ["Balance"], tier: 5, skins: ["MariaSkin1"] },
    
    // Monster Noir
    { name: "Eddie", group: "noir", attributes: ["Strength"], tier: 5, skins: ["EddieSkin1"] },
    { name: "Scarlet", group: "noir", attributes: ["Allure"], tier: 5, skins: ["ScarletSkin1"] },
    { name: "Sam", group: "noir", attributes: ["Intellect"], tier: 5, skins: ["SamSkin1"] },
    { name: "Grendel", group: "noir", attributes: ["Spirit"], tier: 5, skins: ["GrendelSkin1"] },
    
    // Wild Hunt
    { name: "Rudra", group: "hunt", attributes: ["Strength"], tier: 5, skins: ["RudraSkin1", "RudraSkin2"] },
    { name: "Woden", group: "hunt", attributes: ["Allure"], tier: 5, skins: ["WodenSkin1", "WodenSkin2"] },
    { name: "Artemis", group: "hunt", attributes: ["Intellect"], tier: 5, skins: ["ArtemisSkin1", "ArtemisSkin2"] },
    { name: "Finn", group: "hunt", attributes: ["Spirit"], tier: 5, skins: ["FinnSkin1", "FinnSkin2"] },
    
    // Other Wardens (only those with actual image files)
    { name: "Aurelia", group: "other", attributes: ["Allure", "Strength"], tier: 5, skins: ["AureliaSkin1"] },
    { name: "Asra", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: [] },
    { name: "Harker", group: "other", attributes: ["Strength"], tier: 5, skins: ["HarkerSkin1"] },
    { name: "Pavan", group: "other", attributes: ["Strength"], tier: 5, skins: ["PavanSkin1"] },
    { name: "Frederick", group: "other", attributes: ["Allure"], tier: 5, skins: ["FrederickSkin1"] },
    { name: "Carmilla", group: "other", attributes: ["Balance"], tier: 5, skins: ["CarmillaSkin1", "CarmillaSkin2"] },
    { name: "Gilgamesh", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: ["GilgameshSkin1"] },
    { name: "Drusilla", group: "other", attributes: ["Allure"], tier: 5, skins: [] },
    { name: "Tomas", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["TomasSkin1"] },
    { name: "Temujin", group: "other", attributes: ["Allure", "Strength"], tier: 5, skins: ["TemujinSkin1"] },
    { name: "Josey", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["JoseySkin1"] },
    { name: "Julie", group: "other", attributes: ["Allure", "Intellect"], tier: 5, skins: ["JulieSkin1"] },
    { name: "Mortimer", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Cleo", group: "other", attributes: ["Balance"], tier: 5, skins: ["CleoSkin1"] },
    { name: "Mike", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: ["MikeSkin1"] },
    { name: "Ulfred", group: "other", attributes: ["Strength"], tier: 5, skins: [] },
    { name: "Diana", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Damian", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Vance", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Edward", group: "other", attributes: ["Intellect"], tier: 5, skins: [] },
    { name: "William", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: [] },
    { name: "Vicente", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: ["VicenteSkin1"] },
    { name: "Saber", group: "other", attributes: ["Strength"], tier: 5, skins: [] },
    { name: "Nikolai", group: "other", attributes: ["Intellect", "Strength"], tier: 5, skins: [] },
    { name: "Cornelius", group: "other", attributes: ["Strength"], tier: 5, skins: [] },
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
    { name: "Nostadamus", group: "other", attributes: ["Intellect"], tier: 5, skins: ["NostadamusSkin1"] },
    { name: "Erik", group: "other", attributes: ["Spirit", "Strength"], tier: 5, skins: ["ErikSkin1"] },
    { name: "Victor", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Poe", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
    { name: "Candace", group: "other", attributes: ["Balance"], tier: 5, skins: [] },
  ]

  // Warden stats
  const [wardenStats, setWardenStats] = useState({})
  
  // Uploaded warden data with full attribute breakdowns
  const [uploadedWardenData, setUploadedWardenData] = useState<{
    [wardenName: string]: {
      totalAttributes: number;
      strength: {
        total: number;
        talentBonus: number;
        bookBonus: number;
        scarletBondBonus: number;
        presenceBonus: number;
        auraBonus: number;
        conclaveBonus: number;
        avatarBonus: number;
        familiarBonus: number;
      };
      allure: {
        total: number;
        talentBonus: number;
        bookBonus: number;
        scarletBondBonus: number;
        presenceBonus: number;
        auraBonus: number;
        conclaveBonus: number;
        avatarBonus: number;
        familiarBonus: number;
      };
      intellect: {
        total: number;
        talentBonus: number;
        bookBonus: number;
        scarletBondBonus: number;
        presenceBonus: number;
        auraBonus: number;
        conclaveBonus: number;
        avatarBonus: number;
        familiarBonus: number;
      };
      spirit: {
        total: number;
        talentBonus: number;
        bookBonus: number;
        scarletBondBonus: number;
        presenceBonus: number;
        auraBonus: number;
        conclaveBonus: number;
        avatarBonus: number;
        familiarBonus: number;
      };
    }
  }>({})

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<string>('')

  // Inventory system state
  const [inventory, setInventory] = useState<{
    [itemName: string]: {
      count: number;
      lastUpdated: string;
      imageUrl?: string;
    }
  }>({})
  
  const [inventoryImages, setInventoryImages] = useState<{
    [itemName: string]: string;
  }>({})
  
  const [isProcessingInventory, setIsProcessingInventory] = useState(false)
  const [inventoryProgress, setInventoryProgress] = useState('')
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  


  // Helper function to parse numbers with K/M suffixes
  const parseNumberWithSuffix = (value: string): number => {
    const numStr = value.toString().toLowerCase().replace(/,/g, '').trim()
    
    // Handle cases where there might be a space before K/M suffix
    if (numStr.includes(' k')) {
      return parseFloat(numStr.replace(' k', '')) * 1000
    } else if (numStr.includes(' m')) {
      return parseFloat(numStr.replace(' m', '')) * 1000000
    } else if (numStr.includes('k')) {
      return parseFloat(numStr.replace('k', '')) * 1000
    } else if (numStr.includes('m')) {
      // Special handling for cases like "423M" which should be "4.23M"
      const numPart = numStr.replace('m', '')
      const num = parseFloat(numPart)
      if (num >= 100 && num < 1000) {
        // If it's a 3-digit number, it's likely meant to be in the format 4.23M
        return (num / 100) * 1000000
      }
      return num * 1000000
    }
    return parseFloat(numStr) || 0
  }

  // Parse uploaded warden data
  const parseWardenData = (content: string, fileName: string) => {
    try {
      // Extract warden name from filename (remove extension)
      const wardenName = fileName.replace(/\.(txt|json|csv|png|jpg|jpeg)$/i, '')
      
      // Debug: Log the OCR content to see what we're working with
      console.log('OCR Content for', fileName, ':', content)
      
      // Parse the content to extract attribute breakdown
      // This handles the OCR format from the game
      let lines = content.split('\n').map(line => line.trim()).filter(line => line)
      
      // TRIM EMPTY LINES: Remove any completely empty lines to ensure consistent counting
      lines = lines.filter(line => line.length > 0)
      console.log('After trimming empty lines, total lines:', lines.length)
      
      // FIRST: Split lines that contain multiple bonuses so each bonus is on its own line
      // This makes parsing much easier
      const splitLines: string[] = []
      for (const line of lines) {
        // Check if line contains multiple bonuses (e.g., "Talent Bonus: 20.39M Book Bonus: 3.44M")
        if (line.includes('Talent Bonus') && line.includes('Book Bonus')) {
          // Split by common bonus patterns
          const bonusPatterns = [
            'Talent Bonus:',
            'Book Bonus:',
            'Scarlet Bond Bonus:',
            'Presence Bonus:',
            'Aura Bonus:',
            'Conclave Bonus:',
            'Avatar Bonus:',
            'Familiar Bonus:'
          ]
          
          let currentLine = line
          for (const pattern of bonusPatterns) {
            if (currentLine.includes(pattern)) {
              // Find the start of this bonus
              const startIndex = currentLine.indexOf(pattern)
              // Find the next bonus or end of line
              let endIndex = currentLine.length
              for (const nextPattern of bonusPatterns) {
                if (nextPattern !== pattern) {
                  const nextIndex = currentLine.indexOf(nextPattern, startIndex + 1)
                  if (nextIndex !== -1 && nextIndex < endIndex) {
                    endIndex = nextIndex
                  }
                }
              }
              
              // Extract this bonus and add to split lines
              const bonusLine = currentLine.substring(startIndex, endIndex).trim()
              if (bonusLine) {
                splitLines.push(bonusLine)
              }
              
              // Remove this bonus from current line for next iteration
              currentLine = currentLine.substring(0, startIndex) + currentLine.substring(endIndex)
            }
          }
        } else {
          // Line doesn't contain multiple bonuses, keep as is
          splitLines.push(line)
        }
      }
      
      // Replace original lines with split lines
      lines = splitLines
      console.log('After splitting bonuses, lines:', lines)
      
      let totalAttributes = 0
      const attributeData = {
        strength: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
        allure: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
        intellect: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
        spirit: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 }
      }
      
      let foundAttributeDetail = false
      const attributeOrder = ['strength', 'allure', 'intellect', 'spirit']
      
      // First pass: find the total attributes (first number after Attribute Detail)
      for (const line of lines) {
        if (line.includes('Attribute Detail')) {
          foundAttributeDetail = true
          console.log('Found Attribute Detail header')
          continue
        }
        
        if (foundAttributeDetail && totalAttributes === 0) {
          const match = line.match(/([0-9,.]+[KM]?)/i)
          if (match) {
            totalAttributes = parseNumberWithSuffix(match[1])
            console.log('Found total attributes:', totalAttributes)
            break
          }
        }
      }
      
      // Now that we have split lines, parsing is much simpler
      // Each bonus is on its own line, so we can directly parse each line
      
      // Find attribute total lines - since placement is always the same, look for lines with K/M numbers
      // that appear to be attribute totals (not bonus lines)
      // IMPORTANT: Skip the global "total attributes" line that we already parsed above
      const attributeTotalLines: string[] = []
      let foundFirstAttributeTotal = false
      for (const line of lines) {
        // Skip until we find Attribute Detail
        if (!foundAttributeDetail) {
          continue
        }
        
        // Skip the global total attributes line (first number after Attribute Detail)
        if (!foundFirstAttributeTotal && line.match(/([0-9,.]+[KM]?)/i)) {
          foundFirstAttributeTotal = true
          continue
        }
        
        // Look for lines that contain a number with K/M suffix but are NOT bonus lines
        // This should catch all attribute total lines regardless of their symbol format
        if (line.match(/[0-9,.]+(?:\s*[KM])/) && !line.includes('Bonus:')) {
          attributeTotalLines.push(line)
          console.log('Found attribute total line:', line)
        }
      }
      
      console.log('Total attribute total lines found:', attributeTotalLines.length)
      console.log('Attribute total lines:', attributeTotalLines)
      
      // Always take the last 4 lines as individual attribute totals (strength, allure, intellect, spirit)
      // This ensures we skip the global total attributes line that might be at the beginning
      const individualAttributeTotals = attributeTotalLines.slice(-4)
      console.log('Individual attribute totals (last 4):', individualAttributeTotals)
      
      // Since the placement/order is always the same, we can parse attributes by their position
      // The first attribute total line is strength, second is allure, third is intellect, fourth is spirit
      console.log('Parsing attributes by position (order is always the same):')
      
      for (let i = 0; i < attributeOrder.length && i < individualAttributeTotals.length; i++) {
        const currentAttribute = attributeOrder[i]
        const attr = attributeData[currentAttribute as keyof typeof attributeData]
        const totalLine = individualAttributeTotals[i]
        
        console.log(`Parsing ${currentAttribute} (position ${i}):`, totalLine)
        
        // Extract the number from the total line - look for any number with K/M suffix
        const totalMatch = totalLine.match(/([0-9,.]+(?:\s*[KM]))/)
        if (totalMatch) {
          attr.total = parseNumberWithSuffix(totalMatch[1])
          console.log(`Set ${currentAttribute} total:`, attr.total)
        } else {
          console.log(`Failed to parse total from line:`, totalLine)
        }
      }
      
      // Now parse all the bonus lines by mapping them to their correct attributes
      // Since the order is always the same, we can use a much simpler approach:
      // 1. Find all bonus lines
      // 2. Assign them to attributes based on their position relative to attribute total lines
      
      // First, let's find all the bonus lines and group them by their position
      const bonusLines: string[] = []
      for (const line of lines) {
        // Skip until we find Attribute Detail
        if (!foundAttributeDetail) {
          continue;
        }
        
        // Skip attribute total lines
        if (line.match(/^[A-Za-z()0-9®\s]+\s+[0-9,.]+(?:\s*[KM])?\s*$/)) {
          continue;
        }
        
        // Collect all bonus lines
        if (line.includes('Bonus:')) {
          bonusLines.push(line)
        }
      }
      
      console.log('Found bonus lines:', bonusLines)
      
      // Now we need to assign bonuses to the correct attributes
      // Since the order is always the same, we can use the attribute total lines as markers
      // to determine which attribute each bonus belongs to
      
      // Create a mapping of line indices to attribute names
      const lineToAttributeMap: { [lineIndex: number]: string } = {}
      
      // Find the line indices of attribute total lines
      // IMPORTANT: Skip the global "total attributes" line that we already parsed above
      const attributeTotalLineIndices: number[] = []
      let foundFirstAttributeTotalIndex = false
      for (let i = 0; i < lines.length; i++) {
        if (!foundAttributeDetail) continue
        
        // Skip the global total attributes line (first number after Attribute Detail)
        if (!foundFirstAttributeTotalIndex && lines[i].match(/([0-9,.]+[KM]?)/i)) {
          foundFirstAttributeTotalIndex = true
          continue
        }
        
        if (lines[i].match(/[0-9,.]+(?:\s*[KM])/) && !lines[i].includes('Bonus:')) {
          attributeTotalLineIndices.push(i)
        }
      }
      
      // Always take the last 4 line indices as individual attribute total line indices
      const individualAttributeTotalLineIndices = attributeTotalLineIndices.slice(-4)
      console.log('Individual attribute total line indices (last 4):', individualAttributeTotalLineIndices)
      
      // Map each line to its corresponding attribute based on position
      for (let i = 0; i < lines.length; i++) {
        if (!foundAttributeDetail) continue
        
        // Find which attribute this line belongs to
        let attributeIndex = -1
        for (let j = 0; j < individualAttributeTotalLineIndices.length; j++) {
          if (i < individualAttributeTotalLineIndices[j]) {
            attributeIndex = j - 1
            break
          }
        }
        
        // If we're after the last attribute total line, assign to the last attribute
        if (attributeIndex === -1 && individualAttributeTotalLineIndices.length > 0) {
          attributeIndex = individualAttributeTotalLineIndices.length - 1
        }
        
        // If we're before the first attribute total line, assign to the first attribute
        if (attributeIndex === -1 && individualAttributeTotalLineIndices.length > 0) {
          attributeIndex = 0
        }
        
        if (attributeIndex >= 0 && attributeIndex < attributeOrder.length) {
          lineToAttributeMap[i] = attributeOrder[attributeIndex]
        }
      }
      
      console.log('Line to attribute mapping:', lineToAttributeMap)
      
      // Now parse bonuses using the mapping
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const attributeName = lineToAttributeMap[i]
        
        if (!attributeName || !foundAttributeDetail) continue
        
        // Parse bonuses and assign them to the correct attribute
        if (line.includes('Talent Bonus:')) {
          const match = line.match(/Talent Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].talentBonus = value
            console.log(`Set ${attributeName} talent bonus:`, value)
          }
        }
        if (line.includes('Book Bonus:')) {
          const match = line.match(/Book Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].bookBonus = value
            console.log(`Set ${attributeName} book bonus:`, value)
          }
        }
        if (line.includes('Scarlet Bond Bonus:')) {
          const match = line.match(/Scarlet Bond Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].scarletBondBonus = value
            console.log(`Set ${attributeName} scarlet bond bonus:`, value)
          }
        }
        if (line.includes('Presence Bonus:')) {
          const match = line.match(/Presence Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].presenceBonus = value
            console.log(`Set ${attributeName} presence bonus:`, value)
          }
        }
        if (line.includes('Aura Bonus:')) {
          const match = line.match(/Aura Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].auraBonus = value
            console.log(`Set ${attributeName} aura bonus:`, value)
          }
        }
        if (line.includes('Conclave Bonus:')) {
          const match = line.match(/Conclave Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].conclaveBonus = value
            console.log(`Set ${attributeName} conclave bonus:`, value)
          }
        }
        if (line.includes('Avatar Bonus:')) {
          const match = line.match(/Avatar Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].avatarBonus = value
            console.log(`Set ${attributeName} avatar bonus:`, value)
          }
        }
        if (line.includes('Familiar Bonus:')) {
          const match = line.match(/Familiar Bonus:\s*([0-9,.]+(?:\s*[KM])?)/i);
          if (match) {
            const value = parseNumberWithSuffix(match[1])
            attributeData[attributeName as keyof typeof attributeData].familiarBonus = value
            console.log(`Set ${attributeName} familiar bonus:`, value)
          }
        }
      }
      
      // Calculate total attributes by summing all individual bonuses
      let calculatedTotal = 0;
      Object.values(attributeData).forEach(attr => {
        calculatedTotal += attr.talentBonus + attr.bookBonus + attr.scarletBondBonus + 
                        attr.presenceBonus + attr.auraBonus + attr.conclaveBonus + 
                        attr.avatarBonus + attr.familiarBonus;
      });
      
      // Debug: Log the final parsed attribute data
      console.log('Final parsed attribute data:', attributeData)
      console.log('Calculated total from bonuses:', calculatedTotal)
      
      return {
        wardenName,
        data: {
          totalAttributes: calculatedTotal,
          ...attributeData
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse data for ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // OCR processing function for warden data import
  const processImageWithOCR = async (file: File): Promise<string> => {
    setOcrProgress('Loading OCR engine...')
    
    // Dynamically import Tesseract.js to avoid SSR issues
    const Tesseract = await import('tesseract.js')
    
    try {
      setOcrProgress('Initializing OCR...')
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })
      
      return text
    } finally {
      setOcrProgress('')
    }
  }

  // Preprocess an ImageData for OCR: scale up, grayscale, increase contrast, and threshold
  const preprocessImageDataForOCR = (source: ImageData): ImageData => {
    // Scale up to improve OCR accuracy
    const scaleFactor = 2
    const scaledWidth = source.width * scaleFactor
    const scaledHeight = source.height * scaleFactor
    
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = scaledWidth
    tempCanvas.height = scaledHeight
    
    // Draw original onto scaled canvas
    const srcCanvas = document.createElement('canvas')
    const srcCtx = srcCanvas.getContext('2d')!
    srcCanvas.width = source.width
    srcCanvas.height = source.height
    srcCtx.putImageData(source, 0, 0)
    tempCtx.imageSmoothingEnabled = false
    tempCtx.drawImage(srcCanvas, 0, 0, source.width, source.height, 0, 0, scaledWidth, scaledHeight)
    
    // Get scaled image data
    const scaled = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight)
    const data = scaled.data
    
    // Convert to grayscale and increase contrast, then threshold
    // Contrast factor: 1.4 (0=no change). Threshold ~ 170.
    const contrast = 1.4
    const threshold = 170
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Luma grayscale
      let v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
      // Contrast around mid-point 128
      v = Math.min(255, Math.max(0, Math.round((v - 128) * contrast + 128)))
      // Threshold to binary
      const bin = v >= threshold ? 255 : 0
      data[i] = bin
      data[i + 1] = bin
      data[i + 2] = bin
      // keep alpha
    }
    
    return scaled
  }

  // Extract count using OCR from the bottom right corner
  const extractCountWithOCR = async (regionImageData: ImageData): Promise<number> => {
    try {
      const width = regionImageData.width
      const height = regionImageData.height
      
      // Look at the bottom right corner (last 20% of width and height)
      const cornerWidth = Math.max(20, Math.floor(width * 0.2))
      const cornerHeight = Math.max(20, Math.floor(height * 0.2))
      const cornerX = width - cornerWidth
      const cornerY = height - cornerHeight
      
      // Extract the corner region
      const cornerData = extractRegionImageData(regionImageData, cornerX, cornerY, cornerWidth, cornerHeight)
      if (!cornerData) return 1
      
      // Preprocess for OCR and convert to image
      const preprocessed = preprocessImageDataForOCR(cornerData)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = preprocessed.width
      canvas.height = preprocessed.height
      ctx.putImageData(preprocessed, 0, 0)
      const imageDataUrl = canvas.toDataURL('image/png')
      
      // Dynamically import Tesseract.js to avoid SSR issues
      const Tesseract = await import('tesseract.js')
      
      // Use Tesseract.js for OCR
      const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: m => console.log('OCR progress:', m)
      })
      
      // Extract numbers from the text
      const numbers = text.match(/\d+/g)
      if (numbers && numbers.length > 0) {
        const count = parseInt(numbers[0])
        if (count > 0 && count <= 999) {
          console.log(`OCR detected count: ${count}`)
          return count
        }
      }
      
      return 1
    } catch (error) {
      console.warn('OCR failed, using fallback:', error)
      return extractCountFromRegion(regionImageData)
    }
  }

  // Extract count number from a region using conservative approach (fallback)
  const extractCountFromRegion = (regionImageData: ImageData): number => {
    const width = regionImageData.width
    const height = regionImageData.height
    
    // Look at the bottom right corner (last 20% of width and height)
    const cornerWidth = Math.max(10, Math.floor(width * 0.2))
    const cornerHeight = Math.max(10, Math.floor(height * 0.2))
    const startX = width - cornerWidth
    const startY = height - cornerHeight
    
    // Extract the corner region
    const cornerData = new Uint8ClampedArray(cornerWidth * cornerHeight * 4)
    for (let y = 0; y < cornerHeight; y++) {
      for (let x = 0; x < cornerWidth; x++) {
        const srcIdx = ((startY + y) * width + (startX + x)) * 4
        const dstIdx = (y * cornerWidth + x) * 4
        cornerData[dstIdx] = regionImageData.data[srcIdx]     // R
        cornerData[dstIdx + 1] = regionImageData.data[srcIdx + 1] // G
        cornerData[dstIdx + 2] = regionImageData.data[srcIdx + 2] // B
        cornerData[dstIdx + 3] = regionImageData.data[srcIdx + 3] // A
      }
    }
    
    // Simple heuristic: look for bright/white pixels that could be numbers
    let brightPixels = 0
    let totalPixels = 0
    
    for (let i = 0; i < cornerData.length; i += 4) {
      const r = cornerData[i]
      const g = cornerData[i + 1]
      const b = cornerData[i + 2]
      const a = cornerData[i + 3]
      
      if (a > 128) { // Non-transparent pixel
        totalPixels++
        // Check if pixel is bright (could be white/yellow text)
        if (r > 200 && g > 200 && b > 150) {
          brightPixels++
        }
      }
    }
    
    if (totalPixels === 0) return 1
    
    const brightnessRatio = brightPixels / totalPixels
    
    // If there are enough bright pixels, try to estimate the number
    if (brightnessRatio > 0.1) {
      // Simple estimation based on brightness ratio and corner size
      const estimatedCount = Math.max(1, Math.floor(brightnessRatio * 20))
      return Math.min(estimatedCount, 999) // Cap at reasonable number
    }
    
    return 1
  }

  // Extract a region from image data and return as ImageData
  const extractRegionImageData = (sourceImageData: ImageData, x: number, y: number, width: number, height: number): ImageData | null => {
    try {
      // Validate bounds
      if (x < 0 || y < 0 || x + width > sourceImageData.width || y + height > sourceImageData.height) {
        console.warn('Region bounds exceed source image dimensions')
        return null
      }
      
      // Create new image data for the region
      const regionData = new Uint8ClampedArray(width * height * 4)
      
      // Copy pixel data from source to region
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const srcIdx = ((y + row) * sourceImageData.width + (x + col)) * 4
          const dstIdx = (row * width + col) * 4
          
          regionData[dstIdx] = sourceImageData.data[srcIdx]     // R
          regionData[dstIdx + 1] = sourceImageData.data[srcIdx + 1] // G
          regionData[dstIdx + 2] = sourceImageData.data[srcIdx + 2] // B
          regionData[dstIdx + 3] = sourceImageData.data[srcIdx + 3] // A
        }
      }
      
      return new ImageData(regionData, width, height)
    } catch (error) {
      console.warn('Error extracting region image data:', error)
      return null
    }
  }

  // Handle inventory image upload
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
          // For now, just add the image to inventoryImages without AI processing
          const imageUrl = URL.createObjectURL(file)
          const itemName = file.name.replace(/\.[^/.]+$/, "") // Remove file extension
          
          setInventoryImages(prev => ({
            ...prev,
            [itemName]: imageUrl
          }))
          
          // Add to inventory if not already present
          if (!newInventory[itemName]) {
            newInventory[itemName] = {
              count: 1,
              lastUpdated: new Date().toISOString()
            }
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
      // Clear the input so the same file can be uploaded again
      event.target.value = ''
    }
  }

  // Manual inventory management functions
  const updateItemCount = (itemName: string, newCount: number) => {
    setInventory(prev => ({
      ...prev,
      [itemName]: {
        count: Math.max(0, newCount),
        lastUpdated: new Date().toISOString(),
        imageUrl: prev[itemName]?.imageUrl
      }
    }))
  }

  const addNewItem = (itemName: string, initialCount: number = 0) => {
    if (itemName.trim()) {
      setInventory(prev => ({
        ...prev,
        [itemName.trim()]: {
          count: initialCount,
          lastUpdated: new Date().toISOString()
        }
      }))
    }
  }

  const removeItem = (itemName: string) => {
    setInventory(prev => {
      const newInventory = { ...prev }
      delete newInventory[itemName]
      return newInventory
    })
    
    setInventoryImages(prev => {
      const newImages = { ...prev }
      delete newImages[itemName]
      return newImages
    })
  }

  // Helper functions for inventory item management
  const formatItemName = (fileName: string): string => {
    // Remove file extension and convert to readable format
    let nameWithoutExt = fileName.replace(/\.(PNG|png)$/, '')
    
    // Special formatting for resources
    if (nameWithoutExt.includes('100K')) {
      nameWithoutExt = nameWithoutExt.replace('100K', '100k')
    }
    if (nameWithoutExt.includes('5M')) {
      nameWithoutExt = nameWithoutExt.replace('5M', '5M')
    }
    if (nameWithoutExt.includes('Random')) {
      // Move "Random" to the beginning for resources
      if (nameWithoutExt.includes('Blood') || nameWithoutExt.includes('Nectar') || nameWithoutExt.includes('Bat')) {
        const baseName = nameWithoutExt.replace('Random', '').trim()
        nameWithoutExt = `Random ${baseName}`
      }
    }
    
    // Special formatting for skills - add WIP to specific skills
    if (nameWithoutExt === 'Skill8') {
      nameWithoutExt = 'Skill8WIP'
    }
    if (nameWithoutExt === 'Skill6') {
      nameWithoutExt = 'Skill6WIP'
    }
    if (nameWithoutExt === 'Skill5') {
      nameWithoutExt = 'Skill5WIP'
    }
    if (nameWithoutExt === 'Skill4') {
      nameWithoutExt = 'Skill4WIP'
    }
    
    // Fix number formatting - remove spaces between numbers
    nameWithoutExt = nameWithoutExt.replace(/(\d)\s+(\d)/g, '$1$2')
    
    // Fix EXP formatting
    nameWithoutExt = nameWithoutExt.replace(/E\s+X\s+P/g, 'EXP')
    
    // Add spaces before capital letters and numbers, but not between consecutive numbers
    return nameWithoutExt
      .replace(/([A-Z])/g, ' $1')
      .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letter and number
      .replace(/([0-9])([A-Z])/g, '$1 $2') // Add space between number and capital letter
      .replace(/^ /, '') // Remove leading space
      .trim()
  }

  const getItemCategory = (itemName: string): string => {
    // Determine which category an item belongs to based on the item name
    const categories = {
      'Resources': ['Nectar', 'Bat', 'Blood', 'ResourceCollectorCard'],
      'WardenItems': ['Allure', 'Intellect', 'Spirit', 'Strength', 'Talent', 'Mystery', 'Skill', 'Dominance', 'ArenaTrophy', 'BloodOriginToken', 'CityBadge', 'CircusTicket', 'MacabrianCoin', 'NewSummonCoin', 'SupremacyBadge', 'RandomScroll', 'RandomScriptPart'],
      'Lover+ChildItems': ['Intimacy', 'Attraction', 'Plazma', 'PremiumGiftBox', 'RingOfChange', 'RoseBouquet', 'TourMap', 'Vito', 'AffinityArmlet', 'AgneyiToken', 'AmethystRing', 'CharmBox', 'CharmPhial', 'CrateOfDrinks', 'CulannToken', 'DailyAttractionBox', 'HelaToken', 'IndigoBouquet', 'IntimacyBag', 'RubyRing', 'BlackPearlRing', 'GiftBox', 'RandomRingBox', 'DailySecretPack', 'DeluxeGiftBox', 'CharmBottle', 'IntimacyCase', 'AzureBouquet', 'Beast', 'IntimacyPurse', 'ArtLoverToken', 'AffinityLvl'],
      'FamiliarItems': ['MutationPotion', 'EffigyOfRobustness', 'FamiliarFood', 'BangBear'],
      'MiscItems': ['LookingGlass', 'CourageTablet', 'NoviceLeague', 'PressCard', 'Prestige', 'RenameCard', 'SanctuaryStandardFlag', 'SolidarityStandardFlag', 'SophisticatedSatin', 'ValiantSlate', 'AdvancedItemDonation', 'AdvancedLeague', 'AlchemyFormula', 'BanishmentStandardFlag', 'BanquetFavor', 'ChallengeFlag', 'ConclaveStandardFlag', 'ExquisiteSilk', 'GrandBanquetDecor', 'GrandBanquetInvitation', 'GuildEXPChest', 'HuntFlag', 'ImpeccableCashmere', 'InterLeague', 'ItemDonation', 'LoudSpeaker', 'LuxuryBanquetDecor', 'LuxuryBanquetInvitation', 'RematchFlag', 'AllyFlag', 'ArenaMedal', 'GuardianFlag', 'MirageMirror', 'PocketWatch', 'BackgroundWinter', 'BackgroundFireworks'],
      'WardenEquip': ['NightfallEquip', 'NightfallMedal', 'NightfallSuit', 'TwilightEquip', 'BloodMoonEquip', 'BloodMoonSuit', 'DarkSunEquip', 'DarkSunMedal', 'DarkSunSuit', 'DuskMedal', 'DuskRing', 'FallenStarEquip', 'FallenStarSuit', 'MidnightEquip', 'MidnightRing', 'TwilightRing', 'NightfallRing', 'FallenStarRing', 'DarkSunRing', 'TwilightSuit', 'BloodMoonRing', 'DuskSuit', 'FallenStarMedal', 'MidnightSuit', 'MidnightMedal', 'TwilightMedal', 'BloodMoonMedal']
    }

    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => itemName.includes(item))) {
        return category
      }
    }
    return 'MiscItems' // Default fallback
  }

  const getItemsByCategory = (category: string): string[] => {
    const itemLists = {
      'Resources': ['Blood5M', 'BloodRandom', 'Blood100K', 'Blood7', 'Blood6', 'Blood5', 'Blood4', 'Blood3', 'Blood2', 'Blood1', 'Nectar5M', 'NectarRandom', 'Nectar100K', 'Nectar7', 'Nectar6', 'Nectar5', 'Nectar4', 'Nectar3', 'Nectar2', 'Nectar1', 'Bats5M', 'BatRandom', 'Bat100K', 'Bat7', 'Bat6', 'Bat5', 'Bat4', 'Bat3', 'Bat2', 'Bat1', 'ResourceCollectorCard'],
      'WardenItems': ['BloodOriginToken', 'SupremacyBadge', 'SupremacyBadgePart', 'MacabrianCoin', 'MacabrianCoinPart', 'CircusTicket', 'CircusTicketPart', 'CityBadge', 'CityBadgePart', 'ArenaTrophy', 'ArenaTrophyPart', 'NewSummonCoin', 'NewSummonCoinPart', 'SupremacyBadgeRandomBox', 'MacabrianCoinRandomBox', 'CircusTicketRandomBox', 'CityBadgeRandomBox', 'RandomScroll', 'RandomScriptPart', 'StrengthScript', 'AllureScript', 'IntellectScript', 'SpiritScript', 'TalentScroll6Star', 'TalentScroll5Star', 'TalentScroll4Star', 'TalentScroll3Star', 'TalentScroll2Star', 'TalentScroll1Star', 'TalentRandom5', 'TalentScroll7', 'TalentScroll6', 'TalentScroll5', 'TalentScroll4', 'TalentScroll3', 'TalentScroll2', 'TalentScroll1', 'TalentScroll50', 'TalentScroll100', 'TalentScroll200', 'Talent4', 'Talent3', 'Talent2', 'Talent1', 'Mystery1', 'Mystery2', 'Mystery3', 'Mystery4', 'Mystery5', 'Mystery15(1)', 'Mystery15(2)', 'Strength1', 'Strength2', 'Strength3', 'Strength4', 'Strength6', 'Strength15(1)', 'Strength15(2)', 'Allure1', 'Allure2', 'Allure3', 'Allure4', 'Allure5', 'Allure15(1)', 'Allure15(2)', 'Intellect1', 'Intellect2', 'Intellect3', 'Intellect4', 'Intellect5', 'Intellect15(1)', 'Intellect15(2)', 'Spirit1', 'Spirit2', 'Spirit3', 'Spirit4', 'Spirit5', 'Spirit15(1)', 'Spirit15(2)', 'Dominance4', 'Dominance3', 'Dominance2', 'Dominance1', 'DominanceBox', 'Skill8', 'Skill6', 'Skill4', 'Skill5', 'Skill500', 'SkillElixirRandom1000', 'SkillElixirRandom100', 'SkillElixirRandom50', 'SkillElixir4', 'SkillElixir3', 'SkillElixir2', 'SkillElixir1'],
      'Lover+ChildItems': ['AgneyiToken', 'CulannToken', 'HelaToken', 'ArtLoverToken', 'DailySecretPack', 'IntimacyCase', 'IntimacyBag', 'IntimacyPurse', 'PremiumGiftBox3', 'DeluxeGiftBox2', 'GiftBox1', 'Intimacy4', 'Intimacy3', 'Intimacy2', 'Intimacy1', 'TourMap', 'CrateOfDrinks', 'Beast', 'Vito', 'Plazma', 'DailyAttractionBox', 'CharmBox', 'CharmBottle2', 'CharmPhial1', 'IndigoBouquet3', 'AzureBouquet2', 'RoseBouquet1', 'Attraction4', 'Attraction3', 'Attraction2', 'Attraction1', 'BlackPearlRing3', 'RubyRing2', 'AmethystRing1', 'RingOfChange', 'RandomRingBox', 'AffinityLvl2', 'AffinityLvl1', 'AffinityArmlet'],
      'FamiliarItems': ['MutationPotion1', 'MutationPotion2', 'MutationPotion3', 'EffigyOfRobustness', 'FamiliarFood', 'BangBear'],
      'MiscItems': ['ExquisiteSilk', 'ImpeccableCashmere', 'SophisticatedSatin', 'LoudSpeaker', 'PocketWatch', 'Prestige2', 'Prestige1', 'BanquetFavor', 'PressCard', 'CourageTablet', 'LookingGlass', 'AdvancedItemDonation2', 'AdvancedItemDonationPart', 'ItemDonation1', 'ItemDonationPart', 'GuildEXPChest4', 'GuildEXPChest3', 'GuildEXPChest2', 'GuildEXPChest1', 'BanishmentStandardFlag', 'ConclaveStandardFlag', 'ConclaveStandardFlagPart', 'SolidarityStandardFlag', 'SanctuaryStandardFlag', 'BanquetFavor2', 'GrandBanquetInvitation', 'GrandBanquetDecor', 'LuxuryBanquetInvitation', 'LuxuryBanquetDecor', 'RematchFlag', 'AllyFlag', 'ChallengeFlag', 'GuardianFlag', 'HuntFlag', 'ArenaMedal', 'AdvancedLeague3', 'InterLeague2', 'NoviceLeague1', 'MirageMirror', 'RenameCard', 'BackgroundWinter', 'BackgroundFireworks'],
      'WardenEquip': ['NightfallEquip', 'NightfallMedal', 'NightfallSuit', 'NightfallRing', 'TwilightEquip', 'TwilightMedal', 'TwilightRing', 'TwilightSuit', 'BloodMoonEquip', 'BloodMoonMedal', 'BloodMoonRing', 'BloodMoonSuit', 'DarkSunEquip', 'DarkSunMedal', 'DarkSunRing', 'DarkSunSuit', 'DuskMedal', 'DuskRing', 'DuskSuit', 'FallenStarEquip', 'FallenStarMedal', 'FallenStarRing', 'FallenStarSuit', 'MidnightEquip', 'MidnightMedal', 'MidnightRing', 'MidnightSuit']
    }
    return itemLists[category as keyof typeof itemLists] || []
  }

  // Additional inventory helper functions for UI
  const addInventoryItem = (itemName: string, initialCount: number = 1) => {
    if (itemName.trim()) {
      const trimmedName = itemName.trim()
      setInventory(prev => ({
        ...prev,
        [trimmedName]: {
          count: (prev[trimmedName]?.count || 0) + initialCount,
          lastUpdated: new Date().toISOString(),
          imageUrl: prev[trimmedName]?.imageUrl
        }
      }))
      
      // Set the image URL for the GoV asset
      setInventoryImages(prev => ({
        ...prev,
        [trimmedName]: `/GoVAssets/${trimmedName}.PNG`
      }))
    }
  }

  // Mapping function to sync inventory items with other systems
  const syncInventoryWithOtherSystems = (itemName: string, newCount: number) => {
    // Map talent scrolls
    if (itemName === 'TalentScroll1') {
      setTalents(prev => ({ ...prev, talentScrollLvl1: { ...prev.talentScrollLvl1, count: newCount } }))
    } else if (itemName === 'TalentScroll2') {
      setTalents(prev => ({ ...prev, talentScrollLvl2: { ...prev.talentScrollLvl2, count: newCount } }))
    } else if (itemName === 'TalentScroll3') {
      setTalents(prev => ({ ...prev, talentScrollLvl3: { ...prev.talentScrollLvl3, count: newCount } }))
    } else if (itemName === 'TalentScroll4') {
      setTalents(prev => ({ ...prev, talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount } }))
    } else if (itemName === 'TalentScroll50') {
      setTalents(prev => ({ ...prev, basicTalentScroll: { ...prev.basicTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentScroll100') {
      setTalents(prev => ({ ...prev, fineTalentScroll: { ...prev.fineTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentScroll200') {
      setTalents(prev => ({ ...prev, superiorTalentScroll: { ...prev.superiorTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentRandom5') {
      setTalents(prev => ({ ...prev, randomTalentScroll: { ...prev.randomTalentScroll, count: newCount } }))
    } else if (itemName === 'TalentScroll5') {
      setTalents(prev => ({ ...prev, talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount } }))
    } else if (itemName === 'TalentScroll6') {
      setTalents(prev => ({ ...prev, talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount } }))
    } else if (itemName === 'TalentScroll7') {
      setTalents(prev => ({ ...prev, talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount } }))
    }
    
    // Map books - items with 4 numbers correspond to attribute 1-4 books, items with 3 numbers correspond to attribute 15 books
    // Strength books
    if (itemName === 'Strength1') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare I": newCount } }))
    } else if (itemName === 'Strength2') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare II": newCount } }))
    } else if (itemName === 'Strength3') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare III": newCount } }))
    } else if (itemName === 'Strength4') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Warfare IV": newCount } }))
    } else if (itemName === 'Strength15(1)') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Combat I": newCount } }))
    } else if (itemName === 'Strength15(2)') {
      setBooks(prev => ({ ...prev, Strength: { ...prev.Strength, "Combat II": newCount } }))
    }
    
    // Allure books
    if (itemName === 'Allure1') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor I": newCount } }))
    } else if (itemName === 'Allure2') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor II": newCount } }))
    } else if (itemName === 'Allure3') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor III": newCount } }))
    } else if (itemName === 'Allure4') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Glamor IV": newCount } }))
    } else if (itemName === 'Allure15(1)') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Beauty I": newCount } }))
    } else if (itemName === 'Allure15(2)') {
      setBooks(prev => ({ ...prev, Allure: { ...prev.Allure, "Beauty II": newCount } }))
    }
    
    // Intellect books
    if (itemName === 'Intellect1') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy I": newCount } }))
    } else if (itemName === 'Intellect2') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy II": newCount } }))
    } else if (itemName === 'Intellect3') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy III": newCount } }))
    } else if (itemName === 'Intellect4') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "Alchemy IV": newCount } }))
    } else if (itemName === 'Intellect15(1)') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "History I": newCount } }))
    } else if (itemName === 'Intellect15(2)') {
      setBooks(prev => ({ ...prev, Intellect: { ...prev.Intellect, "History II": newCount } }))
    }
    
    // Spirit books
    if (itemName === 'Spirit1') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult I": newCount } }))
    } else if (itemName === 'Spirit2') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult II": newCount } }))
    } else if (itemName === 'Spirit3') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult III": newCount } }))
    } else if (itemName === 'Spirit4') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Occult IV": newCount } }))
    } else if (itemName === 'Spirit15(1)') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Mysticism I": newCount } }))
    } else if (itemName === 'Spirit15(2)') {
      setBooks(prev => ({ ...prev, Spirit: { ...prev.Spirit, "Mysticism II": newCount } }))
    }
    
    // Mystery books (Balanced category)
    if (itemName === 'Mystery1') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-E": newCount } }))
    } else if (itemName === 'Mystery2') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-J": newCount } }))
    } else if (itemName === 'Mystery3') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-O": newCount } }))
    } else if (itemName === 'Mystery4') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-T": newCount } }))
    } else if (itemName === 'Mystery5') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Encyclopedia A-Z": newCount } }))
    } else if (itemName === 'Mystery15(1)') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Arcana I": newCount } }))
    } else if (itemName === 'Mystery15(2)') {
      setBooks(prev => ({ ...prev, Balanced: { ...prev.Balanced, "Arcana II": newCount } }))
    }
    
    // Map scripts
    if (itemName === 'StrengthScript') {
      setTalents(prev => ({ ...prev, strengthScript: { ...prev.strengthScript, count: newCount } as any }))
    } else if (itemName === 'AllureScript') {
      setTalents(prev => ({ ...prev, allureScript: { ...prev.allureScript, count: newCount } as any }))
    } else if (itemName === 'IntellectScript') {
      setTalents(prev => ({ ...prev, intellectScript: { ...prev.intellectScript, count: newCount } as any }))
    } else if (itemName === 'SpiritScript') {
      setTalents(prev => ({ ...prev, spiritScript: { ...prev.spiritScript, count: newCount } as any }))
    } else if (itemName === 'RandomScroll') {
      setTalents(prev => ({ ...prev, randomScript: { ...((prev as any).randomScript || {}), count: newCount } as any }))
    } else if (itemName === 'RandomScriptPart') {
      setTalents(prev => ({ ...prev, randomScriptPart: { ...((prev as any).randomScriptPart || {}), count: newCount } as any }))
    }
  }

  const updateInventoryItem = (itemName: string, newCount: number) => {
    setInventory(prev => ({
      ...prev,
      [itemName]: {
        count: Math.max(0, newCount),
        lastUpdated: new Date().toISOString(),
        imageUrl: prev[itemName]?.imageUrl
      }
    }))
    
    // Sync with other systems
    syncInventoryWithOtherSystems(itemName, newCount)
  }

  // Reverse sync functions - update inventory when other systems change
  const syncBooksToInventory = (category: string, bookName: string, newCount: number) => {
    let inventoryItemName = ''
    
    // Map book names back to inventory item names
    if (category === 'Strength') {
      if (bookName === 'Warfare I') inventoryItemName = 'Strength1'
      else if (bookName === 'Warfare II') inventoryItemName = 'Strength2'
      else if (bookName === 'Warfare III') inventoryItemName = 'Strength3'
      else if (bookName === 'Warfare IV') inventoryItemName = 'Strength4'
      else if (bookName === 'Combat I') inventoryItemName = 'Strength15(1)'
      else if (bookName === 'Combat II') inventoryItemName = 'Strength15(2)'
    } else if (category === 'Allure') {
      if (bookName === 'Glamor I') inventoryItemName = 'Allure1'
      else if (bookName === 'Glamor II') inventoryItemName = 'Allure2'
      else if (bookName === 'Glamor III') inventoryItemName = 'Allure3'
      else if (bookName === 'Glamor IV') inventoryItemName = 'Allure4'
      else if (bookName === 'Beauty I') inventoryItemName = 'Allure15(1)'
      else if (bookName === 'Beauty II') inventoryItemName = 'Allure15(2)'
    } else if (category === 'Intellect') {
      if (bookName === 'Alchemy I') inventoryItemName = 'Intellect1'
      else if (bookName === 'Alchemy II') inventoryItemName = 'Intellect2'
      else if (bookName === 'Alchemy III') inventoryItemName = 'Intellect3'
      else if (bookName === 'Alchemy IV') inventoryItemName = 'Intellect4'
      else if (bookName === 'History I') inventoryItemName = 'Intellect15(1)'
      else if (bookName === 'History II') inventoryItemName = 'Intellect15(2)'
    } else if (category === 'Spirit') {
      if (bookName === 'Occult I') inventoryItemName = 'Spirit1'
      else if (bookName === 'Occult II') inventoryItemName = 'Spirit2'
      else if (bookName === 'Occult III') inventoryItemName = 'Spirit3'
      else if (bookName === 'Occult IV') inventoryItemName = 'Spirit4'
      else if (bookName === 'Mysticism I') inventoryItemName = 'Spirit15(1)'
      else if (bookName === 'Mysticism II') inventoryItemName = 'Spirit15(2)'
    } else if (category === 'Balanced') {
      if (bookName === 'Encyclopedia A-E') inventoryItemName = 'Mystery1'
      else if (bookName === 'Encyclopedia A-J') inventoryItemName = 'Mystery2'
      else if (bookName === 'Encyclopedia A-O') inventoryItemName = 'Mystery3'
      else if (bookName === 'Encyclopedia A-T') inventoryItemName = 'Mystery4'
      else if (bookName === 'Encyclopedia A-Z') inventoryItemName = 'Mystery5'
      else if (bookName === 'Arcana I') inventoryItemName = 'Mystery15(1)'
      else if (bookName === 'Arcana II') inventoryItemName = 'Mystery15(2)'
    }
    
    if (inventoryItemName) {
      setInventory(prev => ({
        ...prev,
        [inventoryItemName]: {
          count: newCount,
          lastUpdated: new Date().toISOString(),
          imageUrl: prev[inventoryItemName]?.imageUrl
        }
      }))
    }
  }

  const syncTalentsToInventory = (talentType: string, newCount: number) => {
    let inventoryItemName = ''
    
    if (talentType === 'randomTalentScroll') inventoryItemName = 'TalentRandom5'
    else if (talentType === 'talentScrollLvl1') inventoryItemName = 'TalentScroll1'
    else if (talentType === 'talentScrollLvl2') inventoryItemName = 'TalentScroll2'
    else if (talentType === 'talentScrollLvl3') inventoryItemName = 'TalentScroll3'
    else if (talentType === 'talentScrollLvl4') inventoryItemName = 'TalentScroll4'
    else if (talentType === 'basicTalentScroll') inventoryItemName = 'TalentScroll50'
    else if (talentType === 'fineTalentScroll') inventoryItemName = 'TalentScroll100'
    else if (talentType === 'superiorTalentScroll') inventoryItemName = 'TalentScroll200'
    
    if (inventoryItemName) {
      setInventory(prev => ({
        ...prev,
        [inventoryItemName]: {
          count: newCount,
          lastUpdated: new Date().toISOString(),
          imageUrl: prev[inventoryItemName]?.imageUrl
        }
      }))
    }
  }

  const removeInventoryItem = (itemName: string) => {
    setInventory(prev => {
      const newInventory = { ...prev }
      delete newInventory[itemName]
      return newInventory
    })
    
  }

  // Helper function to group items by type (for better organization)
  const groupItemsByType = (items: string[]): { [type: string]: string[] } => {
    const groups: { [type: string]: string[] } = {}
    
    items.forEach(item => {
      // Extract the base type from the item name
      let type = 'Other'
      
      // Special handling for WardenItems with new organization
      if (item.includes('BloodOriginToken') || item.includes('SupremacyBadge') || item.includes('MacabrianCoin') || 
          item.includes('CircusTicket') || item.includes('CityBadge') || item.includes('ArenaTrophy') || 
          item.includes('NewSummonCoin')) {
        type = 'Special Items'
      }
      else if (item.includes('Script') || item.includes('RandomScroll') || item.includes('RandomScriptPart')) type = 'Scripts'
      else if (item.includes('Talent')) type = 'Talents'
      else if (item.includes('Mystery')) type = 'Mystery'
      else if (item.includes('Strength')) type = 'Strength'
      else if (item.includes('Allure')) type = 'Allure'
      else if (item.includes('Intellect')) type = 'Intellect'
      else if (item.includes('Spirit')) type = 'Spirit'
      else if (item.includes('Dominance')) type = 'Dominance'
      else if (item.includes('Skill')) type = 'Skills'
      // Special handling for Lover+ChildItems with new organization
      else if (item.includes('Token')) type = 'Tokens'
      else if (item.includes('Intimacy') || item.includes('DailySecretPack') || item.includes('PremiumGiftBox') || 
               item.includes('DeluxeGiftBox') || item.includes('GiftBox')) type = 'Intimacy'
      else if (item.includes('TourMap') || item.includes('CrateOfDrinks') || item.includes('Beast') || 
               item.includes('Vito') || item.includes('Plazma')) type = 'Drinks'
      else if (item.includes('Attraction') || item.includes('Charm') || item.includes('Bouquet')) type = 'Attraction'
      else if (item.includes('Ring')) type = 'Rings'
      else if (item.includes('Affinity')) type = 'Affinity'
      // Special handling for MiscItems with new organization
      else if (item.includes('ExquisiteSilk') || item.includes('ImpeccableCashmere') || item.includes('SophisticatedSatin')) type = 'Skin'
      else if (item.includes('LoudSpeaker') || item.includes('PocketWatch') || item.includes('Prestige') || 
               (item.includes('BanquetFavor') && !item.includes('BanquetFavor2')) || item.includes('PressCard')) type = 'Useable'
      else if (item.includes('CourageTablet') || item.includes('LookingGlass')) type = 'Underworld'
      else if (item.includes('ItemDonation') || item.includes('GuildEXPChest')) type = 'Guild'
      else if (item.includes('StandardFlag') || item.includes('Conclave')) type = 'Conclave'
      else if (item.includes('Banquet') || item.includes('Luxury')) type = 'Banquet'
      else if (item.includes('Flag') || item.includes('ArenaMedal')) type = 'Arena'
      else if (item.includes('League')) type = 'League'
      else if (item.includes('MirageMirror') || item.includes('RenameCard') || item.includes('Background')) type = 'Customization'
      else if (item.includes('Blood')) type = 'Blood'
      else if (item.includes('Bat') || item.includes('ResourceCollectorCard')) type = 'Bat'
      else if (item.includes('Nectar')) type = 'Nectar'
      else if (item.includes('BloodMoon')) type = 'Blood Moon'
      else if (item.includes('DarkSun')) type = 'Dark Sun'
      else if (item.includes('Dusk')) type = 'Dusk'
      else if (item.includes('FallenStar')) type = 'Fallen Star'
      else if (item.includes('Midnight')) type = 'Midnight'
      else if (item.includes('Nightfall')) type = 'Nightfall'
      else if (item.includes('Twilight')) type = 'Twilight'
      else if (item.includes('Affinity')) type = 'Affinity'
      else if (item.includes('Token')) type = 'Tokens'
      else if (item.includes('Coin')) type = 'Coins'
      else if (item.includes('Badge')) type = 'Badges'
      else if (item.includes('Scroll')) type = 'Scrolls'
      else if (item.includes('Elixir')) type = 'Elixirs'
      else if (item.includes('Ring')) type = 'Rings'
      else if (item.includes('Medal')) type = 'Medals'
      else if (item.includes('Suit')) type = 'Suits'
      else if (item.includes('Equip')) type = 'Equipment'
      
      if (!groups[type]) groups[type] = []
      groups[type].push(item)
    })
    
    return groups
  }

  // Helper function to organize equipment by sets (for equipment tab only)
  const organizeEquipmentBySets = (items: string[]): { [setName: string]: string[] } => {
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
    
    // Sort each set: Equip, Medal, Ring, Suit
    Object.keys(sets).forEach(setName => {
      sets[setName].sort((a, b) => {
        const order = ['Equip', 'Medal', 'Ring', 'Suit']
        const aType = order.findIndex(type => a.includes(type))
        const bType = order.findIndex(type => b.includes(type))
        return aType - bType
      })
    })
    
    // Return sets in the specified order: dusk, nightfall, midnight, twilight, fallen star, blood moon, dark sun
    const orderedSets: { [setName: string]: string[] } = {}
    const order = ['Dusk', 'Nightfall', 'Midnight', 'Twilight', 'Fallen Star', 'Blood Moon', 'Dark Sun']
    
    order.forEach(setName => {
      if (sets[setName]) {
        orderedSets[setName] = sets[setName]
      }
    })
    
    // Add any remaining sets that weren't in the order
    Object.keys(sets).forEach(setName => {
      if (!orderedSets[setName]) {
        orderedSets[setName] = sets[setName]
      }
    })
    
    return orderedSets
  }

  // Handle file upload (now supports both text files and images)
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
          
          // Check if it's an image file
          if (file.type.startsWith('image/')) { 
            setOcrProgress(`Processing image ${i + 1}/${files.length}: ${file.name}`)
            content = await processImageWithOCR(file)
          } else {
            // Handle text files as before
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
      // Clear the input so the same file can be uploaded again
      event.target.value = ''
    }
  }

  // Scarlet bond - per attribute inputs
  const [scarletBond, setScarletBond] = useState<{
    [key: string]: {
      strengthLevel?: number
      strengthPercent?: number
      allureLevel?: number
      allurePercent?: number
      intellectLevel?: number
      intellectPercent?: number
      spiritLevel?: number
      spiritPercent?: number
    }
  }>({})
  const [scarletBondAffinity, setScarletBondAffinity] = useState({})

  // Optimized bond levels (for DOM calculation)
  const [optimizedBondLevels, setOptimizedBondLevels] = useState<{
    [key: string]: {
      strengthLevel?: number
      strengthPercent?: number
      allureLevel?: number
      allurePercent?: number
      intellectLevel?: number
      intellectPercent?: number
      spiritLevel?: number
      spiritPercent?: number
    }
  }>({})

  // Additional Special Wardens (extending existing Nyx/Dracula)
  const [hasVictor, setHasVictor] = useState(false)
  const [hasFrederick, setHasFrederick] = useState(false)

  // Lovers (need to be summoned)
  const [hasAgneyi, setHasAgneyi] = useState(false)
  const [hasCulann, setHasCulann] = useState(false)
  const [hasHela, setHasHela] = useState(false)

  // Summonable characters (can be summoned with coins)
  const [hasFrances, setHasFrances] = useState(false)
  const [hasRaven, setHasRaven] = useState(false)
  const [hasMary, setHasMary] = useState(false)
  const [hasInanna, setHasInanna] = useState(false)
  const [hasOtchigon, setHasOtchigon] = useState(false)
  const [hasSkylar, setHasSkylar] = useState(false)
  const [hasBess, setHasBess] = useState(false)
  const [hasRoxana, setHasRoxana] = useState(false)
  const [hasAisha, setHasAisha] = useState(false)
  const [hasAntonia, setHasAntonia] = useState(false)
  const [hasGabrielle, setHasGabrielle] = useState(false)
  const [hasMairi, setHasMairi] = useState(false)
  const [hasAretha, setHasAretha] = useState(false)
  const [hasRegina, setHasRegina] = useState(false)
  const [hasAva, setHasAva] = useState(false)
  const [hasAlexis, setHasAlexis] = useState(false)
  const [hasElaine, setHasElaine] = useState(false)
  const [hasSuria, setHasSuria] = useState(false)
  const [hasCordelia, setHasCordelia] = useState(false)
  const [hasHanna, setHasHanna] = useState(false)
  const [hasElizabeth, setHasElizabeth] = useState(false)
  const [hasMichelle, setHasMichelle] = useState(false)
  const [hasHarriet, setHasHarriet] = useState(false)
  const [hasJohanna, setHasJohanna] = useState(false)
  const [hasLucy, setHasLucy] = useState(false)
  const [hasRuna, setHasRuna] = useState(false)

  // Talent Scrolls and Scripts
  const [talents, setTalents] = useState({
    // Random Talent Scrolls (with ranges)
    randomTalentScroll: { count: 0, exp: 502.5 }, // Average of 5-1000 at ~40th percentile
    talentScrollLvl4: { count: 0, exp: 60.5 }, // Average of 41-80 at ~40th percentile  
    talentScrollLvl3: { count: 0, exp: 30.5 }, // Average of 21-40 at ~40th percentile
    talentScrollLvl2: { count: 0, exp: 13 }, // Average of 6-20 at ~40th percentile
    talentScrollLvl1: { count: 0, exp: 3 }, // Average of 1-5 at ~40th percentile
    
    // Fixed Talent Scrolls
    basicTalentScroll: { count: 0, exp: 50 },
    fineTalentScroll: { count: 0, exp: 100 },
    superiorTalentScroll: { count: 0, exp: 200 },
    
    // Attribute Scripts (select one star level and quantity)
    strengthScript: {
      selectedStar: 0, // 0 means none selected, 1-6 for star levels
      quantity: 0,
      wardenLevel: 1
    },
    allureScript: {
      selectedStar: 0,
      quantity: 0,
      wardenLevel: 1
    },
    intellectScript: {
      selectedStar: 0,
      quantity: 0,
      wardenLevel: 1
    },
    spiritScript: {
      selectedStar: 0,
      quantity: 0,
      wardenLevel: 1
    }
  })

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [autoLoadCloudSaves, setAutoLoadCloudSaves] = useState(true)
  const [dataLoadPreference, setDataLoadPreference] = useState<'local' | 'cloud' | 'ask' | null>(null)
  const [showDataComparison, setShowDataComparison] = useState(false)
  const [dataComparison, setDataComparison] = useState<{
    local: { data: any; size: number; timestamp?: string } | null;
    cloud: { data: any; size: number; timestamp?: string } | null;
  }>({ local: null, cloud: null })

  // Auras - Comprehensive warden data structure (imported from @/data/auras)
  const [auras, setAuras] = useState(initialAuras)

  // Save/Load functionality
  const saveData = () => {
    const saveState = {
      baseAttributes,
      vipLevel,
      lordLevel,
      books,
      conclave,
      conclaveUpgrade,
      domIncreasePerStar,
      courtyard,
      wardenCounts,
      selectedWardens,
      hasNyx,
      hasDracula,
      hasVictor,
      hasFrederick,
      hasAgneyi,
      hasCulann,
      hasHela,
      hasFrances,
      hasRaven,
      hasMary,
      hasInanna,
      hasOtchigon,
      hasSkylar,
      hasBess,
      hasRoxana,
      hasAisha,
      hasAntonia,
      hasGabrielle,
      hasMairi,
      hasAretha,
      hasRegina,
      hasAva,
      hasAlexis,
      hasElaine,
      hasSuria,
      hasCordelia,
      hasHanna,
      hasElizabeth,
      hasMichelle,
      hasHarriet,
      hasJohanna,
      hasLucy,
      hasRuna,
      auras,
      wardenStats,
      uploadedWardenData,
      scarletBond,
      scarletBondAffinity,
      optimizedBondLevels,
      talents,
      inventory,
      inventoryImages,
      timestamp: new Date().toISOString()
    }
    
    try {
      localStorage.setItem('gameCalculatorData', JSON.stringify(saveState))
      alert('Data saved successfully!')
    } catch (error) {
      console.error('Failed to save data:', error)
      alert('Failed to save data. Please try again.')
    }
  }

  const loadData = () => {
    try {
      const savedData = localStorage.getItem('gameCalculatorData')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        
        // Load all the state
        setBaseAttributes(parsedData.baseAttributes || { strength: 0, allure: 0, intellect: 0, spirit: 0 })
        setVipLevel(parsedData.vipLevel || 1)
        setLordLevel(parsedData.lordLevel || "Fledgling 1")
        setBooks(parsedData.books || initialBooks)
        setConclave(parsedData.conclave || { "Seal of Strength": 0, "Seal of Allure": 0, "Seal of Intellect": 0, "Seal of Spirit": 0 })
        setConclaveUpgrade(parsedData.conclaveUpgrade || { savedSeals: 0, upgradeSeals: { "Seal of Strength": true, "Seal of Allure": true, "Seal of Intellect": true, "Seal of Spirit": true } })
        setDomIncreasePerStar(parsedData.domIncreasePerStar || domIncreasePerStarData)
        setCourtyard(parsedData.courtyard || { currentLevel: 1, currentPoints: 0 })
        setWardenCounts(parsedData.wardenCounts || { circus: 0, tyrants: 0, noir: 0, hunt: 0 })
        setSelectedWardens(parsedData.selectedWardens || { circus: [], tyrants: [], noir: [], hunt: [] })
        setHasNyx(parsedData.hasNyx || false)
        setHasDracula(parsedData.hasDracula || false)
        setHasVictor(parsedData.hasVictor || false)
        setHasFrederick(parsedData.hasFrederick || false)
        setHasAgneyi(parsedData.hasAgneyi || false)
        setHasCulann(parsedData.hasCulann || false)
        setHasHela(parsedData.hasHela || false)
        setHasFrances(parsedData.hasFrances || false)
        setHasRaven(parsedData.hasRaven || false)
        setHasMary(parsedData.hasMary || false)
        setHasInanna(parsedData.hasInanna || false)
        setHasOtchigon(parsedData.hasOtchigon || false)
        setHasSkylar(parsedData.hasSkylar || false)
        setHasBess(parsedData.hasBess || false)
        setHasRoxana(parsedData.hasRoxana || false)
        setHasAisha(parsedData.hasAisha || false)
        setHasAntonia(parsedData.hasAntonia || false)
        setHasGabrielle(parsedData.hasGabrielle || false)
        setHasMairi(parsedData.hasMairi || false)
        setHasAretha(parsedData.hasAretha || false)
        setHasRegina(parsedData.hasRegina || false)
        setHasAva(parsedData.hasAva || false)
        setHasAlexis(parsedData.hasAlexis || false)
        setHasElaine(parsedData.hasElaine || false)
        setHasSuria(parsedData.hasSuria || false)
        setHasCordelia(parsedData.hasCordelia || false)
        setHasHanna(parsedData.hasHanna || false)
        setHasElizabeth(parsedData.hasElizabeth || false)
        setHasMichelle(parsedData.hasMichelle || false)
        setHasHarriet(parsedData.hasHarriet || false)
        setHasJohanna(parsedData.hasJohanna || false)
        setHasLucy(parsedData.hasLucy || false)
        setHasRuna(parsedData.hasRuna || false)
        setAuras(parsedData.auras || initialAuras)
        setWardenStats(parsedData.wardenStats || {})
        setUploadedWardenData(parsedData.uploadedWardenData || {})
        setScarletBond(parsedData.scarletBond || {})
        setScarletBondAffinity(parsedData.scarletBondAffinity || {})
        setOptimizedBondLevels(parsedData.optimizedBondLevels || {})
        setTalents(parsedData.talents || {
          randomTalentScroll: { count: 0, exp: 502.5 },
          talentScrollLvl4: { count: 0, exp: 60.5 },
          talentScrollLvl3: { count: 0, exp: 30.5 },
          talentScrollLvl2: { count: 0, exp: 13 },
          talentScrollLvl1: { count: 0, exp: 3 },
          basicTalentScroll: { count: 0, exp: 50 },
          fineTalentScroll: { count: 0, exp: 100 },
          superiorTalentScroll: { count: 0, exp: 200 },
          strengthScript: {
            selectedStar: 0,
            quantity: 0,
            wardenLevel: 1
          },
          allureScript: {
            selectedStar: 0,
            quantity: 0,
            wardenLevel: 1
          },
          intellectScript: {
            selectedStar: 0,
            quantity: 0,
            wardenLevel: 1
          },
          spiritScript: {
            selectedStar: 0,
            quantity: 0,
            wardenLevel: 1
          }
        })
        setInventory(parsedData.inventory || {})
        setInventoryImages(parsedData.inventoryImages || {})
        
        alert(`Data loaded successfully! (Saved: ${new Date(parsedData.timestamp).toLocaleString()})`)
      } else {
        alert('No saved data found.')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load data. The saved data might be corrupted.')
    }
  }

  const exportData = () => {
    const saveState = {
      baseAttributes,
      vipLevel,
      lordLevel,
      books,
      conclave,
      conclaveUpgrade,
      domIncreasePerStar,
      courtyard,
      wardenCounts,
      selectedWardens,
      hasNyx,
      hasDracula,
      hasVictor,
      hasFrederick,
      hasAgneyi,
      hasCulann,
      hasHela,
      hasFrances,
      hasRaven,
      hasMary,
      hasInanna,
      hasOtchigon,
      hasSkylar,
      hasBess,
      hasRoxana,
      hasAisha,
      hasAntonia,
      hasGabrielle,
      hasMairi,
      hasAretha,
      hasRegina,
      hasAva,
      hasAlexis,
      hasElaine,
      hasSuria,
      hasCordelia,
      hasHanna,
      hasElizabeth,
      hasMichelle,
      hasHarriet,
      hasJohanna,
      hasLucy,
      hasRuna,
      auras,
      wardenStats,
      uploadedWardenData,
      scarletBond,
      scarletBondAffinity,
      optimizedBondLevels,
      talents,
      inventory,
      timestamp: new Date().toISOString()
    }
    
    try {
      const dataStr = JSON.stringify(saveState, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `game-calculator-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data.')
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Load all the state
        setBaseAttributes(importedData.baseAttributes || { strength: 0, allure: 0, intellect: 0, spirit: 0 })
        setVipLevel(importedData.vipLevel || 1)
        setLordLevel(importedData.lordLevel || "Fledgling 1")
        setBooks(importedData.books || initialBooks)
        setConclave(importedData.conclave || { "Seal of Strength": 0, "Seal of Allure": 0, "Seal of Intellect": 0, "Seal of Spirit": 0 })
        setConclaveUpgrade(importedData.conclaveUpgrade || { savedSeals: 0, upgradeSeals: { "Seal of Strength": true, "Seal of Allure": true, "Seal of Intellect": true, "Seal of Spirit": true } })
        setDomIncreasePerStar(importedData.domIncreasePerStar || domIncreasePerStarData)
        setCourtyard(importedData.courtyard || { currentLevel: 1, currentPoints: 0 })
        setWardenCounts(importedData.wardenCounts || { circus: 0, tyrants: 0, noir: 0, hunt: 0 })
        setSelectedWardens(importedData.selectedWardens || { circus: [], tyrants: [], noir: [], hunt: [] })
        setHasNyx(importedData.hasNyx || false)
        setHasDracula(importedData.hasDracula || false)
        setHasVictor(importedData.hasVictor || false)
        setHasFrederick(importedData.hasFrederick || false)
        setHasAgneyi(importedData.hasAgneyi || false)
        setHasCulann(importedData.hasCulann || false)
        setHasHela(importedData.hasHela || false)
        setHasFrances(importedData.hasFrances || false)
        setHasRaven(importedData.hasRaven || false)
        setHasMary(importedData.hasMary || false)
        setHasInanna(importedData.hasInanna || false)
        setHasOtchigon(importedData.hasOtchigon || false)
        setHasSkylar(importedData.hasSkylar || false)
        setHasBess(importedData.hasBess || false)
        setHasRoxana(importedData.hasRoxana || false)
        setHasAisha(importedData.hasAisha || false)
        setHasAntonia(importedData.hasAntonia || false)
        setHasGabrielle(importedData.hasGabrielle || false)
        setHasMairi(importedData.hasMairi || false)
        setHasAretha(importedData.hasAretha || false)
        setHasRegina(importedData.hasRegina || false)
        setHasAva(importedData.hasAva || false)
        setHasAlexis(importedData.hasAlexis || false)
        setHasElaine(importedData.hasElaine || false)
        setHasSuria(importedData.hasSuria || false)
        setHasCordelia(importedData.hasCordelia || false)
        setHasHanna(importedData.hasHanna || false)
        setHasElizabeth(importedData.hasElizabeth || false)
        setHasMichelle(importedData.hasMichelle || false)
        setHasHarriet(importedData.hasHarriet || false)
        setHasJohanna(importedData.hasJohanna || false)
        setHasLucy(importedData.hasLucy || false)
        setHasRuna(importedData.hasRuna || false)
        setAuras(importedData.auras || initialAuras)
        setWardenStats(importedData.wardenStats || {})
        setScarletBond(importedData.scarletBond || {})
        setScarletBondAffinity(importedData.scarletBondAffinity || {})
        setOptimizedBondLevels(importedData.optimizedBondLevels || {})
        setInventory(importedData.inventory || {})
        
        alert(`Data imported successfully! (From: ${new Date(importedData.timestamp).toLocaleString()})`)
      } catch (error) {
        console.error('Failed to import data:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  // Load preferences from localStorage first
  useEffect(() => {
    const savedAutoLoad = localStorage.getItem('autoLoadCloudSaves')
    if (savedAutoLoad !== null) {
      setAutoLoadCloudSaves(JSON.parse(savedAutoLoad))
    }

    const savedDataPreference = localStorage.getItem('dataLoadPreference')
    if (savedDataPreference !== null) {
      setDataLoadPreference(JSON.parse(savedDataPreference))
    }
  }, [])

  // Check for existing authentication on component mount and auto-load cloud save
  useEffect(() => {
    const checkUserAndAutoLoad = async () => {
      const { user } = await getCurrentUser()
      setUser(user)
      
      // If user is authenticated, try to auto-load their most recent cloud save
      if (user) {
        try {
          // Get the current preference value from localStorage directly to avoid race condition
          const savedPreference = localStorage.getItem('autoLoadCloudSaves')
          const shouldAutoLoad = savedPreference !== null ? JSON.parse(savedPreference) : true
          
          const { data, error } = await supabase
            .from('user_saves')
            .select('save_data')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

          if (!error && data?.save_data) {
            // Check if user has any local data that might be newer
            const localData = localStorage.getItem('gameCalculatorData')
            const autoSavedData = localStorage.getItem('gameCalculatorAutoSave')
            
            console.log('Auto-load debug:', {
              shouldAutoLoad,
              hasLocalData: !!localData,
              hasAutoSavedData: !!autoSavedData,
              hasCloudSave: !!data?.save_data
            })
            
            // If we have both local and cloud data, use stored preference or ask
            if ((localData || autoSavedData) && data?.save_data) {
              const storedPreference = localStorage.getItem('dataLoadPreference')
              const preference = storedPreference ? JSON.parse(storedPreference) : null
              
              if (preference === 'local') {
                const localDataToLoad = localData || autoSavedData
                if (localDataToLoad) {
                  loadCloudData(JSON.parse(localDataToLoad))
                  console.log('Auto-loaded local data based on stored preference')
                }
              } else if (preference === 'cloud') {
                loadCloudData(data.save_data)
                console.log('Auto-loaded cloud data based on stored preference')
              } else {
                // No preference set or preference is 'ask' - trigger comparison
                console.log('Both local and cloud data found - triggering comparison for first-time choice')
                setTimeout(() => compareData(), 1000) // Small delay to let UI settle
              }
            } else if (shouldAutoLoad && !localData && !autoSavedData) {
              loadCloudData(data.save_data)
              console.log('Auto-loaded most recent cloud save successfully!')
            } else {
              console.log('Auto-load skipped:', {
                reason: !shouldAutoLoad ? 'preference disabled' : 
                       localData ? 'has local data' :
                       autoSavedData ? 'has auto-saved data' : 'unknown'
              })
            }
          } else {
            console.log('No cloud save data found:', { error, hasData: !!data?.save_data })
          }
        } catch (error) {
          console.log('Error during auto-load:', error)
        }
      } else {
        console.log('No authenticated user found')
      }
    }
    checkUserAndAutoLoad()
  }, [])

  // Gather all current calculator data
  const getCurrentData = () => {
    return {
      baseAttributes,
      vipLevel,
      lordLevel,
      books,
      conclave,
      conclaveUpgrade,
      domIncreasePerStar,
      courtyard,
      wardenCounts,
      selectedWardens,
      hasNyx,
      hasDracula,
      hasVictor,
      hasFrederick,
      auras,
      wardenStats,
      scarletBond,
      scarletBondAffinity,
      optimizedBondLevels,
      hasAgneyi,
      hasCulann,
      hasHela,
      talents,
      inventory,
      timestamp: new Date().toISOString(),
    }
  }

  // Load data from cloud save
  const loadCloudData = (data: any) => {
    if (data.baseAttributes) setBaseAttributes(data.baseAttributes)
    if (data.vipLevel !== undefined) setVipLevel(data.vipLevel)
    if (data.lordLevel) setLordLevel(data.lordLevel)
    if (data.books) setBooks(data.books)
    if (data.conclave) setConclave(data.conclave)
    if (data.conclaveUpgrade) setConclaveUpgrade(data.conclaveUpgrade)
    if (data.domIncreasePerStar) setDomIncreasePerStar(data.domIncreasePerStar)
    if (data.courtyard) setCourtyard(data.courtyard)
    if (data.wardenCounts) setWardenCounts(data.wardenCounts)
    if (data.selectedWardens) setSelectedWardens(data.selectedWardens)
    if (data.hasNyx !== undefined) setHasNyx(data.hasNyx)
    if (data.hasDracula !== undefined) setHasDracula(data.hasDracula)
    if (data.hasVictor !== undefined) setHasVictor(data.hasVictor)
    if (data.hasFrederick !== undefined) setHasFrederick(data.hasFrederick)
    if (data.auras) setAuras(data.auras)
    if (data.wardenStats) setWardenStats(data.wardenStats)
    if (data.uploadedWardenData) setUploadedWardenData(data.uploadedWardenData)
    if (data.scarletBond) setScarletBond(data.scarletBond)
    if (data.scarletBondAffinity) setScarletBondAffinity(data.scarletBondAffinity)
    if (data.optimizedBondLevels) setOptimizedBondLevels(data.optimizedBondLevels)
    if (data.hasAgneyi !== undefined) setHasAgneyi(data.hasAgneyi)
    if (data.hasCulann !== undefined) setHasCulann(data.hasCulann)
    if (data.hasHela !== undefined) setHasHela(data.hasHela)
    if (data.hasFrances !== undefined) setHasFrances(data.hasFrances)
    if (data.hasRaven !== undefined) setHasRaven(data.hasRaven)
    if (data.hasMary !== undefined) setHasMary(data.hasMary)
    if (data.hasInanna !== undefined) setHasInanna(data.hasInanna)
    if (data.hasOtchigon !== undefined) setHasOtchigon(data.hasOtchigon)
    if (data.hasSkylar !== undefined) setHasSkylar(data.hasSkylar)
    if (data.hasBess !== undefined) setHasBess(data.hasBess)
    if (data.hasRoxana !== undefined) setHasRoxana(data.hasRoxana)
    if (data.hasAisha !== undefined) setHasAisha(data.hasAisha)
    if (data.hasAntonia !== undefined) setHasAntonia(data.hasAntonia)
    if (data.hasGabrielle !== undefined) setHasGabrielle(data.hasGabrielle)
    if (data.hasMairi !== undefined) setHasMairi(data.hasMairi)
    if (data.hasAretha !== undefined) setHasAretha(data.hasAretha)
    if (data.hasRegina !== undefined) setHasRegina(data.hasRegina)
    if (data.hasAva !== undefined) setHasAva(data.hasAva)
    if (data.hasAlexis !== undefined) setHasAlexis(data.hasAlexis)
    if (data.hasElaine !== undefined) setHasElaine(data.hasElaine)
    if (data.hasSuria !== undefined) setHasSuria(data.hasSuria)
    if (data.hasCordelia !== undefined) setHasCordelia(data.hasCordelia)
    if (data.hasHanna !== undefined) setHasHanna(data.hasHanna)
    if (data.hasElizabeth !== undefined) setHasElizabeth(data.hasElizabeth)
    if (data.hasMichelle !== undefined) setHasMichelle(data.hasMichelle)
    if (data.hasHarriet !== undefined) setHasHarriet(data.hasHarriet)
    if (data.hasJohanna !== undefined) setHasJohanna(data.hasJohanna)
    if (data.hasLucy !== undefined) setHasLucy(data.hasLucy)
    if (data.hasRuna !== undefined) setHasRuna(data.hasRuna)
    if (data.talents) setTalents(data.talents)
    if (data.inventory) setInventory(data.inventory)
  }

  // Helper function to check if a character is summonable (has vip: 0)
  const isSummonable = (loverName: string): boolean => {
    const bondData = scarletBondData.find(b => {
      // Handle lovers with slashes (different genders)
      if (b.lover.includes('/')) {
        const names = b.lover.split('/');
        return names[0].trim() === loverName || names[1].trim() === loverName;
      }
      return b.lover === loverName;
    });
    return bondData?.vip === 0;
  }

  // Helper function to get the state variable for a summonable character
  const getSummonableState = (loverName: string): [boolean, (value: boolean) => void] => {
    switch (loverName) {
      case 'Frances': return [hasFrances, setHasFrances];
      case 'Raven': return [hasRaven, setHasRaven];
      case 'Mary': return [hasMary, setHasMary];
      case 'Inanna': return [hasInanna, setHasInanna];
      case 'Otchigon': return [hasOtchigon, setHasOtchigon];
      case 'Skylar': return [hasSkylar, setHasSkylar];
      case 'Bess': return [hasBess, setHasBess];
      case 'Roxana': return [hasRoxana, setHasRoxana];
      case 'Aisha': return [hasAisha, setHasAisha];
      case 'Antonia': return [hasAntonia, setHasAntonia];
      case 'Gabrielle': return [hasGabrielle, setHasGabrielle];
      case 'Mairi': return [hasMairi, setHasMairi];
      case 'Aretha': return [hasAretha, setHasAretha];
      case 'Regina': return [hasRegina, setHasRegina];
      case 'Ava': return [hasAva, setHasAva];
      case 'Alexis': return [hasAlexis, setHasAlexis];
      case 'Elaine': return [hasElaine, setHasElaine];
      case 'Suria': return [hasSuria, setHasSuria];
      case 'Cordelia': return [hasCordelia, setHasCordelia];
      case 'Hanna': return [hasHanna, setHasHanna];
      case 'Elizabeth': return [hasElizabeth, setHasElizabeth];
      case 'Michelle': return [hasMichelle, setHasMichelle];
      case 'Harriet': return [hasHarriet, setHasHarriet];
      case 'Johanna': return [hasJohanna, setHasJohanna];
      case 'Lucy': return [hasLucy, setHasLucy];
      case 'Runa': return [hasRuna, setHasRuna];
      default: return [false, () => {}];
    }
  }

  // Toggle auto-load cloud saves preference
  const toggleAutoLoadCloudSaves = () => {
    const newValue = !autoLoadCloudSaves
    setAutoLoadCloudSaves(newValue)
    localStorage.setItem('autoLoadCloudSaves', JSON.stringify(newValue))
  }

  // Calculate data size in bytes
  const calculateDataSize = (data: any): number => {
    return new Blob([JSON.stringify(data)]).size
  }

  // Format size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Compare local and cloud data
  const compareData = async () => {
    if (!user) return

    try {
      // Get local data
      const localDataStr = localStorage.getItem('gameCalculatorData')
      const autoSavedDataStr = localStorage.getItem('gameCalculatorAutoSave')
      
      let localData = null
      if (localDataStr) {
        const parsed = JSON.parse(localDataStr)
        const timestamp = parsed.timestamp 
          ? new Date(parsed.timestamp).toLocaleString()
          : 'Unknown'
        localData = {
          data: parsed,
          size: calculateDataSize(parsed),
          timestamp: timestamp
        }
      } else if (autoSavedDataStr) {
        const parsed = JSON.parse(autoSavedDataStr)
        const timestamp = parsed.timestamp 
          ? new Date(parsed.timestamp).toLocaleString()
          : 'Auto-saved'
        localData = {
          data: parsed,
          size: calculateDataSize(parsed),
          timestamp: timestamp
        }
      }

      // Get cloud data
      const { data: cloudSave, error } = await supabase
        .from('user_saves')
        .select('save_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      let cloudData = null
      if (!error && cloudSave?.save_data) {
        cloudData = {
          data: cloudSave.save_data,
          size: calculateDataSize(cloudSave.save_data),
          timestamp: new Date(cloudSave.updated_at).toLocaleString()
        }
      }

      setDataComparison({ local: localData, cloud: cloudData })
      setShowDataComparison(true)
    } catch (error) {
      console.error('Error comparing data:', error)
      alert('Error comparing data. Please try again.')
    }
  }

  // Load from comparison and save preference
  const loadFromComparison = (source: 'local' | 'cloud') => {
    const data = source === 'local' ? dataComparison.local?.data : dataComparison.cloud?.data
    if (data) {
      // Save the user's choice as preference
      setDataLoadPreference(source)
      localStorage.setItem('dataLoadPreference', JSON.stringify(source))
      
      loadCloudData(data)
      setShowDataComparison(false)
      alert(`Data loaded from ${source} successfully! This preference will be remembered for future loads.`)
    }
  }

  // Reset data preference (for settings)
  const resetDataPreference = () => {
    setDataLoadPreference(null)
    localStorage.removeItem('dataLoadPreference')
    alert('Data load preference reset. You will be asked to choose again next time.')
  }

  // Auto-save functionality (save every 30 seconds if data has changed)
  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      try {
        const currentState = {
          baseAttributes,
          vipLevel,
          lordLevel,
          books,
          conclave,
          conclaveUpgrade,
          domIncreasePerStar,
          courtyard,
          wardenCounts,
          selectedWardens,
          hasNyx,
          hasDracula,
          hasVictor,
          hasFrederick,
          hasAgneyi,
          hasCulann,
          hasHela,
          auras,
          wardenStats,
          scarletBond,
          scarletBondAffinity,
          optimizedBondLevels,
          inventory
        }
        localStorage.setItem('gameCalculatorAutoSave', JSON.stringify(currentState))
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [baseAttributes, vipLevel, lordLevel, books, conclave, conclaveUpgrade, domIncreasePerStar, courtyard, wardenCounts, selectedWardens, hasNyx, hasDracula, hasVictor, hasFrederick, auras, wardenStats, scarletBond, scarletBondAffinity, optimizedBondLevels, inventory])

  // Load auto-saved data on component mount
  React.useEffect(() => {
    try {
      const autoSavedData = localStorage.getItem('gameCalculatorAutoSave')
      if (autoSavedData) {
        const parsedData = JSON.parse(autoSavedData)
        
        // Only load if it's recent (within last 24 hours)
        const lastSave = localStorage.getItem('gameCalculatorData')
        if (!lastSave) {
          // Load auto-saved data if no manual save exists
          setBaseAttributes(parsedData.baseAttributes || { strength: 0, allure: 0, intellect: 0, spirit: 0 })
          setVipLevel(parsedData.vipLevel || 1)
          setLordLevel(parsedData.lordLevel || "Fledgling 1")
          setBooks(parsedData.books || initialBooks)
          setConclave(parsedData.conclave || { "Seal of Strength": 0, "Seal of Allure": 0, "Seal of Intellect": 0, "Seal of Spirit": 0 })
          setConclaveUpgrade(parsedData.conclaveUpgrade || { savedSeals: 0, upgradeSeals: { "Seal of Strength": true, "Seal of Allure": true, "Seal of Intellect": true, "Seal of Spirit": true } })
          setCourtyard(parsedData.courtyard || { currentLevel: 1, currentPoints: 0 })
          setWardenCounts(parsedData.wardenCounts || { circus: 0, tyrants: 0, noir: 0, hunt: 0 })
          setSelectedWardens(parsedData.selectedWardens || { circus: [], tyrants: [], noir: [], hunt: [] })
          setHasNyx(parsedData.hasNyx || false)
          setHasDracula(parsedData.hasDracula || false)
          setHasVictor(parsedData.hasVictor || false)
          setHasFrederick(parsedData.hasFrederick || false)
          setAuras(parsedData.auras || initialAuras)
          setWardenStats(parsedData.wardenStats || {})
          setScarletBond(parsedData.scarletBond || {})
          setScarletBondAffinity(parsedData.scarletBondAffinity || {})
          setOptimizedBondLevels(parsedData.optimizedBondLevels || {})
          setInventory(parsedData.inventory || {})
          setInventoryImages(parsedData.inventoryImages || {})
        }
      }
    } catch (error) {
      console.error('Failed to load auto-saved data:', error)
    }
  }, [])

  // Active warden subtab
  const [activeWardenTab, setActiveWardenTab] = useState("summons")

  // Warden data (imported from @/data/wardens)
  // const wardenGroups is imported

  // Scarlet bond data (imported from @/data/scarletBonds)
  // const scarletBondData is imported

  // Scarlet bond level progression data (imported from @/data/scarletBonds)
  // const scarletBondLevels is imported

  // Warden attributes mapping for scarlet bonds (imported from @/data/wardens)
  // const wardenAttributes is imported

  // Calculate individual scarlet bond attribute contributions
  const calculateScarletBondContribution = (bondKey: string, attribute: string) => {
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    
    if (!bondData) return { flatBonus: 0, percentBonus: 0, totalBonus: 0 }
    
    // Use optimized levels if available, otherwise use manual input levels
    const optimizedBond = optimizedBondLevels[bondKey] || currentBond
    
    let flatBonus = 0
    let percentBonus = 0
    
    // Calculate flat bonus
    const flatLevel = optimizedBond[`${attribute}Level`] || 0
    if (flatLevel > 0) {
      const levelData = scarletBondLevels.find(l => l.level === flatLevel)
      if (levelData) {
        if (bondData.type === 'All') {
          flatBonus = levelData.all || 0
        } else if (bondData.type === 'Dual') {
          flatBonus = levelData.dual || 0
        } else {
          flatBonus = levelData.single || 0
        }
      }
    }
    
    // Calculate percentage bonus (applied to the flat bonus amount)
    const percentLevel = optimizedBond[`${attribute}Percent`] || 0
    if (percentLevel > 0 && flatBonus > 0) {
      const percentageValue = percentLevel / 100
      percentBonus = percentageValue * flatBonus
    }
    
    // Apply lover aura bonuses
    let loverMultiplier = 1
    
    // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    
    if (attribute === 'strength' && canSummonAgneyi) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    } else if (attribute === 'intellect' && canSummonCulann) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    } else if (attribute === 'spirit' && canSummonHela) {
      const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
      loverMultiplier = loverCount === 1 ? 1.2 : loverCount === 2 ? 1.25 : 1.3
    }
    
    const totalBonus = (flatBonus + percentBonus) * loverMultiplier
    
    return { 
      flatBonus: Math.round(flatBonus), 
      percentBonus: Math.round(percentBonus * 100) / 100, 
      totalBonus: Math.round(totalBonus), 
      loverMultiplier: Math.round((loverMultiplier - 1) * 100) 
    }
  }

  // Calculate courtyard projected level
  const calculateMaxCourtyardLevel = () => {
    // Courtyard level data (imported from @/data/courtyard)
    // const courtyardLevels is imported

    let availablePoints = courtyard.currentPoints
    let currentLevel = courtyard.currentLevel

    for (let i = currentLevel - 1; i < courtyardLevels.length; i++) {
      const nextLevel = courtyardLevels[i]
      if (availablePoints >= nextLevel.cost) {
        availablePoints -= nextLevel.cost
        currentLevel = nextLevel.level
      } else {
        break
      }
    }

    return currentLevel
  }

  const projectedLevel = calculateMaxCourtyardLevel()

  // Calculate DOM gain per star
  const calculateDomGainPerStar = (level: number) => {
    const data = domIncreasePerStarData.find(d => d.level === level)
    if (!data) return 0
    //calculate total dom gain per star
    const totalStrength = data.constant * domIncreasePerStar.currentStrengthStars * auras.wildHunt.Rudra.baseValue
    const totalAllure = data.constant * domIncreasePerStar.currentAllureStars * auras.wildHunt.Woden.baseValue
    const totalIntellect = data.constant * domIncreasePerStar.currentIntellectStars * auras.wildHunt.Artemis.baseValue
    const totalSpirit = data.constant * domIncreasePerStar.currentSpiritStars * auras.wildHunt.Finn.baseValue
    const totalDomGain = totalStrength + totalAllure + totalIntellect + totalSpirit
    return totalDomGain
  }

  // Calculate optimal bond upgrades for a given bond (allow multiple levels per attribute)
  const calculateOptimalBondUpgrades = (bondKey: string, availableAffinity: number) => {
    const [lover, warden] = bondKey.split("-")
    const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    
    if (!wardenData || !bondData) {
      return null
    }
    
    // Get all possible bond types for this warden
    const bondTypes: string[] = []
    wardenData.forEach(attr => {
      if (attr.toLowerCase() !== 'balance') {
        bondTypes.push(`${attr.toLowerCase()}Level`)
        bondTypes.push(`${attr.toLowerCase()}Percent`)
      }
    })
    
    // If warden has "All" type, add all attributes
    if (wardenData.some(attr => attr === 'All')) {
      bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                    'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
    }
    
    // Track temp levels to allow multi-level upgrades in a single run
    const tempCurrentLevels: Record<string, number> = {}
    bondTypes.forEach(bondType => {
      tempCurrentLevels[bondType] = currentBond[bondType as keyof typeof currentBond] || 0
    })
    
    const appliedUpgrades: { bondType: string; currentLevel: number; newLevel: number; cost: number; domGain: number }[] = []
    let remainingAffinity = availableAffinity
    
    let canAffordMore = true
    while (canAffordMore && remainingAffinity > 0) {
      canAffordMore = false
      const availableUpgrades: { bondType: string; currentLevel: number; newLevel: number; cost: number; domGain: number; efficiency: number }[] = []
      
      // Build one-step upgrades from current temp levels
      bondTypes.forEach(bondType => {
        const tempLevel = tempCurrentLevels[bondType]
        if (tempLevel < 205) {
          const nextLevel = tempLevel + 1
          const levelData = scarletBondLevels.find(l => l.level === nextLevel)
          if (levelData) {
            let cost = 0
            // Since data is non-cumulative, use the affinity value directly
            if (bondData.type === 'All') {
              cost = levelData.all_affinity || 0
            } else if (bondData.type === 'Dual') {
              cost = levelData.dual_affinity || 0
            } else if (bondData.type === 'Single') {
              cost = levelData.affinity || 0
            } else {
              cost = levelData.affinity || 0
            }
            if (cost >= 0 && remainingAffinity >= cost) {
              // Compute DOM gain using temp levels so percent uses updated flat level
              let domGain = 0
              if (bondType.endsWith('Level')) {
                const currentData = scarletBondLevels.find(l => l.level === tempLevel)
                let currentBonus = 0
                let newBonus = 0
                if (bondData.type === 'All') {
                  currentBonus = currentData?.all || 0
                  newBonus = levelData.all || 0
                } else if (bondData.type === 'Dual') {
                  currentBonus = currentData?.dual || 0
                  newBonus = levelData.dual || 0
                } else {
                  currentBonus = currentData?.single || 0
                  newBonus = levelData.single || 0
                }
                domGain = newBonus - currentBonus
              } else {
                const attr = bondType.replace('Level', '').replace('Percent', '')
                const flatLevel = tempCurrentLevels[`${attr}Level`]
                const flatData = scarletBondLevels.find(l => l.level === flatLevel)
                let flatBonus = 0
                if (bondData.type === 'All') {
                  flatBonus = flatData?.all || 0
                } else if (bondData.type === 'Dual') {
                  flatBonus = flatData?.dual || 0
                } else {
                  flatBonus = flatData?.single || 0
                }
                domGain = ((nextLevel - tempLevel) * flatBonus) / 100
              }
              availableUpgrades.push({
                bondType,
                currentLevel: tempLevel,
                newLevel: nextLevel,
                cost,
                domGain,
                efficiency: cost === 0 ? Infinity : domGain / cost
              })
            }
          }
        }
      })
      
      // Pick the most efficient affordable upgrade
      availableUpgrades.sort((a, b) => {
        if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
        if (a.cost === 0) return -1
        if (b.cost === 0) return 1
        return b.efficiency - a.efficiency
      })
      
      if (availableUpgrades.length > 0 && remainingAffinity >= availableUpgrades[0].cost) {
        const best = availableUpgrades[0]
        appliedUpgrades.push(best)
        tempCurrentLevels[best.bondType] = best.newLevel
        remainingAffinity -= best.cost
        canAffordMore = true
      }
    }
    
    return appliedUpgrades
  }

  // Calculate suggested upgrades for display (doesn't apply them)
  // ONLY suggests upgrades for main attributes, but all inputs are enabled
  const calculateSuggestedUpgrades = (bondKey: string, availableAffinity: number) => {
    const [lover, warden] = bondKey.split("-")
    const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
    const currentBond = scarletBond[bondKey] || {}
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    
    if (!wardenData || !bondData) {
      return {}
    }
    
    // Get bond types for optimization - ONLY MAIN ATTRIBUTES
    const bondTypes = []
    wardenData.forEach(attr => {
      if (attr.toLowerCase() !== 'balance') {
        bondTypes.push(`${attr.toLowerCase()}Level`)
        bondTypes.push(`${attr.toLowerCase()}Percent`)
      }
    })
    
    // If warden has "All" type, add all attributes
    if (wardenData.some(attr => attr === 'All')) {
      bondTypes.push('strengthLevel', 'strengthPercent', 'allureLevel', 'allurePercent', 
                    'intellectLevel', 'intellectPercent', 'spiritLevel', 'spiritPercent')
    }
    
    // Calculate cost for each possible upgrade (use per-level cost by differencing cumulative data)
    const upgrades = []
    bondTypes.forEach(bondType => {
      const currentLevel = currentBond[bondType] || 0
      if (currentLevel < 205) {
        const nextLevel = currentLevel + 1
        const levelData = scarletBondLevels.find(l => l.level === nextLevel)

        if (levelData) {
          let cost = 0
          // Since data is non-cumulative, use the affinity value directly
          if (bondData.type === 'All') {
            cost = levelData.all_affinity || 0
          } else if (bondData.type === 'Dual') {
            cost = levelData.dual_affinity || 0
          } else if (bondData.type === 'Single') {
            cost = levelData.affinity || 0
          } else {
            cost = levelData.affinity || 0
          }
          
          if (cost >= 0) { // Allow free upgrades (cost = 0)
            upgrades.push({
              bondType,
              currentLevel,
              newLevel: nextLevel,
              cost,
              domGain: calculateBondDomGain(bondType, currentLevel, nextLevel, bondKey)
            })
          }
        }
      }
    })
    
    // Sort by DOM gain per cost (efficiency)
    upgrades.sort((a, b) => {
      if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
      if (a.cost === 0) return -1
      if (b.cost === 0) return 1
      return (b.domGain / b.cost) - (a.domGain / a.cost)
    })
    
    // Find optimal upgrades within affinity budget - allow multiple levels per attribute
    const suggestedUpgrades = {}
    let remainingAffinity = availableAffinity
    
    // Create a map to track current levels for each bond type
    const tempCurrentLevels = {}
    bondTypes.forEach(bondType => {
      tempCurrentLevels[bondType] = currentBond[bondType] || 0
    })
    
    // Keep upgrading until we run out of affinity
    let canAffordMore = true
    while (canAffordMore && remainingAffinity > 0) {
      canAffordMore = false
      
      // Recalculate upgrades based on current temp levels
      const availableUpgrades = []
      bondTypes.forEach(bondType => {
        const tempCurrentLevel = tempCurrentLevels[bondType]
        if (tempCurrentLevel < 205) {
          const nextLevel = tempCurrentLevel + 1
          const levelData = scarletBondLevels.find(l => l.level === nextLevel)

          if (levelData) {
            let cost = 0
            // Since data is non-cumulative, use the affinity value directly
            if (bondData.type === 'All') {
              cost = levelData.all_affinity || 0
            } else if (bondData.type === 'Dual') {
              cost = levelData.dual_affinity || 0
            } else if (bondData.type === 'Single') {
              cost = levelData.affinity || 0
            } else {
              cost = levelData.affinity || 0
            }
            
            if (cost >= 0 && remainingAffinity >= cost) {
              const domGain = calculateBondDomGain(bondType, tempCurrentLevel, nextLevel, bondKey)
              availableUpgrades.push({
                bondType,
                currentLevel: tempCurrentLevel,
                newLevel: nextLevel,
                cost,
                domGain,
                efficiency: cost === 0 ? Infinity : domGain / cost
              })
            }
          }
        }
      })
      
      // Sort by efficiency (DOM gain per cost)
      availableUpgrades.sort((a, b) => {
        if (a.cost === 0 && b.cost === 0) return b.domGain - a.domGain
        if (a.cost === 0) return -1
        if (b.cost === 0) return 1
        return b.efficiency - a.efficiency
      })
      
      // Apply the best upgrade if we can afford it
      if (availableUpgrades.length > 0 && remainingAffinity >= availableUpgrades[0].cost) {
        const bestUpgrade = availableUpgrades[0]
        
        // Update or create the suggested upgrade entry
        if (!suggestedUpgrades[bestUpgrade.bondType]) {
          suggestedUpgrades[bestUpgrade.bondType] = {
            increase: 0,
            newLevel: currentBond[bestUpgrade.bondType] || 0,
            cost: 0,
            domGain: 0
          }
        }
        
        // Add this upgrade to the suggestion
        suggestedUpgrades[bestUpgrade.bondType].increase += 1
        suggestedUpgrades[bestUpgrade.bondType].newLevel = bestUpgrade.newLevel
        suggestedUpgrades[bestUpgrade.bondType].cost += bestUpgrade.cost
        suggestedUpgrades[bestUpgrade.bondType].domGain += bestUpgrade.domGain
        
        // Update temp levels and remaining affinity
        tempCurrentLevels[bestUpgrade.bondType] = bestUpgrade.newLevel
        remainingAffinity -= bestUpgrade.cost
        canAffordMore = true
      }
    }
    
    return suggestedUpgrades
  }
  
  // Calculate DOM gain for a bond upgrade
  const calculateBondDomGain = (bondType: string, currentLevel: number, newLevel: number, bondKey: string) => {
    const attr = bondType.replace('Level', '').replace('Percent', '')
    const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
    const [_, warden] = bondKey.split("-")
    const wardenData = wardenAttributes[warden as keyof typeof wardenAttributes]
    const mainAttrs = new Set<string>()
    wardenData?.forEach(a => { if (a.toLowerCase() !== 'balance') mainAttrs.add(a.toLowerCase()) })
    
    if (bondType.endsWith('Level')) {
      // Flat bonus - use correct bonus column based on bond type
      const currentData = scarletBondLevels.find(l => l.level === currentLevel)
      const newData = scarletBondLevels.find(l => l.level === newLevel)
      
      let currentBonus = 0
      let newBonus = 0
      
      if (!mainAttrs.has(attr)) {
        // Off attribute uses off-table single values
        currentBonus = getOffSingle(currentLevel)
        newBonus = getOffSingle(newLevel)
      } else if (bondData?.type === 'All') {
        currentBonus = currentData?.all || 0
        newBonus = newData?.all || 0
      } else if (bondData?.type === 'Dual') {
        currentBonus = currentData?.dual || 0
        newBonus = newData?.dual || 0
      } else if (bondData?.type === 'Single') {
        currentBonus = currentData?.single || 0
        newBonus = newData?.single || 0
      } else {
        currentBonus = currentData?.single || 0
        newBonus = newData?.single || 0
      }
      
      return newBonus - currentBonus
    } else if (bondType.endsWith('Percent')) {
      // Percentage bonus - calculate based on the flat bonus amount
      const currentBond = scarletBond[bondKey] || {}
      const flatLevel = currentBond[`${attr}Level`] || 0
      const flatData = scarletBondLevels.find(l => l.level === flatLevel)
      
      let flatBonus = 0
      if (!mainAttrs.has(attr)) {
        flatBonus = getOffSingle(flatLevel)
      } else if (bondData?.type === 'All') {
        flatBonus = flatData?.all || 0
      } else if (bondData?.type === 'Dual') {
        flatBonus = flatData?.dual || 0
      } else {
        flatBonus = flatData?.single || 0
      }
      
      const currentPercentBonus = currentLevel * (flatBonus / 100)
      const newPercentBonus = newLevel * (flatBonus / 100)
      return newPercentBonus - currentPercentBonus
    }
    
    return 0
  }
  
  // Apply optimal upgrades to a bond
  const applyOptimalUpgrades = (bondKey: string) => {
    const availableAffinity = scarletBondAffinity[bondKey] || 0
    
    const optimalUpgrades = calculateOptimalBondUpgrades(bondKey, availableAffinity)
    
    if (!optimalUpgrades || optimalUpgrades.length === 0) {
      return
    }
    
    // Only update the optimized levels, not the manual input
    const newOptimizedBond = { ...optimizedBondLevels[bondKey] }
    let totalCost = 0
    
    optimalUpgrades.forEach(upgrade => {
      newOptimizedBond[upgrade.bondType] = upgrade.newLevel
      totalCost += upgrade.cost
    })
    
    setOptimizedBondLevels(prev => ({
      ...prev,
      [bondKey]: newOptimizedBond
    }))
    
    setScarletBondAffinity(prev => ({
      ...prev,
      [bondKey]: Math.max(0, (prev[bondKey] || 0) - totalCost)
    }))
  }

  // Calculate courtyard DOM contribution
  const calculateCourtyardDom = () => {
    let strength = 0
    let allure = 0
    let intellect = 0
    let spirit = 0

    // Calculate DOM from current level to projected level
    for (let level = courtyard.currentLevel; level < projectedLevel; level++) {
      // Determine level type and attribute distribution based on level number
      let levelType = "single"
      let targetAttributes: string[] = []
      
      if (level % 7 === 0) {
        // All levels (7, 14, 21, etc.)
        levelType = "all"
        targetAttributes = ["strength", "allure", "intellect", "spirit"]
      } else if (level % 7 === 5 || level % 7 === 6) {
        // Dual levels (5, 6, 12, 13, 19, 20, etc.)
        levelType = "dual"
        if (level % 7 === 5) {
          targetAttributes = ["strength", "intellect"]
        } else {
          targetAttributes = ["allure", "spirit"]
        }
      } else {
        // Single levels (1, 2, 3, 4, 8, 9, 10, 11, etc.)
        levelType = "single"
        const singleLevel = level % 7
        if (singleLevel === 1) targetAttributes = ["strength"]
        else if (singleLevel === 2) targetAttributes = ["allure"]
        else if (singleLevel === 3) targetAttributes = ["intellect"]
        else if (singleLevel === 4) targetAttributes = ["spirit"]
      }

      // Get points for this level (simplified - you'll need the full array)
      let points = 500 // Base points for single levels
      if (levelType === "dual") points = 1000 // x2 for dual
      if (levelType === "all") points = 4000 // x4 for all

      // Apply points to target attributes
      targetAttributes.forEach(attr => {
        if (attr === "strength") strength += points
        if (attr === "allure") allure += points
        if (attr === "intellect") intellect += points
        if (attr === "spirit") spirit += points
      })
    }

    return { strength, allure, intellect, spirit }
  }

  // Calculate conclave seal upgrade bonuses with optimal allocation
  const calculateConclaveUpgrades = () => {
    const sealTypes = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"] as const
    const availableSeals = conclaveUpgrade.savedSeals
    
    // Get all selected seals
    const selectedSeals = sealTypes.filter(sealType => conclaveUpgrade.upgradeSeals[sealType])
    
    if (selectedSeals.length === 0 || availableSeals === 0) {
      return {
        totalCost: 0,
        wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
        bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 },
        upgrades: [] as any[]
      }
    }

    // Calculate warden counts for DOM efficiency calculation
    const allWardens = [
      ...wardenGroups.circus,
      ...wardenGroups.tyrants,
      ...wardenGroups.noir,
      ...wardenGroups.hunt
    ]
    
    const wardenCounts = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
    allWardens.forEach(warden => {
      if (warden.attributes.includes("Strength")) wardenCounts.strength++
      if (warden.attributes.includes("Allure")) wardenCounts.allure++
      if (warden.attributes.includes("Intellect")) wardenCounts.intellect++
      if (warden.attributes.includes("Spirit")) wardenCounts.spirit++
      if (warden.attributes.includes("Balance")) {
        wardenCounts.strength++
        wardenCounts.allure++
        wardenCounts.intellect++
        wardenCounts.spirit++
      }
    })

    // Calculate book values for DOM efficiency calculation
    const bookValues = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
    Object.entries(books).forEach(([category, bookCollection]) => {
      Object.entries(bookCollection).forEach(([bookName, count]) => {
        const categoryBonuses = bookBonuses[category as keyof typeof bookBonuses]
        const bookBonus = categoryBonuses ? categoryBonuses[bookName as keyof typeof categoryBonuses] || 0 : 0
        const baseBonus = (count as number) * bookBonus
        
        if (category === "Strength" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          bookValues.strength += baseBonus
        }
        if (category === "Allure" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          bookValues.allure += baseBonus
        }
        if (category === "Intellect" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          bookValues.intellect += baseBonus
        }
        if (category === "Spirit" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          bookValues.spirit += baseBonus
        }
      })
    })

    // Create upgrade options for each seal
    const upgradeOptions: any[] = []
    
    selectedSeals.forEach(sealType => {
      const currentLevel = conclave[sealType]
      const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof wardenCounts
      
      // Generate all possible upgrade levels for this seal
      for (let targetLevel = currentLevel + 1; targetLevel <= conclaveLevels.length && targetLevel <= currentLevel + 20; targetLevel++) {
        let totalCost = 0
        let wardenBonus = 0
        let bookMultiplier = 0
        
        // Calculate cost and bonuses for this upgrade
        for (let level = currentLevel + 1; level <= targetLevel; level++) {
          const levelData = conclaveLevels[level - 1]
          if (!levelData) break
          
          // Cost is cumulative from current to target level
          totalCost += levelData.cost
          wardenBonus += levelData.warden
          bookMultiplier += levelData.books
        }
        
        if (totalCost <= availableSeals) {
          // Calculate DOM efficiency (DOM gained per seal spent)
          const wardenDomGain = wardenBonus * wardenCounts[attribute]
          const bookDomGain = (bookValues[attribute] * bookMultiplier) / 100
          const totalDomGain = wardenDomGain + bookDomGain
          const efficiency = totalCost > 0 ? totalDomGain / totalCost : 0
          
          upgradeOptions.push({
            sealType,
            attribute,
            currentLevel,
            targetLevel,
            cost: totalCost,
            wardenBonus,
            bookMultiplier,
            domGain: totalDomGain,
            efficiency
          })
        }
      }
    })

    // Sort by efficiency (DOM per seal) descending
    upgradeOptions.sort((a, b) => b.efficiency - a.efficiency)

    // Select the most efficient upgrades
    const selectedUpgrades: any[] = []
    let remainingSeals = availableSeals

    if (selectedSeals.length === 1) {
      // For single seal, keep upgrading until we run out of seals
      const sealType = selectedSeals[0]
      let currentLevel = conclave[sealType]
      
      // Keep upgrading one level at a time until we can't afford the next level
      while (currentLevel < conclaveLevels.length) {
        const nextLevel = currentLevel + 1
        const levelData = conclaveLevels[nextLevel - 1]
        if (!levelData || levelData.cost > remainingSeals) break
        
        const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof wardenCounts
        const wardenDomGain = levelData.warden * wardenCounts[attribute]
        const bookDomGain = (bookValues[attribute] * levelData.books) / 100
        const totalDomGain = wardenDomGain + bookDomGain
        const efficiency = levelData.cost > 0 ? totalDomGain / levelData.cost : 0
        
        selectedUpgrades.push({
          sealType,
          attribute,
          currentLevel,
          targetLevel: nextLevel,
          cost: levelData.cost,
          wardenBonus: levelData.warden,
          bookMultiplier: levelData.books,
          domGain: totalDomGain,
          efficiency
        })
        
        remainingSeals -= levelData.cost
        currentLevel = nextLevel
      }
    } else {
      // For multiple seals, use greedy approach but allow each seal to be upgraded once
      const usedSeals = new Set<string>()
      
      for (const option of upgradeOptions) {
        // Skip if we already upgraded this seal or don't have enough seals
        if (usedSeals.has(option.sealType) || option.cost > remainingSeals) continue
        
        selectedUpgrades.push(option)
        remainingSeals -= option.cost
        usedSeals.add(option.sealType)
      }
    }

    // Compile results
    const results = {
      totalCost: availableSeals - remainingSeals,
      wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
      bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 },
      upgrades: selectedUpgrades.map(upgrade => ({
        sealType: upgrade.sealType,
        currentLevel: upgrade.currentLevel,
        targetLevel: upgrade.targetLevel,
        cost: upgrade.cost,
        wardenBonus: upgrade.wardenBonus,
        bookMultiplier: upgrade.bookMultiplier,
        domGain: upgrade.domGain,
        efficiency: upgrade.efficiency
      }))
    }

          // Calculate total bonuses
    selectedUpgrades.forEach(upgrade => {
      results.wardenBonuses[upgrade.attribute] = upgrade.wardenBonus
              results.bookMultipliers[upgrade.attribute] = upgrade.bookMultiplier
    })

    return results
  }

  // Calculate total conclave bonuses (current + potential upgrades)
  const calculateTotalConclaveBonus = () => {
    const sealTypes = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"] as const
    const currentBonuses = {
      wardenBonuses: { strength: 0, allure: 0, intellect: 0, spirit: 0 },
      bookMultipliers: { strength: 1, allure: 1, intellect: 1, spirit: 1 }
    }

    // Calculate current bonuses from existing seal levels
    sealTypes.forEach(sealType => {
      const currentLevel = conclave[sealType]
      const attribute = sealType.split(" ")[2].toLowerCase() as keyof typeof currentBonuses.wardenBonuses
      
      let wardenBonus = 0
      let bookMultiplier = 0

      // Sum all bonuses from level 1 to current level
      for (let level = 1; level <= currentLevel; level++) {
        const levelData = conclaveLevels[level - 1] // levels are 1-indexed in data
        if (levelData) {
          wardenBonus += levelData.warden
          bookMultiplier += levelData.books
        }
      }

      currentBonuses.wardenBonuses[attribute] = wardenBonus
      currentBonuses.bookMultipliers[attribute] = bookMultiplier
    })

    return currentBonuses
  }

  // Calculate dynamic lover aura levels
  const calculateLoverAuraLevels = () => {
    // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
    const loverAuras = JSON.parse(JSON.stringify(auras.lovers))
    
    Object.entries(loverAuras).forEach(([loverName, loverData]) => {
      let shouldHave = false
      switch (loverName) {
        case "Agneyi":
          shouldHave = hasAgneyi
          break
        case "Culann":
          shouldHave = hasCulann
          break
        case "Hela":
          shouldHave = hasHela
          break
      }
      
      if (shouldHave && loverCount > 0) {
        // Base 20% + 5% for each additional lover beyond the first
        if (loverCount === 1) {
          loverAuras[loverName].current = 20
        } else if (loverCount === 2) {
          loverAuras[loverName].current = 25
        } else if (loverCount === 3) {
          loverAuras[loverName].current = 30
        }
      } else {
        loverAuras[loverName].current = 0
      }
    })
    
    return loverAuras
  }

  // Calculate dynamic aura levels based on selected wardens
  const calculateDynamicAuraLevels = () => {
    const dynamicAuras = JSON.parse(JSON.stringify(auras)) // Deep clone
    
    // Add lover auras
    dynamicAuras.lovers = calculateLoverAuraLevels()
    
    // Wild Hunt Wardens - start at 9, add 1 for each additional warden
    const selectedWildHunt = selectedWardens.hunt || []
    const wildHuntCount = selectedWildHunt.length
    const wildHuntBaseLevel = wildHuntCount > 0 ? 9 : 0
    const wildHuntBonus = Math.max(0, wildHuntCount - 1)
    
    const wildHuntNames = ["Rudra", "Woden", "Artemis", "Finn"]
    wildHuntNames.forEach(name => {
      if (selectedWildHunt.includes(name)) {
        dynamicAuras.wildHunt[name].current = wildHuntBaseLevel + wildHuntBonus
      } else {
        dynamicAuras.wildHunt[name].current = 0
      }
    })
    
    // Monster Noir Wardens - start at 9, add 1 for each additional warden
    const selectedMonsterNoir = selectedWardens.noir || []
    const monsterNoirCount = selectedMonsterNoir.length
    const monsterNoirBaseLevel = monsterNoirCount > 0 ? 9 : 0
    const monsterNoirBonus = Math.max(0, monsterNoirCount - 1)
    
    const monsterNoirNames = ["Eddie", "Scarlet", "Sam", "Grendel"]
    monsterNoirNames.forEach(name => {
      if (selectedMonsterNoir.includes(name)) {
        dynamicAuras.monsterNoir[name].current = monsterNoirBaseLevel + monsterNoirBonus
      } else {
        dynamicAuras.monsterNoir[name].current = 0
      }
    })
    
    // Bloody Tyrants Wardens - start at 10, add 1 for each additional warden
    const selectedBloodyTyrants = selectedWardens.tyrants || []
    const bloodyTyrantsCount = selectedBloodyTyrants.length
    const bloodyTyrantsBaseLevel = bloodyTyrantsCount > 0 ? 10 : 0
    const bloodyTyrantsBonus = Math.max(0, bloodyTyrantsCount - 1)
    
    const bloodyTyrantsNames = ["Max", "Erzsebet", "Ivan", "Maria"]
    bloodyTyrantsNames.forEach(name => {
      if (selectedBloodyTyrants.includes(name)) {
        if (name === "Maria") {
          // Maria starts at 5, adds 0.5 for each additional warden
          dynamicAuras.bloodyTyrants[name].current = bloodyTyrantsCount > 0 ? 5 + (bloodyTyrantsBonus * 0.5) : 0
        } else {
          dynamicAuras.bloodyTyrants[name].current = bloodyTyrantsBaseLevel + bloodyTyrantsBonus
        }
      } else {
        dynamicAuras.bloodyTyrants[name].current = 0
      }
    })
    
    // Cirque du Macabre Wardens - start at 10, add 1 for each additional warden
    const selectedCircus = selectedWardens.circus || []
    const circusCount = selectedCircus.length
    const circusBaseLevel = circusCount > 0 ? 10 : 0
    const circusBonus = Math.max(0, circusCount - 1)
    
    const circusNames = ["Thorgrim", "Naja", "Diavolo", "Jester", "Dominique"]
    circusNames.forEach(name => {
      if (selectedCircus.includes(name)) {
        if (name === "Dominique") {
          // Dominique starts at 5, adds 0.5 for each additional warden
          dynamicAuras.cirque[name].current = circusCount > 0 ? 5 + (circusBonus * 0.5) : 0
        } else {
          dynamicAuras.cirque[name].current = circusBaseLevel + circusBonus
        }
      } else {
        dynamicAuras.cirque[name].current = 0
      }
    })
    
    return dynamicAuras
  }

  // Calculate aura bonuses
  const calculateAuraBonuses = () => {
    const dynamicAuras = calculateDynamicAuraLevels()
    const bonuses = {
      talents: {
        strength: 100, // Base 100%
        allure: 100,
        intellect: 100,
        spirit: 100,
        all: 100
      },
      books: {
        strength: 100, // Base 100%
        allure: 100,
        intellect: 100,
        spirit: 100,
        all: 100
      }
    }

    // Wild Hunt Wardens - Talent bonuses
    const wildHuntWardens = dynamicAuras.wildHunt
    Object.entries(wildHuntWardens).forEach(([wardenName, wardenData]) => {
      const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
      
      switch (wardenName) {
        case "Rudra":
          bonuses.talents.strength += currentBonus
          break
        case "Woden":
          bonuses.talents.allure += currentBonus
          break
        case "Artemis":
          bonuses.talents.intellect += currentBonus
          break
        case "Finn":
          bonuses.talents.spirit += currentBonus
          break
      }
    })

    // Monster Noir Wardens - Book bonuses
    const monsterNoirWardens = dynamicAuras.monsterNoir
    Object.entries(monsterNoirWardens).forEach(([wardenName, wardenData]) => {
      const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
      
      switch (wardenName) {
        case "Eddie":
          bonuses.books.strength += currentBonus
          break
        case "Scarlet":
          bonuses.books.allure += currentBonus
          break
        case "Sam":
          bonuses.books.intellect += currentBonus
          break
        case "Grendel":
          bonuses.books.spirit += currentBonus
          break
      }
    })

    // Bloody Tyrants Wardens - Dual book bonuses
    const bloodyTyrantsWardens = dynamicAuras.bloodyTyrants
    Object.entries(bloodyTyrantsWardens).forEach(([wardenName, wardenData]) => {
      const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
      
      switch (wardenName) {
        case "Max": // Strength/Spirit Books
          bonuses.books.strength += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Erzsebet": // Allure/Intellect Books
          bonuses.books.allure += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Ivan": // Allure/Spirit Books
          bonuses.books.allure += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Maria": // All Talent
          bonuses.talents.all += currentBonus
          break
      }
    })

    // Cirque du Macabre Wardens - Dual book bonuses
    const cirqueWardens = dynamicAuras.cirque
    Object.entries(cirqueWardens).forEach(([wardenName, wardenData]) => {
      const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
      
      switch (wardenName) {
        case "Thorgrim": // Strength/Intellect Books
          bonuses.books.strength += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Naja": // Allure/Spirit Books
          bonuses.books.allure += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Diavolo": // Strength/Spirit Books
          bonuses.books.strength += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Jester": // Allure/Intellect Books
          bonuses.books.allure += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Dominique": // All Books
          bonuses.books.all += currentBonus
          break
      }
    })

    // Secondary Auras - upgradeable skills (0-20 levels, 1% per level)
    if (auras.secondaryAuras) {
      // Wild Hunt Secondary Auras - Talent bonuses
      Object.entries(auras.secondaryAuras.wildHunt).forEach(([wardenName, wardenData]) => {
        const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
        
        switch (wardenName) {
          case "Rudra":
            bonuses.talents.strength += currentBonus
            break
          case "Woden":
            bonuses.talents.allure += currentBonus
            break
          case "Artemis":
            bonuses.talents.intellect += currentBonus
            break
          case "Finn":
            bonuses.talents.spirit += currentBonus
            break
        }
      })

      // Monster Noir Secondary Auras - Book bonuses
      Object.entries(auras.secondaryAuras.monsterNoir).forEach(([wardenName, wardenData]) => {
        const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
        
        switch (wardenName) {
          case "Eddie":
            bonuses.books.strength += currentBonus
            break
          case "Scarlet":
            bonuses.books.allure += currentBonus
            break
          case "Sam":
            bonuses.books.intellect += currentBonus
            break
          case "Grendel":
            bonuses.books.spirit += currentBonus
            break
        }
      })

      // Bloody Tyrants Secondary Auras - Dual book bonuses
      Object.entries(auras.secondaryAuras.bloodyTyrants).forEach(([wardenName, wardenData]) => {
        const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
        
        switch (wardenName) {
          case "Max": // Strength/Spirit Books
            bonuses.books.strength += currentBonus
            bonuses.books.spirit += currentBonus
            break
          case "Erzsebet": // Allure/Intellect Books
            bonuses.books.allure += currentBonus
            bonuses.books.intellect += currentBonus
            break
          case "Ivan": // Allure/Spirit Books
            bonuses.books.allure += currentBonus
            bonuses.books.spirit += currentBonus
            break
          case "Maria": // All Talent
            bonuses.talents.all += currentBonus
            break
        }
      })

      // Cirque Secondary Auras - Dual book bonuses
      Object.entries(auras.secondaryAuras.cirque).forEach(([wardenName, wardenData]) => {
        const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
        
        switch (wardenName) {
          case "Thorgrim": // Strength/Intellect Books
            bonuses.books.strength += currentBonus
            bonuses.books.intellect += currentBonus
            break
          case "Naja": // Allure/Spirit Books
            bonuses.books.allure += currentBonus
            bonuses.books.spirit += currentBonus
            break
          case "Diavolo": // Strength/Spirit Books
            bonuses.books.strength += currentBonus
            bonuses.books.spirit += currentBonus
            break
          case "Jester": // Allure/Intellect Books
            bonuses.books.allure += currentBonus
            bonuses.books.intellect += currentBonus
            break
          case "Dominique": // All Books
            bonuses.books.all += currentBonus
            break
        }
      })
    }

    // VIP Wardens
    const vipWardens = auras.vip
    Object.entries(vipWardens).forEach(([wardenName, wardenData]) => {
      if (vipLevel >= wardenData.vipRequired) {
        if (wardenData.talents && wardenData.books) {
          // Multi-bonus wardens (Poe, Damian, Vance, Diana)
          switch (wardenName) {
            case "Poe":
              bonuses.talents.all += wardenData.talents.current
              bonuses.books.all += wardenData.books.current
              break
            case "Damian":
              bonuses.talents.all += wardenData.talents.current
              bonuses.books.all += wardenData.books.current
              break
            case "Vance":
              bonuses.talents.all += wardenData.talents.current
              bonuses.books.all += wardenData.books.current
              break
            case "Diana":
              bonuses.talents.all += wardenData.talents.current
              bonuses.books.all += wardenData.books.current
              break
          }
        } else {
          // Single bonus wardens
          switch (wardenName) {
            case "Tomas": // Strength/Intellect Talent
              bonuses.talents.strength += wardenData.current
              bonuses.talents.intellect += wardenData.current
              break
            case "Cleo": // Allure/Spirit Talent
              bonuses.talents.allure += wardenData.current
              bonuses.talents.spirit += wardenData.current
              break
            case "Aurelia": // Strength/Spirit Talent
              bonuses.talents.strength += wardenData.current
              bonuses.talents.spirit += wardenData.current
              break
            case "William": // Allure/Intellect Talent
              bonuses.talents.allure += wardenData.current
              bonuses.talents.intellect += wardenData.current
              break
          }
        }
      }
    })

    // Paid Pack Wardens
    if (hasVictor) {
      bonuses.talents.strength += auras.paidPacks.Victor.current
    }
    if (hasFrederick) {
      bonuses.talents.allure += auras.paidPacks.Frederick.talents.current
      const frederickBooksBonus = auras.paidPacks.Frederick.books.baseValue + 
        (auras.paidPacks.Frederick.books.current - 1) * auras.paidPacks.Frederick.books.increment
      bonuses.books.allure += frederickBooksBonus
    }

    // Special Wardens
    if (hasDracula) {
      bonuses.talents.all += auras.special.Dracula.talents.current
      bonuses.books.all += auras.special.Dracula.books.current
    }
    if (hasNyx) {
      bonuses.talents.all += auras.special.Nyx.talents.current
      bonuses.books.all += auras.special.Nyx.books.current
    }

    // Apply "All" bonuses to individual attributes
    const finalBonuses = {
      talents: {
        strength: bonuses.talents.strength + bonuses.talents.all - 100, // Subtract 100 since we already added it to base
        allure: bonuses.talents.allure + bonuses.talents.all - 100,
        intellect: bonuses.talents.intellect + bonuses.talents.all - 100,
        spirit: bonuses.talents.spirit + bonuses.talents.all - 100
      },
      books: {
        strength: bonuses.books.strength + bonuses.books.all - 100,
        allure: bonuses.books.allure + bonuses.books.all - 100,
        intellect: bonuses.books.intellect + bonuses.books.all - 100,
        spirit: bonuses.books.spirit + bonuses.books.all - 100
      }
    }

    return finalBonuses
  }

  // Calculate totals
  const calculateTotals = () => {
    let totalStrength = baseAttributes.strength
    let totalAllure = baseAttributes.allure
    let totalIntellect = baseAttributes.intellect
    let totalSpirit = baseAttributes.spirit

    // Get current conclave bonuses
    const conclaveBonus = calculateTotalConclaveBonus()

    // Add book bonuses with conclave multipliers
    Object.entries(books).forEach(([category, bookCollection]) => {
      Object.entries(bookCollection).forEach(([bookName, count]) => {
        const categoryBonuses = bookBonuses[category as keyof typeof bookBonuses]
        const bookBonus = categoryBonuses ? categoryBonuses[bookName as keyof typeof categoryBonuses] || 0 : 0
        const baseBonus = (count as number) * bookBonus
        
        if (category === "Strength" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana") 
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.strength
          totalStrength += baseBonus * (multiplier / 100)
        }
        if (category === "Allure" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.allure
          totalAllure += baseBonus * (multiplier / 100)
        }
        if (category === "Intellect" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.intellect
          totalIntellect += baseBonus * (multiplier / 100)
        }
        if (category === "Spirit" || bookName.includes("Encyclopedia") || bookName.includes("Arcana")) {
          const multiplier = bookName.includes("Encyclopedia") || bookName.includes("Arcana")
            ? Math.max(conclaveBonus.bookMultipliers.strength, conclaveBonus.bookMultipliers.allure, conclaveBonus.bookMultipliers.intellect, conclaveBonus.bookMultipliers.spirit)
            : conclaveBonus.bookMultipliers.spirit
          totalSpirit += baseBonus * (multiplier / 100)
        }
      })
    })

    // NOTE: Current conclave levels should already be included in base attributes
    // We don't add them here to avoid double counting

    // Add conclave warden bonuses
    const allWardens = [
      ...wardenGroups.circus,
      ...wardenGroups.tyrants,
      ...wardenGroups.noir,
      ...wardenGroups.hunt
    ]
    
    // Count wardens by attribute and multiply by conclave bonus
    const wardenCounts = { strength: 0, allure: 0, intellect: 0, spirit: 0 }
    allWardens.forEach(warden => {
      if (warden.attributes.includes("Strength")) wardenCounts.strength++
      if (warden.attributes.includes("Allure")) wardenCounts.allure++
      if (warden.attributes.includes("Intellect")) wardenCounts.intellect++
      if (warden.attributes.includes("Spirit")) wardenCounts.spirit++
    })

    totalStrength += wardenCounts.strength * conclaveBonus.wardenBonuses.strength
    totalAllure += wardenCounts.allure * conclaveBonus.wardenBonuses.allure
    totalIntellect += wardenCounts.intellect * conclaveBonus.wardenBonuses.intellect
    totalSpirit += wardenCounts.spirit * conclaveBonus.wardenBonuses.spirit

    // Add warden stat bonuses
    Object.values(wardenStats).forEach((stats: any) => {
      if (stats) {
        totalStrength += stats.strength || 0
        totalAllure += stats.allure || 0
        totalIntellect += stats.intellect || 0
        totalSpirit += stats.spirit || 0
      }
    })

    // Add scarlet bond bonuses
    Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
      if (bond) {
        // Find the warden for this bond
        const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
        if (bondData) {
          const wardenAttrs = wardenAttributes[bondData.warden as keyof typeof wardenAttributes] || []
          
          // Only use optimized levels for DOM calculation, ignore current manual levels
          const optimizedBond = optimizedBondLevels[bondKey]
          
          // Only calculate bonuses if there are optimized levels (skip if no optimization)
          if (!optimizedBond) return
          
          // Calculate flat bonuses for each attribute
          if (optimizedBond.strengthLevel && optimizedBond.strengthLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === optimizedBond.strengthLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              totalStrength += flatBonus
            }
          }
          
          if (optimizedBond.strengthPercent && optimizedBond.strengthPercent > 0) {
            // Calculate percentage bonus based on the flat bonus amount
            const flatLevelData = scarletBondLevels.find(l => l.level === (optimizedBond.strengthLevel || 0))
            if (flatLevelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = flatLevelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = flatLevelData.dual || 0
              } else {
                flatBonus = flatLevelData.single || 0
              }
              const percentBonus = ((optimizedBond.strengthPercent || 0)/100) * flatBonus
              totalStrength += percentBonus
            }
          }
          
          if (optimizedBond.allureLevel && optimizedBond.allureLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === optimizedBond.allureLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              totalAllure += flatBonus
            }
          }
          
          if (optimizedBond.allurePercent && optimizedBond.allurePercent > 0) {
            // Calculate percentage bonus based on the flat bonus amount
            const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.allureLevel || 0))
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              const percentBonus = ((optimizedBond.allurePercent || 0)/100) * flatBonus
              totalAllure += percentBonus
            }
          }
          
          if (optimizedBond.intellectLevel && optimizedBond.intellectLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === optimizedBond.intellectLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              totalIntellect += flatBonus
            }
          }
          
          if (optimizedBond.intellectPercent && optimizedBond.intellectPercent > 0) {
            // Calculate percentage bonus based on the flat bonus amount
            const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.intellectLevel || 0))
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              const percentBonus = ((optimizedBond.intellectPercent || 0)/100) * flatBonus
              totalIntellect += percentBonus
            }
          }
          
          if (optimizedBond.spiritLevel && optimizedBond.spiritLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === optimizedBond.spiritLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              totalSpirit += flatBonus
            }
          }
          
          if (optimizedBond.spiritPercent && optimizedBond.spiritPercent > 0) {
            // Calculate percentage bonus based on the flat bonus amount
            const levelData = scarletBondLevels.find(l => l.level === (optimizedBond.spiritLevel || 0))
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              const percentBonus = ((optimizedBond.spiritPercent || 0)/100) * flatBonus
              totalSpirit += percentBonus
            }
          }
        }
      }
    })

    // Apply lover aura bonuses to scarlet bond bonuses
    const dynamicAuras = calculateDynamicAuraLevels()
    if (dynamicAuras.lovers) {
      Object.entries(dynamicAuras.lovers).forEach(([loverName, loverData]) => {
        const multiplier = loverData.current / 100
        
        if (multiplier > 0) {
          // Apply lover aura bonuses to ALL scarlet bond bonuses for that attribute
          switch (loverName) {
            case "Agneyi": // Strength
              // Find all strength bonuses from scarlet bonds and multiply by aura
              Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
                if (bond) {
                  const optimizedBond = optimizedBondLevels[bondKey] || bond
                  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
                  if (bondData && optimizedBond.strengthLevel) {
                    const levelData = scarletBondLevels.find(l => l.level === optimizedBond.strengthLevel)
                    if (levelData) {
                      let flatBonus = 0
                      if (bondData.type === 'All') {
                        flatBonus = levelData.all || 0
                      } else if (bondData.type === 'Dual') {
                        flatBonus = levelData.dual || 0
                      } else {
                        flatBonus = levelData.single || 0
                      }
                      totalStrength += flatBonus * multiplier
                    }
                  }
                }
              })
              break
            case "Culann": // Intellect
              Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
                if (bond) {
                  const optimizedBond = optimizedBondLevels[bondKey] || bond
                  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
                  if (bondData && optimizedBond.intellectLevel) {
                    const levelData = scarletBondLevels.find(l => l.level === optimizedBond.intellectLevel)
                    if (levelData) {
                      let flatBonus = 0
                      if (bondData.type === 'All') {
                        flatBonus = levelData.all || 0
                      } else if (bondData.type === 'Dual') {
                        flatBonus = levelData.dual || 0
                      } else {
                        flatBonus = levelData.single || 0
                      }
                      totalIntellect += flatBonus * multiplier
                    }
                  }
                }
              })
              break
            case "Hela": // Spirit
              Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
                if (bond) {
                  const optimizedBond = optimizedBondLevels[bondKey] || bond
                  const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
                  if (bondData && optimizedBond.spiritLevel) {
                    const levelData = scarletBondLevels.find(l => l.level === optimizedBond.spiritLevel)
                    if (levelData) {
                      let flatBonus = 0
                      if (bondData.type === 'All') {
                        flatBonus = levelData.all || 0
                      } else if (bondData.type === 'Dual') {
                        flatBonus = levelData.dual || 0
                      } else {
                        flatBonus = levelData.single || 0
                      }
                      totalSpirit += flatBonus * multiplier
                    }
                  }
                }
              })
              break
          }
        }
      })
    }

    // Add talent script bonuses
    const calculateScriptResults = (script) => {
      if (script.selectedStar === 0 || script.quantity === 0) {
        return 0;
      }
      
      const successRates = [1.0, 0.833, 0.666, 0.5, 0.333, 0.166]; // 100% to 16.6%
      const rate = successRates[script.selectedStar - 1];
      const successfulUpgrades = script.quantity * rate;
      // Each successful upgrade gives you stars equal to the star level
      return successfulUpgrades * script.selectedStar;
    };
    
    const getStarBonus = (wardenLevel, starCount) => {
      const levelData = domIncreasePerStarData.find(data => wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
      return levelData.constant * starCount;
    };
    
    // Add script bonuses for each attribute
    const strengthScriptStars = calculateScriptResults(talents.strengthScript);
    const allureScriptStars = calculateScriptResults(talents.allureScript);
    const intellectScriptStars = calculateScriptResults(talents.intellectScript);
    const spiritScriptStars = calculateScriptResults(talents.spiritScript);
    
    totalStrength += getStarBonus(talents.strengthScript.wardenLevel, strengthScriptStars);
    totalAllure += getStarBonus(talents.allureScript.wardenLevel, allureScriptStars);
    totalIntellect += getStarBonus(talents.intellectScript.wardenLevel, intellectScriptStars);
    totalSpirit += getStarBonus(talents.spiritScript.wardenLevel, spiritScriptStars);

    // Add talent scroll experience bonuses (200 exp = 1 star, assume level 250 warden)
    const calculateTalentScrollStars = () => {
      const totalExp = 
        (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
        (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
        (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
        (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
        (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
        (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
        (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
        (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
      
      return Math.floor(totalExp / 200); // Every 200 exp = 1 star
    };
    
    const talentScrollStars = calculateTalentScrollStars();
    const talentScrollDomBonus = getStarBonus(250, talentScrollStars); // Assume level 250 warden
    
    // Add talent scroll DOM bonus to all attributes (since they don't specify which attribute)
    const talentScrollBonusPerAttribute = talentScrollDomBonus / 4;
    totalStrength += talentScrollBonusPerAttribute;
    totalAllure += talentScrollBonusPerAttribute;
    totalIntellect += talentScrollBonusPerAttribute;
    totalSpirit += talentScrollBonusPerAttribute;

    // Add courtyard DOM contribution
    const courtyardDom = calculateCourtyardDom()
    totalStrength += courtyardDom.strength
    totalAllure += courtyardDom.allure
    totalIntellect += courtyardDom.intellect
    totalSpirit += courtyardDom.spirit

    const totalDom = totalStrength + totalAllure + totalIntellect + totalSpirit
    const baseDom = baseAttributes.strength + baseAttributes.allure + baseAttributes.intellect + baseAttributes.spirit
    const domIncrease = totalDom - baseDom

    return {
      totalStrength,
      totalAllure,
      totalIntellect,
      totalSpirit,
      totalDom,
      baseDom,
      domIncrease,
    }
  }

  // Calculate only the optimized scarlet bond bonuses (green suggestions)
  const calculateOptimizedScarletBondBonuses = () => {
    let optimizedStrength = 0
    let optimizedAllure = 0
    let optimizedIntellect = 0
    let optimizedSpirit = 0

    // Only calculate bonuses from optimized levels, not current manual levels
    Object.entries(optimizedBondLevels).forEach(([bondKey, optimizedBond]) => {
      const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
      if (bondData && optimizedBond) {
        // Calculate flat bonuses for each attribute
        if (optimizedBond.strengthLevel && optimizedBond.strengthLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.strengthLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            optimizedStrength += flatBonus

            // Add percentage bonus if available
            if (optimizedBond.strengthPercent && optimizedBond.strengthPercent > 0) {
              const percentBonus = ((optimizedBond.strengthPercent || 0)/100) * flatBonus
              optimizedStrength += percentBonus
            }
          }
        }

        if (optimizedBond.allureLevel && optimizedBond.allureLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.allureLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            optimizedAllure += flatBonus

            if (optimizedBond.allurePercent && optimizedBond.allurePercent > 0) {
              const percentBonus = ((optimizedBond.allurePercent || 0)/100) * flatBonus
              optimizedAllure += percentBonus
            }
          }
        }

        if (optimizedBond.intellectLevel && optimizedBond.intellectLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.intellectLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            optimizedIntellect += flatBonus

            if (optimizedBond.intellectPercent && optimizedBond.intellectPercent > 0) {
              const percentBonus = ((optimizedBond.intellectPercent || 0)/100) * flatBonus
              optimizedIntellect += percentBonus
            }
          }
        }

        if (optimizedBond.spiritLevel && optimizedBond.spiritLevel > 0) {
          const levelData = scarletBondLevels.find(l => l.level === optimizedBond.spiritLevel)
          if (levelData) {
            let flatBonus = 0
            if (bondData.type === 'All') {
              flatBonus = levelData.all || 0
            } else if (bondData.type === 'Dual') {
              flatBonus = levelData.dual || 0
            } else {
              flatBonus = levelData.single || 0
            }
            optimizedSpirit += flatBonus

            if (optimizedBond.spiritPercent && optimizedBond.spiritPercent > 0) {
              const percentBonus = ((optimizedBond.spiritPercent || 0)/100) * flatBonus
              optimizedSpirit += percentBonus
            }
          }
        }
      }
    })

    return {
      optimizedStrength,
      optimizedAllure,
      optimizedIntellect,
      optimizedSpirit,
    }
  }

  const calculateSuggestedScarletBondIncrease = () => {
    let increaseStrength = 0
    let increaseAllure = 0
    let increaseIntellect = 0
    let increaseSpirit = 0
    let increaseDom = 0

    // Debug: Check scarletBondAffinity keys
    console.log('Available scarletBondAffinity keys:', Object.keys(scarletBondAffinity))
    console.log('Available scarletBond keys:', Object.keys(scarletBond))
    console.log('scarletBondData first few entries:', scarletBondData.slice(0, 5))

    // Iterate through all bonds that have affinity points
    Object.entries(scarletBondAffinity).forEach(([bondKey, affinity]) => {
      console.log(`Checking bond ${bondKey} with affinity ${affinity}`)
      if (affinity && affinity > 0) {
        const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
        console.log(`Bond ${bondKey}: found bondData:`, bondData)
        if (bondData) {
          const wardenAttrs = wardenAttributes[bondData.warden as keyof typeof wardenAttributes] || []
          const currentBond = scarletBond[bondKey]
          console.log(`Bond ${bondKey}: wardenAttrs=${JSON.stringify(wardenAttrs)}, currentBond exists=${!!currentBond}`)
          
          // Calculate suggestions for this bond
          const suggestedUpgrades = calculateSuggestedUpgrades(bondKey, affinity)
          console.log(`Bond ${bondKey} suggestions:`, Object.keys(suggestedUpgrades), suggestedUpgrades)
          
          if (currentBond) {
            // Check each attribute that this warden supports
            ['strength', 'allure', 'intellect', 'spirit'].forEach((attr) => {
              const isMainStat = wardenAttrs.some(a => a.toLowerCase() === attr || a.toLowerCase() === "balance")
              console.log(`Bond ${bondKey} attr ${attr}: isMainStat=${isMainStat}`)
              
              if (isMainStat) {
                const flatSuggestion = suggestedUpgrades[`${attr}Level`]
                const percentSuggestion = suggestedUpgrades[`${attr}Percent`]
                
                let totalIncrease = 0
                
                if (flatSuggestion && flatSuggestion.increase > 0) {
                  totalIncrease += flatSuggestion.domGain || 0
                }
                
                if (percentSuggestion && percentSuggestion.increase > 0) {
                  totalIncrease += percentSuggestion.domGain || 0
                }
                
                console.log(`Bond ${bondKey} ${attr}: totalIncrease=${totalIncrease} (flat=${flatSuggestion?.domGain || 0}, percent=${percentSuggestion?.domGain || 0})`)
                
                if (totalIncrease > 0) {
                  if (attr === 'strength') increaseStrength += totalIncrease
                  else if (attr === 'allure') increaseAllure += totalIncrease
                  else if (attr === 'intellect') increaseIntellect += totalIncrease
                  else if (attr === 'spirit') increaseSpirit += totalIncrease
                  
                  // Add to DOM increase
                  increaseDom += totalIncrease
                }
              }
            })
          }
        }
      }
    })

    const result = {
      increaseStrength,
      increaseAllure,
      increaseIntellect,
      increaseSpirit,
      increaseDom
    }
    
    console.log('calculateSuggestedScarletBondIncrease result:', result)
    return result
  }

  const calculateCurrentScarletBondBonuses = () => {
    let currentStrength = 0
    let currentAllure = 0
    let currentIntellect = 0
    let currentSpirit = 0

    Object.entries(scarletBond).forEach(([bondKey, bond]: [string, any]) => {
      if (bond) {
        // Find the warden for this bond
        const bondData = scarletBondData.find(b => `${b.lover}-${b.warden}` === bondKey)
        if (bondData) {
          const wardenAttrs = wardenAttributes[bondData.warden as keyof typeof wardenAttributes] || []
          
          // Calculate flat bonuses for each attribute
          if (bond.strengthLevel && bond.strengthLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === bond.strengthLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              
              // Apply lover bonuses if applicable
              let multiplier = 1.0
              if (wardenAttrs.includes('Strength')) {
                // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                if (loverCount === 1) multiplier = 1.2
                else if (loverCount === 2) multiplier = 1.25
                else if (loverCount === 3) multiplier = 1.3
              }
              
              currentStrength += Math.round(flatBonus * multiplier)

              // Add percentage bonus
              if (bond.strengthPercent && bond.strengthPercent > 0) {
                const percentBonus = ((bond.strengthPercent || 0)/100) * flatBonus
                currentStrength += Math.round(percentBonus * multiplier)
              }
            }
          }
          
          if (bond.allureLevel && bond.allureLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === bond.allureLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              
              // Apply lover bonuses if applicable
              let multiplier = 1.0
              if (wardenAttrs.includes('Allure')) {
                // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                if (loverCount === 1) multiplier = 1.2
                else if (loverCount === 2) multiplier = 1.25
                else if (loverCount === 3) multiplier = 1.3
              }
              
              currentAllure += Math.round(flatBonus * multiplier)

              if (bond.allurePercent && bond.allurePercent > 0) {
                const percentBonus = ((bond.allurePercent || 0)/100) * flatBonus
                currentAllure += Math.round(percentBonus * multiplier)
              }
            }
          }
          
          if (bond.intellectLevel && bond.intellectLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === bond.intellectLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              
              // Apply lover bonuses if applicable
              let multiplier = 1.0
              if (wardenAttrs.includes('Intellect')) {
                // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                if (loverCount === 1) multiplier = 1.2
                else if (loverCount === 2) multiplier = 1.25
                else if (loverCount === 3) multiplier = 1.3
              }
              
              currentIntellect += Math.round(flatBonus * multiplier)

              if (bond.intellectPercent && bond.intellectPercent > 0) {
                const percentBonus = ((bond.intellectPercent || 0)/100) * flatBonus
                currentIntellect += Math.round(percentBonus * multiplier)
              }
            }
          }
          
          if (bond.spiritLevel && bond.spiritLevel > 0) {
            const levelData = scarletBondLevels.find(l => l.level === bond.spiritLevel)
            if (levelData) {
              let flatBonus = 0
              if (bondData.type === 'All') {
                flatBonus = levelData.all || 0
              } else if (bondData.type === 'Dual') {
                flatBonus = levelData.dual || 0
              } else {
                flatBonus = levelData.single || 0
              }
              
              // Apply lover bonuses if applicable
              let multiplier = 1.0
              if (wardenAttrs.includes('Spirit')) {
                // Check if lover is summoned (checkbox) OR has 100+ tokens in inventory
    const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
    const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
    const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
    const loverCount = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                if (loverCount === 1) multiplier = 1.2
                else if (loverCount === 2) multiplier = 1.25
                else if (loverCount === 3) multiplier = 1.3
              }
              
              currentSpirit += Math.round(flatBonus * multiplier)

              if (bond.spiritPercent && bond.spiritPercent > 0) {
                const percentBonus = ((bond.spiritPercent || 0)/100) * flatBonus
                currentSpirit += Math.round(percentBonus * multiplier)
              }
            }
          }
        }
      }
    })

    return {
      currentStrength,
      currentAllure,
      currentIntellect,
      currentSpirit
    }
  }

  const totals = calculateTotals()
  const optimizedBonuses = calculateOptimizedScarletBondBonuses()
  const currentScarletBondBonuses = calculateCurrentScarletBondBonuses()
  const suggestedIncrease = calculateSuggestedScarletBondIncrease()
  const dynamicAuras = calculateDynamicAuraLevels()
  const auraBonuses = calculateAuraBonuses()
  
  // Define consistent attribute ordering
  const attributeOrder = ['strength', 'allure', 'intellect', 'spirit'] as const
  const bookCategoryOrder = ['Strength', 'Allure', 'Intellect', 'Spirit'] as const

  // Get attribute colors
  const getAttributeColor = (attribute: string) => {
    switch (attribute.toLowerCase()) {
      case "strength":
        return "text-red-400"
      case "allure":
        return "text-purple-400"
      case "intellect":
        return "text-green-400"
      case "spirit":
        return "text-blue-400"
      case "balance":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getAttributeBg = (attribute: string) => {
    switch (attribute.toLowerCase()) {
      case "strength":
        return "bg-red-500/20 border-red-500/30"
      case "allure":
        return "bg-purple-500/20 border-purple-500/30"
      case "intellect":
        return "bg-green-500/20 border-green-500/30"
      case "spirit":
        return "bg-blue-500/20 border-blue-500/30"
      case "balance":
        return "bg-yellow-500/20 border-yellow-500/30"
      default:
        return "bg-gray-500/20 border-gray-500/30"
    }
  }

  // Render stars
  const renderStars = (tier: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-lg ${i < tier ? "text-yellow-400" : "text-gray-600"}`}>
            ★
          </span>
        ))}
      </div>
    )
  }

  // Handle warden selection
  const handleWardenSelection = (group: string, warden: string) => {
    setSelectedWardens((prev: any) => {
      const currentSelected = prev[group] || []
      const isSelected = currentSelected.includes(warden)

      if (isSelected) {
        return {
          ...prev,
          [group]: currentSelected.filter((w: string) => w !== warden),
        }
      } else if (currentSelected.length < wardenCounts[group as keyof typeof wardenCounts]) {
        return {
          ...prev,
          [group]: [...currentSelected, warden],
        }
      }
      return prev
    })
  }

  // Handle skin toggle
  const handleSkinToggle = (wardenName: string, skinName: string) => {
    setWardenSkins((prev) => ({
      ...prev,
      [wardenName]: {
        ...prev[wardenName],
        [skinName]: !prev[wardenName]?.[skinName],
      },
    }))
  }

  // Get all selected wardens flattened
  const getAllSelectedWardens = () => {
    const allSelected: any[] = []
    Object.entries(selectedWardens).forEach(([group, wardens]) => {
      wardens.forEach((wardenName: string) => {
        const wardenData = wardenGroups[group as keyof typeof wardenGroups]?.find((w) => w.name === wardenName)
        if (wardenData) {
          allSelected.push({ ...wardenData, group })
        }
      })
    })
    if (hasNyx) allSelected.push({ name: "Nyx", attributes: ["Balance"], tier: 5, group: "special" })
    if (hasDracula) allSelected.push({ name: "Dracula", attributes: ["Balance"], tier: 5, group: "special" })
    return allSelected
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Menu */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1"></div> {/* Left spacer */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-red-400">Game of Vampires Calculator</h1>
            <p className="text-sm text-gray-400">
              Created by <span className="text-purple-400 font-semibold">@saka_kishiyami</span> on Discord
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <UserMenu 
              user={user} 
              onUserChange={setUser}
              currentData={getCurrentData()}
              onLoadCloudData={loadCloudData}
              onSaveData={saveData}
              onLoadLocalData={loadData}
              onExportData={exportData}
              onImportData={importData}
              autoLoadCloudSaves={autoLoadCloudSaves}
              onToggleAutoLoadCloudSaves={toggleAutoLoadCloudSaves}
              onCompareData={compareData}
              dataLoadPreference={dataLoadPreference}
              onResetDataPreference={resetDataPreference}
            />
          </div>
        </div>

        {/* Data Comparison Modal */}
        {showDataComparison && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-600 max-w-2xl w-full">
              <CardHeader>
                <CardTitle className="text-white text-center">⚖️ Data Comparison</CardTitle>
                <p className="text-gray-400 text-sm text-center">
                  Choose which data to load. Your choice will be remembered for future automatic loading.
                </p>
                <p className="text-yellow-400 text-xs text-center font-medium">
                  🔸 This preference can be reset later in the Cloud Saves menu
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local Data */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-400">💾 Local Data</h3>
                    {dataComparison.local ? (
                      <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Size:</span>
                          <span 
                            className={`font-bold ${
                              dataComparison.cloud && dataComparison.local.size > dataComparison.cloud.size 
                                ? 'text-green-400' 
                                : dataComparison.cloud 
                                  ? 'text-red-400'
                                  : 'text-white'
                            }`}
                          >
                            {formatSize(dataComparison.local.size)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Last Updated:</span>
                          <span className="text-gray-400 text-sm">
                            {dataComparison.local.timestamp}
                          </span>
                        </div>
                        <Button 
                          onClick={() => loadFromComparison('local')}
                          className="w-full bg-blue-600 hover:bg-blue-700 mt-3"
                        >
                          Load Local Data
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 p-4 rounded-lg text-center text-gray-500">
                        No local data found
                      </div>
                    )}
                  </div>

                  {/* Cloud Data */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-green-400">☁️ Cloud Data</h3>
                    {dataComparison.cloud ? (
                      <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Size:</span>
                          <span 
                            className={`font-bold ${
                              dataComparison.local && dataComparison.cloud.size > dataComparison.local.size 
                                ? 'text-green-400' 
                                : dataComparison.local 
                                  ? 'text-red-400'
                                  : 'text-white'
                            }`}
                          >
                            {formatSize(dataComparison.cloud.size)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Last Updated:</span>
                          <span className="text-gray-400 text-sm">
                            {dataComparison.cloud.timestamp}
                          </span>
                        </div>
                        <Button 
                          onClick={() => loadFromComparison('cloud')}
                          className="w-full bg-green-600 hover:bg-green-700 mt-3"
                        >
                          Load Cloud Data
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 p-4 rounded-lg text-center text-gray-500">
                        No cloud data found
                      </div>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-6 text-center">
                  <Button 
                    onClick={() => setShowDataComparison(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIP and Lord Level */}
        <div className="flex justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Label className="text-white whitespace-nowrap">VIP Level:</Label>
              <Input
                type="number"
                min="0"
                max="12"
                value={vipLevel}
                onChange={(e) => setVipLevel(Number.parseInt(e.target.value) || 0)}
                className="w-20 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-white whitespace-nowrap">Lord Level:</Label>
              <select
                value={lordLevel}
                onChange={(e) => setLordLevel(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded text-white p-2"
              >
                {[
                  "Fledgling Lord 1",
                  "Fledgling Lord 2",
                  "Fledgling Lord 3",
                  "Fledgling Lord 4",
                  "Fledgling Lord 5",
                  "Young Lord 1",
                  "Young Lord 2",
                  "Young Lord 3",
                  "Young Lord 4",
                  "Young Lord 5",
                  "Elevated Lord 1",
                  "Elevated Lord 2",
                  "Elevated Lord 3",
                  "Elevated Lord 4",
                  "Elevated Lord 5",
                  "Venerable Lord 1",
                  "Venerable Lord 2",
                  "Venerable Lord 3",
                  "Venerable Lord 4",
                  "Venerable Lord 5",
                  "Elder Lord 1",
                  "Elder Lord 2",
                  "Elder Lord 3",
                  "Elder Lord 4",
                  "Elder Lord 5",
                  "Ancient Lord 1",
                  "Ancient Lord 2",
                  "Ancient Lord 3",
                ].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DOM Display */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{totals.baseDom.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Current DOM</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{totals.totalDom.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Total DOM</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">+{totals.domIncrease.toLocaleString()}</div>
                <div className="text-sm text-gray-300">DOM Increase</div>
              </CardContent>
            </Card>
          </div>



          {/* Base Attributes */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {attributeOrder.map((attr) => (
              <Card key={attr} className="bg-gray-800/50 border-gray-600">
                <CardContent className="p-4">
                  <Label className={`capitalize ${getAttributeColor(attr)}`}>{attr}</Label>
                  <Input
                    type="number"
                    value={baseAttributes[attr]}
                    onChange={(e) =>
                      setBaseAttributes((prev) => ({
                        ...prev,
                        [attr]: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="text-sm text-gray-400 mt-1">
                    Total: {totals[`total${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof totals]?.toLocaleString() || 0}
                    {optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses] > 0 && (
                      <span className="text-green-400 ml-2">
                        +{optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses].toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attribute Boosts */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {attributeOrder.map((attr) => {
              const baseValue = baseAttributes[attr]
              const totalValue = totals[`total${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof totals] as number || 0
              const boost = baseValue > 0 ? ((totalValue - baseValue) / baseValue) * 100 : 0
              return (
                <Card key={attr} className="bg-gray-800/50 border-gray-600">
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getAttributeColor(attr)}`}>+{boost.toFixed(1)}%</div>
                    <div className="text-sm text-gray-300 capitalize">{attr} Boost</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="aura-bonuses" className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-gray-800 mb-6">
            <TabsTrigger value="aura-bonuses" className="data-[state=active]:bg-red-600">
              Aura Bonuses
            </TabsTrigger>
            <TabsTrigger value="conclave" className="data-[state=active]:bg-red-600">
              Conclave
            </TabsTrigger>
            <TabsTrigger value="courtyard" className="data-[state=active]:bg-red-600">
              Courtyard
            </TabsTrigger>
            <TabsTrigger value="books" className="data-[state=active]:bg-red-600">
              Books
            </TabsTrigger>
            <TabsTrigger value="talents" className="data-[state=active]:bg-red-600">
              Talents
            </TabsTrigger>
            <TabsTrigger value="wardens" className="data-[state=active]:bg-red-600">
              Wardens
            </TabsTrigger>
            <TabsTrigger value="scarlet-bond" className="data-[state=active]:bg-red-600">
              Scarlet Bond
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-red-600">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-red-600">
              Data
            </TabsTrigger>
          </TabsList>

          {/* Aura Bonuses Tab */}
          <TabsContent value="aura-bonuses">
            <div className="space-y-6">
              {/* Current Aura Bonuses Display */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-red-400">Current Aura Bonuses</CardTitle>
                  <div className="text-sm text-gray-300">
                    Showing current percentage bonuses from all aura sources (base 100% + aura bonuses)
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Talent Bonuses */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-yellow-400">Talent Bonuses</h3>
                      <div className="space-y-3">
                        {attributeOrder.map((attribute) => (
                          <div key={attribute} className="flex justify-between items-center p-3 rounded bg-gray-700/50">
                            <span className={`capitalize font-medium ${getAttributeColor(attribute)}`}>
                              {attribute} Talents
                            </span>
                            <span className="text-xl font-bold text-white">
                              {auraBonuses.talents[attribute].toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Book Bonuses */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-blue-400">Book Bonuses</h3>
                      <div className="space-y-3">
                        {attributeOrder.map((attribute) => (
                          <div key={attribute} className="flex justify-between items-center p-3 rounded bg-gray-700/50">
                            <span className={`capitalize font-medium ${getAttributeColor(attribute)}`}>
                              {attribute} Books
                            </span>
                            <span className="text-xl font-bold text-white">
                              {auraBonuses.books[attribute].toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aura Breakdown by Source */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-red-400">Aura Sources Breakdown</CardTitle>
                  <div className="text-sm text-gray-300">
                    Detailed breakdown of bonuses from each aura source
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Wild Hunt */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-3">Wild Hunt Wardens (Talent Bonuses)</h3>
                      <div className="text-sm text-gray-300 mb-3">
                        Selected: {(selectedWardens.hunt || []).length}/4 | 
                        Base Level: {(selectedWardens.hunt || []).length > 0 ? 9 + Math.max(0, (selectedWardens.hunt || []).length - 1) : 0}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(dynamicAuras.wildHunt).map(([wardenName, wardenData]) => {
                          const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                          const isSelected = (selectedWardens.hunt || []).includes(wardenName)
                          const secondaryAura = auras.secondaryAuras?.wildHunt[wardenName]
                          const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                          return (
                            <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700/30'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className={`font-medium ${isSelected ? 'text-green-300' : 'text-gray-500'}`}>{wardenName}</span>
                                  <div className="text-xs text-gray-400">{wardenData.type}</div>
                                  <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                                </div>
                                <span className={`text-lg font-bold ${isSelected ? 'text-green-400' : 'text-gray-500'}`}>
                                  +{currentBonus}%
                                </span>
                              </div>
                              {secondaryAura && (
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={secondaryAura.current}
                                        onChange={(e) =>
                                          setAuras((prev) => ({
                                            ...prev,
                                            secondaryAuras: {
                                              ...prev.secondaryAuras,
                                              wildHunt: {
                                                ...prev.secondaryAuras.wildHunt,
                                                [wardenName]: {
                                                  ...prev.secondaryAuras.wildHunt[wardenName],
                                                  current: Number.parseInt(e.target.value) || 0,
                                                },
                                              },
                                            },
                                          }))
                                        }
                                        className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                                      />
                                      <span className="text-xs text-gray-400">/20</span>
                                    </div>
                                    <span className="text-sm font-semibold text-yellow-400">
                                      +{secondaryBonus}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Monster Noir */}
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400 mb-3">Monster Noir Wardens (Book Bonuses)</h3>
                      <div className="text-sm text-gray-300 mb-3">
                        Selected: {(selectedWardens.noir || []).length}/4 | 
                        Base Level: {(selectedWardens.noir || []).length > 0 ? 9 + Math.max(0, (selectedWardens.noir || []).length - 1) : 0}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(dynamicAuras.monsterNoir).map(([wardenName, wardenData]) => {
                          const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                          const isSelected = (selectedWardens.noir || []).includes(wardenName)
                          const secondaryAura = auras.secondaryAuras?.monsterNoir[wardenName]
                          const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                          return (
                            <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gray-700/30'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className={`font-medium ${isSelected ? 'text-purple-300' : 'text-gray-500'}`}>{wardenName}</span>
                                  <div className="text-xs text-gray-400">{wardenData.type}</div>
                                  <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                                </div>
                                <span className={`text-lg font-bold ${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>
                                  +{currentBonus}%
                                </span>
                              </div>
                              {secondaryAura && (
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={secondaryAura.current}
                                        onChange={(e) =>
                                          setAuras((prev) => ({
                                            ...prev,
                                            secondaryAuras: {
                                              ...prev.secondaryAuras,
                                              monsterNoir: {
                                                ...prev.secondaryAuras.monsterNoir,
                                                [wardenName]: {
                                                  ...prev.secondaryAuras.monsterNoir[wardenName],
                                                  current: Number.parseInt(e.target.value) || 0,
                                                },
                                              },
                                            },
                                          }))
                                        }
                                        className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                                      />
                                      <span className="text-xs text-gray-400">/20</span>
                                    </div>
                                    <span className="text-sm font-semibold text-yellow-400">
                                      +{secondaryBonus}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Bloody Tyrants */}
                    <div>
                      <h3 className="text-lg font-semibold text-red-400 mb-3">Bloody Tyrants Wardens (Book Bonuses)</h3>
                      <div className="text-sm text-gray-300 mb-3">
                        Selected: {(selectedWardens.tyrants || []).length}/5 | 
                        Base Level: {(selectedWardens.tyrants || []).length > 0 ? 10 + Math.max(0, (selectedWardens.tyrants || []).length - 1) : 0}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(dynamicAuras.bloodyTyrants).map(([wardenName, wardenData]) => {
                          const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                          const isSelected = (selectedWardens.tyrants || []).includes(wardenName)
                          const secondaryAura = auras.secondaryAuras?.bloodyTyrants[wardenName]
                          const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                          return (
                            <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-red-500/20 border border-red-500/30' : 'bg-gray-700/30'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className={`font-medium ${isSelected ? 'text-red-300' : 'text-gray-500'}`}>{wardenName}</span>
                                  <div className="text-xs text-gray-400">{wardenData.type}</div>
                                  <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                                </div>
                                <span className={`text-lg font-bold ${isSelected ? 'text-red-400' : 'text-gray-500'}`}>
                                  +{currentBonus}%
                                </span>
                              </div>
                              {secondaryAura && (
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={secondaryAura.current}
                                        onChange={(e) =>
                                          setAuras((prev) => ({
                                            ...prev,
                                            secondaryAuras: {
                                              ...prev.secondaryAuras,
                                              bloodyTyrants: {
                                                ...prev.secondaryAuras.bloodyTyrants,
                                                [wardenName]: {
                                                  ...prev.secondaryAuras.bloodyTyrants[wardenName],
                                                  current: Number.parseInt(e.target.value) || 0,
                                                },
                                              },
                                            },
                                          }))
                                        }
                                        className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                                      />
                                      <span className="text-xs text-gray-400">/20</span>
                                    </div>
                                    <span className="text-sm font-semibold text-yellow-400">
                                      +{secondaryBonus}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Cirque du Macabre */}
                    <div>
                      <h3 className="text-lg font-semibold text-orange-400 mb-3">Cirque du Macabre Wardens (Book Bonuses)</h3>
                      <div className="text-sm text-gray-300 mb-3">
                        Selected: {(selectedWardens.circus || []).length}/5 | 
                        Base Level: {(selectedWardens.circus || []).length > 0 ? 10 + Math.max(0, (selectedWardens.circus || []).length - 1) : 0}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(dynamicAuras.cirque).map(([wardenName, wardenData]) => {
                          const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
                          const isSelected = (selectedWardens.circus || []).includes(wardenName)
                          const secondaryAura = auras.secondaryAuras?.cirque[wardenName]
                          const secondaryBonus = secondaryAura ? secondaryAura.baseValue + secondaryAura.current * secondaryAura.increment : 0
                          return (
                            <div key={wardenName} className={`p-3 rounded ${isSelected ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-gray-700/30'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className={`font-medium ${isSelected ? 'text-orange-300' : 'text-gray-500'}`}>{wardenName}</span>
                                  <div className="text-xs text-gray-400">{wardenData.type}</div>
                                  <div className="text-xs text-gray-400">Primary: Level {wardenData.current}/{wardenData.max}</div>
                                </div>
                                <span className={`text-lg font-bold ${isSelected ? 'text-orange-400' : 'text-gray-500'}`}>
                                  +{currentBonus}%
                                </span>
                              </div>
                              {secondaryAura && (
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-gray-300">Secondary Aura:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={secondaryAura.current}
                                        onChange={(e) =>
                                          setAuras((prev) => ({
                                            ...prev,
                                            secondaryAuras: {
                                              ...prev.secondaryAuras,
                                              cirque: {
                                                ...prev.secondaryAuras.cirque,
                                                [wardenName]: {
                                                  ...prev.secondaryAuras.cirque[wardenName],
                                                  current: Number.parseInt(e.target.value) || 0,
                                                },
                                              },
                                            },
                                          }))
                                        }
                                        className="w-16 h-6 text-xs bg-gray-600 border-gray-500 text-white"
                                      />
                                      <span className="text-xs text-gray-400">/20</span>
                                    </div>
                                    <span className="text-sm font-semibold text-yellow-400">
                                      +{secondaryBonus}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Lovers (if any are active) */}
                    {(hasAgneyi || hasCulann || hasHela) && (
                      <div>
                        <h3 className="text-lg font-semibold text-pink-400 mb-3">Lovers (Scarlet Bond Bonuses)</h3>
                        <div className="text-sm text-gray-300 mb-3">
                          Summoned: {[hasAgneyi, hasCulann, hasHela].filter(Boolean).length}/3 | 
                          Bonus Level: {(() => {
                            const count = [hasAgneyi, hasCulann, hasHela].filter(Boolean).length
                            if (count === 0) return "0%"
                            if (count === 1) return "20%"
                            if (count === 2) return "25%"
                            return "30%"
                          })()}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(dynamicAuras.lovers || {}).map(([loverName, loverData]) => {
                            const isSelected = (loverName === "Agneyi" && hasAgneyi) || 
                                             (loverName === "Culann" && hasCulann) || 
                                             (loverName === "Hela" && hasHela)
                            const currentBonus = loverData.current
                            return (
                              <div key={loverName} className={`p-3 rounded ${isSelected ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-gray-700/30'}`}>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className={`font-medium ${isSelected ? 'text-pink-300' : 'text-gray-500'}`}>{loverName}</span>
                                    <div className="text-xs text-gray-400">{loverData.type}</div>
                                    <div className="text-xs text-gray-400">{isSelected ? 'Summoned' : 'Not Summoned'}</div>
                                  </div>
                                  <span className={`text-lg font-bold ${isSelected ? 'text-pink-400' : 'text-gray-500'}`}>
                                    +{currentBonus}%
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* VIP Wardens (if any are active) */}
                    {vipLevel > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-400 mb-3">VIP Wardens (VIP {vipLevel})</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(auras.vip)
                            .filter(([_, wardenData]) => vipLevel >= wardenData.vipRequired)
                            .map(([wardenName, wardenData]) => (
                              <div key={wardenName} className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                                <div>
                                  <span className="text-white font-medium">{wardenName}</span>
                                  <div className="text-xs text-gray-400">VIP {wardenData.vipRequired} Required</div>
                                  {wardenData.talents ? (
                                    <div className="text-xs text-gray-400">
                                      Talents: {wardenData.talents.current}% | Books: {wardenData.books.current}%
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">{wardenData.type}: {wardenData.current}%</div>
                                  )}
                                </div>
                                <div className="text-right">
                                  {wardenData.talents ? (
                                    <>
                                      <div className="text-sm font-bold text-yellow-400">T: +{wardenData.talents.current}%</div>
                                      <div className="text-sm font-bold text-blue-400">B: +{wardenData.books.current}%</div>
                                    </>
                                  ) : (
                                    <span className="text-lg font-bold text-yellow-400">
                                      +{wardenData.current}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Special Wardens (if any are active) */}
                    {(hasNyx || hasDracula) && (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-3">Special Wardens</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {hasNyx && (
                            <div className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                              <div>
                                <span className="text-white font-medium">Nyx</span>
                                <div className="text-xs text-gray-400">
                                  Talents: {auras.special.Nyx.talents.current}% | Books: {auras.special.Nyx.books.current}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-400">T: +{auras.special.Nyx.talents.current}%</div>
                                <div className="text-sm font-bold text-blue-400">B: +{auras.special.Nyx.books.current}%</div>
                              </div>
                            </div>
                          )}
                          {hasDracula && (
                            <div className="flex justify-between items-center p-3 rounded bg-gray-700/30">
                              <div>
                                <span className="text-white font-medium">Dracula</span>
                                <div className="text-xs text-gray-400">
                                  Talents: {auras.special.Dracula.talents.current}% | Books: {auras.special.Dracula.books.current}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-yellow-400">T: +{auras.special.Dracula.talents.current}%</div>
                                <div className="text-sm font-bold text-blue-400">B: +{auras.special.Dracula.books.current}%</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Conclave Tab */}
          <TabsContent value="conclave">
            <div className="space-y-6">
              {/* Current Seal Levels */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-red-400">Current Seal Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(conclave)
                      .filter(([seal]) => seal !== "Conclave Points")
                      .map(([seal, level]) => (
                        <div key={seal}>
                          <Label className="text-white">{seal}</Label>
                          <Input
                            type="number"
                            value={level}
                            onChange={(e) =>
                              setConclave((prev) => ({
                                ...prev,
                                [seal]: Number.parseInt(e.target.value) || 0,
                              }))
                            }
                            className="mt-2 bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Seal Upgrade Planning */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-red-400">Seal Upgrade Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Saved Seals Input */}
                    <div>
                      <Label className="text-white">Saved Conclave Seals</Label>
                      <Input
                        type="number"
                        value={conclaveUpgrade.savedSeals}
                        onChange={(e) =>
                          setConclaveUpgrade((prev) => ({
                            ...prev,
                            savedSeals: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="mt-2 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    {/* Seal Selection Checkboxes */}
                    <div>
                      <Label className="text-white text-lg block mb-3">Select Seals to Upgrade:</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(conclaveUpgrade.upgradeSeals).map(([seal, checked]) => (
                          <div key={seal} className="flex items-center space-x-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(checked) =>
                                setConclaveUpgrade((prev) => ({
                                  ...prev,
                                  upgradeSeals: {
                                    ...prev.upgradeSeals,
                                    [seal]: checked as boolean,
                                  }
                                }))
                              }
                              className="border-gray-400"
                            />
                            <Label className="text-white">{seal}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upgrade Preview */}
                    {conclaveUpgrade.savedSeals > 0 && (() => {
                      const upgradePreview = calculateConclaveUpgrades()
                      return upgradePreview.upgrades.length > 0 ? (
                        <div className="border border-gray-600 rounded p-4 bg-gray-900/50">
                          <h3 className="text-yellow-400 font-semibold mb-3">Optimal Upgrade Strategy</h3>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <p className="text-white">
                                <span className="text-blue-400">Total Cost:</span> {upgradePreview.totalCost.toLocaleString()} seals
                              </p>
                              <p className="text-white">
                                <span className="text-green-400">Total DOM Gain:</span> {upgradePreview.upgrades.reduce((sum, u) => sum + u.domGain, 0).toLocaleString()}
                              </p>
                            </div>
                            {upgradePreview.upgrades
                              .sort((a, b) => {
                                // First sort by seal type (maintain attribute order)
                                const aIndex = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"].indexOf(a.sealType)
                                const bIndex = ["Seal of Strength", "Seal of Allure", "Seal of Intellect", "Seal of Spirit"].indexOf(b.sealType)
                                if (aIndex !== bIndex) return aIndex - bIndex
                                // Then by target level (ascending)
                                return a.targetLevel - b.targetLevel
                              })
                              .map((upgrade, index) => (
                                <div key={index} className="border-l-2 border-blue-500 pl-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <p className="text-green-400 font-medium">{upgrade.sealType}</p>
                                    <p className="text-yellow-400 text-xs">
                                      {upgrade.efficiency.toFixed(1)} DOM/seal
                                    </p>
                                  </div>
                                  <p className="text-gray-300">
                                    Level {upgrade.currentLevel} → {upgrade.targetLevel} 
                                    (Cost: {upgrade.cost.toLocaleString()})
                                  </p>
                                  <p className="text-gray-300">
                                    +{upgrade.wardenBonus.toLocaleString()} warden DOM, 
                                    +{upgrade.bookMultiplier.toFixed(1)}% book multiplier
                                  </p>
                                  <p className="text-blue-300 text-xs">
                                    Total DOM gain: {upgrade.domGain.toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            <div className="border-t border-gray-600 pt-2 mt-3">
                              <p className="text-gray-400 text-xs">
                                ✨ Upgrades are ordered by attribute (Strength → Allure → Intellect → Spirit) then by level
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-600 rounded p-4 bg-gray-900/50">
                          <p className="text-gray-400">No upgrades possible with current seal count</p>
                        </div>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courtyard Tab */}
          <TabsContent value="courtyard">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-red-400">Courtyard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-white">Current Level</Label>
                    <Input
                      type="number"
                      value={courtyard.currentLevel}
                      onChange={(e) =>
                        setCourtyard((prev) => ({
                          ...prev,
                          currentLevel: Number.parseInt(e.target.value) || 1,
                        }))
                      }
                      className="mt-2 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Current Points</Label>
                    <Input
                      type="number"
                      value={courtyard.currentPoints}
                      onChange={(e) =>
                        setCourtyard((prev) => ({
                          ...prev,
                          currentPoints: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-2 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-xl font-bold text-green-400">Projected Level: {projectedLevel}</div>
                  <div className="text-sm text-gray-300 mt-2">Based on current points and selected wardens</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-red-400">Books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {bookCategoryOrder.map((category) => {
                    const bookCollection = books[category as keyof BooksState]
                    return (
                    <Card key={category} className={`${getAttributeBg(category)} border`}>
                      <CardHeader>
                        <CardTitle className={`${getAttributeColor(category)} font-semibold`}>{category} Books</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(bookCollection)
                            .sort((a, b) => {
                              // Extract numbers from book names for proper numerical sorting
                              const getNumber = (name: string) => {
                                const match = name.match(/(\d+)/)
                                return match ? parseInt(match[1]) : 0
                              }
                              return getNumber(a[0]) - getNumber(b[0])
                            })
                            .map(([bookName, count]) => (
                            <div key={bookName}>
                              <Label className="text-white text-sm">{bookName}</Label>
                              <Input
                                type="number"
                                value={count}
                                onChange={(e) => {
                                  const newCount = Number.parseInt(e.target.value) || 0
                                  setBooks((prev) => ({
                                    ...prev,
                                    [category]: {
                                      ...prev[category as keyof BooksState],
                                      [bookName]: newCount,
                                    },
                                  }))
                                  syncBooksToInventory(category, bookName, newCount)
                                }}
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                              />
                              <div className="text-xs text-gray-400 mt-1">
                                Bonus: +{(count as number) * (bookBonuses[category as keyof typeof bookBonuses]?.[bookName as keyof typeof bookBonuses[typeof category]] || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Talents Tab */}
          <TabsContent value="talents">
            <div className="space-y-6">
              {/* Talent Scrolls */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Talent Scrolls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Random Talent Scrolls */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Random Talent Scrolls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Random Talent Scroll (5-1000 exp)</Label>
                        <Input
                          type="number"
                          value={talents.randomTalentScroll.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              randomTalentScroll: { ...prev.randomTalentScroll, count: newCount }
                            }))
                            syncTalentsToInventory('randomTalentScroll', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">Average: ~502.5 exp each</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Talent Scroll Lvl 4 (41-80 exp)</Label>
                        <Input
                          type="number"
                          value={talents.talentScrollLvl4.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount }
                            }))
                            syncTalentsToInventory('talentScrollLvl4', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">Average: ~60.5 exp each</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Talent Scroll Lvl 3 (21-40 exp)</Label>
                        <Input
                          type="number"
                          value={talents.talentScrollLvl3.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              talentScrollLvl3: { ...prev.talentScrollLvl3, count: newCount }
                            }))
                            syncTalentsToInventory('talentScrollLvl3', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">Average: ~30.5 exp each</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Talent Scroll Lvl 2 (6-20 exp)</Label>
                        <Input
                          type="number"
                          value={talents.talentScrollLvl2.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              talentScrollLvl2: { ...prev.talentScrollLvl2, count: newCount }
                            }))
                            syncTalentsToInventory('talentScrollLvl2', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">Average: ~13 exp each</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Talent Scroll Lvl 1 (1-5 exp)</Label>
                        <Input
                          type="number"
                          value={talents.talentScrollLvl1.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              talentScrollLvl1: { ...prev.talentScrollLvl1, count: newCount }
                            }))
                            syncTalentsToInventory('talentScrollLvl1', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400">Average: ~3 exp each</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fixed Talent Scrolls */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Fixed Talent Scrolls</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Basic Talent Scroll (50 exp)</Label>
                        <Input
                          type="number"
                          value={talents.basicTalentScroll.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              basicTalentScroll: { ...prev.basicTalentScroll, count: newCount }
                            }))
                            syncTalentsToInventory('basicTalentScroll', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Fine Talent Scroll (100 exp)</Label>
                        <Input
                          type="number"
                          value={talents.fineTalentScroll.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              fineTalentScroll: { ...prev.fineTalentScroll, count: newCount }
                            }))
                            syncTalentsToInventory('fineTalentScroll', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-300">Superior Talent Scroll (200 exp)</Label>
                        <Input
                          type="number"
                          value={talents.superiorTalentScroll.count}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0
                            setTalents(prev => ({
                              ...prev,
                              superiorTalentScroll: { ...prev.superiorTalentScroll, count: newCount }
                            }))
                            syncTalentsToInventory('superiorTalentScroll', newCount)
                          }}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Experience Display */}
                  <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Talent Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">Total Experience</div>
                        <div className="text-white">
                          {(() => {
                            const total = 
                              (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                              (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                              (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                              (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                              (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                              (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                              (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                              (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                            return total.toLocaleString();
                          })()} Exp
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">Stars Gained</div>
                        <div className="text-white">
                          {(() => {
                            const totalExp = 
                              (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                              (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                              (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                              (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                              (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                              (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                              (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                              (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                            const stars = Math.floor(totalExp / 200);
                            return stars.toLocaleString();
                          })()} Stars
                        </div>
                        <div className="text-gray-500 text-xs">(200 exp = 1 star)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-xs">DOM Bonus</div>
                        <div className="text-green-400">
                          {(() => {
                            const totalExp = 
                              (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                              (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                              (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                              (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                              (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                              (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                              (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                              (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                            const stars = Math.floor(totalExp / 200);
                            const levelData = domIncreasePerStarData.find(data => 250 >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
                            const domBonus = levelData.constant * stars;
                            return `+${domBonus.toLocaleString()}`;
                          })()} DOM
                        </div>
                        <div className="text-gray-500 text-xs">(Split across attributes)</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Attribute Scripts */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Attribute Scripts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Script Success Rate Calculations */}
                  {(() => {
                    const calculateScriptResults = (script) => {
                      if (script.selectedStar === 0 || script.quantity === 0) {
                        return {
                          expectedUpgrades: 0,
                          expectedStars: 0,
                          minStars: 0,
                          maxStars: 0,
                          attempts: 0
                        };
                      }
                      
                      const successRates = [1.0, 0.833, 0.666, 0.5, 0.333, 0.166]; // 100% to 16.6%
                      const rate = successRates[script.selectedStar - 1];
                      const expectedUpgrades = script.quantity * rate;
                      const expectedStars = expectedUpgrades * script.selectedStar;
                      
                      return {
                        expectedUpgrades: Math.round(expectedUpgrades * 100) / 100,
                        expectedStars: Math.round(expectedStars * 100) / 100,
                        minStars: Math.floor(expectedStars),
                        maxStars: Math.ceil(expectedStars),
                        attempts: script.quantity
                      };
                    };
                    
                    const getStarBonus = (wardenLevel, starCount) => {
                      const levelData = domIncreasePerStarData.find(data => wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
                      return levelData.constant * starCount;
                    };
                    
                    return (
                      <div className="space-y-6">
                        {/* High/Low Range Summary */}
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                          <h3 className="text-lg font-semibold text-white mb-2">Expected Script Results</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                              const script = talents[scriptKey];
                              const results = calculateScriptResults(script);
                              const bonus = getStarBonus(script.wardenLevel, results.expectedStars);
                              return (
                                <div key={scriptKey} className="text-center">
                                  <div className="text-gray-300 font-medium capitalize">{scriptKey.replace('Script', '')}</div>
                                  <div className="text-white">{results.minStars}-{results.maxStars} stars</div>
                                  <div className="text-gray-400 text-xs">~{results.expectedStars} expected</div>
                                  <div className="text-green-400 text-xs">+{bonus.toLocaleString()} dom</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Individual Script Controls */}
                        {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                          const script = talents[scriptKey];
                          const results = calculateScriptResults(script);
                          const attributeName = scriptKey.replace('Script', '');
                          
                          return (
                            <div key={scriptKey} className="space-y-4">
                              <h3 className="text-lg font-semibold text-white capitalize">{attributeName} Script</h3>
                              
                              {/* Warden Level Input */}
                              <div className="flex items-center space-x-4">
                                <Label className="text-gray-300">Warden Level:</Label>
                                <Input
                                  type="number"
                                  value={script.wardenLevel}
                                  onChange={(e) => setTalents(prev => ({
                                    ...prev,
                                    [scriptKey]: { ...prev[scriptKey], wardenLevel: parseInt(e.target.value) || 1 }
                                  }))}
                                  className="bg-gray-700 border-gray-600 text-white w-24"
                                  min="1"
                                  max="500"
                                />
                                <div className="text-gray-400 text-sm">
                                  Dom per star: {(() => {
                                    const levelData = domIncreasePerStarData.find(data => script.wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
                                    return levelData.constant.toLocaleString();
                                  })()}
                                </div>
                              </div>
                              
                              {/* Star Selection (Radio Buttons) */}
                              <div className="space-y-3">
                                <Label className="text-gray-300">Select Script Star Level:</Label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`${scriptKey}-none`}
                                      name={`${scriptKey}-star`}
                                      checked={script.selectedStar === 0}
                                      onChange={() => setTalents(prev => ({
                                        ...prev,
                                        [scriptKey]: { ...prev[scriptKey], selectedStar: 0, quantity: 0 }
                                      }))}
                                      className="text-red-600"
                                    />
                                    <Label htmlFor={`${scriptKey}-none`} className="text-gray-300">
                                      None
                                    </Label>
                                  </div>
                                  {[1, 2, 3, 4, 5, 6].map(star => {
                                    const successRate = [100, 83.3, 66.6, 50, 33.3, 16.6][star - 1];
                                    return (
                                      <div key={star} className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          id={`${scriptKey}-${star}`}
                                          name={`${scriptKey}-star`}
                                          checked={script.selectedStar === star}
                                          onChange={() => setTalents(prev => ({
                                            ...prev,
                                            [scriptKey]: { ...prev[scriptKey], selectedStar: star }
                                          }))}
                                          className="text-red-600"
                                        />
                                        <Label htmlFor={`${scriptKey}-${star}`} className="text-gray-300">
                                          {star}★ ({successRate}%)
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {/* Quantity Input */}
                              {script.selectedStar > 0 && (
                                <div className="flex items-center space-x-4">
                                  <Label className="text-gray-300">Number of Attempts:</Label>
                                  <Input
                                    type="number"
                                    value={script.quantity}
                                    onChange={(e) => setTalents(prev => ({
                                      ...prev,
                                      [scriptKey]: { ...prev[scriptKey], quantity: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="bg-gray-700 border-gray-600 text-white w-24"
                                    min="0"
                                    placeholder="0"
                                  />
                                  <div className="text-gray-400 text-sm">
                                    (How many {script.selectedStar}★ attempts)
                                  </div>
                                </div>
                              )}
                              
                              {/* Results Display */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-700/30 rounded">
                                <div>
                                  <div className="text-gray-400 text-xs">Total Attempts</div>
                                  <div className="text-white">{results.attempts}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-xs">Expected Upgrades</div>
                                  <div className="text-white">{results.expectedUpgrades}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-xs">Stars Gained</div>
                                  <div className="text-white">{results.expectedStars}</div>
                                </div>
                                <div>
                                  <div className="text-gray-400 text-xs">Dom Bonus</div>
                                  <div className="text-green-400">+{getStarBonus(script.wardenLevel, results.expectedStars).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Total Script Results */}
                        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                          <h3 className="text-lg font-semibold text-white mb-2">Total Script Benefits</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                              const script = talents[scriptKey];
                              const results = calculateScriptResults(script);
                              const bonus = getStarBonus(script.wardenLevel, results.expectedStars);
                              const attributeName = scriptKey.replace('Script', '');
                              
                              return (
                                <div key={scriptKey} className="text-center">
                                  <div className="text-gray-300 font-medium capitalize">{attributeName}</div>
                                  <div className="text-white">{results.expectedStars} stars</div>
                                  <div className="text-green-400">+{bonus.toLocaleString()} dom</div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-600">
                            <div className="text-center">
                              <div className="text-gray-300 font-medium">Total Expected Dom Gain</div>
                              <div className="text-xl text-green-400">
                                +{(() => {
                                  const total = ['strengthScript', 'allureScript', 'intellectScript', 'spiritScript']
                                    .reduce((sum, scriptKey) => {
                                      const script = talents[scriptKey];
                                      const results = calculateScriptResults(script);
                                      return sum + getStarBonus(script.wardenLevel, results.expectedStars);
                                    }, 0);
                                  return total.toLocaleString();
                                })()} Dom
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wardens Tab */}
          <TabsContent value="wardens">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-red-400">Wardens</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Special Wardens */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Special Wardens</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nyx" checked={hasNyx} onCheckedChange={setHasNyx} />
                      <Label htmlFor="nyx" className="text-yellow-400">
                        Nyx
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dracula" checked={hasDracula} onCheckedChange={setHasDracula} />
                      <Label htmlFor="dracula" className="text-yellow-400">
                        Dracula
                      </Label>
                    </div>
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
                      variant={activeWardenTab === "auras" ? "default" : "outline"}
                      onClick={() => setActiveWardenTab("auras")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Auras
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
                              {groupKey === "circus"
                                ? "Circus Wardens"
                                : groupKey === "tyrants"
                                  ? "Bloody Tyrants"
                                  : groupKey === "noir"
                                    ? "Monster Noir"
                                    : "Wild Hunt"}{" "}
                              ({wardenCounts[groupKey as keyof typeof wardenCounts]}/{groupKey === "noir" || groupKey === "hunt" ? 4 : 5})
                            </CardTitle>
                            <div>
                              <Label className="text-white">Number of {groupKey} wardens:</Label>
                              <Input
                                type="number"
                                min="0"
                                max={groupKey === "noir" || groupKey === "hunt" ? 4 : 5}
                                value={wardenCounts[groupKey as keyof typeof wardenCounts]}
                                onChange={(e) =>
                                  setWardenCounts((prev) => ({
                                    ...prev,
                                    [groupKey]: Number.parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 mt-1 bg-gray-600 border-gray-500 text-white"
                              />
                            </div>
                          </CardHeader>
                          {wardenCounts[groupKey as keyof typeof wardenCounts] > 0 && (
                            <CardContent>
                              <div className="grid grid-cols-2 gap-3">
                                {wardens.map((warden) => (
                                  <div key={warden.name} className="flex items-center gap-2 p-2 bg-gray-600/50 border border-gray-500 rounded">
                                    {/* Warden Image */}
                                    <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-gray-800/50 rounded">
                                      <img 
                                        src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                                        alt={warden.name}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    
                                  <Button
                                    variant={selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name) ? "default" : "outline"}
                                    onClick={() => handleWardenSelection(groupKey, warden.name)}
                                    disabled={
                                      !selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name) &&
                                      selectedWardens[groupKey as keyof typeof selectedWardens]?.length >= wardenCounts[groupKey as keyof typeof wardenCounts]
                                    }
                                      className={`p-4 h-auto flex flex-col items-start flex-1 ${
                                      selectedWardens[groupKey as keyof typeof selectedWardens]?.includes(warden.name)
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-gray-600 hover:bg-gray-500"
                                    }`}
                                  >
                                    <div className="font-semibold text-white">{warden.name}</div>
                                    <div className="flex gap-1 mt-1">
                                      {warden.attributes.map((attr) => (
                                        <span
                                          key={attr}
                                          className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}
                                        >
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

                  {/* Auras Tab */}
                  {activeWardenTab === "auras" && (
                    <div className="space-y-6">
                      {/* VIP Level Control */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-yellow-400">VIP Level Control</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <Label className="text-white">Current VIP Level:</Label>
                            <Input
                              type="number"
                              min="0"
                              max="12"
                              value={vipLevel}
                              onChange={(e) => setVipLevel(Number.parseInt(e.target.value) || 0)}
                              className="w-20 bg-gray-600 border-gray-500 text-white"
                            />
                            <span className="text-gray-300 text-sm">
                              (Controls which VIP wardens are visible)
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Special Wardens & Paid Packs */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-purple-400">Special Wardens & Paid Packs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox id="nyx-aura" checked={hasNyx} onCheckedChange={setHasNyx} />
                              <Label htmlFor="nyx-aura" className="text-yellow-400">Nyx</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="dracula-aura" checked={hasDracula} onCheckedChange={setHasDracula} />
                              <Label htmlFor="dracula-aura" className="text-red-400">Dracula</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="victor-aura" checked={hasVictor} onCheckedChange={setHasVictor} />
                              <Label htmlFor="victor-aura" className="text-green-400">Victor (Paid Pack)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="frederick-aura" checked={hasFrederick} onCheckedChange={setHasFrederick} />
                              <Label htmlFor="frederick-aura" className="text-blue-400">Frederick (Paid Pack)</Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Wild Hunt Wardens */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-green-400">Wild Hunt Wardens (Macabrian Coins)</CardTitle>
                          <div className="text-sm text-gray-300">Cost: 490 coins per warden to max (Level 20)</div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(auras.wildHunt).map(([wardenName, wardenData]) => (
                              <div key={wardenName} className="space-y-2">
                                <Label className="text-white font-semibold">{wardenName}</Label>
                                <div className="text-sm text-gray-300">{wardenData.type}</div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm text-gray-300">Level:</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={wardenData.current}
                                    onChange={(e) =>
                                      setAuras((prev) => ({
                                        ...prev,
                                        wildHunt: {
                                          ...prev.wildHunt,
                                          [wardenName]: {
                                            ...prev.wildHunt[wardenName],
                                            current: Number.parseInt(e.target.value) || 1,
                                          },
                                        },
                                      }))
                                    }
                                    className="w-16 bg-gray-600 border-gray-500 text-white text-sm"
                                  />
                                  <span className="text-sm text-gray-400">
                                    ({wardenData.baseValue + (wardenData.current - 1) * wardenData.increment}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Monster Noir Wardens */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-purple-400">Monster Noir Wardens (City Badges)</CardTitle>
                          <div className="text-sm text-gray-300">Cost: 500 badges per warden to max (Level 20)</div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(auras.monsterNoir).map(([wardenName, wardenData]) => (
                              <div key={wardenName} className="space-y-2">
                                <Label className="text-white font-semibold">{wardenName}</Label>
                                <div className="text-sm text-gray-300">{wardenData.type}</div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm text-gray-300">Level:</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={wardenData.current}
                                    onChange={(e) =>
                                      setAuras((prev) => ({
                                        ...prev,
                                        monsterNoir: {
                                          ...prev.monsterNoir,
                                          [wardenName]: {
                                            ...prev.monsterNoir[wardenName],
                                            current: Number.parseInt(e.target.value) || 1,
                                          },
                                        },
                                      }))
                                    }
                                    className="w-16 bg-gray-600 border-gray-500 text-white text-sm"
                                  />
                                  <span className="text-sm text-gray-400">
                                    ({wardenData.baseValue + (wardenData.current - 1) * wardenData.increment}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Bloody Tyrants Wardens */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-red-400">Bloody Tyrants Wardens (Supremacy Badges)</CardTitle>
                          <div className="text-sm text-gray-300">Cost: 500 badges per warden to max (Level 20)</div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(auras.bloodyTyrants).map(([wardenName, wardenData]) => (
                              <div key={wardenName} className="space-y-2">
                                <Label className="text-white font-semibold">{wardenName}</Label>
                                <div className="text-sm text-gray-300">{wardenData.type}</div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm text-gray-300">Level:</Label>
                                  <Input
                                    type="number"
                                    min={wardenName === "Maria" ? "1" : "1"}
                                    max="20"
                                    value={wardenData.current}
                                    onChange={(e) =>
                                      setAuras((prev) => ({
                                        ...prev,
                                        bloodyTyrants: {
                                          ...prev.bloodyTyrants,
                                          [wardenName]: {
                                            ...prev.bloodyTyrants[wardenName],
                                            current: Number.parseInt(e.target.value) || 1,
                                          },
                                        },
                                      }))
                                    }
                                    className="w-16 bg-gray-600 border-gray-500 text-white text-sm"
                                  />
                                  <span className="text-sm text-gray-400">
                                    ({wardenData.baseValue + (wardenData.current - 1) * wardenData.increment}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Cirque du Macabre Wardens */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-orange-400">Cirque du Macabre Wardens (Circus Tickets)</CardTitle>
                          <div className="text-sm text-gray-300">Cost: 500 tickets per warden to max (Level 20)</div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(auras.cirque).map(([wardenName, wardenData]) => (
                              <div key={wardenName} className="space-y-2">
                                <Label className="text-white font-semibold">{wardenName}</Label>
                                <div className="text-sm text-gray-300">{wardenData.type}</div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm text-gray-300">Level:</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={wardenData.current}
                                    onChange={(e) =>
                                      setAuras((prev) => ({
                                        ...prev,
                                        cirque: {
                                          ...prev.cirque,
                                          [wardenName]: {
                                            ...prev.cirque[wardenName],
                                            current: Number.parseInt(e.target.value) || 1,
                                          },
                                        },
                                      }))
                                    }
                                    className="w-16 bg-gray-600 border-gray-500 text-white text-sm"
                                  />
                                  <span className="text-sm text-gray-400">
                                    ({wardenData.baseValue + (wardenData.current - 1) * wardenData.increment}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* VIP Wardens */}
                      {vipLevel > 0 && (
                        <Card className="bg-gray-700/50 border-yellow-500">
                          <CardHeader>
                            <CardTitle className="text-yellow-400">VIP Wardens</CardTitle>
                            <div className="text-sm text-gray-300">Available based on your VIP level: {vipLevel}</div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(auras.vip)
                                .filter(([_, wardenData]) => vipLevel >= wardenData.vipRequired)
                                .map(([wardenName, wardenData]) => (
                                <div key={wardenName} className="space-y-2">
                                  <Label className="text-white font-semibold">{wardenName} (VIP {wardenData.vipRequired})</Label>
                                  {wardenData.talents ? (
                                    <>
                                      <div className="text-sm text-gray-300">{wardenData.talents.type}</div>
                                      <div className="text-sm text-yellow-400">Talents: {wardenData.talents.current}%</div>
                                      <div className="text-sm text-gray-300">{wardenData.books.type}</div>
                                      <div className="text-sm text-yellow-400">Books: {wardenData.books.current}%</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="text-sm text-gray-300">{wardenData.type}</div>
                                      <div className="text-sm text-yellow-400">Value: {wardenData.current}%</div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Paid Pack Wardens */}
                      {(hasVictor || hasFrederick) && (
                        <Card className="bg-gray-700/50 border-green-500">
                          <CardHeader>
                            <CardTitle className="text-green-400">Paid Pack Wardens</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {hasVictor && (
                                <div className="space-y-2">
                                  <Label className="text-white font-semibold">Victor</Label>
                                  <div className="text-sm text-gray-300">{auras.paidPacks.Victor.type}</div>
                                  <div className="text-sm text-green-400">Value: {auras.paidPacks.Victor.current}%</div>
                                </div>
                              )}
                              {hasFrederick && (
                                <div className="space-y-2">
                                  <Label className="text-white font-semibold">Frederick</Label>
                                  <div className="text-sm text-gray-300">{auras.paidPacks.Frederick.talents.type}</div>
                                  <div className="text-sm text-blue-400">Talents: {auras.paidPacks.Frederick.talents.current}%</div>
                                  <div className="text-sm text-gray-300">{auras.paidPacks.Frederick.books.type}</div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-gray-300">Books Level:</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="20"
                                      value={auras.paidPacks.Frederick.books.current}
                                      onChange={(e) =>
                                        setAuras((prev) => ({
                                          ...prev,
                                          paidPacks: {
                                            ...prev.paidPacks,
                                            Frederick: {
                                              ...prev.paidPacks.Frederick,
                                              books: {
                                                ...prev.paidPacks.Frederick.books,
                                                current: Number.parseInt(e.target.value) || 1,
                                              },
                                            },
                                          },
                                        }))
                                      }
                                      className="w-16 bg-gray-600 border-gray-500 text-white text-sm"
                                    />
                                    <span className="text-sm text-gray-400">
                                      ({auras.paidPacks.Frederick.books.baseValue + (auras.paidPacks.Frederick.books.current - 1) * auras.paidPacks.Frederick.books.increment}%)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Special Wardens */}
                      {(hasNyx || hasDracula) && (
                        <Card className="bg-gray-700/50 border-purple-500">
                          <CardHeader>
                            <CardTitle className="text-purple-400">Special Wardens</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {hasDracula && (
                                <div className="space-y-2">
                                  <Label className="text-white font-semibold">Dracula</Label>
                                  <div className="text-sm text-gray-300">{auras.special.Dracula.talents.type}</div>
                                  <div className="text-sm text-red-400">Talents: {auras.special.Dracula.talents.current}%</div>
                                  <div className="text-sm text-gray-300">{auras.special.Dracula.books.type}</div>
                                  <div className="text-sm text-red-400">Books: {auras.special.Dracula.books.current}%</div>
                                  <div className="text-xs text-gray-400">Cost: ~1530 Blood Origin Necklaces</div>
                                </div>
                              )}
                              {hasNyx && (
                                <div className="space-y-2">
                                  <Label className="text-white font-semibold">Nyx</Label>
                                  <div className="text-sm text-gray-300">{auras.special.Nyx.talents.type}</div>
                                  <div className="text-sm text-yellow-400">Talents: {auras.special.Nyx.talents.current}%</div>
                                  <div className="text-sm text-gray-300">{auras.special.Nyx.books.type}</div>
                                  <div className="text-sm text-yellow-400">Books: {auras.special.Nyx.books.current}%</div>
                                  <div className="text-xs text-gray-400">Cost: ~720 Arena Trophies</div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Warden Stats Tab */}
                  {activeWardenTab === "stats" && (
                    <div className="space-y-4">
                      {/* Upload Section */}
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-blue-400">Upload Warden Data</CardTitle>
                          <div className="text-sm text-gray-300">
                            Upload files named after your wardens containing their attribute breakdowns:
                            <ul className="mt-2 list-disc list-inside">
                              <li><strong>Screenshots (PNG/JPG):</strong> "Diana.png", "Scarlet.jpg" - Uses OCR to extract text</li>
                              <li><strong>Text files:</strong> "Diana.txt", "Scarlet.json" - Parses text directly</li>
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
                              <div className="text-yellow-400">
                                {ocrProgress || "Uploading and parsing files..."}
                              </div>
                            )}
                            {uploadError && (
                              <div className="text-red-400 text-sm">
                                {uploadError}
                              </div>
                            )}
                            {Object.keys(uploadedWardenData).length > 0 && (
                              <div className="text-green-400 text-sm">
                                Successfully uploaded data for: {Object.keys(uploadedWardenData).join(', ')}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Uploaded Warden Data Section */}
                      {Object.keys(uploadedWardenData).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold text-white">Uploaded Warden Data</h3>
                          {Object.entries(uploadedWardenData).map(([wardenName, data]) => (
                            <Card key={wardenName} className="bg-gray-700/50 border-gray-600">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                  <span className="text-white">{wardenName}</span>
                                  <span className="text-yellow-400 text-sm">
                                    Total: {data.totalAttributes >= 1000000 
                                      ? `${(data.totalAttributes / 1000000).toFixed(2)}M` 
                                      : data.totalAttributes >= 1000 
                                        ? `${(data.totalAttributes / 1000).toFixed(2)}K` 
                                        : data.totalAttributes.toLocaleString()}
                                  </span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {["strength", "allure", "intellect", "spirit"].map((attr) => {
                                    const attrData = data[attr as keyof typeof data]
                                    if (typeof attrData === 'object' && attrData.total !== undefined) {
                                      return (
                                        <div key={attr} className="space-y-3">
                                          <div className={`font-semibold capitalize ${getAttributeColor(attr)} text-lg`}>
                                            {attr}
                                          </div>
                                          <div className="space-y-2">
                                            <div>
                                              <Label className="text-sm text-gray-300">Total</Label>
                                              <Input
                                                type="number"
                                                value={attrData.total}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        total: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Talent Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.talentBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        talentBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Book Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.bookBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        bookBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Scarlet Bond Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.scarletBondBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        scarletBondBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Presence Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.presenceBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        presenceBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Aura Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.auraBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        auraBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Conclave Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.conclaveBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        conclaveBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Avatar Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.avatarBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        avatarBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-300">Familiar Bonus</Label>
                                              <Input
                                                type="number"
                                                value={attrData.familiarBonus}
                                                onChange={(e) => {
                                                  const newValue = Number.parseInt(e.target.value) || 0
                                                  setUploadedWardenData(prev => ({
                                                    ...prev,
                                                    [wardenName]: {
                                                      ...prev[wardenName],
                                                      [attr]: {
                                                        ...prev[wardenName][attr as keyof typeof prev[typeof wardenName]],
                                                        familiarBonus: newValue
                                                      }
                                                    }
                                                  }))
                                                }}
                                                className="mt-1 bg-gray-600 border-gray-500 text-white"
                                              />
                                            </div>
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
                              // Check if warden is selected in summons tab or is VIP
                              const isSelected = selectedWardens[warden.group as keyof typeof selectedWardens]?.includes(warden.name) || 
                                                warden.name === "Nyx" || warden.name === "Dracula"
                              
                              return (
                                <Card key={warden.name} className="bg-gray-600/50 border-gray-500">
                                  <CardContent className="p-2">
                                    <div className="flex gap-2">
                                      {/* Warden Image */}
                                      <div className="w-32 h-full flex-shrink-0 flex items-center justify-center">
                                        <img 
                                          src={`/Gov/Wardens/BaseWardens/${warden.name}.png`}
                                          alt={warden.name}
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Warden Info and Stats */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-white font-semibold text-sm">{warden.name}</span>
                                          {isSelected && (
                                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                              Owned
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Attributes */}
                                        <div className="flex gap-1 mb-2">
                                    {warden.attributes.map((attr) => (
                                      <span
                                        key={attr}
                                        className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}
                                      >
                                        {attr}
                                      </span>
                                    ))}
                                  </div>
                                        
                                        {/* Stats Inputs */}
                                        <div className="space-y-1">
                                  {["strength", "allure", "intellect", "spirit"].map((attr) => (
                                            <div key={attr} className="flex items-center gap-1">
                                              <span className={`text-xs w-12 ${getAttributeColor(attr)}`}>
                                                {attr.charAt(0).toUpperCase()}
                                              </span>
                                      <Input
                                        type="number"
                                                placeholder="0"
                                                className="w-16 h-6 text-xs bg-gray-700 border-gray-600 text-white"
                                                value={wardenStats[warden.name]?.[attr] || ''}
                                                onChange={(e) => {
                                                  const value = Number.parseInt(e.target.value) || 0
                                                  setWardenStats(prev => ({
                                            ...prev,
                                                    [warden.name]: {
                                                      ...prev[warden.name],
                                                      [attr]: value
                                                    }
                                                  }))
                                                }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                      </div>
                                      
                                      {/* Skins Section */}
                                      {warden.skins.length > 0 && (
                                        <div className="w-24 flex-shrink-0">
                                          <div className="text-xs text-gray-300 mb-1">Skins:</div>
                                          <div className="space-y-2">
                                            {warden.skins.map((skin) => (
                                              <div key={skin} className="flex flex-col items-center gap-1">
                                                {/* Skin Image */}
                                                <div className="w-16 h-16 flex items-center justify-center">
                                                  <img 
                                                    src={`/Gov/Wardens/WardenSkins/${skin}.png`}
                                                    alt={skin}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                  />
                                                </div>
                                                {/* Skin Checkbox */}
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scarlet Bond Tab */}
          <TabsContent value="scarlet-bond">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-red-400">Scarlet Bond</CardTitle>
                {/* PSA Banner */}
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-3 mt-4">
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-400 font-bold text-sm">⚠️ PSA:</div>
                    <div className="text-yellow-200 text-sm">
                      Most numbers past level 100 are not 100% accurate yet. We're still collecting and verifying data for higher levels.
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lovers Section */}
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-pink-400">Lovers (Need to be Summoned)</CardTitle>
                      <div className="text-sm text-gray-300">
                        Select which lovers you have summoned. Each increases ALL lover scarlet bond bonuses for their attribute.
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="agneyi" 
                            checked={hasAgneyi} 
                            onCheckedChange={setHasAgneyi}
                            className="border-gray-400"
                          />
                          <Label htmlFor="agneyi" className="text-red-400 font-medium">
                            Agneyi (Strength Scarlet Bond Aura)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="culann" 
                            checked={hasCulann} 
                            onCheckedChange={setHasCulann}
                            className="border-gray-400"
                          />
                          <Label htmlFor="culann" className="text-green-400 font-medium">
                            Culann (Intellect Scarlet Bond Aura)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="hela" 
                            checked={hasHela} 
                            onCheckedChange={setHasHela}
                            className="border-gray-400"
                          />
                          <Label htmlFor="hela" className="text-blue-400 font-medium">
                            Hela (Spirit Scarlet Bond Aura)
                          </Label>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                          Summonable with Coins
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-gray-600/50 rounded">
                        <div className="text-sm text-gray-300">
                          <strong>Lover Aura System:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>1 Lover: +20% to ALL lover scarlet bond bonuses for their attribute</li>
                            <li>2 Lovers: +25% to ALL lover scarlet bond bonuses for their attributes</li>
                            <li>3 Lovers: +30% to ALL lover scarlet bond bonuses for their attributes</li>
                          </ul>
                        </div>
                        <div className="text-sm text-yellow-400 mt-2">
                          Currently: {[hasAgneyi, hasCulann, hasHela].filter(Boolean).length}/3 lovers summoned
                          {(() => {
                            const canSummonAgneyi = hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100
                            const canSummonCulann = hasCulann || (inventory['CulannToken']?.count || 0) >= 100
                            const canSummonHela = hasHela || (inventory['HelaToken']?.count || 0) >= 100
                            const tokenSummoned = [canSummonAgneyi, canSummonCulann, canSummonHela].filter(Boolean).length
                            const checkboxSummoned = [hasAgneyi, hasCulann, hasHela].filter(Boolean).length
                            
                            if (tokenSummoned > checkboxSummoned) {
                              return (
                                <div className="text-green-400 text-xs mt-1">
                                  (Can summon {tokenSummoned - checkboxSummoned} more with tokens)
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scarlet Bond Totals Summary */}
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-orange-400">Scarlet Bond Totals</CardTitle>
                      <div className="text-sm text-gray-300">
                        Current bonuses from your scarlet bond levels
                      </div>
                      {suggestedIncrease.increaseDom > 0 && (
                        <div className="text-green-400 text-sm font-bold mt-2">
                          Total DOM from suggestions: +{suggestedIncrease.increaseDom.toLocaleString()}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {attributeOrder.map((attr) => (
                          <div key={attr} className={`p-3 rounded ${getAttributeBg(attr)}`}>
                            <div className="text-center">
                              <div className={`font-bold text-lg ${getAttributeColor(attr)} capitalize`}>
                                {attr}
                              </div>
                              <div className="text-white font-medium">
                                {currentScarletBondBonuses[`current${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof currentScarletBondBonuses]?.toLocaleString() || 0}
                                {optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses] > 0 && (
                                  <span className="text-green-400 ml-2">
                                    +{optimizedBonuses[`optimized${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof optimizedBonuses].toLocaleString()}
                                  </span>
                                )}
                                {suggestedIncrease[`increase${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof suggestedIncrease] > 0 && (
                                  <div className="text-green-400 text-sm mt-1 font-bold">
                                    [+{suggestedIncrease[`increase${attr.charAt(0).toUpperCase() + attr.slice(1)}` as keyof typeof suggestedIncrease].toLocaleString()} from suggestions]
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {scarletBondData
                    .filter((bond) => {
                      if (bond.vip > vipLevel) return false
                      return true // Show all bonds that meet VIP requirement
                    })
                    .map((bond) => {
                      const wardenData = wardenAttributes[bond.warden as keyof typeof wardenAttributes]
                      const bondKey = `${bond.lover}-${bond.warden}`

                      return (
                        <Card key={bondKey} className="bg-gray-700/50 border-gray-600">
                          <div className="flex">
                            {/* Lover Images - Left Side */}
                            <div className="w-56 h-80 flex-shrink-0 flex">
                              {(() => {
                                  if (bond.lover.includes('/')) {
                                  const names = bond.lover.split('/').map(s => s.trim());
                                  const sameName = names[0].toLowerCase() === names[1].toLowerCase();
                                  // If same name (e.g., Raven/Raven), use female/male suffix files, female first
                                  if (sameName) {
                                    const ordered = [names[0], names[1]]; // keep given order; we’ll render female first below
                                    return ordered.map((name, index) => {
                                      const base = name.toLowerCase();
                                      const genderSuffix = index === 0 ? 'female' : 'male';
                                      const imageName = `${base}${genderSuffix}`;
                                      return (
                                        <div key={`${name}-${index}`} className="w-1/2 h-full flex items-center justify-center">
                                          <img 
                                            src={`/Gov/Lovers/BaseLovers/${imageName}.png`}
                                            alt={name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement;
                                              if (!img.src.includes('.PNG')) {
                                                img.src = `/Gov/Lovers/BaseLovers/${imageName}.PNG`;
                                              } else {
                                                img.style.display = 'none';
                                              }
                                            }}
                                          />
                                        </div>
                                      );
                                    });
                                  }
                                  // Different names (e.g., April/Axel): use images by exact names
                                  return names.map((name) => (
                                    <div key={name} className="w-1/2 h-full flex items-center justify-center">
                                      <img 
                                        src={`/Gov/Lovers/BaseLovers/${name}.PNG`}
                                        alt={name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          if (!img.src.includes('.png')) {
                                            img.src = `/Gov/Lovers/BaseLovers/${name}.png`;
                                          } else {
                                            img.style.display = 'none';
                                          }
                                        }}
                                      />
                                    </div>
                                  ));
                                } else {
                                  // Single lover - center the image
                                  return (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <img 
                                          src={`/Gov/Lovers/BaseLovers/${bond.lover}.PNG`}
                                          alt={bond.lover}
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            // Try different naming patterns
                                            if (!img.src.includes('.png')) {
                                              img.src = `/Gov/Lovers/BaseLovers/${bond.lover}.png`;
                                            } else if (!img.src.includes('.jpg')) {
                                              img.src = `/Gov/Lovers/BaseLovers/${bond.lover}.jpg`;
                                            } else if (!img.src.includes('_')) {
                                              // Try with underscore
                                              img.src = `/Gov/Lovers/BaseLovers/${bond.lover.replace(/([A-Z])/g, '_$1').toLowerCase()}.PNG`;
                                            } else {
                                              img.style.display = 'none';
                                            }
                                          }}
                                        />
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Content - Right Side */}
                            <div className="flex-1 min-w-0">
                              <CardHeader className="pb-0 pt-2">
                                <CardTitle className="flex items-center gap-1 flex-wrap text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className="flex flex-col gap-0">
                                      <span className="text-white text-xs font-bold">
                                        {bond.lover}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-300 text-xs">with</span>
                                        <span className="text-white font-semibold text-xs">
                                          {bond.warden}
                                        </span>
                                    {/* Warden Image - Inline with both names */}
                                        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                                          <img 
                                            src={`/Gov/Wardens/BaseWardens/${bond.warden}.png`}
                                            alt={bond.warden}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              // Fallback if image doesn't exist
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      bond.type === "All"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : bond.type === "Dual"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : "bg-blue-500/20 text-blue-400"
                                    }`}
                                  >
                                    {bond.type}
                                  </span>
                                  {bond.vip === 0 && (
                                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                      Summonable
                                    </span>
                                  )}
                                  {wardenData && (
                                    <div className="flex gap-1">
                                      {wardenData.map((attr) => (
                                        <span
                                          key={attr}
                                          className={`text-xs px-2 py-1 rounded ${getAttributeBg(attr)} ${getAttributeColor(attr)}`}
                                        >
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="ml-auto flex flex-col gap-2">
                                    <Label className="text-white text-sm">Affinity Points</Label>
                                    <Input
                                      type="number"
                                      value={scarletBondAffinity[bondKey] || 0}
                                      onChange={(e) =>
                                        setScarletBondAffinity((prev) => ({
                                          ...prev,
                                          [bondKey]: Number.parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      className="w-24 bg-gray-600 border-gray-500 text-white text-sm"
                                      placeholder="0"
                                    />
                                    <div className="text-xs text-gray-400">
                                      Suggestions shown automatically
                                    </div>
                                  </div>
                                </CardTitle>
                              </CardHeader>
                          <CardContent className="pt-0 pb-2">
                            <div className="grid grid-cols-8 gap-2">
                              {["strength", "allure", "intellect", "spirit"].map((attr) => {
                                const isMainStat = wardenData?.some(
                                  (a) => a.toLowerCase() === attr || a === "Balance",
                                )
                                
                                // Calculate suggested upgrades for this bond (only for main attributes)
                                const suggestedUpgrades = calculateSuggestedUpgrades(bondKey, scarletBondAffinity[bondKey] || 0)
                                const flatSuggestion = isMainStat ? suggestedUpgrades[`${attr}Level`] : null
                                const percentSuggestion = isMainStat ? suggestedUpgrades[`${attr}Percent`] : null
                                
                                // Calculate the contribution for this attribute from this bond
                                const contribution = calculateScarletBondContribution(bondKey, attr)
                                
                                return (
                                  <div key={attr} className="col-span-2">
                                    {/* Total Current Amount - Above inputs */}
                                    <div className="text-center mb-1">
                                      <div className={`text-sm font-bold ${getAttributeColor(attr)}`}>
                                        {contribution.totalBonus}
                                      </div>
                                      <div className="text-xs text-gray-400 capitalize">
                                        {attr}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label className={`capitalize text-xs ${getAttributeColor(attr)}`}>
                                        {attr} Flat
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="205"
                                          value={(scarletBond[bondKey] as any)?.[`${attr}Level`] || 0}
                                          onChange={(e) =>
                                            setScarletBond((prev) => ({
                                              ...prev,
                                              [bondKey]: {
                                                ...prev[bondKey],
                                                [`${attr}Level`]: Number.parseInt(e.target.value) || 0,
                                              },
                                            }))
                                          }
                                          className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                          placeholder="Level"
                                          disabled={false}
                                        />
                                        {flatSuggestion && (
                                          <div className="text-xs text-green-400">
                                            +{flatSuggestion.increase} ({flatSuggestion.newLevel})
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className={`capitalize text-xs ${getAttributeColor(attr)}`}>
                                        {attr} %
                                      </Label>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="205"
                                          value={(scarletBond[bondKey] as any)?.[`${attr}Percent`] || 0}
                                          onChange={(e) =>
                                            setScarletBond((prev) => ({
                                              ...prev,
                                              [bondKey]: {
                                                ...prev[bondKey],
                                                [`${attr}Percent`]: Number.parseInt(e.target.value) || 0,
                                              },
                                            }))
                                          }
                                          className="w-full bg-gray-600 border-gray-500 text-white text-xs"
                                          placeholder="%"
                                          disabled={false}
                                        />
                                        {percentSuggestion && (
                                          <div className="text-xs text-green-400">
                                            +{percentSuggestion.increase} ({percentSuggestion.newLevel})
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Bonus Amount - Below inputs */}
                                    {contribution.loverMultiplier > 0 && (
                                      <div className="text-center mt-1">
                                        <div className="text-xs text-orange-400">
                                          +{contribution.loverMultiplier}% lover bonus
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <div className="space-y-6">
              {/* Inventory Tabs */}
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

                {/* Inventory Image Upload */}
                <Card className="bg-gray-800/50 border-gray-600 mt-4">
                  <CardHeader>
                    <CardTitle className="text-blue-400">📸 Upload Inventory Images</CardTitle>
                    <div className="text-sm text-gray-300">
                      Upload images of your inventory items to track them visually
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          multiple
                          accept=".png,.jpg,.jpeg"
                          onChange={handleInventoryImageUpload}
                          disabled={isProcessingInventory}
                          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:disabled:bg-gray-500"
                        />
                      </div>
                      {isProcessingInventory && (
                        <div className="text-yellow-400">
                          {inventoryProgress || "Processing images..."}
                        </div>
                      )}
                      {inventoryError && (
                        <div className="text-red-400 text-sm">
                          {inventoryError}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                 {/* All Items Tab */}
                 <TabsContent value="all" className="mt-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                       <CardTitle className="text-green-400">All Items</CardTitle>
                  <div className="text-sm text-gray-300">
                         {Object.keys(inventory).length === 0 ? 'No items in inventory' : `${Object.keys(inventory).length} items tracked`}
                  </div>
                </CardHeader>
                <CardContent>
                       {Object.keys(inventory).length === 0 ? (
                         <div className="text-center text-gray-400 py-8">
                           No items in inventory
                         </div>
                       ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {Object.entries(inventory).map(([itemName, itemData]) => (
                             <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                               <img
                                 src={inventoryImages[itemName] || `/InventoryAssets/${getItemCategory(itemName)}/${itemName}.PNG`}
                                 alt={itemName}
                                 className="w-20 h-20 object-contain"
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none'
                                 }}
                               />
                               <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                               <div className="flex items-center space-x-2">
                                 <Button
                                   size="sm"
                                   onClick={() => updateInventoryItem(itemName, Math.max(0, itemData.count - 1))}
                                   className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                                 >
                                   -
                                 </Button>
                                 <input
                                   type="number"
                                   value={itemData.count}
                                   onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                   className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                                 />
                                 <Button
                                   size="sm"
                                   onClick={() => updateInventoryItem(itemName, itemData.count + 1)}
                                   className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                 >
                                   +
                                 </Button>
                        </div>
                      </div>
                           ))}
                      </div>
                    )}
                     </CardContent>
                   </Card>
                 </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Resources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {Object.entries(groupItemsByType(getItemsByCategory('Resources'))).map(([type, items]) => (
                          <div key={type}>
                            <h3 className="text-lg font-semibold text-blue-400 mb-4">{type}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {items.map((itemName) => (
                          <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                            <img 
                              src={`/InventoryAssets/Resources/${itemName}.PNG`} 
                              alt={itemName}
                              className="w-20 h-20 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                              >
                                -
                              </Button>
                              <input
                                type="number"
                                value={inventory[itemName]?.count || 0}
                                onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                              >
                                +
                              </Button>
                                  </div>
                                </div>
                              ))}
                      </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Warden Items Tab */}
                <TabsContent value="warden-items" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Warden Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {Object.entries(groupItemsByType(getItemsByCategory('WardenItems'))).map(([type, items]) => (
                          <div key={type}>
                            <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">
                              {type}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {items.map((itemName) => (
                                <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                                  <img 
                                    src={`/InventoryAssets/WardenItems/${itemName}.PNG`} 
                                    alt={itemName}
                                    className="w-20 h-20 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                      className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                                    >
                                      -
                                    </Button>
                                    <input
                            type="number"
                                      value={inventory[itemName]?.count || 0}
                                      onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lover & Child Items Tab */}
                <TabsContent value="lover-child" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Lover & Child Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {Object.entries(groupItemsByType(getItemsByCategory('Lover+ChildItems'))).map(([type, items]) => (
                          <div key={type}>
                            <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">
                              {type}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {items.map((itemName) => (
                                <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                                  <img 
                                    src={`/InventoryAssets/Lover+ChildItems/${itemName}.PNG`} 
                                    alt={itemName}
                                    className="w-20 h-20 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                      className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                                    >
                                      -
                                    </Button>
                                    <input
                                      type="number"
                                      value={inventory[itemName]?.count || 0}
                                      onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Familiar Items Tab */}
                <TabsContent value="familiar" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Familiar Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {getItemsByCategory('FamiliarItems').map((itemName) => (
                          <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                            <img 
                              src={`/InventoryAssets/FamiliarItems/${itemName}.PNG`} 
                              alt={itemName}
                              className="w-20 h-20 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                              >
                                -
                              </Button>
                              <input
                                type="number"
                                value={inventory[itemName]?.count || 0}
                                onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Misc Items Tab */}
                <TabsContent value="misc" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Misc Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {Object.entries(groupItemsByType(getItemsByCategory('MiscItems'))).map(([type, items]) => (
                          <div key={type}>
                            <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">
                              {type}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {items.map((itemName) => (
                                <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                                  <img 
                                    src={`/InventoryAssets/MiscItems/${itemName}.PNG`} 
                                    alt={itemName}
                                    className="w-20 h-20 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                      className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                                    >
                                      -
                                    </Button>
                                    <input
                                      type="number"
                                      value={inventory[itemName]?.count || 0}
                                      onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Warden Equipment Tab */}
                <TabsContent value="warden-equip" className="mt-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-green-400">Warden Equipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {Object.entries(organizeEquipmentBySets(getItemsByCategory('WardenEquip'))).map(([setName, items]) => (
                          <div key={setName}>
                            <h3 className="text-lg font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">
                              {setName}
                            </h3>
                            <div className={`grid gap-4 ${setName === 'Dusk' ? 'grid-cols-4 justify-start' : 'grid-cols-4'}`}>
                              {items.map((itemName) => (
                                <div key={itemName} className="bg-gray-700/50 rounded-lg p-3 flex flex-col items-center space-y-2">
                                  <img 
                                    src={`/InventoryAssets/WardenEquip/${itemName}.PNG`} 
                                    alt={itemName}
                                    className="w-20 h-20 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                  <div className="text-white font-medium text-sm text-center">{formatItemName(itemName)}</div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, Math.max(0, (inventory[itemName]?.count || 0) - 1))}
                                      className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 h-6"
                                    >
                                      -
                                    </Button>
                                    <input
                                      type="number"
                                      value={inventory[itemName]?.count || 0}
                                      onChange={(e) => updateInventoryItem(itemName, Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-16 text-center text-sm font-bold text-yellow-400 bg-gray-800 border border-gray-600 rounded px-1 py-1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => updateInventoryItem(itemName, (inventory[itemName]?.count || 0) + 1)}
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <div className="space-y-6">
              {/* Current Modifiers */}
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-red-400">Current Modifiers & Multipliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-3">Book Multipliers</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p className="text-white">
                          <span className="text-blue-400">Strength Books:</span>{" "}
                                                          {calculateTotalConclaveBonus().bookMultipliers.strength.toFixed(1)}%
                        </p>
                        <p className="text-white">
                          <span className="text-blue-400">Allure Books:</span>{" "}
                                                          {calculateTotalConclaveBonus().bookMultipliers.allure.toFixed(1)}%
                        </p>
                        <p className="text-white">
                          <span className="text-blue-400">Intellect Books:</span>{" "}
                                                          {calculateTotalConclaveBonus().bookMultipliers.intellect.toFixed(1)}%
                        </p>
                        <p className="text-white">
                          <span className="text-blue-400">Spirit Books:</span>{" "}
                                                          {calculateTotalConclaveBonus().bookMultipliers.spirit.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-3">Warden Bonuses (per warden)</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p className="text-white">
                          <span className="text-green-400">Strength Wardens:</span>{" "}
                          +{calculateTotalConclaveBonus().wardenBonuses.strength.toLocaleString()} DOM each
                        </p>
                        <p className="text-white">
                          <span className="text-green-400">Allure Wardens:</span>{" "}
                          +{calculateTotalConclaveBonus().wardenBonuses.allure.toLocaleString()} DOM each
                        </p>
                        <p className="text-white">
                          <span className="text-green-400">Intellect Wardens:</span>{" "}
                          +{calculateTotalConclaveBonus().wardenBonuses.intellect.toLocaleString()} DOM each
                        </p>
                        <p className="text-white">
                          <span className="text-green-400">Spirit Wardens:</span>{" "}
                          +{calculateTotalConclaveBonus().wardenBonuses.spirit.toLocaleString()} DOM each
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-600 pt-4">
                      <h3 className="text-yellow-400 font-semibold mb-3">How Conclave Bonuses Work</h3>
                      <div className="text-sm text-gray-300 space-y-2">
                        <p>
                          <span className="text-blue-400 font-medium">Book Multipliers:</span> All book DOM 
                          is multiplied by the percentage shown. For balanced books (Encyclopedia/Arcana), 
                          the highest multiplier of all attributes is used.
                        </p>
                        <p>
                          <span className="text-green-400 font-medium">Warden Bonuses:</span> Each warden 
                          you own adds the shown DOM amount for each matching attribute. Balance wardens 
                          get bonuses for all four attributes.
                        </p>
                        <p>
                          <span className="text-yellow-400 font-medium">Note:</span> These bonuses are 
                          automatically included in your total DOM calculation above.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upgrade Impact Preview */}
              {conclaveUpgrade.savedSeals > 0 && (
                <Card className="bg-gray-800/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-red-400">Potential Upgrade Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-yellow-400 font-semibold mb-3">After Upgrades</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <p className="text-white">
                            <span className="text-blue-400">Strength Books:</span>{" "}
                                                            {calculateConclaveUpgrades().bookMultipliers.strength.toFixed(1)}%
                          </p>
                          <p className="text-white">
                            <span className="text-blue-400">Allure Books:</span>{" "}
                                                            {calculateConclaveUpgrades().bookMultipliers.allure.toFixed(1)}%
                          </p>
                          <p className="text-white">
                            <span className="text-blue-400">Intellect Books:</span>{" "}
                                                            {calculateConclaveUpgrades().bookMultipliers.intellect.toFixed(1)}%
                          </p>
                          <p className="text-white">
                            <span className="text-blue-400">Spirit Books:</span>{" "}
                                                            {calculateConclaveUpgrades().bookMultipliers.spirit.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <footer className="mt-16 border-t border-gray-700 pt-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-6 text-sm text-gray-400">
              <span>Need help? Reach out on Discord: <span className="text-purple-400">@saka_kishiyami</span></span>
            </div>
            
            <div className="flex justify-center items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                Built using 
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Next.js
                </a>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Hosted on 
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Vercel
                </a>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Source on 
                <a href="https://github.com/SakaKishiyami/Game-of-Vampires-Calculator" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  GitHub
                </a>
              </span>
            </div>
            
            <div className="text-xs text-gray-600">
              <p>Fan-made tool for Game of Vampires players</p>
              <p className="mt-1">Not affiliated with the official Game of Vampires team</p>
            </div>
          </div>
        </footer>
      </div>
  )
} 