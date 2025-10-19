import { initializeDatabase, checkDatabaseHealth } from './init'

let isInitialized = false

export async function ensureDatabaseInitialized(): Promise<void> {
  if (isInitialized) return
  
  try {
    // Check if database is healthy first
    const isHealthy = await checkDatabaseHealth()
    
    if (!isHealthy) {
      console.log('Database not healthy, initializing...')
      await initializeDatabase()
    }
    
    isInitialized = true
    console.log('Database initialization complete')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}
