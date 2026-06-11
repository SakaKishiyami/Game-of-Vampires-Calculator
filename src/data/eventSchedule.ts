/**
 * Event rotation schedule parsed from Discord announcements.
 * Each cycle lasts 3 days. Update when new announcements are posted.
 * Qualifier notes mean a cross-server ranking of the same type follows next cycle.
 */

import type { EventCategory } from './events'

export const EVENT_CYCLE_DAYS = 3

export interface ScheduledEventSlot {
  eventId: string
  category: EventCategory
  /** Overrides catalog title when announcement differs */
  titleReward?: string
  /** e.g. "qualifier", "local only", "CS" */
  modifier?: string
  continues?: boolean
}

export interface EventCycle {
  startDate: string // YYYY-MM-DD
  endingCondition?: string
  events: ScheduledEventSlot[]
  notes?: string
}

export const eventSchedule: EventCycle[] = [
  // ── Oct 2025 ──────────────────────────────────────────────────────────────
  {
    startDate: '2025-10-20',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', modifier: 'CS', titleReward: 'soulsworn count/ess' },
    ],
    notes: 'Sinistria prep ends; Warcamp opens',
  },
  {
    startDate: '2025-10-23',
    endingCondition: 'Shrouded Seas ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'mainGameEvent', modifier: 'Cross', titleReward: 'bewitching count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-10-26',
    endingCondition: 'Nocturne Gallery ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', modifier: 'Cross', titleReward: 'fearless count/ess (personal)' },
      { eventId: 'ring-crafting', category: 'sideGameEvent' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-10-29',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', modifier: 'CS', titleReward: 'bewitching count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-11-01',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'halloween-streets', category: 'special', continues: true, modifier: 'ends 11/2' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-11-04',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-11-07',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-11-10',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'the red count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true, modifier: 'final time' },
    ],
  },
  {
    startDate: '2025-11-13',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'librarian-s-gardens', category: 'special', modifier: '6 days' },
      { eventId: 'macabria-times', category: 'special', modifier: '6 days' },
    ],
    notes: 'Sinistria ends',
  },
  {
    startDate: '2025-11-16',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
      { eventId: 'librarian-s-gardens', category: 'special', continues: true },
      { eventId: 'macabria-times', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-11-19',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent', titleReward: 'celebrated viscount/ess (personal)' },
    ],
    notes: "Librarian's Gardens and Macabria Times end at reset",
  },
  {
    startDate: '2025-11-22',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
    ],
  },
  {
    startDate: '2025-11-25',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
      { eventId: 'heartbreaker', category: 'special', modifier: '7 days' },
      { eventId: 'road-to-riches', category: 'special', modifier: '7 days' },
    ],
  },
  {
    startDate: '2025-11-28',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', titleReward: 'bewitching count/ess' },
      { eventId: 'heartbreaker', category: 'special', continues: true },
      { eventId: 'road-to-riches', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-12-01',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'red count/ess' },
    ],
    notes: 'Heartbreaker & Road to Riches end at reset',
  },
  {
    startDate: '2025-12-04',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
    ],
  },
  {
    startDate: '2025-12-07',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'vamp-o-matic', category: 'special', modifier: '6 days' },
    ],
  },
  {
    startDate: '2025-12-10',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
      { eventId: 'vamp-o-matic', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-12-13',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
    ],
    notes: 'Vamp-O-Matic ends at reset',
  },
  {
    startDate: '2025-12-16',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
  },
  {
    startDate: '2025-12-19',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'monster-maker', category: 'mainGameEvent', titleReward: 'the red count/ess' },
    ],
  },
  {
    startDate: '2025-12-22',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special', modifier: '6 days' },
      { eventId: 'cruel-krampus', category: 'special' },
    ],
    notes: 'Winter Solstice begins (Cruel Krampus)',
  },
  {
    startDate: '2025-12-25',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'ring-crafting', category: 'sideGameEvent' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special', continues: true },
      { eventId: 'cruel-krampus', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2025-12-28',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent', titleReward: 'celebrated viscount/ess (personal)' },
      { eventId: 'yuletide-hunt', category: 'special', titleReward: 'adored margrave/ine' },
      { eventId: 'winter-cheer', category: 'special', modifier: '6 days' },
    ],
    notes: 'Winter Solstice: Winter Cheer begins',
  },
  {
    startDate: '2025-12-31',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'yuletide-hunt', category: 'special', continues: true },
      { eventId: 'winter-cheer', category: 'special', continues: true },
    ],
  },
  // ── Jan 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-01-03',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
    ],
    notes: 'Winter Cheer ends; Festival Fun starts 1/4',
  },
  {
    startDate: '2026-01-06',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'festival-fun', category: 'special', continues: true },
      { eventId: 'clockwork-fortune', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-01-09',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'festival-fun', category: 'special', continues: true },
      { eventId: 'clockwork-fortune', category: 'special', continues: true },
    ],
    notes: 'Festival Fun ends at reset on the 9th',
  },
  {
    startDate: '2026-01-11',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'red count/ess' },
    ],
    notes: 'Surprise 2-day cycle',
  },
  {
    startDate: '2026-01-14',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
  },
  {
    startDate: '2026-01-17',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
      { eventId: 'sinistria', category: 'special', modifier: 'countdown; full start 1/19' },
    ],
  },
  {
    startDate: '2026-01-20',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'sinistria', category: 'special', continues: true, modifier: '21 days' },
    ],
  },
  {
    startDate: '2026-01-23',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent', titleReward: 'celebrated viscount/ess (personal)' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-01-26',
    endingCondition: 'Dominance/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-01-29',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  // ── Feb 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-02-01',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-02-04',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', titleReward: 'the red count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-02-07',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'enigma-lockers', category: 'sideGameEvent' },
      { eventId: 'sinistria', category: 'special', continues: true, modifier: 'final act' },
    ],
  },
  {
    startDate: '2026-02-10',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
    notes: 'Sinistria ended',
  },
  {
    startDate: '2026-02-13',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'sweet-treats', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'sin-symphony', category: 'special', modifier: '12 days' },
    ],
  },
  {
    startDate: '2026-02-16',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-02-19',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent', titleReward: 'celebrated viscount/ess (personal)' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-02-22',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-02-25',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
    ],
  },
  {
    startDate: '2026-02-28',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'ring-crafting', category: 'sideGameEvent' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'monster-maker', category: 'mainGameEvent', titleReward: 'the red count/ess' },
    ],
  },
  // ── Mar 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-03-03',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'enigma-lockers', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'bewitching count/ess' },
    ],
  },
  {
    startDate: '2026-03-06',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', titleReward: 'red count/ess' },
    ],
  },
  {
    startDate: '2026-03-09',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
  },
  {
    startDate: '2026-03-12',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'vamp-o-matic', category: 'special', modifier: '6 days' },
    ],
  },
  {
    startDate: '2026-03-15',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'vamp-o-matic', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-03-18',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'heartbreaker', category: 'special', modifier: '7 days' },
      { eventId: 'road-to-riches', category: 'special', modifier: '7 days' },
    ],
  },
  {
    startDate: '2026-03-21',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'heartbreaker', category: 'special', continues: true },
      { eventId: 'road-to-riches', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-03-24',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent', titleReward: 'celebrated viscount/ess (personal)' },
    ],
    notes: 'Heartbreaker & Road to Riches end tomorrow',
  },
  {
    startDate: '2026-03-27',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', modifier: 'qualifier', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
    ],
  },
  {
    startDate: '2026-03-30',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'cs-arena', category: 'crossServerRanking', titleReward: 'indomitable margrave/ine' },
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
    ],
  },
  // ── Apr 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-04-02',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'bewitching count/ess' },
      { eventId: 'sinister-spindle', category: 'special' },
    ],
  },
  {
    startDate: '2026-04-05',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'banquet', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'macabria-times', category: 'special', modifier: '6 days' },
      { eventId: 'librarian-s-gardens', category: 'special', modifier: '6 days' },
    ],
  },
  {
    startDate: '2026-04-08',
    endingCondition: 'Attraction/Banquet ending',
    events: [
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'ring-crafting', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'macabria-times', category: 'special', continues: true },
      { eventId: 'librarian-s-gardens', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-04-11',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
  },
  {
    startDate: '2026-04-14',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'enigma-lockers', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'cross-server-banquet', category: 'special', modifier: 'Asia only, 14 days' },
    ],
  },
  {
    startDate: '2026-04-17',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'cross-server-banquet', category: 'special', continues: true, modifier: 'Asia only' },
      { eventId: 'sin-symphony', category: 'special', modifier: '12 days' },
    ],
  },
  {
    startDate: '2026-04-20',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'qualifier', titleReward: 'bewitching count/ess' },
      { eventId: 'children-attribute-growth', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-04-23',
    endingCondition: 'Attraction/Children ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'monster-maker', category: 'mainGameEvent', titleReward: 'the red count/ess' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-04-26',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-04-29',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'cs-arena', category: 'crossServerRanking', titleReward: 'indomitable margrave/ine' },
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
    ],
  },
  // ── May 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-05-02',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'children-attribute-growth', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'guardian-gargoyle', category: 'mainGameEvent', titleReward: 'bewitching count/ess' },
      { eventId: 'sinister-spindle', category: 'special' },
    ],
  },
  {
    startDate: '2026-05-05',
    endingCondition: 'Attraction/Child Attributes ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'clockwork-fortune', category: 'special', modifier: '6 days' },
    ],
  },
  {
    startDate: '2026-05-08',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'abiogenesis-attack', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'clockwork-fortune', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-05-11',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'cs-dominance', category: 'crossServerRanking', titleReward: 'majestic margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'ghost-hunting', category: 'mainGameEvent', titleReward: 'soulsworn count/ess (personal)' },
    ],
  },
  {
    startDate: '2026-05-17',
    endingCondition: 'Attraction/Attributes ending',
    events: [
      { eventId: 'cs-attraction', category: 'crossServerRanking', titleReward: 'adored margrave/ine' },
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'local only', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'street-of-the-dead', category: 'mainGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-05-20',
    endingCondition: 'Talent/Bats ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'local only', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'soulfire-cemetery', category: 'mainGameEvent', titleReward: 'ravenous count/ess (MVP)' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-05-23',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'arena-points-growth', category: 'mainRanking', modifier: 'qualifier', titleReward: 'iron-willed count/ess' },
      { eventId: 'guild-arena-points-growth', category: 'guildRanking' },
      { eventId: 'magic-show', category: 'sideGameEvent' },
      { eventId: 'finders-keepers', category: 'mainGameEvent' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-05-26',
    endingCondition: 'Arena ending',
    events: [
      { eventId: 'cs-arena', category: 'crossServerRanking', titleReward: 'indomitable margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'local only', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'shrouded-seas', category: 'mainGameEvent', titleReward: 'soulsworn count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  {
    startDate: '2026-05-29',
    endingCondition: 'Dom/Blood ending',
    events: [
      { eventId: 'attraction', category: 'mainRanking', modifier: 'local only', titleReward: 'bewitching count/ess' },
      { eventId: 'children-attribute-growth', category: 'sideRanking', titleReward: 'celebrated viscount/ess' },
      { eventId: 'haunted-library', category: 'sideGameEvent' },
      { eventId: 'nocturne-gallery', category: 'sideGameEvent', titleReward: 'iron-willed count/ess' },
      { eventId: 'sinistria', category: 'special', continues: true },
    ],
  },
  // ── Jun 2026 ──────────────────────────────────────────────────────────────
  {
    startDate: '2026-06-01',
    endingCondition: 'Attraction/Child Attributes ending',
    events: [
      { eventId: 'talent-increase', category: 'mainRanking', modifier: 'qualifier', titleReward: 'fearless count/ess' },
      { eventId: 'bat-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'infernal-wishes', category: 'sideGameEvent' },
      { eventId: 'sinister-spindle', category: 'special' },
      { eventId: 'summer-nights', category: 'special', titleReward: 'bewitching count/ess (personal)' },
    ],
  },
  {
    startDate: '2026-06-04',
    endingCondition: 'Talent/Bat ending',
    events: [
      { eventId: 'cs-talent', category: 'crossServerRanking', titleReward: 'dauntless margrave/ine' },
      { eventId: 'guild-xp', category: 'guildRanking', titleReward: 'austere viscount/ess (MVP)' },
      { eventId: 'wishing-well', category: 'sideGameEvent' },
      { eventId: 'monster-maker', category: 'mainGameEvent', titleReward: 'the red count/ess' },
    ],
  },
  {
    startDate: '2026-06-07',
    endingCondition: 'Guild XP ending',
    events: [
      { eventId: 'intimacy', category: 'mainRanking', modifier: 'qualifier', titleReward: 'the red count/ess' },
      { eventId: 'nectar', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'herald-of-fate', category: 'sideGameEvent' },
      { eventId: 'nightwings-race', category: 'mainGameEvent', titleReward: 'fearless count/ess (MVP)' },
      { eventId: 'sin-symphony', category: 'special', modifier: '12 days' },
    ],
  },
  {
    startDate: '2026-06-10',
    endingCondition: 'Intimacy/Nectar ending',
    events: [
      { eventId: 'cs-intimacy', category: 'crossServerRanking', titleReward: 'crimson heart margrave/ine' },
      { eventId: 'dominance', category: 'mainRanking', modifier: 'qualifier', titleReward: 'august count/ess' },
      { eventId: 'blood-consumption', category: 'sideRanking', titleReward: 'spirited viscount/ess' },
      { eventId: 'tasting-party', category: 'sideGameEvent' },
      { eventId: 'cupcake-chaos', category: 'mainGameEvent', titleReward: 'red count/ess' },
      { eventId: 'sin-symphony', category: 'special', continues: true },
    ],
  },
]
