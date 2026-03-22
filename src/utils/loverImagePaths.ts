/**
 * Resolve public URL paths for lover portraits in /Gov/Lovers/BaseLovers/
 * Same-name F/M pairs use e.g. RavenFemale.png / RavenMale.png (not ravenfemale.png).
 */
export function loverPairImageCandidates(namePart: string): string[] {
  const n = namePart.trim()
  return [`/Gov/Lovers/BaseLovers/${n}.png`, `/Gov/Lovers/BaseLovers/${n}.PNG`]
}

/** "Raven/Raven" → RavenFemale, RavenMale */
export function sameNamePairImageBases(femaleName: string, maleName: string): [string, string] {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  const base = cap(femaleName.trim())
  return [`${base}Female`, `${base}Male`]
}

// Lover base name → skin file keys (without .png)
const LOVER_SKINS: Record<string, string[]> = {
  Ace: ['AceSkin1'],
  Agneyi: ['AgneyiSkin1'],
  Aisha: ['AishaSkin1', 'AishaSkin2'],
  Ajani: ['AjaniSkin1', 'AjaniSkin2'],
  AlexisFemale: ['AlexisFemaleSkin1', 'AlexisFemaleSkin2'],
  AlexisMale: ['AlexisMaleSkin1', 'AlexisMaleSkin2'],
  Antonia: ['AntoniaSkin1'],
  Antonio: ['AntonioSkin1'],
  April: ['AprilSkin1'],
  Aretha: ['ArethaSkin1'],
  Arthur: ['ArthurSkin1'],
  Ava: ['AvaSkin1'],
  Axel: ['AxelSkin1'],
  Azrael: ['AzraelSkin1'],
  Bas: ['BasSkin1'],
  Bess: ['BessSkin1'],
  Briony: ['BrionySkin1'],
  Byron: ['ByronSkin1'],
  Chandra: ['ChandraSkin1'],
  Cordelia: ['CordeliaSkin1'],
  Culann: ['CulannSkin1'],
  Dionysus: ['DionysusSkin1'],
  Elaine: ['ElaineSkin1'],
  Elizabeth: ['ElizabethSkin1'],
  Ellis: ['EllisSkin1'],
  Enki: ['EnkiSkin1'],
  Gabriel: ['GabrielSkin1'],
  Gabrielle: ['GabrielleSkin1'],
  Gawain: ['GawinSkin1'],
  Hanna: ['HannaSkin1'],
  Harriet: ['HarrietSkin1'],
  Harry: ['HarrySkin1'],
  Hela: ['HelaSkin1'],
  Hugo: ['HugoSkin1'],
  Inanna: ['InannaSkin1'],
  Isabella: ['IsabellaSkin1'],
  Izan: ['IzanSkin1'],
  Jen: ['JenSkin1'],
  Johan: ['JohanSkin1'],
  Johanna: ['JohannaSkin1'],
  Kal: ['KalSkin1'],
  Luca: ['LucaSkin1'],
  Lucy: ['LucySkin1'],
  Mairi: ['MairiSkin1'],
  Martin: ['MartinSkin1'],
  Mary: ['MarySkin1'],
  Michael: ['MichaelSkin1'],
  Michelle: ['MichelleSkin1'],
  Mitchell: ['MitchellSkin1'],
  Morrigan: ['MorriganSkin1'],
  Nefertiti: ['NefertitiSkin1'],
  Nick: ['NickSkin1'],
  Otchigon: ['OtchigonSkin1', 'OtchigonSkin2'],
  Ragnor: ['RagnorSkin1'],
  Ramses: ['RamsesSkin1'],
  RavenFemale: ['RavenFemaleSkin1'],
  RavenMale: ['RavenMaleSkin1'],
  Ray: ['RaySkin1'],
  Redd: ['ReddSkin1'],
  Regina: ['ReginaSkin1'],
  Richmond: ['RichmondSkin1'],
  Roxana: ['RoxanaSkin1'],
  Runa: ['RunaSkin1'],
  Scott: ['ScottSkin1'],
  Skylar: ['SkylarSkin1'],
  Subutai: ['SubutaiSkin1', 'SubutaiSkin2'],
  Suria: ['SuriaSkin1'],
  Valerian: ['ValerianSkin1'],
  Viola: ['ViolaSkin1'],
  Ward: ['WardSkin1'],
}

export interface LoverSkinSlot {
  baseName: string
  displayName: string
  baseImgCandidates: string[]
  skins: string[]
  isPaired: boolean
}

export function getLoverSkinSlots(loverField: string): LoverSkinSlot[] {
  if (!loverField.includes('/')) {
    const name = loverField.trim()
    return [{ baseName: name, displayName: name, baseImgCandidates: loverPairImageCandidates(name), skins: LOVER_SKINS[name] ?? [], isPaired: false }]
  }
  const parts = loverField.split('/').map((s) => s.trim())
  if (parts.length !== 2) return [{ baseName: loverField, displayName: loverField, baseImgCandidates: loverPairImageCandidates(loverField), skins: [], isPaired: false }]
  const [a, b] = parts
  if (a.toLowerCase() === b.toLowerCase()) {
    const [fBase, mBase] = sameNamePairImageBases(a, b)
    return [
      { baseName: fBase, displayName: `${a} (F)`, baseImgCandidates: loverPairImageCandidates(fBase), skins: LOVER_SKINS[fBase] ?? [], isPaired: true },
      { baseName: mBase, displayName: `${b} (M)`, baseImgCandidates: loverPairImageCandidates(mBase), skins: LOVER_SKINS[mBase] ?? [], isPaired: true },
    ]
  }
  return [
    { baseName: a, displayName: a, baseImgCandidates: loverPairImageCandidates(a), skins: LOVER_SKINS[a] ?? [], isPaired: true },
    { baseName: b, displayName: b, baseImgCandidates: loverPairImageCandidates(b), skins: LOVER_SKINS[b] ?? [], isPaired: true },
  ]
}

export function getLoverPortraitSrcs(loverField: string): string[][] {
  if (!loverField.includes('/')) {
    return [loverPairImageCandidates(loverField)]
  }
  const parts = loverField.split('/').map((s) => s.trim())
  if (parts.length !== 2) return [loverPairImageCandidates(loverField)]

  const [a, b] = parts
  if (a.toLowerCase() === b.toLowerCase()) {
    const [f, m] = sameNamePairImageBases(a, b)
    return [loverPairImageCandidates(f), loverPairImageCandidates(m)]
  }
  return [loverPairImageCandidates(a), loverPairImageCandidates(b)]
}
