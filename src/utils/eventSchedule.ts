import {
  eventDefinitions,
  getEventDefinition,
  type EventCategory,
  type EventDefinition,
} from '@/data/events'
import {
  eventSchedule,
  EVENT_CYCLE_DAYS,
  type EventCycle,
  type ScheduledEventSlot,
} from '@/data/eventSchedule'

export type EventTimingStatus = 'now' | 'up-next' | 'past' | 'none'

export interface ResolvedEventSlot extends ScheduledEventSlot {
  definition: EventDefinition
  status: EventTimingStatus
  cycleStartDate: string
  cycleEndDate: string
}

export interface CurrentEventsDashboard {
  currentCycle: EventCycle
  nextCycle: EventCycle | null
  cycleEndDate: string
  extras: ResolvedEventSlot[]
  gameEvents: {
    main: ResolvedEventSlot | null
    side: ResolvedEventSlot | null
  }
  rankings: {
    crossServer: ResolvedEventSlot | null
    main: ResolvedEventSlot | null
    side: ResolvedEventSlot | null
    guild: ResolvedEventSlot | null
  }
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(iso: string, days: number): string {
  const date = parseDate(iso)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function getCycleEndDate(startDate: string): string {
  return addDays(startDate, EVENT_CYCLE_DAYS - 1)
}

function compareDates(a: string, b: string): number {
  return parseDate(a).getTime() - parseDate(b).getTime()
}

export function getCurrentCycle(referenceDate = new Date()): EventCycle | null {
  const ref = formatDate(referenceDate)
  let current: EventCycle | null = null
  for (const cycle of eventSchedule) {
    if (compareDates(cycle.startDate, ref) <= 0) {
      current = cycle
    } else {
      break
    }
  }
  return current
}

export function getNextCycle(referenceDate = new Date()): EventCycle | null {
  const current = getCurrentCycle(referenceDate)
  if (!current) return eventSchedule[0] ?? null
  const idx = eventSchedule.findIndex((c) => c.startDate === current.startDate)
  return eventSchedule[idx + 1] ?? null
}

function resolveSlot(
  slot: ScheduledEventSlot,
  cycle: EventCycle,
  status: EventTimingStatus
): ResolvedEventSlot | null {
  const definition = getEventDefinition(slot.eventId)
  if (!definition) return null
  return {
    ...slot,
    definition,
    status,
    cycleStartDate: cycle.startDate,
    cycleEndDate: getCycleEndDate(cycle.startDate),
  }
}

function pickSlot(
  slots: ResolvedEventSlot[],
  category: EventCategory
): ResolvedEventSlot | null {
  return slots.find((s) => s.category === category) ?? null
}

export function getCurrentEventsDashboard(referenceDate = new Date()): CurrentEventsDashboard | null {
  const currentCycle = getCurrentCycle(referenceDate)
  if (!currentCycle) return null

  const nextCycle = getNextCycle(referenceDate)
  const currentResolved = currentCycle.events
    .map((s) => resolveSlot(s, currentCycle, 'now'))
    .filter((s): s is ResolvedEventSlot => s != null)

  const mainGame = pickSlot(currentResolved, 'mainGameEvent')
  const sideGame = pickSlot(currentResolved, 'sideGameEvent')
  const assignedGameIds = new Set(
    [mainGame?.eventId, sideGame?.eventId].filter((id): id is string => Boolean(id))
  )

  const crossServer = pickSlot(currentResolved, 'crossServerRanking')
  const mainRanking = pickSlot(currentResolved, 'mainRanking')
  const sideRanking = pickSlot(currentResolved, 'sideRanking')
  const guildRanking = pickSlot(currentResolved, 'guildRanking')

  const extras = currentResolved.filter(
    (e) =>
      e.category === 'special' ||
      ((e.category === 'mainGameEvent' || e.category === 'sideGameEvent') &&
        !assignedGameIds.has(e.eventId))
  )

  return {
    currentCycle,
    nextCycle,
    cycleEndDate: getCycleEndDate(currentCycle.startDate),
    extras,
    gameEvents: { main: mainGame, side: sideGame },
    rankings: {
      crossServer,
      main: mainRanking,
      side: sideRanking,
      guild: guildRanking,
    },
  }
}

export function getEventTimingStatus(
  eventId: string,
  referenceDate = new Date()
): EventTimingStatus {
  const current = getCurrentCycle(referenceDate)
  const next = getNextCycle(referenceDate)
  if (current?.events.some((e) => e.eventId === eventId)) return 'now'
  if (next?.events.some((e) => e.eventId === eventId)) return 'up-next'
  return 'none'
}

export function getPastCycles(referenceDate = new Date()): EventCycle[] {
  const current = getCurrentCycle(referenceDate)
  if (!current) return []
  const idx = eventSchedule.findIndex((c) => c.startDate === current.startDate)
  return eventSchedule.slice(0, idx).reverse()
}

/** Map event id → timing for catalog list badges */
export function getEventStatusMap(referenceDate = new Date()): Record<string, EventTimingStatus> {
  const map: Record<string, EventTimingStatus> = {}
  for (const def of eventDefinitions) {
    map[def.id] = getEventTimingStatus(def.id, referenceDate)
  }
  return map
}

export function formatEventDateRange(startDate: string): string {
  const end = getCycleEndDate(startDate)
  const start = parseDate(startDate)
  const endD = parseDate(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (start.getMonth() === endD.getMonth()) {
    return `${start.toLocaleDateString('en-US', opts)} – ${endD.getDate()}`
  }
  return `${start.toLocaleDateString('en-US', opts)} – ${endD.toLocaleDateString('en-US', opts)}`
}
