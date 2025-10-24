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
    `, [uprn, data, lastFetched || Date.now(), fetchedCount || 1])

    const property = result.rows[0]
    
    // Also create default calculator entry if it doesn't exist
    const defaultCalculatorData = {
      purchaseType: 'mortgage',
      includeFeesInLoan: false,
      bridgingDetails: {
        loanType: 'retained',
        duration: '',
        grossLoanPercent: '',
        monthlyInterest: '',
        applicationFee: ''
      },
      exitStrategy: null,
      refinanceDetails: {
        expectedGDV: '',
        newLoanLTV: '',
        interestRate: '',
        brokerFees: '',
        legalFees: ''
      },
      saleDetails: {
        expectedSalePrice: '',
        agencyFeePercent: '',
        legalFees: ''
      },
      refurbItems: [{ id: 1, description: '', amount: '' }],
      fundingSources: [{ id: 1, name: '', amount: '', interestRate: '', duration: '' }],
      initialCosts: {
        refurbRepair: '',
        legal: '',
        stampDutyPercent: '',
        ila: '',
        brokerFees: '',
        auctionFees: '',
        findersFee: ''
      },
      purchaseFinance: {
        purchasePrice: '',
        deposit: '',
        ltv: '',
        loanAmount: '',
        productFee: '',
        interestRate: ''
      },
      monthlyIncome: {
        rent1: '',
        rent2: '',
        rent3: '',
        rent4: '',
        rent5: ''
      },
      monthlyExpenses: {
        serviceCharge: '',
        groundRent: '',
        maintenancePercent: '',
        managementPercent: '',
        insurance: '',
        mortgagePayment: ''
      },
      propertyValue: ''
    }
    
    try {
      // Note: calculator_data requires user_id, but this is a generic property save
      // We'll skip creating calculator data here since it needs a specific user
      console.log(`Skipping calculator data creation for UPRN: ${uprn} - requires user context`)
    } catch (calcError) {
      console.error('Error creating calculator data:', calcError)
      // Don't fail the property save if calculator data creation fails
    }

    // Also create default comparables data if it doesn't exist
    try {
      // Note: comparables_data requires user_id, but this is a generic property save
      // We'll skip creating comparables data here since it needs a specific user
      console.log(`Skipping comparables data creation for UPRN: ${uprn} - requires user context`)
    } catch (compError) {
      console.error('Error creating comparables data:', compError)
      // Don't fail the property save if comparables data creation fails
    }
    
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
