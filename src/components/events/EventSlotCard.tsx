'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ResolvedEventSlot } from '@/utils/eventSchedule'

interface EventSlotCardProps {
  slot: ResolvedEventSlot | null
  label: string
  size?: 'default' | 'compact'
  className?: string
  clickable?: boolean
}

export function EventSlotCard({
  slot,
  label,
  size = 'default',
  className,
  clickable = true,
}: EventSlotCardProps) {
  if (!slot) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-gray-600/60 bg-gray-900/30 p-3 text-center',
          size === 'compact' ? 'py-2' : 'py-4',
          className
        )}
      >
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 text-sm text-gray-600">—</p>
      </div>
    )
  }

  const { definition } = slot
  const content = (
    <div
      className={cn(
        'rounded-lg border border-red-950/40 bg-gray-900/50 transition-colors',
        clickable && 'hover:border-red-700/60 hover:bg-gray-900/70',
        size === 'compact' ? 'p-3' : 'p-4',
        className
      )}
    >
      <p className="text-xs uppercase tracking-wide text-red-400/80">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <EventImage name={definition.name} emoji={definition.emoji} imagePath={definition.imagePath} />
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold text-white truncate', size === 'compact' ? 'text-sm' : 'text-base')}>
            {definition.emoji && <span className="mr-1">{definition.emoji}</span>}
            {definition.name}
          </p>
          {(slot.titleReward || definition.titleReward) && (
            <p className="mt-0.5 text-xs text-gray-400 truncate">
              {slot.titleReward ?? definition.titleReward}
            </p>
          )}
          {slot.modifier && (
            <p className="mt-0.5 text-xs italic text-amber-400/90">{slot.modifier}</p>
          )}
        </div>
      </div>
    </div>
  )

  if (!clickable) return content
  return (
    <Link href={`/events/${definition.id}`} className="block">
      {content}
    </Link>
  )
}

interface EventImageProps {
  name: string
  emoji?: string
  imagePath: string | null
  size?: 'sm' | 'md'
}

export function EventImage({ name, emoji, imagePath, size = 'md' }: EventImageProps) {
  const dim = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12'
  if (imagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagePath}
        alt={name}
        className={cn(dim, 'rounded-md object-cover bg-gray-800 shrink-0')}
      />
    )
  }
  return (
    <div
      className={cn(
        dim,
        'shrink-0 rounded-md bg-gray-800/80 border border-gray-700 flex items-center justify-center text-lg'
      )}
      aria-hidden
    >
      {emoji ?? '🦇'}
    </div>
  )
}

interface EventStatusBadgeProps {
  status: 'now' | 'up-next'
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  if (status === 'now') {
    return <span className="font-bold italic text-red-500 text-xs uppercase tracking-wide">NOW</span>
  }
  return <span className="font-bold italic text-blue-400 text-xs uppercase tracking-wide">UP NEXT</span>
}
