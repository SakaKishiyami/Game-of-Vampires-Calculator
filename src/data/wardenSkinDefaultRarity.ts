import type { WardenSkinRarity } from '@/data/skinLedger'
import { SKIN_RARITY_WARDEN } from '@/data/skinLedger'

/**
 * Default rarity for every warden skin.
 * Edit this table directly when the game's skin rarity assignments change.
 */
export const WARDEN_SKIN_RARITY_DEFAULTS: Record<string, Partial<Record<string, WardenSkinRarity>>> = {
  Ivan: { IvanSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Max: { MaxSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Erzsebet: { ErzsebetSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Maria: { MariaSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Eddie: { EddieSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Scarlet: { ScarletSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Sam: { SamSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Grendel: { GrendelSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Rudra: { RudraSkin1: SKIN_RARITY_WARDEN.ORANGE, RudraSkin2: SKIN_RARITY_WARDEN.RED },
  Woden: { WodenSkin1: SKIN_RARITY_WARDEN.ORANGE, WodenSkin2: SKIN_RARITY_WARDEN.RED },
  Artemis: { ArtemisSkin1: SKIN_RARITY_WARDEN.ORANGE, ArtemisSkin2: SKIN_RARITY_WARDEN.RED },
  Finn: { FinnSkin1: SKIN_RARITY_WARDEN.ORANGE, FinnSkin2: SKIN_RARITY_WARDEN.RED },
  Aurelia: { AureliaSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Harker: { HarkerSkin1: SKIN_RARITY_WARDEN.PURPLE, HarkerSkin2: SKIN_RARITY_WARDEN.ORANGE },
  Pavan: { PavanSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Frederick: { FrederickSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Carmilla: { CarmillaSkin1: SKIN_RARITY_WARDEN.PURPLE, CarmillaSkin2: SKIN_RARITY_WARDEN.ORANGE },
  Gilgamesh: { GilgameshSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Tomas: { TomasSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Temujin: { TemujinSkin1: SKIN_RARITY_WARDEN.PURPLE, TemujinSkin2: SKIN_RARITY_WARDEN.ORANGE },
  Josey: { JoseySkin1: SKIN_RARITY_WARDEN.ORANGE },
  Julie: { JulieSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Cleo: { CleoSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Mike: { MikeSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Diana: { DianaSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Damian: { DamianSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Vance: { VanceSkin1: SKIN_RARITY_WARDEN.ORANGE },
  William: { WilliamSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Vicente: { VicenteSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Cornelius: { CorneliusSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Rollo: { RolloSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Morien: { MorienSkin1: SKIN_RARITY_WARDEN.PURPLE, MorienSkin2: SKIN_RARITY_WARDEN.PURPLE },
  Piper: { PiperSkin1: SKIN_RARITY_WARDEN.PURPLE },
  John: { JohnSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Lorenzo: { LorenzoSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Hans: { HansSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Franco: { FrancoSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Alastair: { AlastairSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Elsie: { ElsieSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Nostradamus: { NostradamusSkin1: SKIN_RARITY_WARDEN.PURPLE },
  Erik: { ErikSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Victor: { VictorSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Poe: { PoeSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Candace: { CandaceSkin1: SKIN_RARITY_WARDEN.ORANGE, CandaceSkin2: SKIN_RARITY_WARDEN.PURPLE },
  Cesare: { CesareSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Charlemagne: { CharlemagneSkin1: SKIN_RARITY_WARDEN.ORANGE },
  Thanatos: { ThanatosSkin1: SKIN_RARITY_WARDEN.ORANGE },
}

export function getDefaultWardenSkinRarity(
  wardenName: string,
  skinKey: string,
  skinIndex: number,
  totalSkins: number
): WardenSkinRarity {
  const explicit = WARDEN_SKIN_RARITY_DEFAULTS[wardenName]?.[skinKey]
  if (explicit !== undefined) return explicit
  // Safety fallback for unknown/new skins not yet added above.
  if (totalSkins >= 2) return skinIndex === 0 ? SKIN_RARITY_WARDEN.PURPLE : SKIN_RARITY_WARDEN.ORANGE
  return SKIN_RARITY_WARDEN.PURPLE
}