import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

// Default calculator data
const getDefaultCalculatorData = () => ({
  purchaseType: 'mortgage',
  includeFeesInLoan: false,
  bridgingDetails: {
    loanType: 'serviced',
    duration: '',
    grossLoanPercent: '',
    grossLoanAmount: '',
    monthlyInterest: '',
    applicationFee: ''
  },
  exitStrategy: null,
  refinanceDetails: {
    expectedGDV: '',
    newLoanLTV: '',
    newLoanAmount: '',
    interestRate: '',
    brokerFees: '',
    legalFees: ''
  },
  saleDetails: {
    expectedSalePrice: '',
    agencyFeePercent: '',
    agencyFeeAmount: '',
    legalFees: ''
  },
  refurbItems: [{ id: 1, description: '', amount: '' }],
  fundingSources: [{ id: 1, name: 'Personal', amount: '', interestRate: '', duration: '' }],
  initialCosts: {
    refurbRepair: '',
    legal: '',
    stampDutyPercent: '',
    stampDutyAmount: '',
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
    productFeeAmount: '',
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
    maintenanceAmount: '',
    managementPercent: '',
    managementAmount: '',
    insurance: '',
    mortgagePayment: ''
  },
  propertyValue: ''
})

// POST - reset calculator data to defaults
export async function POST(request: NextRequest) {
  try {
    const { uprn } = await request.json()
    
    if (!uprn) {
      return NextResponse.json({ error: 'UPRN is required' }, { status: 400 })
    }

    const defaultData = getDefaultCalculatorData()

    // Use upsert (INSERT ... ON CONFLICT UPDATE) to save default data
    const result = await query(`
      INSERT INTO calculator_data (uprn, data, last_updated)
      VALUES ($1, $2, NOW())
      ON CONFLICT (uprn) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        last_updated = NOW()
      RETURNING *
    `, [uprn, defaultData])

    const calculatorData = result.rows[0]
    return NextResponse.json({
      success: true,
      message: 'Calculator data reset to defaults',
      data: calculatorData.data,
      lastUpdated: calculatorData.last_updated
    })
  } catch (error) {
    console.error('Error resetting calculator data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
