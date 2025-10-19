import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// GET - fetch property by UPRN
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uprn = searchParams.get('uprn')

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

// POST - save/update generic property data
export async function POST(request: NextRequest) {
  try {
    const { uprn, data, lastFetched, fetchedCount } = await request.json()

    if (!uprn || !data) {
      return NextResponse.json(
        { error: 'UPRN and data are required' },
        { status: 400 }
      )
    }

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const result = await query(`
      INSERT INTO properties (uprn, data, last_fetched, fetched_count, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (uprn) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        last_fetched = EXCLUDED.last_fetched,
        fetched_count = properties.fetched_count + 1,
        updated_at = NOW()
      RETURNING *
    `, [uprn, data, lastFetched || new Date(), fetchedCount || 1])

    const property = result.rows[0]
    return NextResponse.json({
      uprn: property.uprn,
      data: property.data,
      lastFetched: property.last_fetched,
      fetchedCount: property.fetched_count
    })
  } catch (error) {
    console.error('Error saving property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
