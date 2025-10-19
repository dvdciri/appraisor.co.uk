import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '../../../../lib/db/client'

// GET - fetch analysis by ID or list recent analyses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')
    const recent = searchParams.get('recent')

    if (recent === 'true') {
      // Get recent analyses (ordered by timestamp, limit 50)
      const result = await query(`
        SELECT ra.analysis_id, ra.timestamp
        FROM recent_analyses ra
        ORDER BY ra.timestamp DESC
        LIMIT 50
      `)

      return NextResponse.json(result.rows)
    }

    if (analysisId) {
      // Get specific analysis
      const result = await query(`
        SELECT 
          ua.analysis_id,
          ua.uprn,
          ua.search_address,
          ua.search_postcode,
          ua.timestamp,
          ua.selected_comparables,
          ua.calculated_valuation,
          ua.valuation_based_on_comparables,
          ua.last_valuation_update,
          ua.calculated_rent,
          ua.rent_based_on_comparables,
          ua.last_rent_update,
          ua.calculated_yield,
          ua.last_yield_update,
          ua.filters
        FROM user_analyses ua
        WHERE ua.analysis_id = $1
      `, [analysisId])

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }

      const analysis = result.rows[0]
      return NextResponse.json({
        uprn: analysis.uprn,
        searchAddress: analysis.search_address,
        searchPostcode: analysis.search_postcode,
        timestamp: analysis.timestamp,
        selectedComparables: analysis.selected_comparables || [],
        calculatedValuation: analysis.calculated_valuation,
        valuationBasedOnComparables: analysis.valuation_based_on_comparables,
        lastValuationUpdate: analysis.last_valuation_update,
        calculatedRent: analysis.calculated_rent,
        rentBasedOnComparables: analysis.rent_based_on_comparables,
        lastRentUpdate: analysis.last_rent_update,
        calculatedYield: analysis.calculated_yield,
        lastYieldUpdate: analysis.last_yield_update,
        filters: analysis.filters || {}
      })
    }

    return NextResponse.json(
      { error: 'Either id or recent parameter is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - save/update user analysis
export async function POST(request: NextRequest) {
  try {
    const {
      analysisId,
      uprn,
      searchAddress,
      searchPostcode,
      timestamp,
      selectedComparables,
      calculatedValuation,
      valuationBasedOnComparables,
      lastValuationUpdate,
      calculatedRent,
      rentBasedOnComparables,
      lastRentUpdate,
      calculatedYield,
      lastYieldUpdate,
      filters
    } = await request.json()

    if (!analysisId || !uprn) {
      return NextResponse.json(
        { error: 'analysisId and uprn are required' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      // Insert or update user analysis
      await client.query(`
        INSERT INTO user_analyses (
          analysis_id, uprn, search_address, search_postcode, timestamp,
          selected_comparables, calculated_valuation, valuation_based_on_comparables,
          last_valuation_update, calculated_rent, rent_based_on_comparables,
          last_rent_update, calculated_yield, last_yield_update, filters, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (analysis_id) 
        DO UPDATE SET 
          search_address = EXCLUDED.search_address,
          search_postcode = EXCLUDED.search_postcode,
          selected_comparables = EXCLUDED.selected_comparables,
          calculated_valuation = EXCLUDED.calculated_valuation,
          valuation_based_on_comparables = EXCLUDED.valuation_based_on_comparables,
          last_valuation_update = EXCLUDED.last_valuation_update,
          calculated_rent = EXCLUDED.calculated_rent,
          rent_based_on_comparables = EXCLUDED.rent_based_on_comparables,
          last_rent_update = EXCLUDED.last_rent_update,
          calculated_yield = EXCLUDED.calculated_yield,
          last_yield_update = EXCLUDED.last_yield_update,
          filters = EXCLUDED.filters,
          updated_at = NOW()
      `, [
        analysisId, uprn, searchAddress, searchPostcode, timestamp,
        selectedComparables || [], calculatedValuation, valuationBasedOnComparables,
        lastValuationUpdate, calculatedRent, rentBasedOnComparables,
        lastRentUpdate, calculatedYield, lastYieldUpdate, filters || {}
      ])

      // Update recent analyses list (remove if exists, then add to top)
      await client.query(
        'DELETE FROM recent_analyses WHERE analysis_id = $1',
        [analysisId]
      )
      
      await client.query(
        'INSERT INTO recent_analyses (analysis_id, timestamp) VALUES ($1, $2)',
        [analysisId, timestamp || new Date()]
      )

      // Keep only the most recent 50 analyses
      await client.query(`
        DELETE FROM recent_analyses 
        WHERE id NOT IN (
          SELECT id FROM recent_analyses 
          ORDER BY timestamp DESC 
          LIMIT 50
        )
      `)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - delete analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      // Delete from recent analyses first (foreign key constraint)
      await client.query(
        'DELETE FROM recent_analyses WHERE analysis_id = $1',
        [analysisId]
      )
      
      // Delete the analysis (this will cascade to calculator_data)
      await client.query(
        'DELETE FROM user_analyses WHERE analysis_id = $1',
        [analysisId]
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
