import type { FamiliarBondId } from './familiarBonds'

/**
 * Familiar system data.
 * Each familiar belongs to a nest. Nests grant attribute bonuses based on how many
 * familiars in that nest are owned / upgraded. Those bonuses apply only to familiars
 * in that nest — they are not pooled globally (e.g. Shadewoods nest bonuses affect
 * Imp and other Shadewoods familiars only, not Hollowmoor or other nests).
 *
 * Image paths point to /FamiliarAssets/{Base|Exclusive}/{Name}/{Name}{B|BM|A|AM}.png
 *   B = Baby, BM = Baby Mutation, A = Adult, AM = Adult Mutation
 */

export type FamiliarGrade = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
export const FAMILIAR_GRADES: FamiliarGrade[] = ['D', 'C', 'B', 'A', 'S', 'SS']

// Max level per rank. Used to auto-switch Baby -> Adult.
export const FAMILIAR_GRADE_MAX_LEVEL: Record<FamiliarGrade, number> = {
  D: 10,
  C: 20,
  B: 30,
  A: 40,
  S: 50,
  SS: 60,
}

export type FamiliarAttribute = 'Loyalty' | 'Ferocity' | 'Tenacity' | 'Instinct' | 'Mischief'
export const ALL_FAMILIAR_ATTRIBUTES: FamiliarAttribute[] = ['Loyalty', 'Ferocity', 'Tenacity', 'Instinct', 'Mischief']

export type FamiliarKnack =
  | 'Gym'
  | 'Conclave'
  | 'Arena'
  | 'League'
  | 'Date'
  | 'Crystal'
  | 'Fishing'
  | "Lover's Lodge"
  | 'Workshop'
  | 'Well'
  | 'Mushroom'
  | 'Dark Chasm'
  | 'Other'

export interface FamiliarDefinition {
  id: string
  name: string
  nestId: string | null
  folder: 'Base' | 'Exclusive'
  images: {
    baby: string
    babyMutation: string
    adult?: string
    adultMutation?: string
  }
}

export interface NestLevel {
  requirement: string
  bonuses: Partial<Record<FamiliarAttribute, number>>
}

export interface NestDefinition {
  id: string
  name: string
  familiarIds: string[]
  levels: NestLevel[]
}

export interface FamiliarOwnedEntry {
  id: string
  grade: FamiliarGrade
  level: number
  isAdult: boolean
  isMutated: boolean
  // full familiar attribute values used for bond unlocking logic
  attributes: Record<FamiliarAttribute, number>
  mainAttributes: [FamiliarAttribute, FamiliarAttribute]
  bondId: FamiliarBondId | null
  // A-D: one knack, S/SS: two knacks (UI enforces this)
  knacks: FamiliarKnack[]
}

// key: familiarDefinition.id, value: owned instances of that familiar type
export type FamiliarsState = Record<string, FamiliarOwnedEntry[]>

// ---------------------------------------------------------------------------
// Image path helpers
// ---------------------------------------------------------------------------
function basePaths(name: string): FamiliarDefinition['images'] {
  const dir = `/FamiliarAssets/Base/${name}`
  return {
    baby: `${dir}/${name}B.png`,
    babyMutation: `${dir}/${name}BM.png`,
    adult: `${dir}/${name}A.png`,
    adultMutation: `${dir}/${name}AM.png`,
  }
}

function exclusivePaths(name: string, hasAdult = false): FamiliarDefinition['images'] {
  const dir = `/FamiliarAssets/Exclusive/${name}`
  return {
    baby: `${dir}/${name}B.png`,
    babyMutation: `${dir}/${name}BM.png`,
    ...(hasAdult
      ? { adult: `${dir}/${name}A.png`, adultMutation: `${dir}/${name}AM.png` }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// Standard nest bonus pattern (shared by all non-Mythborn nests)
// ---------------------------------------------------------------------------
const standardNestLevels: NestLevel[] = [
  { requirement: 'Own 2', bonuses: { Loyalty: 1, Ferocity: 1 } },
  { requirement: '3 at C', bonuses: { Tenacity: 1, Instinct: 1, Mischief: 1 } },
  { requirement: '3 at B', bonuses: { Loyalty: 1, Ferocity: 1, Tenacity: 1 } },
  { requirement: '4 at A', bonuses: { Loyalty: 1, Instinct: 1, Mischief: 1 } },
  { requirement: '4 at S', bonuses: { Ferocity: 1, Tenacity: 1, Instinct: 1 } },
]

const mythbornNestLevels: NestLevel[] = [
  { requirement: '2 at A', bonuses: { Loyalty: 1, Ferocity: 1, Tenacity: 1, Instinct: 1, Mischief: 1 } },
  { requirement: '2 at S', bonuses: { Loyalty: 1, Ferocity: 1, Tenacity: 1, Instinct: 1, Mischief: 1 } },
  { requirement: '4 at S', bonuses: { Loyalty: 1, Ferocity: 1, Tenacity: 1, Instinct: 1, Mischief: 1 } },
]

// ---------------------------------------------------------------------------
// Nest definitions
// ---------------------------------------------------------------------------
export const nests: NestDefinition[] = [
  {
    id: 'hollowmoor',
    name: 'Hollowmoor',
    familiarIds: ['gremlin', 'gargoyle', 'purraoh', 'gravehart'],
    levels: standardNestLevels,
  },
  {
    id: 'briargrove',
    name: 'Briargrove',
    familiarIds: ['gloomcap', 'pricklesaur', 'pixie', 'sungazer'],
    levels: standardNestLevels,
  },
  {
    id: 'shadewoods',
    name: 'Shadewoods',
    familiarIds: ['griphalkin', 'psychopomp', 'wraithwolf', 'imp'],
    levels: standardNestLevels,
  },
  {
    id: 'mistglen',
    name: 'Mistglen',
    familiarIds: ['zombunny', 'inkfeather', 'faefox', 'strixhorn'],
    levels: standardNestLevels,
  },
  {
    id: 'mythborn',
    name: 'Mythborn',
    familiarIds: ['peryton', 'ripplegleam', 'wyvern', 'clawbear'],
    levels: mythbornNestLevels,
  },
  {
    id: 'barrowhaunt',
    name: 'Barrowhaunt',
    familiarIds: ['gravescourge', 'frankenpug', 'faeree'],
    levels: standardNestLevels,
  },
  {
    id: 'sylvanshore',
    name: 'Sylvanshore',
    familiarIds: ['lilypaddle'],
    levels: standardNestLevels,
  },
]

// ---------------------------------------------------------------------------
// Familiar definitions
// ---------------------------------------------------------------------------
export const familiarDefinitions: FamiliarDefinition[] = [
  // Hollowmoor
  { id: 'gremlin', name: 'Gremlin', nestId: 'hollowmoor', folder: 'Base', images: basePaths('Gremlin') },
  { id: 'gargoyle', name: 'Gargoyle', nestId: 'hollowmoor', folder: 'Base', images: basePaths('Gargoyle') },
  { id: 'purraoh', name: 'Purraoh', nestId: 'hollowmoor', folder: 'Base', images: basePaths('Purraoh') },
  { id: 'gravehart', name: 'Gravehart', nestId: 'hollowmoor', folder: 'Base', images: basePaths('Gravehart') },

  // Briargrove
  { id: 'gloomcap', name: 'Gloomcap', nestId: 'briargrove', folder: 'Base', images: basePaths('Gloomcap') },
  { id: 'pricklesaur', name: 'Pricklesaur', nestId: 'briargrove', folder: 'Base', images: basePaths('Pricklesaur') },
  { id: 'pixie', name: 'Pixie', nestId: 'briargrove', folder: 'Base', images: basePaths('Pixie') },
  { id: 'sungazer', name: 'Sungazer', nestId: 'briargrove', folder: 'Base', images: basePaths('Sungazer') },

  // Shadewoods
  { id: 'griphalkin', name: 'Griphalkin', nestId: 'shadewoods', folder: 'Base', images: basePaths('Griphalkin') },
  { id: 'psychopomp', name: 'Psychopomp', nestId: 'shadewoods', folder: 'Base', images: basePaths('Psychopomp') },
  { id: 'wraithwolf', name: 'Wraithwolf', nestId: 'shadewoods', folder: 'Base', images: basePaths('Wraithwolf') },
  { id: 'imp', name: 'Imp', nestId: 'shadewoods', folder: 'Base', images: basePaths('Imp') },

  // Mistglen
  { id: 'zombunny', name: 'Zombunny', nestId: 'mistglen', folder: 'Base', images: basePaths('Zombunny') },
  { id: 'inkfeather', name: 'Inkfeather', nestId: 'mistglen', folder: 'Base', images: basePaths('Inkfeather') },
  { id: 'faefox', name: 'Faefox', nestId: 'mistglen', folder: 'Base', images: basePaths('Faefox') },
  { id: 'strixhorn', name: 'Strixhorn', nestId: 'mistglen', folder: 'Base', images: basePaths('Strixhorn') },

  // Mythborn (exclusive)
  { id: 'peryton', name: 'Peryton', nestId: 'mythborn', folder: 'Exclusive', images: exclusivePaths('Peryton') },
  { id: 'ripplegleam', name: 'Ripplegleam', nestId: 'mythborn', folder: 'Exclusive', images: exclusivePaths('Ripplegleam') },
  { id: 'wyvern', name: 'Wyvern', nestId: 'mythborn', folder: 'Exclusive', images: exclusivePaths('Wyvern') },
  { id: 'clawbear', name: 'Clawbear', nestId: 'mythborn', folder: 'Exclusive', images: exclusivePaths('Clawbear') },

  // Barrowhaunt
  { id: 'gravescourge', name: 'Gravescourge', nestId: 'barrowhaunt', folder: 'Base', images: basePaths('Gravescourge') },
  { id: 'frankenpug', name: 'Frankenpug', nestId: 'barrowhaunt', folder: 'Base', images: basePaths('Frankenpug') },
  { id: 'faeree', name: 'Faeree', nestId: 'barrowhaunt', folder: 'Base', images: basePaths('Faeree') },

  // Sylvanshore
  { id: 'lilypaddle', name: 'Lilypaddle', nestId: 'sylvanshore', folder: 'Base', images: basePaths('Lilypaddle') },

  // No nest (base)
  { id: 'boar', name: 'Boar', nestId: null, folder: 'Base', images: basePaths('Boar') },
  { id: 'flower', name: 'Flower', nestId: null, folder: 'Base', images: basePaths('Flower') },
  { id: 'frog', name: 'Frog', nestId: null, folder: 'Base', images: basePaths('Frog') },
  { id: 'ghostdog', name: 'Ghostdog', nestId: null, folder: 'Base', images: basePaths('Ghostdog') },
  { id: 'mechanicbat', name: 'MechanicBat', nestId: null, folder: 'Base', images: basePaths('MechanicBat') },
  { id: 'otter', name: 'Otter', nestId: null, folder: 'Base', images: basePaths('Otter') },
  { id: 'sprout', name: 'Sprout', nestId: null, folder: 'Base', images: basePaths('Sprout') },
  { id: 'squirrel', name: 'Squirrel', nestId: null, folder: 'Base', images: basePaths('Squirrel') },

  // No nest (exclusive)
  { id: 'chicken', name: 'Chicken', nestId: null, folder: 'Exclusive', images: exclusivePaths('Chicken') },
  { id: 'cyberus', name: 'Cyberus', nestId: null, folder: 'Exclusive', images: exclusivePaths('Cyberus') },
  { id: 'unicorn', name: 'Unicorn', nestId: null, folder: 'Exclusive', images: exclusivePaths('Unicorn') },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------
const nestMap = new Map(nests.map(n => [n.id, n]))
const familiarMap = new Map(familiarDefinitions.map(f => [f.id, f]))

export function getNestById(id: string) { return nestMap.get(id) }
export function getFamiliarById(id: string) { return familiarMap.get(id) }
export function getFamiliarsByNest(nestId: string) {
  return familiarDefinitions.filter(f => f.nestId === nestId)
}

// ---------------------------------------------------------------------------
// Initial state (all not-owned, default grade D)
// ---------------------------------------------------------------------------
export function createInitialFamiliarsState(): FamiliarsState {
  const state: FamiliarsState = {}
  for (const f of familiarDefinitions) {
    state[f.id] = []
  }
  return state
}

// ---------------------------------------------------------------------------
// Nest level calculation
// ---------------------------------------------------------------------------
function gradeIndex(g: FamiliarGrade): number {
  return FAMILIAR_GRADES.indexOf(g)
}

function parseRequirement(req: string): { type: 'own'; count: number } | { type: 'grade'; count: number; minGrade: FamiliarGrade } {
  const ownMatch = req.match(/^Own (\d+)$/)
  if (ownMatch) return { type: 'own', count: parseInt(ownMatch[1]) }
  const gradeMatch = req.match(/^(\d+) at (\w+)$/)
  if (gradeMatch) return { type: 'grade', count: parseInt(gradeMatch[1]), minGrade: gradeMatch[2] as FamiliarGrade }
  return { type: 'own', count: 999 }
}

export function getNestLevel(nest: NestDefinition, familiarsState: FamiliarsState): number {
  let achievedLevel = 0
  for (let i = 0; i < nest.levels.length; i++) {
    const req = parseRequirement(nest.levels[i].requirement)
    const bestGrades = nest.familiarIds
      .map((id) => {
        const entries = familiarsState[id] ?? []
        if (entries.length === 0) return null
        return entries.reduce((best, cur) =>
          gradeIndex(cur.grade) > gradeIndex(best.grade) ? cur : best
        ).grade
      })
      .filter(Boolean) as FamiliarGrade[]

    if (req.type === 'own') {
      const ownedCount = bestGrades.length
      if (ownedCount >= req.count) achievedLevel = i + 1
      else break
    } else {
      const atGradeCount = bestGrades.filter(
        (g) => gradeIndex(g) >= gradeIndex(req.minGrade)
      ).length
      if (atGradeCount >= req.count) achievedLevel = i + 1
      else break
    }
  }
  return achievedLevel
}

export function getNestBonuses(nest: NestDefinition, level: number): Record<FamiliarAttribute, number> {
  const totals: Record<FamiliarAttribute, number> = {
    Loyalty: 0, Ferocity: 0, Tenacity: 0, Instinct: 0, Mischief: 0
  }
  for (let i = 0; i < Math.min(level, nest.levels.length); i++) {
    for (const [attr, val] of Object.entries(nest.levels[i].bonuses)) {
      totals[attr as FamiliarAttribute] += val as number
    }
  }
  return totals
}

/**
 * Attribute bonuses from this familiar's nest only (same values shown under that nest's
 * "Active Bonuses"). Familiars with no nest get no nest bonuses.
 */
export function getNestBonusesForFamiliar(
  familiarId: string,
  familiarsState: FamiliarsState
): Record<FamiliarAttribute, number> {
  const zero: Record<FamiliarAttribute, number> = {
    Loyalty: 0,
    Ferocity: 0,
    Tenacity: 0,
    Instinct: 0,
    Mischief: 0,
  }
  const def = familiarMap.get(familiarId)
  if (!def?.nestId) return { ...zero }
  const nest = nestMap.get(def.nestId)
  if (!nest) return { ...zero }
  const level = getNestLevel(nest, familiarsState)
  return getNestBonuses(nest, level)
}
