'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import PropertyDetails from '../../components/PropertyDetails'
import Header from '../../components/Header'

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

  // Smart back navigation based on referrer
  const handleBackClick = () => {
    const referrer = searchParams.get('ref')
    
    if (referrer === 'recent') {
      router.push('/recent')
    } else if (referrer === 'lists') {
      router.push('/lists')
    } else {
      router.back()
    }
  }

  // Load property data from localStorage based on ID - NO API CALLS
  useEffect(() => {
    try {
      const savedAnalyses = typeof window !== 'undefined' ? localStorage.getItem('recentAnalyses') : null
      
      console.log('Loading property data for UID:', params.id)
      console.log('Saved analyses:', savedAnalyses ? JSON.parse(savedAnalyses).length : 0, 'items')
      
      if (savedAnalyses && params.id) {
        const analyses = JSON.parse(savedAnalyses)
        console.log('Available analysis UIDs:', analyses.map((a: any) => a.id))
        
        const analysis = analyses.find((a: any) => a.id === params.id)
        
        if (analysis) {
          console.log('Found analysis with UID:', analysis.id)
          
          // Load from property data store (single source of truth)
          try {
            const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
            const propertyData = propertyDataStore[params.id as string]
            if (propertyData) {
              console.log('Loaded property data from propertyDataStore')
              setPropertyData(propertyData)
            } else {
              console.error('No property data found in propertyDataStore for:', params.id)
            }
          } catch (e) {
            console.error('Failed to load from propertyDataStore:', e)
          }
          
          setComparables(new Set(analysis.comparables))
          setFilters(analysis.filters)
        } else {
          console.error('No analysis found with UID:', params.id)
          // Fallback: try to load the most recent analysis
          if (analyses.length > 0) {
            const mostRecentId = analyses[0].id
            console.log('Falling back to most recent analysis with UID:', mostRecentId)
            
            try {
              const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
              const propertyData = propertyDataStore[mostRecentId]
              if (propertyData) {
                setPropertyData(propertyData)
              }
            } catch (e) {
              console.error('Failed to load fallback property data:', e)
            }
            
            setComparables(new Set(analyses[0].comparables))
            setFilters(analyses[0].filters)
          }
        }
      } else {
        console.error('No saved analyses found or no UID provided')
      }
    } catch (e) {
      console.error('Failed to load property data', e)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const updateComparables = (newComparables: Set<string>) => {
    setComparables(newComparables)
    
    // Update the analysis data in recentAnalyses
    try {
      if (typeof window !== 'undefined' && params.id) {
        const savedAnalyses = localStorage.getItem('recentAnalyses')
        if (savedAnalyses) {
          const analyses = JSON.parse(savedAnalyses)
          const analysisIndex = analyses.findIndex((a: any) => a.id === params.id)
          
          if (analysisIndex !== -1) {
            // Update the analysis with new comparables
            analyses[analysisIndex].comparables = Array.from(newComparables)
            localStorage.setItem('recentAnalyses', JSON.stringify(analyses))
            console.log('Updated comparables in analysis:', params.id, 'with', newComparables.size, 'items')
          }
        }
        
        // Also update the separate comparables key for backward compatibility
        localStorage.setItem('comparables', JSON.stringify(Array.from(newComparables)))
      }
    } catch (e) {
      console.error('Failed to save comparables', e)
    }
  }

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters)
    
    // Update the analysis data in recentAnalyses
    try {
      if (typeof window !== 'undefined' && params.id) {
        const savedAnalyses = localStorage.getItem('recentAnalyses')
        if (savedAnalyses) {
          const analyses = JSON.parse(savedAnalyses)
          const analysisIndex = analyses.findIndex((a: any) => a.id === params.id)
          
          if (analysisIndex !== -1) {
            // Update the analysis with new filters
            analyses[analysisIndex].filters = newFilters
            localStorage.setItem('recentAnalyses', JSON.stringify(analyses))
            console.log('Updated filters in analysis:', params.id)
          }
        }
        
        // Also update the separate filters key for backward compatibility
        localStorage.setItem('soldNearbyFilters', JSON.stringify(newFilters))
      }
    } catch (e) {
      console.error('Failed to save filters', e)
    }
  }

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
            />
          </div>
        </div>
      </div>
    </main>
  )
}
