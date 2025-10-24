'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import StreetViewImage from './StreetViewImage'

// Types
interface ComparableTransaction {
  street_group_property_id: string
  address: {
    street_group_format: {
      address_lines: string
      postcode: string
    }
    simplified_format: {
      street: string
    }
  }
  property_type: string
  transaction_date: string
  price: number
  internal_area_square_metres: number
  price_per_square_metre: number
  number_of_bedrooms: number
  number_of_bathrooms: number
  location: {
    coordinates: {
      longitude: number
      latitude: number
    }
  }
  distance_in_metres: number
}

interface Filters {
  bedrooms: string
  bathrooms: string
  transactionDate: string
  propertyType: string
  distance: string
}

interface ComparablesData {
  uprn: string
  selected_comparable_ids: string[]
  valuation_strategy: 'average' | 'price_per_sqm'
  calculated_valuation: number | null
}

interface ComparablesAnalysisProps {
  uprn: string
  nearbyTransactions: ComparableTransaction[]
  subjectPropertySqm: number
  subjectPropertyStreet: string
  onTransactionSelect?: (transaction: ComparableTransaction) => void
}

// Helper component for detail rows
const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-500/40 last:border-0">
    <span className="text-gray-400">{label}</span>
    <span className="text-gray-100 font-medium">{value || 'N/A'}</span>
  </div>
)

// Helper function to get street view embed URL
const getStreetViewEmbedUrl = (latitude?: number, longitude?: number) => {
  if (!latitude || !longitude) return ''
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  // Use the correct Street View embed URL format
  return `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=0&pitch=0&fov=90`
}

// Export function to render transaction details
export const renderTransactionDetails = (transaction: ComparableTransaction) => (
  <div className="space-y-6">
    {/* Location Section - Moved to top */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Location</h4>
      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-500/30">
        <iframe
          src={getStreetViewEmbedUrl(transaction.location?.coordinates?.latitude, transaction.location?.coordinates?.longitude)}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>

    {/* Property Information Section */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Property Information</h4>
      <div className="space-y-3">
        <DetailRow label="Address" value={transaction.address?.street_group_format?.address_lines} />
        <DetailRow label="Postcode" value={transaction.address?.street_group_format?.postcode} />
        <DetailRow label="Property Type" value={transaction.property_type} />
        <DetailRow label="Bedrooms" value={transaction.number_of_bedrooms} />
        <DetailRow label="Bathrooms" value={transaction.number_of_bathrooms} />
        <DetailRow label="Internal Area" value={`${transaction.internal_area_square_metres}m²`} />
      </div>
    </div>

    {/* Transaction Details Section */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Transaction Details</h4>
      <div className="space-y-3">
        <DetailRow label="Sale Price" value={formatCurrency(transaction.price)} />
        <DetailRow label="Price per m²" value={`£${transaction.price_per_square_metre?.toLocaleString()}`} />
        <DetailRow label="Transaction Date" value={formatDate(transaction.transaction_date)} />
        <DetailRow label="Distance" value={getDistanceLabel(transaction.distance_in_metres)} />
      </div>
    </div>
  </div>
)

// Filter Options
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4', '5+']
const BATHROOM_OPTIONS = ['Any', '1', '2', '3', '4+']
const DATE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: '730', label: 'Last 2 years' },
  { value: '1095', label: 'Last 3 years' }
]
const DISTANCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'same_street', label: 'Same street' },
  { value: 'quarter_mile', label: '1/4 mile' },
  { value: 'half_mile', label: '1/2 mile' },
  { value: 'one_mile', label: '1 mile' }
]

// Utility Functions
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '£0'
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getDistanceLabel = (distance: number | null | undefined) => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '0m'
  }
  if (distance < 100) return `${distance}m`
  return `${(distance / 1000).toFixed(1)}km`
}

const isTransactionInDateRange = (transactionDate: string, daysBack: number) => {
  if (daysBack === 0) return true
  
  // Parse the transaction date (format: YYYY-MM-DD)
  const transaction = new Date(transactionDate + 'T00:00:00.000Z') // Ensure UTC parsing
  const now = new Date()
  const cutoff = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
  
  // Set time to start of day for accurate comparison
  cutoff.setHours(0, 0, 0, 0)
  transaction.setHours(0, 0, 0, 0)
  
  // Exclude future dates (transactions should not be in the future)
  if (transaction > now) {
    return false
  }
  
  const isInRange = transaction >= cutoff
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Date filter debug:', {
      transactionDate,
      daysBack,
      transaction: transaction.toISOString().split('T')[0],
      cutoff: cutoff.toISOString().split('T')[0],
      now: now.toISOString().split('T')[0],
      isInRange,
      isFuture: transaction > now
    })
  }
  
  return isInRange
}

const isTransactionInDistanceRange = (distance: number, filter: string) => {
  switch (filter) {
    case 'quarter_mile': return distance <= 402 // 1/4 mile in meters
    case 'half_mile': return distance <= 805 // 1/2 mile in meters
    case 'one_mile': return distance <= 1609 // 1 mile in meters
    default: return true
  }
}

// Transaction Card Component
function TransactionCard({ 
  transaction, 
  isSelected, 
  onSelect, 
  onDeselect,
  onViewDetails,
  dragProps 
}: {
  transaction: ComparableTransaction
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onViewDetails: () => void
  dragProps?: any
}) {
  return (
    <div
      {...dragProps}
      onClick={onViewDetails}
      className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-700/40 hover:border-gray-500/50 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-400/50 shadow-lg'
          : 'bg-gray-800/30 border-gray-600/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Street View Image - Left Side */}
        <div className="flex-shrink-0">
          <StreetViewImage
            address={transaction.address?.street_group_format?.address_lines || ''}
            postcode={transaction.address?.street_group_format?.postcode || ''}
            latitude={transaction.location?.coordinates?.latitude}
            longitude={transaction.location?.coordinates?.longitude}
            className="w-20 h-20 object-cover rounded-lg"
            size="150x150"
          />
        </div>
        
        {/* Property Details - Middle */}
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
                {formatCurrency(transaction.price)}
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
              <div>{formatDate(transaction.transaction_date)}</div>
              <div>{getDistanceLabel(transaction.distance_in_metres)}</div>
            </div>
          </div>
        </div>

        {/* Action Button - Right Side */}
        <div className="flex-shrink-0 flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              isSelected ? onDeselect() : onSelect()
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm ${
              isSelected 
                ? 'bg-red-500/80 text-white hover:bg-red-400/80' 
                : 'bg-green-500/80 text-white hover:bg-green-400/80'
            }`}
            title={isSelected ? 'Remove from comparables' : 'Add to comparables'}
          >
            {isSelected ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Filter Controls Component
function FilterControls({ 
  filters, 
  onFiltersChange, 
  propertyTypes,
  totalCount,
  filteredCount 
}: {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  propertyTypes: string[]
  totalCount: number
  filteredCount: number
}) {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-200">Filter Transactions</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onFiltersChange({
                bedrooms: 'Any',
                bathrooms: 'Any',
                transactionDate: 'any',
                propertyType: 'Any',
                distance: 'any'
              })}
              className="px-3 py-1 bg-gray-600/50 hover:bg-gray-600 text-white rounded-md text-xs font-medium transition-colors"
            >
              Clear All
            </button>
            <div className="text-xs text-gray-400">
              {filteredCount} of {totalCount} transactions
              {totalCount > filteredCount && (
                <span className="ml-1 text-orange-400">
                  ({totalCount - filteredCount} filtered out)
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Bedrooms</label>
          <select
            value={filters.bedrooms}
            onChange={(e) => updateFilter('bedrooms', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
          >
            {BEDROOM_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Bathrooms</label>
          <select
            value={filters.bathrooms}
            onChange={(e) => updateFilter('bathrooms', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
          >
            {BATHROOM_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <select
            value={filters.transactionDate}
            onChange={(e) => updateFilter('transactionDate', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
          >
            {DATE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Type</label>
          <select
            value={filters.propertyType}
            onChange={(e) => updateFilter('propertyType', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
          >
            <option value="Any">Any</option>
            {propertyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Distance</label>
          <select
            value={filters.distance}
            onChange={(e) => updateFilter('distance', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
          >
            {DISTANCE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// Valuation Display Component
function ValuationDisplay({ 
  valuation, 
  strategy, 
  onStrategyChange, 
  selectedCount 
}: {
  valuation: number | null
  strategy: 'average' | 'price_per_sqm'
  onStrategyChange: (strategy: 'average' | 'price_per_sqm') => void
  selectedCount: number
}) {
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Property Valuation</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onStrategyChange('average')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              strategy === 'average'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Simple Average
          </button>
          <button
            onClick={() => onStrategyChange('price_per_sqm')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              strategy === 'price_per_sqm'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Price per SQM
          </button>
        </div>
      </div>
      
      <div className="text-center">
        {valuation !== null && selectedCount > 0 ? (
          <>
            <div className="text-4xl font-bold text-white mb-2">
              {formatCurrency(valuation)}
            </div>
            <div className="text-sm text-gray-300">
              Based on {selectedCount} comparable{selectedCount !== 1 ? 's' : ''} using {strategy === 'average' ? 'simple average' : 'price per square metre'}
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl text-gray-400 mb-2">No valuation available</div>
            <div className="text-sm text-gray-500">
              Select comparables to calculate valuation
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Main Component
export default function ComparablesAnalysis({ 
  uprn, 
  nearbyTransactions, 
  subjectPropertySqm,
  subjectPropertyStreet,
  onTransactionSelect
}: ComparablesAnalysisProps) {
  // State
  const [selectedComparableIds, setSelectedComparableIds] = useState<string[]>([])
  const [valuationStrategy, setValuationStrategy] = useState<'average' | 'price_per_sqm'>('average')
  const [filters, setFilters] = useState<Filters>({
    bedrooms: 'Any',
    bathrooms: 'Any',
    transactionDate: 'any',
    propertyType: 'Any',
    distance: 'any'
  })
  const [savedData, setSavedData] = useState<ComparablesData | null>(null)

  // Deduplicate transactions - keep only most recent per property
  const deduplicatedTransactions = useMemo(() => {
    const transactionMap = new Map<string, ComparableTransaction>()
    
    nearbyTransactions.forEach(transaction => {
      const id = transaction.street_group_property_id
      const existing = transactionMap.get(id)
      
      if (!existing) {
        transactionMap.set(id, transaction)
      } else {
        // Keep the most recent transaction
        const existingDate = new Date(existing.transaction_date + 'T00:00:00.000Z')
        const currentDate = new Date(transaction.transaction_date + 'T00:00:00.000Z')
        
        if (currentDate > existingDate) {
          transactionMap.set(id, transaction)
        }
      }
    })
    
    return Array.from(transactionMap.values())
  }, [nearbyTransactions])

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const response = await fetch(`/api/db/comparables?uprn=${uprn}`)
        if (response.ok) {
          const data = await response.json()
          setSavedData(data)
          setSelectedComparableIds(data.selected_comparable_ids || [])
          setValuationStrategy(data.valuation_strategy || 'average')
        }
      } catch (error) {
        console.error('Error loading saved comparables data:', error)
      }
    }
    
    loadSavedData()
  }, [uprn])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const filtered = deduplicatedTransactions.filter(transaction => {
      // Bedrooms filter
      if (filters.bedrooms !== 'Any') {
        const transactionBeds = transaction.number_of_bedrooms || 0
        const filterBeds = filters.bedrooms === '5+' ? 5 : parseInt(filters.bedrooms)
        
        if (filters.bedrooms === '5+') {
          if (transactionBeds < 5) return false
        } else {
          if (transactionBeds !== filterBeds) return false
        }
      }

      // Bathrooms filter
      if (filters.bathrooms !== 'Any') {
        const transactionBaths = transaction.number_of_bathrooms || 0
        const filterBaths = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms)
        
        if (filters.bathrooms === '4+') {
          if (transactionBaths < 4) return false
        } else {
          if (transactionBaths !== filterBaths) return false
        }
      }

      // Date filter
      if (filters.transactionDate !== 'any') {
        const daysBack = parseInt(filters.transactionDate)
        if (!isTransactionInDateRange(transaction.transaction_date, daysBack)) return false
      }

      // Property type filter
      if (filters.propertyType !== 'Any') {
        const transactionType = transaction.property_type || 'Unknown'
        if (transactionType !== filters.propertyType) {
          return false
        }
      }

      // Distance filter
      if (filters.distance !== 'any') {
        if (filters.distance === 'same_street') {
          const transactionStreet = transaction.address?.simplified_format?.street || ''
          if (transactionStreet !== subjectPropertyStreet) {
            return false
          }
        } else {
          const distance = transaction.distance_in_metres || 0
          if (!isTransactionInDistanceRange(distance, filters.distance)) {
            return false
          }
        }
      }

      return true
    })

    // Sort by transaction date (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.transaction_date + 'T00:00:00.000Z')
      const dateB = new Date(b.transaction_date + 'T00:00:00.000Z')
      return dateB.getTime() - dateA.getTime() // Most recent first
    })
  }, [deduplicatedTransactions, filters, subjectPropertyStreet])

  // Get unique property types for filter
  const propertyTypes = useMemo(() => {
    return Array.from(new Set(deduplicatedTransactions.map(t => t.property_type || 'Unknown'))).sort()
  }, [deduplicatedTransactions])

  // Calculate valuation
  const calculatedValuation = useMemo(() => {
    if (selectedComparableIds.length === 0) return null

    const selectedTransactions = deduplicatedTransactions.filter(t => 
      selectedComparableIds.includes(t.street_group_property_id)
    )

    if (selectedTransactions.length === 0) return null

    if (valuationStrategy === 'average') {
      const totalPrice = selectedTransactions.reduce((sum, t) => sum + (t.price || 0), 0)
      return totalPrice / selectedTransactions.length
    } else {
      // Price per sqm strategy
      if (subjectPropertySqm <= 0) return null
      
      const validTransactions = selectedTransactions.filter(t => t.price_per_square_metre && t.price_per_square_metre > 0)
      if (validTransactions.length === 0) return null
      
      const totalPricePerSqm = validTransactions.reduce((sum, t) => sum + (t.price_per_square_metre || 0), 0)
      const avgPricePerSqm = totalPricePerSqm / validTransactions.length
      return avgPricePerSqm * subjectPropertySqm
    }
  }, [selectedComparableIds, deduplicatedTransactions, valuationStrategy, subjectPropertySqm])

  // Save data with debouncing - only save when user makes changes, not on calculated values
  useEffect(() => {
    const saveData = async () => {
      if (!savedData) return // Don't save until we've loaded initial data
      
      try {
        console.log('Saving comparables data:', {
          uprn,
          selected_comparable_ids: selectedComparableIds,
          valuation_strategy: valuationStrategy
        })
        
        const response = await fetch('/api/db/comparables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uprn,
            selected_comparable_ids: selectedComparableIds,
            valuation_strategy: valuationStrategy,
            calculated_valuation: calculatedValuation
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Successfully saved comparables data:', data)
          setSavedData(data)
        } else {
          console.error('Failed to save comparables data:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error saving comparables data:', error)
      }
    }

    const timeoutId = setTimeout(saveData, 1000) // Increased debounce to 1 second
    return () => clearTimeout(timeoutId)
  }, [uprn, selectedComparableIds, valuationStrategy, savedData]) // Removed calculatedValuation from dependencies

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Comparables Debug:', {
        totalTransactions: nearbyTransactions.length,
        deduplicatedCount: deduplicatedTransactions.length,
        duplicatesRemoved: nearbyTransactions.length - deduplicatedTransactions.length,
        filteredCount: filteredTransactions.length,
        selectedCount: selectedComparableIds.length
      })
    }
  }, [nearbyTransactions, deduplicatedTransactions, filteredTransactions, selectedComparableIds])

  // Handlers
  const handleSelectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => [...prev, id])
  }, [])

  const handleDeselectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => prev.filter(selectedId => selectedId !== id))
  }, [])

  const handleStrategyChange = useCallback((strategy: 'average' | 'price_per_sqm') => {
    setValuationStrategy(strategy)
  }, [])

  const handleViewDetails = useCallback((transaction: ComparableTransaction) => {
    if (onTransactionSelect) {
      onTransactionSelect(transaction)
    }
  }, [onTransactionSelect])



  // Get selected and available transactions
  const availableTransactions = filteredTransactions.filter(t => 
    !selectedComparableIds.includes(t.street_group_property_id)
  )
  const selectedTransactions = deduplicatedTransactions
    .filter(t => selectedComparableIds.includes(t.street_group_property_id))
    .sort((a, b) => {
      const dateA = new Date(a.transaction_date + 'T00:00:00.000Z')
      const dateB = new Date(b.transaction_date + 'T00:00:00.000Z')
      return dateB.getTime() - dateA.getTime() // Most recent first
    })

  if (!deduplicatedTransactions || deduplicatedTransactions.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="text-center py-12">
          <div className="text-4xl mb-4 opacity-50">🏘️</div>
          <h3 className="text-xl font-semibold text-gray-200 mb-3">No Nearby Transactions</h3>
          <p className="text-gray-400">No comparable transactions found for this property.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Valuation Display */}
      <ValuationDisplay
        valuation={calculatedValuation}
        strategy={valuationStrategy}
        onStrategyChange={handleStrategyChange}
        selectedCount={selectedComparableIds.length}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Transactions */}
        <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Available Transactions ({availableTransactions.length})
          </h3>
          
          {/* Filter Controls */}
          <FilterControls
            filters={filters}
            onFiltersChange={setFilters}
            propertyTypes={propertyTypes}
            totalCount={deduplicatedTransactions.length}
            filteredCount={filteredTransactions.length}
          />
          <div className="space-y-3">
            {availableTransactions.map(transaction => (
              <TransactionCard
                key={transaction.street_group_property_id}
                transaction={transaction}
                isSelected={false}
                onSelect={() => handleSelectComparable(transaction.street_group_property_id)}
                onDeselect={() => {}}
                onViewDetails={() => handleViewDetails(transaction)}
              />
            ))}
            {availableTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No transactions match the current filters
              </div>
            )}
          </div>
        </div>

        {/* Selected Comparables */}
        <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Selected Comparables ({selectedTransactions.length})
          </h3>
          <div className="space-y-3">
            {selectedTransactions.map(transaction => (
              <TransactionCard
                key={transaction.street_group_property_id}
                transaction={transaction}
                isSelected={true}
                onSelect={() => {}}
                onDeselect={() => handleDeselectComparable(transaction.street_group_property_id)}
                onViewDetails={() => handleViewDetails(transaction)}
              />
            ))}
            {selectedTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Select transactions from the left panel to use as comparables
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
