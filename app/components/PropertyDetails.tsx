'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  updateUserAnalysis,
  getUserAnalysis
} from '../../lib/persistence'
import Toast from './Toast'

interface PropertyData {
  data: {
    attributes: {
      uprn: string
      address: {
        formatted_address: string
        postcode: string
        building_name?: string
        building_number?: number
        street: string
        locality: string
        town: string
        county: string
        country: string
      }
      property: {
        property_type: string
        property_subtype: string
        tenure: string
        number_of_bedrooms: number
        number_of_bathrooms: number
        number_of_reception_rooms: number
        floor_area: {
          total: number
        }
      }
      valuation: {
        current_value: number
        value_range: {
          lower: number
          upper: number
        }
      }
      location: {
        latitude: number
        longitude: number
      }
      epc: {
        current_rating: string
        current_efficiency: number
        potential_rating: string
        potential_efficiency: number
      }
      nearby_completed_transactions?: any[]
      nearby_listings?: {
        sale_listings: any[]
        rental_listings: any[]
      }
      [key: string]: any
    }
  }
  // Legacy fields for backward compatibility
  calculatedValuation?: number
  valuationBasedOnComparables?: number
  lastValuationUpdate?: number
  calculatedRent?: number
  rentBasedOnComparables?: number
  lastRentUpdate?: number
  calculatedYield?: number
  lastYieldUpdate?: number
}

interface PropertyDetailsProps {
  propertyData: PropertyData | null
  propertyId: string
  onBack?: () => void
}

export default function PropertyDetails({ propertyData, propertyId, onBack }: PropertyDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  // Tabs state
  const tabs = ['📋 Basic Details', '🗺️ Plot', '📜 Transaction History', '⚡ EPC', '⚠️ Risk assesment', '🏠 Listed Nearby', '📈 Market', '🚌 Transport & Education']
  const [selectedTab, setSelectedTab] = useState<string>('📋 Basic Details')
  const [nearbyListingsSubTab, setNearbyListingsSubTab] = useState<'sale' | 'rent'>('sale')

  // REMOVED: Valuation, rent, and yield functionality

  // Calculate matching rental listings count
  const matchingRentalListingsCount = useMemo(() => {
    if (!propertyData?.data?.attributes?.nearby_listings?.rental_listings || !propertyData?.data?.attributes?.property) return 0
    
    const rentalListings = propertyData.data.attributes.nearby_listings.rental_listings
    const propertyBeds = propertyData.data.attributes.property.number_of_bedrooms
    const propertyType = propertyData.data.attributes.property.property_type
    const propertyBaths = propertyData.data.attributes.property.number_of_bathrooms
    
    if (!propertyBeds || !propertyType) return 0
    
    // Try strict filter first (type + beds + baths)
    let matchingListings = rentalListings.filter((listing: any) => {
      const samePropertyType = listing.property_type?.value === propertyType
      const sameBeds = listing.number_of_bedrooms === propertyBeds
      const sameBaths = listing.number_of_bathrooms === propertyBaths
      
      return samePropertyType && sameBeds && sameBaths
    })
    
    // If less than 5 matches, use relaxed filter (type + beds only)
    if (matchingListings.length < 5) {
      matchingListings = rentalListings.filter((listing: any) => {
        const samePropertyType = listing.property_type?.value === propertyType
        const sameBeds = listing.number_of_bedrooms === propertyBeds
        
        return samePropertyType && sameBeds
      })
      
      // If still less than 5, include ±1 bedroom
      if (matchingListings.length < 5) {
        matchingListings = rentalListings.filter((listing: any) => {
          const samePropertyType = listing.property_type?.value === propertyType
          const bedroomDiff = Math.abs((listing.number_of_bedrooms || 0) - propertyBeds)
          
          return samePropertyType && bedroomDiff <= 1
        })
      }
    }
    
    return matchingListings.length
  }, [propertyData?.data?.attributes?.nearby_listings, propertyData?.data?.attributes?.property])

  const attributes = propertyData?.data.attributes

  if (!attributes) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack || (() => router.back())}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-400">No property data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Generate Google Maps embed URL
  const mapEmbedUrl = useMemo(() => {
    if (!attributes.location) return null
    const { latitude, longitude } = attributes.location
    return `https://www.google.com/maps/embed/v1/view?key=${process.env.MAPS_API_KEY}&center=${latitude},${longitude}&zoom=15&maptype=roadmap`
  }, [attributes.location])

  // Generate Street View image URL
  const streetViewImageUrl = useMemo(() => {
    if (!attributes.location) return null
    const { latitude, longitude } = attributes.location
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${latitude},${longitude}&fov=90&heading=0&pitch=0&key=${process.env.MAPS_API_KEY}`
  }, [attributes.location])

  // REMOVED: Load persisted valuation and rent functionality

  const openImageGallery = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images)
    setCurrentImageIndex(startIndex)
    setIsGalleryOpen(true)
  }

  const closeImageGallery = () => {
    setIsGalleryOpen(false)
    setSelectedImages([])
    setCurrentImageIndex(0)
  }

  // REMOVED: toggleComparable function

  const updateFilter = (key: string, value: string) => {
    // REMOVED: Filter functionality
  }

  // REMOVED: clearFilters function

  const filterTransactions = (transactions: any[]) => {
    return transactions
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length)
  }

  const formatDistance = (distanceInMetres: number) => {
    if (distanceInMetres >= 1000) {
      return `${(distanceInMetres / 1000).toFixed(1)} km`
    }
    return `${distanceInMetres} m`
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack || (() => router.back())}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-center flex-1">Property Details</h1>
            <div className="w-16"></div>
          </div>

          {/* Property Overview */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Property Info */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-2">{attributes.address?.formatted_address || 'Address not available'}</h2>
                <p className="text-gray-300 mb-4">{attributes.address?.postcode || 'Postcode not available'}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-md p-3">
                    <div className="text-xs text-gray-400 mb-1">Property Type</div>
                    <div className="font-semibold">{attributes.property?.property_type || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-700 rounded-md p-3">
                    <div className="text-xs text-gray-400 mb-1">Bedrooms</div>
                    <div className="font-semibold">{attributes.property?.number_of_bedrooms || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-700 rounded-md p-3">
                    <div className="text-xs text-gray-400 mb-1">Bathrooms</div>
                    <div className="font-semibold">{attributes.property?.number_of_bathrooms || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-700 rounded-md p-3">
                    <div className="text-xs text-gray-400 mb-1">Reception Rooms</div>
                    <div className="font-semibold">{attributes.property?.number_of_reception_rooms || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Right: Valuation */}
              <div className="bg-gray-700 rounded-md p-4">
                <h3 className="text-xs font-medium text-gray-300 mb-1">Current Value</h3>
                <p className="text-2xl font-bold text-white">
                  £{attributes.valuation?.current_value?.toLocaleString('en-GB') || 'N/A'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Range: £{attributes.valuation?.value_range?.lower?.toLocaleString('en-GB') || 'N/A'} - £{attributes.valuation?.value_range?.upper?.toLocaleString('en-GB') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* REMOVED: Valuations Section */}
          
          {/* Maps Section */}
          {(streetViewImageUrl || mapEmbedUrl) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Left: Interactive Google Map with pin */}
              {mapEmbedUrl && (
                <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden border border-purple-500/30">
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Property Location Map"
                  />
                </div>
              )}

              {/* Right: Street View */}
              {streetViewImageUrl && (
                <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden border border-purple-500/30">
                  <img
                    src={streetViewImageUrl}
                    alt="Street View"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-2 text-white text-sm">
                    Street View
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs Section */}
          <div className="mt-8">
            <div className="border-b border-gray-700 mb-6">
              <nav className="flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      selectedTab === tab
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {selectedTab === '📋 Basic Details' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Basic Property Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium mb-3">Property Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Property Type:</span>
                          <span>{attributes.property?.property_type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Subtype:</span>
                          <span>{attributes.property?.property_subtype || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tenure:</span>
                          <span>{attributes.property?.tenure || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Floor Area:</span>
                          <span>{attributes.property?.floor_area?.total ? `${attributes.property.floor_area.total} sq ft` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-3">Address Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Building:</span>
                          <span>{attributes.address?.building_name || attributes.address?.building_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Street:</span>
                          <span>{attributes.address?.street || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Locality:</span>
                          <span>{attributes.address?.locality || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Town:</span>
                          <span>{attributes.address?.town || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">County:</span>
                          <span>{attributes.address?.county || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === '📜 Transaction History' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Nearby Completed Transactions</h3>
                  
                  {attributes.nearby_completed_transactions && attributes.nearby_completed_transactions.length > 0 ? (
                    <div className="space-y-4">
                      {attributes.nearby_completed_transactions.slice(0, 10).map((transaction: any, index: number) => {
                        const transactionDate = new Date(transaction.transaction_date)
                        const distance = transaction.distance ? `${transaction.distance.toFixed(1)} miles` : 'Unknown distance'
                        
                        return (
                          <div
                            key={`${transaction.street_group_property_id}-${index}`}
                            className="p-4 rounded-lg border border-gray-600 bg-gray-700/30"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg font-bold text-white">
                                    £{transaction.price?.toLocaleString('en-GB') || 'N/A'}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-300 space-y-1">
                                  <div className="flex items-center gap-4">
                                    <span>📍 {distance}</span>
                                    <span>🏠 {transaction.property_type || 'Unknown'}</span>
                                    <span>🛏️ {transaction.number_of_bedrooms || 'N/A'} beds</span>
                                    <span>🛁 {transaction.number_of_bathrooms || 'N/A'} baths</span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    📅 Sold: {transactionDate.toLocaleDateString('en-GB')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400">No nearby completed transactions available</p>
                  )}
                </div>
              )}

              {selectedTab === '🏠 Listed Nearby' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Nearby Listings</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNearbyListingsSubTab('sale')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          nearbyListingsSubTab === 'sale'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        For Sale ({attributes.nearby_listings?.sale_listings?.length || 0})
                      </button>
                      <button
                        onClick={() => setNearbyListingsSubTab('rent')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          nearbyListingsSubTab === 'rent'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        For Rent ({attributes.nearby_listings?.rental_listings?.length || 0})
                      </button>
                    </div>
                  </div>

                  {nearbyListingsSubTab === 'sale' ? (
                    <div className="space-y-4">
                      {attributes.nearby_listings?.sale_listings?.slice(0, 10).map((listing: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-600 bg-gray-700/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-white">
                                  £{listing.price?.toLocaleString('en-GB') || 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 space-y-1">
                                <div className="flex items-center gap-4">
                                  <span>🏠 {listing.property_type || 'Unknown'}</span>
                                  <span>🛏️ {listing.number_of_bedrooms || 'N/A'} beds</span>
                                  <span>🛁 {listing.number_of_bathrooms || 'N/A'} baths</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attributes.nearby_listings?.rental_listings?.slice(0, 10).map((listing: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-600 bg-gray-700/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-white">
                                  £{listing.price?.toLocaleString('en-GB') || 'N/A'}/pcm
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 space-y-1">
                                <div className="flex items-center gap-4">
                                  <span>🏠 {listing.property_type || 'Unknown'}</span>
                                  <span>🛏️ {listing.number_of_bedrooms || 'N/A'} beds</span>
                                  <span>🛁 {listing.number_of_bathrooms || 'N/A'} baths</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedTab === '⚡ EPC' && attributes.epc && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Energy Performance Certificate</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium mb-3">Current Rating</h4>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-400 mb-2">
                          {attributes.epc?.current_rating || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {attributes.epc?.current_efficiency ? `${attributes.epc.current_efficiency} points` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium mb-3">Potential Rating</h4>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-400 mb-2">
                          {attributes.epc?.potential_rating || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {attributes.epc?.potential_efficiency ? `${attributes.epc.potential_efficiency} points` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!['📋 Basic Details', '📜 Transaction History', '🏠 Listed Nearby', '⚡ EPC'].includes(selectedTab) && (
                <div className="text-center py-12">
                  <p className="text-gray-400">Content for {selectedTab} coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close button */}
            <button
              onClick={closeImageGallery}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main image */}
            <div className="relative">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Gallery image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo='
                }}
              />
              
              {/* Image counter */}
              {selectedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {selectedImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {selectedImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto">
                {selectedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-600'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlCOUI5QiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5OPC90ZXh0Pgo8L3N2Zz4K'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}