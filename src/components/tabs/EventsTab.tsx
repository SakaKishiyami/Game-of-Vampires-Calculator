'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_ORDER,
  getEventDefinition,
  getEventsByCategory,
  type EventDefinition,
} from '@/data/events'
import {
  formatEventDateRange,
  getCurrentEventsDashboard,
  getEventStatusMap,
  getPastCycles,
} from '@/utils/eventSchedule'
import { EventImage, EventSlotCard, EventStatusBadge } from '@/components/events/EventSlotCard'
import type { EventTimingStatus } from '@/utils/eventSchedule'

function EventCatalogCard({ event, status }: { event: EventDefinition; status: EventTimingStatus }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-900/40 p-3 transition-colors hover:border-red-800/50 hover:bg-gray-900/70"
    >
      <EventImage name={event.name} emoji={event.emoji} imagePath={event.imagePath} size="sm" />
      <p className="text-center text-sm font-medium text-gray-200 group-hover:text-white leading-tight">
        {event.name}
      </p>
      {status === 'now' && <EventStatusBadge status="now" />}
      {status === 'up-next' && <EventStatusBadge status="up-next" />}
    </Link>
  )
}

export default function EventsTab() {
  const [timeScope, setTimeScope] = useState<'current' | 'past'>('current')
  const referenceDate = useMemo(() => new Date(), [])
  const dashboard = useMemo(() => getCurrentEventsDashboard(referenceDate), [referenceDate])
  const statusMap = useMemo(() => getEventStatusMap(referenceDate), [referenceDate])
  const pastCycles = useMemo(() => getPastCycles(referenceDate), [referenceDate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Event Tracker</h1>
        <p className="mt-1 text-sm text-gray-400 max-w-3xl">
          Current rotation, upcoming events, and per-event calculators. Schedule data is sourced from
          Discord announcements and can be auto-imported later.
        </p>
      </div>

      {/* Current events dashboard */}
      {dashboard && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-red-300">Current Cycle</h2>
            <p className="text-sm text-gray-400">
              {formatEventDateRange(dashboard.currentCycle.startDate)}
              {dashboard.currentCycle.endingCondition && (
                <span className="ml-2 text-gray-500">
                  · after {dashboard.currentCycle.endingCondition}
                </span>
              )}
            </p>
          </div>

          {/* Priority extras — full width above columns */}
          {dashboard.extras.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.extras.map((slot) => (
                <EventSlotCard
                  key={`${slot.eventId}-${slot.cycleStartDate}`}
                  slot={slot}
                  label={slot.category === 'special' ? 'Special Event' : 'Extra Event'}
                  size="compact"
                />
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Game events */}
            <Card className="border-red-950/40 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-300">Game Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <EventSlotCard slot={dashboard.gameEvents.main} label="Main Game Event" />
                <EventSlotCard slot={dashboard.gameEvents.side} label="Side Game Event" />
              </CardContent>
            </Card>

            {/* Right: Rankings */}
            <Card className="border-red-950/40 bg-gray-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-300">Ranking Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.rankings.crossServer && (
                  <EventSlotCard
                    slot={dashboard.rankings.crossServer}
                    label="Cross-Server Ranking"
                  />
                )}
                {dashboard.rankings.guild && (
                  <EventSlotCard slot={dashboard.rankings.guild} label="Guild Ranking" />
                )}
                <EventSlotCard slot={dashboard.rankings.main} label="Main Ranking (Count Title)" />
                <EventSlotCard slot={dashboard.rankings.side} label="Side Ranking (Viscount Title)" />
              </CardContent>
            </Card>
          </div>

          {dashboard.nextCycle && (
            <p className="text-xs text-gray-500">
              Next cycle starts {formatEventDateRange(dashboard.nextCycle.startDate)} — check back
              after the Discord announcement for confirmed events.
            </p>
          )}
        </section>
      )}

      {/* Subtabs: current vs past */}
      <Tabs value={timeScope} onValueChange={(v) => setTimeScope(v as 'current' | 'past')}>
        <TabsList className="bg-gray-900/60 border border-gray-700/50">
          <TabsTrigger
            value="current"
            className="data-[state=active]:bg-red-900/60 data-[state=active]:text-white"
          >
            Current Events
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-red-900/60 data-[state=active]:text-white"
          >
            Past Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 space-y-8">
          {EVENT_CATEGORY_ORDER.map((category) => {
            const events = getEventsByCategory(category)
            if (events.length === 0) return null
            return (
              <section key={category}>
                <h3 className="mb-3 text-base font-bold text-white">
                  {EVENT_CATEGORY_LABELS[category]}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {events.map((event) => (
                    <EventCatalogCard
                      key={event.id}
                      event={event}
                      status={statusMap[event.id] ?? 'none'}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-6">
          {pastCycles.length === 0 ? (
            <p className="text-sm text-gray-500">No past cycles in the schedule yet.</p>
          ) : (
            <>
            <p className="text-xs text-gray-500">{pastCycles.length} past cycles on record</p>
            {pastCycles.map((cycle) => (
              <div
                key={cycle.startDate}
                className="rounded-lg border border-gray-700/40 bg-gray-900/30 p-4"
              >
                <h3 className="font-semibold text-gray-200">
                  {formatEventDateRange(cycle.startDate)}
                </h3>
                {cycle.endingCondition && (
                  <p className="text-xs text-gray-500 mt-0.5">After {cycle.endingCondition}</p>
                )}
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cycle.events.map((slot) => (
                    <li key={`${cycle.startDate}-${slot.eventId}`}>
                      <Link
                        href={`/events/${slot.eventId}`}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-600/50 bg-gray-800/50 px-2.5 py-1 text-xs text-gray-300 hover:border-red-800/50 hover:text-white"
                      >
                        {getEventDefinition(slot.eventId)?.name ?? slot.eventId.replace(/-/g, ' ')}
                      </Link>
                    </li>
                  ))}
                </ul>
                {cycle.notes && (
                  <p className="mt-2 text-xs text-gray-600 italic">{cycle.notes}</p>
                )}
              </div>
            ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Discord import note */}
      <Card className="border-gray-700/40 bg-gray-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-300">Discord Auto-Import (coming soon)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-500 space-y-2">
          <p>
            A Discord bot in your existing server can listen for &quot;EVENTS STARTING&quot; messages
            and update the schedule automatically. A parser is already built in{' '}
            <code className="text-gray-400">src/utils/discordEventParser.ts</code> — you can start
            with manual paste and add the bot when ready. No new Discord server needed.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
