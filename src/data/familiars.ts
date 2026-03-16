/**
 * Familiar system data and schema.
 * - Baby familiars upgrade into adult; each has normal and mutated states.
 * - Every familiar belongs to a nest (1–4 types per nest); nest bonuses by grade (D–SS).
 * - Image paths: fill in when PNGs are ready (e.g. /familiars/{id}/baby.png, baby_mutated.png, adult.png, adult_mutated.png).
 */

import { FAMILIAR_GRADE_ORDER } from '@/database/enums'

// --- Grades (D, C, B, A, S, SS) ---
export type FamiliarGrade = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
export const FAMILIAR_GRADES: FamiliarGrade[] = [...FAMILIAR_GRADE_ORDER] as FamiliarGrade[]

// --- Core type / Bond type / Rarity (extend as game data is finalized) ---
export type FamiliarCoreType = string
export type FamiliarBondType = string
export type FamiliarRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Single familiar type definition (one species/type). */
export interface FamiliarDefinition {
  id: string
  name: string
  /** Nest this familiar belongs to (1–4 types per nest). */
  nestId: string
  coreType: FamiliarCoreType
  bondType: FamiliarBondType
  rarity: FamiliarRarity
  /** Optional image paths; add when PNGs are ready. */
  images?: {
    baby?: string
    babyMutated?: string
    adult?: string
    adultMutated?: string
  }
}

/** Nest: group of 1–4 familiar types that share bonuses. */
export interface NestDefinition {
  id: string
  name: string
  /** Familiar type IDs in this nest. */
  familiarTypeIds: string[]
}

/** One owned instance of a familiar (baby or adult, normal or mutated, at a grade). */
export interface UserFamiliarInstance {
  definitionId: string
  grade: FamiliarGrade
  isAdult: boolean
  isMutated: boolean
}

/** Per-type summary for inventory display. */
export interface FamiliarTypeSummary {
  definition: FamiliarDefinition
  nest: NestDefinition
  owned: number
  adultCount: number
  babyCount: number
  mutatedCount: number
  normalCount: number
  bestGrade: FamiliarGrade | null
}

// --- Placeholder nests (replace with real game data) ---
export const nests: NestDefinition[] = [
  { id: 'nest-1', name: 'Shadow Hollow', familiarTypeIds: ['gloomcap', 'shadowfang'] },
  { id: 'nest-2', name: 'Sunken Grove', familiarTypeIds: ['gloomcap', 'mossling', 'rootkin'] },
  { id: 'nest-3', name: 'Frost Den', familiarTypeIds: ['frostbite', 'icewhisk'] },
  { id: 'nest-4', name: 'Ember Roost', familiarTypeIds: ['emberwing', 'cinderpup', 'flamecrest', 'ashling'] },
]

// --- Placeholder familiar definitions (replace with full list and real image paths) ---
export const familiarDefinitions: FamiliarDefinition[] = [
  { id: 'gloomcap', name: 'Gloomcap', nestId: 'nest-1', coreType: 'Fungal', bondType: 'Shadow', rarity: 'common' },
  { id: 'shadowfang', name: 'Shadowfang', nestId: 'nest-1', coreType: 'Beast', bondType: 'Shadow', rarity: 'uncommon' },
  { id: 'mossling', name: 'Mossling', nestId: 'nest-2', coreType: 'Plant', bondType: 'Nature', rarity: 'common' },
  { id: 'rootkin', name: 'Rootkin', nestId: 'nest-2', coreType: 'Plant', bondType: 'Nature', rarity: 'rare' },
  { id: 'frostbite', name: 'Frostbite', nestId: 'nest-3', coreType: 'Elemental', bondType: 'Frost', rarity: 'uncommon' },
  { id: 'icewhisk', name: 'Icewhisk', nestId: 'nest-3', coreType: 'Beast', bondType: 'Frost', rarity: 'rare' },
  { id: 'emberwing', name: 'Emberwing', nestId: 'nest-4', coreType: 'Elemental', bondType: 'Flame', rarity: 'common' },
  { id: 'cinderpup', name: 'Cinderpup', nestId: 'nest-4', coreType: 'Beast', bondType: 'Flame', rarity: 'uncommon' },
  { id: 'flamecrest', name: 'Flamecrest', nestId: 'nest-4', coreType: 'Avian', bondType: 'Flame', rarity: 'rare' },
  { id: 'ashling', name: 'Ashling', nestId: 'nest-4', coreType: 'Elemental', bondType: 'Flame', rarity: 'epic' },
]

// --- Helpers ---
const nestById = new Map(nests.map((n) => [n.id, n]))
const familiarById = new Map(familiarDefinitions.map((f) => [f.id, f]))

export function getNestById(id: string): NestDefinition | undefined {
  return nestById.get(id)
}

export function getFamiliarById(id: string): FamiliarDefinition | undefined {
  return familiarById.get(id)
}

export function getFamiliarsByNest(nestId: string): FamiliarDefinition[] {
  return familiarDefinitions.filter((f) => f.nestId === nestId)
}

/** Unique core types and bond types from current definitions (for filters). */
export function getUniqueCoreTypes(): FamiliarCoreType[] {
  const set = new Set(familiarDefinitions.map((f) => f.coreType))
  return Array.from(set).sort()
}

export function getUniqueBondTypes(): FamiliarBondType[] {
  const set = new Set(familiarDefinitions.map((f) => f.bondType))
  return Array.from(set).sort()
}

/** Build per-type summary from user's owned instances. */
export function buildFamiliarSummaries(
  instances: UserFamiliarInstance[]
): FamiliarTypeSummary[] {
  const byType = new Map<string, UserFamiliarInstance[]>()
  for (const i of instances) {
    if (!byType.has(i.definitionId)) byType.set(i.definitionId, [])
    byType.get(i.definitionId)!.push(i)
  }

  return familiarDefinitions.map((definition) => {
    const list = byType.get(definition.id) ?? []
    const nest = getNestById(definition.nestId)
    if (!nest) throw new Error(`Missing nest ${definition.nestId}`)
    const adultCount = list.filter((x) => x.isAdult).length
    const mutatedCount = list.filter((x) => x.isMutated).length
    const gradeOrder = FAMILIAR_GRADES as readonly string[]
    const bestGrade =
      list.length > 0
        ? (list.reduce((best, x) =>
            gradeOrder.indexOf(x.grade) > gradeOrder.indexOf(best) ? x.grade : best
          ) as FamiliarGrade)
        : null
    return {
      definition,
      nest,
      owned: list.length,
      adultCount,
      babyCount: list.length - adultCount,
      mutatedCount,
      normalCount: list.length - mutatedCount,
      bestGrade,
    }
  })
}
