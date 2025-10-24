import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { query } from '@/lib/db/client'
import { ensureAppReady } from '@/lib/db/startup'

export async function POST(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { address, postcode } = await request.json()

    const realData = await fetchRealPropertyDetails(address, postcode)
    
    // Save property data first to ensure it exists before recording search history
    const uprn = realData?.data?.attributes?.identities?.ordnance_survey?.uprn
    if (uprn) {
      try {
        // Save property data to ensure it exists in the database
        await query(`
          INSERT INTO properties (uprn, data, last_fetched, fetched_count, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (uprn) 
          DO UPDATE SET 
            data = EXCLUDED.data,
            last_fetched = EXCLUDED.last_fetched,
            fetched_count = properties.fetched_count + 1,
            updated_at = NOW()
        `, [uprn, JSON.stringify(realData), Date.now(), 1])
        
        console.log(`Saved property data for UPRN: ${uprn}`)
      } catch (propertyError) {
        console.error('Error saving property data:', propertyError)
        // Continue even if property save fails
      }
    }
    
    // Record search in user search history (after property is saved)
    try {
      // Get user_id from database
      const userResult = await query(
        'SELECT user_id FROM users WHERE email = $1',
        [session.user.email]
      )

      if (userResult.rows.length > 0 && uprn) {
        const userId = userResult.rows[0].user_id

        // Insert search history record
        await query(`
          INSERT INTO user_search_history (user_id, uprn)
          VALUES ($1, $2)
          ON CONFLICT (user_id, uprn) 
          DO UPDATE SET searched_at = NOW()
        `, [userId, uprn])
        
        console.log(`Recorded search for user ${userId}, UPRN: ${uprn}`)
      }
    } catch (historyError) {
      console.error('Error recording search history:', historyError)
      // Don't fail the main request if history recording fails
    }
    
    return NextResponse.json(realData)
  } catch (error: any) {
    console.error('Error fetching property data:', error)
    
    // Check if it's a 401 (unauthorized - API key issue)
    if (error.message && error.message.includes('401')) {
      return NextResponse.json(
        { error: 'API authentication failed. Please check your API key configuration.' },
        { status: 401 }
      )
    }
    
    // Check if it's a 404 (property not found)
    if (error.message && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Property not found. Please check the address and postcode.' },
        { status: 404 }
      )
    }
    
    // Check if it's a 400 (bad request)
    if (error.message && error.message.includes('400')) {
      return NextResponse.json(
        { error: 'Invalid address or postcode format. Please check your input.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch property data. Please try again later.' },
      { status: 500 }
    )
  }
}


async function fetchRealPropertyDetails(address: string, postcode: string): Promise<any> {
  // Check if API key is available
  if (!process.env.STREET_API_KEY) {
    console.error('STREET_API_KEY not found. Please configure your API key.');
    throw new Error('STREET_API_KEY not found. Please configure your API key.');
  }

  const requestPayload = {
    data: {
      address: address,
      postcode: postcode
    }
  };

  console.log('🔍 Street API Request Details:');
  console.log('  URL:', 'https://api.data.street.co.uk/street-data-api/v2/properties/addresses?tier=core');
  console.log('  Method: POST');
  console.log('  Address:', address);
  console.log('  Postcode:', postcode);
  console.log('  API Key present:', !!process.env.STREET_API_KEY);
  console.log('  Request payload:', JSON.stringify(requestPayload, null, 2));

  const response = await fetch('https://api.data.street.co.uk/street-data-api/v2/properties/addresses?tier=core', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${process.env.STREET_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
  });

  console.log('📡 Street API Response Details:');
  console.log('  Status:', response.status);
  console.log('  Status Text:', response.statusText);
  console.log('  Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    // Try to get the response body for more details
    let responseBody = '';
    try {
      responseBody = await response.text();
      console.log('  Response Body:', responseBody);
    } catch (e) {
      console.log('  Could not read response body:', e);
    }
    
    console.error('❌ Street API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: responseBody
    });
    
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${responseBody}`);
  }

  // Log successful response
  const responseData = await response.json();
  console.log('✅ Street API Success:');
  console.log('  Response data keys:', Object.keys(responseData));
  if (responseData.data) {
    console.log('  Data keys:', Object.keys(responseData.data));
    if (responseData.data.attributes) {
      console.log('  Attributes keys:', Object.keys(responseData.data.attributes));
    }
  }
  console.log('  Full response:', JSON.stringify(responseData, null, 2));

  return responseData;
}

// REMOVED: Mock data function - no fallbacks wanted