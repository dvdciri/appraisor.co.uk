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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        return getPropertyValue('construction_materials.walls') !== 'N/A' || 
               getPropertyValue('construction_materials.roof') !== 'N/A' || 
               getPropertyValue('construction_materials.windows') !== 'N/A' || 
               getPropertyValue('listed_buildings_on_plot') !== 'N/A'
      case 'plot': 
        return getPropertyValue('plot.total_plot_area_square_metres') !== 'N/A' || 
               getPropertyValue('outdoor_space.type') !== 'N/A' || 
               getPropertyValue('outdoor_space.area_square_metres') !== 'N/A'
      case 'utilities': 
        return getPropertyValue('utilities.water') !== 'N/A' || 
               getPropertyValue('utilities.drainage') !== 'N/A' || 
               getPropertyValue('utilities.heating') !== 'N/A'
      case 'energy': 
        return getPropertyValue('energy_performance.current_energy_rating') !== 'N/A' || 
               getPropertyValue('energy_performance.potential_energy_rating') !== 'N/A' ||
               getPropertyValue('energy_performance.energy_efficiency.current_rating') !== 'N/A'
      default: 
        return false
    }
  }

  const handleSubsectionClick = (subsectionId: string) => {
    if (activeSection === 'property-details' && hasSubsectionData(subsectionId)) {
      setActiveSubsection(subsectionId)
      setRightPanelOpen(true)
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
        <aside className={`${sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'} bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col transition-all duration-300 rounded-2xl shadow-2xl ml-6 my-6`}>
          {/* Back to Search Button - First Item */}
          <div className="p-3">
            <button
              onClick={() => router.push('/')}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-gray-500/15 hover:bg-gray-500/25 transition-colors text-gray-400 hover:text-gray-200 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Back to Search' : undefined}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {!sidebarCollapsed && (
                <span className="text-xs font-medium">Back to Search</span>
              )}
            </button>
          </div>

          {/* Logo Area */}
          <div className="p-4 border-b border-gray-500/30">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">E</span>
                  </div>
                  <span className="font-semibold text-gray-100">Estimo</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <span className="text-sm text-gray-300">
                  {sidebarCollapsed ? '»' : '«'}
                </span>
              </button>
            </div>
          </div>

          {/* Section Header */}
          {!sidebarCollapsed && (
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SECTIONS</span>
            </div>
          )}

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
                      }
                    }}
                    className={`w-full flex items-center px-4 py-2 rounded-xl text-left transition-all duration-200 ${
                      sidebarCollapsed 
                        ? 'justify-center' 
                        : 'gap-3'
                    } ${
                      activeSection === section.id
                        ? 'bg-gray-500/25 text-gray-100 shadow-xl border border-gray-400/40'
                        : 'text-gray-300 hover:text-gray-100 hover:bg-gray-500/15'
                    }`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <span className="text-lg">{section.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">{section.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
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
                    {/* Combined Address and Property Details */}
                    <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                      {/* Address Section */}
                      <div className="mb-6">
                        <h2 className="text-lg font-medium text-gray-400 mb-3 uppercase tracking-wide">
                          FULL ADDRESS
                        </h2>
                        <div className="text-left">
                          <p className="text-gray-100 text-2xl font-semibold mb-1">
                            {getPropertyValue('address.street_group_format.address_lines')}
                          </p>
                          <p className="text-gray-300 text-lg">
                            {getPropertyValue('address.street_group_format.postcode')}
                          </p>
                        </div>
                      </div>

                      {/* Property Details in Single Line */}
                      <div className="border-t border-gray-500/30 pt-6">
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
                    </div>

                    {/* Location Section */}
                    {getPropertyValue('location.coordinates.latitude') !== 'N/A' && (
                      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-lg font-medium text-gray-400 mb-6 uppercase tracking-wide">
                          LOCATION
                        </h2>
                        
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
                                  src={`https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${getPropertyValue('location.coordinates.latitude')},${getPropertyValue('location.coordinates.longitude')}&fov=90&heading=0&pitch=0&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
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
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <a
                                    href={`https://www.google.com/maps?q=${getPropertyValue('location.coordinates.latitude')},${getPropertyValue('location.coordinates.longitude')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm shadow-lg"
                                  >
                                    <span>🗺️</span>
                                    Open in Maps
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Property Details Subsections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                        return (
                          <button
                            key={subsection.id}
                            onClick={() => handleSubsectionClick(subsection.id)}
                            disabled={!hasData}
                            title={!hasData ? 'Not available' : undefined}
                            className={`bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 text-left transition-all duration-200 group shadow-lg ${
                              hasData 
                                ? 'hover:bg-gray-500/20 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
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
                              hasData ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {subsection.description}
                            </p>
                          </button>
                        )
                      })}
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
        </main>

        {/* Right Panel Overlay - Only for Property Details */}
        {rightPanelOpen && activeSection === 'property-details' && (
          <div className="fixed inset-0 z-50 flex justify-end items-start animate-[fadeIn_0.15s_ease-out]">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
              onClick={() => setRightPanelOpen(false)}
            />
            
            {/* Right Panel (Dark Glass) */}
            <div className="relative w-[720px] bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col shadow-2xl rounded-2xl mr-6 mt-6 mb-6 animate-[slideInRight_0.3s_cubic-bezier(0.4,0,0.2,1)] h-[calc(100vh-3rem)]">
              <div className="p-6 border-b border-gray-500/30 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl font-semibold text-fg-primary">
                  {subsections[activeSection]?.find(s => s.id === activeSubsection)?.label}
                </h3>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                >
                  <span className="text-fg-muted hover:text-fg-primary text-xl">✕</span>
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto min-h-0">
                <div className="space-y-6">
                  {/* Property Details Subsections */}
                  {activeSection === 'property-details' && activeSubsection === 'ownership' && propertyData && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Ownership & Occupancy Details</h4>
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
                  )}

                  {activeSection === 'property-details' && activeSubsection === 'construction' && propertyData && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Construction Details</h4>
                      <div className="space-y-3">
                        {getPropertyValue('construction_materials.walls') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                            <span className="text-gray-400">Wall Material</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.walls')}</span>
                          </div>
                        )}
                        {getPropertyValue('construction_materials.roof') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                            <span className="text-gray-400">Roof Material</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.roof')}</span>
                          </div>
                        )}
                        {getPropertyValue('construction_materials.windows') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                            <span className="text-gray-400">Window Material</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('construction_materials.windows')}</span>
                          </div>
                        )}
                        {getPropertyValue('listed_buildings_on_plot') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-400">Listed Buildings</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('listed_buildings_on_plot')}</span>
                          </div>
                        )}
                        {getPropertyValue('construction_materials.walls') === 'N/A' && 
                         getPropertyValue('construction_materials.roof') === 'N/A' && 
                         getPropertyValue('construction_materials.windows') === 'N/A' && 
                         getPropertyValue('listed_buildings_on_plot') === 'N/A' && (
                          <div className="text-center py-8">
                            <div className="text-3xl mb-3 opacity-50">🏗️</div>
                            <p className="text-gray-400">No construction data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === 'property-details' && activeSubsection === 'plot' && propertyData && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Plot & Outdoor Space</h4>
                      <div className="space-y-6">
                        {/* Plot Boundary Visualization */}
                        {getPropertyValue('plot.polygons.0.epsg_4326_polygon.coordinates') !== 'N/A' && (
                          <div className="mb-6">
                            <h5 className="text-lg font-medium text-gray-200 mb-3">Plot Boundary</h5>
                            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-500/30 bg-gray-800/50 flex items-center justify-center">
                              <PlotBoundaryVisualization 
                                coordinates={getPropertyValue('plot.polygons.0.epsg_4326_polygon.coordinates')}
                              />
                              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                Plot Boundary
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Plot Details */}
                        <div className="space-y-3">
                          <h5 className="text-lg font-medium text-gray-200 mb-3">Plot Details</h5>
                          {getPropertyValue('plot.total_plot_area_square_metres') !== 'N/A' && getPropertyValue('plot.total_plot_area_square_metres') !== '0' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Total Plot Area</span>
                              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('plot.total_plot_area_square_metres', '0'))}</span>
                            </div>
                          )}
                          {getPropertyValue('plot.polygons.0.boundary_area_square_metres') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Boundary Area</span>
                              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('plot.polygons.0.boundary_area_square_metres', '0'))}</span>
                            </div>
                          )}
                          {getPropertyValue('plot.polygons.0.distance_from_property') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-400">Distance from Property</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('plot.polygons.0.distance_from_property')}m</span>
                            </div>
                          )}
                        </div>

                        {/* Outdoor Space Details */}
                        <div className="space-y-3">
                          <h5 className="text-lg font-medium text-gray-200 mb-3">Outdoor Space</h5>
                          {getPropertyValue('outdoor_space.outdoor_space_area_square_metres') !== 'N/A' && getPropertyValue('outdoor_space.outdoor_space_area_square_metres') !== '0' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Outdoor Space Area</span>
                              <span className="text-gray-100 font-medium">{formatArea(getPropertyValue('outdoor_space.outdoor_space_area_square_metres', '0'))}</span>
                            </div>
                          )}
                          {getPropertyValue('outdoor_space.garden_direction') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Garden Direction</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('outdoor_space.garden_direction')}</span>
                            </div>
                          )}
                          {getPropertyValue('outdoor_space.garden_primary_orientation') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-400">Garden Orientation</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('outdoor_space.garden_primary_orientation')}</span>
                            </div>
                          )}
                        </div>

                        {/* No data fallback */}
                        {getPropertyValue('plot.total_plot_area_square_metres') === 'N/A' && 
                         getPropertyValue('outdoor_space.outdoor_space_area_square_metres') === 'N/A' && (
                          <div className="text-center py-8">
                            <div className="text-3xl mb-3 opacity-50">🌳</div>
                            <p className="text-gray-400">No plot data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === 'property-details' && activeSubsection === 'utilities' && propertyData && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Utilities & Services</h4>
                      <div className="space-y-3">
                        {getPropertyValue('utilities.water') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                            <span className="text-gray-400">Water</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.water')}</span>
                          </div>
                        )}
                        {getPropertyValue('utilities.drainage') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                            <span className="text-gray-400">Drainage</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.drainage')}</span>
                          </div>
                        )}
                        {getPropertyValue('utilities.heating') !== 'N/A' && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-400">Heating</span>
                            <span className="text-gray-100 font-medium">{getPropertyValue('utilities.heating')}</span>
                          </div>
                        )}
                        {getPropertyValue('utilities.water') === 'N/A' && 
                         getPropertyValue('utilities.drainage') === 'N/A' && 
                         getPropertyValue('utilities.heating') === 'N/A' && (
                          <div className="text-center py-8">
                            <div className="text-3xl mb-3 opacity-50">⚡</div>
                            <p className="text-gray-400">No utilities data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === 'property-details' && activeSubsection === 'energy' && propertyData && (
                    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-100 mb-4 text-lg">EPC Rating</h4>
                      <div className="space-y-4">
                        {/* EPC Ratings */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {getPropertyValue('energy_performance.energy_efficiency.current_rating') !== 'N/A' && (
                            <div className="bg-gray-500/10 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-100 mb-1">
                                {getPropertyValue('energy_performance.energy_efficiency.current_rating')}
                              </div>
                              <div className="text-sm text-gray-400">Current Rating</div>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.energy_efficiency.potential_rating') !== 'N/A' && (
                            <div className="bg-gray-500/10 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-gray-100 mb-1">
                                {getPropertyValue('energy_performance.energy_efficiency.potential_rating')}
                              </div>
                              <div className="text-sm text-gray-400">Potential Rating</div>
                            </div>
                          )}
                        </div>

                        {/* Efficiency Scores */}
                        <div className="space-y-3">
                          {getPropertyValue('energy_performance.energy_efficiency.current_efficiency') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Current Efficiency Score</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.energy_efficiency.current_efficiency')}/100</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.energy_efficiency.potential_efficiency') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Potential Efficiency Score</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.energy_efficiency.potential_efficiency')}/100</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.environmental_impact.current_impact') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Current Environmental Impact</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.environmental_impact.current_impact')}/100</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.environmental_impact.potential_impact') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Potential Environmental Impact</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.environmental_impact.potential_impact')}/100</span>
                            </div>
                          )}
                        </div>

                        {/* Certificate Details */}
                        <div className="space-y-3">
                          <h5 className="text-lg font-medium text-gray-200 mb-3">Certificate Details</h5>
                          {getPropertyValue('energy_performance.lodgement_date') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Lodgement Date</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.lodgement_date')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.expiry_date') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Expiry Date</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.expiry_date')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.total_floor_area') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Total Floor Area</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.total_floor_area')}m²</span>
                            </div>
                          )}
                        </div>

                        {/* Building Details */}
                        <div className="space-y-3">
                          <h5 className="text-lg font-medium text-gray-200 mb-3">Building Details</h5>
                          {getPropertyValue('energy_performance.mainheat_description') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Main Heating</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.mainheat_description')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.mainheat_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Heating Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.mainheat_energy_eff')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.hot_water_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Hot Water Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.hot_water_energy_eff')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.windows_description') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Windows</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.windows_description')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.windows_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Windows Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.windows_energy_eff')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.walls_description') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Walls</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.walls_description')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.walls_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Walls Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.walls_energy_eff')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.roof_description') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Roof</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.roof_description')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.roof_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Roof Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.roof_energy_eff')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.lighting_description') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-500/40">
                              <span className="text-gray-400">Lighting</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.lighting_description')}</span>
                            </div>
                          )}
                          {getPropertyValue('energy_performance.lighting_energy_eff') !== 'N/A' && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-400">Lighting Efficiency</span>
                              <span className="text-gray-100 font-medium">{getPropertyValue('energy_performance.lighting_energy_eff')}</span>
                            </div>
                          )}
                        </div>

                        {/* No data fallback */}
                        {getPropertyValue('energy_performance.energy_efficiency.current_rating') === 'N/A' && 
                         getPropertyValue('energy_performance.energy_efficiency.potential_rating') === 'N/A' && (
                          <div className="text-center py-8">
                            <div className="text-3xl mb-3 opacity-50">⚡</div>
                            <p className="text-gray-400">No EPC data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Default content for property details subsections not implemented */}
                  {activeSection === 'property-details' && !['ownership', 'construction', 'plot', 'utilities', 'energy'].includes(activeSubsection || '') && (
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
