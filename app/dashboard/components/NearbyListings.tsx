'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Listing {
  street_group_property_id: string
  address: {
    royal_mail_format: {
      thoroughfare: string
      post_town: string
      postcode: string
    }
  }
  location: {
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  property_type: {
    value: string
  }
  price: number
  number_of_bedrooms: number
  number_of_bathrooms: number
  internal_area_square_metres: number
  distance_in_metres: number
  main_image_url: string
  images: string[]
  listing_id: string
  source: string
  listed_date: string
  agent?: {
    branch_name: string
    company_name: string
  }
}

interface NearbyListingsProps {
  listings: {
    sale_listings: Listing[]
    rental_listings: Listing[]
  }
  mainPropertyLocation?: {
    latitude: number
    longitude: number
  }
  mainPropertyPostcode?: string
}

const SALE_PRICE_OPTIONS = [
  'Any',
  '£50,000',
  '£60,000',
  '£70,000',
  '£80,000',
  '£90,000',
  '£100,000',
  '£110,000',
  '£120,000',
  '£130,000',
  '£140,000',
  '£150,000',
  '£175,000',
  '£200,000',
  '£225,000',
  '£250,000',
  '£275,000',
  '£300,000',
  '£325,000',
  '£350,000',
  '£400,000',
  '£450,000',
  '£500,000',
  '£600,000',
  '£700,000',
  '£800,000',
  '£900,000',
  '£1,000,000',
  '£1,250,000',
  '£1,500,000',
  '£2,000,000',
]

const RENT_PRICE_OPTIONS = [
  'Any',
  '£100',
  '£150',
  '£200',
  '£250',
  '£300',
  '£350',
  '£400',
  '£450',
  '£500',
  '£600',
  '£700',
  '£800',
  '£900',
  '£1,000',
  '£1,250',
  '£1,500',
  '£2,000',
  '£2,500',
  '£3,000',
]

const DISTANCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'This area only', value: 200 },
  { label: 'Within 1/4 mile', value: 402 },
  { label: 'Within 1/2 mile', value: 804 },
  { label: 'Within 1 mile', value: 1609 },
  { label: 'Within 2 miles', value: 3218 },
]

  const BED_OPTIONS = ['Any', '1', '2', '3', '4', '5', '6+']
  const BATH_OPTIONS = ['Any', '1', '2', '3', '4', '5+']

const SORT_OPTIONS = [
  { label: 'Highest price first', value: 'price-high' },
  { label: 'Lowest price first', value: 'price-low' },
  { label: 'Newest listed first', value: 'newest' },
  { label: 'Oldest listed first', value: 'oldest' },
]

// Helper functions
const metersToMiles = (meters: number): string => {
  const miles = meters / 1609.34
  return miles.toFixed(2)
}

const formatPrice = (price: number, type: 'sale' | 'rent'): string => {
  if (type === 'rent') {
    return `£${price.toLocaleString()} pcm`
  }
  return `£${price.toLocaleString()}`
}

const formatArea = (sqm: number): string => {
  const sqft = Math.round(sqm * 10.764)
  return `${sqm}m² (${sqft.toLocaleString()} sq ft)`
}

const getRightmoveUrl = (listingId: string): string => {
  const numericId = listingId.replace(/^r/, '')
  return `https://www.rightmove.co.uk/properties/${numericId}`
}

// Helper function to calculate approximate coordinates for nearby listings
const calculateNearbyCoordinates = (
  mainLat: number, 
  mainLng: number, 
  distanceInMeters: number,
  listingId: string
): { latitude: number; longitude: number } => {
  // Convert meters to degrees (rough approximation)
  // 1 degree latitude ≈ 111,000 meters
  // 1 degree longitude ≈ 111,000 * cos(latitude) meters
  
  // Use listing ID to create deterministic but varied positions
  const hash = listingId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180) // Convert to radians
  const distanceInDegrees = distanceInMeters / 111000
  
  const latOffset = distanceInDegrees * Math.cos(angle) * 0.5
  const lngOffset = distanceInDegrees * Math.sin(angle) * 0.5 / Math.cos(mainLat * Math.PI / 180)
  
  return {
    latitude: mainLat + latOffset,
    longitude: mainLng + lngOffset
  }
}

export default function NearbyListings({ listings, mainPropertyLocation, mainPropertyPostcode }: NearbyListingsProps) {
  const [activeTab, setActiveTab] = useState<'sale' | 'rent'>('sale')
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedProperty, setSelectedProperty] = useState<Listing | null>(null)
  
  // Filter states
  const [distanceFilter, setDistanceFilter] = useState(DISTANCE_OPTIONS[0].value)
  const [beds, setBeds] = useState('Any')
  const [baths, setBaths] = useState('Any')
  const [propertyType, setPropertyType] = useState('All types')
  const [sortBy, setSortBy] = useState('newest')

  // Get available property types and enhance with coordinates
  const availableListings = useMemo(() => {
    const baseListings = activeTab === 'sale' ? listings.sale_listings : listings.rental_listings
    
    if (!mainPropertyLocation) return baseListings
    
    return baseListings.map(listing => ({
      ...listing,
      location: {
        coordinates: calculateNearbyCoordinates(
          mainPropertyLocation.latitude,
          mainPropertyLocation.longitude,
          listing.distance_in_metres,
          listing.listing_id
        )
      }
    }))
  }, [listings, activeTab, mainPropertyLocation])
  const uniquePropertyTypes = useMemo(() => {
    const types = new Set(availableListings.map(listing => listing.property_type?.value))
    return Array.from(types).filter(Boolean).sort()
  }, [availableListings])

  const PROPERTY_TYPE_OPTIONS = ['All types', ...uniquePropertyTypes]


  const parsePrice = (priceStr: string): number => {
    return parseInt(priceStr.replace(/[£,]/g, '')) || 0
  }

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = [...availableListings]

    // Distance filter
    if (distanceFilter !== null) {
      filtered = filtered.filter(listing => listing.distance_in_metres <= distanceFilter)
    }

    // Beds filter
    if (beds !== 'Any') {
      if (beds === '6+') {
        filtered = filtered.filter(listing => listing.number_of_bedrooms >= 6)
      } else {
        const bedsValue = parseInt(beds)
        filtered = filtered.filter(listing => listing.number_of_bedrooms === bedsValue)
      }
    }

    // Baths filter
    if (baths !== 'Any') {
      if (baths === '5+') {
        filtered = filtered.filter(listing => listing.number_of_bathrooms >= 5)
      } else {
        const bathsValue = parseInt(baths)
        filtered = filtered.filter(listing => 
          listing.number_of_bathrooms === bathsValue || listing.number_of_bathrooms === 0
        )
      }
    }

    // Property type filter
    if (propertyType !== 'All types') {
      filtered = filtered.filter(listing => listing.property_type?.value === propertyType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return b.price - a.price
        case 'price-low':
          return a.price - b.price
        case 'newest':
          return new Date(b.listed_date).getTime() - new Date(a.listed_date).getTime()
        case 'oldest':
          return new Date(a.listed_date).getTime() - new Date(b.listed_date).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [availableListings, distanceFilter, beds, baths, propertyType, sortBy])

  const handleImageNavigation = (listingId: string, direction: 'prev' | 'next', totalImages: number) => {
    const currentIndex = currentImageIndex[listingId] || 0
    let newIndex: number

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1
    }

    setCurrentImageIndex(prev => ({
      ...prev,
      [listingId]: newIndex
    }))
  }


  const ListingCard = ({ listing }: { listing: Listing }) => {
    // Filter out null, undefined, and empty string images
    const allImages = (listing.images || [])
      .filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim() !== ''))
      .slice(0, 10) // Limit to first 10 images
    const rawImageIndex = currentImageIndex[listing.listing_id] || 0
    // Ensure imageIndex is within bounds
    const imageIndex = allImages.length > 0 ? Math.min(rawImageIndex, allImages.length - 1) : 0
    const currentImage = allImages[imageIndex] || listing.main_image_url || '/logo.png'
    const hasMultipleImages = allImages.length > 1

    const handleListingClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('Listing clicked:', listing)
      
      // Add visual feedback
      const target = e.currentTarget as HTMLElement
      target.style.transform = 'scale(0.98)'
      setTimeout(() => {
        target.style.transform = ''
      }, 150)
      
      if (listing.source === 'rightmove') {
        const url = getRightmoveUrl(listing.listing_id)
        console.log('Opening Rightmove URL:', url)
        
        // Try to open in new tab, fallback to current tab if popup blocked
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked, fallback to current tab
          console.log('Popup blocked, opening in current tab')
          window.location.href = url
        }
      } else {
        console.log('Non-Rightmove listing clicked, source:', listing.source)
        // For other sources, we could add different handling here
      }
    }

    return (
      <div 
        className="bg-black/20 border border-gray-500/30 rounded-xl p-6 mb-6 hover:bg-black/30 transition-all duration-200 cursor-pointer"
        onClick={handleListingClick}
      >
        <div className="flex gap-6">
          {/* Left Side - Image Carousel */}
          <div className="w-[40%] relative group">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={currentImage}
                alt={`${listing.address.royal_mail_format.thoroughfare}`}
                fill
                className="object-cover pointer-events-none"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              
              {/* Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageNavigation(listing.listing_id, 'prev', allImages.length)
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageNavigation(listing.listing_id, 'next', allImages.length)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Dot Indicators */}
            {hasMultipleImages && (
              <div className="flex justify-center gap-1 mt-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(prev => ({ ...prev, [listing.listing_id]: index }))
                    }}
                    className={`w-2 h-2 rounded-full transition-all pointer-events-auto ${
                      imageIndex === index ? 'bg-purple-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Property Details */}
          <div className="flex-1 pointer-events-none">
            {/* Address */}
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              {listing.address.royal_mail_format.thoroughfare}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {listing.address.royal_mail_format.post_town}, {listing.address.royal_mail_format.postcode}
            </p>

            {/* Price */}
            <div className="text-2xl font-bold text-purple-400 mb-4">
              {formatPrice(listing.price, activeTab)}
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">{listing.property_type?.value}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  {/* Headboard */}
                  <rect x="2" y="4" width="4" height="16" rx="2" />
                  {/* Pillow */}
                  <rect x="3" y="6" width="2" height="3" rx="1" />
                  {/* Mattress/Bed frame */}
                  <rect x="6" y="12" width="14" height="8" rx="1" />
                  {/* Footboard */}
                  <rect x="18" y="8" width="4" height="12" rx="2" />
                </svg>
                <span className="text-sm">{listing.number_of_bedrooms} beds, {listing.number_of_bathrooms} baths</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-sm">{formatArea(listing.internal_area_square_metres || 0)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{metersToMiles(listing.distance_in_metres)} miles</span>
              </div>
            </div>

            {/* Agent Info */}
            {listing.agent && (
              <p className="text-xs text-gray-500 mb-4">
                {listing.agent.company_name} - {listing.agent.branch_name}
              </p>
            )}

            {/* Rightmove Button */}
            {listing.source === 'rightmove' && (
              <a
                href={getRightmoveUrl(listing.listing_id)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 pointer-events-auto"
              >
                View on Rightmove
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full">
      {/* Filters and Sort */}
      <div className="bg-black/20 border border-gray-500/30 rounded-xl p-6 mb-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
              activeTab === 'sale'
                ? 'bg-purple-500/20 text-purple-100 border border-purple-400/30'
                : 'bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 border border-transparent'
            }`}
          >
            For Sale
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            className={`px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
              activeTab === 'rent'
                ? 'bg-purple-500/20 text-purple-100 border border-purple-400/30'
                : 'bg-gray-500/10 text-gray-300 hover:bg-gray-500/20 border border-transparent'
            }`}
          >
            For Rent
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Distance Filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Distance</label>
            <div className="relative">
              <select
                value={distanceFilter || ''}
                onChange={(e) => setDistanceFilter(Number(e.target.value) || null)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {DISTANCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value || ''}>{option.label}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Beds */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Beds</label>
            <div className="relative">
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {BED_OPTIONS.map(bed => (
                  <option key={bed} value={bed}>{bed}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Baths */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Baths</label>
            <div className="relative">
              <select
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {BATH_OPTIONS.map(bath => (
                  <option key={bath} value={bath}>{bath}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Property Type</label>
            <div className="relative">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 pr-12 text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
              >
                {PROPERTY_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">Display options</label>
          <div className="flex items-center gap-2">
            <div className="bg-black/20 border border-gray-600 rounded-md p-0.5 flex">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                List view
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Map view
              </button>
            </div>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-gray-600 rounded-md px-3 py-2 pr-10 text-xs font-medium text-gray-100 focus:outline-none focus:border-purple-400 appearance-none h-8"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* Dynamic Title */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-100">
          Properties {activeTab === 'sale' ? 'for sale' : 'for rent'} in {mainPropertyPostcode || 'this area'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Showing {filteredAndSortedListings.length} {filteredAndSortedListings.length === 1 ? 'property' : 'properties'}
        </p>
      </div>

      {/* Listings */}
      <div>
        
        {filteredAndSortedListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-50">🏠</div>
            <p className="text-gray-400">No properties found matching your filters</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === 'list' ? (
          filteredAndSortedListings.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))
        ) : (
          <MapView 
            listings={filteredAndSortedListings} 
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            activeTab={activeTab}
            mainPropertyLocation={mainPropertyLocation}
          />
        )}
      </div>
    </div>
  )
}

// MapView Component
function MapView({ 
  listings, 
  selectedProperty, 
  onPropertySelect,
  activeTab,
  mainPropertyLocation
}: { 
  listings: Listing[]
  selectedProperty: Listing | null
  onPropertySelect: (property: Listing | null) => void
  activeTab: 'sale' | 'rent'
  mainPropertyLocation?: { latitude: number; longitude: number }
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [radiusCircle, setRadiusCircle] = useState<any>(null)
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [infoWindow, setInfoWindow] = useState<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return

    const initMap = () => {
      // Find first listing with valid coordinates
      const listingWithCoords = listings.find(listing => 
        listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude
      )
      
      const center = listingWithCoords
        ? { lat: listingWithCoords.location.coordinates.latitude, lng: listingWithCoords.location.coordinates.longitude }
        : { lat: 51.5074, lng: -0.1278 } // Default to London

      const newMap = new (window as any).google.maps.Map(mapRef.current!, {
        zoom: 13,
        center,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1e293b' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#000000', weight: 2 }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#10b981' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#374151' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d1d5db' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#4b5563' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2937' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#374151' }]
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#fbbf24' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#1e40af' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#60a5fa' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#000000' }]
          }
        ]
      })

      setMap(newMap)
    }

    // Load Google Maps script if not already loaded
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [listings, map])


  // Update markers and radius circle when listings change
  useEffect(() => {
    if (!map || !listings.length) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    
    // Clear existing radius circle
    if (radiusCircle) {
      radiusCircle.setMap(null)
    }
    
    // Clear selected marker
    setSelectedMarker(null)
    
    // Close any existing info window
    if (infoWindow) {
      infoWindow.close()
    }

    const newMarkers = listings
      .filter(listing => listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude)
      .map(listing => {
        const price = formatPrice(listing.price, activeTab)
        
        const marker = new (window as any).google.maps.Marker({
          position: { lat: listing.location.coordinates.latitude, lng: listing.location.coordinates.longitude },
          map,
          title: `${listing.address.royal_mail_format.thoroughfare}, ${listing.address.royal_mail_format.post_town}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="76" height="28" rx="14" fill="white" stroke="#e5e7eb" stroke-width="1"/>
                <rect x="0" y="0" width="80" height="32" rx="16" fill="white" opacity="0.1"/>
                <text x="40" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#1f2937">${price}</text>
                <polygon points="36,28 40,32 44,28" fill="white"/>
                <polygon points="36,30 40,34 44,30" fill="#e5e7eb"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(80, 32),
            anchor: new (window as any).google.maps.Point(40, 32)
          }
        })
        
        // Store the price and listing data on the marker for later use
        ;(marker as any).price = price
        ;(marker as any).listing = listing

        marker.addListener('click', () => {
          console.log('DEBUG: Marker clicked for listing:', listing.listing_id)
          
          // Reset all markers to original color first
          newMarkers.forEach(m => {
            const markerPrice = (m as any).price
            m.setIcon({
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="76" height="28" rx="14" fill="white" stroke="#e5e7eb" stroke-width="1"/>
                  <rect x="0" y="0" width="80" height="32" rx="16" fill="white" opacity="0.1"/>
                  <text x="40" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#1f2937">${markerPrice}</text>
                  <polygon points="36,28 40,32 44,28" fill="white"/>
                  <polygon points="36,30 40,34 44,30" fill="#e5e7eb"/>
                </svg>
              `),
              scaledSize: new (window as any).google.maps.Size(80, 32),
              anchor: new (window as any).google.maps.Point(40, 32)
            })
          })
          
          // Close any existing info window
          if (infoWindow) {
            infoWindow.close()
          }
          
          // Also try to close any InfoWindow that might be in the DOM
          const existingInfoWindows = document.querySelectorAll('.gm-style-iw')
          existingInfoWindows.forEach((iw: Element) => {
            const closeButton = iw.querySelector('.gm-style-iw-tc + .gm-style-iw-c button')
            if (closeButton) {
              (closeButton as HTMLElement).click()
            }
          })
          
          // Highlight the clicked marker
          marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="80" height="32" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="76" height="28" rx="14" fill="#7c3aed" stroke="#6d28d9" stroke-width="2"/>
                <rect x="0" y="0" width="80" height="32" rx="16" fill="#7c3aed" opacity="0.1"/>
                <text x="40" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="white">${price}</text>
                <polygon points="36,28 40,32 44,28" fill="#7c3aed"/>
                <polygon points="36,30 40,34 44,30" fill="#6d28d9"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(80, 32),
            anchor: new (window as any).google.maps.Point(40, 32)
          })
          
          // Get the first image for the popup
          const validImages = (listing.images || []).filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim() !== ''))
          const popupImage = listing.main_image_url || validImages[0] || '/logo.png'
          
          // Create properly styled InfoWindow content
          const infoWindowContent = `
            <div style="width: 200px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <div style="margin-bottom: 12px;">
                <img src="${popupImage}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" alt="Property" />
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 4px;">${price}</div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Guide Price</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; color: #374151;">
                <span style="font-weight: 500;">${listing.property_type?.value || 'Property'}</span>
                <div style="width: 1px; height: 12px; background: #e5e7eb;"></div>
                <div style="display: flex; align-items: center; gap: 2px;">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  ${listing.number_of_bedrooms || 0}
                </div>
                <div style="width: 1px; height: 12px; background: #e5e7eb;"></div>
                <div style="display: flex; align-items: center; gap: 2px;">
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  ${listing.number_of_bathrooms || 0}
                </div>
              </div>
              <button onclick="window.open('${getRightmoveUrl(listing.listing_id)}', '_blank')" 
                      style="width: 100%; background: #7c3aed; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                      onmouseover="this.style.background='#6d28d9'" 
                      onmouseout="this.style.background='#7c3aed'">
                View on Rightmove
              </button>
            </div>
          `
          
          
          try {
            // Create and open InfoWindow
            const newInfoWindow = new (window as any).google.maps.InfoWindow({
              content: infoWindowContent,
              position: marker.getPosition(),
              pixelOffset: new (window as any).google.maps.Size(0, -10),
              maxWidth: 250
            })
            
            console.log('DEBUG: InfoWindow created, opening...')
            newInfoWindow.open(map, marker)
            console.log('DEBUG: InfoWindow opened')
            
            // Check if it's visible after a short delay
            setTimeout(() => {
              const infoWindowElement = document.querySelector('.gm-style-iw')
              if (infoWindowElement) {
                console.log('DEBUG: InfoWindow element found in DOM')
              } else {
                console.log('DEBUG: InfoWindow element NOT found in DOM - this is the problem!')
              }
            }, 100)
            
            // Don't store in state to avoid interference
            // setInfoWindow(newInfoWindow)
          } catch (error) {
            console.error('Error creating InfoWindow:', error)
          }
        })

        return marker
      })

    setMarkers(newMarkers)

            // Create radius circle around the main property
            if (mainPropertyLocation && listings.length > 0) {
              const maxDistance = Math.max(...listings.map(l => l.distance_in_metres))
              
              const circle = new (window as any).google.maps.Circle({
                strokeColor: '#ec4899',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#ec4899',
                fillOpacity: 0.1,
                map: map,
                center: {
                  lat: mainPropertyLocation.latitude,
                  lng: mainPropertyLocation.longitude
                },
                radius: maxDistance
              })
              
              setRadiusCircle(circle)
            }

            // Fit map to show all markers with padding around the radius circle
            if (newMarkers.length > 0) {
              const bounds = new (window as any).google.maps.LatLngBounds()
              
              // Always include the main property location in bounds
              if (mainPropertyLocation) {
                bounds.extend(new (window as any).google.maps.LatLng(mainPropertyLocation.latitude, mainPropertyLocation.longitude))
              }
              
              // Add all marker positions
              newMarkers.forEach(marker => bounds.extend(marker.getPosition()!))
              
              // For small areas, ensure we show the full radius circle
              const maxDistance = Math.max(...listings.map(l => l.distance_in_metres))
              if (maxDistance < 1000 && mainPropertyLocation) {
                // Convert meters to degrees (rough approximation)
                const radiusInDegrees = maxDistance / 111000
                
                // Extend bounds to include the full radius circle
                bounds.extend(new (window as any).google.maps.LatLng(
                  mainPropertyLocation.latitude + radiusInDegrees,
                  mainPropertyLocation.longitude + radiusInDegrees
                ))
                bounds.extend(new (window as any).google.maps.LatLng(
                  mainPropertyLocation.latitude - radiusInDegrees,
                  mainPropertyLocation.longitude - radiusInDegrees
                ))
              }
              
              // Add padding to ensure the radius circle is fully visible
              const padding = 0.5 // 50% padding
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              const latDiff = ne.lat() - sw.lat()
              const lngDiff = ne.lng() - sw.lng()
              
              bounds.extend({
                lat: ne.lat() + (latDiff * padding),
                lng: ne.lng() + (lngDiff * padding)
              })
              bounds.extend({
                lat: sw.lat() - (latDiff * padding),
                lng: sw.lng() - (lngDiff * padding)
              })
              
              map.fitBounds(bounds)
            }
  }, [map, listings, onPropertySelect])

  // Close info window when selectedProperty changes
  useEffect(() => {
    if (!selectedProperty && infoWindow) {
      infoWindow.close()
      setInfoWindow(null)
    }
  }, [selectedProperty, infoWindow])

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full aspect-square rounded-xl overflow-hidden border border-gray-500/30"
        style={{ minHeight: '500px' }}
      />
    </div>
  )
}
