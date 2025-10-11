// Persistence utilities for localStorage
const STORAGE_KEYS = {
  PROPERTY_DATA: 'estimo_property_data',
  CALCULATOR_DATA: 'estimo_calculator_data',
  PROPERTY_LISTS: 'estimo_property_lists'
} as const

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

export interface PropertyList {
  id: string
  name: string
  propertyIds: string[]
  createdAt: number
  updatedAt: number
  order?: number
}

export interface PropertyLists {
  [listId: string]: PropertyList
}

// Generic storage functions
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error)
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error)
    return defaultValue
  }
}


// Property data persistence
export function savePropertyData(propertyData: any): void {
  const data: PersistedPropertyData = {
    data: propertyData,
    lastUpdated: Date.now()
  }
  saveToStorage(STORAGE_KEYS.PROPERTY_DATA, data)
}

export function loadPropertyData(): any | null {
  const data = loadFromStorage<PersistedPropertyData>(STORAGE_KEYS.PROPERTY_DATA, {
    data: null,
    lastUpdated: 0
  })
  return data.data
}


// Calculator data persistence (per property)
export function saveCalculatorData(propertyId: string, calculatorData: CalculatorData): void {
  if (!propertyId) return
  
  const allData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  
  allData[propertyId] = {
    data: calculatorData,
    lastUpdated: Date.now()
  }
  
  saveToStorage(STORAGE_KEYS.CALCULATOR_DATA, allData)
}

export function loadCalculatorData(propertyId: string): CalculatorData | null {
  if (!propertyId) return null
  
  const allData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  
  return allData[propertyId]?.data || null
}

// Clear all persisted data
export function clearAllPersistedData(): void {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

// Property lists persistence
export function loadPropertyLists(): PropertyLists {
  return loadFromStorage<PropertyLists>(STORAGE_KEYS.PROPERTY_LISTS, {})
}

export function savePropertyLists(lists: PropertyLists): void {
  saveToStorage(STORAGE_KEYS.PROPERTY_LISTS, lists)
}

export function createPropertyList(name: string): PropertyList {
  const lists = loadPropertyLists()
  const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newList: PropertyList = {
    id,
    name,
    propertyIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  lists[id] = newList
  savePropertyLists(lists)
  
  return newList
}

export function addPropertyToList(listId: string, propertyId: string): boolean {
  const lists = loadPropertyLists()
  const list = lists[listId]
  
  if (!list) return false
  
  // Don't add if already in list
  if (list.propertyIds.includes(propertyId)) return false
  
  list.propertyIds.push(propertyId)
  list.updatedAt = Date.now()
  
  savePropertyLists(lists)
  return true
}

export function removePropertyFromList(listId: string, propertyId: string): boolean {
  const lists = loadPropertyLists()
  const list = lists[listId]
  
  if (!list) return false
  
  const index = list.propertyIds.indexOf(propertyId)
  if (index === -1) return false
  
  list.propertyIds.splice(index, 1)
  list.updatedAt = Date.now()
  
  savePropertyLists(lists)
  return true
}

export function deletePropertyList(listId: string): boolean {
  const lists = loadPropertyLists()
  
  if (!lists[listId]) return false
  
  delete lists[listId]
  savePropertyLists(lists)
  return true
}

export function getPropertyList(listId: string): PropertyList | null {
  const lists = loadPropertyLists()
  return lists[listId] || null
}

export function getAllPropertyLists(): PropertyList[] {
  const lists = loadPropertyLists()
  return Object.values(lists).sort((a, b) => {
    // Sort by order if both have it, otherwise fall back to updatedAt
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    // If only one has order, prioritize it
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    // Fall back to updatedAt (most recent first)
    return b.updatedAt - a.updatedAt
  })
}

// Property data store helpers
export function loadPropertyDataStore(): PropertyDataStore {
  return loadFromStorage<PropertyDataStore>('propertyDataStore', {})
}

export function savePropertyDataStore(store: PropertyDataStore): void {
  saveToStorage('propertyDataStore', store)
}

export function getPropertyFromStore(propertyId: string): PropertyDataStoreItem | null {
  const store = loadPropertyDataStore()
  return store[propertyId] || null
}

export function updatePropertyInStore(propertyId: string, updates: Partial<PropertyDataStoreItem>): void {
  const store = loadPropertyDataStore()
  if (store[propertyId]) {
    store[propertyId] = { ...store[propertyId], ...updates }
    savePropertyDataStore(store)
  }
}

// Delete a property from all storage locations
export function deleteProperty(propertyId: string): void {
  if (typeof window === 'undefined') return
  
  // Remove from propertyDataStore
  const store = loadPropertyDataStore()
  delete store[propertyId]
  savePropertyDataStore(store)
  
  // Remove from recentAnalyses
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
  
  // Remove from calculator data
  const allCalculatorData = loadFromStorage<PersistedCalculatorData>(STORAGE_KEYS.CALCULATOR_DATA, {})
  delete allCalculatorData[propertyId]
  saveToStorage(STORAGE_KEYS.CALCULATOR_DATA, allCalculatorData)
  
  // Remove from all property lists
  const lists = loadPropertyLists()
  Object.values(lists).forEach(list => {
    const index = list.propertyIds.indexOf(propertyId)
    if (index !== -1) {
      list.propertyIds.splice(index, 1)
      list.updatedAt = Date.now()
    }
  })
  savePropertyLists(lists)
}
