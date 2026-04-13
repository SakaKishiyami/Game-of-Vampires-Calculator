/** Canonical inventory keys (match `inventoryHelpers` Lover+ChildItems list). */
export const CHILD_MARRIAGE_RING_KEYS = {
  blackPearl: 'BlackPearlRing3',
  ruby: 'RubyRing2',
  amethyst: 'AmethystRing1',
} as const

/** Alternate spellings / casing that may exist in older saves. */
export const CHILD_RING_KEY_ALIASES: Record<string, readonly string[]> = {
  BlackPearlRing3: ['BlackPearlRing3', 'blackpearlring3'],
  RubyRing2: ['RubyRing2', 'rubyring2'],
  AmethystRing1: ['AmethystRing1', 'amethystring1', 'amethystRing1'],
}

export const CHILD_RING_IMAGES = {
  blackPearl: '/InventoryAssets/Lover+ChildItems/BlackPearlRing3.png',
  ruby: '/InventoryAssets/Lover+ChildItems/RubyRing2.png',
  amethyst: '/InventoryAssets/Lover+ChildItems/AmethystRing1.png',
} as const
