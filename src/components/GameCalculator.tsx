"use client"

import React, { useState, useEffect } from "react"
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { initialBooks } from "@/data/books"
import { initialAuras } from "@/data/auras"
import { domIncreasePerStarData } from "@/data/talent_stars"

import { getCurrentUser, supabase } from "@/lib/supabase"
import { useGameCalculator } from "@/context/GameCalculatorContext"
import AuraBonusesTab from "@/components/tabs/AuraBonusesTab"
import BooksTab from "@/components/tabs/BooksTab"
import ConclaveTab from "@/components/tabs/ConclaveTab"
import CourtyardTab from "@/components/tabs/CourtyardTab"
import DataTab from "@/components/tabs/DataTab"
import TalentsTab from "@/components/tabs/TalentsTab"
import WardensTab from "@/components/tabs/WardensTab"
import ScarletBondTab from "@/components/tabs/ScarletBondTab"
import InventoryTab from "@/components/tabs/InventoryTab"
import { getAttributeColor, nonNegativeIntInputProps } from "@/utils/helpers"

export default function GameCalculator() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return "aura-bonuses"
    return localStorage.getItem('activeTab') ?? "aura-bonuses"
  })

  useEffect(() => { localStorage.setItem('activeTab', activeTab) }, [activeTab])
  const {
    baseAttributes, setBaseAttributes, vipLevel, setVipLevel, lordLevel, setLordLevel,
    books, setBooks, conclave, setConclave, conclaveUpgrade, setConclaveUpgrade,
    courtyard, setCourtyard, wardenCounts, setWardenCounts, selectedWardens, setSelectedWardens,
    wardenStats, setWardenStats, uploadedWardenData, setUploadedWardenData,
    hasNyx, setHasNyx, hasDracula, setHasDracula, hasVictor, setHasVictor, hasFrederick, setHasFrederick,
    hasAgneyi, setHasAgneyi, hasCulann, setHasCulann, hasHela, setHasHela,
    hasDionysus, setHasDionysus, hasMaya, setHasMaya, hasEmber, setHasEmber, hasAsh, setHasAsh,
    inventory, setInventory, inventoryImages, setInventoryImages,
    scarletBond, setScarletBond, scarletBondAffinity, setScarletBondAffinity, optimizedBondLevels, setOptimizedBondLevels,
    domIncreasePerStar, setDomIncreasePerStar, auras, setAuras,
    talents, setTalents,
    totals, optimizedBonuses, currentScarletBondBonuses, suggestedIncrease, dynamicAuras, auraBonuses,
  } = useGameCalculator()

  // Summonable characters (can be summoned with coins) – not in context; keep local
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

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [autoLoadCloudSaves, setAutoLoadCloudSaves] = useState(true)
  const [dataLoadPreference, setDataLoadPreference] = useState<'local' | 'cloud' | 'ask' | null>(null)
  const [showDataComparison, setShowDataComparison] = useState(false)
  const [dataComparison, setDataComparison] = useState<{
    local: { data: any; size: number; timestamp?: string } | null;
    cloud: { data: any; size: number; timestamp?: string } | null;
  }>({ local: null, cloud: null })

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
      hasDionysus,
      hasMaya,
      hasEmber,
      hasAsh,
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
        setHasDionysus(parsedData.hasDionysus || false)
        setHasMaya(parsedData.hasMaya || false)
        setHasEmber(parsedData.hasEmber || false)
        setHasAsh(parsedData.hasAsh || false)
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
      hasDionysus,
      hasMaya,
      hasEmber,
      hasAsh,
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
        setHasDionysus(importedData.hasDionysus || false)
        setHasMaya(importedData.hasMaya || false)
        setHasEmber(importedData.hasEmber || false)
        setHasAsh(importedData.hasAsh || false)
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
      
      if (user) {
        try {
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
            const localData = localStorage.getItem('gameCalculatorData')
            const autoSavedData = localStorage.getItem('gameCalculatorAutoSave')
            
            console.log('Auto-load debug:', {
              shouldAutoLoad,
              hasLocalData: !!localData,
              hasAutoSavedData: !!autoSavedData,
              hasCloudSave: !!data?.save_data
            })
            
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
                console.log('Both local and cloud data found - triggering comparison for first-time choice')
                setTimeout(() => compareData(), 1000)
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
      hasDionysus,
      hasMaya,
      hasEmber,
      hasAsh,
      talents,
      inventory,
      timestamp: new Date().toISOString(),
    }
  }

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
    if (data.hasDionysus !== undefined) setHasDionysus(data.hasDionysus)
    if (data.hasMaya !== undefined) setHasMaya(data.hasMaya)
    if (data.hasEmber !== undefined) setHasEmber(data.hasEmber)
    if (data.hasAsh !== undefined) setHasAsh(data.hasAsh)
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

  const toggleAutoLoadCloudSaves = () => {
    const newValue = !autoLoadCloudSaves
    setAutoLoadCloudSaves(newValue)
    localStorage.setItem('autoLoadCloudSaves', JSON.stringify(newValue))
  }

  const calculateDataSize = (data: any): number => {
    return new Blob([JSON.stringify(data)]).size
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const compareData = async () => {
    if (!user) return

    try {
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

  const loadFromComparison = (source: 'local' | 'cloud') => {
    const data = source === 'local' ? dataComparison.local?.data : dataComparison.cloud?.data
    if (data) {
      setDataLoadPreference(source)
      localStorage.setItem('dataLoadPreference', JSON.stringify(source))
      
      loadCloudData(data)
      setShowDataComparison(false)
      alert(`Data loaded from ${source} successfully! This preference will be remembered for future loads.`)
    }
  }

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
          hasDionysus,
          hasMaya,
          hasEmber,
          hasAsh,
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
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [baseAttributes, vipLevel, lordLevel, books, conclave, conclaveUpgrade, domIncreasePerStar, courtyard, wardenCounts, selectedWardens, hasNyx, hasDracula, hasVictor, hasFrederick, hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh, auras, wardenStats, scarletBond, scarletBondAffinity, optimizedBondLevels, inventory])

  // Load auto-saved data on component mount
  React.useEffect(() => {
    try {
      const autoSavedData = localStorage.getItem('gameCalculatorAutoSave')
      if (autoSavedData) {
        const parsedData = JSON.parse(autoSavedData)
        
        const lastSave = localStorage.getItem('gameCalculatorData')
        if (!lastSave) {
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

  const attributeOrder = ['strength', 'allure', 'intellect', 'spirit'] as const
  const bookCategoryOrder = ['Strength', 'Allure', 'Intellect', 'Spirit'] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with User Menu */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1" />
          <div className="text-right text-xs text-gray-500">
            Created by <span className="text-purple-400 font-semibold">@saka_kishiyami</span> on Discord
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
                className="w-20 bg-gray-800 border-gray-600 text-white"
                {...nonNegativeIntInputProps(vipLevel, (n) => setVipLevel(Math.min(14, Math.max(0, n))))}
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
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                    {...nonNegativeIntInputProps(baseAttributes[attr], (n) =>
                      setBaseAttributes((prev) => ({ ...prev, [attr]: n }))
                    )}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <AuraBonusesTab />
          </TabsContent>

          {/* Conclave Tab */}
          <TabsContent value="conclave">
            <ConclaveTab />
          </TabsContent>

          {/* Courtyard Tab */}
          <TabsContent value="courtyard">
            <CourtyardTab />
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <BooksTab />
          </TabsContent>

          {/* Talents Tab */}
          <TabsContent value="talents">
            <TalentsTab />
          </TabsContent>

          {/* Wardens Tab */}
          <TabsContent value="wardens">
            <WardensTab />
          </TabsContent>

          {/* Scarlet Bond Tab */}
          <TabsContent value="scarlet-bond">
            <ScarletBondTab />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <InventoryTab />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <DataTab />
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
