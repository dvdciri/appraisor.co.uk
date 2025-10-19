'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import PropertyDetails from '../../components/PropertyDetails'
import Header from '../../components/Header'
import Dialog from '../../components/Dialog'

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
      [key: string]: any
    }
  }
}

export default function PropertyDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparables, setComparables] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    propertyType: '',
    minBeds: '',
    maxBeds: '',
    minBaths: '',
    maxBaths: ''
  })
  
  // Notes state
  const [notes, setNotes] = useState<string>('')
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [tempNotes, setTempNotes] = useState('')
  const isInitialLoadRef = useRef(true)

  // Smart back navigation based on referrer
  const handleBackClick = () => {
    const referrer = searchParams.get('ref')
    
    if (referrer === 'recent') {
      router.push('/')
    } else if (referrer === 'lists') {
      router.push('/lists')
    } else {
      router.back()
    }
  }

  // Load property data from localStorage based on ID - NO API CALLS
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('../../../lib/persistence').then(async ({ getFullAnalysisData, loadRecentAnalyses, autoMigrate, loadCalculatorData }) => {
      try {
        // Run migration first
        autoMigrate()
        
        console.log('Loading property data for UID:', params.id)
        
        if (params.id) {
          // Load from new storage structure
          const fullData = await getFullAnalysisData(params.id as string)
          
          if (fullData) {
            console.log('Loaded property data from new storage structure')
            // Combine property data with user analysis for backward compatibility
            setPropertyData({
              ...fullData.propertyData,
              calculatedValuation: fullData.userAnalysis.calculatedValuation,
              valuationBasedOnComparables: fullData.userAnalysis.valuationBasedOnComparables,
              lastValuationUpdate: fullData.userAnalysis.lastValuationUpdate,
              calculatedRent: fullData.userAnalysis.calculatedRent,
              rentBasedOnComparables: fullData.userAnalysis.rentBasedOnComparables,
              lastRentUpdate: fullData.userAnalysis.lastRentUpdate,
              calculatedYield: fullData.userAnalysis.calculatedYield,
              lastYieldUpdate: fullData.userAnalysis.lastYieldUpdate
            })
            setComparables(new Set(fullData.userAnalysis.selectedComparables))
            setFilters(fullData.userAnalysis.filters)
            
            // Load calculator data and extract notes
            const calculatorData = await loadCalculatorData(params.id as string)
            if (calculatorData?.notes) {
              setNotes(calculatorData.notes)
            }
          } else {
            console.error('No analysis found for UID:', params.id)
            
            // Fallback: try to load the most recent analysis
            const recentList = await loadRecentAnalyses()
            if (recentList.length > 0) {
              const mostRecentId = recentList[0].analysisId
              console.log('Falling back to most recent analysis with UID:', mostRecentId)
              
              const fallbackData = await getFullAnalysisData(mostRecentId)
              if (fallbackData) {
                setPropertyData({
                  ...fallbackData.propertyData,
                  calculatedValuation: fallbackData.userAnalysis.calculatedValuation,
                  valuationBasedOnComparables: fallbackData.userAnalysis.valuationBasedOnComparables,
                  lastValuationUpdate: fallbackData.userAnalysis.lastValuationUpdate,
                  calculatedRent: fallbackData.userAnalysis.calculatedRent,
                  rentBasedOnComparables: fallbackData.userAnalysis.rentBasedOnComparables,
                  lastRentUpdate: fallbackData.userAnalysis.lastRentUpdate,
                  calculatedYield: fallbackData.userAnalysis.calculatedYield,
                  lastYieldUpdate: fallbackData.userAnalysis.lastYieldUpdate
                })
                setComparables(new Set(fallbackData.userAnalysis.selectedComparables))
                setFilters(fallbackData.userAnalysis.filters)
                
                // Load calculator data and extract notes
                const calculatorData = await loadCalculatorData(mostRecentId)
                if (calculatorData?.notes) {
                  setNotes(calculatorData.notes)
                }
              }
            }
          }
        } else {
          console.error('No UID provided')
        }
      } catch (e) {
        console.error('Failed to load property data', e)
      } finally {
        setLoading(false)
      }
    })
  }, [params.id])

  const updateComparables = (newComparables: Set<string>) => {
    setComparables(newComparables)
    
    // Update the analysis data in new storage structure
    import('../../../lib/persistence').then(({ updateUserAnalysis }) => {
      try {
        if (typeof window !== 'undefined' && params.id) {
          updateUserAnalysis(params.id as string, {
            selectedComparables: Array.from(newComparables)
          })
          console.log('Updated comparables in analysis:', params.id, 'with', newComparables.size, 'items')
        }
      } catch (e) {
        console.error('Failed to save comparables', e)
      }
    })
  }

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters)
    
    // Update the analysis data in new storage structure
    import('../../../lib/persistence').then(({ updateUserAnalysis }) => {
      try {
        if (typeof window !== 'undefined' && params.id) {
          updateUserAnalysis(params.id as string, {
            filters: newFilters
          })
          console.log('Updated filters in analysis:', params.id)
        }
      } catch (e) {
        console.error('Failed to save filters', e)
      }
    })
  }

  // Notes handlers
  const handleOpenNotesDialog = () => {
    setTempNotes(notes)
    setIsNotesDialogOpen(true)
  }

  const handleSaveNotes = () => {
    setNotes(tempNotes)
    setIsNotesDialogOpen(false)
  }

  const handleCloseNotesDialog = () => {
    setIsNotesDialogOpen(false)
    setTempNotes(notes)
  }

  // Save notes when they change
  useEffect(() => {
    if (!params.id) return
    
    // Skip saving on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    import('../../../lib/persistence').then(async ({ loadCalculatorData, saveCalculatorData }) => {
      const currentData = await loadCalculatorData(params.id as string)
      if (currentData) {
        await saveCalculatorData(params.id as string, { ...currentData, notes })
      }
    })
  }, [notes, params.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={handleBackClick}
          backButtonText="Back"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-gray-400 animate-enter-subtle">
              Loading property details...
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!propertyData) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={handleBackClick}
          backButtonText="Back"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-gray-400 animate-enter-subtle">
              Property not found. Please search for a property first.
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Header 
        showBackButton={true}
        onBackClick={handleBackClick}
        backButtonText="Back"
        showHomeButton={true}
        onHomeClick={() => router.push('/')}
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-enter-subtle">
            <PropertyDetails 
              data={propertyData as any} 
              propertyId={params.id as string}
              comparables={comparables}
              filters={filters}
              onComparablesChange={updateComparables}
              onFiltersChange={updateFilters}
              onNotesClick={handleOpenNotesDialog}
              hasNotes={!!notes}
            />
          </div>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog
        title="Notes"
        isOpen={isNotesDialogOpen}
        onClose={handleCloseNotesDialog}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Add notes about your calculations, assumptions, or important details...
          </p>
          <textarea
            value={tempNotes}
            onChange={(e) => setTempNotes(e.target.value)}
            placeholder="Add notes about your calculations, assumptions, or important details..."
            className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCloseNotesDialog}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Notes
            </button>
          </div>
        </div>
      </Dialog>
    </main>
  )
}
