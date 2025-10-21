// Persistence utilities for database storage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data', // DEPRECATED - kept for migration
  CALCULATOR_DATA: 'estimo_calculator_data',
  // New storage keys
  PROPERTIES: 'estimo_properties' // Generic property data (keyed by UPRN)
} as const

// ============================================================================
// NEW DATA STRUCTURE - Separates generic property data from user-specific data
// ============================================================================

// Generic property data stored by UPRN (shared across all users)
export interface GenericPropertyData {
  data: any  // Full API response
  lastFetched: number
  fetchedCount: number
}

export interface PropertiesStore {
  [uprn: string]: GenericPropertyData
}


// ============================================================================
// DEPRECATED - Kept for migration only
// ============================================================================

export interface PersistedPropertyData {
  data: any
  lastUpdated: number
}

// REMOVED: Deprecated PropertyDataStoreItem interface

// REMOVED: Deprecated PropertyDataStore interface

export interface CalculatorData {
  notes?: string
  purchaseType: 'mortgage' | 'cash' | 'bridging'
  includeFeesInLoan: boolean
  bridgingDetails: {
    loanType: 'serviced' | 'retained'
    duration: string
    grossLoanPercent: string
    monthlyInterest: string
    applicationFee: string
  }
  exitStrategy: 'just-rent' | 'refinance-rent' | 'flip-sell' | null
  refinanceDetails: {
    expectedGDV: string
    newLoanLTV: string
    interestRate: string
    brokerFees: string
    legalFees: string
  }
  saleDetails: {
    expectedSalePrice: string
    agencyFeePercent: string
    legalFees: string
  }
  refurbItems: Array<{ id: number; description: string; amount: string }>
  fundingSources: Array<{ id: number; name: string; amount: string; interestRate: string; duration: string }>
  initialCosts: {
    refurbRepair: string
    legal: string
    stampDutyPercent: string
    ila: string
    brokerFees: string
    auctionFees: string
    findersFee: string
  }
  purchaseFinance: {
    purchasePrice: string
    deposit: string
    ltv: string
    loanAmount: string
    productFee: string
    interestRate: string
  }
  monthlyIncome: {
    rent1: string
    rent2: string
    rent3: string
    rent4: string
    rent5: string
  }
  monthlyExpenses: {
    serviceCharge: string
    groundRent: string
    maintenancePercent: string
    managementPercent: string
    insurance: string
    mortgagePayment: string
  }
  propertyValue: string
}

export interface PersistedCalculatorData {
  [propertyId: string]: {
    data: CalculatorData
    lastUpdated: number
  }
}


// REMOVED: Deprecated local storage functions


// REMOVED: Deprecated property data persistence functions


// Calculator data persistence (per property) - now using API routes
export async function saveCalculatorData(uprn: string, calculatorData: CalculatorData): Promise<void> {
  if (!uprn) return
  
  try {
    const response = await fetch('/api/db/calculator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uprn: uprn,
        data: calculatorData
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save calculator data: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to save calculator data to database:', error)
    throw error
  }
}

export async function loadCalculatorData(uprn: string): Promise<CalculatorData | null> {
  if (!uprn) return null
  
  try {
    const response = await fetch(`/api/db/calculator?uprn=${encodeURIComponent(uprn)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calculator data: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Failed to fetch calculator data from database:', error)
    return null
  }
}

// Clear all persisted data
export function clearAllPersistedData(): void {
  // localStorage cleanup no longer needed - using database only
}


// REMOVED: Deprecated property data store functions

// Delete a property from database
export async function deleteProperty(uprn: string): Promise<void> {
  // Delete calculator data for this property
  try {
    const response = await fetch(`/api/db/calculator?uprn=${encodeURIComponent(uprn)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete calculator data: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to delete calculator data from database:', error)
    throw error
  }
}

// ============================================================================
// NEW STORAGE FUNCTIONS
// ============================================================================

// Extract UPRN from property data
export function extractUPRN(propertyData: any): string | null {
  try {
    return propertyData?.data?.attributes?.identities?.ordnance_survey?.uprn || null
  } catch (e) {
    console.error('Failed to extract UPRN:', e)
    return null
  }
}

// Generic Properties Store (keyed by UPRN) - now using API routes
export async function loadPropertiesStore(): Promise<PropertiesStore> {
  // This function is kept for backward compatibility
  console.warn('loadPropertiesStore is deprecated, use getGenericProperty instead')
  return {}
}

export async function savePropertiesStore(store: PropertiesStore): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('savePropertiesStore is deprecated, use saveGenericProperty instead')
}

export async function saveGenericProperty(uprn: string, propertyData: any): Promise<void> {
  if (!uprn) return
  
  try {
    const response = await fetch('/api/db/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uprn,
        data: propertyData,
        lastFetched: Date.now(),
        fetchedCount: 1
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save property: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to save property to database:', error)
    throw error
  }
}

export async function getGenericProperty(uprn: string): Promise<GenericPropertyData | null> {
  if (!uprn) return null
  
  try {
    const response = await fetch(`/api/db/properties?uprn=${encodeURIComponent(uprn)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch property: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      data: data.data,
      lastFetched: new Date(data.lastFetched).getTime(),
      fetchedCount: data.fetchedCount
    }
  } catch (error) {
    console.error('Failed to fetch property from database:', error)
    return null
  }
}

// Get full analysis data (combines property data + user analysis) - now async
export async function getFullAnalysisData(analysisId: string): Promise<{ propertyData: any, userAnalysis: any } | null> {
  try {
    // For backward compatibility, return null since we removed user analysis functionality
    // This allows other pages to continue working without breaking
    console.warn('getFullAnalysisData is deprecated - user analysis functionality has been removed')
    return null
  } catch (error) {
    console.error('Failed to fetch full analysis data from database:', error)
    return null
  }
}

// Recent analyses list - deprecated but kept for backward compatibility
export async function loadRecentAnalyses(): Promise<any[]> {
  try {
    // For backward compatibility, return empty array since we removed recent analyses functionality
    console.warn('loadRecentAnalyses is deprecated - recent analyses functionality has been removed')
    return []
  } catch (error) {
    console.error('Failed to fetch recent analyses from database:', error)
    return []
  }
}

// User analysis functions - deprecated but kept for backward compatibility
export async function getUserAnalysis(analysisId: string): Promise<any | null> {
  try {
    // For backward compatibility, return null since we removed user analysis functionality
    console.warn('getUserAnalysis is deprecated - user analysis functionality has been removed')
    return null
  } catch (error) {
    console.error('Failed to fetch analysis from database:', error)
    return null
  }
}

export async function updateUserAnalysis(analysisId: string, updates: any): Promise<void> {
  try {
    // For backward compatibility, do nothing since we removed user analysis functionality
    console.warn('updateUserAnalysis is deprecated - user analysis functionality has been removed')
  } catch (error) {
    console.error('Failed to update analysis in database:', error)
  }
}


