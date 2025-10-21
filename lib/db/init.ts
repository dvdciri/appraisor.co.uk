import { query } from './client'

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...')
    
    // First, drop the old calculator_data table if it exists (to handle schema migration)
    try {
      await query('DROP TABLE IF EXISTS calculator_data CASCADE')
      console.log('Dropped old calculator_data table for migration')
    } catch (error) {
      console.log('No existing calculator_data table to drop')
    }
    
    // Embedded schema to avoid file system issues in production
    const schema = `
CREATE TABLE IF NOT EXISTS properties (
    uprn VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    last_fetched BIGINT NOT NULL,
    fetched_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS calculator_data (
    uprn VARCHAR(50) PRIMARY KEY,
    data JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_uprn ON properties(uprn);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_data_user_id ON calculator_data(user_id);
    `
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement)
      }
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
      AND table_name IN ('properties', 'calculator_data')
    `)
    
    const expectedTables = ['properties', 'calculator_data']
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
