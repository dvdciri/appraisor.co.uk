import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { getClient } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const db = await getClient()
    
    // Get total subscription count from our database
    const result = await db.query('SELECT COUNT(*) as total FROM subscriptions')
    const subscriberCount = parseInt(result.rows[0].total) || 0
    
    const response = NextResponse.json(
      { 
        subscriber_count: subscriberCount,
        max_free_spots: CONFIG.MAX_FREE_SPOTS,
        remaining_spots: Math.max(0, CONFIG.MAX_FREE_SPOTS - subscriberCount),
        is_first_n: subscriberCount < CONFIG.MAX_FREE_SPOTS
      },
      { status: 200 }
    )

    // Add cache-busting headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('Error fetching subscriber count from database:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching subscriber count.' },
      { status: 500 }
    )
  }
}
