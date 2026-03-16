-- =====================================================
-- Game Calculator Database Schema - Supabase/PostgreSQL
-- =====================================================
-- Translated from database_schema.sql (SQL Server/SSMS)
-- This is the implementation schema for Supabase
-- =====================================================
-- This schema supports:
-- - User accounts with calculator configurations
-- - Familiar records with detailed stats, bonds, and mutations
-- - Breeding history
-- - Event tracking records
-- =====================================================

-- =====================================================
-- ENUMS (stored as SMALLINT; SQL Server used TINYINT)
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
-- Note: User accounts are managed by Supabase Auth (auth.users table)
-- This table extends the auth.users with additional profile information

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferred_language TEXT DEFAULT 'en',
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CALCULATOR CONFIGURATION (1:1 with User Account)
-- =====================================================
-- Each user has one saved calculator configuration

CREATE TABLE IF NOT EXISTS calculator_configurations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Configuration data stored as JSONB for flexibility
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadata
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT calculator_configurations_user_id_key UNIQUE (user_id)
);

-- =====================================================
-- 3. FAMILIAR RECORDS (1:N with User Account)
-- =====================================================
-- A user may own many familiars
-- Each familiar has 5 stats: Loyalty, Ferocity, Tenacity, Instinct, Mischief
-- Each familiar has 2 "main" attributes (randomized at birth, stays the same)
-- Each familiar has a mutation flag
-- Each familiar has a bond (14 types, level 1-6 based on 2 attribute levels)

CREATE TABLE IF NOT EXISTS familiar_records (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Familiar identification
    familiar_name TEXT NOT NULL, -- User can name, defaults to type + number if empty
    familiar_type SMALLINT NOT NULL, -- Enum: 0 = Gloomcap, etc. (see enums.ts)
    tier SMALLINT NOT NULL, -- Enum: 0 = S, 1 = A, 2 = B, 3 = C, 4 = D
    
    -- Base attributes (at birth) - 5 stats
    base_loyalty SMALLINT NOT NULL DEFAULT 0,
    base_ferocity SMALLINT NOT NULL DEFAULT 0,
    base_tenacity SMALLINT NOT NULL DEFAULT 0,
    base_instinct SMALLINT NOT NULL DEFAULT 0,
    base_mischief SMALLINT NOT NULL DEFAULT 0,
    
    -- Current attributes (base + level gains) - defaults to base values via trigger
    current_loyalty SMALLINT NOT NULL DEFAULT 0,
    current_ferocity SMALLINT NOT NULL DEFAULT 0,
    current_tenacity SMALLINT NOT NULL DEFAULT 0,
    current_instinct SMALLINT NOT NULL DEFAULT 0,
    current_mischief SMALLINT NOT NULL DEFAULT 0,
    
    -- Main attributes (2 of the 5, randomized at birth, higher chance for level gains)
    main_attribute_1 SMALLINT NOT NULL, -- Enum: 0-4 (Loyalty, Ferocity, Tenacity, Instinct, Mischief)
    main_attribute_2 SMALLINT NOT NULL, -- Enum: 0-4 (must be different from main_attribute_1)
    
    -- Bond information
    bond_type SMALLINT, -- Enum: 0-13 (14 bond types, see enums.ts)
    bond_level SMALLINT DEFAULT 1 CHECK (bond_level >= 1 AND bond_level <= 6),
    bond_attribute_1 SMALLINT, -- Enum: 0-4 (one of the 5 stats)
    bond_attribute_2 SMALLINT, -- Enum: 0-4 (one of the 5 stats, must be different)
    bond_requirement_type SMALLINT, -- Enum: 0 = Type1, 1 = Type2
    
    -- Mutation
    has_mutation SMALLINT DEFAULT 0, -- Enum: 0 = Not Mutated, 1 = Mutated
    
    -- Level and progression
    level SMALLINT DEFAULT 1 CHECK (level >= 1 AND level <= 50),
    
    -- Breeding information
    parent_1_id INTEGER REFERENCES familiar_records(id) ON DELETE SET NULL,
    parent_2_id INTEGER REFERENCES familiar_records(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT familiar_records_level_within_tier CHECK (
        (tier = 0 AND level <= 50) OR -- S tier
        (tier = 1 AND level <= 40) OR -- A tier
        (tier = 2 AND level <= 30) OR -- B tier
        (tier = 3 AND level <= 20) OR -- C tier
        (tier = 4 AND level <= 10)    -- D tier
    ),
    CONSTRAINT familiar_records_different_parents CHECK (
        parent_1_id IS NULL OR parent_2_id IS NULL OR parent_1_id != parent_2_id
    ),
    CONSTRAINT familiar_records_different_main_attributes CHECK (
        main_attribute_1 != main_attribute_2
    ),
    CONSTRAINT familiar_records_valid_main_attributes CHECK (
        main_attribute_1 >= 0 AND main_attribute_1 <= 4 AND
        main_attribute_2 >= 0 AND main_attribute_2 <= 4
    ),
    CONSTRAINT familiar_records_valid_bond_attributes CHECK (
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

CREATE TABLE IF NOT EXISTS breeding_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NULL REFERENCES user_profiles(id) ON DELETE SET NULL, -- Optional second user for testing
    
    -- Parent familiars (exactly two required)
    parent_familiar_1_id INTEGER NOT NULL REFERENCES familiar_records(id) ON DELETE CASCADE,
    parent_familiar_2_id INTEGER NOT NULL REFERENCES familiar_records(id) ON DELETE CASCADE,
    
    -- Expected offspring attributes (base attributes only - main/bond attributes are random)
    expected_base_loyalty SMALLINT,
    expected_base_ferocity SMALLINT,
    expected_base_tenacity SMALLINT,
    expected_base_instinct SMALLINT,
    expected_base_mischief SMALLINT,
    
    -- Expected offspring properties
    expected_tier SMALLINT CHECK (expected_tier IS NULL OR (expected_tier >= 0 AND expected_tier <= 4)),
    expected_has_mutation SMALLINT DEFAULT 0, -- Enum: 0 = Not Mutated, 1 = Mutated
    
    -- Breeding parameters
    mutation_potions_used SMALLINT DEFAULT 0,
    effigy_of_robustness_used BOOLEAN DEFAULT FALSE,
    
    -- Simulation metadata
    mutation_probability DECIMAL(5, 2), -- Percentage (0-100) for mutation chance
    
    -- Result (if breeding was actually performed)
    resulting_familiar_id INTEGER REFERENCES familiar_records(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure parent familiars are different
    CONSTRAINT breeding_history_different_parents CHECK (parent_familiar_1_id != parent_familiar_2_id)
);

-- =====================================================
-- 5. CURRENT EVENTS (1:N with User Account)
-- =====================================================
-- Tracks active/current events for users
-- For ranking events: calculates max possible ranking based on inventory/resources

CREATE TABLE IF NOT EXISTS current_events (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Event identification
    event_name TEXT NOT NULL,
    event_type SMALLINT NOT NULL, -- Enum: 0 = Ranking, 1 = Event, 2 = Special
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    
    -- For ranking events: calculated max possible ranking
    calculated_max_ranking INTEGER, -- Based on current inventory/resources
    current_resources_used JSONB, -- Resources currently used
    inventory_snapshot JSONB, -- Inventory state at event start
    
    -- Calculator snapshot at event start
    calculator_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. EVENT TRACKING RECORDS (1:N with User Account)
-- =====================================================
-- Historical event records with final rankings and resource usage
-- Used for ML predictions in future events

CREATE TABLE IF NOT EXISTS event_tracking_records (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Event identification
    event_name TEXT NOT NULL,
    event_type SMALLINT NOT NULL, -- Enum: 0 = Ranking, 1 = Event, 2 = Special
    event_date DATE NOT NULL,
    
    -- Final results (for ranking events)
    final_ranking INTEGER, -- Final rank achieved
    resources_used JSONB, -- Total resources used
    
    -- Snapshot of calculator state at event time
    calculator_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Verification
    screenshot_url TEXT, -- Screenshot for verification
    review_status SMALLINT DEFAULT 0, -- Enum: 0 = Awaiting Review, 1 = Approved, 2 = Rejected
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- Calculator configurations
CREATE INDEX IF NOT EXISTS idx_calculator_configurations_user_id ON calculator_configurations(user_id);

-- Familiar records
CREATE INDEX IF NOT EXISTS idx_familiar_records_user_id ON familiar_records(user_id);
CREATE INDEX IF NOT EXISTS idx_familiar_records_name ON familiar_records(familiar_name);
CREATE INDEX IF NOT EXISTS idx_familiar_records_type ON familiar_records(familiar_type);
CREATE INDEX IF NOT EXISTS idx_familiar_records_tier ON familiar_records(tier);
CREATE INDEX IF NOT EXISTS idx_familiar_records_bond_type ON familiar_records(bond_type);
CREATE INDEX IF NOT EXISTS idx_familiar_records_bond_level ON familiar_records(bond_level);
CREATE INDEX IF NOT EXISTS idx_familiar_records_level ON familiar_records(level);
CREATE INDEX IF NOT EXISTS idx_familiar_records_parent_1 ON familiar_records(parent_1_id);
CREATE INDEX IF NOT EXISTS idx_familiar_records_parent_2 ON familiar_records(parent_2_id);

-- Breeding history
CREATE INDEX IF NOT EXISTS idx_breeding_history_user_id ON breeding_history(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_history_user_id_2 ON breeding_history(user_id_2);
CREATE INDEX IF NOT EXISTS idx_breeding_history_parent_1 ON breeding_history(parent_familiar_1_id);
CREATE INDEX IF NOT EXISTS idx_breeding_history_parent_2 ON breeding_history(parent_familiar_2_id);
CREATE INDEX IF NOT EXISTS idx_breeding_history_resulting_familiar ON breeding_history(resulting_familiar_id);
CREATE INDEX IF NOT EXISTS idx_breeding_history_created_at ON breeding_history(created_at DESC);

-- Current events
CREATE INDEX IF NOT EXISTS idx_current_events_user_id ON current_events(user_id);
CREATE INDEX IF NOT EXISTS idx_current_events_event_type ON current_events(event_type);
CREATE INDEX IF NOT EXISTS idx_current_events_event_start_date ON current_events(event_start_date DESC);

-- Event tracking records
CREATE INDEX IF NOT EXISTS idx_event_tracking_user_id ON event_tracking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_event_tracking_event_name ON event_tracking_records(event_name);
CREATE INDEX IF NOT EXISTS idx_event_tracking_event_type ON event_tracking_records(event_type);
CREATE INDEX IF NOT EXISTS idx_event_tracking_event_date ON event_tracking_records(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_tracking_review_status ON event_tracking_records(review_status);
CREATE INDEX IF NOT EXISTS idx_event_tracking_created_at ON event_tracking_records(created_at DESC);

-- =====================================================
-- TRIGGERS for updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculator_configurations_updated_at
    BEFORE UPDATE ON calculator_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_familiar_records_updated_at
    BEFORE UPDATE ON familiar_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breeding_history_updated_at
    BEFORE UPDATE ON breeding_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_current_events_updated_at
    BEFORE UPDATE ON current_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_tracking_records_updated_at
    BEFORE UPDATE ON event_tracking_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Set current attributes to base attributes on insert
-- =====================================================

CREATE OR REPLACE FUNCTION set_current_attributes_from_base()
RETURNS TRIGGER AS $$
BEGIN
    -- Set current attributes to base attributes if not already set
    IF NEW.current_loyalty = 0 AND NEW.base_loyalty != 0 THEN
        NEW.current_loyalty := NEW.base_loyalty;
    END IF;
    IF NEW.current_ferocity = 0 AND NEW.base_ferocity != 0 THEN
        NEW.current_ferocity := NEW.base_ferocity;
    END IF;
    IF NEW.current_tenacity = 0 AND NEW.base_tenacity != 0 THEN
        NEW.current_tenacity := NEW.base_tenacity;
    END IF;
    IF NEW.current_instinct = 0 AND NEW.base_instinct != 0 THEN
        NEW.current_instinct := NEW.base_instinct;
    END IF;
    IF NEW.current_mischief = 0 AND NEW.base_mischief != 0 THEN
        NEW.current_mischief := NEW.base_mischief;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_current_attributes_from_base
    BEFORE INSERT ON familiar_records
    FOR EACH ROW
    EXECUTE FUNCTION set_current_attributes_from_base();

-- =====================================================
-- HELPER FUNCTION: Calculate Bond Level
-- =====================================================
-- Function to calculate the current bond level based on attribute values
-- and bond requirement type (uses data from bondRequirements.ts)

CREATE OR REPLACE FUNCTION calculate_bond_level(
    attr1_value SMALLINT,
    attr2_value SMALLINT,
    requirement_type SMALLINT
) RETURNS SMALLINT AS $$
DECLARE
    min_attr_value SMALLINT;
    bond_lvl SMALLINT;
BEGIN
    -- Get the minimum of the two attribute values
    min_attr_value := LEAST(attr1_value, attr2_value);
    
    -- Determine bond level based on requirement type
    -- Type1: 60/90/120/150/180
    -- Type2: 50/80/110/140/170
    IF requirement_type = 0 THEN -- Type1
        IF min_attr_value >= 180 THEN
            bond_lvl := 6;
        ELSIF min_attr_value >= 150 THEN
            bond_lvl := 5;
        ELSIF min_attr_value >= 120 THEN
            bond_lvl := 4;
        ELSIF min_attr_value >= 90 THEN
            bond_lvl := 3;
        ELSIF min_attr_value >= 60 THEN
            bond_lvl := 2;
        ELSE
            bond_lvl := 1;
        END IF;
    ELSIF requirement_type = 1 THEN -- Type2
        IF min_attr_value >= 170 THEN
            bond_lvl := 6;
        ELSIF min_attr_value >= 140 THEN
            bond_lvl := 5;
        ELSIF min_attr_value >= 110 THEN
            bond_lvl := 4;
        ELSIF min_attr_value >= 80 THEN
            bond_lvl := 3;
        ELSIF min_attr_value >= 50 THEN
            bond_lvl := 2;
        ELSE
            bond_lvl := 1;
        END IF;
    ELSE
        bond_lvl := 1;
    END IF;
    
    RETURN bond_lvl;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update bond level when attributes change
-- =====================================================

CREATE OR REPLACE FUNCTION update_familiar_bond_level()
RETURNS TRIGGER AS $$
DECLARE
    attr1_val SMALLINT;
    attr2_val SMALLINT;
    new_bond_level SMALLINT;
BEGIN
    -- Only update if bond attributes are set
    IF NEW.bond_attribute_1 IS NOT NULL AND NEW.bond_attribute_2 IS NOT NULL AND NEW.bond_requirement_type IS NOT NULL THEN
        -- Get current values of bond attributes
        CASE NEW.bond_attribute_1
            WHEN 0 THEN attr1_val := NEW.current_loyalty;      -- Loyalty
            WHEN 1 THEN attr1_val := NEW.current_ferocity;    -- Ferocity
            WHEN 2 THEN attr1_val := NEW.current_tenacity;     -- Tenacity
            WHEN 3 THEN attr1_val := NEW.current_instinct;     -- Instinct
            WHEN 4 THEN attr1_val := NEW.current_mischief;    -- Mischief
        END CASE;
        
        CASE NEW.bond_attribute_2
            WHEN 0 THEN attr2_val := NEW.current_loyalty;      -- Loyalty
            WHEN 1 THEN attr2_val := NEW.current_ferocity;     -- Ferocity
            WHEN 2 THEN attr2_val := NEW.current_tenacity;     -- Tenacity
            WHEN 3 THEN attr2_val := NEW.current_instinct;     -- Instinct
            WHEN 4 THEN attr2_val := NEW.current_mischief;    -- Mischief
        END CASE;
        
        -- Calculate new bond level
        new_bond_level := calculate_bond_level(attr1_val, attr2_val, NEW.bond_requirement_type);
        NEW.bond_level := new_bond_level;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_familiar_bond_level
    BEFORE INSERT OR UPDATE ON familiar_records
    FOR EACH ROW
    EXECUTE FUNCTION update_familiar_bond_level();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================
-- Enable RLS on all tables for security

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE familiar_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tracking_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and modify their own data
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own calculator config"
    ON calculator_configurations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculator config"
    ON calculator_configurations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculator config"
    ON calculator_configurations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculator config"
    ON calculator_configurations FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own familiars"
    ON familiar_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own familiars"
    ON familiar_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own familiars"
    ON familiar_records FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own familiars"
    ON familiar_records FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own breeding history"
    ON breeding_history FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = user_id_2);

CREATE POLICY "Users can insert own breeding history"
    ON breeding_history FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() = user_id_2);

CREATE POLICY "Users can update own breeding history"
    ON breeding_history FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete own breeding history"
    ON breeding_history FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = user_id_2);

CREATE POLICY "Users can view own current events"
    ON current_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own current events"
    ON current_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own current events"
    ON current_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own current events"
    ON current_events FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own event records"
    ON event_tracking_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event records"
    ON event_tracking_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event records"
    ON event_tracking_records FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event records"
    ON event_tracking_records FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information linked to Supabase auth.users';
COMMENT ON TABLE calculator_configurations IS '1:1 relationship - Each user has one saved calculator configuration';
COMMENT ON TABLE familiar_records IS '1:N relationship - A user may own many familiars. Each familiar has 5 stats (Loyalty, Ferocity, Tenacity, Instinct, Mischief), 2 main attributes, a bond, and optional mutation.';
COMMENT ON TABLE breeding_history IS '1:N with users, 2:N with familiars - Each breeding record references exactly two parent familiars';
COMMENT ON TABLE current_events IS '1:N relationship - Tracks active/current events for users with calculated max rankings';
COMMENT ON TABLE event_tracking_records IS '1:N relationship - Historical event records with final rankings and resource usage for ML predictions';

COMMENT ON COLUMN familiar_records.tier IS 'Enum: 0 = S (max 50), 1 = A (max 40), 2 = B (max 30), 3 = C (max 20), 4 = D (max 10)';
COMMENT ON COLUMN familiar_records.familiar_type IS 'Enum: 0 = Gloomcap, etc. (see enums.ts)';
COMMENT ON COLUMN familiar_records.has_mutation IS 'Enum: 0 = Not Mutated, 1 = Mutated';
COMMENT ON COLUMN familiar_records.main_attribute_1 IS 'Enum: 0-4 (Loyalty, Ferocity, Tenacity, Instinct, Mischief)';
COMMENT ON COLUMN familiar_records.main_attribute_2 IS 'Enum: 0-4 (must be different from main_attribute_1)';
COMMENT ON COLUMN familiar_records.bond_type IS 'Enum: 0-13 (14 bond types, see enums.ts)';
COMMENT ON COLUMN familiar_records.bond_requirement_type IS 'Enum: 0 = Type1 (higher reqs), 1 = Type2 (lower reqs)';

COMMENT ON COLUMN breeding_history.user_id_2 IS 'Optional second user for testing with another player''s familiar';
COMMENT ON COLUMN breeding_history.mutation_probability IS 'Percentage (0-100) for mutation chance - main/bond attributes are random';

COMMENT ON COLUMN current_events.event_type IS 'Enum: 0 = Ranking, 1 = Event, 2 = Special';
COMMENT ON COLUMN current_events.calculated_max_ranking IS 'Calculated max possible ranking based on current inventory/resources';

COMMENT ON COLUMN event_tracking_records.event_type IS 'Enum: 0 = Ranking, 1 = Event, 2 = Special';
COMMENT ON COLUMN event_tracking_records.review_status IS 'Enum: 0 = Awaiting Review, 1 = Approved, 2 = Rejected';
