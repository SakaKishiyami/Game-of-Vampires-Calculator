/**
 * Game of Vampires event catalog.
 * Add new events here as they appear in Discord announcements or in-game.
 * Image paths are placeholders until event artwork is added under /public/EventAssets/.
 */

export type EventCategory =
  | 'crossServerRanking'
  | 'mainRanking'
  | 'sideRanking'
  | 'guildRanking'
  | 'mainGameEvent'
  | 'sideGameEvent'
  | 'special'

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  crossServerRanking: 'Cross-Server Rankings',
  mainRanking: 'Main Rankings (Count Title)',
  sideRanking: 'Side Rankings (Viscount Title)',
  guildRanking: 'Guild Rankings',
  mainGameEvent: 'Main Game Events',
  sideGameEvent: 'Side Game Events',
  special: 'Special Events',
}

/** Display order for the event list section */
export const EVENT_CATEGORY_ORDER: EventCategory[] = [
  'crossServerRanking',
  'mainRanking',
  'sideRanking',
  'guildRanking',
  'mainGameEvent',
  'sideGameEvent',
  'special',
]

export interface EventDefinition {
  id: string
  name: string
  category: EventCategory
  emoji?: string
  /** Path under /public — null until artwork is added */
  imagePath: string | null
  /** Typical title reward phrasing from announcements */
  titleReward?: string
  notes?: string
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^cs\s+/i, 'cs-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function def(
  name: string,
  category: EventCategory,
  opts: Partial<Omit<EventDefinition, 'id' | 'name' | 'category'>> = {}
): EventDefinition {
  return {
    id: slug(name),
    name,
    category,
    imagePath: opts.imagePath ?? null,
    ...opts,
  }
}

export const eventDefinitions: EventDefinition[] = [
  // Cross-server rankings (monthly)
  def('CS Attraction', 'crossServerRanking', { emoji: '💜', titleReward: 'adored margrave/ine' }),
  def('CS Arena', 'crossServerRanking', { emoji: '⚔️', titleReward: 'indomitable margrave/ine' }),
  def('CS Talent', 'crossServerRanking', { emoji: '📜', titleReward: 'dauntless margrave/ine' }),
  def('CS Intimacy', 'crossServerRanking', { emoji: '❤️‍🔥', titleReward: 'crimson heart margrave/ine' }),
  def('CS Dominance', 'crossServerRanking', { emoji: '💪', titleReward: 'majestic margrave/ine' }),

  // Main rankings (count title)
  def('Attraction', 'mainRanking', { emoji: '💜', titleReward: 'bewitching count/ess' }),
  def('Dominance', 'mainRanking', { emoji: '💪', titleReward: 'august count/ess' }),
  def('Arena Points Growth', 'mainRanking', { emoji: '🗡️', titleReward: 'iron-willed count/ess' }),
  def('Talent Increase', 'mainRanking', { emoji: '📜', titleReward: 'fearless count/ess' }),
  def('Intimacy', 'mainRanking', { emoji: '❤️‍🔥', titleReward: 'the red count/ess' }),
  
  // Side rankings (viscount title)
  def('Banquet', 'sideRanking', { emoji: '🍽️', titleReward: 'celebrated viscount/ess' }),
  def('Children Attribute Growth', 'sideRanking', { emoji: '👶', titleReward: 'celebrated viscount/ess' }),
  def('Blood Consumption', 'sideRanking', { emoji: '🩸', titleReward: 'spirited viscount/ess' }),
  def('Bat Consumption', 'sideRanking', { emoji: '🦇', titleReward: 'spirited viscount/ess' }),
  def('Nectar', 'sideRanking', { emoji: '🪻', titleReward: 'spirited viscount/ess' }),

  // Guild rankings
  def('Guild Arena Points Growth', 'guildRanking', { emoji: '⚔️', titleReward: 'bloodletter viscount/ess (MVP), merciless baron (members)' }),
  def('Guild XP', 'guildRanking', { emoji: '👊', titleReward: 'austere viscount/ess (MVP)' }),

  // Main game events
  def('Soulfire Cemetery', 'mainGameEvent', { emoji: '🐶', titleReward: 'ravenous count/ess (MVP)' }),
  def('Monster Maker', 'mainGameEvent', { emoji: '👨‍🦰', titleReward: 'the red count/ess' }),
  def('Finders Keepers', 'mainGameEvent', {emoji: '🐦‍⬛', titleReward: 'celebrated viscount/ess (personal)' }),
  def('Shrouded Seas', 'mainGameEvent', { emoji: '⚓', titleReward: 'soulsworn count/ess' }),
  def('Guardian Gargoyle', 'mainGameEvent', { emoji: '👾', titleReward: 'bewitching count/ess' }),
  def('Nightwings Race', 'mainGameEvent', { emoji: '🦇', titleReward: 'fearless count/ess (MVP)' }),
  def('Abiogenesis Attack', 'mainGameEvent', { emoji: '🦠', titleReward: 'red count/ess' }),
  def('Ghost Hunting', 'mainGameEvent', { emoji: '👻', titleReward: 'soulsworn count/ess (personal)' }),
  def('Street of the Dead', 'mainGameEvent', { emoji: '💀', titleReward: 'iron-willed count/ess' }),
  def('Cupcake Chaos', 'mainGameEvent', { emoji: '🧁', titleReward: 'red count/ess' }),
  def('Nocturne Gallery', 'sideGameEvent', { emoji: '🗿', titleReward: 'iron-willed count/ess' }),

  // Side game events
  def('Haunted Library', 'sideGameEvent', { emoji: '📚' }),
  def('Tasting Party', 'sideGameEvent', { emoji: '🍷' }),
  def('Magic Show', 'sideGameEvent', { emoji: '🪄' }),
  def('Infernal Wishes', 'sideGameEvent', { emoji: '🕯️' }),
  def('Herald of Fate', 'sideGameEvent', { emoji: '🤍' }),
  def('Wishing Well', 'sideGameEvent', { emoji: '🪣' }),
  def('Ring Crafting', 'sideGameEvent', { emoji: '💍' }),
  def('Enigma Lockers', 'sideGameEvent', { emoji: '🗝️' }),

  // Main game events (additional)
  def('Sweet Treats', 'mainGameEvent', { emoji: '🍬', titleReward: 'red count/ess' }),

  // Special / limited events
  def('Sin & Symphony', 'special', { emoji: '😈', notes: 'Long-running special event for new lovers' }),
  def('Clockwork Fortune', 'special', { emoji: '🎰', notes: 'Often runs longer than a single cycle' }),
  def('Sinistria', 'special', { emoji: '🏰', notes: 'big gamemode event' }),
  def('Sinister Spindle', 'special', { emoji: '🛞', notes: 'Skin unlock event' }),
  def('Summer Nights', 'special', { emoji: '⛱️', titleReward: 'bewitching count/ess (personal)' }),
  def('Halloween Streets', 'special', { emoji: '🎃', notes: 'Seasonal Halloween event' }),
  def("Librarian's Gardens", 'special', { emoji: '🌸', notes: 'Often runs 6 days with emoji/skin rewards' }),
  def('Macabria Times', 'special', { emoji: '📰', notes: 'Often runs 6 days; satin/cashmere for boutique' }),
  def('Heartbreaker', 'special', { emoji: '🎯', notes: 'Throw darts to win gems; often 7 days' }),
  def('Road to Riches', 'special', { emoji: '💰', notes: 'Purchase path event; often 7 days' }),
  def('Vamp-O-Matic', 'special', { emoji: '🧛‍♂️', notes: 'Task/box pyramid event; often 6 days' }),
  def('Winter Solstice', 'special', { emoji: '❄️', notes: 'Multi-week series with sub-events' }),
  def('Cruel Krampus', 'special', { emoji: '🎄', notes: 'Winter Solstice sub-event' }),
  def('Winter Cheer', 'special', { emoji: '🎁', notes: 'Winter Solstice sub-event; stocking rankings' }),
  def('Yuletide Hunt', 'special', { emoji: '🐺', titleReward: 'adored margrave/ine' }),
  def('Festival Fun', 'special', { emoji: '🎪', titleReward: 'indomitable margrave/ine (personal)' }),
  def('Cross Server Banquet', 'special', { emoji: '🍽️', notes: 'Asia CS banquet; Party A-Lister ranking' }),
]

export const eventDefinitionMap: Record<string, EventDefinition> = Object.fromEntries(
  eventDefinitions.map((e) => [e.id, e])
)

export function getEventDefinition(id: string): EventDefinition | undefined {
  return eventDefinitionMap[id]
}

export function getEventsByCategory(category: EventCategory): EventDefinition[] {
  return eventDefinitions.filter((e) => e.category === category)
}
