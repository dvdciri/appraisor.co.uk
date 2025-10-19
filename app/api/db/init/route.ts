import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    return NextResponse.json({ success: true, message: 'Database initialized successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    return NextResponse.json({ success: true, message: 'Database initialized successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
