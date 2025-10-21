import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting calculator data backfill...');
    
    // Get all properties that don't have calculator data
    const result = await query(`
      SELECT p.uprn 
      FROM properties p 
      LEFT JOIN calculator_data c ON p.uprn = c.uprn 
      WHERE c.uprn IS NULL
    `);
    
    const propertiesWithoutCalculator = result.rows;
    console.log(`📊 Found ${propertiesWithoutCalculator.length} properties without calculator data`);
    
    if (propertiesWithoutCalculator.length === 0) {
      return NextResponse.json({
        message: 'All properties already have calculator data!',
        processed: 0,
        successCount: 0,
        errorCount: 0
      });
    }
    
    // Default calculator data structure
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
    };
    
    // Insert default calculator data for each property
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const property of propertiesWithoutCalculator) {
      try {
        await query(`
          INSERT INTO calculator_data (uprn, data, last_updated)
          VALUES ($1, $2, NOW())
        `, [property.uprn, JSON.stringify(defaultCalculatorData)]);
        
        successCount++;
        console.log(`✅ Created calculator data for UPRN: ${property.uprn}`);
      } catch (error) {
        errorCount++;
        const errorMessage = `Failed to create calculator data for UPRN: ${property.uprn} - ${error.message}`;
        console.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }
    
    const response = {
      message: 'Calculator backfill completed',
      processed: propertiesWithoutCalculator.length,
      successCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined
    };
    
    console.log('📈 Calculator Backfill Summary:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Fatal error during calculator backfill:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
