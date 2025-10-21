import { query } from './client'

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...')
    
    // Note: Removed table dropping to prevent data loss on app startup
    // The calculator_data table should only be dropped during manual migrations
    
    
    // Execute each table creation separately to avoid conflicts
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS properties (
            uprn VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            last_fetched BIGINT NOT NULL,
            fetched_count INT DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            user_id VARCHAR(255)
        )
      `)
      console.log('Created/verified properties table')
    } catch (error) {
      console.error('Error creating properties table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS calculator_data (
            uprn VARCHAR(50) PRIMARY KEY,
            data JSONB NOT NULL,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID NULL
        )
      `)
      console.log('Created/verified calculator_data table')
    } catch (error) {
      console.error('Error creating calculator_data table:', error)
    }
    
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS comparables_data (
            uprn VARCHAR(50) PRIMARY KEY,
            selected_comparable_ids JSONB DEFAULT '[]'::jsonb,
            valuation_strategy VARCHAR(20) DEFAULT 'average' CHECK (valuation_strategy IN ('average', 'price_per_sqm')),
            calculated_valuation DECIMAL(15,2) NULL,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID NULL
        )
      `)
      console.log('Created/verified comparables_data table')
    } catch (error) {
      console.error('Error creating comparables_data table:', error)
    }
    
    // Create indexes separately
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_properties_uprn ON properties(uprn)')
      await query('CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_comparables_data_user_id ON comparables_data(user_id)')
      console.log('Created/verified indexes')
    } catch (error) {
      console.error('Error creating indexes:', error)
    }
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Check if database is properly initialized
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check if all required tables exist
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'calculator_data', 'comparables_data')
    `)
    
    const expectedTables = ['properties', 'calculator_data', 'comparables_data']
    const existingTables = result.rows.map((row: any) => row.table_name)
    
    const allTablesExist = expectedTables.every(table => existingTables.includes(table))
    
    if (!allTablesExist) {
      console.warn('Some required tables are missing:', {
        expected: expectedTables,
        existing: existingTables
      })
      return false
    }
    
    console.log('Database health check passed')
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}
