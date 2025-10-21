'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Section = 'property-details' | 'market-analysis' | 'sold-comparables' | 'investment-calculator' | 'ai-refurbishment' | 'risk-assessment'

const sections = [
  { id: 'property-details' as Section, label: 'Property Details', icon: '🏠' },
  { id: 'risk-assessment' as Section, label: 'Risk Assessment', icon: '⚠️' },
  { id: 'market-analysis' as Section, label: 'Market Analysis', icon: '📊' },
  { id: 'sold-comparables' as Section, label: 'Sold Comparables', icon: '🏘️' },
  { id: 'investment-calculator' as Section, label: 'Investment Calculator', icon: '💰' },
  { id: 'ai-refurbishment' as Section, label: 'AI Refurbishment Estimator', icon: '🤖' },
]

const subsections = {
  'property-details': [
    { id: 'ownership', label: 'Ownership & Occupancy', icon: '🏠', description: 'Tenure type, ownership status, occupancy, and legal information' },
    { id: 'construction', label: 'Construction Details', icon: '🏗️', description: 'Building materials, construction age, and structural details' },
    { id: 'plot', label: 'Plot & Outdoor Space', icon: '🌳', description: 'Land area, garden space, and outdoor amenities' },
    { id: 'utilities', label: 'Utilities & Services', icon: '⚡', description: 'Water, drainage, heating, and utility connections' },
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
            {getPropertyValue('occupancy') !== 'N/A' ? getPropertyValue('occupancy') : 'Unspecified'}
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
  const params = useParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('property-details')
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
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


  // Handle screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsLargeScreen = window.innerWidth >= 1920
      setIsLargeScreen(prevIsLargeScreen => {
        if (newIsLargeScreen !== prevIsLargeScreen) {
          // When expanding to large screen, close the floating panel
          if (newIsLargeScreen) {
            setRightPanelOpen(false)
          }
          // When shrinking to small screen, deselect subsection and hide panel
          if (!newIsLargeScreen) {
            // Batch the state updates to prevent race conditions
            setActiveSubsection(null)
            setRightPanelOpen(false)
          }
          return newIsLargeScreen
        }
        return prevIsLargeScreen
      })
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, []) // Empty dependency array - only run once on mount

  // Fetch property data on mount
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/db/properties?uprn=${uprn}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch property data: ${response.statusText}`)
        }
        
        const data = await response.json()
        setPropertyData(data)
      } catch (err) {
        console.error('Error fetching property data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load property data')
      } finally {
        setLoading(false)
      }
    }

    if (uprn) {
      fetchPropertyData()
    }
  }, [uprn])

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

  const handleSubsectionClick = (subsectionId: string) => {
    if (activeSection === 'property-details' && hasSubsectionData(subsectionId)) {
    setActiveSubsection(subsectionId)
      // Only open mobile overlay on small screens
      if (!isLargeScreen) {
    setRightPanelOpen(true)
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-purple-900" />
      
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
      
      {/* Deep Space Overlay (slightly less dark to let nebula show through) */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
      
      <div className="relative z-10 flex h-screen">
        {/* Floating Dark Glass Sidebar */}
        <aside className="w-64 bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col rounded-2xl shadow-2xl ml-6 my-6">
          {/* Back to Search Button - First Item */}
          <div className="p-3">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-500/15 hover:bg-gray-500/25 transition-colors text-gray-400 hover:text-gray-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
                <span className="text-xs font-medium">Back to Search</span>
            </button>
          </div>

          {/* Logo Area */}
          <div className="p-4 border-b border-gray-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">E</span>
                  </div>
                  <span className="font-semibold text-gray-100">Estimo</span>
            </div>
          </div>

          {/* Section Header */}
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SECTIONS</span>
            </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id)
                      if (section.id !== 'property-details') {
                        setRightPanelOpen(false)
                        setActiveSubsection(null)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-all duration-300 border ${
                      activeSection === section.id
                        ? 'bg-gray-500/20 text-gray-100 shadow-lg border-gray-400/50'
                        : 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/10 border-transparent hover:border-gray-500/30'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                      <span className="font-medium text-sm">{section.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto flex">
          {/* Left Content Area */}
          <div className="flex-1">
          {/* Dark Glass Header */}
          <header className="sticky top-0 z-40 p-6">
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl px-6 py-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-100">
                      Property Dashboard
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm shadow-lg">
                    Export
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6">
            {loading ? (
              /* Loading Spinner */
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 shadow-2xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    <p className="text-gray-300">Loading property data...</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              /* Error State */
              <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-100 mb-1">Error Loading Property</h2>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Section Content */
              <div className="space-y-6">
                {activeSection === 'property-details' && propertyData ? (
              /* Property Details Content */
              <div className="space-y-6">
                {/* LOCATION Section */}
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                  <h2 className="text-lg font-medium text-gray-400 mb-6 uppercase tracking-wide">
                    LOCATION
                  </h2>
                  
                  {/* Address Section */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-300 mb-3">Address</h3>
                    <div className="text-left">
                      <p className="text-gray-100 text-2xl font-semibold mb-1">
                        {getPropertyValue('address.street_group_format.address_lines')}
                      </p>
                      <p className="text-gray-300 text-lg">
                        {getPropertyValue('address.street_group_format.postcode')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1">
                      <h3 className="text-lg font-medium text-gray-200 mb-3">Local Area</h3>
                      <div className="space-y-2">
                        {getPropertyValue('localities.ward') !== 'N/A' && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">Ward:</span> {getPropertyValue('localities.ward')}
                          </p>
                        )}
                        {getPropertyValue('localities.local_authority') !== 'N/A' && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">Local Authority:</span> {getPropertyValue('localities.local_authority')}
                          </p>
                        )}
                        {getPropertyValue('localities.county') !== 'N/A' && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">County:</span> {getPropertyValue('localities.county')}
                          </p>
                        )}
                        {getPropertyValue('localities.police_force') !== 'N/A' && (
                          <p className="text-gray-300">
                            <span className="text-gray-400">Police Force:</span> {getPropertyValue('localities.police_force')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-medium text-gray-200 mb-3">Maps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Google Map */}
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-500/30">
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${getPropertyValue('location.coordinates.latitude')},${getPropertyValue('location.coordinates.longitude')}&zoom=15&maptype=roadmap`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Property Location Map"
                          />
                        </div>
                        
                        {/* Street View with Overlay Button */}
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-500/30 group">
                          <img
                            src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${getPropertyValue('location.coordinates.latitude')},${getPropertyValue('location.coordinates.longitude')}&fov=80&pitch=0&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Street View"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden absolute inset-0 bg-gray-700 flex items-center justify-center">
                            <div className="text-center text-gray-400">
                              <div className="text-2xl mb-1">🏠</div>
                              <div className="text-sm">Street View</div>
                            </div>
                          </div>
                          {/* Overlay Button */}
                          <div className="absolute top-3 left-3">
                            <a
                              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${getPropertyValue('location.coordinates.latitude')},${getPropertyValue('location.coordinates.longitude')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-sm border border-white/20"
                            >
                              Open in Maps
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                  <h2 className="text-lg font-medium text-gray-400 mb-6 uppercase tracking-wide">
                    DETAILS
                  </h2>
                  
                  {/* Property Details in Single Line */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-4">
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

                  {/* Property Details Subsections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subsections[activeSection]
                      .sort((a, b) => {
                        const aHasData = hasSubsectionData(a.id)
                        const bHasData = hasSubsectionData(b.id)
                        // Sort so that subsections with data come first
                        if (aHasData && !bHasData) return -1
                        if (!aHasData && bHasData) return 1
                        return 0
                      })
                      .map((subsection) => {
                        const hasData = hasSubsectionData(subsection.id)
                        const isSelected = activeSubsection === subsection.id
                        return (
                          <button
                            key={subsection.id}
                            onClick={() => handleSubsectionClick(subsection.id)}
                            disabled={!hasData}
                            title={!hasData ? 'Not available' : undefined}
                            className={`backdrop-blur-xl border rounded-xl p-4 text-left transition-all duration-200 group shadow-lg ${
                              isSelected
                                ? 'bg-purple-500/20 border-purple-400/50 shadow-purple-500/20'
                                : hasData 
                                  ? 'bg-black/20 border-gray-500/30 hover:bg-gray-500/20 cursor-pointer' 
                                  : 'bg-black/20 border-gray-500/30 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl">{subsection.icon}</span>
                              <h3 className={`font-semibold transition-colors ${
                                isSelected
                                  ? 'text-purple-200'
                                  : hasData 
                                    ? 'text-gray-100 group-hover:text-gray-50' 
                                    : 'text-gray-500'
                              }`}>
                                {subsection.label}
                              </h3>
                            </div>
                            <p className={`text-sm ${
                              isSelected
                                ? 'text-purple-300'
                                : hasData 
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
              </div>
            ) : (
                  /* Other Sections - Empty Layout */
              <div className="space-y-6">
                {/* Section Header */}
                <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{sections.find(s => s.id === activeSection)?.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-100">{sections.find(s => s.id === activeSection)?.label}</h3>
                  </div>
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                        <p className="text-gray-400">This section is ready for implementation...</p>
                        <p className="text-sm text-gray-500 mt-2">Start building your content here</p>
                  </div>
                </div>
                  </div>
                )}
              </div>
            )}

          </div>
          </div>
          
          {/* Right Panel - Always visible on large screens, overlay on small screens */}
          {activeSection === 'property-details' && (
            <>
              {/* Desktop Right Panel - Always visible on large screens */}
              <div className={`w-[720px] bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col shadow-2xl rounded-2xl mr-6 mt-6 mb-6 h-[calc(100vh-3rem)] ${isLargeScreen ? 'block' : 'hidden'}`}>
                <div className="p-6 border-b border-gray-500/30 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-xl font-semibold text-fg-primary">
                    {subsections[activeSection]?.find(s => s.id === activeSubsection)?.label}
                        </h3>
                      </div>
                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                  <div className="space-y-6">
                    {/* Property Details Subsections */}
                    {activeSection === 'property-details' && activeSubsection && propertyData && (
                      renderSubsectionContent(activeSubsection)
                    )}
                    {/* No subsection selected */}
                    {activeSection === 'property-details' && !activeSubsection && (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-6 opacity-60">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3">Ready to Explore?</h3>
                        <p className="text-gray-400 mb-4 max-w-md mx-auto">
                          Click on a subsection from the main page to dive into the fascinating world of this building!
                        </p>
              </div>
            )}
          </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Mobile Right Panel Overlay - Only for small screens */}
        {rightPanelOpen && activeSection === 'property-details' && (
          <div className={`fixed inset-0 z-50 flex justify-end items-start animate-[fadeIn_0.15s_ease-out] ${isLargeScreen ? 'hidden' : 'block'}`}>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
              onClick={() => {
                setRightPanelOpen(false)
                setActiveSubsection(null)
              }}
            />
            
            {/* Right Panel (Dark Glass) */}
            <div className="relative w-[720px] bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col shadow-2xl rounded-2xl mr-6 mt-6 mb-6 animate-[slideInRight_0.3s_cubic-bezier(0.4,0,0.2,1)] h-[calc(100vh-3rem)]">
              <div className="p-6 border-b border-gray-500/30 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl font-semibold text-fg-primary">
                  {subsections[activeSection]?.find(s => s.id === activeSubsection)?.label}
                </h3>
                <button
                  onClick={() => {
                    setRightPanelOpen(false)
                    setActiveSubsection(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                >
                  <span className="text-fg-muted hover:text-fg-primary text-xl">✕</span>
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto min-h-0">
                <div className="space-y-6">
                  {/* Property Details Subsections */}
                  {activeSection === 'property-details' && activeSubsection && propertyData && (
                    renderSubsectionContent(activeSubsection)
                  )}

                  {/* No subsection selected */}
                  {activeSection === 'property-details' && !activeSubsection && (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-6 opacity-60">🔍</div>
                      <h3 className="text-xl font-semibold text-gray-200 mb-3">Ready to Explore?</h3>
                      <p className="text-gray-400 mb-4 max-w-md mx-auto">
                        Click on a subsection from the main page to dive into the fascinating world of this building!
                      </p>
                    </div>
                  )}

                  {/* Default content for property details subsections not implemented */}
                  {activeSection === 'property-details' && activeSubsection && !['ownership', 'construction', 'plot', 'utilities', 'energy'].includes(activeSubsection) && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-3 text-lg">Details</h4>
                      <div className="text-center py-8">
                        <div className="text-3xl mb-3 opacity-50">📋</div>
                        <p className="text-gray-400">No data available for this section</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
