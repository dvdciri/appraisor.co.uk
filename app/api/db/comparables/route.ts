import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uprn = searchParams.get('uprn')

    if (!uprn) {
      return NextResponse.json({ error: 'UPRN is required' }, { status: 400 })
    }

    const result = await query(
      'SELECT * FROM comparables_data WHERE uprn = $1',
      [uprn]
    )

    if (result.rows.length === 0) {
      // Return default structure if no data exists
      return NextResponse.json({
        uprn,
        selected_comparable_ids: [],
        valuation_strategy: 'average',
        calculated_valuation: null
      })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching comparables data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparables data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uprn, selected_comparable_ids, valuation_strategy, calculated_valuation } = body

    if (!uprn) {
      return NextResponse.json({ error: 'UPRN is required' }, { status: 400 })
    }

    // Validate strategy
    if (valuation_strategy && !['average', 'price_per_sqm'].includes(valuation_strategy)) {
      return NextResponse.json({ error: 'Invalid valuation strategy' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO comparables_data (uprn, selected_comparable_ids, valuation_strategy, calculated_valuation)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (uprn) 
       DO UPDATE SET 
         selected_comparable_ids = EXCLUDED.selected_comparable_ids,
         valuation_strategy = EXCLUDED.valuation_strategy,
         calculated_valuation = EXCLUDED.calculated_valuation,
         last_updated = NOW()
       RETURNING *`,
      [
        uprn,
        JSON.stringify(selected_comparable_ids || []),
        valuation_strategy || 'average',
        calculated_valuation
      ]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error saving comparables data:', error)
    return NextResponse.json(
      { error: 'Failed to save comparables data' },
      { status: 500 }
    )
  }
}
