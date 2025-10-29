'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import InvestmentCalculator from '../components/InvestmentCalculator'
import ComparablesAnalysis, { renderTransactionDetails } from '../components/ComparablesAnalysis'
import GenericPanel from '../components/GenericPanel'
import WorkingUserMenu from '../../components/WorkingUserMenu'
import MarketAnalysis from '../components/MarketAnalysis'
import NearbyListings from '../components/NearbyListings'
import StreetViewImage from '../components/StreetViewImage'
import RefurbishmentEstimator from '../components/RefurbishmentEstimator'

type Section = 'property-details' | 'market-analysis' | 'sold-comparables' | 'investment-calculator' | 'ai-refurbishment' | 'risk-assessment' | 'nearby-listings'

const sections = [
  { id: 'property-details' as Section, label: 'Property Details', icon: '🏠' },
  { id: 'risk-assessment' as Section, label: 'Risk Assessment', icon: '⚠️' },
  { id: 'market-analysis' as Section, label: 'Market Analysis', icon: '📊' },
  { id: 'nearby-listings' as Section, label: 'Nearby Listings', icon: '📍' },
  { id: 'sold-comparables' as Section, label: 'Property Valuation', icon: '💰' },
  { id: 'ai-refurbishment' as Section, label: 'AI Refurbishment Quote', icon: '🏚️' },
  { id: 'investment-calculator' as Section, label: 'Investment Calculator', icon: '📈' },
]

const subsections = {
  'property-details': [
    { id: 'ownership', label: 'Ownership & Occupancy', icon: '🏠', description: 'Tenure type, ownership status, occupancy, and legal information' },
    { id: 'construction', label: 'Construction Details', icon: '🏗️', description: 'Building materials, construction age, and structural details' },
    { id: 'plot', label: 'Plot & Outdoor Space', icon: '🌳', description: 'Land area, garden space, and outdoor amenities' },
    { id: 'utilities', label: 'Utilities & Services', icon: '🔧', description: 'Water, drainage, heating, and utility connections' },
    { id: 'energy', label: 'EPC Rating', icon: '⚡', description: 'Energy Performance Certificate ratings and efficiency details' },
  ],
}


interface PropertyData {
  uprn: string
  data: {
    data: {
      attributes: any
    }
  }
  lastFetched: string
  fetchedCount: number
}

// Ownership Data Display Component
const OwnershipDataDisplay = ({ propertyData, getPropertyValue }: { propertyData: PropertyData | null, getPropertyValue: (path: string, fallback?: string) => any }) => {
  if (!propertyData) return null

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <div className="space-y-3">
        {getPropertyValue('tenure.tenure_type') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Tenure Type</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('tenure.tenure_type')}</span>
          </div>
        )}
        {getPropertyValue('ownership.company_owned') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Company Owned</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('ownership.company_owned') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('ownership.overseas_owned') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Overseas Owned</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('ownership.overseas_owned') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('ownership.social_housing') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Social Housing</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('ownership.social_housing') ? 'Yes' : 'No'}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-400">Occupancy</span>
          <span className="text-gray-100 font-medium">
            {(() => {
              const occupancyValue = getPropertyValue('occupancy')
              if (occupancyValue === 'N/A' || occupancyValue === null || occupancyValue === undefined) {
                return 'Unspecified'
              }
              // Handle object values
              if (typeof occupancyValue === 'object') {
                // If it has occupancy_type, use that
                if (occupancyValue.occupancy_type) {
                  return occupancyValue.occupancy_type
                }
                // If it has owner_occupied boolean, convert to text
                if (typeof occupancyValue.owner_occupied === 'boolean') {
                  return occupancyValue.owner_occupied ? 'Owner Occupied' : 'Not Owner Occupied'
                }
                // Fallback to string representation
                return JSON.stringify(occupancyValue)
              }
              return occupancyValue
            })()}
          </span>
        </div>
        {getPropertyValue('tenure.tenure_type') === 'N/A' && 
         getPropertyValue('ownership.company_owned') === 'N/A' && 
         getPropertyValue('ownership.overseas_owned') === 'N/A' && 
         getPropertyValue('ownership.social_housing') === 'N/A' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3 opacity-50">🏠</div>
            <p className="text-gray-400">No ownership data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Construction Data Display Component
const ConstructionDataDisplay = ({ propertyData, getPropertyValue }: { propertyData: PropertyData | null, getPropertyValue: (path: string, fallback?: string) => any }) => {
  if (!propertyData) return null

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <div className="space-y-3">
        {getPropertyValue('construction_materials.wall_type.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Walls</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.wall_type.value')}</span>
          </div>
        )}
        {getPropertyValue('construction_materials.roof_type.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Roof</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.roof_type.value')}</span>
          </div>
        )}
        {getPropertyValue('construction_materials.window_type.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Windows</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.window_type.value')}</span>
          </div>
        )}
        {getPropertyValue('construction_materials.floor_type.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Floor</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.floor_type.value')}</span>
          </div>
        )}
        {getPropertyValue('listed_buildings_on_plot') !== 'N/A' && (
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Listed Building</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('listed_buildings_on_plot') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('construction_materials.wall_type.value') === 'N/A' && 
         getPropertyValue('construction_materials.roof_type.value') === 'N/A' && 
         getPropertyValue('construction_materials.window_type.value') === 'N/A' && 
         getPropertyValue('construction_materials.floor_type.value') === 'N/A' && 
         getPropertyValue('listed_buildings_on_plot') === 'N/A' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3 opacity-50">🏗️</div>
            <p className="text-gray-400">No construction data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Plot Data Display Component
const PlotDataDisplay = ({ propertyData, getPropertyValue, formatArea }: { propertyData: PropertyData | null, getPropertyValue: (path: string, fallback?: string) => any, formatArea: (squareMeters: number | string) => string }) => {
  if (!propertyData) return null

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <div className="space-y-6">
        {/* Plot Details */}
        <div className="space-y-3">
          <h5 className="text-md font-medium text-gray-300 mb-3">Plot Information</h5>
          {getPropertyValue('plot.total_plot_area_square_metres') !== 'N/A' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
              <span className="text-gray-400">Total Plot Area</span>
              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('plot.total_plot_area_square_metres', '0'))}</span>
            </div>
          )}
          {getPropertyValue('plot.boundary_area_square_metres') !== 'N/A' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
              <span className="text-gray-400">Boundary Area</span>
              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('plot.boundary_area_square_metres', '0'))}</span>
            </div>
          )}
          {getPropertyValue('plot.distance_from_property_metres') !== 'N/A' && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Distance from Property</span>
              <span className="text-gray-100 font-medium">{getPropertyValue('plot.distance_from_property_metres')}m</span>
            </div>
          )}
        </div>
        
        {/* Outdoor Space Details */}
        <div className="space-y-3">
          <h5 className="text-md font-medium text-gray-300 mb-3">Outdoor Space</h5>
          {getPropertyValue('outdoor_space.type') !== 'N/A' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
              <span className="text-gray-400">Type</span>
              <span className="text-gray-100 font-medium">{getPropertyValue('outdoor_space.type')}</span>
            </div>
          )}
          {getPropertyValue('outdoor_space.area_square_metres') !== 'N/A' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
              <span className="text-gray-400">Area</span>
              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('outdoor_space.area_square_metres', '0'))}</span>
            </div>
          )}
          {getPropertyValue('outdoor_space.garden_direction') !== 'N/A' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
              <span className="text-gray-400">Garden Direction</span>
              <span className="text-gray-100 font-medium">{getPropertyValue('outdoor_space.garden_direction')}</span>
            </div>
          )}
          {getPropertyValue('outdoor_space.orientation') !== 'N/A' && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Orientation</span>
              <span className="text-gray-100 font-medium">{getPropertyValue('outdoor_space.orientation')}</span>
            </div>
          )}
        </div>
        
        {/* Plot Boundary Visualization */}
        {getPropertyValue('plot.polygons.0.epsg_4326_polygon.coordinates') !== 'N/A' && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Plot Boundaries</h5>
            <div className="bg-gray-900/30 rounded-lg p-4 h-64 flex items-center justify-center">
              <PlotBoundaryVisualization coordinates={getPropertyValue('plot.polygons.0.epsg_4326_polygon.coordinates')} />
            </div>
          </div>
        )}
        
        {getPropertyValue('plot.total_plot_area_square_metres') === 'N/A' && 
         getPropertyValue('outdoor_space.type') === 'N/A' && 
         getPropertyValue('outdoor_space.area_square_metres') === 'N/A' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3 opacity-50">🌳</div>
            <p className="text-gray-400">No plot data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Utilities Data Display Component
const UtilitiesDataDisplay = ({ propertyData, getPropertyValue }: { propertyData: PropertyData | null, getPropertyValue: (path: string, fallback?: string) => any }) => {
  if (!propertyData) return null

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <div className="space-y-3">
        {getPropertyValue('utilities.mains_gas.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Mains Gas</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.mains_gas.value') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('utilities.mains_fuel_type.value') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Fuel Type</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.mains_fuel_type.value')}</span>
          </div>
        )}
        {getPropertyValue('utilities.solar_power.has_solar_power') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Solar Power</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.solar_power.has_solar_power') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('utilities.solar_power.percentage_of_roof_coverage') !== 'N/A' && getPropertyValue('utilities.solar_power.percentage_of_roof_coverage') !== null && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Solar Coverage</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.solar_power.percentage_of_roof_coverage')}%</span>
          </div>
        )}
        {getPropertyValue('utilities.wind_turbines.has_wind_turbines') !== 'N/A' && (
          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
            <span className="text-gray-400">Wind Turbines</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.wind_turbines.has_wind_turbines') ? 'Yes' : 'No'}</span>
          </div>
        )}
        {getPropertyValue('utilities.wind_turbines.number_of_turbines') !== 'N/A' && getPropertyValue('utilities.wind_turbines.number_of_turbines') !== null && (
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Number of Turbines</span>
            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.wind_turbines.number_of_turbines')}</span>
          </div>
        )}
        {getPropertyValue('utilities.mains_gas.value') === 'N/A' && 
         getPropertyValue('utilities.mains_fuel_type.value') === 'N/A' && 
         getPropertyValue('utilities.solar_power.has_solar_power') === 'N/A' && 
         getPropertyValue('utilities.wind_turbines.has_wind_turbines') === 'N/A' && (
          <div className="text-center py-8">
            <div className="text-3xl mb-3 opacity-50">⚡</div>
            <p className="text-gray-400">No utilities data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Energy Efficiency Rating Color Helper
const getEnergyEfficiencyColor = (rating: string) => {
  const ratingLower = rating?.toLowerCase() || ''
  
  if (ratingLower.includes('very poor') || ratingLower.includes('very poor')) {
    return 'bg-red-600/20 text-red-300 border-red-500/30'
  } else if (ratingLower.includes('poor')) {
    return 'bg-red-500/20 text-red-300 border-red-400/30'
  } else if (ratingLower.includes('average') || ratingLower.includes('fair')) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
  } else if (ratingLower.includes('good')) {
    return 'bg-green-500/20 text-green-300 border-green-400/30'
  } else if (ratingLower.includes('very good') || ratingLower.includes('excellent')) {
    return 'bg-green-600/20 text-green-200 border-green-500/30'
  } else {
    return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
  }
}

// EPC Rating Visual Component
const EPCRatingVisual = ({ rating, size = 'large', colorOverride }: { rating: string, size?: 'small' | 'large', colorOverride?: 'current' | 'potential' }) => {
  const getRatingColor = (rating: string) => {
    // Override colors for current/potential
    if (colorOverride === 'current') {
      return 'from-yellow-500 to-yellow-400'
    } else if (colorOverride === 'potential') {
      return 'from-green-500 to-green-400'
    }
    
    // Default rating-based colors
    switch (rating?.toUpperCase()) {
      case 'A': return 'from-green-500 to-green-400'
      case 'B': return 'from-green-400 to-green-300'
      case 'C': return 'from-yellow-500 to-yellow-400'
      case 'D': return 'from-yellow-600 to-yellow-500'
      case 'E': return 'from-orange-500 to-orange-400'
      case 'F': return 'from-red-500 to-red-400'
      case 'G': return 'from-red-600 to-red-500'
      default: return 'from-gray-500 to-gray-400'
    }
  }

  const getRatingBgColor = (rating: string) => {
    // Override colors for current/potential
    if (colorOverride === 'current') {
      return 'bg-yellow-500/20 border-yellow-400/50'
    } else if (colorOverride === 'potential') {
      return 'bg-green-500/20 border-green-400/50'
    }
    
    // Default rating-based colors
    switch (rating?.toUpperCase()) {
      case 'A': return 'bg-green-500/20 border-green-400/50'
      case 'B': return 'bg-green-400/20 border-green-300/50'
      case 'C': return 'bg-yellow-500/20 border-yellow-400/50'
      case 'D': return 'bg-yellow-600/20 border-yellow-500/50'
      case 'E': return 'bg-orange-500/20 border-orange-400/50'
      case 'F': return 'bg-red-500/20 border-red-400/50'
      case 'G': return 'bg-red-600/20 border-red-500/50'
      default: return 'bg-gray-500/20 border-gray-400/50'
    }
  }

  const sizeClasses = size === 'large' 
    ? 'w-20 h-20 text-2xl font-bold' 
    : 'w-12 h-12 text-lg font-semibold'

  return (
    <div className={`${sizeClasses} rounded-full border-2 ${getRatingBgColor(rating)} flex items-center justify-center bg-gradient-to-br ${getRatingColor(rating)} text-white shadow-lg`}>
      {rating || '?'}
    </div>
  )
}

// EPC Rating Band Visual
const EPCRatingBands = ({ currentRating, potentialRating }: { currentRating: string, potentialRating: string }) => {
  const bands = ['G', 'F', 'E', 'D', 'C', 'B', 'A']
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {bands.map((band) => {
          const isCurrent = currentRating?.toUpperCase() === band
          const isPotential = potentialRating?.toUpperCase() === band
          const isActive = isCurrent || isPotential
          
          return (
            <div key={band} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${
                isCurrent 
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 text-white border-yellow-300 shadow-lg' 
                  : isPotential
                    ? 'bg-gradient-to-br from-green-500 to-green-400 text-white border-green-300 shadow-lg'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400'
              }`}>
                {band}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// EPC Data Display Component
const EPCDataDisplay = ({ propertyData, getPropertyValue }: { propertyData: PropertyData | null, getPropertyValue: (path: string, fallback?: string) => any }) => {
  if (!propertyData) return null

  const currentRating = getPropertyValue('energy_performance.energy_efficiency.current_rating')
  const potentialRating = getPropertyValue('energy_performance.energy_efficiency.potential_rating')
  const currentEfficiency = getPropertyValue('energy_performance.energy_efficiency.current_efficiency')
  const potentialEfficiency = getPropertyValue('energy_performance.energy_efficiency.potential_efficiency')
  const currentImpact = getPropertyValue('energy_performance.environmental_impact.current_impact')
  const potentialImpact = getPropertyValue('energy_performance.environmental_impact.potential_impact')

  const hasCurrentData = currentRating !== 'N/A'
  const hasPotentialData = potentialRating !== 'N/A'
  const hasAnyData = hasCurrentData || hasPotentialData

  if (!hasAnyData) {
    return (
      <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-3xl mb-3 opacity-50">⚡</div>
          <p className="text-gray-400">No EPC data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <div className="space-y-6">
        {/* EPC Rating Comparison */}
        {(hasCurrentData || hasPotentialData) && (
          <div className="space-y-4">
            
            {/* Visual Rating Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Current Rating */}
              {hasCurrentData && (
                <div className="bg-gray-800/20 border border-gray-600/20 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <EPCRatingVisual rating={currentRating} size="large" colorOverride="current" />
                    <div>
                      <h6 className="text-sm font-medium text-gray-200">Current Rating</h6>
                      <p className="text-xs text-gray-300/70">Energy Efficiency</p>
                    </div>
                  </div>
                  {currentEfficiency !== 'N/A' && (
                    <div className="text-sm text-gray-100">
                      <span className="text-gray-300/70">Score:</span> {currentEfficiency}
                    </div>
                  )}
                </div>
              )}

              {/* Potential Rating */}
              {hasPotentialData && (
                <div className="bg-gray-800/20 border border-gray-600/20 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <EPCRatingVisual rating={potentialRating} size="large" colorOverride="potential" />
                    <div>
                      <h6 className="text-sm font-medium text-gray-200">Potential Rating</h6>
                      <p className="text-xs text-gray-300/70">After Improvements</p>
                    </div>
                  </div>
                  {potentialEfficiency !== 'N/A' && (
                    <div className="text-sm text-gray-100">
                      <span className="text-gray-300/70">Score:</span> {potentialEfficiency}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rating Scale Visualization with EPC Button */}
            <div className="flex items-center justify-between">
              <EPCRatingBands currentRating={currentRating} potentialRating={potentialRating} />
              <button
                onClick={() => {
                  const postcode = getPropertyValue('address.simplified_format.postcode', '')
                  const encodedPostcode = encodeURIComponent(postcode)
                  const epcUrl = `https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode?postcode=${encodedPostcode}`
                  window.open(epcUrl, '_blank', 'noopener,noreferrer')
                }}
                className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm shadow-lg"
              >
                View EPC Certificate
              </button>
            </div>
          </div>
        )}

        {/* Environmental Impact */}
        {(currentImpact !== 'N/A' || potentialImpact !== 'N/A') && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Environmental Impact</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentImpact !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Current Impact</span>
                    <span className="text-yellow-400 font-medium">{currentImpact}</span>
                  </div>
                </div>
              )}
              {potentialImpact !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Potential Impact</span>
                    <span className="text-green-400 font-medium">{potentialImpact}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Certificate Details */}
        {getPropertyValue('energy_performance.lmk_key') !== 'N/A' && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Certificate Information</h5>
            <div className="bg-gray-800/20 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Certificate Key</span>
                <span className="text-gray-100 font-mono text-xs bg-gray-700/50 px-2 py-1 rounded">
                  {getPropertyValue('energy_performance.lmk_key')}
                </span>
              </div>
              {getPropertyValue('energy_performance.lodgement_date') !== 'N/A' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Lodgement Date</span>
                  <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.lodgement_date')}</span>
                </div>
              )}
              {getPropertyValue('energy_performance.expiry_date') !== 'N/A' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Expiry Date</span>
                  <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.expiry_date')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        
        {/* Heating & Hot Water Details */}
        {(getPropertyValue('energy_performance.mainheat_description') !== 'N/A' || 
          getPropertyValue('energy_performance.hotwater_description') !== 'N/A' || 
          getPropertyValue('energy_performance.main_fuel') !== 'N/A') && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Heating & Hot Water</h5>
            <div className="space-y-3">
              {getPropertyValue('energy_performance.mainheat_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Main Heating</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.mainheat_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.mainheat_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.mainheat_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.mainheat_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.hotwater_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Hot Water</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.hotwater_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.hot_water_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.hot_water_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.hot_water_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.secondheat_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div>
                    <span className="text-gray-400 text-sm">Secondary Heating</span>
                    <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.secondheat_description')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Building Component Efficiency */}
        {(getPropertyValue('energy_performance.walls_description') !== 'N/A' || 
          getPropertyValue('energy_performance.roof_description') !== 'N/A' || 
          getPropertyValue('energy_performance.windows_description') !== 'N/A' || 
          getPropertyValue('energy_performance.floor_description') !== 'N/A' || 
          getPropertyValue('energy_performance.lighting_description') !== 'N/A') && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Building Components</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getPropertyValue('energy_performance.walls_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Walls</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.walls_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.walls_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.walls_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.walls_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.roof_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Roof</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.roof_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.roof_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.roof_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.roof_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.windows_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Windows</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.windows_description')}</p>
                      {getPropertyValue('energy_performance.glazed_type') !== 'N/A' && (
                        <p className="text-gray-300 text-xs mt-1">{getPropertyValue('energy_performance.glazed_type')}</p>
                      )}
                    </div>
                    {getPropertyValue('energy_performance.windows_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.windows_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.windows_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.floor_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Floor</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.floor_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.floor_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.floor_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.floor_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.lighting_description') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-400 text-sm">Lighting</span>
                      <p className="text-gray-100 font-medium text-sm mt-1">{getPropertyValue('energy_performance.lighting_description')}</p>
                    </div>
                    {getPropertyValue('energy_performance.lighting_energy_eff') !== 'N/A' && (
                      <span className={`text-xs px-2 py-1 rounded border ${getEnergyEfficiencyColor(getPropertyValue('energy_performance.lighting_energy_eff'))}`}>
                        {getPropertyValue('energy_performance.lighting_energy_eff')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Building Specifications */}
        {getPropertyValue('energy_performance.total_floor_area') !== 'N/A' && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-300 mb-3">Building Specifications</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getPropertyValue('energy_performance.total_floor_area') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-100">{getPropertyValue('energy_performance.total_floor_area')}m²</div>
                    <div className="text-xs text-gray-400">Total Floor Area</div>
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.number_habitable_rooms') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-100">{getPropertyValue('energy_performance.number_habitable_rooms')}</div>
                    <div className="text-xs text-gray-400">Habitable Rooms</div>
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.number_heated_rooms') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-100">{getPropertyValue('energy_performance.number_heated_rooms')}</div>
                    <div className="text-xs text-gray-400">Heated Rooms</div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {getPropertyValue('energy_performance.main_fuel') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-100">{getPropertyValue('energy_performance.main_fuel')}</div>
                    <div className="text-xs text-gray-400">Main Fuel</div>
                  </div>
                </div>
              )}
              {getPropertyValue('energy_performance.floor_height') !== 'N/A' && (
                <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-100">{getPropertyValue('energy_performance.floor_height')}m</div>
                    <div className="text-xs text-gray-400">Floor Height</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Plot Boundary Visualization Component
const PlotBoundaryVisualization = ({ coordinates }: { coordinates: any }) => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <div className="text-2xl mb-2">📐</div>
        <div className="text-sm">No boundary data available</div>
      </div>
    )
  }

  // Get the first polygon (outer ring)
  const polygon = coordinates[0]
  if (!polygon || polygon.length < 3) {
    return (
      <div className="text-center text-gray-400">
        <div className="text-2xl mb-2">📐</div>
        <div className="text-sm">Invalid boundary data</div>
      </div>
    )
  }

  // Calculate bounds to normalize coordinates
  const lats = polygon.map((coord: number[]) => coord[1])
  const lngs = polygon.map((coord: number[]) => coord[0])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // Add some padding
  const latPadding = (maxLat - minLat) * 0.1
  const lngPadding = (maxLng - minLng) * 0.1

  // Normalize coordinates to SVG viewBox (0,0,100,100)
  const normalizedCoords = polygon.map((coord: number[]) => {
    const x = ((coord[0] - (minLng - lngPadding)) / ((maxLng + lngPadding) - (minLng - lngPadding))) * 100
    const y = ((coord[1] - (minLat - latPadding)) / ((maxLat + latPadding) - (minLat - latPadding))) * 100
    return [x, y]
  })

  // Create SVG path
  const pathData = normalizedCoords.map((coord: number[], index: number) => 
    `${index === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`
  ).join(' ') + ' Z'

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ maxWidth: '400px', maxHeight: '300px' }}
      >
        {/* Background */}
        <rect width="100" height="100" fill="rgba(55, 65, 81, 0.3)" />
        
        {/* Plot boundary */}
        <path
          d={pathData}
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgba(139, 92, 246, 0.8)"
          strokeWidth="0.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Center point */}
        <circle
          cx="50"
          cy="50"
          r="1"
          fill="rgba(255, 255, 255, 0.8)"
        />
      </svg>
    </div>
  )
}

export default function DashboardV1() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<Section>('property-details')
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [selectedComparablesPanelOpen, setSelectedComparablesPanelOpen] = useState(false)
  const [panelNavigation, setPanelNavigation] = useState<'none' | 'selected' | 'details'>('none')
  const [navigationSource, setNavigationSource] = useState<'main' | 'selected'>('main')
  const [selectedComparablesCount, setSelectedComparablesCount] = useState(0)
  const [selectedComparablesTransactions, setSelectedComparablesTransactions] = useState<any[]>([])
  const [comparablesRefreshTrigger, setComparablesRefreshTrigger] = useState(0)
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [copyConfirmation, setCopyConfirmation] = useState<string | null>(null)
  const [showHowItWorksDialog, setShowHowItWorksDialog] = useState(false)
  const uprn = params.uprn as string

  // Helper functions to safely extract property data
  const getPropertyValue = (path: string, fallback: string = 'N/A') => {
    if (!propertyData?.data?.data?.attributes) return fallback
    const keys = path.split('.')
    let value = propertyData.data.data.attributes
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined || value === null) return fallback
    }
    return value
  }

  const formatArea = (squareMeters: number | string) => {
    const meters = typeof squareMeters === 'string' ? parseFloat(squareMeters) : squareMeters
    if (isNaN(meters)) return 'N/A'
    const squareFeet = Math.round(meters * 10.764)
    return `${meters.toLocaleString()}m² (${squareFeet.toLocaleString()}ft²)`
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyConfirmation(`${label} copied!`)
      // Clear confirmation after 2 seconds
      setTimeout(() => setCopyConfirmation(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      setCopyConfirmation('Copy failed')
      setTimeout(() => setCopyConfirmation(null), 2000)
    }
  }

  // Helper function to get street view embed URL
  const getStreetViewEmbedUrl = (latitude?: number, longitude?: number) => {
    if (!latitude || !longitude) return ''
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    // Use the correct Street View embed URL format
    return `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=0&pitch=0&fov=90`
  }


  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Handle screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsLargeScreen = window.innerWidth >= 1920
      setIsLargeScreen(prevIsLargeScreen => {
        if (newIsLargeScreen !== prevIsLargeScreen) {
          // When changing screen size, close the floating panels
          setRightPanelOpen(false)
          setPanelNavigation('none')
          setNavigationSource('main')
          setSelectedSubsection(null)
          setSelectedTransaction(null)
          return newIsLargeScreen
        }
        return prevIsLargeScreen
      })
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, []) // Empty dependency array - only run once on mount

  // Load section from URL parameters on mount
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section') as Section
    if (sectionFromUrl && sections.some(s => s.id === sectionFromUrl)) {
      setActiveSection(sectionFromUrl)
    }
  }, [searchParams])

  // Fetch property data on mount
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/properties/${uprn}`)
        
        if (!response.ok) {
          throw new Error('Failed to load property data')
        }
        
        const data = await response.json()
        setPropertyData(data)
      } catch (err) {
        console.error('Error fetching property data:', err)
        setError('Failed to load property data')
      } finally {
        setLoading(false)
      }
    }

    if (uprn) {
      fetchPropertyData()
    }
  }, [uprn])

  // Retry function for error state
  const retryFetchPropertyData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/properties/${uprn}`)
      
      if (!response.ok) {
        throw new Error('Failed to load property data')
      }
      
      const data = await response.json()
      setPropertyData(data)
    } catch (err) {
      console.error('Error fetching property data:', err)
      setError('Failed to load property data')
    } finally {
      setLoading(false)
    }
  }

  const hasSubsectionData = (subsectionId: string) => {
    switch(subsectionId) {
      case 'ownership': 
        return getPropertyValue('tenure.tenure_type') !== 'N/A' || 
               getPropertyValue('ownership.company_owned') !== 'N/A' || 
               getPropertyValue('ownership.overseas_owned') !== 'N/A' || 
               getPropertyValue('ownership.social_housing') !== 'N/A' ||
               getPropertyValue('occupancy') !== 'N/A'
      case 'construction': 
        return getPropertyValue('construction_materials.wall_type.value') !== 'N/A' || 
               getPropertyValue('construction_materials.roof_type.value') !== 'N/A' || 
               getPropertyValue('construction_materials.window_type.value') !== 'N/A' || 
               getPropertyValue('construction_materials.floor_type.value') !== 'N/A' || 
               getPropertyValue('listed_buildings_on_plot') !== 'N/A'
      case 'plot': 
        return getPropertyValue('plot.total_plot_area_square_metres') !== 'N/A' || 
               getPropertyValue('outdoor_space.type') !== 'N/A' || 
               getPropertyValue('outdoor_space.area_square_metres') !== 'N/A'
      case 'utilities': 
        return getPropertyValue('utilities.mains_gas.value') !== 'N/A' || 
               getPropertyValue('utilities.mains_fuel_type.value') !== 'N/A' || 
               getPropertyValue('utilities.solar_power.has_solar_power') !== 'N/A' || 
               getPropertyValue('utilities.wind_turbines.has_wind_turbines') !== 'N/A'
      case 'energy': 
        return propertyData?.data?.data?.attributes?.energy_performance != null
      default: 
        return false
    }
  }

  // Future-proofed function to render subsection content - ensures both panels always use the same component
  const renderSubsectionContent = (subsectionId: string) => {
    if (!propertyData) return null

    switch(subsectionId) {
      case 'ownership':
        return <OwnershipDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
      case 'construction':
        return <ConstructionDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
      case 'plot':
        return <PlotDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} formatArea={formatArea} />
      case 'utilities':
        return <UtilitiesDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
      case 'energy':
        return <EPCDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
      default:
        return null
    }
  }

  // Helper function to update URL with section parameter
  const updateSectionInUrl = (section: Section) => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('section', section)
    router.push(currentUrl.pathname + currentUrl.search, { scroll: false })
  }

  const handleSubsectionClick = (subsectionId: string) => {
    if (activeSection === 'property-details' && hasSubsectionData(subsectionId)) {
      setSelectedSubsection(subsectionId)
      setRightPanelOpen(true)
    }
  }

  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction)
    if (panelNavigation === 'selected') {
      // Coming from selected comparables panel, show details on top
      setNavigationSource('selected')
      setPanelNavigation('details')
    } else {
      // Coming from main screen, show details panel
      setNavigationSource('main')
      setPanelNavigation('details')
    }
  }

  const handleCloseComparablesPanel = () => {
    setPanelNavigation('none')
    setSelectedTransaction(null)
  }

  const handleBackToSelectedComparables = () => {
    if (navigationSource === 'selected') {
      // Go back to selected comparables panel
      setPanelNavigation('selected')
      setSelectedTransaction(null)
    } else {
      // Go back to main screen (close all panels)
      setPanelNavigation('none')
      setSelectedTransaction(null)
    }
  }

  const handleOpenSelectedComparables = () => {
    setNavigationSource('main')
    setPanelNavigation('selected')
  }

  const handleRemoveComparable = async (transactionId: string) => {
    // Remove from selected transactions list (UI update)
    setSelectedComparablesTransactions(prev => 
      prev.filter(transaction => transaction.street_group_property_id !== transactionId)
    )
    // Update count
    setSelectedComparablesCount(prev => prev - 1)
    
    // Persist removal to database
    try {
      // Fetch current comparables data
      const response = await fetch(`/api/db/comparables?uprn=${encodeURIComponent(uprn)}`)
      if (!response.ok) {
        console.error('Failed to fetch comparables data:', response.status, response.statusText)
        return
      }
      
      const data = await response.json()
      const currentIds = data.selected_comparable_ids || []
      
      // Remove the transactionId from the list
      const updatedIds = currentIds.filter((id: string) => id !== transactionId)
      
      // Save updated list back to database
      const saveResponse = await fetch('/api/db/comparables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uprn,
          selected_comparable_ids: updatedIds,
          valuation_strategy: data.valuation_strategy || 'average',
          calculated_valuation: data.calculated_valuation || null
        })
      })
      
      if (!saveResponse.ok) {
        console.error('Failed to save comparables data:', saveResponse.status, saveResponse.statusText)
      } else {
        // Trigger refresh of ComparablesAnalysis component
        setComparablesRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error removing comparable from database:', error)
    }
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  // Get property coordinates for map background
  const getMapCenter = () => {
    if (propertyData) {
      const lat = getPropertyValue('location.coordinates.latitude')
      const lng = getPropertyValue('location.coordinates.longitude')
      if (lat && lng) {
        return `${lat},${lng}`
      }
    }
    return '53.4808,-2.2426' // Default to Manchester
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google Maps Static Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{
          backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${getMapCenter()}&zoom=12&size=3840x2160&maptype=roadmap&scale=2&style=feature:all|element:geometry|color:0x2d1b69&style=feature:water|element:geometry|color:0x1a0b3d&style=feature:road|element:geometry.fill|color:0x4c1d95&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:labels.text.stroke|color:0x000000&style=feature:landscape|element:geometry|color:0x1a0b3d&style=feature:poi|element:geometry|color:0x2d1b69&style=feature:transit|element:geometry|color:0x1a0b3d&style=feature:administrative|element:geometry|color:0x4c1d95&style=feature:administrative.country|element:labels.text.fill|color:0xffffff&style=feature:administrative.country|element:labels.text.stroke|color:0x000000&style=feature:administrative.land_parcel|element:labels.text.fill|color:0xffffff&style=feature:administrative.land_parcel|element:labels.text.stroke|color:0x000000&style=feature:landscape.natural|element:geometry|color:0x1a0b3d&style=feature:poi.business|element:geometry|color:0x2d1b69&style=feature:poi.park|element:geometry|color:0x2d1b69&style=feature:poi.park|element:labels.text.fill|color:0xffffff&style=feature:poi.park|element:labels.text.stroke|color:0x000000&style=feature:road.arterial|element:geometry|color:0x4c1d95&style=feature:road.highway|element:geometry|color:0x4c1d95&style=feature:road.highway.controlled_access|element:geometry|color:0x4c1d95&style=feature:road.local|element:labels.text.fill|color:0xffffff&style=feature:road.local|element:labels.text.stroke|color:0x000000&style=feature:transit.line|element:geometry|color:0x1a0b3d&style=feature:transit.station|element:geometry|color:0x2d1b69&style=feature:water|element:labels.text.fill|color:0xffffff&style=feature:water|element:labels.text.stroke|color:0x000000&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY})`,
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* Nebula Core (more pronounced) */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-700/60 via-purple-900/30 to-transparent" />
      
      {/* Swirling Nebula Effect (boosted) */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 22% 32%, rgba(139, 92, 246, 0.45) 0%, transparent 55%),
            radial-gradient(ellipse 70% 45% at 78% 68%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 75% 65% at 52% 18%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
            radial-gradient(ellipse 55% 85% at 12% 78%, rgba(236, 72, 153, 0.22) 0%, transparent 55%)
          `
        }}
      />
      
      {/* Animated Cosmic Dust (slightly brighter) */}
      <div 
        className="absolute inset-0 opacity-40 animate-pulse"
        style={{
          background: `
            radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.1), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent),
            radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.1), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 100px'
        }}
      />
      
      {/* Dark Nebula Clouds */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 0% 0%, rgba(0, 0, 0, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 80% 100% at 100% 100%, rgba(0, 0, 0, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0, 0, 0, 0.4) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Cosmic Glow Effects (increased radius/intensity slightly) */}
      <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-gradient-radial from-purple-500/30 via-purple-600/15 to-transparent animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-[24rem] h-[24rem] bg-gradient-radial from-blue-500/22 via-blue-600/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[22rem] h-[22rem] bg-gradient-radial from-pink-500/18 via-pink-600/8 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Simple Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 min-h-screen">
        {/* Floating Top Menu Bar - Full width above sidebar */}
        <header className="fixed top-0 left-0 right-0 z-[999] p-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl border border-gray-500/30 bg-black/20">
              {/* Left side - Logo and Back button */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push('/search')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors text-gray-300 hover:text-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium">Back to Search</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Appraisor Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xl font-bold text-white">Appraisor</span>
                </div>
              </div>
              
              {/* Right side - Credits and User menu */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm">30 Credits available</span>
                </div>
                
                <WorkingUserMenu user={session.user || { name: 'User', email: 'user@example.com' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Copy Confirmation Toast */}
        {copyConfirmation && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[1001] transition-opacity duration-300">
            <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-green-400/30">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">{copyConfirmation}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="relative z-10 h-screen flex flex-col">
          {/* Scrollable Content Container - starts from top to scroll under header */}
          <div className="main-content-scrollable flex-1 overflow-y-auto px-6 pt-32 pb-6 hide-scrollbar">
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex gap-8 w-full">
                {/* Fixed Sidebar Navigation */}
                <aside 
                  className="fixed w-64 flex-shrink-0 flex-grow-0 z-20" 
                  style={{ width: '256px' }}
                  onWheel={(e) => {
                    // Forward scroll events to the main content area
                    const mainContent = document.querySelector('.main-content-scrollable')
                    if (mainContent) {
                      mainContent.scrollTop += e.deltaY
                    }
                  }}
                >
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Sections</h2>
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            setActiveSection(section.id)
                            updateSectionInUrl(section.id)
                            if (section.id !== 'property-details') {
                              setRightPanelOpen(false)
                              setSelectedSubsection(null)
                            }
                            if (section.id !== 'sold-comparables') {
                              setPanelNavigation('none')
                              setNavigationSource('main')
                              setSelectedTransaction(null)
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all duration-200 border ${
                            activeSection === section.id
                              ? 'bg-purple-500/20 text-purple-100 border-purple-400/30'
                              : 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/10 border-transparent'
                          }`}
                        >
                          <span className="text-lg">{section.icon}</span>
                          <span className="font-medium text-sm">{section.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </aside>

                {/* Spacer for fixed sidebar */}
                <div className="w-64 flex-shrink-0 flex-grow-0" style={{ width: '256px' }}></div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 w-full" style={{ width: 'calc(100% - 256px - 2rem)' }}>
                  <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl shadow-2xl overflow-hidden w-full min-h-[600px]" style={{ width: '100%', minWidth: '600px' }}>
                {loading ? (
                  /* Loading Spinner */
                  <div className="p-8 w-full">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                      <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                    </div>
                    <div className="space-y-8">
                      {/* Property Overview Skeleton */}
                      <div className="space-y-4">
                        <div className="h-8 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
                        <div className="h-6 bg-gray-700/30 rounded w-1/2 animate-pulse"></div>
                        <div className="flex flex-wrap gap-4">
                          <div className="h-8 bg-gray-700/30 rounded w-24 animate-pulse"></div>
                          <div className="h-8 bg-gray-700/30 rounded w-24 animate-pulse"></div>
                          <div className="h-8 bg-gray-700/30 rounded w-24 animate-pulse"></div>
                          <div className="h-8 bg-gray-700/30 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Maps Skeleton */}
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-700/30 rounded w-32 animate-pulse"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="h-64 bg-gray-700/30 rounded-lg animate-pulse"></div>
                          <div className="h-64 bg-gray-700/30 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                      
                      {/* Local Area Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="h-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
                        <div className="h-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
                        <div className="h-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
                        <div className="h-16 bg-gray-700/30 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  /* Error State */
                  <div className="p-8 w-full">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                      <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                    </div>
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-5xl mb-4">🏚️</div>
                      <h2 className="text-xl font-semibold text-gray-100 mb-2">Error Loading Property</h2>
                      <p className="text-gray-400 mb-6">Something went wrong while loading the property data.</p>
                      <button
                        onClick={retryFetchPropertyData}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Section Content */
                  <div className="p-8 w-full">
                    {activeSection === 'property-details' && propertyData ? (
                      /* Property Details Content */
                      <div className="w-full min-h-[500px]" style={{ width: '100%' }}>
                        <div className="flex items-center gap-3 mb-8">
                          <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                          <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                        </div>
                
                <div className="space-y-8">
                  {/* Property Overview Section */}
                  <div className="">
                    {/* Address Section */}
                    <div className="mb-4">
                      <div className="text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-gray-100 text-2xl font-semibold">
                            {getPropertyValue('address.street_group_format.address_lines')}
                          </p>
                          <button
                            onClick={() => copyToClipboard(
                              getPropertyValue('address.street_group_format.address_lines'), 
                              'Address'
                            )}
                            className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                            title="Copy address"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-gray-300 text-lg">
                            {getPropertyValue('address.street_group_format.postcode')}
                          </p>
                          <button
                            onClick={() => copyToClipboard(
                              getPropertyValue('address.street_group_format.postcode'), 
                              'Postcode'
                            )}
                            className="p-1 rounded hover:bg-gray-500/20 transition-colors"
                            title="Copy postcode"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Details Tags */}
                    <div className="flex flex-wrap gap-4 min-h-[60px] w-full">
                      {getPropertyValue('property_type.value') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Type:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('property_type.value')}</span>
                        </div>
                      )}
                      {getPropertyValue('construction_age_band') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Age:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('construction_age_band')}</span>
                        </div>
                      )}
                      {getPropertyValue('tenure.tenure_type') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Tenure:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('tenure.tenure_type')}</span>
                        </div>
                      )}
                      {getPropertyValue('number_of_bedrooms.value') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Beds:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('number_of_bedrooms.value', '0')}</span>
                        </div>
                      )}
                      {getPropertyValue('number_of_bathrooms.value') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Baths:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('number_of_bathrooms.value', '0')}</span>
                        </div>
                      )}
                      {getPropertyValue('internal_area_square_metres') !== 'N/A' && getPropertyValue('internal_area_square_metres') !== '0' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Area:</span>
                          <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('internal_area_square_metres', '0'))}</span>
                        </div>
                      )}
                      {getPropertyValue('council_tax.council_tax_band') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Tax:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('council_tax.council_tax_band', 'N/A')}</span>
                        </div>
                      )}
                      {getPropertyValue('energy_performance.current_energy_rating') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">EPC:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.current_energy_rating', 'N/A')}</span>
                        </div>
                      )}
                      {getPropertyValue('flood_risk.risk_label') !== 'N/A' && (
                        <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-2">
                          <span className="text-gray-400 text-sm">Flood:</span>
                          <span className="text-gray-100 font-medium">{getPropertyValue('flood_risk.risk_label', 'N/A')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Maps & Local Area Section */}
                  <div className="mb-12">
                    {/* Location Title */}
                    <h2 className="text-lg font-medium text-gray-300 mb-6">Location</h2>
                    
                    {/* Maps Section */}
                    <div className="mb-4 min-h-[280px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Google Map */}
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-500/30" style={{ height: '256px' }}>
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(getPropertyValue('address.street_group_format.address_lines') + ', ' + getPropertyValue('address.street_group_format.postcode'))}&zoom=15&maptype=roadmap`}
                            width="100%"
                            height="256"
                            style={{ border: 0, height: '256px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Property Location Map"
                          />
                        </div>
                        
                        {/* Interactive Street View */}
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-500/30" style={{ height: '256px' }}>
                          <iframe
                            src={getStreetViewEmbedUrl(
                              parseFloat(getPropertyValue('location.coordinates.latitude', '0')), 
                              parseFloat(getPropertyValue('location.coordinates.longitude', '0'))
                            )}
                            width="100%"
                            height="256"
                            style={{ border: 0, height: '256px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Interactive Street View"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Local Area Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[80px]">
                      {getPropertyValue('localities.ward') !== 'N/A' && (
                        <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-100">{getPropertyValue('localities.ward')}</div>
                            <div className="text-xs text-gray-400">Ward</div>
                          </div>
                        </div>
                      )}
                      {getPropertyValue('localities.local_authority') !== 'N/A' && (
                        <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-100">{getPropertyValue('localities.local_authority')}</div>
                            <div className="text-xs text-gray-400">Local Authority</div>
                          </div>
                        </div>
                      )}
                      {getPropertyValue('localities.county') !== 'N/A' && (
                        <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-100">{getPropertyValue('localities.county')}</div>
                            <div className="text-xs text-gray-400">County</div>
                          </div>
                        </div>
                      )}
                      {getPropertyValue('localities.police_force') !== 'N/A' && (
                        <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-600/20">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-100">{getPropertyValue('localities.police_force')}</div>
                            <div className="text-xs text-gray-400">Police Force</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                

                  {/* Property Details Subsections - Plot, Utilities, Energy */}
                  <div className="mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subsections[activeSection]
                      .filter(subsection => ['energy', 'plot', 'utilities'].includes(subsection.id))
                      .sort((a, b) => {
                        // First sort by predefined order: energy, plot, utilities
                        const order = ['energy', 'plot', 'utilities']
                        const aIndex = order.indexOf(a.id)
                        const bIndex = order.indexOf(b.id)
                        if (aIndex !== bIndex) return aIndex - bIndex
                        
                        // Then sort by data availability
                        const aHasData = hasSubsectionData(a.id)
                        const bHasData = hasSubsectionData(b.id)
                        if (aHasData && !bHasData) return -1
                        if (!aHasData && bHasData) return 1
                        return 0
                      })
                      .map((subsection) => {
                        const hasData = hasSubsectionData(subsection.id)
                        return (
                          <button
                            key={subsection.id}
                            onClick={() => handleSubsectionClick(subsection.id)}
                            disabled={!hasData}
                            title={!hasData ? 'Not available' : undefined}
                            className={`backdrop-blur-xl border rounded-xl p-4 text-left transition-all duration-200 group shadow-lg ${
                              hasData 
                                ? 'bg-black/20 border-gray-500/30 hover:bg-gray-500/20 cursor-pointer' 
                                : 'bg-black/20 border-gray-500/30 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl">{subsection.icon}</span>
                              <h3 className={`font-semibold transition-colors ${
                                hasData 
                                  ? 'text-gray-100 group-hover:text-gray-50' 
                                  : 'text-gray-500'
                              }`}>
                                {subsection.label}
                              </h3>
                            </div>
                            <p className={`text-sm ${
                              hasData 
                                ? 'text-gray-400' 
                                : 'text-gray-600'
                            }`}>
                              {subsection.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ownership & Construction Details - Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Ownership & Occupancy Section */}
                    {hasSubsectionData('ownership') && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-300 mb-4">Ownership & Occupancy</h2>
                        <OwnershipDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
                      </div>
                    )}

                    {/* Construction Details Section */}
                    {hasSubsectionData('construction') && (
                      <div>
                        <h2 className="text-lg font-medium text-gray-300 mb-4">Construction Details</h2>
                        <ConstructionDataDisplay propertyData={propertyData} getPropertyValue={getPropertyValue} />
                      </div>
                    )}
                  </div>
                        </div>
                      </div>
                    ) : (
                      /* Other Sections */
                      <div className="w-full">
                        {activeSection === 'investment-calculator' ? (
                          /* Investment Calculator Section */
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                                <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                              </div>
                              <button
                                onClick={async () => {
                                  if (confirm('Are you sure you want to reset all calculator data to defaults? This action cannot be undone.')) {
                                    try {
                                      // Reset calculator data to defaults in database
                                      const response = await fetch('/api/calculator/reset', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ uprn }),
                                      })
                                      
                                      if (response.ok) {
                                        // Reload the page to reset the calculator
                                        window.location.reload()
                                      } else {
                                        alert('Failed to reset calculator data. Please try again.')
                                      }
                                    } catch (error) {
                                      console.error('Error resetting calculator data:', error)
                                      alert('Failed to reset calculator data. Please try again.')
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all duration-200 text-sm font-medium"
                              >
                                Reset
                              </button>
                            </div>
                            <InvestmentCalculator uprn={uprn} />
                          </div>
                        ) : activeSection === 'sold-comparables' ? (
                          /* Sold Comparables Section */
                          <div className="w-full">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                              <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                              <button
                                onClick={() => setShowHowItWorksDialog(true)}
                                className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors ml-4"
                              >
                                How does it work?
                              </button>
                            </div>
                            {propertyData ? (
                              <ComparablesAnalysis
                                uprn={uprn}
                                nearbyTransactions={getPropertyValue('nearby_completed_transactions') || []}
                                subjectPropertySqm={parseFloat(getPropertyValue('internal_area_square_metres', '0'))}
                                subjectPropertyStreet={getPropertyValue('address.simplified_format.street', '')}
                                subjectPropertyData={{
                                  address: getPropertyValue('address.street_group_format.address_lines'),
                                  postcode: getPropertyValue('address.street_group_format.postcode'),
                                  propertyType: getPropertyValue('property_type.value'),
                                  bedrooms: parseInt(getPropertyValue('number_of_bedrooms.value', '0')),
                                  bathrooms: parseInt(getPropertyValue('number_of_bathrooms.value', '0')),
                                  internalArea: parseFloat(getPropertyValue('internal_area_square_metres', '0'))
                                }}
                                onTransactionSelect={handleTransactionSelect}
                                onSelectedCountChange={setSelectedComparablesCount}
                                onSelectedPanelOpen={handleOpenSelectedComparables}
                                onSelectedTransactionsChange={setSelectedComparablesTransactions}
                                onRemoveComparable={handleRemoveComparable}
                                selectedPanelOpen={selectedComparablesPanelOpen}
                                refreshTrigger={comparablesRefreshTrigger}
                              />
                            ) : (
                              <div className="text-center py-8 text-gray-400">
                                Loading property data...
                              </div>
                            )}
                          </div>
                        ) : activeSection === 'market-analysis' ? (
                          /* Market Analysis Section */
                          <div className="w-full">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                              <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                            </div>
                            <MarketAnalysis marketStatistics={getPropertyValue('market_statistics')} />
                          </div>
                        ) : activeSection === 'nearby-listings' ? (
                          /* Nearby Listings Section */
                          <div className="w-full">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                              <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                            </div>
                            {propertyData ? (
                              <NearbyListings 
                                listings={getPropertyValue('nearby_listings') || { sale_listings: [], rental_listings: [] }}
                                mainPropertyLocation={getPropertyValue('location')?.coordinates}
                                mainPropertyPostcode={getPropertyValue('address.street_group_format.postcode')}
                              />
                            ) : (
                              <div className="text-center py-12">
                                <div className="text-4xl mb-4 opacity-50">📍</div>
                                <p className="text-gray-400">Loading nearby listings...</p>
                              </div>
                            )}
                          </div>
                        ) : activeSection === 'ai-refurbishment' ? (
                          /* AI Refurbishment Estimator Section */
                          <div className="w-full">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                              <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                            </div>
                            <RefurbishmentEstimator 
                              uprn={uprn}
                              onDataUpdate={() => {
                                // Trigger a refresh of calculator data if needed
                                // This could be expanded to refresh other components
                              }}
                            />
                          </div>
                        ) : (
                          /* Other Sections - Empty Layout */
                          <div className="w-full">
                            <div className="flex items-center gap-3 mb-6">
                              <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                              <h1 className="text-2xl font-bold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h1>
                            </div>
                            <div className="text-center py-12">
                              <div className="text-4xl mb-4 opacity-50">📊</div>
                              <p className="text-gray-400">This section is ready for implementation...</p>
                              <p className="text-sm text-gray-500 mt-2">Start building your content here</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Generic Right Panel for Property Details */}
        <GenericPanel
            isOpen={activeSection === 'property-details' && rightPanelOpen}
            onClose={() => {
              setRightPanelOpen(false)
              setSelectedSubsection(null)
            }}
            title={subsections[activeSection as keyof typeof subsections]?.find((s: any) => s.id === selectedSubsection)?.label || 'Property Details'}
            isLargeScreen={isLargeScreen}
          >
            <div className="space-y-6">
              {/* Property Details Subsections */}
              {activeSection === 'property-details' && selectedSubsection && propertyData && (
                renderSubsectionContent(selectedSubsection)
              )}
              {/* No subsection selected */}
              {activeSection === 'property-details' && !selectedSubsection && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6 opacity-60">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-3">Ready to Explore?</h3>
                  <p className="text-gray-400 mb-4 max-w-md mx-auto">
                    Click on a subsection from the main page to dive into the fascinating world of this building!
                  </p>
                </div>
              )}
            </div>
        </GenericPanel>

        {/* Selected Comparables Panel */}
        <GenericPanel
          isOpen={activeSection === 'sold-comparables' && panelNavigation === 'selected'}
          onClose={() => {
            setPanelNavigation('none')
            // Refresh comparables data when closing panel
            setComparablesRefreshTrigger(prev => prev + 1)
          }}
          title={`Selected Comparables (${selectedComparablesCount})`}
          isLargeScreen={isLargeScreen}
          zIndex={1000}
        >
          <div className="space-y-4">
            {selectedComparablesTransactions.length > 0 ? (
              selectedComparablesTransactions.map((transaction) => (
                <div key={transaction.street_group_property_id} className="relative">
                  <div 
                    onClick={() => handleTransactionSelect(transaction)}
                    className="bg-black/20 border border-gray-500/30 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:bg-gray-700/40 hover:border-gray-500/50"
                  >
                    <div className="flex gap-4">
                      {/* Street View Image */}
                      <div className="flex-shrink-0 relative">
                        <StreetViewImage
                          address={transaction.address?.street_group_format?.address_lines || ''}
                          postcode={transaction.address?.street_group_format?.postcode || ''}
                          latitude={transaction.location?.coordinates?.latitude}
                          longitude={transaction.location?.coordinates?.longitude}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Property Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-100 mb-1">
                              {transaction.address?.street_group_format?.address_lines || 'Address not available'}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {transaction.address?.street_group_format?.postcode || 'Postcode not available'}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-white">
                              {new Intl.NumberFormat('en-GB', {
                                style: 'currency',
                                currency: 'GBP',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(transaction.price)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <div className="flex gap-4">
                            <span>{transaction.number_of_bedrooms || 0} bed</span>
                            <span>{transaction.number_of_bathrooms || 0} bath</span>
                            <span>{transaction.property_type || 'Unknown'}</span>
                            <span>{transaction.internal_area_square_metres || 0}m²</span>
                          </div>
                          <div className="text-right">
                            <div>{new Date(transaction.transaction_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}</div>
                            <div>{transaction.distance_in_metres < 100 ? `${transaction.distance_in_metres}m` : `${(transaction.distance_in_metres / 1000).toFixed(1)}km`}</div>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button - Right Side */}
                      <div className="flex-shrink-0 flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveComparable(transaction.street_group_property_id)
                          }}
                          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm bg-red-500/80 text-white hover:bg-red-400/80"
                          title="Remove from comparables"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-4 opacity-50">🏘️</div>
                <p>No comparables selected</p>
                <p className="text-sm text-gray-500 mt-2">Select transactions from the main list to use as comparables</p>
              </div>
            )}
          </div>
        </GenericPanel>

        {/* Transaction Details Panel */}
        <GenericPanel
          isOpen={activeSection === 'sold-comparables' && panelNavigation === 'details' && !!selectedTransaction}
          onClose={handleCloseComparablesPanel}
          title="Transaction Details"
          isLargeScreen={isLargeScreen}
          showBackButton={panelNavigation === 'details' && navigationSource === 'selected'}
          onBack={handleBackToSelectedComparables}
          zIndex={1001}
        >
          {selectedTransaction && renderTransactionDetails(selectedTransaction)}
        </GenericPanel>

        {/* How It Works Dialog */}
        {showHowItWorksDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHowItWorksDialog(false)}
            />
            <div className="relative bg-black/90 border border-gray-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-100">Property Valuation</h2>
                <button
                  onClick={() => setShowHowItWorksDialog(false)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">1.</span>
                  <p>Browse the list of nearby transactions</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">2.</span>
                  <p>Identify the transactions that are similar to your property</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">3.</span>
                  <p>Add them to the valuation by ticking the box next to each transaction</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">4.</span>
                  <p>Choose between Simple Average or Price per Square Metre calculation methods</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

