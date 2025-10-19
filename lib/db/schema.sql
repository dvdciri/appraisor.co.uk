-- PostgreSQL Schema for Estimo Property Analysis App
-- Designed to support future multi-user functionality with user_id column

-- Properties table: Generic property data keyed by UPRN (shared across users)
CREATE TABLE IF NOT EXISTS properties (
    uprn VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    last_fetched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fetched_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL -- For future multi-user support
);

-- User analyses table: User-specific analysis data
CREATE TABLE IF NOT EXISTS user_analyses (
    analysis_id VARCHAR(100) PRIMARY KEY,
    uprn VARCHAR(50) NOT NULL,
    search_address TEXT,
    search_postcode VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    selected_comparables TEXT[] DEFAULT '{}',
    calculated_valuation DECIMAL(15,2),
    valuation_based_on_comparables INTEGER,
    last_valuation_update TIMESTAMP WITH TIME ZONE,
    calculated_rent DECIMAL(15,2),
    rent_based_on_comparables INTEGER,
    last_rent_update TIMESTAMP WITH TIME ZONE,
    calculated_yield DECIMAL(5,2),
    last_yield_update TIMESTAMP WITH TIME ZONE,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL, -- For future multi-user support
    FOREIGN KEY (uprn) REFERENCES properties(uprn) ON DELETE CASCADE
);

-- Calculator data table: Financial calculations per analysis
CREATE TABLE IF NOT EXISTS calculator_data (
    analysis_id VARCHAR(100) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL, -- For future multi-user support
    FOREIGN KEY (analysis_id) REFERENCES user_analyses(analysis_id) ON DELETE CASCADE
);

-- Recent analyses table: Ordered list of recent analyses for quick access
CREATE TABLE IF NOT EXISTS recent_analyses (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL, -- For future multi-user support
    FOREIGN KEY (analysis_id) REFERENCES user_analyses(analysis_id) ON DELETE CASCADE,
    UNIQUE(analysis_id, user_id) -- Prevent duplicates per user
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_last_fetched ON properties(last_fetched);
CREATE INDEX IF NOT EXISTS idx_user_analyses_uprn ON user_analyses(uprn);
CREATE INDEX IF NOT EXISTS idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_timestamp ON user_analyses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_analyses_user_id ON recent_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_analyses_timestamp ON recent_analyses(timestamp DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analyses_updated_at BEFORE UPDATE ON user_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
