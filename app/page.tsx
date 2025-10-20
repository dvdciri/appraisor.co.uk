'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from './components/Header'
import Toast from './components/Toast'
import AddressAutocomplete from './components/AddressAutocomplete'
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


export default function Home() {
  const router = useRouter()
  const [fullAddress, setFullAddress] = useState('')
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
    
    // Save generic property data (shared across all users)
    saveGenericProperty(uprn, data)
    
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
        purchasePrice: '',
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
    
    // Save default calculator data
    await saveCalculatorData(analysisId, defaultCalculatorData)
    
    return analysisId
  }

  const handleAddressSelect = (address: string, postcode: string) => {
    setSelectedAddress(address)
    setSelectedPostcode(postcode)
  }

  const handleAddressChange = (value: string) => {
    setFullAddress(value)
    // Clear selected address if user types manually
    if (!value.includes(selectedAddress) || !value.includes(selectedPostcode)) {
      setSelectedAddress('')
      setSelectedPostcode('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAddress || !selectedPostcode) {
      setErrorMessage('Please select an address from the suggestions')
      return
    }

    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: selectedAddress, postcode: selectedPostcode }),
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
      
      // Extract UPRN for property data storage
      const uprn = extractUPRN(data)
      
      if (uprn) {
        // Save property data to database
        await saveGenericProperty(uprn, data)
        setSuccessMessage(`Property data saved successfully! UPRN: ${uprn}`)
        console.log('Property data saved with UPRN:', uprn)
      } else {
        setErrorMessage('Failed to extract property identifier from the data.')
      }
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

      {/* Success Toast */}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="space-y-6">
              {/* Search Form */}
              <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                      Property Address
                    </label>
                    <AddressAutocomplete
                      onAddressSelect={handleAddressSelect}
                      onChange={handleAddressChange}
                      value={fullAddress}
                      placeholder="Enter property address"
                    />
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


            </div>
        </div>
      </div>
    </main>
  )
}
