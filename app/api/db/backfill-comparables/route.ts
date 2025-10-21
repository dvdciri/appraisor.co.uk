import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/db/client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting comparables data backfill...');
    
    // Get all properties that don't have comparables data
    const result = await query(`
      SELECT p.uprn 
      FROM properties p 
      LEFT JOIN comparables_data c ON p.uprn = c.uprn 
      WHERE c.uprn IS NULL
    `);
    
    const propertiesWithoutComparables = result.rows;
    console.log(`📊 Found ${propertiesWithoutComparables.length} properties without comparables data`);
    
    if (propertiesWithoutComparables.length === 0) {
      return NextResponse.json({
        message: 'All properties already have comparables data!',
        processed: 0,
        successCount: 0,
        errorCount: 0
      });
    }
    
    // Insert default comparables data for each property
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const property of propertiesWithoutComparables) {
      try {
        await query(`
          INSERT INTO comparables_data (uprn, selected_comparable_ids, valuation_strategy, calculated_valuation)
          VALUES ($1, $2, $3, $4)
        `, [property.uprn, JSON.stringify([]), 'average', null]);
        
        successCount++;
        console.log(`✅ Created comparables data for UPRN: ${property.uprn}`);
      } catch (error) {
        errorCount++;
        const errorMessage = `Failed to create comparables data for UPRN: ${property.uprn} - ${error.message}`;
        console.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }
    
    const response = {
      message: 'Backfill completed',
      processed: propertiesWithoutComparables.length,
      successCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined
    };
    
    console.log('📈 Backfill Summary:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
