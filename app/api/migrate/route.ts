import { NextRequest, NextResponse } from 'next/server'
import { query, withTransaction } from '../../../lib/db/client'

export async function POST(request: NextRequest) {
  try {
    const { 
      properties, 
      userAnalyses, 
      recentAnalyses, 
      calculatorData 
    } = await request.json()

    let migrated = 0
    const errors: string[] = []

    await withTransaction(async (client) => {
      // Migrate properties
      if (properties && Object.keys(properties).length > 0) {
        for (const [uprn, propertyData] of Object.entries(properties) as [string, any][]) {
          try {
            await client.query(`
              INSERT INTO properties (uprn, data, last_fetched, fetched_count)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (uprn) 
              DO UPDATE SET 
                data = EXCLUDED.data,
                last_fetched = EXCLUDED.last_fetched,
                fetched_count = EXCLUDED.fetched_count,
                updated_at = NOW()
            `, [
              uprn,
              propertyData.data,
              new Date(propertyData.lastFetched || Date.now()),
              propertyData.fetchedCount || 1
            ])
            migrated++
          } catch (error) {
            errors.push(`Property ${uprn}: ${error}`)
          }
        }
      }

      // Migrate user analyses
      if (userAnalyses && Object.keys(userAnalyses).length > 0) {
        for (const [analysisId, analysis] of Object.entries(userAnalyses) as [string, any][]) {
          try {
            await client.query(`
              INSERT INTO user_analyses (
                analysis_id, uprn, search_address, search_postcode, timestamp,
                selected_comparables, calculated_valuation, valuation_based_on_comparables,
                last_valuation_update, calculated_rent, rent_based_on_comparables,
                last_rent_update, calculated_yield, last_yield_update, filters
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              ON CONFLICT (analysis_id) 
              DO UPDATE SET 
                uprn = EXCLUDED.uprn,
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
              analysisId,
              analysis.uprn,
              analysis.searchAddress,
              analysis.searchPostcode,
              new Date(analysis.timestamp || Date.now()),
              analysis.selectedComparables || [],
              analysis.calculatedValuation,
              analysis.valuationBasedOnComparables,
              analysis.lastValuationUpdate ? new Date(analysis.lastValuationUpdate) : null,
              analysis.calculatedRent,
              analysis.rentBasedOnComparables,
              analysis.lastRentUpdate ? new Date(analysis.lastRentUpdate) : null,
              analysis.calculatedYield,
              analysis.lastYieldUpdate ? new Date(analysis.lastYieldUpdate) : null,
              analysis.filters || {}
            ])
            migrated++
          } catch (error) {
            errors.push(`Analysis ${analysisId}: ${error}`)
          }
        }
      }

      // Migrate recent analyses
      if (recentAnalyses && Array.isArray(recentAnalyses)) {
        for (const item of recentAnalyses) {
          try {
            await client.query(`
              INSERT INTO recent_analyses (analysis_id, timestamp)
              VALUES ($1, $2)
              ON CONFLICT (analysis_id, user_id) 
              DO UPDATE SET timestamp = EXCLUDED.timestamp
            `, [
              item.analysisId,
              new Date(item.timestamp || Date.now())
            ])
          } catch (error) {
            errors.push(`Recent analysis ${item.analysisId}: ${error}`)
          }
        }
      }

      // Migrate calculator data
      if (calculatorData && Object.keys(calculatorData).length > 0) {
        for (const [analysisId, calcData] of Object.entries(calculatorData) as [string, any][]) {
          try {
            await client.query(`
              INSERT INTO calculator_data (analysis_id, data, last_updated)
              VALUES ($1, $2, $3)
              ON CONFLICT (analysis_id) 
              DO UPDATE SET 
                data = EXCLUDED.data,
                last_updated = EXCLUDED.last_updated
            `, [
              analysisId,
              calcData.data,
              new Date(calcData.lastUpdated || Date.now())
            ])
          } catch (error) {
            errors.push(`Calculator data ${analysisId}: ${error}`)
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      migrated,
      errors
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        migrated: 0, 
        errors: [`Migration failed: ${error}`] 
      },
      { status: 500 }
    )
  }
}
