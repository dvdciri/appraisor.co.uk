'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Toast from '../components/Toast'
import PostcodeSearch from '../components/PostcodeSearch'
import AddressSelector from '../components/AddressSelector'
import RecentSearches from '../components/RecentSearches'
import WorkingUserMenu from '../components/WorkingUserMenu'
import { 
  saveCalculatorData, 
  type CalculatorData,
  extractUPRN,
  saveGenericProperty
} from '../../lib/persistence'

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

interface Address {
  id: string
  address: string
  postcode: string
  full_address: string
  uprn: string
  building_name?: string
  building_number?: string
  line_1: string
  line_2?: string
  line_3?: string
  post_town: string
  county: string
}

type SearchStep = 'postcode' | 'address' | 'analyzing'

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SearchStep>('postcode')
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPostcode, setSelectedPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState('53.4808,-2.2426') // Default to Manchester

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

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


  // Function to get coordinates from postcode
  const getCoordinatesFromPostcode = async (postcode: string) => {
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`)
      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          const { latitude, longitude } = data.result
          return `${latitude},${longitude}`
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates for postcode:', error)
    }
    return null
  }

  const saveToRecentAnalyses = async (data: any, searchAddress: string, searchPostcode: string) => {
    const analysisId = generateUID()
    console.log('Creating new analysis with UID:', analysisId)
    
    // Extract UPRN from property data
    const uprn = extractUPRN(data)
    if (!uprn) {
      console.error('Failed to extract UPRN from property data')
      throw new Error('Property data missing UPRN')
    }

    // Save generic property data
    await saveGenericProperty(uprn, data)
    
    // Create calculator data with default values
    const calculatorData: CalculatorData = {
      notes: '',
      purchaseType: 'mortgage',
      includeFeesInLoan: false,
      bridgingDetails: {
        loanType: 'serviced',
        duration: '12',
        grossLoanPercent: '70',
        monthlyInterest: '0.75',
        applicationFee: '1500'
      },
      exitStrategy: null,
      refinanceDetails: {
        expectedGDV: '0',
        newLoanLTV: '75',
        interestRate: '5.5',
        brokerFees: '0',
        legalFees: '0'
      },
      saleDetails: {
        expectedSalePrice: '0',
        agencyFeePercent: '1.5',
        legalFees: '0'
      },
      refurbItems: [],
      fundingSources: [],
      initialCosts: {
        refurbRepair: '0',
        legal: '0',
        stampDutyPercent: '0',
        ila: '0',
        brokerFees: '0',
        auctionFees: '0',
        findersFee: '0'
      },
      purchaseFinance: {
        purchasePrice: '0',
        deposit: '0',
        ltv: '75',
        loanAmount: '0',
        productFee: '0',
        interestRate: '5.5'
      },
      monthlyIncome: {
        rent1: '0',
        rent2: '0',
        rent3: '0',
        rent4: '0',
        rent5: '0'
      },
      monthlyExpenses: {
        serviceCharge: '0',
        groundRent: '0',
        maintenancePercent: '10',
        managementPercent: '10',
        insurance: '0',
        mortgagePayment: '0'
      },
      propertyValue: '0'
    }

    // Save calculator data
    await saveCalculatorData(uprn, calculatorData)
    
    return analysisId
  }

  const handlePostcodeSubmit = async (submittedPostcode: string) => {
    setPostcode(submittedPostcode)
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // Get coordinates for the postcode to update map
      const coordinates = await getCoordinatesFromPostcode(submittedPostcode)
      if (coordinates) {
        setMapCenter(coordinates)
      }

      const response = await fetch(`/api/postcode/addresses?postcode=${encodeURIComponent(submittedPostcode)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to find addresses for this postcode')
        return
      }

      const data = await response.json()
      setAddresses(data.addresses || [])
      setCurrentStep('address')
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setErrorMessage('Failed to fetch addresses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = async (address: string, postcode: string) => {
    setSelectedAddress(address)
    setSelectedPostcode(postcode)
    setCurrentStep('analyzing')
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

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
        setCurrentStep('address')
        return
      }
      
      const data = await response.json()
      console.log('Property data received:', data)
      
      // Save to recent analyses
      const analysisId = await saveToRecentAnalyses(data, address, postcode)
      
      // Extract UPRN and redirect to dashboard with UPRN
      const uprn = extractUPRN(data)
      if (uprn) {
        router.push(`/dashboard/${uprn}`)
      } else {
        console.error('Failed to extract UPRN from property data')
        setErrorMessage('Failed to process property data. Please try again.')
        setCurrentStep('address')
      }
      
    } catch (error) {
      console.error('Error analyzing property:', error)
      setErrorMessage('Failed to analyze property. Please try again.')
      setCurrentStep('address')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPostcode = () => {
    setCurrentStep('postcode')
    setAddresses([])
    setSelectedAddress('')
    setSelectedPostcode('')
    setErrorMessage(null)
    setMapCenter('53.4808,-2.2426') // Reset to Manchester
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'postcode':
        return (
          <div className="space-y-4">
            <PostcodeSearch
              onPostcodeSubmit={handlePostcodeSubmit}
              loading={loading}
              error={errorMessage}
            />
          </div>
        )
      
      case 'address':
        return (
          <AddressSelector
            postcode={postcode}
            addresses={addresses}
            onAddressSelect={handleAddressSelect}
            onBack={handleBackToPostcode}
            loading={loading}
          />
        )
      
      case 'analyzing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-bg-subtle border-t-accent mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-fg-primary mb-2">Analyzing Property</h2>
            <p className="text-fg-muted">Please wait while we gather property information...</p>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Google Maps Static Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{
          backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=53.4808,-2.2426&zoom=12&size=3840x2160&maptype=roadmap&scale=2&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY})`,
          imageRendering: 'crisp-edges'
        }}
      />
      
      {/* Simple Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Floating Top Menu Bar */}
      <header className="fixed top-0 left-0 right-0 z-[999] p-6">
        <div className="flex items-center justify-between rounded-2xl px-6 py-4 shadow-2xl" style={{ backgroundColor: 'rgba(30, 15, 45, 0.9)' }}>
          {/* Left side - Appraisor branding */}
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
          
          {/* Right side - Credits indicator and Profile avatar */}
          <div className="flex items-center gap-6">
            {/* Credits indicator */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-sm">30 Credits available</span>
            </div>
            
            {/* User profile with dropdown menu */}
            <WorkingUserMenu user={session.user || { name: 'User', email: 'user@example.com' }} />
          </div>
        </div>
      </header>

      {/* Error Toast */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Success Toast */}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      {/* Main Content */}
      <main className={`relative z-50 h-screen flex px-6 py-6 pt-32 pb-6 ${
        currentStep === 'postcode' ? 'items-center justify-center' : 'items-start justify-center'
      }`}>
        <div className="w-full max-w-2xl h-full flex flex-col">
          {/* Search Form */}
          <div className={`relative rounded-2xl p-8 shadow-2xl animate-search-enter-fast flex flex-col overflow-hidden ${
            currentStep === 'postcode' ? 'h-auto' : 'h-full'
          }`}>
            {/* Simple background for search box */}
            <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: 'rgba(30, 15, 45, 0.9)' }} />
            
            {/* Content with proper z-index */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="text-center mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold text-white mb-2">Search for a property</h1>
                <p className="text-gray-300 text-sm">
                  {currentStep === 'postcode' && 'Find comprehensive insights for any property'}
                  {currentStep === 'address' && 'Find comprehensive insights for any property'}
                  {currentStep === 'analyzing' && 'Analyzing your property...'}
                </p>
              </div>
              
              <div className={currentStep === 'postcode' ? 'flex flex-col' : 'flex-1 flex flex-col min-h-0'}>
                {renderCurrentStep()}
                
                {/* Recent Searches - only show on postcode step */}
                {currentStep === 'postcode' && (
                  <div className="mt-6">
                    <RecentSearches />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
