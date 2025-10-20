import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('place_id')

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }

    if (!process.env.STREET_API_KEY) {
      console.error('STREET_API_KEY not found. Please configure your API key.')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': process.env.STREET_API_KEY,
        'X-Goog-FieldMask': 'formattedAddress,addressComponents',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Places API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch place details' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extract address components
    let address = ''
    let postcode = ''

    if (data.formattedAddress) {
      // Use the formatted address as the base
      address = data.formattedAddress
    }

    if (data.addressComponents) {
      // Extract postcode from address components
      const postalCodeComponent = data.addressComponents.find(
        (component: any) => component.types?.includes('postal_code')
      )
      
      if (postalCodeComponent) {
        postcode = postalCodeComponent.longText || postalCodeComponent.shortText || ''
        
        // Remove postcode from the address string for cleaner address
        if (postcode && address.includes(postcode)) {
          address = address.replace(postcode, '').trim().replace(/,$/, '')
        }
      }

      // If we don't have a good formatted address, build it from components
      if (!address || address.length < 10) {
        const streetNumber = data.addressComponents.find(
          (component: any) => component.types?.includes('street_number')
        )?.longText || ''
        
        const route = data.addressComponents.find(
          (component: any) => component.types?.includes('route')
        )?.longText || ''
        
        const locality = data.addressComponents.find(
          (component: any) => component.types?.includes('locality')
        )?.longText || ''
        
        const addressParts = [streetNumber, route, locality].filter(Boolean)
        if (addressParts.length > 0) {
          address = addressParts.join(' ')
        }
      }
    }

    return NextResponse.json({
      address: address || 'Address not found',
      postcode: postcode || 'Postcode not found',
    })
  } catch (error) {
    console.error('Error fetching place details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
