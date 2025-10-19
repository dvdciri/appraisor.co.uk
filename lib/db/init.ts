import fs from 'fs'
import path from 'path'
import { query } from './client'

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...')
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
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
      AND table_name IN ('properties', 'user_analyses', 'calculator_data', 'recent_analyses')
    `)
    
    const expectedTables = ['properties', 'user_analyses', 'calculator_data', 'recent_analyses']
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
