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

-- Calculator data table: Financial calculations per analysis
CREATE TABLE IF NOT EXISTS calculator_data (
    analysis_id VARCHAR(100) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL -- For future multi-user support
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_last_fetched ON properties(last_fetched);
CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id);

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
