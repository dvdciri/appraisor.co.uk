-- PostgreSQL Schema for Estimo Property Analysis App
-- Designed to support multi-user functionality with Google authentication

-- Users table: Authenticated Google users
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table: Generic property data keyed by UPRN (shared across users)
CREATE TABLE IF NOT EXISTS properties (
    uprn VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    last_fetched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fetched_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User search history table: Track which properties users have searched
CREATE TABLE IF NOT EXISTS user_search_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, uprn)
);

-- Calculator data table: Financial calculations per user and property
CREATE TABLE IF NOT EXISTS calculator_data (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, uprn)
);

-- Comparables data table: Selected comparables and valuation strategy per user and property
CREATE TABLE IF NOT EXISTS comparables_data (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
    selected_comparable_ids JSONB DEFAULT '[]'::jsonb,
    valuation_strategy VARCHAR(20) DEFAULT 'average' CHECK (valuation_strategy IN ('average', 'price_per_sqm')),
    calculated_valuation DECIMAL(15,2) NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, uprn)
);

-- Subscriptions table: Track email subscriptions for early access
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_first_n_subscriber BOOLEAN DEFAULT FALSE,
    sendfox_contact_id VARCHAR(255) NULL, -- Store SendFox contact ID for reference
    source VARCHAR(50) DEFAULT 'unknown', -- Track where the subscriber came from
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tabs table: Store user's dashboard tabs (one row per tab)
CREATE TABLE IF NOT EXISTS user_tabs (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tab_id VARCHAR(255) NOT NULL, -- Unique identifier for the tab (e.g., 'tab-1', 'tab-1234567890-abc')
    title VARCHAR(255) NOT NULL DEFAULT 'Search',
    property_uprn VARCHAR(50) NULL, -- UPRN of the property displayed in this tab (nullable)
    is_active BOOLEAN NOT NULL DEFAULT FALSE, -- Whether this tab is currently active
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, tab_id) -- Composite primary key ensures uniqueness
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_searched_at ON user_search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_searched ON user_search_history(user_id, searched_at);
CREATE INDEX IF NOT EXISTS idx_properties_last_fetched ON properties(last_fetched);
CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_data_uprn ON calculator_data(uprn);
CREATE INDEX IF NOT EXISTS idx_comparables_data_user_id ON comparables_data(user_id);
CREATE INDEX IF NOT EXISTS idx_comparables_data_uprn ON comparables_data(uprn);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_source ON subscriptions(source);
CREATE INDEX IF NOT EXISTS idx_user_tabs_user_id ON user_tabs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tabs_user_active ON user_tabs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_tabs_tab_id ON user_tabs(tab_id);

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

CREATE TRIGGER update_calculator_data_updated_at BEFORE UPDATE ON calculator_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparables_data_updated_at BEFORE UPDATE ON comparables_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: user_tabs uses last_updated instead of updated_at, so no trigger needed