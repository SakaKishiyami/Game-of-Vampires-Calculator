// Inventory helper functions extracted from GameCalculator

import type { Inventory } from '@/types'

/**
 * Format item name for display
 */
export function formatItemName(fileName: string): string {
  let nameWithoutExt = fileName.replace(/\.(PNG|png)$/, '')
  
  if (nameWithoutExt.includes('100K')) {
    nameWithoutExt = nameWithoutExt.replace('100K', '100k')
  }
  if (nameWithoutExt.includes('5M')) {
    nameWithoutExt = nameWithoutExt.replace('5M', '5M')
  }
  if (nameWithoutExt.includes('Random')) {
    if (nameWithoutExt.includes('Blood') || nameWithoutExt.includes('Nectar') || nameWithoutExt.includes('Bat')) {
      const baseName = nameWithoutExt.replace('Random', '').trim()
      nameWithoutExt = `Random ${baseName}`
    }
  }
  
  if (nameWithoutExt === 'Skill8') nameWithoutExt = 'Skill8WIP'
  if (nameWithoutExt === 'Skill6') nameWithoutExt = 'Skill6WIP'
  if (nameWithoutExt === 'Skill5') nameWithoutExt = 'Skill5WIP'
  if (nameWithoutExt === 'Skill4') nameWithoutExt = 'Skill4WIP'
  
  nameWithoutExt = nameWithoutExt.replace(/(\d)\s+(\d)/g, '$1$2')
  nameWithoutExt = nameWithoutExt.replace(/E\s+X\s+P/g, 'EXP')
  
  return nameWithoutExt
    .replace(/([A-Z])/g, ' $1')
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Z])/g, '$1 $2')
    .replace(/^ /, '')
    .trim()
}

/**
 * Get item category based on item name
 */
export function getItemCategory(itemName: string): string {
  const categories = {
    'Resources': ['Nectar', 'Bat', 'Blood', 'ResourceCollectorCard'],
    'WardenItems': ['Allure', 'Intellect', 'Spirit', 'Strength', 'Talent', 'Mystery', 'Skill', 'Dominance', 'ArenaTrophy', 'BloodOriginToken', 'WonderlandSummonToken', 'CityBadge', 'CircusTicket', 'MacabrianCoin', 'NewSummonCoin', 'SupremacyBadge', 'RandomScroll', 'RandomScriptPart'],
    'Lover+ChildItems': ['Intimacy', 'Attraction', 'Plazma', 'PremiumGiftBox', 'RingOfChange', 'RoseBouquet', 'TourMap', 'Vito', 'AffinityArmlet', 'AgneyiToken', 'AmethystRing', 'CharmBox', 'CharmPhial', 'CrateOfDrinks', 'CulannToken', 'DailyAttractionBox', 'HelaToken', 'IndigoBouquet', 'IntimacyBag', 'RubyRing', 'BlackPearlRing', 'GiftBox', 'RandomRingBox', 'DailySecretPack', 'DeluxeGiftBox', 'CharmBottle', 'IntimacyCase', 'AzureBouquet', 'Beast', 'IntimacyPurse', 'ArtLoverToken', 'AffinityLvl', 'LoverToken', 'HeartOfWarToken', 'MayaToken'],
    'FamiliarItems': ['MutationPotion', 'EffigyOfRobustness', 'FamiliarFood', 'BangBear', 'FamiliarPhiltre', 'Ambrosia Elixir'],
    'MiscItems': ['LookingGlass', 'CourageTablet', 'NoviceLeague', 'PressCard', 'Prestige', 'RenameCard', 'SanctuaryStandardFlag', 'SolidarityStandardFlag', 'SophisticatedSatin', 'ValiantSlate', 'AdvancedItemDonation', 'AdvancedLeague', 'AlchemyFormula', 'BanishmentStandardFlag', 'BanquetFavor', 'ChallengeFlag', 'ConclaveStandardFlag', 'ExquisiteSilk', 'GrandBanquetDecor', 'GrandBanquetInvitation', 'GuildEXPChest', 'HuntFlag', 'ImpeccableCashmere', 'InterLeague', 'ItemDonation', 'LoudSpeaker', 'LuxuryBanquetDecor', 'LuxuryBanquetInvitation', 'RematchFlag', 'AllyFlag', 'ArenaMedal', 'GuardianFlag', 'MirageMirror', 'PocketWatch', 'BackgroundWinter', 'BackgroundFireworks'],
    'WardenEquip': ['NightfallEquip', 'NightfallMedal', 'NightfallSuit', 'TwilightEquip', 'BloodMoonEquip', 'BloodMoonSuit', 'DarkSunEquip', 'DarkSunMedal', 'DarkSunSuit', 'DuskMedal', 'DuskRing', 'FallenStarEquip', 'FallenStarSuit', 'MidnightEquip', 'MidnightRing', 'TwilightRing', 'NightfallRing', 'FallenStarRing', 'DarkSunRing', 'TwilightSuit', 'BloodMoonRing', 'DuskSuit', 'FallenStarMedal', 'MidnightSuit', 'MidnightMedal', 'TwilightMedal', 'BloodMoonMedal']
  }

  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => itemName.includes(item))) {
      return category
    }
  }
  return 'MiscItems'
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: string): string[] {
  const itemLists = {
    'Resources': ['Blood5M', 'BloodRandom', 'Blood100K', 'Blood7', 'Blood6', 'Blood5', 'Blood4', 'Blood3', 'Blood2', 'Blood1', 'Nectar5M', 'NectarRandom', 'Nectar100K', 'Nectar7', 'Nectar6', 'Nectar5', 'Nectar4', 'Nectar3', 'Nectar2', 'Nectar1', 'Bats5M', 'BatRandom', 'Bat100K', 'Bat7', 'Bat6', 'Bat5', 'Bat4', 'Bat3', 'Bat2', 'Bat1', 'ResourceCollectorCard'],
    'WardenItems': ['BloodOriginToken', 'WonderlandSummonToken', 'WonderlandSummonTokenPart', 'SupremacyBadge', 'SupremacyBadgePart', 'MacabrianCoin', 'MacabrianCoinPart', 'CircusTicket', 'CircusTicketPart', 'CityBadge', 'CityBadgePart', 'ArenaTrophy', 'ArenaTrophyPart', 'NewSummonCoin', 'NewSummonCoinPart', 'SupremacyBadgeRandomBox', 'MacabrianCoinRandomBox', 'CircusTicketRandomBox', 'CityBadgeRandomBox', 'RandomScroll', 'RandomScriptPart', 'StrengthScript', 'AllureScript', 'IntellectScript', 'SpiritScript', 'TalentScroll6Star', 'TalentScroll5Star', 'TalentScroll4Star', 'TalentScroll3Star', 'TalentScroll2Star', 'TalentScroll1Star', 'TalentRandom5', 'TalentScroll7', 'TalentScroll6', 'TalentScroll5', 'TalentScroll4', 'TalentScroll3', 'TalentScroll2', 'TalentScroll1', 'TalentScroll50', 'TalentScroll100', 'TalentScroll200', 'Talent4', 'Talent3', 'Talent2', 'Talent1', 'Mystery1', 'Mystery2', 'Mystery3', 'Mystery4', 'Mystery5', 'Mystery15(1)', 'Mystery15(2)', 'Strength1', 'Strength2', 'Strength3', 'Strength4', 'Strength6', 'Strength15(1)', 'Strength15(2)', 'Allure1', 'Allure2', 'Allure3', 'Allure4', 'Allure5', 'Allure15(1)', 'Allure15(2)', 'Intellect1', 'Intellect2', 'Intellect3', 'Intellect4', 'Intellect5', 'Intellect15(1)', 'Intellect15(2)', 'Spirit1', 'Spirit2', 'Spirit3', 'Spirit4', 'Spirit5', 'Spirit15(1)', 'Spirit15(2)', 'Dominance4', 'Dominance3', 'Dominance2', 'Dominance1', 'DominanceBox', 'Skill8', 'Skill6', 'Skill4', 'Skill5', 'Skill500', 'SkillElixirRandom1000', 'SkillElixirRandom100', 'SkillElixirRandom50', 'SkillElixir4', 'SkillElixir3', 'SkillElixir2', 'SkillElixir1'],
    'Lover+ChildItems': ['AgneyiToken', 'CulannToken', 'HelaToken', 'ArtLoverToken', 'EddieLoverToken', 'HeartOfWarToken', 'MayaToken', 'SamLoverToken', 'ScarletLoverToken', 'DailySecretPack', 'IntimacyCase', 'IntimacyBag', 'IntimacyPurse', 'PremiumGiftBox3', 'DeluxeGiftBox2', 'GiftBox1', 'Intimacy4', 'Intimacy3', 'Intimacy2', 'Intimacy1', 'TourMap', 'CrateOfDrinks', 'Beast', 'Vito', 'Plazma', 'DailyAttractionBox', 'CharmBox', 'CharmBottle2', 'CharmPhial1', 'IndigoBouquet3', 'AzureBouquet2', 'RoseBouquet1', 'Attraction4', 'Attraction3', 'Attraction2', 'Attraction1', 'BlackPearlRing3', 'RubyRing2', 'AmethystRing1', 'RingOfChange', 'RandomRingBox', 'AffinityLvl2', 'AffinityLvl1', 'AffinityArmlet'],
    'FamiliarItems': ['MutationPotion1', 'MutationPotion2', 'MutationPotion3', 'EffigyOfRobustness', 'FamiliarFood', 'BangBear', 'FamiliarPhiltre', 'Ambrosia Elixir'],
    'MiscItems': ['ExquisiteSilk', 'ImpeccableCashmere', 'SophisticatedSatin', 'LoudSpeaker', 'PocketWatch', 'Prestige2', 'Prestige1', 'BanquetFavor', 'PressCard', 'CourageTablet', 'LookingGlass', 'AdvancedItemDonation2', 'AdvancedItemDonationPart', 'ItemDonation1', 'ItemDonationPart', 'GuildEXPChest4', 'GuildEXPChest3', 'GuildEXPChest2', 'GuildEXPChest1', 'StarBanishmentStandardFlag', 'BanishmentStandardFlag', 'StarConclaveStandardFlag', 'ConclaveStandardFlag', 'ConclaveStandardFlagPart', 'StarSolidarityStandardFlag', 'SolidarityStandardFlag', 'StarSanctuaryStandardFlag', 'SanctuaryStandardFlag', 'BanquetFavor2', 'GrandBanquetInvitation', 'GrandBanquetDecor', 'LuxuryBanquetInvitation', 'LuxuryBanquetDecor', 'RematchFlag', 'AllyFlag', 'ChallengeFlag', 'GuardianFlag', 'HuntFlag', 'ArenaMedal', 'AdvancedLeague3', 'InterLeague2', 'NoviceLeague1', 'MirageMirror', 'RenameCard', 'BackgroundWinter', 'BackgroundFireworks'],
    'WardenEquip': ['NightfallEquip', 'NightfallMedal', 'NightfallSuit', 'NightfallRing', 'TwilightEquip', 'TwilightMedal', 'TwilightRing', 'TwilightSuit', 'BloodMoonEquip', 'BloodMoonMedal', 'BloodMoonRing', 'BloodMoonSuit', 'DarkSunEquip', 'DarkSunMedal', 'DarkSunRing', 'DarkSunSuit', 'DuskMedal', 'DuskRing', 'DuskSuit', 'FallenStarEquip', 'FallenStarMedal', 'FallenStarRing', 'FallenStarSuit', 'MidnightEquip', 'MidnightMedal', 'MidnightRing', 'MidnightSuit']
  }
  return itemLists[category as keyof typeof itemLists] || []
}

/**
 * Group items by type for better organization
 */
export function groupItemsByType(items: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  
  items.forEach(item => {
    let type = 'Other'
    
    if (item.includes('BloodOriginToken') || item.includes('SupremacyBadge') || item.includes('MacabrianCoin') || 
        item.includes('CircusTicket') || item.includes('CityBadge') || item.includes('ArenaTrophy') || 
        item.includes('NewSummonCoin')) {
      type = 'Special Items'
    }
    else if (item.includes('Script') || item.includes('RandomScroll') || item.includes('RandomScriptPart')) type = 'Scripts'
    else if (item.includes('Talent')) type = 'Talents'
    else if (item.includes('Mystery')) type = 'Mystery'
    else if (item.includes('Strength')) type = 'Strength'
    else if (item.includes('Allure')) type = 'Allure'
    else if (item.includes('Intellect')) type = 'Intellect'
    else if (item.includes('Spirit')) type = 'Spirit'
    else if (item.includes('Dominance')) type = 'Dominance'
    else if (item.includes('Skill')) type = 'Skills'
    else if (item.includes('Token')) type = 'Tokens'
    else if (item.includes('Intimacy') || item.includes('DailySecretPack') || item.includes('PremiumGiftBox') || 
             item.includes('DeluxeGiftBox') || item.includes('GiftBox')) type = 'Intimacy'
    else if (item.includes('TourMap') || item.includes('CrateOfDrinks') || item.includes('Beast') || 
             item.includes('Vito') || item.includes('Plazma')) type = 'Drinks'
    else if (item.includes('Attraction') || item.includes('Charm') || item.includes('Bouquet')) type = 'Attraction'
    else if (item.includes('Ring')) type = 'Rings'
    else if (item.includes('Affinity')) type = 'Affinity'
    else if (item.includes('ExquisiteSilk') || item.includes('ImpeccableCashmere') || item.includes('SophisticatedSatin')) type = 'Skin'
    else if (item.includes('LoudSpeaker') || item.includes('PocketWatch') || item.includes('Prestige') || 
             (item.includes('BanquetFavor') && !item.includes('BanquetFavor2')) || item.includes('PressCard')) type = 'Useable'
    else if (item.includes('CourageTablet') || item.includes('LookingGlass')) type = 'Underworld'
    else if (item.includes('ItemDonation') || item.includes('GuildEXPChest')) type = 'Guild'
    else if (item.includes('StandardFlag') || item.includes('Conclave')) type = 'Conclave'
    else if (item.includes('Banquet') || item.includes('Luxury')) type = 'Banquet'
    else if (item.includes('Flag') || item.includes('ArenaMedal')) type = 'Arena'
    else if (item.includes('League')) type = 'League'
    else if (item.includes('MirageMirror') || item.includes('RenameCard') || item.includes('Background')) type = 'Customization'
    else if (item.includes('Blood')) type = 'Blood'
    else if (item.includes('Bat') || item.includes('ResourceCollectorCard')) type = 'Bat'
    else if (item.includes('Nectar')) type = 'Nectar'
    else if (item.includes('BloodMoon')) type = 'Blood Moon'
    else if (item.includes('DarkSun')) type = 'Dark Sun'
    else if (item.includes('Dusk')) type = 'Dusk'
    else if (item.includes('FallenStar')) type = 'Fallen Star'
    else if (item.includes('Midnight')) type = 'Midnight'
    else if (item.includes('Nightfall')) type = 'Nightfall'
    else if (item.includes('Twilight')) type = 'Twilight'
    
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(item)
  })
  
  return groups
}
