// Helper utility functions
import React from 'react'
import type { ChangeEvent } from 'react'

/**
 * Handle number input changes - allows empty string for better UX
 */
export function handleNumberInputChange(
  value: string,
  setter: (value: number) => void
): void {
  if (value === '') {
    setter(0)
    return
  }
  if (value === '-') {
    return
  }
  const numValue = parseInt(value) || 0
  setter(numValue)
}

export type NonNegativeIntInputOptions = {
  /** When true (default), value 0 displays as blank so you can clear and re-type */
  zeroShowsEmpty?: boolean
}

/**
 * Text-based numeric input props: you can clear the field; empty commits as 0 on change/blur.
 * Prefer over type="number" when the default "0" while typing is annoying.
 */
export function nonNegativeIntInputProps(
  value: number,
  onCommit: (n: number) => void,
  options?: NonNegativeIntInputOptions
): {
  type: 'text'
  inputMode: 'numeric'
  autoComplete: 'off'
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void
} {
  const zeroShowsEmpty = options?.zeroShowsEmpty !== false
  const normalized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  const display = zeroShowsEmpty && normalized === 0 ? '' : normalized.toLocaleString()
  return {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    autoComplete: 'off' as const,
    value: display,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.trim()
      if (v === '') {
        onCommit(0)
        return
      }
      const digitsOnly = v.replace(/[^\d]/g, '')
      if (digitsOnly === '') {
        onCommit(0)
        return
      }
      const n = parseInt(digitsOnly, 10)
      if (!Number.isNaN(n)) onCommit(Math.max(0, n))
    },
    onBlur: (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim() === '') onCommit(0)
    },
  }
}

/**
 * Get display value - show empty string if 0, otherwise show the number
 */
export function getDisplayValue(value: number): string {
  return value === 0 ? '' : value.toString()
}

/**
 * Get calculation value - treat empty as 0
 */
export function getCalculationValue(value: string | number): number {
  if (typeof value === 'string') {
    return value === '' ? 0 : parseInt(value) || 0
  }
  return value || 0
}

/**
 * Parse numbers with K/M suffixes (e.g., "1.5K" = 1500, "2.3M" = 2300000)
 */
export function parseNumberWithSuffix(value: string): number {
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

/**
 * Format number with K/M suffixes for display
 */
export function formatNumberWithSuffix(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  }
  return value.toString()
}

/**
 * Get attribute color class for styling
 */
export function getAttributeColor(attribute: string): string {
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

/**
 * Attribute order: Strength, Allure, Intellect, Spirit
 */
export const attributeOrder: string[] = ['strength', 'allure', 'intellect', 'spirit']

/**
 * Book category order
 * Balanced is treated as the "Mystery" book line for UI purposes.
 */
export const bookCategoryOrder = ['Balanced', 'Strength', 'Allure', 'Intellect', 'Spirit'] as const

/**
 * Get attribute background color class
 */
export function getAttributeBg(attribute: string): string {
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

/**
 * Render stars for warden tier display
 */
export function renderStars(tier: number): React.ReactNode {
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

// Re-export inventory helpers for convenience
export { formatItemName, getItemCategory, getItemsByCategory, groupItemsByType } from './inventoryHelpers'
