import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { address, postcode } = await request.json()

    const realData = await fetchRealPropertyDetails(address, postcode)
    
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
  const response = await fetch('https://api.data.street.co.uk/street-data-api/v2/properties/addresses?tier=core', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'x-api-key': `${process.env.STREET_API_KEY}`,
      },
      body: JSON.stringify({
          data: {
              address: address,
              postcode: postcode
          }
      }),
  });

  if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}