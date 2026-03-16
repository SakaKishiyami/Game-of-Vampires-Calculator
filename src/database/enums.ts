// =====================================================
// Database Enums
// =====================================================
// These enums correspond to database enum values
// Used for type safety and space optimization
// =====================================================

// Familiar Tier Enum (S, A, B, C, D)
export enum FamiliarTier {
  S = 0,
  A = 1,
  B = 2,
  C = 3,
  D = 4
}

export const FamiliarTierMaxLevel: Record<FamiliarTier, number> = {
  [FamiliarTier.S]: 50,
  [FamiliarTier.A]: 40,
  [FamiliarTier.B]: 30,
  [FamiliarTier.C]: 20,
  [FamiliarTier.D]: 10
};

// Familiar Type Enum (placeholder - add actual types)
export enum FamiliarType {
  Gloomcap = 0,
  // Add more familiar types as needed
  // Example: Shadowfang = 1, Brightwing = 2, etc.
}

// Mutation Enum (0 = not mutated, 1 = mutated)
export enum MutationStatus {
  NotMutated = 0,
  Mutated = 1
}

// Familiar Attribute Enum (5 stats)
export enum FamiliarAttribute {
  Loyalty = 0,
  Ferocity = 1,
  Tenacity = 2,
  Instinct = 3,
  Mischief = 4
}

// Bond Type Enum (14 types - placeholder values)
export enum BondType {
  Bond1 = 0,
  Bond2 = 1,
  Bond3 = 2,
  Bond4 = 3,
  Bond5 = 4,
  Bond6 = 5,
  Bond7 = 6,
  Bond8 = 7,
  Bond9 = 8,
  Bond10 = 9,
  Bond11 = 10,
  Bond12 = 11,
  Bond13 = 12,
  Bond14 = 13
}

// Bond Requirement Type Enum
export enum BondRequirementType {
  Type1 = 0, // Higher requirements: 60/90/120/150/180
  Type2 = 1  // Lower requirements: 50/80/110/140/170
}

// Event Type Enum
export enum EventType {
  Ranking = 0,
  Event = 1,
  Special = 2
}

// Event Review Status Enum
export enum EventReviewStatus {
  AwaitingReview = 0,
  Approved = 1,
  Rejected = 2
}
