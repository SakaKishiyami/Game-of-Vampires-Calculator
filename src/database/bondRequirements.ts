// =====================================================
// Bond Requirements Data
// =====================================================
// This file contains the attribute requirements for each bond level
// Used instead of a database lookup table to save space
// =====================================================

import { BondRequirementType } from './enums';

export interface BondRequirement {
  bondLevel: number;
  attributeRequirement: number;
}

export const BondRequirements: Record<BondRequirementType, Record<number, number>> = {
  [BondRequirementType.Type1]: {
    2: 60,
    3: 90,
    4: 120,
    5: 150,
    6: 180
  },
  [BondRequirementType.Type2]: {
    2: 50,
    3: 80,
    4: 110,
    5: 140,
    6: 170
  }
};

/**
 * Get the attribute requirement for a bond level and type
 * @param requirementType The bond requirement type (Type1 or Type2)
 * @param bondLevel The bond level (2-6)
 * @returns The attribute requirement value, or undefined if invalid
 */
export function getBondRequirement(
  requirementType: BondRequirementType,
  bondLevel: number
): number | undefined {
  return BondRequirements[requirementType]?.[bondLevel];
}

/**
 * Calculate the bond level based on attribute values and requirement type
 * @param attr1Value First attribute value
 * @param attr2Value Second attribute value
 * @param requirementType The bond requirement type
 * @returns The calculated bond level (1-6)
 */
export function calculateBondLevel(
  attr1Value: number,
  attr2Value: number,
  requirementType: BondRequirementType
): number {
  const minAttrValue = Math.min(attr1Value, attr2Value);
  const requirements = BondRequirements[requirementType];
  
  // Check from highest to lowest level
  for (let level = 6; level >= 2; level--) {
    const requirement = requirements[level];
    if (requirement && minAttrValue >= requirement) {
      return level;
    }
  }
  
  return 1; // Default to level 1
}
