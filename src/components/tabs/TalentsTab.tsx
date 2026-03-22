"use client"

import { useGameCalculator } from '@/context/GameCalculatorContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAttributeColor, nonNegativeIntInputProps } from '@/utils/helpers'
import { domIncreasePerStarData } from '@/data/talent_stars'

export default function TalentsTab() {
  const { talents, setTalents, syncTalentsToInventory } = useGameCalculator()

  return (
    <div className="space-y-6">
      {/* Talent Scrolls */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Talent Scrolls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Random Talent Scrolls */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Random Talent Scrolls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Random Talent Scroll (5-1000 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.randomTalentScroll.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      randomTalentScroll: { ...prev.randomTalentScroll, count: newCount },
                    }))
                    syncTalentsToInventory('randomTalentScroll', newCount)
                  })}
                />
                <p className="text-xs text-gray-400">Average: ~502.5 exp each</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Talent Scroll Lvl 4 (41-80 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.talentScrollLvl4.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      talentScrollLvl4: { ...prev.talentScrollLvl4, count: newCount },
                    }))
                    syncTalentsToInventory('talentScrollLvl4', newCount)
                  })}
                />
                <p className="text-xs text-gray-400">Average: ~60.5 exp each</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Talent Scroll Lvl 3 (21-40 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.talentScrollLvl3.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      talentScrollLvl3: { ...prev.talentScrollLvl3, count: newCount },
                    }))
                    syncTalentsToInventory('talentScrollLvl3', newCount)
                  })}
                />
                <p className="text-xs text-gray-400">Average: ~30.5 exp each</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Talent Scroll Lvl 2 (6-20 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.talentScrollLvl2.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      talentScrollLvl2: { ...prev.talentScrollLvl2, count: newCount },
                    }))
                    syncTalentsToInventory('talentScrollLvl2', newCount)
                  })}
                />
                <p className="text-xs text-gray-400">Average: ~13 exp each</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Talent Scroll Lvl 1 (1-5 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.talentScrollLvl1.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      talentScrollLvl1: { ...prev.talentScrollLvl1, count: newCount },
                    }))
                    syncTalentsToInventory('talentScrollLvl1', newCount)
                  })}
                />
                <p className="text-xs text-gray-400">Average: ~3 exp each</p>
              </div>
            </div>
          </div>
          
          {/* Fixed Talent Scrolls */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Fixed Talent Scrolls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Basic Talent Scroll (50 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.basicTalentScroll.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      basicTalentScroll: { ...prev.basicTalentScroll, count: newCount },
                    }))
                    syncTalentsToInventory('basicTalentScroll', newCount)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Fine Talent Scroll (100 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.fineTalentScroll.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      fineTalentScroll: { ...prev.fineTalentScroll, count: newCount },
                    }))
                    syncTalentsToInventory('fineTalentScroll', newCount)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Superior Talent Scroll (200 exp)</Label>
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0"
                  {...nonNegativeIntInputProps(talents.superiorTalentScroll.count, (newCount) => {
                    setTalents((prev: any) => ({
                      ...prev,
                      superiorTalentScroll: { ...prev.superiorTalentScroll, count: newCount },
                    }))
                    syncTalentsToInventory('superiorTalentScroll', newCount)
                  })}
                />
              </div>
            </div>
          </div>
          
          {/* Total Experience Display */}
          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Total Talent Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-gray-400 text-xs">Total Experience</div>
                <div className="text-white">
                  {(() => {
                    const total = 
                      (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                      (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                      (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                      (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                      (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                      (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                      (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                      (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                    return total.toLocaleString();
                  })()} Exp
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">Stars Gained</div>
                <div className="text-white">
                  {(() => {
                    const totalExp = 
                      (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                      (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                      (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                      (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                      (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                      (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                      (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                      (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                    const stars = Math.floor(totalExp / 200);
                    return stars.toLocaleString();
                  })()} Stars
                </div>
                <div className="text-gray-500 text-xs">(200 exp = 1 star)</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">DOM Bonus</div>
                <div className="text-green-400">
                  {(() => {
                    const totalExp = 
                      (talents.randomTalentScroll.count * talents.randomTalentScroll.exp) +
                      (talents.talentScrollLvl4.count * talents.talentScrollLvl4.exp) +
                      (talents.talentScrollLvl3.count * talents.talentScrollLvl3.exp) +
                      (talents.talentScrollLvl2.count * talents.talentScrollLvl2.exp) +
                      (talents.talentScrollLvl1.count * talents.talentScrollLvl1.exp) +
                      (talents.basicTalentScroll.count * talents.basicTalentScroll.exp) +
                      (talents.fineTalentScroll.count * talents.fineTalentScroll.exp) +
                      (talents.superiorTalentScroll.count * talents.superiorTalentScroll.exp);
                    const stars = Math.floor(totalExp / 200);
                    const levelData = domIncreasePerStarData.find(data => 250 >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
                    const domBonus = levelData.constant * stars;
                    return `+${domBonus.toLocaleString()}`;
                  })()} DOM
                </div>
                <div className="text-gray-500 text-xs">(Split across attributes)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Attribute Scripts */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Attribute Scripts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Script Success Rate Calculations */}
          {(() => {
            const calculateScriptResults = (script: any) => {
              if (script.selectedStar === 0 || script.quantity === 0) {
                return {
                  expectedUpgrades: 0,
                  expectedStars: 0,
                  minStars: 0,
                  maxStars: 0,
                  attempts: 0
                };
              }
              
              const successRates = [1.0, 0.833, 0.666, 0.5, 0.333, 0.166];
              const rate = successRates[script.selectedStar - 1];
              const expectedUpgrades = script.quantity * rate;
              const expectedStars = expectedUpgrades * script.selectedStar;
              
              return {
                expectedUpgrades: Math.round(expectedUpgrades * 100) / 100,
                expectedStars: Math.round(expectedStars * 100) / 100,
                minStars: Math.floor(expectedStars),
                maxStars: Math.ceil(expectedStars),
                attempts: script.quantity
              };
            };
            
            const getStarBonus = (wardenLevel: number, starCount: number) => {
              const levelData = domIncreasePerStarData.find(data => wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
              return levelData.constant * starCount;
            };
            
            return (
              <div className="space-y-6">
                {/* High/Low Range Summary */}
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Expected Script Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                      const script = talents[scriptKey];
                      const results = calculateScriptResults(script);
                      const bonus = getStarBonus(script.wardenLevel, results.expectedStars);
                      return (
                        <div key={scriptKey} className="text-center">
                          <div className="text-gray-300 font-medium capitalize">{scriptKey.replace('Script', '')}</div>
                          <div className="text-white">{results.minStars}-{results.maxStars} stars</div>
                          <div className="text-gray-400 text-xs">~{results.expectedStars} expected</div>
                          <div className="text-green-400 text-xs">+{bonus.toLocaleString()} dom</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Individual Script Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                    const script = talents[scriptKey];
                    const results = calculateScriptResults(script);
                    const attributeName = scriptKey.replace('Script', '');
                    
                    return (
                      <div key={scriptKey} className="space-y-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
                        <h3 className={`text-base font-semibold capitalize ${getAttributeColor(attributeName)}`}>
                          {attributeName} Script
                        </h3>
                        
                        {/* Warden Level & Dom per star (single line) */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-gray-300 text-xs">Warden Lv.</Label>
                            <Input
                              className="bg-gray-700 border-gray-600 text-white w-20 h-8 text-xs"
                              {...nonNegativeIntInputProps(script.wardenLevel, (n) =>
                                setTalents((prev: any) => ({
                                  ...prev,
                                  [scriptKey]: {
                                    ...prev[scriptKey],
                                    wardenLevel: Math.min(500, Math.max(1, n || 1)),
                                  },
                                }))
                              )}
                            />
                          </div>
                          <div className="text-gray-400 text-xs">
                            Dom/star: {(() => {
                              const levelData = domIncreasePerStarData.find(data => script.wardenLevel >= data.level) || domIncreasePerStarData[domIncreasePerStarData.length - 1];
                              return levelData.constant.toLocaleString();
                            })()}
                          </div>
                        </div>
                        
                        {/* Star Selection (compact chips) */}
                        <div className="space-y-1">
                          <Label className="text-gray-300 text-xs">Star level:</Label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setTalents((prev: any) => ({
                                ...prev,
                                [scriptKey]: { ...prev[scriptKey], selectedStar: 0, quantity: 0 }
                              }))}
                              className={`px-2 py-1 rounded-full text-[11px] border ${
                                script.selectedStar === 0
                                  ? 'bg-gray-200 text-gray-900 border-gray-300'
                                  : 'bg-gray-800 text-gray-300 border-gray-600'
                              }`}
                            >
                              None
                            </button>
                            {[1, 2, 3, 4, 5, 6].map(star => {
                              const successRate = [100, 83.3, 66.6, 50, 33.3, 16.6][star - 1];
                              const isActive = script.selectedStar === star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setTalents((prev: any) => ({
                                    ...prev,
                                    [scriptKey]: { ...prev[scriptKey], selectedStar: star }
                                  }))}
                                  className={`px-2 py-1 rounded-full text-[11px] border ${
                                    isActive
                                      ? 'bg-red-600 text-white border-red-500'
                                      : 'bg-gray-800 text-gray-300 border-gray-600'
                                  }`}
                                >
                                  {star}★ {successRate}%
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Quantity Input */}
                        {script.selectedStar > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-gray-300 text-xs">Attempts:</Label>
                            <Input
                              className="bg-gray-700 border-gray-600 text-white w-20 h-8 text-xs"
                              placeholder="0"
                              {...nonNegativeIntInputProps(script.quantity, (quantity) =>
                                setTalents((prev: any) => ({
                                  ...prev,
                                  [scriptKey]: { ...prev[scriptKey], quantity },
                                }))
                              )}
                            />
                            <div className="text-gray-400 text-[11px]">
                              {script.selectedStar}★ rolls
                            </div>
                          </div>
                        )}
                        
                        {/* Results Display */}
                        <div className="grid grid-cols-2 gap-3 p-2 bg-gray-700/30 rounded">
                          <div>
                            <div className="text-gray-400 text-[11px]">Attempts</div>
                            <div className="text-sm text-white">{results.attempts}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-[11px]">Upgrades (avg)</div>
                            <div className="text-sm text-white">{results.expectedUpgrades}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-[11px]">Stars (avg)</div>
                            <div className="text-sm text-white">{results.expectedStars}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-[11px]">Dom Bonus</div>
                            <div className="text-green-400 text-sm">
                              +{getStarBonus(script.wardenLevel, results.expectedStars).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total Script Results */}
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">Total Script Benefits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['strengthScript', 'allureScript', 'intellectScript', 'spiritScript'].map(scriptKey => {
                      const script = talents[scriptKey];
                      const results = calculateScriptResults(script);
                      const bonus = getStarBonus(script.wardenLevel, results.expectedStars);
                      const attributeName = scriptKey.replace('Script', '');
                      
                      return (
                        <div key={scriptKey} className="text-center">
                          <div className="text-gray-300 font-medium capitalize">{attributeName}</div>
                          <div className="text-white">{results.expectedStars} stars</div>
                          <div className="text-green-400">+{bonus.toLocaleString()} dom</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="text-center">
                      <div className="text-gray-300 font-medium">Total Expected Dom Gain</div>
                      <div className="text-xl text-green-400">
                        +{(() => {
                          const total = ['strengthScript', 'allureScript', 'intellectScript', 'spiritScript']
                            .reduce((sum, scriptKey) => {
                              const script = talents[scriptKey];
                              const results = calculateScriptResults(script);
                              return sum + getStarBonus(script.wardenLevel, results.expectedStars);
                            }, 0);
                          return total.toLocaleString();
                        })()} Dom
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  )
}
