import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// GET - fetch property by UPRN (dashboard only - no external API calls)
export async function GET(
  request: NextRequest,
  { params }: { params: { uprn: string } }
) {
  try {
    const { uprn } = params

    if (!uprn) {
      return NextResponse.json(
        { error: 'UPRN parameter is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT * FROM properties WHERE uprn = $1',
      [uprn]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const property = result.rows[0]
    return NextResponse.json({
      uprn: property.uprn,
      data: property.data,
      lastFetched: property.last_fetched,
      fetchedCount: property.fetched_count
    })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
