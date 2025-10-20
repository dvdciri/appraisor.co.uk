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

    if (!process.env.MAPS_API_KEY) {
      console.error('MAPS_API_KEY not found. Please configure your API key.')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': process.env.MAPS_API_KEY,
        'X-Goog-FieldMask': 'addressComponents',
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
    
    // Extract street number and postal code
    let streetNumber = ''
    let route = ''
    let postcode = ''

    if (data.addressComponents) {
      // Find street number
      const streetNumberComponent = data.addressComponents.find(
        (component: any) => component.types?.includes('street_number')
      )
      if (streetNumberComponent) {
        streetNumber = streetNumberComponent.longText || streetNumberComponent.shortText || ''
      }

      // Find route (street name)
      const routeComponent = data.addressComponents.find(
        (component: any) => component.types?.includes('route')
      )
      if (routeComponent) {
        route = routeComponent.longText || routeComponent.shortText || ''
      }

      // Find postal code
      const postalCodeComponent = data.addressComponents.find(
        (component: any) => component.types?.includes('postal_code')
      )
      if (postalCodeComponent) {
        postcode = postalCodeComponent.longText || postalCodeComponent.shortText || ''
      }
    }

    // Combine street number and route
    const address = [streetNumber, route].filter(Boolean).join(' ')

    console.log('Extracted from details API:', { address, postcode })

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
