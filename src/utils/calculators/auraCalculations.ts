// Aura calculation functions
import type { SelectedWardens, Inventory } from '@/types'
import { initialAuras } from '@/data/auras'
import { resolveLoverSummonFlags, getLoverAuraPercentDisplay } from '@/utils/loverScarletBondAuras'

export interface AuraBonuses {
  talents: {
    strength: number
    allure: number
    intellect: number
    spirit: number
    all: number
  }
  books: {
    strength: number
    allure: number
    intellect: number
    spirit: number
    all: number
  }
}

export function calculateLoverAuraLevels(
  auras: any,
  hasAgneyi: boolean,
  hasCulann: boolean,
  hasHela: boolean,
  hasDionysus: boolean,
  hasMaya: boolean,
  hasEmber: boolean,
  hasAsh: boolean,
  inventory: Inventory
) {
  const s = resolveLoverSummonFlags(
    { hasAgneyi, hasCulann, hasHela, hasDionysus, hasMaya, hasEmber, hasAsh },
    inventory
  )
  const loverAuras = JSON.parse(JSON.stringify({ ...initialAuras.lovers, ...(auras.lovers || {}) }))

  loverAuras.Agneyi.current = getLoverAuraPercentDisplay('Agneyi', s)
  loverAuras.Culann.current = getLoverAuraPercentDisplay('Culann', s)
  loverAuras.Hela.current = getLoverAuraPercentDisplay('Hela', s)
  if (loverAuras.Dionysus) loverAuras.Dionysus.current = getLoverAuraPercentDisplay('Dionysus', s)
  if (loverAuras.Maya) loverAuras.Maya.current = getLoverAuraPercentDisplay('Maya', s)
  if (loverAuras.EmberAsh) loverAuras.EmberAsh.current = getLoverAuraPercentDisplay('EmberAsh', s)

  return loverAuras
}

export function calculateDynamicAuraLevels(
  auras: any,
  selectedWardens: SelectedWardens,
  hasAgneyi: boolean,
  hasCulann: boolean,
  hasHela: boolean,
  hasDionysus: boolean,
  hasMaya: boolean,
  hasEmber: boolean,
  hasAsh: boolean,
  inventory: Inventory
) {
  const dynamicAuras = JSON.parse(JSON.stringify(auras))
  
  dynamicAuras.lovers = calculateLoverAuraLevels(
    auras,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    inventory
  )
  
  // Wild Hunt Wardens
  const selectedWildHunt = selectedWardens.hunt || []
  const wildHuntCount = selectedWildHunt.length
  const wildHuntBaseLevel = wildHuntCount > 0 ? 9 : 0
  const wildHuntBonus = Math.max(0, wildHuntCount - 1)
  
  const wildHuntNames = ["Rudra", "Woden", "Artemis", "Finn"]
  wildHuntNames.forEach(name => {
    if (selectedWildHunt.includes(name)) {
      dynamicAuras.wildHunt[name].current = wildHuntBaseLevel + wildHuntBonus
    } else {
      dynamicAuras.wildHunt[name].current = 0
    }
  })
  
  // Monster Noir Wardens
  const selectedMonsterNoir = selectedWardens.noir || []
  const monsterNoirCount = selectedMonsterNoir.length
  const monsterNoirBaseLevel = monsterNoirCount > 0 ? 9 : 0
  const monsterNoirBonus = Math.max(0, monsterNoirCount - 1)
  
  const monsterNoirNames = ["Eddie", "Scarlet", "Sam", "Grendel"]
  monsterNoirNames.forEach(name => {
    if (selectedMonsterNoir.includes(name)) {
      dynamicAuras.monsterNoir[name].current = monsterNoirBaseLevel + monsterNoirBonus
    } else {
      dynamicAuras.monsterNoir[name].current = 0
    }
  })
  
  // Bloody Tyrants Wardens
  const selectedBloodyTyrants = selectedWardens.tyrants || []
  const bloodyTyrantsCount = selectedBloodyTyrants.length
  const bloodyTyrantsBaseLevel = bloodyTyrantsCount > 0 ? 10 : 0
  const bloodyTyrantsBonus = Math.max(0, bloodyTyrantsCount - 1)
  
  const bloodyTyrantsNames = ["Max", "Erzsebet", "Ivan", "Maria"]
  bloodyTyrantsNames.forEach(name => {
    if (selectedBloodyTyrants.includes(name)) {
      if (name === "Maria") {
        dynamicAuras.bloodyTyrants[name].current = bloodyTyrantsCount > 0 ? 5 + (bloodyTyrantsBonus * 0.5) : 0
      } else {
        dynamicAuras.bloodyTyrants[name].current = bloodyTyrantsBaseLevel + bloodyTyrantsBonus
      }
    } else {
      dynamicAuras.bloodyTyrants[name].current = 0
    }
  })
  
  // Cirque du Macabre Wardens
  const selectedCircus = selectedWardens.circus || []
  const circusCount = selectedCircus.length
  const circusBaseLevel = circusCount > 0 ? 10 : 0
  const circusBonus = Math.max(0, circusCount - 1)
  
  const circusNames = ["Thorgrim", "Naja", "Diavolo", "Jester", "Dominique"]
  circusNames.forEach(name => {
    if (selectedCircus.includes(name)) {
      if (name === "Dominique") {
        dynamicAuras.cirque[name].current = circusCount > 0 ? 5 + (circusBonus * 0.5) : 0
      } else {
        dynamicAuras.cirque[name].current = circusBaseLevel + circusBonus
      }
    } else {
      dynamicAuras.cirque[name].current = 0
    }
  })
  
  return dynamicAuras
}

export function calculateAuraBonuses(
  auras: any,
  selectedWardens: SelectedWardens,
  vipLevel: number,
  hasNyx: boolean,
  hasDracula: boolean,
  hasVictor: boolean,
  hasFrederick: boolean,
  hasAgneyi: boolean,
  hasCulann: boolean,
  hasHela: boolean,
  hasDionysus: boolean,
  hasMaya: boolean,
  hasEmber: boolean,
  hasAsh: boolean,
  inventory: Inventory
): AuraBonuses {
  const dynamicAuras = calculateDynamicAuraLevels(
    auras,
    selectedWardens,
    hasAgneyi,
    hasCulann,
    hasHela,
    hasDionysus,
    hasMaya,
    hasEmber,
    hasAsh,
    inventory
  )
  const bonuses: AuraBonuses = {
    talents: {
      strength: 100,
      allure: 100,
      intellect: 100,
      spirit: 100,
      all: 100
    },
    books: {
      strength: 100,
      allure: 100,
      intellect: 100,
      spirit: 100,
      all: 100
    }
  }

  // Wild Hunt Wardens - Talent bonuses
  const wildHuntWardens = dynamicAuras.wildHunt
  Object.entries(wildHuntWardens).forEach(([wardenName, wardenData]: [string, any]) => {
    const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
    
    switch (wardenName) {
      case "Rudra":
        bonuses.talents.strength += currentBonus
        break
      case "Woden":
        bonuses.talents.allure += currentBonus
        break
      case "Artemis":
        bonuses.talents.intellect += currentBonus
        break
      case "Finn":
        bonuses.talents.spirit += currentBonus
        break
    }
  })

  // Monster Noir Wardens - Book bonuses
  const monsterNoirWardens = dynamicAuras.monsterNoir
  Object.entries(monsterNoirWardens).forEach(([wardenName, wardenData]: [string, any]) => {
    const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
    
    switch (wardenName) {
      case "Eddie":
        bonuses.books.strength += currentBonus
        break
      case "Scarlet":
        bonuses.books.allure += currentBonus
        break
      case "Sam":
        bonuses.books.intellect += currentBonus
        break
      case "Grendel":
        bonuses.books.spirit += currentBonus
        break
    }
  })

  // Bloody Tyrants Wardens - Dual book bonuses
  const bloodyTyrantsWardens = dynamicAuras.bloodyTyrants
  Object.entries(bloodyTyrantsWardens).forEach(([wardenName, wardenData]: [string, any]) => {
    const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
    
    switch (wardenName) {
      case "Max":
        bonuses.books.strength += currentBonus
        bonuses.books.spirit += currentBonus
        break
      case "Erzsebet":
        bonuses.books.allure += currentBonus
        bonuses.books.intellect += currentBonus
        break
      case "Ivan":
        bonuses.books.allure += currentBonus
        bonuses.books.spirit += currentBonus
        break
      case "Maria":
        bonuses.talents.all += currentBonus
        break
    }
  })

  // Cirque du Macabre Wardens - Dual book bonuses
  const cirqueWardens = dynamicAuras.cirque
  Object.entries(cirqueWardens).forEach(([wardenName, wardenData]: [string, any]) => {
    const currentBonus = wardenData.current > 0 ? wardenData.baseValue + (wardenData.current - 1) * wardenData.increment : 0
    
    switch (wardenName) {
      case "Thorgrim":
        bonuses.books.strength += currentBonus
        bonuses.books.intellect += currentBonus
        break
      case "Naja":
        bonuses.books.allure += currentBonus
        bonuses.books.spirit += currentBonus
        break
      case "Diavolo":
        bonuses.books.strength += currentBonus
        bonuses.books.spirit += currentBonus
        break
      case "Jester":
        bonuses.books.allure += currentBonus
        bonuses.books.intellect += currentBonus
        break
      case "Dominique":
        bonuses.books.all += currentBonus
        break
    }
  })

  // Secondary Auras
  if (auras.secondaryAuras) {
    // Wild Hunt Secondary Auras
    Object.entries(auras.secondaryAuras.wildHunt).forEach(([wardenName, wardenData]: [string, any]) => {
      const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
      
      switch (wardenName) {
        case "Rudra":
          bonuses.talents.strength += currentBonus
          break
        case "Woden":
          bonuses.talents.allure += currentBonus
          break
        case "Artemis":
          bonuses.talents.intellect += currentBonus
          break
        case "Finn":
          bonuses.talents.spirit += currentBonus
          break
      }
    })

    // Monster Noir Secondary Auras
    Object.entries(auras.secondaryAuras.monsterNoir).forEach(([wardenName, wardenData]: [string, any]) => {
      const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
      
      switch (wardenName) {
        case "Eddie":
          bonuses.books.strength += currentBonus
          break
        case "Scarlet":
          bonuses.books.allure += currentBonus
          break
        case "Sam":
          bonuses.books.intellect += currentBonus
          break
        case "Grendel":
          bonuses.books.spirit += currentBonus
          break
      }
    })

    // Bloody Tyrants Secondary Auras
    Object.entries(auras.secondaryAuras.bloodyTyrants).forEach(([wardenName, wardenData]: [string, any]) => {
      const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
      
      switch (wardenName) {
        case "Max":
          bonuses.books.strength += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Erzsebet":
          bonuses.books.allure += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Ivan":
          bonuses.books.allure += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Maria":
          bonuses.talents.all += currentBonus
          break
      }
    })

    // Cirque Secondary Auras
    Object.entries(auras.secondaryAuras.cirque).forEach(([wardenName, wardenData]: [string, any]) => {
      const currentBonus = wardenData.baseValue + wardenData.current * wardenData.increment
      
      switch (wardenName) {
        case "Thorgrim":
          bonuses.books.strength += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Naja":
          bonuses.books.allure += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Diavolo":
          bonuses.books.strength += currentBonus
          bonuses.books.spirit += currentBonus
          break
        case "Jester":
          bonuses.books.allure += currentBonus
          bonuses.books.intellect += currentBonus
          break
        case "Dominique":
          bonuses.books.all += currentBonus
          break
      }
    })
  }

  // VIP Wardens
  const vipWardens = auras.vip
  Object.entries(vipWardens).forEach(([wardenName, wardenData]: [string, any]) => {
    if (vipLevel >= wardenData.vipRequired) {
      if (wardenData.talents && wardenData.books) {
        switch (wardenName) {
          case "Poe":
          case "Damian":
          case "Vance":
          case "Diana":
          case "Thanatos":
          case "Mara":
            bonuses.talents.all += wardenData.talents.current
            bonuses.books.all += wardenData.books.current
            break
        }
      } else {
        switch (wardenName) {
          case "Tomas":
            bonuses.talents.strength += wardenData.current
            bonuses.talents.intellect += wardenData.current
            break
          case "Cleo":
            bonuses.talents.allure += wardenData.current
            bonuses.talents.spirit += wardenData.current
            break
          case "Aurelia":
            bonuses.talents.strength += wardenData.current
            bonuses.talents.spirit += wardenData.current
            break
          case "William":
            bonuses.talents.allure += wardenData.current
            bonuses.talents.intellect += wardenData.current
            break
        }
      }
    }
  })

  // Paid Pack Wardens
  if (hasVictor) {
    bonuses.talents.strength += auras.paidPacks.Victor.current
  }
  if (hasFrederick) {
    bonuses.talents.allure += auras.paidPacks.Frederick.talents.current
    const frederickBooksBonus = auras.paidPacks.Frederick.books.baseValue + 
      (auras.paidPacks.Frederick.books.current - 1) * auras.paidPacks.Frederick.books.increment
    bonuses.books.allure += frederickBooksBonus
  }

  // Special Wardens
  if (hasDracula) {
    bonuses.talents.all += auras.special.Dracula.talents.current
    bonuses.books.all += auras.special.Dracula.books.current
  }
  if (hasNyx) {
    bonuses.talents.all += auras.special.Nyx.talents.current
    bonuses.books.all += auras.special.Nyx.books.current
  }

  // Apply "All" bonuses to individual attributes
  const finalBonuses: AuraBonuses = {
    talents: {
      strength: bonuses.talents.strength + bonuses.talents.all - 100,
      allure: bonuses.talents.allure + bonuses.talents.all - 100,
      intellect: bonuses.talents.intellect + bonuses.talents.all - 100,
      spirit: bonuses.talents.spirit + bonuses.talents.all - 100
    },
    books: {
      strength: bonuses.books.strength + bonuses.books.all - 100,
      allure: bonuses.books.allure + bonuses.books.all - 100,
      intellect: bonuses.books.intellect + bonuses.books.all - 100,
      spirit: bonuses.books.spirit + bonuses.books.all - 100
    }
  }

  return finalBonuses
}
