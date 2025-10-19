'use client'

import { useEffect } from 'react'

export default function DatabaseInitializer() {
  useEffect(() => {
    // Initialize database on app startup
    const initializeDatabase = async () => {
      try {
        const response = await fetch('/api/db/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          console.log('Database initialized successfully on startup')
        } else {
          console.warn('Database initialization failed on startup:', await response.text())
        }
      } catch (error) {
        console.warn('Database initialization error on startup:', error)
      }
    }

    // Only run in production or when explicitly needed
    if (process.env.NODE_ENV === 'production') {
      initializeDatabase()
    }
  }, [])

  return null // This component doesn't render anything
}
