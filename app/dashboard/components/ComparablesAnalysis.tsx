'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import StreetViewImage from './StreetViewImage'
import GenericPanel from './GenericPanel'

// Add CSS animation for checkmark
const checkmarkAnimation = `
@keyframes checkmark {
  0% {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(45deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(45deg);
    opacity: 1;
  }
}
`

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = checkmarkAnimation
  document.head.appendChild(style)
}

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
  tenure?: {
    tenure_type: string
    tenure_type_predicted: boolean
    lease_details: any
  }
}

interface PropertyWithTransactions {
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
  tenure?: {
    tenure_type: string
    tenure_type_predicted: boolean
    lease_details: any
  }
  number_of_bedrooms: number
  number_of_bathrooms: number
  location: {
    coordinates: {
      longitude: number
      latitude: number
    }
  }
  distance_in_metres: number
  transactions: Array<{
    transaction_date: string
    price: number
    internal_area_square_metres: number
    price_per_square_metre: number
  }>
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
  subjectPropertyData?: {
    address?: string
    postcode?: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    internalArea?: number
    location?: {
      coordinates: {
        latitude: number
        longitude: number
      }
    }
  }
  onTransactionSelect?: (transaction: ComparableTransaction) => void
  onSelectedCountChange?: (count: number) => void
  onSelectedPanelOpen?: (isOpen: boolean) => void
  onSelectedTransactionsChange?: (transactions: ComparableTransaction[]) => void
  onRemoveComparable?: (transactionId: string) => void
  selectedPanelOpen?: boolean
  refreshTrigger?: number
  onOpenAIComparablesDialog?: () => void
}

// Loading Skeleton Component
const TransactionCardSkeleton = () => (
  <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4 animate-pulse">
    <div className="flex gap-4">
      {/* Image skeleton */}
      <div className="flex-shrink-0">
        <div className="w-20 h-20 bg-gray-700 rounded-lg"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="h-3 bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
            <div className="h-3 bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
          <div className="text-right">
            <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className="flex-shrink-0 flex items-center">
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
)

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
  return `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&pitch=0&fov=90`
}

// Export function to render transaction details
export const renderTransactionDetails = (transaction: ComparableTransaction) => (
  <div className="space-y-6">
    {/* Main Information Chips */}
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-6">
      <h4 className="font-semibold text-gray-100 mb-4 text-lg">Property Details</h4>
      <div className="flex flex-wrap gap-4">
        {transaction.address?.street_group_format?.address_lines && (
          <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-4 py-3 w-full">
            <span className="text-gray-400 text-sm">Address:</span>
            <span className="text-gray-100 font-semibold text-base">{transaction.address.street_group_format.address_lines}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          {transaction.address?.street_group_format?.postcode && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Postcode:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.address.street_group_format.postcode}</span>
            </div>
          )}
          {transaction.property_type && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Type:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.property_type}</span>
            </div>
          )}
          {transaction.number_of_bedrooms !== undefined && transaction.number_of_bedrooms !== null && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Beds:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.number_of_bedrooms}</span>
            </div>
          )}
          {transaction.number_of_bathrooms !== undefined && transaction.number_of_bathrooms !== null && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Baths:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.number_of_bathrooms}</span>
            </div>
          )}
          {transaction.internal_area_square_metres && (
            <div className="flex items-center gap-2 bg-gray-500/10 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-xs">Area:</span>
              <span className="text-gray-100 font-medium text-sm">{transaction.internal_area_square_metres}m²</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Street View Map */}
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
const SORT_OPTIONS = [
  { label: 'Highest price first', value: 'price-high' },
  { label: 'Lowest price first', value: 'price-low' },
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Closest first', value: 'closest' }
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

// Helper function for tenure icon
function getTenureIcon(tenure?: { tenure_type: string }) {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}

// Transaction Timeline Component
function TransactionTimeline({ 
  transactions, 
  onViewMore 
}: { 
  transactions: Array<{
    transaction_date: string
    price: number
    internal_area_square_metres: number
    price_per_square_metre: number
  }>, 
  onViewMore?: () => void 
}) {
  const visibleTransactions = transactions.slice(0, 2)
  const remainingCount = transactions.length - 2
  
  return (
    <div className="space-y-2 mt-4">
      {/* Recent transactions */}
      {visibleTransactions.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-sm text-gray-300">{formatDate(t.transaction_date)}</span>
          <span className="text-sm font-medium text-gray-100">£{t.price.toLocaleString()}</span>
        </div>
      ))}
      
      {/* View more */}
      {remainingCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <button 
            onClick={onViewMore}
            className="text-sm text-gray-400 hover:text-gray-300 underline"
          >
            View +{remainingCount} more
          </button>
        </div>
      )}
    </div>
  )
}

// Transaction Card Component
function TransactionCard({ 
  property, 
  isSelected, 
  onSelect, 
  onDeselect,
  onViewDetails,
  dragProps 
}: {
  property: PropertyWithTransactions
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
  onViewDetails: () => void
  dragProps?: any
}) {
  const latestTransaction = property.transactions[0]
  const [isAnimating, setIsAnimating] = useState(false)
  
  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Update state immediately for instant UI feedback
    if (isSelected) {
      onDeselect()
    } else {
      setIsAnimating(true)
      onSelect()
      // Clear animation state after a short delay
      setTimeout(() => {
        setIsAnimating(false)
      }, 200)
    }
  }, [isSelected, onSelect, onDeselect])
  
  return (
    <div
      {...dragProps}
      className={`relative p-4 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-400/50 shadow-lg'
          : 'bg-gray-800/30 border-gray-600/30'
      }`}
    >
      <div className="flex gap-4">
        {/* Checkbox - Left Side */}
        <div className="flex-shrink-0 flex items-start pt-1">
          <button
            onClick={handleCheckboxClick}
            className="w-8 h-8 rounded border-2 border-gray-600 bg-gray-800 hover:border-gray-500 flex items-center justify-center transition-all duration-200"
          >
            {(isSelected || isAnimating) && (
              <svg 
                className="w-6 h-6 text-purple-400 transition-all duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Property Details - Middle */}
        <div className="flex-1 min-w-0">
          {/* Address and Postcode */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-100 mb-1">
              {property.address?.street_group_format?.address_lines || 'Address not available'}{property.address?.street_group_format?.postcode && ` ${property.address.street_group_format.postcode}`}
            </h4>
          </div>
          
          {/* Property Icons */}
          <div className="flex gap-4 text-xs text-gray-400 mb-4">
            {property.tenure && (
              <div className="flex items-center gap-1">
                {getTenureIcon(property.tenure)}
                <span className="capitalize">{property.tenure.tenure_type}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 8h20v8H2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 6h4v2H2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6h4v2h-4z" />
                <circle cx="4" cy="9" r="1" fill="currentColor" />
              </svg>
              <span>{property.number_of_bedrooms || 0} bed</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21v6H3V3h7.5z" />
              </svg>
              <span>{property.number_of_bathrooms || 0} bath</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{property.property_type || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>{property.transactions[0]?.internal_area_square_metres || 0}m²</span>
            </div>
          </div>
          
          {/* Transaction Timeline */}
          <div className="mt-8">
            <TransactionTimeline 
              transactions={property.transactions}
              onViewMore={() => onViewDetails()}
            />
          </div>
        </div>

        {/* Street View Image and Details Button - Right Side */}
        <div className="flex-shrink-0 flex gap-3">
          <div className="w-24">
            <StreetViewImage
              address={property.address?.street_group_format?.address_lines || ''}
              postcode={property.address?.street_group_format?.postcode || ''}
              latitude={property.location?.coordinates?.latitude}
              longitude={property.location?.coordinates?.longitude}
              className="w-full h-full object-cover rounded-lg"
              size="150x150"
            />
          </div>
          
          {/* Details Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
            className="w-10 h-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-all duration-200 rounded-lg"
            title="View details"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
    <div className="bg-black/20 border border-gray-500/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-400">
          Showing {filteredCount} of {totalCount} transactions
          {totalCount > filteredCount && (
            <span className="ml-1 text-orange-400">
              ({totalCount - filteredCount} filtered out)
            </span>
          )}
        </div>
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
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Distance</label>
          <div className="relative">
            <select
              value={filters.distance}
              onChange={(e) => updateFilter('distance', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-1.5 pr-8 text-xs text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {DISTANCE_OPTIONS.map(option => (
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
        
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Bedrooms</label>
          <div className="relative">
            <select
              value={filters.bedrooms}
              onChange={(e) => updateFilter('bedrooms', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-1.5 pr-8 text-xs text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {BEDROOM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Bathrooms</label>
          <div className="relative">
            <select
              value={filters.bathrooms}
              onChange={(e) => updateFilter('bathrooms', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-1.5 pr-8 text-xs text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {BATHROOM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Property Type</label>
          <div className="relative">
            <select
              value={filters.propertyType}
              onChange={(e) => updateFilter('propertyType', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-1.5 pr-8 text-xs text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              <option value="Any">Any</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Transaction Date</label>
          <div className="relative">
            <select
              value={filters.transactionDate}
              onChange={(e) => updateFilter('transactionDate', e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-md px-3 py-1.5 pr-8 text-xs text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
            >
              {DATE_OPTIONS.map(option => (
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
  )
}


// Valuation Display Component
function ValuationDisplay({ 
  valuation, 
  strategy, 
  onStrategyChange, 
  selectedCount,
  isLoading = false,
  subjectPropertyData,
  hasLoadedInitialData
}: {
  valuation: number | null
  strategy: 'average' | 'price_per_sqm'
  onStrategyChange: (strategy: 'average' | 'price_per_sqm') => void
  selectedCount: number
  isLoading?: boolean
  subjectPropertyData?: ComparablesAnalysisProps['subjectPropertyData']
  hasLoadedInitialData: boolean
}) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Trigger animation when selectedCount changes
  useEffect(() => {
    if (selectedCount > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [selectedCount])
  return (
    <div className="mb-6">
      {/* Valuation Box */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 flex flex-col min-h-[200px]">
        <div className="mb-4">
          <div className="bg-black/20 border border-gray-600 rounded-md p-0.5 flex w-fit">
            <button
              onClick={() => onStrategyChange('average')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                strategy === 'average'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simple Average
            </button>
            <button
              onClick={() => onStrategyChange('price_per_sqm')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                strategy === 'price_per_sqm'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Price per SQM
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          {/* Valuation */}
          <div className="flex-1">
            {!hasLoadedInitialData ? (
              <>
                <div className="h-12 bg-gray-700/30 rounded mb-2 animate-pulse w-48"></div>
                <div className="h-4 bg-gray-700/30 rounded w-64 animate-pulse"></div>
              </>
            ) : valuation !== null && selectedCount > 0 ? (
              <>
                <div className="text-4xl font-bold text-white mb-1">
                  {formatCurrency(valuation)}
                </div>
                <div className="text-sm text-gray-300">
                  Based on {selectedCount} comparable{selectedCount !== 1 ? 's' : ''} using {strategy === 'average' ? 'simple average' : 'price per square metre'}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl text-gray-400 mb-1">No valuation available</div>
                <div className="text-sm text-gray-500">
                  Select comparables to calculate valuation
                </div>
              </>
            )}
          </div>

        </div>
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
  subjectPropertyData,
  onTransactionSelect,
  onSelectedCountChange,
  onSelectedPanelOpen,
  onSelectedTransactionsChange,
  onRemoveComparable,
  selectedPanelOpen = false,
  refreshTrigger,
  onOpenAIComparablesDialog
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
  const [sortBy, setSortBy] = useState<string>('newest')
  const [savedData, setSavedData] = useState<ComparablesData | null>(null)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Group transactions by property instead of deduplicating
  const groupedProperties = useMemo(() => {
    const propertyMap = new Map<string, PropertyWithTransactions>()
    
    nearbyTransactions.forEach(transaction => {
      const id = transaction.street_group_property_id
      const existing = propertyMap.get(id)
      
      if (!existing) {
        propertyMap.set(id, {
          street_group_property_id: transaction.street_group_property_id,
          address: transaction.address,
          property_type: transaction.property_type,
          tenure: transaction.tenure,
          number_of_bedrooms: transaction.number_of_bedrooms,
          number_of_bathrooms: transaction.number_of_bathrooms,
          location: transaction.location,
          distance_in_metres: transaction.distance_in_metres,
          transactions: [{
            transaction_date: transaction.transaction_date,
            price: transaction.price,
            internal_area_square_metres: transaction.internal_area_square_metres,
            price_per_square_metre: transaction.price_per_square_metre
          }]
        })
      } else {
        existing.transactions.push({
          transaction_date: transaction.transaction_date,
          price: transaction.price,
          internal_area_square_metres: transaction.internal_area_square_metres,
          price_per_square_metre: transaction.price_per_square_metre
        })
        // Sort transactions by date (newest first)
        existing.transactions.sort((a, b) => {
          const dateA = new Date(a.transaction_date + 'T00:00:00.000Z')
          const dateB = new Date(b.transaction_date + 'T00:00:00.000Z')
          return dateB.getTime() - dateA.getTime()
        })
      }
    })
    
    return Array.from(propertyMap.values())
  }, [nearbyTransactions])

  // Load saved data on mount and when refreshTrigger changes
  // Use a ref to track the previous refreshTrigger value to avoid unnecessary reloads
  const prevRefreshTriggerRef = useRef<number | undefined>(undefined)
  
  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoadingValuation(true)
      try {
        const response = await fetch(`/api/db/comparables?uprn=${uprn}`)
        if (response.ok) {
          const data = await response.json()
          setSavedData(data)
          setSelectedComparableIds(data.selected_comparable_ids || [])
          setValuationStrategy(data.valuation_strategy || 'average')
        }
        // Mark that we've loaded initial data, regardless of whether we got data or not
        setHasLoadedInitialData(true)
      } catch (error) {
        console.error('Error loading saved comparables data:', error)
        // Still mark as loaded even if there was an error
        setHasLoadedInitialData(true)
      } finally {
        setIsLoadingValuation(false)
      }
    }
    
    // Only reload if refreshTrigger actually changed (not on every render)
    const shouldReload = prevRefreshTriggerRef.current === undefined || 
                        prevRefreshTriggerRef.current !== refreshTrigger
    
    if (shouldReload) {
      prevRefreshTriggerRef.current = refreshTrigger
      loadSavedData()
    }
  }, [uprn, refreshTrigger])

  // Notify parent when selected count changes
  useEffect(() => {
    if (onSelectedCountChange) {
      onSelectedCountChange(selectedComparableIds.length)
    }
  }, [selectedComparableIds.length, onSelectedCountChange])

  // Notify parent when selected transactions change
  // Use useMemo to memoize the transactions array to avoid unnecessary updates
  const selectedTransactionsForParent = useMemo(() => {
    if (!onSelectedTransactionsChange) return null
    
    const selectedProperties = groupedProperties.filter(p => 
      selectedComparableIds.includes(p.street_group_property_id)
    )
    // Convert properties back to transactions for parent component compatibility
    return selectedProperties.map(property => {
      const latestTransaction = property.transactions[0]
      return {
        street_group_property_id: property.street_group_property_id,
        address: property.address,
        property_type: property.property_type,
        transaction_date: latestTransaction.transaction_date,
        price: latestTransaction.price,
        internal_area_square_metres: latestTransaction.internal_area_square_metres,
        price_per_square_metre: latestTransaction.price_per_square_metre,
        number_of_bedrooms: property.number_of_bedrooms,
        number_of_bathrooms: property.number_of_bathrooms,
        location: property.location,
        distance_in_metres: property.distance_in_metres,
        tenure: property.tenure
      } as ComparableTransaction
    })
  }, [selectedComparableIds, groupedProperties, onSelectedTransactionsChange])

  // Only call the callback when the transactions array actually changes (by ID list)
  // Use a ref to track previous IDs to avoid unnecessary callbacks
  const prevSelectedIdsRef = useRef<string[]>([])
  
  useEffect(() => {
    if (!onSelectedTransactionsChange) return
    
    // Only update if the IDs actually changed
    const idsChanged = JSON.stringify(prevSelectedIdsRef.current.sort()) !== JSON.stringify(selectedComparableIds.sort())
    
    if (idsChanged && selectedTransactionsForParent !== null) {
      prevSelectedIdsRef.current = [...selectedComparableIds]
      onSelectedTransactionsChange(selectedTransactionsForParent)
    }
  }, [selectedComparableIds, selectedTransactionsForParent, onSelectedTransactionsChange])

  // Note: we no longer toggle loading for interactive changes; valuation updates instantly

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    const filtered = groupedProperties.filter(property => {
      // Bedrooms filter
      if (filters.bedrooms !== 'Any') {
        const propertyBeds = property.number_of_bedrooms || 0
        const filterBeds = filters.bedrooms === '5+' ? 5 : parseInt(filters.bedrooms)
        
        if (filters.bedrooms === '5+') {
          if (propertyBeds < 5) return false
        } else {
          if (propertyBeds !== filterBeds) return false
        }
      }

      // Bathrooms filter
      if (filters.bathrooms !== 'Any') {
        const propertyBaths = property.number_of_bathrooms || 0
        const filterBaths = filters.bathrooms === '4+' ? 4 : parseInt(filters.bathrooms)
        
        if (filters.bathrooms === '4+') {
          if (propertyBaths < 4) return false
        } else {
          if (propertyBaths !== filterBaths) return false
        }
      }

      // Date filter - check if any transaction matches
      if (filters.transactionDate !== 'any') {
        const daysBack = parseInt(filters.transactionDate)
        const hasMatchingTransaction = property.transactions.some(transaction => 
          isTransactionInDateRange(transaction.transaction_date, daysBack)
        )
        if (!hasMatchingTransaction) return false
      }

      // Property type filter
      if (filters.propertyType !== 'Any') {
        const propertyType = property.property_type || 'Unknown'
        if (propertyType !== filters.propertyType) {
          return false
        }
      }

      // Distance filter
      if (filters.distance !== 'any') {
        if (filters.distance === 'same_street') {
          const propertyStreet = property.address?.simplified_format?.street || ''
          if (propertyStreet !== subjectPropertyStreet) {
            return false
          }
        } else {
          const distance = property.distance_in_metres || 0
          if (!isTransactionInDistanceRange(distance, filters.distance)) {
            return false
          }
        }
      }

      return true
    })

    // Sort based on selected sort option
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          const priceA = a.transactions[0]?.price || 0
          const priceB = b.transactions[0]?.price || 0
          return priceB - priceA
        case 'price-low':
          const priceALow = a.transactions[0]?.price || 0
          const priceBLow = b.transactions[0]?.price || 0
          return priceALow - priceBLow
        case 'newest':
          const dateA = new Date(a.transactions[0]?.transaction_date + 'T00:00:00.000Z')
          const dateB = new Date(b.transactions[0]?.transaction_date + 'T00:00:00.000Z')
          return dateB.getTime() - dateA.getTime()
        case 'oldest':
          const dateAOld = new Date(a.transactions[0]?.transaction_date + 'T00:00:00.000Z')
          const dateBOld = new Date(b.transactions[0]?.transaction_date + 'T00:00:00.000Z')
          return dateAOld.getTime() - dateBOld.getTime()
        case 'closest':
          return (a.distance_in_metres || 0) - (b.distance_in_metres || 0)
        default:
          return 0
      }
    })
  }, [groupedProperties, filters, subjectPropertyStreet, sortBy])

  // Get unique property types for filter
  const propertyTypes = useMemo(() => {
    return Array.from(new Set(groupedProperties.map(p => p.property_type || 'Unknown'))).sort()
  }, [groupedProperties])

  // Calculate valuation
  const calculatedValuation = useMemo(() => {
    if (selectedComparableIds.length === 0) return null

    const selectedProperties = groupedProperties.filter(p => 
      selectedComparableIds.includes(p.street_group_property_id)
    )

    if (selectedProperties.length === 0) return null

    if (valuationStrategy === 'average') {
      // Use the latest transaction price for each property
      const totalPrice = selectedProperties.reduce((sum, p) => sum + (p.transactions[0]?.price || 0), 0)
      return totalPrice / selectedProperties.length
    } else {
      // Price per sqm strategy
      if (subjectPropertySqm <= 0) return null
      
      const validProperties = selectedProperties.filter(p => {
        const latestTransaction = p.transactions[0]
        return latestTransaction?.price_per_square_metre && latestTransaction.price_per_square_metre > 0
      })
      if (validProperties.length === 0) return null
      
      const totalPricePerSqm = validProperties.reduce((sum, p) => 
        sum + (p.transactions[0]?.price_per_square_metre || 0), 0
      )
      const avgPricePerSqm = totalPricePerSqm / validProperties.length
      return avgPricePerSqm * subjectPropertySqm
    }
  }, [selectedComparableIds, groupedProperties, valuationStrategy, subjectPropertySqm])

  // Save data with debouncing - only save when user makes changes, not on initial load
  // Use a longer debounce time to batch rapid changes
  // IMPORTANT: Don't include calculatedValuation in dependencies - it changes on every selection/deselection
  // and would reset the debounce timer. Calculate it inside the save function instead.
  useEffect(() => {
    const saveData = async () => {
      if (!hasLoadedInitialData || !hasUserInteracted) return // Don't save until we've loaded initial data AND user has interacted
      
      try {
        // Calculate valuation fresh at save time (don't rely on calculatedValuation state)
        let valuationToSave: number | null = null
        if (selectedComparableIds.length > 0) {
          const selectedProperties = groupedProperties.filter(p => 
            selectedComparableIds.includes(p.street_group_property_id)
          )
          
          if (selectedProperties.length > 0) {
            if (valuationStrategy === 'average') {
              const totalPrice = selectedProperties.reduce((sum, p) => sum + (p.transactions[0]?.price || 0), 0)
              valuationToSave = totalPrice / selectedProperties.length
            } else {
              // Price per sqm strategy
              if (subjectPropertySqm > 0) {
                const validProperties = selectedProperties.filter(p => {
                  const latestTransaction = p.transactions[0]
                  return latestTransaction?.price_per_square_metre && latestTransaction.price_per_square_metre > 0
                })
                if (validProperties.length > 0) {
                  const totalPricePerSqm = validProperties.reduce((sum, p) => 
                    sum + (p.transactions[0]?.price_per_square_metre || 0), 0
                  )
                  const avgPricePerSqm = totalPricePerSqm / validProperties.length
                  valuationToSave = avgPricePerSqm * subjectPropertySqm
                }
              }
            }
          }
        }
        
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
            calculated_valuation: valuationToSave
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

    // Increased debounce time to 2.5 seconds to batch rapid toggles
    const timeoutId = setTimeout(saveData, 2500)
    return () => clearTimeout(timeoutId)
  }, [uprn, selectedComparableIds, valuationStrategy, hasLoadedInitialData, hasUserInteracted, groupedProperties, subjectPropertySqm])

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Comparables Debug:', {
        totalTransactions: nearbyTransactions.length,
        groupedPropertiesCount: groupedProperties.length,
        propertiesGrouped: nearbyTransactions.length - groupedProperties.length,
        filteredCount: filteredProperties.length,
        selectedCount: selectedComparableIds.length
      })
    }
  }, [nearbyTransactions, groupedProperties, filteredProperties, selectedComparableIds])

  // Handlers
  const handleSelectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => [...prev, id])
    setHasUserInteracted(true)
  }, [])

  const handleDeselectComparable = useCallback((id: string) => {
    setSelectedComparableIds(prev => prev.filter(selectedId => selectedId !== id))
    setHasUserInteracted(true)
    // Note: onRemoveComparable is only used when removing from the Selected Comparables panel in the parent
    // The debounced save effect handles persistence, so we don't call it here to avoid duplicate saves/refreshes
  }, [])

  const handleStrategyChange = useCallback((strategy: 'average' | 'price_per_sqm') => {
    setValuationStrategy(strategy)
    setHasUserInteracted(true)
    // Strategy change will be saved via the debounced save effect
    // No need for immediate save - let the debounce handle it
  }, [])

  const handleViewDetails = useCallback((property: PropertyWithTransactions) => {
    // Convert property to transaction format for the details panel
    const latestTransaction = property.transactions[0]
    const transactionForDetails: ComparableTransaction = {
      street_group_property_id: property.street_group_property_id,
      address: property.address,
      property_type: property.property_type,
      transaction_date: latestTransaction.transaction_date,
      price: latestTransaction.price,
      internal_area_square_metres: latestTransaction.internal_area_square_metres,
      price_per_square_metre: latestTransaction.price_per_square_metre,
      number_of_bedrooms: property.number_of_bedrooms,
      number_of_bathrooms: property.number_of_bathrooms,
      location: property.location,
      distance_in_metres: property.distance_in_metres,
      tenure: property.tenure
    }
    if (onTransactionSelect) {
      onTransactionSelect(transactionForDetails)
    }
  }, [onTransactionSelect])


  const handleCloseSelectedPanel = useCallback(() => {
    if (onSelectedPanelOpen) {
      onSelectedPanelOpen(false)
    }
  }, [onSelectedPanelOpen])

  const handleClearAllSelected = useCallback(() => {
    setSelectedComparableIds([])
  }, [])

  const handleAISelectComparables = useCallback(() => {
    if (onOpenAIComparablesDialog) {
      onOpenAIComparablesDialog()
    }
  }, [onOpenAIComparablesDialog])



  // Get selected and available properties
  const availableProperties = filteredProperties.filter(p => 
    !selectedComparableIds.includes(p.street_group_property_id)
  )
  const selectedProperties = groupedProperties
    .filter(p => selectedComparableIds.includes(p.street_group_property_id))
    .sort((a, b) => {
      const dateA = new Date(a.transactions[0]?.transaction_date + 'T00:00:00.000Z')
      const dateB = new Date(b.transactions[0]?.transaction_date + 'T00:00:00.000Z')
      return dateB.getTime() - dateA.getTime() // Most recent first
    })

  // Show loading state
  if (!nearbyTransactions || nearbyTransactions.length === 0) {
    return (
      <>
        {/* Full Width Layout */}
        <div className="space-y-6">
          {/* Valuation Display */}
          <ValuationDisplay
            valuation={null}
            strategy={valuationStrategy}
            onStrategyChange={handleStrategyChange}
            selectedCount={0}
            isLoading={true}
            subjectPropertyData={subjectPropertyData}
            hasLoadedInitialData={hasLoadedInitialData}
          />

          {/* Selected Comparables Section */}
          {hasLoadedInitialData && selectedProperties.length > 0 && (
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 min-h-[200px]">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Selected Comparables ({selectedProperties.length})
              </h3>
              <div className="space-y-3">
                {selectedProperties.map(property => (
                  <TransactionCard
                    key={property.street_group_property_id}
                    property={property}
                    isSelected={true}
                    onSelect={() => handleSelectComparable(property.street_group_property_id)}
                    onDeselect={() => handleDeselectComparable(property.street_group_property_id)}
                    onViewDetails={() => handleViewDetails(property)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <TransactionCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Show empty state
  if (groupedProperties.length === 0) {
    return (
      <>
        {/* Full Width Layout */}
        <div className="space-y-6">
          {/* Valuation Display */}
          <ValuationDisplay
            valuation={null}
            strategy={valuationStrategy}
            onStrategyChange={handleStrategyChange}
            selectedCount={0}
            isLoading={false}
            subjectPropertyData={subjectPropertyData}
            hasLoadedInitialData={hasLoadedInitialData}
          />

          {/* Selected Comparables Section */}
          {hasLoadedInitialData && (
            <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 min-h-[200px]">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">
                Selected Comparables ({selectedProperties.length})
              </h3>
              {selectedProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-4">Selected comparables from the list below will show here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProperties.map(property => (
                    <TransactionCard
                      key={property.street_group_property_id}
                      property={property}
                      isSelected={true}
                      onSelect={() => handleSelectComparable(property.street_group_property_id)}
                      onDeselect={() => handleDeselectComparable(property.street_group_property_id)}
                      onViewDetails={() => handleViewDetails(property)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-50">🏘️</div>
              <h3 className="text-xl font-semibold text-gray-200 mb-3">No Nearby Transactions</h3>
              <p className="text-gray-400">No comparable transactions found for this property.</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Full Width Layout */}
      <div className="space-y-6">
        {/* Valuation Display */}
        <ValuationDisplay
          valuation={calculatedValuation}
          strategy={valuationStrategy}
          onStrategyChange={handleStrategyChange}
          selectedCount={selectedComparableIds.length}
          isLoading={isLoadingValuation}
          subjectPropertyData={subjectPropertyData}
          hasLoadedInitialData={hasLoadedInitialData}
        />

        {/* Selected Comparables Section */}
        {hasLoadedInitialData && (
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4 min-h-[200px]">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">
              Selected Comparables ({selectedProperties.length})
            </h3>
            {selectedProperties.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-4">Selected comparables from the list below will show here</p>
                <button
                  onClick={handleAISelectComparables}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 text-sm font-medium inline-flex items-center gap-2"
                >
                    <svg
                      className="w-4 h-4 text-white drop-shadow"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path d="M12 2l1.8 4.6L18 8.4l-4.2 1.8L12 15l-1.8-4.8L6 8.4l4.2-1.8L12 2z" fill="currentColor" opacity="0.9"/>
                      <path d="M19 11l1 2.6L23 14l-3 1.2L19 18l-1-2.8L15 14l3-0.4L19 11z" fill="currentColor" opacity="0.7"/>
                      <path d="M6 12l0.9 2.2L9 15l-2.1 0.8L6 18l-0.9-2.2L3 15l2.1-0.2L6 12z" fill="currentColor" opacity="0.7"/>
                    </svg>
                    Auto-select comparables with AI
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProperties.map(property => (
                  <TransactionCard
                    key={property.street_group_property_id}
                    property={property}
                    isSelected={true}
                    onSelect={() => handleSelectComparable(property.street_group_property_id)}
                    onDeselect={() => handleDeselectComparable(property.street_group_property_id)}
                    onViewDetails={() => handleViewDetails(property)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nearby Transactions Section */}
        <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              {!hasLoadedInitialData ? (
                <>
                  <div className="h-6 bg-gray-700/30 rounded w-64 animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-700/30 rounded w-48 animate-pulse"></div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-100">
                    Available nearby transactions ({availableProperties.length})
                  </h3>
                </>
              )}
            </div>
            
            {/* Sort Dropdown */}
            {hasLoadedInitialData && (
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-black/40 border border-gray-600 rounded-md px-3 py-2 pr-10 text-xs font-medium text-gray-100 focus:outline-none focus:border-purple-400 appearance-none"
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
            )}
          </div>

          {/* Filters */}
          <div className="mb-4">
            {!hasLoadedInitialData ? (
              // Filters Skeleton
              <div className="bg-black/20 border border-gray-500/30 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-gray-700/30 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-700/30 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <FilterControls
                filters={filters}
                onFiltersChange={setFilters}
                propertyTypes={propertyTypes}
                totalCount={groupedProperties.length}
                filteredCount={filteredProperties.length}
              />
            )}
          </div>
            
            <div className="space-y-3">
              {!hasLoadedInitialData ? (
                // Skeleton loading state
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-black/20 border border-gray-500/30 rounded-lg p-4 animate-pulse">
                    <div className="flex gap-4">
                      {/* Street View Image Skeleton */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-700/30 rounded-lg"></div>
                      </div>
                      
                      {/* Property Details Skeleton */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700/30 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-1/2"></div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="h-6 bg-gray-700/30 rounded w-20 mb-1"></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4">
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-16"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                          </div>
                          <div className="text-right">
                            <div className="h-3 bg-gray-700/30 rounded w-16 mb-1"></div>
                            <div className="h-3 bg-gray-700/30 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {availableProperties.map(property => (
                    <TransactionCard
                      key={property.street_group_property_id}
                      property={property}
                      isSelected={selectedComparableIds.includes(property.street_group_property_id)}
                      onSelect={() => handleSelectComparable(property.street_group_property_id)}
                      onDeselect={() => handleDeselectComparable(property.street_group_property_id)}
                      onViewDetails={() => handleViewDetails(property)}
                    />
                  ))}
                  {availableProperties.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No properties match the current filters
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
    </>
  )
}
