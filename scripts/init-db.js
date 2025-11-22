#!/usr/bin/env node

/**
 * Database initialization script
 * Run this script to initialize the database before starting the application
 * 
 * Usage: node scripts/init-db.js
 */

const { query } = require('../lib/db/client')

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...')
    
    // Clear existing user-specific data to start fresh with authentication
    try {
      await query('DROP TABLE IF EXISTS calculator_data CASCADE')
      await query('DROP TABLE IF EXISTS comparables_data CASCADE')
      console.log('Cleared existing calculator and comparables data')
    } catch (error) {
      console.error('Error clearing existing tables:', error)
    }
    
    // Execute each table creation separately to avoid conflicts
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            google_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            profile_picture VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('Created/verified users table')
    } catch (error) {
      console.error('Error creating users table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS properties (
            uprn VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            last_fetched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            fetched_count INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('Created/verified properties table')
    } catch (error) {
      console.error('Error creating properties table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_search_history (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
            searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, uprn)
        )
      `)
      console.log('Created/verified user_search_history table')
    } catch (error) {
      console.error('Error creating user_search_history table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS calculator_data (
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
            data JSONB NOT NULL,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, uprn)
        )
      `)
      console.log('Created/verified calculator_data table')
    } catch (error) {
      console.error('Error creating calculator_data table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS comparables_data (
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            uprn VARCHAR(50) NOT NULL REFERENCES properties(uprn),
            selected_comparable_ids JSONB DEFAULT '[]'::jsonb,
            valuation_strategy VARCHAR(20) DEFAULT 'average' CHECK (valuation_strategy IN ('average', 'price_per_sqm')),
            calculated_valuation DECIMAL(15,2) NULL,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, uprn)
        )
      `)
      console.log('Created/verified comparables_data table')
    } catch (error) {
      console.error('Error creating comparables_data table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            is_first_n_subscriber BOOLEAN DEFAULT FALSE,
            sendfox_contact_id VARCHAR(255) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('Created/verified subscriptions table')
    } catch (error) {
      console.error('Error creating subscriptions table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_tabs (
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            tab_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL DEFAULT 'Search',
            property_uprn VARCHAR(50) NULL,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, tab_id)
        )
      `)
      console.log('Created/verified user_tabs table')
    } catch (error) {
      console.error('Error creating user_tabs table:', error)
    }
    
    // Create indexes separately
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_search_history_searched_at ON user_search_history(searched_at)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_search_history_user_searched ON user_search_history(user_id, searched_at)')
      await query('CREATE INDEX IF NOT EXISTS idx_properties_last_fetched ON properties(last_fetched)')
      await query('CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_calculator_data_uprn ON calculator_data(uprn)')
      await query('CREATE INDEX IF NOT EXISTS idx_comparables_data_user_id ON comparables_data(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_comparables_data_uprn ON comparables_data(uprn)')
      await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email)')
      await query('CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_tabs_user_id ON user_tabs(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_tabs_user_active ON user_tabs(user_id, is_active)')
      await query('CREATE INDEX IF NOT EXISTS idx_user_tabs_tab_id ON user_tabs(tab_id)')
      console.log('Created/verified indexes')
    } catch (error) {
      console.error('Error creating indexes:', error)
    }
    
    console.log('✅ Database initialization completed successfully!')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

async function main() {
  try {
    await initializeDatabase()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

main()
