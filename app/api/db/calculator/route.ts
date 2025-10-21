import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// GET - fetch calculator data by UPRN
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uprn = searchParams.get('uprn') || searchParams.get('id') // Backward compatibility

    if (!uprn) {
      return NextResponse.json(
        { error: 'UPRN is required' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT data, last_updated FROM calculator_data WHERE uprn = $1',
      [uprn]
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
      lastUpdated: calculatorData.last_updated
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
    const { uprn, analysisId, data } = await request.json()
    const propertyUprn = uprn || analysisId // Backward compatibility

    if (!propertyUprn || !data) {
      return NextResponse.json(
        { error: 'UPRN and data are required' },
        { status: 400 }
      )
    }

    // No need to check for property existence since calculator_data is now independent

    // Use upsert (INSERT ... ON CONFLICT UPDATE)
    const result = await query(`
      INSERT INTO calculator_data (uprn, data, last_updated)
      VALUES ($1, $2, NOW())
      ON CONFLICT (uprn) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        last_updated = NOW()
      RETURNING *
    `, [propertyUprn, data])

    const calculatorData = result.rows[0]
    return NextResponse.json({
      data: calculatorData.data,
      lastUpdated: calculatorData.last_updated
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
    const uprn = searchParams.get('uprn') || searchParams.get('id') // Backward compatibility

    if (!uprn) {
      return NextResponse.json(
        { error: 'UPRN is required' },
        { status: 400 }
      )
    }

    await query(
      'DELETE FROM calculator_data WHERE uprn = $1',
      [uprn]
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
