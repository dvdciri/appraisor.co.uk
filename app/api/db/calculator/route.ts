import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// GET - fetch calculator data by analysis ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT data, updated_at FROM calculator_data WHERE analysis_id = $1',
      [analysisId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Calculator data not found' },
        { status: 404 }
      )
    }

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.updated_at
    })
  } catch (error) {
    console.error('Error fetching calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - save/update calculator data
export async function POST(request: NextRequest) {
  try {
    const { analysisId, data } = await request.json()

    if (!analysisId || !data) {
      return NextResponse.json(
        { error: 'Analysis ID and data are required' },
        { status: 400 }
      )
    }

    // No need to check for analysis existence since calculator_data is now independent

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const result = await query(`
      INSERT INTO calculator_data (analysis_id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (analysis_id) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = NOW()
      RETURNING *
    `, [analysisId, data])

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.updated_at
    })
  } catch (error) {
    console.error('Error saving calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - delete calculator data
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

    await query(
      'DELETE FROM calculator_data WHERE analysis_id = $1',
      [analysisId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
