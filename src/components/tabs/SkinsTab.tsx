"use client"

import { useState } from 'react'
import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SKIN_LEDGER_ROWS, describeWardenSkinRarity, type LoverSkinRarity, type WardenSkinRarity } from '@/data/skinLedger'
import { WARDEN_CATALOG } from '@/data/wardenCatalog'
import { LOVER_SKINS, getLoverPortraitSrcs } from '@/utils/loverImagePaths'
import { getDefaultWardenSkinRarity } from '@/data/wardenSkinDefaultRarity'
import {
  wardenSkinAttributeTotal,
  wardenSkinRarityFlat,
  resolveWardenSkinRarity,
} from '@/utils/calculators/skinLedgerCalculations'
import { nonNegativeIntInputProps } from '@/utils/helpers'

/** Same card art as Scarlet Bond lover skin checkboxes. */
function loverSkinCardSrc(skinKey: string) {
  return `/Gov/SkinCards/LoverSkins/${skinKey}.png`
}

/** Same card art as Wardens tab skin toggles. */
function wardenSkinCardSrc(skinKey: string) {
  return `/Gov/SkinCards/WardenSkins/${skinKey}.png`
}

function UrlImageWithFallback({
  candidates,
  alt,
  className,
  emptyClassName,
}: {
  candidates: string[]
  alt: string
  className?: string
  emptyClassName?: string
}) {
  const [idx, setIdx] = useState(0)
  const imgCls = className ?? 'w-12 h-12 object-contain rounded border border-gray-700 bg-gray-900/60 shrink-0'
  const emptyCls =
    emptyClassName ??
    'w-12 h-12 rounded border border-gray-700 bg-gray-900/60 shrink-0 flex items-center justify-center text-[10px] text-gray-500 text-center p-1'
  if (idx >= candidates.length) {
    return <div className={emptyCls}>{alt}</div>
  }
  return (
    <img
      src={candidates[idx]}
      alt={alt}
      className={imgCls}
      onError={() => setIdx((i) => i + 1)}
    />
  )
}

function parseWardenRarity(v: string): WardenSkinRarity {
  const n = parseInt(v, 10)
  if (n === 2 || n === 3) return n
  return 1 /* 1 = purple */
}

function parseLoverRarity(v: string): LoverSkinRarity {
  return parseInt(v, 10) === 2 ? 2 : 1 /* 1 = purple, 2 = orange */
}

export default function SkinsTab() {
  const {
    skinLedger,
    wardenSkins,
    setWardenSkins,
    wardenActiveSkins,
    wardenSkinLevels,
    setWardenSkinLevels,
    wardenSkinRarityOverrides,
    setWardenSkinRarityOverrides,
    loverOwnedSkins,
    loverSkinRarities,
    setLoverSkinRarities,
    getWardenImageSrc,
  } = useGameCalculator()

  const setWardenRarity = (warden: string, skin: string, r: WardenSkinRarity) => {
    setWardenSkinRarityOverrides((prev) => ({
      ...prev,
      [warden]: { ...prev[warden], [skin]: r },
    }))
  }

  const setLoverRarity = (base: string, skin: string, r: LoverSkinRarity) => {
    setLoverSkinRarities((prev) => ({
      ...prev,
      [base]: { ...prev[base], [skin]: r },
    }))
  }

  const setWardenSkinLevel = (warden: string, skin: string, n: number) => {
    setWardenSkinLevels((prev) => ({
      ...prev,
      [warden]: { ...prev[warden], [skin]: Math.max(1, Math.floor(n) || 1) },
    }))
  }
  const toggleWardenSkinOwned = (warden: string, skin: string) => {
    setWardenSkins((prev) => ({
      ...prev,
      [warden]: { ...prev[warden], [skin]: !prev[warden]?.[skin] },
    }))
  }
  const displayWardenName = (name: string) => (name === 'Dahlia' ? 'Eddie' : name)

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-red-400">Skin collection ledger</CardTitle>
          <p className="text-sm text-gray-400">
            Collection EXP sums tier-1 values from every <strong>owned</strong> warden and lover skin. Ledger tiers stack
            (children %, flat warden stats, and extra steps on warden skin attribute bases). Equip a warden skin on the
            Wardens tab for its attribute bonus to apply to totals.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded border border-gray-600 p-3 bg-gray-900/40">
              <div className="text-gray-400 text-xs">Collection EXP</div>
              <div className="text-xl font-semibold text-white">{skinLedger.collectionExp.toLocaleString()}</div>
            </div>
            <div className="rounded border border-gray-600 p-3 bg-gray-900/40">
              <div className="text-gray-400 text-xs">Ledger tier reached</div>
              <div className="text-xl font-semibold text-amber-300">{skinLedger.tier} / 8</div>
            </div>
            <div className="rounded border border-gray-600 p-3 bg-gray-900/40">
              <div className="text-gray-400 text-xs">Warden skin base boosts</div>
              <div className="text-xl font-semibold text-cyan-300">{skinLedger.skinBaseBoostSteps}</div>
              <div className="text-[11px] text-gray-500 mt-1">Each step adds +100% of the skin’s tier-1 attribute flat before star doubling.</div>
            </div>
            <div className="rounded border border-gray-600 p-3 bg-gray-900/40">
              <div className="text-gray-400 text-xs">Intimacy (lover skins, owned)</div>
              <div className="text-xl font-semibold text-pink-300">{skinLedger.intimacyFromLoversSkins.toLocaleString()}</div>
            </div>
          </div>
          <div className="text-gray-300">
            <span className="text-gray-400">Children / familiars total-attribute multiplier from ledger: </span>
            <span className="text-green-300 font-medium">×{skinLedger.familiarTotalAttrsMultiplier.toFixed(3)}</span>
            <span className="text-gray-500"> ({skinLedger.childrenTotalAttrsPct}% from tiers)</span>
          </div>
          <div className="overflow-x-auto border border-gray-700 rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-900/80 text-gray-400">
                <tr>
                  <th className="p-2">Tier</th>
                  <th className="p-2">Need EXP</th>
                  <th className="p-2">Children attrs</th>
                  <th className="p-2">All warden attrs</th>
                  <th className="p-2">Skin base boosts</th>
                </tr>
              </thead>
              <tbody>
                {SKIN_LEDGER_ROWS.map((row) => {
                  const unlocked = skinLedger.collectionExp >= row.minCollection
                  return (
                    <tr key={row.tier} className={unlocked ? 'bg-green-950/30 text-green-100' : 'text-gray-500'}>
                      <td className="p-2">{row.tier}</td>
                      <td className="p-2">{row.minCollection.toLocaleString()}</td>
                      <td className="p-2">{row.childrenTotalAttrsPct ? `+${row.childrenTotalAttrsPct}%` : '—'}</td>
                      <td className="p-2">+{row.wardenAllFlat}</td>
                      <td className="p-2">{row.skinBaseBoostSteps ? `+${row.skinBaseBoostSteps}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-purple-300">Lover skins (purple / orange)</CardTitle>
          <p className="text-sm text-gray-400">
            Mark skins owned in Scarlet Bond. Rarity codes: <strong>1</strong> = purple, <strong>2</strong> = orange (defaults
            to 1). Tier-1: purple +200 intimacy / +50 EXP / +1% affinity; orange +500 / +100 / +2%. Active skin affinity
            applies to bond suggestions for that lover.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(LOVER_SKINS).map(([baseName, skins]) => {
            if (!skins.length) return null
            const owned = loverOwnedSkins[baseName]
            if (!owned || !Object.keys(owned).some((k) => owned[k])) return null
            const portraitCandidates = getLoverPortraitSrcs(baseName)[0] ?? []
            return (
              <div key={baseName} className="border border-gray-700 rounded-md p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <UrlImageWithFallback
                    candidates={portraitCandidates}
                    alt={baseName}
                    className="w-11 h-11 object-contain rounded border border-gray-700 bg-gray-900/60 shrink-0"
                    emptyClassName="w-11 h-11 rounded border border-gray-700 bg-gray-900/60 shrink-0 flex items-center justify-center text-[9px] text-gray-500 text-center p-1"
                  />
                  <div className="font-medium text-white">{baseName}</div>
                </div>
                {skins.map((skinKey) => {
                  if (!owned[skinKey]) return null
                  const r = loverSkinRarities[baseName]?.[skinKey] ?? 1 /* 1 = purple */
                  return (
                    <div key={skinKey} className="flex flex-wrap items-center gap-3 text-sm">
                      <img
                        src={loverSkinCardSrc(skinKey)}
                        alt=""
                        className="w-14 h-14 object-contain rounded border border-gray-700 bg-gray-900/50 shrink-0"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <span className="text-gray-300 w-36 sm:w-44 truncate font-mono text-xs">{skinKey}</span>
                      <select
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                        value={String(r)}
                        onChange={(e) => setLoverRarity(baseName, skinKey, parseLoverRarity(e.target.value))}
                      >
                        <option value="1">1 — purple</option>
                        <option value="2">2 — orange</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {Object.keys(loverOwnedSkins).every((b) => !loverOwnedSkins[b] || !Object.values(loverOwnedSkins[b]).some(Boolean)) && (
            <p className="text-gray-500 text-sm">No lover skins marked owned yet — use Scarlet Bond to check owned skins.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-blue-300">Warden skins — rarity & star level</CardTitle>
          <p className="text-sm text-gray-400">
            Rarity codes: <strong>1</strong> = purple (+5), <strong>2</strong> = orange (+10), <strong>3</strong> = red (+20).
            Defaults: one skin → 1; two skins → 1 then 2. Known overrides (e.g. Rudra) are in data. Dual-attribute wardens
            apply the skin flat to the <strong>first</strong> listed attribute; Balance applies to all four. Star level 1 =
            ledger-adjusted base only; each extra star doubles the total.
          </p>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WARDEN_CATALOG.filter((w) => w.skins.length > 0).map((w) => {
              const skins = [...w.skins]
              return (
                <div key={w.name} className="border border-gray-700 rounded-md p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={getWardenImageSrc(w.name)}
                    alt=""
                    className="w-11 h-11 object-contain rounded border border-gray-700 bg-gray-900/60 shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="font-medium text-white">{displayWardenName(w.name)}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skins.map((skinKey, idx) => {
                    const isOwned = !!wardenSkins[w.name]?.[skinKey]
                    const rarity = resolveWardenSkinRarity(w.name, skinKey, idx, skins.length, wardenSkinRarityOverrides)
                    const level = wardenSkinLevels[w.name]?.[skinKey] ?? 1
                    const flat0 = wardenSkinRarityFlat(rarity)
                    const preview = wardenSkinAttributeTotal(flat0, skinLedger.skinBaseBoostSteps, level)
                    return (
                      <div key={skinKey} className="rounded border border-gray-800 bg-gray-900/40 p-3 space-y-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={wardenSkinCardSrc(skinKey)}
                            alt=""
                            className="w-24 h-24 object-contain rounded border border-gray-700 bg-gray-900/60 shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <Label className="text-gray-300 text-xs font-mono break-all">{skinKey}</Label>
                            <div className="flex items-center gap-2 mt-2">
                              <Checkbox
                                id={`skin-own-${w.name}-${skinKey}`}
                                checked={isOwned}
                                onCheckedChange={() => toggleWardenSkinOwned(w.name, skinKey)}
                                className="border-gray-400"
                              />
                              <Label htmlFor={`skin-own-${w.name}-${skinKey}`} className="text-xs text-gray-300 cursor-pointer">
                                Owned
                              </Label>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-2">
                              Default:{' '}
                              {describeWardenSkinRarity(getDefaultWardenSkinRarity(w.name, skinKey, idx, skins.length))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <Label className="text-gray-400 text-xs">Rarity</Label>
                            <select
                              className="block mt-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                              value={String(rarity)}
                              disabled={!isOwned}
                              onChange={(e) => setWardenRarity(w.name, skinKey, parseWardenRarity(e.target.value))}
                            >
                              <option value="1">1 — purple (+5)</option>
                              <option value="2">2 — orange (+10)</option>
                              <option value="3">3 — red (+20)</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs">Level</Label>
                            <Input
                              className="mt-1 w-24 bg-gray-900 border-gray-600"
                              disabled={!isOwned}
                              {...nonNegativeIntInputProps(level, (n) => setWardenSkinLevel(w.name, skinKey, Math.max(1, n || 1)), {
                                zeroShowsEmpty: false,
                              })}
                            />
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {isOwned ? (
                            <>
                              Active bonus (if equipped):{' '}
                              <span className="text-green-300 font-mono">+{preview.toLocaleString()}</span> to target stat(s)
                            </>
                          ) : (
                            <span className="text-gray-500">Not owned yet.</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
