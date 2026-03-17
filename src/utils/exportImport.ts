// Export and Import functionality for game calculator data

import { GameCalculatorState } from '@/types'

const CURRENT_VERSION = '1.0.0'

/** Key used for localStorage and sessionStorage (match calculator save/load) */
export const STORAGE_KEY = 'gameCalculatorData'

/**
 * Export game calculator state to JSON file
 */
export function exportGameData(state: Partial<GameCalculatorState>): void {
  const exportData: GameCalculatorState = {
    version: CURRENT_VERSION,
    ...state,
  } as GameCalculatorState

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `game-of-vampires-save-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import game calculator state from JSON file
 */
export function importGameData(file: File): Promise<Partial<GameCalculatorState>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as Partial<GameCalculatorState>
        
        // Validate version compatibility (basic check)
        if (data.version && data.version !== CURRENT_VERSION) {
          console.warn(`Importing data from version ${data.version}, current version is ${CURRENT_VERSION}`)
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse JSON file: ' + (error as Error).message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Validate imported data structure
 */
export function validateImportedData(data: any): boolean {
  // Basic validation - check for required top-level keys
  const requiredKeys = ['baseAttributes', 'vipLevel', 'lordLevel']
  return requiredKeys.every(key => key in data)
}
