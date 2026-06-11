'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  EVENT_CATEGORY_LABELS,
  getEventDefinition,
  type EventDefinition,
} from '@/data/events'
import { getEventTimingStatus } from '@/utils/eventSchedule'
import { EventImage, EventStatusBadge } from '@/components/events/EventSlotCard'

interface EventDetailViewProps {
  eventId: string
}

function isRankingEvent(event: EventDefinition): boolean {
  return (
    event.category === 'mainRanking' ||
    event.category === 'sideRanking' ||
    event.category === 'crossServerRanking' ||
    event.category === 'guildRanking'
  )
}

export default function EventDetailView({ eventId }: EventDetailViewProps) {
  const event = getEventDefinition(eventId)
  const status = getEventTimingStatus(eventId)

  if (!event) {
    return (
      <div className="space-y-4">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
        <p className="text-gray-400">Event not found.</p>
      </div>
    )
  }

  const showRankingCalc = isRankingEvent(event)

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <EventImage name={event.name} emoji={event.emoji} imagePath={event.imagePath} size="md" />
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {event.emoji && <span className="mr-2">{event.emoji}</span>}
            {event.name}
          </h1>
          <p className="mt-1 text-sm text-gray-400">{EVENT_CATEGORY_LABELS[event.category]}</p>
          {event.titleReward && (
            <p className="mt-1 text-sm text-gray-300">Title: {event.titleReward}</p>
          )}
          <div className="mt-2 flex gap-3">
            {status === 'now' && <EventStatusBadge status="now" />}
            {status === 'up-next' && <EventStatusBadge status="up-next" />}
          </div>
        </div>
      </div>

      {showRankingCalc && (
        <Card className="border-red-950/40 bg-gray-900/40">
          <CardHeader>
            <CardTitle className="text-base text-red-300">Ranking Calculator</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400 space-y-2">
            <p>
              This section will calculate how much you need to rank based on your inventory from
              the main calculator tab. Changes here will sync back to inventory automatically.
            </p>
            <p className="text-xs text-gray-500 italic">Coming soon — connected to inventory.</p>
          </CardContent>
        </Card>
      )}

      {event.category === 'mainGameEvent' || event.category === 'sideGameEvent' ? (
        <Card className="border-red-950/40 bg-gray-900/40">
          <CardHeader>
            <CardTitle className="text-base text-red-300">Game Event Tracker</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            <p>Game event calculations use a different system and will be added later.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-red-950/40 bg-gray-900/40">
        <CardHeader>
          <CardTitle className="text-base text-red-300">Past Event Rankings</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-400 space-y-2">
          <p>
            Historical ranking data and stats for this event will appear here for reference and
            future ML predictions.
          </p>
          <p className="text-xs text-gray-500 italic">Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
