// Wild Hunt & Monster Noir lover scarlet-bond aura helpers (independent series, tiers 20/25/30/35%)
import type { Inventory } from '@/types'

export interface LoverSummonInput {
  hasAgneyi: boolean
  hasCulann: boolean
  hasHela: boolean
  hasDionysus: boolean
  hasMaya: boolean
  hasEmber: boolean
  hasAsh: boolean
  hasNyx: boolean
}

export interface ResolvedLoverSummon extends LoverSummonInput {
  /** Token fallback: 100+ tokens counts as summonable */
  canAgneyi: boolean
  canCulann: boolean
  canHela: boolean
  canDionysus: boolean
  canMaya: boolean
  canEmber: boolean
  canAsh: boolean
}

export function resolveLoverSummonFlags(
  input: Omit<LoverSummonInput, 'hasNyx'>,
  hasNyx: boolean,
  inventory: Inventory
): ResolvedLoverSummon {
  return {
    hasAgneyi: input.hasAgneyi,
    hasCulann: input.hasCulann,
    hasHela: input.hasHela,
    hasDionysus: input.hasDionysus,
    hasMaya: input.hasMaya,
    hasEmber: input.hasEmber,
    hasAsh: input.hasAsh,
    hasNyx,
    canAgneyi: input.hasAgneyi || (inventory['AgneyiToken']?.count || 0) >= 100,
    canCulann: input.hasCulann || (inventory['CulannToken']?.count || 0) >= 100,
    canHela: input.hasHela || (inventory['HelaToken']?.count || 0) >= 100,
    canDionysus: input.hasDionysus || (inventory['DionysusToken']?.count || 0) >= 100,
    canMaya: input.hasMaya || (inventory['MayaToken']?.count || 0) >= 100,
    canEmber: input.hasEmber || (inventory['EmberToken']?.count || 0) >= 100,
    canAsh: input.hasAsh || (inventory['AshToken']?.count || 0) >= 100,
  }
}

/** 1–4 lovers in a series → 20% / 25% / 30% / 35% */
export function tierPercentFromCount(count: number): number {
  if (count <= 0) return 0
  if (count === 1) return 20
  if (count === 2) return 25
  if (count === 3) return 30
  return 35
}

export function wildHuntSummonedCount(s: ResolvedLoverSummon): number {
  return [s.canAgneyi, s.canCulann, s.canHela, s.canDionysus].filter(Boolean).length
}

/** Extend array when more Monster Noir lovers release */
export function monsterNoirSummonedCount(s: ResolvedLoverSummon): number {
  return [s.canMaya].filter(Boolean).length
}

export function wildHuntTierFraction(s: ResolvedLoverSummon): number {
  return tierPercentFromCount(wildHuntSummonedCount(s)) / 100
}

export function monsterNoirTierFraction(s: ResolvedLoverSummon): number {
  return tierPercentFromCount(monsterNoirSummonedCount(s)) / 100
}

/**
 * Per-attribute multiplier from lover scarlet-bond auras.
 * Wild Hunt: Agneyi→Strength, Hela→Allure, Dionysus→Intellect, Culann→Spirit (Finn).
 * Monster Noir: Maya→Spirit (Grendel), independent tier.
 * Ember/Ash (Nyx): +25% to all four attributes when Nyx + both lovers.
 * When Wild Hunt and Monster Noir both boost Spirit (Culann + Maya), multipliers stack.
 */
export function getLoverScarletBondAuraMultiplier(
  attr: 'strength' | 'allure' | 'intellect' | 'spirit',
  s: ResolvedLoverSummon
): number {
  let mult = 1
  const wild = wildHuntTierFraction(s)
  const noir = monsterNoirTierFraction(s)

  if (attr === 'strength' && s.canAgneyi) mult *= 1 + wild
  if (attr === 'allure' && s.canHela) mult *= 1 + wild
  if (attr === 'intellect' && s.canDionysus) mult *= 1 + wild
  if (attr === 'spirit' && s.canCulann) mult *= 1 + wild

  if (attr === 'spirit' && s.canMaya) mult *= 1 + noir

  if (s.hasNyx && s.canEmber && s.canAsh) mult *= 1.25

  return mult
}

export function getLoverAuraPercentDisplay(
  lover:
    | 'Agneyi'
    | 'Culann'
    | 'Hela'
    | 'Dionysus'
    | 'Maya'
    | 'EmberAsh',
  s: ResolvedLoverSummon
): number {
  switch (lover) {
    case 'Agneyi':
      return s.canAgneyi ? tierPercentFromCount(wildHuntSummonedCount(s)) : 0
    case 'Culann':
      return s.canCulann ? tierPercentFromCount(wildHuntSummonedCount(s)) : 0
    case 'Hela':
      return s.canHela ? tierPercentFromCount(wildHuntSummonedCount(s)) : 0
    case 'Dionysus':
      return s.canDionysus ? tierPercentFromCount(wildHuntSummonedCount(s)) : 0
    case 'Maya':
      return s.canMaya ? tierPercentFromCount(monsterNoirSummonedCount(s)) : 0
    case 'EmberAsh':
      return s.hasNyx && s.canEmber && s.canAsh ? 25 : 0
    default:
      return 0
  }
}
