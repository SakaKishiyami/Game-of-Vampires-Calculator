'use client'

import { useParams } from 'next/navigation'
import EventDetailView from '@/components/events/EventDetailView'

export default function EventDetailPage() {
  const params = useParams()
  const eventId = typeof params.eventId === 'string' ? params.eventId : ''

  return <EventDetailView eventId={eventId} />
}
