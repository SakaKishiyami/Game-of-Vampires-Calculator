-- =====================================================
-- Game Calculator Database Schema - SQL Server (SSMS)
-- =====================================================
-- This schema is for ERD generation purposes
-- For actual implementation, see database_schema_supabase.sql
-- =====================================================
-- This schema supports:
-- - User accounts with calculator configurations
-- - Familiar records with detailed stats, bonds, and mutations
-- - Breeding history
-- - Event tracking records
-- =====================================================

-- =====================================================
-- ENUMS (stored as TINYINT for space efficiency)
-- =====================================================
-- Tier: 0 = S, 1 = A, 2 = B, 3 = C, 4 = D
-- Familiar Type: 0 = Gloomcap, 1+ = other types (see enums.ts)
-- Mutation: 0 = Not Mutated, 1 = Mutated
-- Attribute: 0 = Loyalty, 1 = Ferocity, 2 = Tenacity, 3 = Instinct, 4 = Mischief
-- Bond Type: 0-13 (14 types, see enums.ts)
-- Bond Requirement Type: 0 = Type1, 1 = Type2
-- Event Type: 0 = Ranking, 1 = Event, 2 = Special
-- Review Status: 0 = Awaiting Review, 1 = Approved, 2 = Rejected

-- =====================================================
-- 1. USER ACCOUNTS
-- =====================================================

CREATE TABLE user_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255),
    display_name NVARCHAR(255),
    avatar_url NVARCHAR(MAX),
    timezone NVARCHAR(50) DEFAULT 'UTC',
    preferred_language NVARCHAR(10) DEFAULT 'en',
    last_login_at DATETIME2,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- =====================================================
-- 2. CALCULATOR CONFIGURATION (1:1 with User Account)
-- =====================================================
-- Each user has one saved calculator configuration

CREATE TABLE calculator_configurations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
    config_data NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON stored as string
    version NVARCHAR(50) DEFAULT '1.0.0',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_calculator_configurations_user_id 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT UQ_calculator_configurations_user_id UNIQUE (user_id)
);

-- =====================================================
-- 3. FAMILIAR RECORDS (1:N with User Account)
-- =====================================================
-- A user may own many familiars
-- Each familiar has 5 stats: Loyalty, Ferocity, Tenacity, Instinct, Mischief
-- Each familiar has 2 "main" attributes (randomized at birth, stays the same)
-- Each familiar has a mutation flag
-- Each familiar has a bond (14 types, level 1-6 based on 2 attribute levels)

CREATE TABLE familiar_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Familiar identification
    familiar_name NVARCHAR(255) NOT NULL, -- User can name, defaults to type + number if empty
    familiar_type TINYINT NOT NULL, -- Enum: 0 = Gloomcap, etc. (see enums.ts)
    tier TINYINT NOT NULL, -- Enum: 0 = S, 1 = A, 2 = B, 3 = C, 4 = D
    
    -- Base attributes (at birth) - 5 stats
    base_loyalty SMALLINT NOT NULL DEFAULT 0,
    base_ferocity SMALLINT NOT NULL DEFAULT 0,
    base_tenacity SMALLINT NOT NULL DEFAULT 0,
    base_instinct SMALLINT NOT NULL DEFAULT 0,
    base_mischief SMALLINT NOT NULL DEFAULT 0,
    
    -- Current attributes (base + level gains) - defaults to base values
    current_loyalty SMALLINT NOT NULL DEFAULT 0,
    current_ferocity SMALLINT NOT NULL DEFAULT 0,
    current_tenacity SMALLINT NOT NULL DEFAULT 0,
    current_instinct SMALLINT NOT NULL DEFAULT 0,
    current_mischief SMALLINT NOT NULL DEFAULT 0,
    
    -- Main attributes (2 of the 5, randomized at birth, higher chance for level gains)
    main_attribute_1 TINYINT NOT NULL, -- Enum: 0-4 (Loyalty, Ferocity, Tenacity, Instinct, Mischief)
    main_attribute_2 TINYINT NOT NULL, -- Enum: 0-4 (must be different from main_attribute_1)
    
    -- Bond information
    bond_type TINYINT, -- Enum: 0-13 (14 bond types, see enums.ts)
    bond_level TINYINT DEFAULT 1,
    bond_attribute_1 TINYINT, -- Enum: 0-4 (one of the 5 stats)
    bond_attribute_2 TINYINT, -- Enum: 0-4 (one of the 5 stats, must be different)
    bond_requirement_type TINYINT, -- Enum: 0 = Type1, 1 = Type2
    
    -- Mutation
    has_mutation TINYINT DEFAULT 0, -- Enum: 0 = Not Mutated, 1 = Mutated
    
    -- Level and progression
    level TINYINT DEFAULT 1,
    
    -- Breeding information
    parent_1_id INT NULL,
    parent_2_id INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_familiar_records_user_id 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT FK_familiar_records_parent_1 
        FOREIGN KEY (parent_1_id) REFERENCES familiar_records(id) ON DELETE SET NULL,
    CONSTRAINT FK_familiar_records_parent_2 
        FOREIGN KEY (parent_2_id) REFERENCES familiar_records(id) ON DELETE SET NULL,
    CONSTRAINT CK_familiar_records_bond_level CHECK (bond_level >= 1 AND bond_level <= 6),
    CONSTRAINT CK_familiar_records_level CHECK (level >= 1 AND level <= 50),
    CONSTRAINT CK_familiar_records_level_within_tier CHECK (
        (tier = 0 AND level <= 50) OR -- S tier
        (tier = 1 AND level <= 40) OR -- A tier
        (tier = 2 AND level <= 30) OR -- B tier
        (tier = 3 AND level <= 20) OR -- C tier
        (tier = 4 AND level <= 10)    -- D tier
    ),
    CONSTRAINT CK_familiar_records_different_parents CHECK (
        parent_1_id IS NULL OR parent_2_id IS NULL OR parent_1_id != parent_2_id
    ),
    CONSTRAINT CK_familiar_records_different_main_attributes CHECK (
        main_attribute_1 != main_attribute_2
    ),
    CONSTRAINT CK_familiar_records_valid_bond_attributes CHECK (
        (bond_attribute_1 IS NULL AND bond_attribute_2 IS NULL) OR
        (bond_attribute_1 IS NOT NULL AND bond_attribute_2 IS NOT NULL AND
         bond_attribute_1 != bond_attribute_2 AND
         bond_attribute_1 >= 0 AND bond_attribute_1 <= 4 AND
         bond_attribute_2 >= 0 AND bond_attribute_2 <= 4)
    )
);

-- =====================================================
-- 4. BREEDING HISTORY (1:N with User Account, 2:N with Familiar Record)
-- =====================================================
-- Each breeding record references exactly two parent familiars
-- A user may have many breeding simulations

CREATE TABLE breeding_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    user_id_2 UNIQUEIDENTIFIER NULL, -- Optional second user for testing with another player's familiar
    
    -- Parent familiars (exactly two required)
    parent_familiar_1_id INT NOT NULL,
    parent_familiar_2_id INT NOT NULL,
    
    -- Expected offspring attributes (base attributes only - main/bond attributes are random)
    expected_base_loyalty SMALLINT,
    expected_base_ferocity SMALLINT,
    expected_base_tenacity SMALLINT,
    expected_base_instinct SMALLINT,
    expected_base_mischief SMALLINT,
    
    -- Expected offspring properties
    expected_tier TINYINT,
    expected_has_mutation TINYINT DEFAULT 0, -- Enum: 0 = Not Mutated, 1 = Mutated
    
    -- Breeding parameters
    mutation_potions_used TINYINT DEFAULT 0,
    effigy_of_robustness_used BIT DEFAULT 0,
    mutation_probability DECIMAL(5, 2), -- Percentage (0-100) for mutation chance
    resulting_familiar_id INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_breeding_history_user_id 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT FK_breeding_history_user_id_2 
        FOREIGN KEY (user_id_2) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT FK_breeding_history_parent_1 
        FOREIGN KEY (parent_familiar_1_id) REFERENCES familiar_records(id) ON DELETE CASCADE,
    CONSTRAINT FK_breeding_history_parent_2 
        FOREIGN KEY (parent_familiar_2_id) REFERENCES familiar_records(id) ON DELETE CASCADE,
    CONSTRAINT FK_breeding_history_resulting_familiar 
        FOREIGN KEY (resulting_familiar_id) REFERENCES familiar_records(id) ON DELETE SET NULL,
    CONSTRAINT CK_breeding_history_different_parents CHECK (parent_familiar_1_id != parent_familiar_2_id),
    CONSTRAINT CK_breeding_history_expected_tier CHECK (expected_tier IS NULL OR (expected_tier >= 0 AND expected_tier <= 4))
);

-- =====================================================
-- 5. CURRENT EVENTS (1:N with User Account)
-- =====================================================
-- Tracks active/current events for users
-- For ranking events: calculates max possible ranking based on inventory/resources

CREATE TABLE current_events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Event identification
    event_name NVARCHAR(255) NOT NULL,
    event_type TINYINT NOT NULL, -- Enum: 0 = Ranking, 1 = Event, 2 = Special
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    
    -- For ranking events: calculated max possible ranking
    calculated_max_ranking INT, -- Based on current inventory/resources
    current_resources_used NVARCHAR(MAX), -- JSON: resources currently used
    inventory_snapshot NVARCHAR(MAX), -- JSON: inventory state at event start
    
    -- Calculator snapshot at event start
    calculator_snapshot NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON stored as string
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_current_events_user_id 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. EVENT TRACKING RECORDS (1:N with User Account)
-- =====================================================
-- Historical event records with final rankings and resource usage
-- Used for ML predictions in future events

CREATE TABLE event_tracking_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL,
    
    -- Event identification
    event_name NVARCHAR(255) NOT NULL,
    event_type TINYINT NOT NULL, -- Enum: 0 = Ranking, 1 = Event, 2 = Special
    event_date DATE NOT NULL,
    
    -- Final results (for ranking events)
    final_ranking INT, -- Final rank achieved
    resources_used NVARCHAR(MAX), -- JSON: total resources used
    
    -- Snapshot of calculator state at event time
    calculator_snapshot NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON stored as string
    
    -- Verification
    screenshot_url NVARCHAR(MAX), -- Screenshot for verification
    review_status TINYINT DEFAULT 0, -- Enum: 0 = Awaiting Review, 1 = Approved, 2 = Rejected
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_event_tracking_records_user_id 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- User profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Calculator configurations
CREATE INDEX idx_calculator_configurations_user_id ON calculator_configurations(user_id);

-- Familiar records
CREATE INDEX idx_familiar_records_user_id ON familiar_records(user_id);
CREATE INDEX idx_familiar_records_name ON familiar_records(familiar_name);
CREATE INDEX idx_familiar_records_type ON familiar_records(familiar_type);
CREATE INDEX idx_familiar_records_tier ON familiar_records(tier);
CREATE INDEX idx_familiar_records_bond_type ON familiar_records(bond_type);
CREATE INDEX idx_familiar_records_bond_level ON familiar_records(bond_level);
CREATE INDEX idx_familiar_records_level ON familiar_records(level);
CREATE INDEX idx_familiar_records_parent_1 ON familiar_records(parent_1_id);
CREATE INDEX idx_familiar_records_parent_2 ON familiar_records(parent_2_id);

-- Breeding history
CREATE INDEX idx_breeding_history_user_id ON breeding_history(user_id);
CREATE INDEX idx_breeding_history_user_id_2 ON breeding_history(user_id_2);
CREATE INDEX idx_breeding_history_parent_1 ON breeding_history(parent_familiar_1_id);
CREATE INDEX idx_breeding_history_parent_2 ON breeding_history(parent_familiar_2_id);
CREATE INDEX idx_breeding_history_resulting_familiar ON breeding_history(resulting_familiar_id);
CREATE INDEX idx_breeding_history_created_at ON breeding_history(created_at DESC);

-- Current events
CREATE INDEX idx_current_events_user_id ON current_events(user_id);
CREATE INDEX idx_current_events_event_type ON current_events(event_type);
CREATE INDEX idx_current_events_event_start_date ON current_events(event_start_date DESC);

-- Event tracking records
CREATE INDEX idx_event_tracking_user_id ON event_tracking_records(user_id);
CREATE INDEX idx_event_tracking_event_name ON event_tracking_records(event_name);
CREATE INDEX idx_event_tracking_event_type ON event_tracking_records(event_type);
CREATE INDEX idx_event_tracking_event_date ON event_tracking_records(event_date DESC);
CREATE INDEX idx_event_tracking_review_status ON event_tracking_records(review_status);
CREATE INDEX idx_event_tracking_created_at ON event_tracking_records(created_at DESC);