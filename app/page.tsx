'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from './components/Header'
import Toast from './components/Toast'
import StreetViewImage from './components/StreetViewImage'
import { 
  saveCalculatorData, 
  type CalculatorData,
  extractUPRN,
  saveGenericProperty,
  saveUserAnalysis,
  type UserAnalysis,
  getUserAnalysis,
  autoMigrate,
  loadUserAnalysesStore,
  deleteProperty,
  loadRecentAnalyses,
  getFullAnalysisData,
  saveRecentAnalyses,
  saveUserAnalysesStore,
  savePropertiesStore
} from '../lib/persistence'

// Generate a simple UID
const generateUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

interface PropertyData {
  data: {
    attributes: {
      address: {
        street_group_format: {
          address_lines: string
          postcode: string
        }
      }
      tenure: {
        tenure_type: string
      }
      number_of_bedrooms: {
        value: number
      }
      number_of_bathrooms: {
        value: number
      }
      internal_area_square_metres: number
      energy_performance: {
        energy_efficiency: {
          current_rating: string
        }
      }
      location?: {
        coordinates?: {
          latitude: number
          longitude: number
        }
      }
      property_type?: {
        value: string
      }
      [key: string]: any
    }
  }
}

interface RecentAnalysis {
  id: string
  searchDate: string
  comparables: string[]
  filters: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }
}

// Component to display a single property in the recent list
function RecentPropertyItem({ analysis, index, onClick, onDelete }: { analysis: RecentAnalysis, index: number, onClick: () => void, onDelete: () => void }) {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        const fullData = await getFullAnalysisData(analysis.id)
        if (fullData) {
          // Combine property data with user analysis for backward compatibility
          const combined = {
            ...fullData.propertyData,
            calculatedValuation: fullData.userAnalysis.calculatedValuation,
            valuationBasedOnComparables: fullData.userAnalysis.valuationBasedOnComparables,
            lastValuationUpdate: fullData.userAnalysis.lastValuationUpdate
          }
          setPropertyData(combined)
        }
      } catch (e) {
        console.error('Failed to load property data for list item:', e)
      }
    }
    
    loadAnalysisData()
  }, [analysis.id])

  if (!propertyData) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 animate-pulse">
        <div className="h-16 bg-gray-600 rounded"></div>
      </div>
    )
  }

  const attributes = propertyData.data.attributes
  const address = attributes.address.street_group_format.address_lines
  const postcode = attributes.address.street_group_format.postcode
  const propertyType = attributes.property_type?.value || 'Unknown'
  const bedrooms = attributes.number_of_bedrooms?.value || 0
  const bathrooms = attributes.number_of_bathrooms?.value || 0
  const latitude = attributes.location?.coordinates?.latitude || 0
  const longitude = attributes.location?.coordinates?.longitude || 0

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      className={`bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition-colors border border-gray-600 hover:border-gray-500 ${
        index === 0 ? 'animate-enter-subtle-delayed-2' : 
        index === 1 ? 'animate-enter-subtle-delayed-3' : 
        'animate-enter-subtle-delayed-3'
      }`}
      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
    >
      <div className="flex items-center gap-4">
        {/* Street View Image */}
        <div className="flex-shrink-0 cursor-pointer" onClick={onClick}>
          <StreetViewImage
            latitude={latitude}
            longitude={longitude}
            address={address}
            className="w-20 h-16"
          />
        </div>
        
        {/* Property Details */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-semibold text-sm truncate" title={address}>
              {address}
            </h3>
            <span className="text-gray-400 text-xs whitespace-nowrap">
              {postcode}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{propertyType}</span>
            <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
            <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        {/* Date and Delete Button */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {new Date(analysis.searchDate).toLocaleDateString()}
          </span>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
            title="Delete property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [propertySearchTerm, setPropertySearchTerm] = useState('')

  // Run migration on mount and load recent analyses
  useEffect(() => {
    const loadRecentAnalysesData = async () => {
      autoMigrate()
      
      // Load from new storage structure
      const recentList = await loadRecentAnalyses()
      
      // Convert new format to old format for backward compatibility
      const analyses: RecentAnalysis[] = await Promise.all(
        recentList.map(async (item: any) => {
          const userAnalysis = await getUserAnalysis(item.analysisId)
          if (userAnalysis) {
            return {
              id: item.analysisId,
              searchDate: new Date(item.timestamp).toISOString(),
              comparables: userAnalysis.selectedComparables,
              filters: userAnalysis.filters
            }
          }
          return null
        })
      ).then(results => results.filter((a: any): a is RecentAnalysis => a !== null))
      
      setRecentAnalyses(analyses)
    }
    
    loadRecentAnalysesData()
  }, [])

  const loadRecentAnalysis = (analysis: RecentAnalysis) => {
    console.log('Loading analysis:', analysis.id, 'with comparables:', analysis.comparables)
    router.push(`/details/${analysis.id}?ref=recent`)
  }

  const clearRecentAnalyses = () => {
    setRecentAnalyses([])
    
    // Clear new storage
    saveRecentAnalyses([])
    saveUserAnalysesStore({})
    // Note: We keep generic properties as they might be referenced by other data
    
    // Clear legacy storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('recentAnalyses')
      localStorage.removeItem('propertyDataStore')
    }
  }

  const handleDeleteProperty = (propertyId: string) => {
    deleteProperty(propertyId)
    setRecentAnalyses(prev => prev.filter(a => a.id !== propertyId))
  }

  // Filter properties based on search term
  const filteredAnalyses = recentAnalyses.filter(analysis => {
    if (!propertySearchTerm) return true
    
    // Note: This is a synchronous filter, but getFullAnalysisData is now async
    // For now, we'll skip the search filtering to avoid async issues in filter
    // TODO: Implement proper async filtering if needed
    return true
  })

  const saveToRecentAnalyses = (data: any, searchAddress: string, searchPostcode: string) => {
    const analysisId = generateUID()
    console.log('Creating new analysis with UID:', analysisId)
    
    // Extract UPRN from property data
    const uprn = extractUPRN(data)
    if (!uprn) {
      console.error('Failed to extract UPRN from property data')
      throw new Error('Property data missing UPRN')
    }
    
    console.log('Property UPRN:', uprn)
    
    // Save generic property data (shared across all users)
    saveGenericProperty(uprn, data)
    console.log('Saved generic property data for UPRN:', uprn)
    
    // Auto-select comparables based on criteria and calculate valuation
    const autoSelectedComparables: string[] = []
    let calculatedValuation = 0
    
    if (data.data.attributes.nearby_completed_transactions) {
      const propertyBeds = data.data.attributes.number_of_bedrooms?.value
      const propertyBaths = data.data.attributes.number_of_bathrooms?.value
      const propertyType = data.data.attributes.property_type?.value
      
      // Filter comparables: sold within last year, same beds/baths/type
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      const matchingTransactions = data.data.attributes.nearby_completed_transactions.filter((transaction: any) => {
        // Must have been sold within the last year
        const transactionDate = new Date(transaction.transaction_date)
        if (transactionDate < oneYearAgo) return false
        
        // Must have same number of bedrooms
        if (propertyBeds && transaction.number_of_bedrooms !== propertyBeds) return false
        
        // Must have same number of bathrooms
        if (propertyBaths && transaction.number_of_bathrooms !== propertyBaths) return false
        
        // Must be same property type
        if (propertyType && transaction.property_type !== propertyType) return false
        
        return true
      })
      
      // Get property IDs of matching transactions
      autoSelectedComparables.push(...matchingTransactions.map((t: any) => t.street_group_property_id))
      console.log('Auto-selected', autoSelectedComparables.length, 'comparables based on criteria')
      
      // Calculate average valuation from matching transactions
      if (matchingTransactions.length > 0) {
        const totalPrice = matchingTransactions.reduce((sum: number, t: any) => sum + (t.price || 0), 0)
        calculatedValuation = Math.round(totalPrice / matchingTransactions.length)
        console.log('Calculated valuation:', calculatedValuation, 'from', matchingTransactions.length, 'comparables')
      }
    }
    
    // Create user analysis (user-specific data)
    const userAnalysis: UserAnalysis = {
      uprn,
      searchAddress,
      searchPostcode,
      timestamp: Date.now(),
      selectedComparables: autoSelectedComparables,
      calculatedValuation,
      valuationBasedOnComparables: autoSelectedComparables.length,
      lastValuationUpdate: Date.now(),
      filters: {
        propertyType: '',
        minBeds: '',
        maxBeds: '',
        minBaths: '',
        maxBaths: ''
      }
    }
    
    // Save user analysis (this also updates recent analyses list)
    saveUserAnalysis(analysisId, userAnalysis)
    console.log('Saved user analysis with calculated valuation')
    
    // Create default calculator data with pre-filled values
    const defaultCalculatorData: CalculatorData = {
      purchaseType: 'mortgage',
      includeFeesInLoan: false,
      bridgingDetails: {
        loanType: 'serviced',
        duration: '',
        grossLoanPercent: '75',
        monthlyInterest: '',
        applicationFee: ''
      },
      exitStrategy: null,
      refinanceDetails: {
        expectedGDV: '',
        newLoanLTV: '',
        interestRate: '',
        brokerFees: '',
        legalFees: ''
      },
      saleDetails: {
        expectedSalePrice: '',
        agencyFeePercent: '',
        legalFees: ''
      },
      refurbItems: [{ id: 1, description: '', amount: '' }],
      fundingSources: [{ id: 1, name: 'Personal', amount: '', interestRate: '', duration: '' }],
      initialCosts: {
        refurbRepair: '',
        legal: '',
        stampDutyPercent: '',
        ila: '',
        brokerFees: '',
        auctionFees: '',
        findersFee: ''
      },
      purchaseFinance: {
        purchasePrice: calculatedValuation > 0 ? calculatedValuation.toString() : '',
        deposit: '',
        ltv: '75',
        loanAmount: '',
        productFee: '',
        interestRate: ''
      },
      monthlyIncome: {
        rent1: '',
        rent2: '',
        rent3: '',
        rent4: '',
        rent5: ''
      },
      monthlyExpenses: {
        serviceCharge: '',
        groundRent: '',
        maintenancePercent: '',
        managementPercent: '',
        insurance: '',
        mortgagePayment: ''
      },
      propertyValue: ''
    }
    
    // Save default calculator data immediately
    saveCalculatorData(analysisId, defaultCalculatorData)
    console.log('Saved default calculator data with pre-filled purchase price:', calculatedValuation || 'No valuation calculated')
    
    return analysisId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !postcode) return

    setLoading(true)
    setErrorMessage(null)
    
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, postcode }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to find property. Please check the address and postcode and try again.')
        return
      }
      
      const data = await response.json()
      
      // Check if data is valid
      if (!data || !data.data || !data.data.attributes) {
        setErrorMessage('Property not found. Please check the address and postcode and try again.')
        return
      }
      
      // Extract UPRN to check if we already have this property
      const uprn = extractUPRN(data)
      
      if (uprn) {
        // Check if we already have an analysis for this property (search by UPRN)
        const userAnalysesStore = await loadUserAnalysesStore()
        const existingAnalysisId = Object.keys(userAnalysesStore).find(id => 
          userAnalysesStore[id].uprn === uprn
        )
        
        if (existingAnalysisId) {
          console.log('Property already exists with UPRN:', uprn, 'Analysis ID:', existingAnalysisId)
          // Navigate to existing analysis details page
          router.push(`/details/${existingAnalysisId}`)
          return
        }
      }
      
      // Save to recent analyses and get the analysis ID
      const analysisId = saveToRecentAnalyses(data, address, postcode)
      
      // Refresh the recent analyses list
      const recentList = await loadRecentAnalyses()
      const analyses: RecentAnalysis[] = await Promise.all(
        recentList.map(async (item: any) => {
          const userAnalysis = await getUserAnalysis(item.analysisId)
          if (userAnalysis) {
            return {
              id: item.analysisId,
              searchDate: new Date(item.timestamp).toISOString(),
              comparables: userAnalysis.selectedComparables,
              filters: userAnalysis.filters
            }
          }
          return null
        })
      ).then(results => results.filter((a: any): a is RecentAnalysis => a !== null))
      setRecentAnalyses(analyses)
      
      // Navigate to the new analysis details page
      console.log('Navigating to details page with UID:', analysisId)
      router.push(`/details/${analysisId}`)
    } catch (error) {
      console.error('Error fetching property data:', error)
      setErrorMessage('An error occurred while searching for the property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Error Toast */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
      
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="space-y-6">
              {/* Search Form */}
              <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter property address"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="postcode" className="block text-sm font-medium text-gray-300 mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        id="postcode"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter postcode"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    {loading ? 'Finding Property...' : 'Find Property'}
                  </button>
                </form>
              </div>

              {/* Action Menu Grid */}
              <div className="grid grid-cols-2 gap-4 animate-enter-subtle-delayed">
                {/* Lists */}
                <button
                  type="button"
                  onClick={() => router.push('/lists')}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors border-2 border-gray-700 hover:border-green-600 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 group-hover:bg-green-500 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Lists</h3>
                      <p className="text-gray-400 text-sm mt-1">Organize properties</p>
                    </div>
                  </div>
                </button>

                {/* Tasks */}
                <button
                  type="button"
                  onClick={() => router.push('/tasks')}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors border-2 border-gray-700 hover:border-red-600 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Tasks</h3>
                      <p className="text-gray-400 text-sm mt-1">Powered by Todoist</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Properties List */}
              {recentAnalyses.length > 0 ? (
                <div className="bg-gray-800 rounded-lg p-6 animate-enter-subtle-delayed-2">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">
                      All Properties
                      {propertySearchTerm && filteredAnalyses.length !== recentAnalyses.length && (
                        <span className="text-gray-400 text-sm ml-2">
                          ({filteredAnalyses.length} of {recentAnalyses.length})
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Filter Input */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={propertySearchTerm}
                        onChange={(e) => setPropertySearchTerm(e.target.value)}
                        placeholder="Filter by address or postcode"
                        className="w-full px-4 py-3 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {filteredAnalyses.length > 0 ? (
                      filteredAnalyses.map((analysis, index) => (
                        <RecentPropertyItem
                          key={analysis.id}
                          analysis={analysis}
                          index={index}
                          onClick={() => loadRecentAnalysis(analysis)}
                          onDelete={() => handleDeleteProperty(analysis.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No properties match your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
        </div>
      </div>
    </main>
  )
}
