'use client'

import { useState } from 'react'

interface StreetViewImageProps {
  address: string
  postcode: string
  latitude?: number
  longitude?: number
  className?: string
  size?: string
}

export default function StreetViewImage({ 
  address, 
  postcode, 
  latitude,
  longitude,
  className = "w-20 h-20 object-cover rounded-lg",
  size = "150x150"
}: StreetViewImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if Google Maps API key is available
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    return (
      <div className={`${className} bg-gray-700/50 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">API key required</p>
        </div>
      </div>
    )
  }

  // Create the full address for the street view API
  const fullAddress = `${address}, ${postcode}, UK`
  const encodedAddress = encodeURIComponent(fullAddress)
  
  // Google Street View Static API URL
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedAddress}&heading=0&pitch=0&fov=90&key=${apiKey}`

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }


  if (imageError) {
    return (
      <div className={`${className} bg-gray-700/50 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">No image</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-700/50 flex items-center justify-center`}>
          <div className="text-center text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-1"></div>
            <p className="text-xs">Loading...</p>
          </div>
        </div>
      )}
      <img
        src={streetViewUrl}
        alt={`Street view of ${address}`}
        className={`${className} ${isLoading ? 'hidden' : 'block'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  )
}
