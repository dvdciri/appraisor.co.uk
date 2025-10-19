// Persistence utilities for localStorage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data', // DEPRECATED - kept for migration
  CALCULATOR_DATA: 'estimo_calculator_data',
  // New storage keys
  PROPERTIES: 'estimo_properties', // Generic property data (keyed by UPRN)
  USER_ANALYSES: 'estimo_user_analyses', // User-specific analyses (keyed by analysisId)
  RECENT_ANALYSES: 'estimo_recent_analyses' // List of recent analysis IDs
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

// User-specific analysis data
export interface UserAnalysis {
  uprn: string  // Reference to property in PropertiesStore
  searchAddress: string
  searchPostcode: string
  timestamp: number
  
  // Selected comparables for this analysis
  selectedComparables: string[]
  
  // Calculated values specific to this analysis
  calculatedValuation?: number
  valuationBasedOnComparables?: number
  lastValuationUpdate?: number
  
  calculatedRent?: number
  rentBasedOnComparables?: number
  lastRentUpdate?: number
  
  calculatedYield?: number
  lastYieldUpdate?: number
  
  // Filter settings used
  filters: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }
}

export interface UserAnalysesStore {
  [analysisId: string]: UserAnalysis
}

// Recent analyses list (for quick access)
export interface RecentAnalysisItem {
  analysisId: string
  timestamp: number
}

// ============================================================================
// DEPRECATED - Kept for migration only
// ============================================================================

export interface PersistedPropertyData {
  data: any
  lastUpdated: number
}

// Extended property data stored in propertyDataStore
// This includes the full property data plus additional calculated fields
export interface PropertyDataStoreItem {
  data: {
    attributes: any
  }
  // Calculated valuation based on selected comparable sales
  calculatedValuation?: number
  // Number of comparables used for the valuation calculation
  valuationBasedOnComparables?: number
  // Timestamp of when the valuation was last calculated
  lastValuationUpdate?: number
  // Calculated rental value based on rental comparables
  calculatedRent?: number
  // Number of rental comparables used for rent calculation
  rentBasedOnComparables?: number
  // Timestamp of when the rent was last calculated
  lastRentUpdate?: number
  // Calculated yield percentage (annual return)
  calculatedYield?: number
  // Timestamp of when the yield was last calculated
  lastYieldUpdate?: number
  [key: string]: any
}

export interface PropertyDataStore {
  [propertyId: string]: PropertyDataStoreItem
}

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


// Generic storage functions - now using API routes
export async function saveToStorage<T>(key: string, data: T): Promise<void> {
  // This function is kept for backward compatibility but now calls API routes
  console.warn('saveToStorage is deprecated, use specific API functions instead')
}

export async function loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  // This function is kept for backward compatibility but now calls API routes
  console.warn('loadFromStorage is deprecated, use specific API functions instead')
  return defaultValue
}


// Property data persistence
export function savePropertyData(propertyData: any): void {
  const data: PersistedPropertyData = {
    data: propertyData,
    lastUpdated: Date.now()
  }
  saveToStorage(STORAGE_KEYS.PROPERTY_DATA, data)
}

export async function loadPropertyData(): Promise<any | null> {
  const data = await loadFromStorage<PersistedPropertyData>(STORAGE_KEYS.PROPERTY_DATA, {
    data: null,
    lastUpdated: 0
  })
  return data.data
}


// Calculator data persistence (per property) - now using API routes
export async function saveCalculatorData(propertyId: string, calculatorData: CalculatorData): Promise<void> {
  if (!propertyId) return
  
  try {
    const response = await fetch('/api/db/calculator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId: propertyId,
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

export async function loadCalculatorData(propertyId: string): Promise<CalculatorData | null> {
  if (!propertyId) return null
  
  try {
    const response = await fetch(`/api/db/calculator?id=${encodeURIComponent(propertyId)}`)
    
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
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}


// Property data store helpers
export async function loadPropertyDataStore(): Promise<PropertyDataStore> {
  return await loadFromStorage<PropertyDataStore>('propertyDataStore', {})
}

export async function savePropertyDataStore(store: PropertyDataStore): Promise<void> {
  await saveToStorage('propertyDataStore', store)
}

export async function getPropertyFromStore(propertyId: string): Promise<PropertyDataStoreItem | null> {
  const store = await loadPropertyDataStore()
  return store[propertyId] || null
}

export async function updatePropertyInStore(propertyId: string, updates: Partial<PropertyDataStoreItem>): Promise<void> {
  const store = await loadPropertyDataStore()
  if (store[propertyId]) {
    store[propertyId] = { ...store[propertyId], ...updates }
    await savePropertyDataStore(store)
  }
}

// Delete a property from all storage locations
export async function deleteProperty(propertyId: string): Promise<void> {
  if (typeof window === 'undefined') return
  
  // Remove from propertyDataStore (legacy)
  const store = await loadPropertyDataStore()
  delete store[propertyId]
  await savePropertyDataStore(store)
  
  // Remove from recentAnalyses (legacy)
  try {
    const savedAnalyses = localStorage.getItem('recentAnalyses')
    if (savedAnalyses) {
      const analyses = JSON.parse(savedAnalyses)
      const filtered = analyses.filter((a: any) => a.id !== propertyId)
      localStorage.setItem('recentAnalyses', JSON.stringify(filtered))
    }
  } catch (e) {
    console.error('Failed to remove from recentAnalyses:', e)
  }
  
  // Remove from new user analyses store
  await deleteUserAnalysis(propertyId)
  
  // Remove from calculator data
  const allCalculatorData = await loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  delete allCalculatorData[propertyId]
  await saveToStorage(STORAGE_KEYS.CALCULATOR_DATA, allCalculatorData)
  
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

// User Analyses Store (keyed by analysisId) - now using API routes
export async function loadUserAnalysesStore(): Promise<UserAnalysesStore> {
  // This function is kept for backward compatibility
  console.warn('loadUserAnalysesStore is deprecated, use getUserAnalysis instead')
  return {}
}

export async function saveUserAnalysesStore(store: UserAnalysesStore): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('saveUserAnalysesStore is deprecated, use saveUserAnalysis instead')
}

export async function saveUserAnalysis(analysisId: string, analysis: UserAnalysis): Promise<void> {
  if (!analysisId) return
  
  try {
    const response = await fetch('/api/db/analyses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId,
        uprn: analysis.uprn,
        searchAddress: analysis.searchAddress,
        searchPostcode: analysis.searchPostcode,
        timestamp: analysis.timestamp,
        selectedComparables: analysis.selectedComparables,
        calculatedValuation: analysis.calculatedValuation,
        valuationBasedOnComparables: analysis.valuationBasedOnComparables,
        lastValuationUpdate: analysis.lastValuationUpdate,
        calculatedRent: analysis.calculatedRent,
        rentBasedOnComparables: analysis.rentBasedOnComparables,
        lastRentUpdate: analysis.lastRentUpdate,
        calculatedYield: analysis.calculatedYield,
        lastYieldUpdate: analysis.lastYieldUpdate,
        filters: analysis.filters
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save analysis: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to save analysis to database:', error)
    throw error
  }
}

export async function getUserAnalysis(analysisId: string): Promise<UserAnalysis | null> {
  if (!analysisId) return null
  
  try {
    const response = await fetch(`/api/db/analyses?id=${encodeURIComponent(analysisId)}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      uprn: data.uprn,
      searchAddress: data.searchAddress,
      searchPostcode: data.searchPostcode,
      timestamp: new Date(data.timestamp).getTime(),
      selectedComparables: data.selectedComparables || [],
      calculatedValuation: data.calculatedValuation,
      valuationBasedOnComparables: data.valuationBasedOnComparables,
      lastValuationUpdate: data.lastValuationUpdate ? new Date(data.lastValuationUpdate).getTime() : undefined,
      calculatedRent: data.calculatedRent,
      rentBasedOnComparables: data.rentBasedOnComparables,
      lastRentUpdate: data.lastRentUpdate ? new Date(data.lastRentUpdate).getTime() : undefined,
      calculatedYield: data.calculatedYield,
      lastYieldUpdate: data.lastYieldUpdate ? new Date(data.lastYieldUpdate).getTime() : undefined,
      filters: data.filters || {}
    }
  } catch (error) {
    console.error('Failed to fetch analysis from database:', error)
    return null
  }
}

export async function updateUserAnalysis(analysisId: string, updates: Partial<UserAnalysis>): Promise<void> {
  if (!analysisId) return
  
  // Get existing analysis and merge with updates
  const existing = await getUserAnalysis(analysisId)
  if (existing) {
    const updated = { ...existing, ...updates }
    await saveUserAnalysis(analysisId, updated)
  }
}

export async function deleteUserAnalysis(analysisId: string): Promise<void> {
  if (!analysisId) return
  
  try {
    const response = await fetch(`/api/db/analyses?id=${encodeURIComponent(analysisId)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete analysis: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to delete analysis from database:', error)
    throw error
  }
}

// Recent Analyses List - now using API routes
export async function loadRecentAnalyses(): Promise<RecentAnalysisItem[]> {
  try {
    const response = await fetch('/api/db/analyses?recent=true')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent analyses: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.map((item: any) => ({
      analysisId: item.analysis_id,
      timestamp: new Date(item.timestamp).getTime()
    }))
  } catch (error) {
    console.error('Failed to fetch recent analyses from database:', error)
    return []
  }
}

export async function saveRecentAnalyses(analyses: RecentAnalysisItem[]): Promise<void> {
  // This function is kept for backward compatibility
  console.warn('saveRecentAnalyses is deprecated, recent analyses are managed automatically')
}

export async function addToRecentAnalyses(analysisId: string): Promise<void> {
  // Recent analyses are now managed automatically by the saveUserAnalysis function
  console.warn('addToRecentAnalyses is deprecated, recent analyses are managed automatically')
}

export async function removeFromRecentAnalyses(analysisId: string): Promise<void> {
  // Recent analyses are now managed automatically by the deleteUserAnalysis function
  console.warn('removeFromRecentAnalyses is deprecated, recent analyses are managed automatically')
}

// Get full analysis data (combines property data + user analysis) - now async
export async function getFullAnalysisData(analysisId: string): Promise<{ propertyData: any, userAnalysis: UserAnalysis } | null> {
  const userAnalysis = await getUserAnalysis(analysisId)
  if (!userAnalysis) return null
  
  const genericProperty = await getGenericProperty(userAnalysis.uprn)
  if (!genericProperty) return null
  
  return {
    propertyData: genericProperty.data,
    userAnalysis
  }
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

// Export localStorage data for migration to database
export function exportLocalStorageData(): {
  properties: PropertiesStore
  userAnalyses: UserAnalysesStore
  recentAnalyses: RecentAnalysisItem[]
  calculatorData: PersistedCalculatorData
} {
  if (typeof window === 'undefined') {
    return { properties: {}, userAnalyses: {}, recentAnalyses: [], calculatorData: {} }
  }

  try {
    // Load from localStorage using the old functions
    const properties: PropertiesStore = {}
    const userAnalyses: UserAnalysesStore = {}
    const recentAnalyses: RecentAnalysisItem[] = []
    const calculatorData: PersistedCalculatorData = {}

    // Load properties store
    try {
      const propertiesData = localStorage.getItem(STORAGE_KEYS.PROPERTIES)
      if (propertiesData) {
        Object.assign(properties, JSON.parse(propertiesData))
      }
    } catch (e) {
      console.warn('Failed to load properties from localStorage:', e)
    }

    // Load user analyses store
    try {
      const analysesData = localStorage.getItem(STORAGE_KEYS.USER_ANALYSES)
      if (analysesData) {
        Object.assign(userAnalyses, JSON.parse(analysesData))
      }
    } catch (e) {
      console.warn('Failed to load user analyses from localStorage:', e)
    }

    // Load recent analyses
    try {
      const recentData = localStorage.getItem(STORAGE_KEYS.RECENT_ANALYSES)
      if (recentData) {
        recentAnalyses.push(...JSON.parse(recentData))
      }
    } catch (e) {
      console.warn('Failed to load recent analyses from localStorage:', e)
    }

    // Load calculator data
    try {
      const calcData = localStorage.getItem(STORAGE_KEYS.CALCULATOR_DATA)
      if (calcData) {
        Object.assign(calculatorData, JSON.parse(calcData))
      }
    } catch (e) {
      console.warn('Failed to load calculator data from localStorage:', e)
    }

    return { properties, userAnalyses, recentAnalyses, calculatorData }
  } catch (error) {
    console.error('Failed to export localStorage data:', error)
    return { properties: {}, userAnalyses: {}, recentAnalyses: [], calculatorData: {} }
  }
}

// Migrate localStorage data to database
export async function migrateToDatabase(): Promise<{ success: boolean, migrated: number, errors: string[] }> {
  try {
    const data = exportLocalStorageData()
    
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Migration failed: ${result.error || response.statusText}`)
    }

    return result
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      migrated: 0,
      errors: [`Migration failed: ${error}`]
    }
  }
}

export function migrateOldDataToNewStructure(): { success: boolean, migrated: number, errors: string[] } {
  if (typeof window === 'undefined') return { success: false, migrated: 0, errors: ['Not in browser environment'] }
  
  const errors: string[] = []
  let migrated = 0
  
  try {
    // Check if migration already done
    const migrationFlag = localStorage.getItem('estimo_migration_completed')
    if (migrationFlag === 'true') {
      console.log('Migration already completed')
      return { success: true, migrated: 0, errors: [] }
    }
    
    // Migrate propertyDataStore
    const oldStore = loadPropertyDataStore()
    const oldAnalyses = JSON.parse(localStorage.getItem('recentAnalyses') || '[]')
    
    console.log(`Migrating ${Object.keys(oldStore).length} properties from old structure...`)
    
    Object.entries(oldStore).forEach(([analysisId, propertyItem]) => {
      try {
        // Extract UPRN
        const uprn = extractUPRN(propertyItem)
        if (!uprn) {
          errors.push(`No UPRN found for analysis ${analysisId}`)
          return
        }
        
        // Save generic property data (only if not already saved)
        const existingProperty = getGenericProperty(uprn)
        if (!existingProperty) {
          saveGenericProperty(uprn, propertyItem.data || propertyItem)
        }
        
        // Find matching recent analysis for metadata
        const recentAnalysis = oldAnalyses.find((a: any) => a.id === analysisId)
        
        // Create user analysis
        const userAnalysis: UserAnalysis = {
          uprn,
          searchAddress: '',
          searchPostcode: '',
          timestamp: recentAnalysis?.searchDate ? new Date(recentAnalysis.searchDate).getTime() : Date.now(),
          selectedComparables: recentAnalysis?.comparables || [],
          calculatedValuation: propertyItem.calculatedValuation,
          valuationBasedOnComparables: propertyItem.valuationBasedOnComparables,
          lastValuationUpdate: propertyItem.lastValuationUpdate,
          calculatedRent: propertyItem.calculatedRent,
          rentBasedOnComparables: propertyItem.rentBasedOnComparables,
          lastRentUpdate: propertyItem.lastRentUpdate,
          calculatedYield: propertyItem.calculatedYield,
          lastYieldUpdate: propertyItem.lastYieldUpdate,
          filters: recentAnalysis?.filters || {
            propertyType: '',
            minBeds: '',
            maxBeds: '',
            minBaths: '',
            maxBaths: ''
          }
        }
        
        saveUserAnalysis(analysisId, userAnalysis)
        migrated++
      } catch (e) {
        errors.push(`Error migrating ${analysisId}: ${e}`)
      }
    })
    
    // Mark migration as complete
    localStorage.setItem('estimo_migration_completed', 'true')
    
    console.log(`Migration completed: ${migrated} properties migrated, ${errors.length} errors`)
    return { success: true, migrated, errors }
    
  } catch (e) {
    errors.push(`Migration failed: ${e}`)
    return { success: false, migrated, errors }
  }
}

// Run migration automatically on first load
export function autoMigrate(): void {
  if (typeof window === 'undefined') return
  
  const migrationFlag = localStorage.getItem('estimo_migration_completed')
  if (migrationFlag !== 'true') {
    console.log('Auto-migration starting...')
    const result = migrateOldDataToNewStructure()
    console.log('Auto-migration result:', result)
  }
}
