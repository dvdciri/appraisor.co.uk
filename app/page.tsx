'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from './components/Toast'
import PostcodeSearch from './components/PostcodeSearch'
import AddressSelector from './components/AddressSelector'
import { 
  saveCalculatorData, 
  type CalculatorData,
  extractUPRN,
  saveGenericProperty
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

export default function Home() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SearchStep>('postcode')
  const [postcode, setPostcode] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPostcode, setSelectedPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      
      setSuccessMessage('Property found successfully! Redirecting to analysis...')
      
      // Redirect to analysis page
      setTimeout(() => {
        router.push(`/analyse/${analysisId}`)
      }, 1500)
      
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
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'postcode':
        return (
          <PostcodeSearch
            onPostcodeSubmit={handlePostcodeSubmit}
            loading={loading}
            error={errorMessage}
          />
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
    <main className="min-h-screen bg-bg-app text-fg-primary">
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
      
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Search Form */}
          <div className="bg-bg-elevated border border-border rounded-lg p-8 animate-enter-subtle">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-fg-primary mb-2">Property Analysis</h1>
              <p className="text-fg-muted">
                {currentStep === 'postcode' && 'Enter a UK postcode to get started'}
                {currentStep === 'address' && 'Select your property address'}
                {currentStep === 'analyzing' && 'Analyzing your property...'}
              </p>
            </div>
            
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </main>
  )
}