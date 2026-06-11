/**
 * Parser for Discord event announcement messages (Boss Lady / Persephone format).
 * Format changes over time — this is best-effort and should be reviewed after parsing.
 *
 * Discord automation options:
 * 1. Discord Bot (recommended): A bot in your server listens to the announcement channel,
 *    parses new messages matching "EVENTS STARTING", and POSTs parsed JSON to your app API
 *    (or writes to Supabase). Needs bot token + Message Content Intent.
 * 2. Webhook relay: Forward channel to a webhook URL your Next.js API route receives.
 * 3. Manual paste: Admin UI to paste announcement text and preview before saving (simplest to start).
 *
 * You do NOT need a new Discord server — the bot can live in your existing GoV Discord.
 */

import type { EventCategory } from '@/data/events'
import { eventDefinitionMap } from '@/data/events'
import type { EventCycle, ScheduledEventSlot } from '@/data/eventSchedule'

export interface ParsedDiscordAnnouncement {
  startDate: string | null
  endingCondition: string | null
  events: ScheduledEventSlot[]
  continuesNotes: string[]
  rawLines: string[]
  warnings: string[]
}

const EVENTS_STARTING_RE =
  /(?:EVENTS STARTING|NEXT EVENTS)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i
const ENDING_CONDITION_RE = /If (.+?) is ending for you(?: tonight| today)?/i

/** Normalize announcement event names to catalog ids */
const NAME_ALIASES: Record<string, string> = {
  'cs attraction': 'cs-attraction',
  'cs arena': 'cs-arena',
  'cs talent': 'cs-talent',
  'cs intimacy': 'cs-intimacy',
  'cs dominance': 'cs-dominance',
  'children attribute growth': 'children-attribute-growth',
  'child attributes': 'children-attribute-growth',
  'guild arena points growth': 'guild-arena-points-growth',
  'guild xp': 'guild-xp',
  'arena points growth': 'arena-points-growth',
  'talent increase': 'talent-increase',
  'blood consumption': 'blood-consumption',
  'bat consumption': 'bat-consumption',
  'sin & symphony': 'sin-symphony',
  'sin and symphony': 'sin-symphony',
  'clockwork fortune': 'clockwork-fortune',
  'sinistria': 'sinistria',
  'sinister spindle': 'sinister-spindle',
  'summer nights': 'summer-nights',
  'cupcake chaos': 'cupcake-chaos',
  'finders keepers': 'finders-keepers',
  'abiogenesis attack': 'abiogenesis-attack',
  'ghost hunting': 'ghost-hunting',
  'street of the dead': 'street-of-the-dead',
  'nightwings race': 'nightwings-race',
  'herald of fate': 'herald-of-fate',
  'haunted library': 'haunted-library',
  'tasting party': 'tasting-party',
  'monster maker': 'monster-maker',
  'nocturne gallery': 'nocturne-gallery',
  'magic show': 'magic-show',
  'infernal wishes': 'infernal-wishes',
  'shrouded seas': 'shrouded-seas',
  'guardian gargoyle': 'guardian-gargoyle',
  'soulfire cemetery': 'soulfire-cemetery',
  'wishing well': 'wishing-well',
  'banquet': 'banquet',
  'ring crafting': 'ring-crafting',
  'enigma lockers': 'enigma-lockers',
  'sweet treats': 'sweet-treats',
  'halloween streets': 'halloween-streets',
  "librarian's gardens": 'librarian-s-gardens',
  'librarians garden': 'librarian-s-gardens',
  'macabria times': 'macabria-times',
  'heartbreaker': 'heartbreaker',
  'road to riches': 'road-to-riches',
  'vamp-o-matic': 'vamp-o-matic',
  'cruel krampus': 'cruel-krampus',
  'winter cheer': 'winter-cheer',
  'yuletide hunt': 'yuletide-hunt',
  'festival fun': 'festival-fun',
  'cross server banquet': 'cross-server-banquet',
  'cross attraction': 'cs-attraction',
  'cross intimacy': 'cs-intimacy',
  'herlad of fate': 'herald-of-fate',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/^cs\s+/i, 'cs-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveEventId(rawName: string): string | null {
  const cleaned = rawName
    .replace(/\(qualifier\)/gi, '')
    .replace(/\(local only\)/gi, '')
    .replace(/w\/twilight auction/gi, '')
    .replace(/\d+\s*days?/gi, '')
    .trim()
    .toLowerCase()

  if (NAME_ALIASES[cleaned]) return NAME_ALIASES[cleaned]
  const slug = slugify(cleaned)
  if (eventDefinitionMap[slug]) return slug
  return null
}

function inferCategory(name: string, line: string): EventCategory {
  const lower = name.toLowerCase()
  const full = line.toLowerCase()
  if (lower.startsWith('cs ')) return 'crossServerRanking'
  if (full.includes('continues') || lower.includes('sinistria') || lower.includes('clockwork') || lower.includes('sin & symphony') || lower.includes('sinister spindle') || lower.includes('summer nights')) {
    return 'special'
  }
  if (lower.includes('guild arena')) return 'guildRanking'
  if (lower.includes('guild xp')) return 'mainRanking'
  if (
    lower.includes('consumption') ||
    lower.includes('nectar') ||
    lower.includes('children') ||
    lower.includes('attribute growth')
  ) {
    return 'sideRanking'
  }
  if (
    lower.includes('attraction') ||
    lower.includes('dominance') ||
    lower.includes('arena points') ||
    lower.includes('talent') ||
    lower.includes('intimacy')
  ) {
    return 'mainRanking'
  }
  if (full.includes('|') && !full.includes('margrave') && !full.includes('count/ess')) {
    return 'mainGameEvent'
  }
  if (full.includes('count/ess') || full.includes('baron')) return 'mainGameEvent'
  return 'sideGameEvent'
}

function parseStartDate(raw: string, referenceYear = new Date().getFullYear()): string | null {
  const parts = raw.split('/')
  if (parts.length < 2) return null
  const month = parts[0].padStart(2, '0')
  const day = parts[1].padStart(2, '0')
  const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : String(referenceYear)
  return `${year}-${month}-${day}`
}

function extractTitleReward(line: string): string | undefined {
  const pipe = line.split('|')
  if (pipe.length < 2) return undefined
  return pipe.slice(1).join('|').trim() || undefined
}

function extractModifier(line: string): string | undefined {
  if (/qualifier/i.test(line)) return 'qualifier'
  if (/local only/i.test(line)) return 'local only'
  const days = line.match(/(\d+)\s*days?/i)
  if (days) return `${days[1]} days`
  return undefined
}

/**
 * Parse a raw Discord announcement into structured event cycle data.
 * Returns warnings for lines that could not be matched to the catalog.
 */
export function parseDiscordEventAnnouncement(text: string): ParsedDiscordAnnouncement {
  const warnings: string[] = []
  const continuesNotes: string[] = []
  const events: ScheduledEventSlot[] = []
  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  let startDate: string | null = null
  let endingCondition: string | null = null

  const startingMatch = text.match(EVENTS_STARTING_RE)
  if (startingMatch) {
    startDate = parseStartDate(startingMatch[1])
  } else {
    warnings.push('Could not find "EVENTS STARTING" date header')
  }

  const endingMatch = text.match(ENDING_CONDITION_RE)
  if (endingMatch) {
    endingCondition = endingMatch[1]
  }

  for (const line of rawLines) {
    if (
      line.startsWith('EVENTS STARTING') ||
      line.startsWith('If ') ||
      line.startsWith('(') ||
      line.startsWith('reminder') ||
      line.startsWith('updated by') ||
      line.startsWith('PS-') ||
      line.includes('Boss Lady') ||
      line.includes('not official')
    ) {
      continue
    }

    if (/continues/i.test(line) && !line.includes('|')) {
      continuesNotes.push(line)
      const name = line.replace(/continues.*/i, '').replace(/[^\w\s&]/g, '').trim()
      const id = resolveEventId(name)
      if (id) {
        events.push({
          eventId: id,
          category: 'special',
          continues: true,
        })
      }
      continue
    }

    if (/has begun|has concluded|continues/i.test(line) && /sinistria|clockwork|sin & symphony/i.test(line)) {
      continuesNotes.push(line)
    }

    // Event lines usually start with emoji or CS/name
    const cleaned = line.replace(/^[^\w\d]*\s*/, '').trim()
    if (!cleaned || cleaned.length < 3) continue

    const namePart = cleaned.split('|')[0].trim()
    const eventId = resolveEventId(namePart)
    if (!eventId) {
      if (!/sinistria|clockwork|symphony|auction is for/i.test(line)) {
        warnings.push(`Unrecognized event line: "${line}"`)
      }
      continue
    }

    const def = eventDefinitionMap[eventId]
    events.push({
      eventId,
      category: def?.category ?? inferCategory(namePart, line),
      titleReward: extractTitleReward(line),
      modifier: extractModifier(line),
      continues: /continues/i.test(line),
    })
  }

  return { startDate, endingCondition, events, continuesNotes, rawLines, warnings }
}

/** Convert parsed announcement to EventCycle for schedule import */
export function parsedAnnouncementToCycle(parsed: ParsedDiscordAnnouncement): EventCycle | null {
  if (!parsed.startDate || parsed.events.length === 0) return null
  return {
    startDate: parsed.startDate,
    endingCondition: parsed.endingCondition ?? undefined,
    events: parsed.events,
    notes: parsed.continuesNotes.join('; ') || undefined,
  }
}
