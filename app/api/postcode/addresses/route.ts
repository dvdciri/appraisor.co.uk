import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postcode = searchParams.get('postcode')

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      )
    }

    if (!process.env.IDEAL_POSTCODE_API_KEY) {
      console.error('IDEAL_POSTCODE_API_KEY not found. Please configure your API key.')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Clean and format postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    
    console.log('🔍 Ideal Postcodes API Request:')
    console.log('  Postcode:', cleanPostcode)
    console.log('  API Key present:', !!process.env.IDEAL_POSTCODE_API_KEY)

    const response = await fetch(`https://api.ideal-postcodes.co.uk/v1/postcodes/${cleanPostcode}?api_key=${process.env.IDEAL_POSTCODE_API_KEY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ideal Postcodes API error:', response.status, errorText)
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Postcode not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch addresses for postcode' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log('📋 Ideal Postcodes API Response:')
    console.log('  Postcode:', cleanPostcode)
    console.log('  Number of addresses:', data.result?.length || 0)
    console.log('  Full Response:', JSON.stringify(data, null, 2))
    
    // Transform the response to a simpler format
    const addresses = data.result?.map((address: any) => ({
      id: address.id,
      address: address.line_1 + (address.line_2 ? `, ${address.line_2}` : ''),
      postcode: address.postcode,
      full_address: `${address.line_1}${address.line_2 ? `, ${address.line_2}` : ''}, ${address.postcode}`,
      uprn: address.uprn,
      building_name: address.building_name,
      building_number: address.building_number,
      line_1: address.line_1,
      line_2: address.line_2,
      line_3: address.line_3,
      post_town: address.post_town,
      county: address.county,
    })) || []

    return NextResponse.json({ 
      postcode: cleanPostcode,
      addresses 
    })
  } catch (error) {
    console.error('Error fetching addresses for postcode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
