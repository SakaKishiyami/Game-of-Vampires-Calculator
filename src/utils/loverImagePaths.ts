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
