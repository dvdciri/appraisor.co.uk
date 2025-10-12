'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  getAllPropertyLists, 
  createPropertyList, 
  addPropertyToList,
  removePropertyFromList,
  PropertyList,
  updatePropertyInStore,
  getPropertyFromStore,
  updateUserAnalysis
} from '../../lib/persistence'
import { getTasksForProperty } from '../../lib/tasks'
import Toast from './Toast'

interface PropertyData {
  data: {
    attributes: {
      address: {
        street_group_format: {
          address_lines: string
          postcode: string
        }
      }
      location: {
        coordinates: {
          longitude: number
          latitude: number
        }
      }
      plot: {
        total_plot_area_square_metres: number
        polygons: Array<{
          polygon_id: string
          date_polygon_created: string
          date_polygon_updated: string
          epsg_4326_polygon: {
            type: string
            coordinates: number[][][]
          }
        }>
      }
      estimated_values: Array<{
        estimated_market_value: number
        estimated_market_value_rounded: number
      }>
      estimated_rental_value: {
        estimated_monthly_rental_value: number
        estimated_annual_rental_yield: number
      }
      tenure: {
        tenure_type: string
      }
      property_type: {
        value: string
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
          potential_rating: string
          current_efficiency: number
          potential_efficiency: number
        }
        expiry_date: string
        mainheat_description: string
        mainheat_energy_eff: string
        hotwater_description: string
        windows_description: string
        windows_energy_eff: string
        walls_description: string
        walls_energy_eff: string
        roof_description: string
        roof_energy_eff: string
        floor_description: string
        floor_energy_eff: string
        lighting_description: string
        lighting_energy_eff: string
      }
      construction_age_band: string
      ownership: {
        company_owned: boolean
        overseas_owned: boolean
        social_housing: boolean
      }
      outdoor_space: {
        outdoor_space_area_square_metres: number
        garden_direction: string
        garden_primary_orientation: string
      }
      council_tax: {
        band: string
        current_annual_charge: number
      }
      construction_materials: {
        floor_type: { value: string }
        roof_type: { value: string }
        wall_type: { value: string }
        glazing_type: { value: string }
        mains_gas: { value: boolean }
      }
      utilities: {
        mains_gas: { value: boolean }
        [key: string]: any
      }
      flood_risk: {
        rivers_and_seas: {
          risk: string
          risk_interpretation: string
        }
      }
      surface_water: {
        risk: string
        risk_interpretation: string
      }
      restrictive_covenants: Array<{
        unique_identifier: string
        associated_property_description: string
        [key: string]: any
      }>
      coastal_erosion: {
        can_have_erosion_plan: boolean
        plans: any
      }
      transactions: Array<{
        transaction_id: string
        date: string
        price: number
        [key: string]: any
      }>
      latest_transaction_date: string
      nearby_completed_transactions: Array<{
        street_group_property_id: string
        address: {
          street_group_format: {
            address_lines: string
            postcode: string
          }
        }
        property_type: string
        transaction_date: string
        price: number
        internal_area_square_metres: number
        price_per_square_metre: number
        number_of_bedrooms: number
        number_of_bathrooms: number
        distance_in_metres: number
        [key: string]: any
      }>
      nearby_listings: {
        sale_listings: Array<{
          street_group_property_id: string
          address: {
            royal_mail_format: {
              thoroughfare: string
              post_town: string
              postcode: string
            }
          }
          property_type: {
            value: string
          }
          agent: {
            company_name: string
            branch_name: string
          }
          listing_id: string
          listing_type: string
          listed_date: string
          is_available: boolean
          status: string
          price: number
          number_of_bedrooms: number
          number_of_bathrooms: number
          main_image_url: string
          images: string[]
          [key: string]: any
        }>
        rental_listings: Array<{
          street_group_property_id: string
          address: {
            royal_mail_format: {
              thoroughfare: string
              post_town: string
              postcode: string
            }
          }
          property_type: {
            value: string
          }
          agent: {
            company_name: string
            branch_name: string
          }
          listing_id: string
          listing_type: string
          listed_date: string
          is_available: boolean
          status: string
          price: number
          number_of_bedrooms: number
          number_of_bathrooms: number
          main_image_url: string
          images: string[]
          [key: string]: any
        }>
      }
      market_statistics: {
        outcode: {
          count_of_properties: number
          count_total_properties_sold_last_12_months: number
          average_price_properties_sold_last_12_months: number
          sales_yearly: Array<{
            year: number
            count_of_sales: number
            average_price: number
          }>
          [key: string]: any
        }
        [key: string]: any
      }
      transport?: {
        public?: {
          bus_coach?: Array<{
            atco_code: string
            stop_name: string
            location: {
              coordinates: {
                longitude: number
                latitude: number
              }
              type: string
            }
            distance_in_metres: number
          }>
          rail?: Array<{
            atco_code: string
            stop_name: string
            location: {
              coordinates: {
                longitude: number
                latitude: number
              }
              type: string
            }
            distance_in_metres: number
          }>
        }
      }
      education?: {
        nursery?: Array<{
          name: string
          location: {
            coordinates: {
              longitude: number
              latitude: number
            }
            type: string
          }
          school_rating: string
          postcode: string
          school_types: string[]
          distance_in_metres: number
        }>
        primary?: Array<{
          name: string
          location: {
            coordinates: {
              longitude: number
              latitude: number
            }
            type: string
          }
          school_rating: string
          postcode: string
          school_types: string[]
          distance_in_metres: number
        }>
        secondary?: Array<{
          name: string
          location: {
            coordinates: {
              longitude: number
              latitude: number
            }
            type: string
          }
          school_rating: string
          postcode: string
          school_types: string[]
          distance_in_metres: number
        }>
      }
      [key: string]: any
    }
  }
}

interface PropertyDetailsProps {
  data: PropertyData
  showInvestButton?: boolean
  propertyId?: string
  comparables?: Set<string>
  filters?: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }
  onComparablesChange?: (comparables: Set<string>) => void
  onFiltersChange?: (filters: {
    propertyType: string
    minBeds: string
    maxBeds: string
    minBaths: string
    maxBaths: string
  }) => void
}

export default function PropertyDetails({ 
  data, 
  showInvestButton = true, 
  propertyId,
  comparables = new Set(), 
  filters = {
    propertyType: '',
    minBeds: '',
    maxBeds: '',
    minBaths: '',
    maxBaths: ''
  },
  onComparablesChange,
  onFiltersChange
}: PropertyDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { attributes } = data.data
  const address = `${attributes.address.street_group_format.address_lines}, ${attributes.address.street_group_format.postcode}`
  
  // Get estimated rental values from data
  const estimatedRent = attributes.estimated_rental_value?.estimated_monthly_rental_value || 0
  const estimatedYield = attributes.estimated_rental_value?.estimated_annual_rental_yield || 0

  // Check if EPC is expired
  const isEpExpired = attributes.energy_performance?.expiry_date ? 
    new Date(attributes.energy_performance.expiry_date) < new Date() : false

  // Generate Google Street View URL
  const streetViewUrl = attributes.location?.coordinates ? 
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${attributes.location.coordinates.latitude},${attributes.location.coordinates.longitude}` : 
    null

  // Google Street View Static Image URL (uses provided API key)
  const streetViewImageUrl = attributes.location?.coordinates ?
    `https://maps.googleapis.com/maps/api/streetview?size=640x320&location=${attributes.location.coordinates.latitude},${attributes.location.coordinates.longitude}&fov=80&pitch=0&key=AIzaSyBVYvvxZFPpQpMl9bQ-kFUfgXO0XaeLN3U` :
    null

  // Google Maps Embed URL with pin at the property location
  const latitude = attributes.location?.coordinates?.latitude
  const longitude = attributes.location?.coordinates?.longitude
  const mapEmbedUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : null

  // Image gallery state
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  // List modal state
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [allLists, setAllLists] = useState<PropertyList[]>([])
  const [newListName, setNewListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [listMessage, setListMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null)
  
  // Task count state
  const [taskCount, setTaskCount] = useState(0)

  // Comparables modal state
  const [isComparablesModalOpen, setIsComparablesModalOpen] = useState(false)

  // Tabs state
  const tabs = ['📋 Basic Details', '🗺️ Plot', '📜 Transaction History', '⚡ EPC', '⚠️ Risk assesment', '🏠 Listed Nearby', '📈 Market', '🚌 Transport & Education']
  const [selectedTab, setSelectedTab] = useState<string>('📋 Basic Details')
  const [nearbyListingsSubTab, setNearbyListingsSubTab] = useState<'sale' | 'rent'>('sale')

  // Valuation state
  const [calculatedValuation, setCalculatedValuation] = useState<number | null>(null)
  const [calculatedRent, setCalculatedRent] = useState<number | null>(null)
  const [calculatedYield, setCalculatedYield] = useState<number | null>(null)

  // Calculate matching rental listings count
  const matchingRentalListingsCount = useMemo(() => {
    if (!attributes.nearby_listings?.rental_listings) return 0
    
    const rentalListings = attributes.nearby_listings.rental_listings
    const propertyBeds = attributes.number_of_bedrooms?.value
    
    // Try strict filter first (type + beds + baths)
    const strictMatches = rentalListings.filter((listing: any) => {
      return listing.property_type?.value === attributes.property_type?.value &&
             listing.number_of_bedrooms === propertyBeds &&
             listing.number_of_bathrooms === attributes.number_of_bathrooms?.value
    })
    
    // If less than 5 matches, use relaxed filter (type + beds only)
    if (strictMatches.length < 5) {
      const relaxedMatches = rentalListings.filter((listing: any) => {
        return listing.property_type?.value === attributes.property_type?.value &&
               listing.number_of_bedrooms === propertyBeds
      })
      
      // If still less than 5, include ±1 bedroom
      if (relaxedMatches.length < 5) {
        return rentalListings.filter((listing: any) => {
          const bedroomDiff = Math.abs(listing.number_of_bedrooms - propertyBeds)
          return listing.property_type?.value === attributes.property_type?.value &&
                 bedroomDiff <= 1
        }).length
      }
      
      return relaxedMatches.length
    }
    
    return strictMatches.length
  }, [attributes.nearby_listings?.rental_listings, attributes.property_type?.value, attributes.number_of_bedrooms?.value, attributes.number_of_bathrooms?.value])

  // Load lists on component mount and when modal opens
  useEffect(() => {
    setAllLists(getAllPropertyLists())
    if (isListModalOpen) {
      setListMessage(null)
    }
  }, [isListModalOpen])
  
  // Calculate how many lists contain this property
  const listsContainingProperty = useMemo(() => {
    if (!propertyId) return 0
    return allLists.filter(list => list.propertyIds.includes(propertyId)).length
  }, [allLists, propertyId])
  
  // Load task count for this property
  useEffect(() => {
    if (propertyId) {
      const tasks = getTasksForProperty(propertyId)
      setTaskCount(tasks.length)
    }
  }, [propertyId])
  
  // Update task count when window gains focus (to catch changes from tasks page)
  useEffect(() => {
    const updateTaskCount = () => {
      if (propertyId) {
        const tasks = getTasksForProperty(propertyId)
        setTaskCount(tasks.length)
      }
    }
    
    window.addEventListener('focus', updateTaskCount)
    return () => window.removeEventListener('focus', updateTaskCount)
  }, [propertyId])

  // Set default nearby listings sub-tab based on available data
  useEffect(() => {
    if (selectedTab === '🏠 Listed Nearby' && attributes.nearby_listings) {
      const hasSaleListings = attributes.nearby_listings.sale_listings && attributes.nearby_listings.sale_listings.length > 0
      const hasRentalListings = attributes.nearby_listings.rental_listings && attributes.nearby_listings.rental_listings.length > 0
      
      // If current sub-tab data doesn't exist, switch to the one that does
      if (nearbyListingsSubTab === 'sale' && !hasSaleListings && hasRentalListings) {
        setNearbyListingsSubTab('rent')
      } else if (nearbyListingsSubTab === 'rent' && !hasRentalListings && hasSaleListings) {
        setNearbyListingsSubTab('sale')
      }
    }
  }, [selectedTab, attributes.nearby_listings, nearbyListingsSubTab])

  // Calculate valuation based on selected comparables
  useEffect(() => {
    if (!propertyId || !attributes.nearby_completed_transactions) return

    // Calculate average price from selected comparables
    if (comparables.size > 0) {
      const selectedTransactions = attributes.nearby_completed_transactions.filter(
        (transaction: any) => comparables.has(transaction.street_group_property_id)
      )
      
      if (selectedTransactions.length > 0) {
        const totalPrice = selectedTransactions.reduce((sum: number, transaction: any) => sum + (transaction.price || 0), 0)
        const averagePrice = Math.round(totalPrice / selectedTransactions.length)
        setCalculatedValuation(averagePrice)

        // Persist valuation to user analysis (new storage structure)
        try {
          updateUserAnalysis(propertyId, {
            calculatedValuation: averagePrice,
            valuationBasedOnComparables: selectedTransactions.length,
            lastValuationUpdate: Date.now()
          })
          console.log('Saved valuation:', averagePrice, 'based on', selectedTransactions.length, 'comparables')
        } catch (e) {
          console.error('Failed to save valuation:', e)
        }
      } else {
        setCalculatedValuation(null)
      }
    } else {
      setCalculatedValuation(null)
      
      // Clear valuation from storage when no comparables selected
      try {
        updateUserAnalysis(propertyId, {
          calculatedValuation: undefined,
          valuationBasedOnComparables: undefined,
          lastValuationUpdate: undefined
        })
      } catch (e) {
        console.error('Failed to clear valuation:', e)
      }
    }
  }, [comparables, attributes.nearby_completed_transactions, propertyId])

  // Calculate estimated rent based on nearby rental listings
  useEffect(() => {
    if (!propertyId || !attributes.nearby_listings?.rental_listings) {
      setCalculatedRent(null)
      return
    }

    const rentalListings = attributes.nearby_listings.rental_listings
    const propertyBeds = attributes.number_of_bedrooms?.value
    
    // Try strict filter first (type + beds + baths)
    let matchingListings = rentalListings.filter((listing: any) => {
      const samePropertyType = listing.property_type?.value === attributes.property_type?.value
      const sameBeds = listing.number_of_bedrooms === propertyBeds
      const sameBaths = listing.number_of_bathrooms === attributes.number_of_bathrooms?.value
      
      return samePropertyType && sameBeds && sameBaths
    })
    
    let filterUsed = 'strict (type + beds + baths)'
    
    // If less than 5 matches, use relaxed filter (type + beds only)
    if (matchingListings.length < 5) {
      matchingListings = rentalListings.filter((listing: any) => {
        const samePropertyType = listing.property_type?.value === attributes.property_type?.value
        const sameBeds = listing.number_of_bedrooms === propertyBeds
        
        return samePropertyType && sameBeds
      })
      filterUsed = 'relaxed (type + beds)'
      
      // If still less than 5, include ±1 bedroom
      if (matchingListings.length < 5) {
        matchingListings = rentalListings.filter((listing: any) => {
          const samePropertyType = listing.property_type?.value === attributes.property_type?.value
          const bedroomDiff = Math.abs(listing.number_of_bedrooms - propertyBeds)
          
          return samePropertyType && bedroomDiff <= 1
        })
        filterUsed = 'very relaxed (type + beds ±1)'
      }
    }
    
    console.log(`Using ${filterUsed} filter for rent calculation:`, matchingListings.length, 'listings')

    if (matchingListings.length > 0) {
      // Calculate average rent
      const totalRent = matchingListings.reduce((sum: number, listing: any) => sum + (listing.price || 0), 0)
      const averageRent = Math.round(totalRent / matchingListings.length)
      setCalculatedRent(averageRent)

      // Persist rent to user analysis (new storage structure)
      try {
        updateUserAnalysis(propertyId, {
          calculatedRent: averageRent,
          rentBasedOnComparables: matchingListings.length,
          lastRentUpdate: Date.now()
        })
        console.log('Saved estimated rent:', averageRent, 'based on', matchingListings.length, 'rental listings')
      } catch (e) {
        console.error('Failed to save rent:', e)
      }
    } else {
      setCalculatedRent(null)
      
      // Clear rent from storage when no matching listings
      try {
        updateUserAnalysis(propertyId, {
          calculatedRent: undefined,
          rentBasedOnComparables: undefined,
          lastRentUpdate: undefined
        })
      } catch (e) {
        console.error('Failed to clear rent:', e)
      }
    }
  }, [attributes.nearby_listings?.rental_listings, attributes.property_type?.value, attributes.number_of_bedrooms?.value, attributes.number_of_bathrooms?.value, propertyId])

  // Calculate yield based on rent and valuation
  useEffect(() => {
    if (calculatedRent && calculatedValuation && calculatedValuation > 0) {
      const annualRent = calculatedRent * 12
      const yieldPercentage = (annualRent / calculatedValuation) * 100
      setCalculatedYield(yieldPercentage)

      // Persist yield to user analysis (new storage structure)
      if (propertyId) {
        try {
          updateUserAnalysis(propertyId, {
            calculatedYield: yieldPercentage,
            lastYieldUpdate: Date.now()
          })
          console.log('Saved estimated yield:', yieldPercentage.toFixed(2) + '%')
        } catch (e) {
          console.error('Failed to save yield:', e)
        }
      }
    } else {
      setCalculatedYield(null)
      
      // Clear yield from storage when rent or valuation is missing
      if (propertyId) {
        try {
          updateUserAnalysis(propertyId, {
            calculatedYield: undefined,
            lastYieldUpdate: undefined
          })
        } catch (e) {
          console.error('Failed to clear yield:', e)
        }
      }
    }
  }, [calculatedRent, calculatedValuation, propertyId])

  // Load persisted valuation and rent on component mount
  useEffect(() => {
    if (!propertyId) return

    try {
      const propertyData = getPropertyFromStore(propertyId)
      if (propertyData?.calculatedValuation) {
        setCalculatedValuation(propertyData.calculatedValuation)
        console.log('Loaded persisted valuation:', propertyData.calculatedValuation)
      }
      if (propertyData?.calculatedRent) {
        setCalculatedRent(propertyData.calculatedRent)
        console.log('Loaded persisted rent:', propertyData.calculatedRent)
      }
      if (propertyData?.calculatedYield) {
        setCalculatedYield(propertyData.calculatedYield)
        console.log('Loaded persisted yield:', propertyData.calculatedYield.toFixed(2) + '%')
      }
    } catch (e) {
      console.error('Failed to load persisted data:', e)
    }
  }, [propertyId])

  // Check if property is in a list
  const isPropertyInList = (list: PropertyList): boolean => {
    return propertyId ? list.propertyIds.includes(propertyId) : false
  }


  const openImageGallery = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images)
    setCurrentImageIndex(startIndex)
    setIsGalleryOpen(true)
  }

  const closeImageGallery = () => {
    setIsGalleryOpen(false)
    setSelectedImages([])
    setCurrentImageIndex(0)
  }

  const handleCreateNewList = () => {
    if (!newListName.trim()) return
    
    try {
      const newList = createPropertyList(newListName.trim())
      setAllLists(getAllPropertyLists())
      setNewListName('')
      setIsCreatingList(false)
      
      // Automatically select the newly created list
      setSelectedListId(newList.id)
    } catch (error) {
      console.error('Failed to create list:', error)
    }
  }

  const handleTogglePropertyInList = (listId: string) => {
    if (!propertyId) return
    
    const list = allLists.find(l => l.id === listId)
    if (!list) return
    
    const isInList = isPropertyInList(list)
    
    try {
      if (isInList) {
        // Remove from list
        const success = removePropertyFromList(listId, propertyId)
        if (success) {
          setListMessage({
            type: 'success',
            text: `Property removed from "${list.name}"`
          })
          // Reload lists to update UI
          setAllLists(getAllPropertyLists())
        } else {
          setListMessage({
            type: 'error',
            text: `Failed to remove property from "${list.name}"`
          })
        }
      } else {
        // Add to list
        const success = addPropertyToList(listId, propertyId)
        if (success) {
          setListMessage({
            type: 'success',
            text: `Property added to "${list.name}"`
          })
          // Reload lists to update UI
          setAllLists(getAllPropertyLists())
        } else {
          setListMessage({
            type: 'info',
            text: `Property is already in "${list.name}"`
          })
        }
      }
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setListMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to update property in list:', error)
      setListMessage({
        type: 'error',
        text: 'Failed to update list'
      })
    }
  }

  const closeListModal = () => {
    setIsListModalOpen(false)
    setIsCreatingList(false)
    setNewListName('')
    setSelectedListId(null)
    setListMessage(null)
  }

  const toggleComparable = (transactionId: string) => {
    if (onComparablesChange) {
      const newComparables = new Set(comparables)
      if (newComparables.has(transactionId)) {
        newComparables.delete(transactionId)
      } else {
        newComparables.add(transactionId)
      }
      onComparablesChange(newComparables)
    }
  }

  const updateFilter = (key: string, value: string) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        [key]: value
      })
    }
  }

  const clearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({
        propertyType: '',
        minBeds: '',
        maxBeds: '',
        minBaths: '',
        maxBaths: ''
      })
    }
  }

  const filterTransactions = (transactions: any[]) => {
    return transactions.filter(transaction => {
      // Filter by property type
      if (filters.propertyType && transaction.property_type !== filters.propertyType) {
        return false
      }

      // Filter by beds
      if (filters.minBeds && transaction.number_of_bedrooms < parseInt(filters.minBeds)) {
        return false
      }
      if (filters.maxBeds && transaction.number_of_bedrooms > parseInt(filters.maxBeds)) {
        return false
      }

      // Filter by baths
      if (filters.minBaths && transaction.number_of_bathrooms < parseInt(filters.minBaths)) {
        return false
      }
      if (filters.maxBaths && transaction.number_of_bathrooms > parseInt(filters.maxBaths)) {
        return false
      }

      return true
    })
  }

  // Get unique property types for filter dropdown
  const getUniquePropertyTypes = (transactions: any[]) => {
    const types = new Set(transactions.map(t => t.property_type).filter(Boolean))
    return Array.from(types).sort()
  }

  // Get min/max values for beds and baths
  const getMinMaxValues = (transactions: any[]) => {
    const beds = transactions.map(t => t.number_of_bedrooms).filter(n => n !== null && n !== undefined)
    const baths = transactions.map(t => t.number_of_bathrooms).filter(n => n !== null && n !== undefined)
    
    return {
      minBeds: Math.min(...beds),
      maxBeds: Math.max(...beds),
      minBaths: Math.min(...baths),
      maxBaths: Math.max(...baths)
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length)
  }

  // Format distance for display
  const formatDistance = (distanceInMetres: number | undefined): string => {
    if (!distanceInMetres && distanceInMetres !== 0) return 'N/A'
    if (distanceInMetres >= 1000) {
      return `${(distanceInMetres / 1000).toFixed(1)} km`
    }
    return `${distanceInMetres} m`
  }

  return (
    <>
      {/* Toast Notification */}
      {listMessage && (
        <Toast
          message={listMessage.text}
          type={listMessage.type}
          onClose={() => setListMessage(null)}
        />
      )}

    <div className="space-y-8">

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {showInvestButton && (
          <button
            type="button"
            onClick={() => {
              const ref = searchParams.get('ref')
              const url = ref ? `/analyse/${propertyId || 'default'}?ref=${ref}` : `/analyse/${propertyId || 'default'}`
              router.push(url)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Analyse Investment</span>
            <span className="sm:hidden">Analyse</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsListModalOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            listsContainingProperty > 0 
              ? 'bg-green-700 hover:bg-green-600 text-white border-green-600' 
              : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {listsContainingProperty > 0 ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
          <span className="hidden sm:inline">
            {listsContainingProperty > 0 
              ? `In ${listsContainingProperty} ${listsContainingProperty === 1 ? 'List' : 'Lists'}` 
              : 'Add to List'}
          </span>
          <span className="sm:hidden">
            {listsContainingProperty > 0 ? `${listsContainingProperty}` : 'Add'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push(`/tasks?property=${propertyId}&ref=details&detailsId=${propertyId}`)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            taskCount > 0 
              ? 'bg-blue-700 hover:bg-blue-600 text-white border-blue-600' 
              : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="hidden sm:inline">
            {taskCount > 0 
              ? `${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}` 
              : 'View Tasks'}
          </span>
          <span className="sm:hidden">
            {taskCount > 0 ? `${taskCount}` : 'Tasks'}
          </span>
        </button>
      </div>

      {/* Overview - Main Property Info */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 animate-enter-subtle">
        <h2 className="text-2xl font-bold text-white mb-6">🏠 Overview</h2>
        {/* Address full-width row */}
        <div className="bg-black/30 rounded-md p-4 mb-4">
          <h3 className="text-xs font-medium text-gray-300 mb-1">Address</h3>
          <p className="text-lg sm:text-xl font-semibold text-white break-words">{address}</p>
        </div>
        
        {/* Property Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {/* Type */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">Type</h3>
            <p className="text-base font-semibold text-white">{attributes.property_type?.value || 'N/A'}</p>
          </div>
          {/* Beds */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">Beds</h3>
            <p className="text-xl font-bold text-white">{attributes.number_of_bedrooms?.value || 'N/A'}</p>
          </div>
          {/* Baths */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">Baths</h3>
            <p className="text-xl font-bold text-white">{attributes.number_of_bathrooms?.value || 'N/A'}</p>
          </div>
          {/* Size */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">Size</h3>
            <p className="text-xl font-bold text-white">{attributes.internal_area_square_metres || 'N/A'} m²</p>
          </div>
          {/* Tenure */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">Tenure</h3>
            <p className="text-base font-semibold text-white capitalize">{attributes.tenure?.tenure_type || 'N/A'}</p>
          </div>
          {/* EPC */}
          <div className="bg-black/30 rounded-md p-3">
            <h3 className="text-xs font-medium text-gray-300 mb-1">EPC</h3>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-yellow-400">{attributes.energy_performance?.energy_efficiency?.current_rating || 'N/A'}</p>
              {attributes.energy_performance?.energy_efficiency?.potential_rating && (
                <span className="text-xs text-gray-300">→ {attributes.energy_performance.energy_efficiency.potential_rating}</span>
              )}
            </div>
          </div>
        </div>

        {/* Valuations Section - designed for multiple valuations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {/* Calculated Valuation - Always show */}
          <div className="bg-black/30 rounded-md p-4 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-medium text-gray-300">Estimated Valuation</h3>
                  <button
                    type="button"
                    onClick={() => setIsComparablesModalOpen(true)}
                    className="text-xs text-gray-400 hover:text-white underline decoration-dotted underline-offset-2 transition-colors focus:outline-none"
                  >
                    Manage comparables
                  </button>
                </div>
                <p className={`text-2xl font-bold ${calculatedValuation ? 'text-white' : 'text-gray-500'}`}>
                  £{calculatedValuation ? calculatedValuation.toLocaleString('en-GB') : '0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {calculatedValuation ? (
                    <>Based on {comparables.size} comparable{comparables.size !== 1 ? 's' : ''}</>
                  ) : (
                    <>Select comparables to calculate</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Calculated Rent */}
          <div className="bg-black/30 rounded-md p-4 border-l-4 border-orange-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-300 mb-1">Estimated Rent</h3>
                <p className={`text-2xl font-bold ${calculatedRent ? 'text-white' : 'text-gray-500'}`}>
                  £{calculatedRent ? calculatedRent.toLocaleString('en-GB') : '0'}
                  {calculatedRent && <span className="text-sm text-gray-300">/pcm</span>}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {calculatedRent ? (
                    <>Based on {matchingRentalListingsCount} rental listing{matchingRentalListingsCount !== 1 ? 's' : ''}</>
                  ) : (
                    <>No matching rental listings</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Calculated Yield */}
          <div className="bg-black/30 rounded-md p-4 border-l-4 border-teal-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-300 mb-1">Estimated Yield</h3>
                <p className={`text-2xl font-bold ${calculatedYield ? 'text-white' : 'text-gray-500'}`}>
                  {calculatedYield ? calculatedYield.toFixed(2) : '0.00'}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {calculatedYield ? (
                    <>Gross annual yield</>
                  ) : (
                    <>Calculate rent & valuation first</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Maps Section */}
        {(streetViewImageUrl || mapEmbedUrl) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Left: Interactive Google Map with pin */}
            {mapEmbedUrl && (
              <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden border border-purple-500/30">
                <iframe
                  title="Property Location Map"
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapEmbedUrl}
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/75"
                >
                  Open in Maps
                </a>
              </div>
            )}

            {/* Right: Static Google Street View image */}
            {streetViewImageUrl && streetViewUrl && (
              <div>
                <a
                  href={streetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Google Street View"
                  title="Open Google Street View"
                  className="block group"
                >
                  <div className="relative w-full">
                    <img
                      src={streetViewImageUrl}
                      alt="Google Street View"
                      className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover rounded-lg border border-purple-500/30"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/75">View on Street View</span>
                    </div>
                    <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                </a>
                <p className="mt-2 text-xs text-gray-400">Image © Google</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-lg p-2 sticky top-2 z-10 animate-enter-subtle-delayed-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === '📋 Basic Details' && (
      <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📋 Basic Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Ownership</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-black/30 rounded-md p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Company Owned</div>
                <div className="text-white">{attributes.ownership?.company_owned ? 'Yes' : 'No'}</div>
              </div>
              <div className="bg-black/30 rounded-md p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Overseas Owned</div>
                <div className="text-white">{attributes.ownership?.overseas_owned ? 'Yes' : 'No'}</div>
              </div>
              <div className="bg-black/30 rounded-md p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Social Housing</div>
                <div className="text-white">{attributes.ownership?.social_housing ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Council Tax</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-black/30 rounded-md p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Council Tax Band</div>
                <div className="text-white">{attributes.council_tax?.band || 'N/A'}</div>
              </div>
              <div className="bg-black/30 rounded-md p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Annual Charge</div>
                <div className="text-white">£{attributes.council_tax?.current_annual_charge?.toLocaleString() || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
      )}

      {selectedTab === '🗺️ Plot' && (
      <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🗺️ Plot</h2>
        </div>
        
        {attributes.plot?.polygons && attributes.plot.polygons.length > 0 ? (
          <div>
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden">
                <svg
                  viewBox="0 0 400 200"
                  className="w-full h-full"
                >
                  {(() => {
                    const polygon = attributes.plot.polygons[0]
                    if (!polygon?.epsg_4326_polygon?.coordinates?.[0]) return null
                    
                    const coords = polygon.epsg_4326_polygon.coordinates[0]
                    if (coords.length < 3) return null
                    
                    // Calculate bounds
                    const lats = coords.map(c => c[1])
                    const lngs = coords.map(c => c[0])
                    const minLat = Math.min(...lats)
                    const maxLat = Math.max(...lats)
                    const minLng = Math.min(...lngs)
                    const maxLng = Math.max(...lngs)
                    
                    // Add padding
                    const latRange = maxLat - minLat
                    const lngRange = maxLng - minLng
                    const padding = Math.max(latRange, lngRange) * 0.1
                    
                    const paddedMinLat = minLat - padding
                    const paddedMaxLat = maxLat + padding
                    const paddedMinLng = minLng - padding
                    const paddedMaxLng = maxLng + padding
                    
                    // Scale to fit viewBox with padding
                    const scaleX = 380 / (paddedMaxLng - paddedMinLng)
                    const scaleY = 180 / (paddedMaxLat - paddedMinLat)
                    const offsetX = 10
                    const offsetY = 10
                    
                    // Scale coordinates
                    const scaledCoords = coords.map(coord => [
                      (coord[0] - paddedMinLng) * scaleX + offsetX,
                      200 - ((coord[1] - paddedMinLat) * scaleY + offsetY) // Flip Y axis
                    ])
                    
                    // Create path
                    const pathData = scaledCoords.map((coord, i) => 
                      `${i === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`
                    ).join(' ') + ' Z'
                    
                    // Property center
                    const propX = (attributes.location?.coordinates?.longitude - paddedMinLng) * scaleX + offsetX
                    const propY = 200 - ((attributes.location?.coordinates?.latitude - paddedMinLat) * scaleY + offsetY)
                    
                    return (
                      <g>
                        <path
                          d={pathData}
                          fill="rgba(59, 130, 246, 0.2)"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2"
                        />
                        <circle
                          cx={propX}
                          cy={propY}
                          r="6"
                          fill="rgb(239, 68, 68)"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </g>
                    )
                  })()}
                  
                  {/* Legend */}
                  <g transform="translate(10, 10)">
                    <rect x="0" y="0" width="140" height="70" fill="rgba(0,0,0,0.8)" rx="4"/>
                    <text x="10" y="18" fill="white" fontSize="12" fontWeight="bold">Plot</text>
                    <line x1="10" y1="28" x2="30" y2="28" stroke="rgb(59, 130, 246)" strokeWidth="3"/>
                    <text x="35" y="33" fill="white" fontSize="10">Property boundary</text>
                    <circle cx="20" cy="45" r="4" fill="rgb(239, 68, 68)" stroke="white" strokeWidth="1"/>
                    <text x="30" y="50" fill="white" fontSize="10">Property location</text>
                  </g>
                </svg>
              </div>
              <div className="mt-4 text-sm text-gray-400 space-y-1">
                <p>Plot area: {attributes.plot.total_plot_area_square_metres} m² ({(attributes.plot.total_plot_area_square_metres * 10.764).toFixed(0)} sq ft)</p>
                <p>Property coordinates: {attributes.location?.coordinates?.latitude?.toFixed(6)}, {attributes.location?.coordinates?.longitude?.toFixed(6)}</p>
                <p>Plot last updated: {new Date(attributes.plot.polygons[0].date_polygon_updated).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Outdoor Space Information */}
            <div className="mt-6 bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Outdoor Space</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Area:</span>
                  <span className="text-white">{attributes.outdoor_space?.outdoor_space_area_square_metres || 'N/A'} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Garden Direction:</span>
                  <span className="text-white">{attributes.outdoor_space?.garden_direction || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Primary Orientation:</span>
                  <span className="text-white">{attributes.outdoor_space?.garden_primary_orientation || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Plot Data Available</h3>
            <p className="text-gray-400">Plot visualization data is not available for this property</p>
          </div>
        )}
      </div>
      )}

      {selectedTab === '📜 Transaction History' && (
      <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📜 Transaction History</h2>
        </div>
        
        {attributes.transactions && attributes.transactions.length > 0 ? (
          <div className="space-y-4">
            {attributes.transactions.map((transaction, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-650 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold text-white">£{transaction.price?.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Date: {transaction.date}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded">ID: {transaction.transaction_id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Transaction History Available</h3>
            <p className="text-gray-400">Transaction data is not available for this property</p>
          </div>
        )}
      </div>
      )}

      {selectedTab === '⚡ EPC' && (
      <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
        <h2 className="text-2xl font-bold text-white mb-6">⚡ EPC</h2>
        
        {/* EPC Rating Visualization */}
        {attributes.energy_performance?.energy_efficiency && (
          <div className="mb-8">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Current</div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    attributes.energy_performance.energy_efficiency.current_rating === 'A' ? 'bg-green-500' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'B' ? 'bg-green-400' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'C' ? 'bg-yellow-400' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'D' ? 'bg-orange-400' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'E' ? 'bg-orange-500' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'F' ? 'bg-red-400' :
                    attributes.energy_performance.energy_efficiency.current_rating === 'G' ? 'bg-red-500' :
                    'bg-gray-500'
                  } text-white`}>
                    {attributes.energy_performance.energy_efficiency.current_rating}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {attributes.energy_performance.energy_efficiency.current_efficiency}/100
                  </div>
                </div>
                
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-1">Potential</div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    attributes.energy_performance.energy_efficiency.potential_rating === 'A' ? 'bg-green-500' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'B' ? 'bg-green-400' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'C' ? 'bg-yellow-400' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'D' ? 'bg-orange-400' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'E' ? 'bg-orange-500' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'F' ? 'bg-red-400' :
                    attributes.energy_performance.energy_efficiency.potential_rating === 'G' ? 'bg-red-500' :
                    'bg-gray-500'
                  } text-white`}>
                    {attributes.energy_performance.energy_efficiency.potential_rating}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {attributes.energy_performance.energy_efficiency.potential_efficiency}/100
                  </div>
                </div>
              </div>
              
              {/* EPC Scale */}
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((rating) => (
                    <div key={rating} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center ${
                        rating === 'A' ? 'bg-green-500' :
                        rating === 'B' ? 'bg-green-400' :
                        rating === 'C' ? 'bg-yellow-400' :
                        rating === 'D' ? 'bg-orange-400' :
                        rating === 'E' ? 'bg-orange-500' :
                        rating === 'F' ? 'bg-red-400' :
                        'bg-red-500'
                      } text-white`}>
                        {rating}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {rating === 'A' ? '92-100' :
                         rating === 'B' ? '81-91' :
                         rating === 'C' ? '69-80' :
                         rating === 'D' ? '55-68' :
                         rating === 'E' ? '39-54' :
                         rating === 'F' ? '21-38' :
                         '1-20'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Ratings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Rating:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{attributes.energy_performance?.energy_efficiency?.current_rating || 'N/A'}</span>
                  <span className="text-sm text-gray-400">({attributes.energy_performance?.energy_efficiency?.current_efficiency || 'N/A'})</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Potential Rating:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{attributes.energy_performance?.energy_efficiency?.potential_rating || 'N/A'}</span>
                  <span className="text-sm text-gray-400">({attributes.energy_performance?.energy_efficiency?.potential_efficiency || 'N/A'})</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Is Expired:</span>
                <span className={`font-bold ${isEpExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {isEpExpired ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expiry Date:</span>
                <span className="text-white">{attributes.energy_performance?.expiry_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Construction Period:</span>
                <span className="text-white">{attributes.construction_age_band || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Systems</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Main Heat:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.mainheat_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.mainheat_energy_eff || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hot Water:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.hotwater_description || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mains Gas:</span>
                <span className="text-white">{attributes.utilities?.mains_gas?.value ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Building Elements</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Windows:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.windows_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.windows_energy_eff || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Walls:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.walls_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.walls_energy_eff || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Roof:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.roof_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.roof_energy_eff || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Additional Elements</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Floor:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.floor_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.floor_energy_eff || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lighting:</span>
                <div className="text-right">
                  <p className="text-white">{attributes.energy_performance?.lighting_description || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.energy_performance?.lighting_energy_eff || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Construction Materials</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Floor Type:</span>
                <span className="text-white">{attributes.construction_materials?.floor_type?.value || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Roof Type:</span>
                <span className="text-white">{attributes.construction_materials?.roof_type?.value || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wall Type:</span>
                <span className="text-white">{attributes.construction_materials?.wall_type?.value || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Glazing Type:</span>
                <span className="text-white">{attributes.construction_materials?.glazing_type?.value || 'N/A'}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      )}

      {selectedTab === '⚠️ Risk assesment' && (
      <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
        <h2 className="text-2xl font-bold text-white mb-6">⚠️ Risk assesment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Flood Risk</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Rivers & Seas:</span>
                <div className="text-right">
                  <p className="text-white capitalize">{attributes.flood_risk?.rivers_and_seas?.risk || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.flood_risk?.rivers_and_seas?.risk_interpretation || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Surface Water Risk</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level:</span>
                <div className="text-right">
                  <p className="text-white capitalize">{attributes.surface_water?.risk || 'N/A'}</p>
                  <p className="text-sm text-gray-400">{attributes.surface_water?.risk_interpretation || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Restrictive Covenants</h3>
            <div className="space-y-3">
              {attributes.restrictive_covenants && attributes.restrictive_covenants.length > 0 ? (
                attributes.restrictive_covenants.map((covenant, index) => (
                  <div key={index} className="bg-gray-700 rounded p-3">
                    <p className="text-sm text-gray-400">ID: {covenant.unique_identifier}</p>
                    <p className="text-white">{covenant.associated_property_description}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No restrictive covenants found</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Coastal Erosion</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Can Have Erosion Plan:</span>
                <span className="text-white">{attributes.coastal_erosion?.can_have_erosion_plan ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plans Available:</span>
                <span className="text-white">{attributes.coastal_erosion?.plans ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}


      {selectedTab === '🏠 Listed Nearby' && attributes.nearby_listings && (attributes.nearby_listings.sale_listings?.length > 0 || attributes.nearby_listings.rental_listings?.length > 0) && (
        <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
          <h2 className="text-2xl font-bold text-white mb-6">🏠 Nearby Listings</h2>
          
          {/* Sub-tabs for Sale/Rent */}
          <div className="flex gap-2 mb-6">
            {attributes.nearby_listings.sale_listings && attributes.nearby_listings.sale_listings.length > 0 && (
              <button
                onClick={() => setNearbyListingsSubTab('sale')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  nearbyListingsSubTab === 'sale'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                For Sale ({attributes.nearby_listings.sale_listings.length})
              </button>
            )}
            {attributes.nearby_listings.rental_listings && attributes.nearby_listings.rental_listings.length > 0 && (
              <button
                onClick={() => setNearbyListingsSubTab('rent')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  nearbyListingsSubTab === 'rent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                For Rent ({attributes.nearby_listings.rental_listings.length})
              </button>
            )}
          </div>
          
          {/* Price Comparison Chart - Show only selected type */}
          <div className="mb-8">
            {nearbyListingsSubTab === 'sale' && attributes.nearby_listings.sale_listings && attributes.nearby_listings.sale_listings.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Sale Prices Comparison</h3>
                <div className="space-y-2">
                  {(() => {
                    const prices = attributes.nearby_listings.sale_listings
                      .filter(l => l.price)
                      .map(l => l.price)
                      .sort((a, b) => a - b)
                    
                    if (prices.length === 0) return <p className="text-gray-400">No price data available</p>
                    
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                    const propertyValue = avgPrice
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="text-white">£{minPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average:</span>
                          <span className="text-white">£{avgPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Highest:</span>
                          <span className="text-white">£{maxPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">This Property:</span>
                          <span className="text-green-400 font-bold">£{propertyValue.toLocaleString()}</span>
                        </div>
                        
                        {/* Price bar visualization */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${((propertyValue - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>£{(minPrice / 1000).toFixed(0)}k</span>
                            <span>£{(maxPrice / 1000).toFixed(0)}k</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {nearbyListingsSubTab === 'rent' && attributes.nearby_listings.rental_listings && attributes.nearby_listings.rental_listings.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Rental Prices Comparison</h3>
                <div className="space-y-2">
                  {(() => {
                    const prices = attributes.nearby_listings.rental_listings
                      .filter(l => l.price)
                      .map(l => l.price)
                      .sort((a, b) => a - b)
                    
                    if (prices.length === 0) return <p className="text-gray-400">No price data available</p>
                    
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="text-white">£{minPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average:</span>
                          <span className="text-white">£{avgPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Highest:</span>
                          <span className="text-white">£{maxPrice.toLocaleString()}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">This Property:</span>
                          <span className="text-blue-400 font-bold">£{estimatedRent.toLocaleString()}/month</span>
                        </div>
                        
                        {/* Price bar visualization */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${((estimatedRent - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>£{minPrice}/mo</span>
                            <span>£{maxPrice}/mo</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Listings Grid - Show only selected type */}
          <div>
            {nearbyListingsSubTab === 'sale' && attributes.nearby_listings.sale_listings && attributes.nearby_listings.sale_listings.length > 0 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attributes.nearby_listings.sale_listings.map((listing, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors cursor-pointer">
                      {/* Property Image */}
                      {listing.main_image_url && (
                        <div 
                          className="relative h-48 w-full"
                          onClick={() => listing.images && listing.images.length > 0 ? openImageGallery(listing.images, 0) : null}
                        >
                          <img
                            src={listing.main_image_url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {listing.images?.length || 0} photos
                          </div>
                          {listing.images && listing.images.length > 1 && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm">
                                Click to view gallery
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-400 capitalize">{listing.property_type?.value}</span>
                          <span className="text-xl font-bold text-white">£{listing.price?.toLocaleString()}</span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-1">{listing.address?.royal_mail_format?.thoroughfare}</p>
                        <p className="text-xs text-gray-400 mb-3">{listing.address?.royal_mail_format?.postcode}</p>
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex space-x-4 text-sm">
                            <span className="text-gray-400">{listing.number_of_bedrooms} bed</span>
                            <span className="text-gray-400">{listing.number_of_bathrooms} bath</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            listing.status === 'Available' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          <p>Listed: {new Date(listing.listed_date).toLocaleDateString()}</p>
                          <p>Agent: {listing.agent?.company_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nearbyListingsSubTab === 'rent' && attributes.nearby_listings.rental_listings && attributes.nearby_listings.rental_listings.length > 0 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attributes.nearby_listings.rental_listings.map((listing, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors cursor-pointer">
                      {/* Property Image */}
                      {listing.main_image_url && (
                        <div 
                          className="relative h-48 w-full"
                          onClick={() => listing.images && listing.images.length > 0 ? openImageGallery(listing.images, 0) : null}
                        >
                          <img
                            src={listing.main_image_url}
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {listing.images?.length || 0} photos
                          </div>
                          {listing.images && listing.images.length > 1 && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm">
                                Click to view gallery
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-400 capitalize">{listing.property_type?.value}</span>
                          <span className="text-xl font-bold text-white">£{listing.price?.toLocaleString()}/mo</span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-1">{listing.address?.royal_mail_format?.thoroughfare}</p>
                        <p className="text-xs text-gray-400 mb-3">{listing.address?.royal_mail_format?.postcode}</p>
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex space-x-4 text-sm">
                            <span className="text-gray-400">{listing.number_of_bedrooms} bed</span>
                            <span className="text-gray-400">{listing.number_of_bathrooms} bath</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            listing.status === 'Available' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          <p>Listed: {new Date(listing.listed_date).toLocaleDateString()}</p>
                          <p>Agent: {listing.agent?.company_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === '🚌 Transport & Education' && (attributes.transport || attributes.education) && (
        <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
          <h2 className="text-2xl font-bold text-white mb-6">🚌 Transport & Education</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transport Section */}
            {attributes.transport && (
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Public Transport</h3>
                
                {/* Bus Stops */}
                {attributes.transport.public?.bus_coach && attributes.transport.public.bus_coach.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-400 mb-3">Bus Stops ({attributes.transport.public.bus_coach.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attributes.transport.public.bus_coach.slice(0, 5).map((stop, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium text-sm">{stop.stop_name}</p>
                              <p className="text-gray-400 text-xs">Code: {stop.atco_code}</p>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {(stop.distance_in_metres / 1000).toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      ))}
                      {attributes.transport.public.bus_coach.length > 5 && (
                        <p className="text-gray-400 text-sm text-center">
                          +{attributes.transport.public.bus_coach.length - 5} more stops
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rail Stations */}
                {attributes.transport.public?.rail && attributes.transport.public.rail.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-400 mb-3">Rail Stations ({attributes.transport.public.rail.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attributes.transport.public.rail.slice(0, 3).map((station, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-medium text-sm">{station.stop_name}</p>
                              <p className="text-gray-400 text-xs">Code: {station.atco_code}</p>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {(station.distance_in_metres / 1000).toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      ))}
                      {attributes.transport.public.rail.length > 3 && (
                        <p className="text-gray-400 text-sm text-center">
                          +{attributes.transport.public.rail.length - 3} more stations
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Education Section */}
            {attributes.education && (
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Nearby Schools</h3>
                
                {/* Primary Schools */}
                {attributes.education.primary && attributes.education.primary.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-400 mb-3">Primary Schools ({attributes.education.primary.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attributes.education.primary.slice(0, 4).map((school, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{school.name}</p>
                              <p className="text-gray-400 text-xs">{school.postcode}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  school.school_rating === 'Outstanding' ? 'bg-green-600 text-white' :
                                  school.school_rating === 'Good' ? 'bg-blue-600 text-white' :
                                  school.school_rating === 'Requires Improvement' ? 'bg-yellow-600 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  {school.school_rating}
                                </span>
                              </div>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {(school.distance_in_metres / 1000).toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      ))}
                      {attributes.education.primary.length > 4 && (
                        <p className="text-gray-400 text-sm text-center">
                          +{attributes.education.primary.length - 4} more schools
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Secondary Schools */}
                {attributes.education.secondary && attributes.education.secondary.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-400 mb-3">Secondary Schools ({attributes.education.secondary.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attributes.education.secondary.slice(0, 3).map((school, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{school.name}</p>
                              <p className="text-gray-400 text-xs">{school.postcode}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  school.school_rating === 'Outstanding' ? 'bg-green-600 text-white' :
                                  school.school_rating === 'Good' ? 'bg-blue-600 text-white' :
                                  school.school_rating === 'Requires Improvement' ? 'bg-yellow-600 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  {school.school_rating}
                                </span>
                              </div>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {(school.distance_in_metres / 1000).toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      ))}
                      {attributes.education.secondary.length > 3 && (
                        <p className="text-gray-400 text-sm text-center">
                          +{attributes.education.secondary.length - 3} more schools
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Nursery Schools */}
                {attributes.education.nursery && attributes.education.nursery.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-400 mb-3">Nursery Schools ({attributes.education.nursery.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {attributes.education.nursery.slice(0, 3).map((school, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{school.name}</p>
                              <p className="text-gray-400 text-xs">{school.postcode}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  school.school_rating === 'Outstanding' ? 'bg-green-600 text-white' :
                                  school.school_rating === 'Good' ? 'bg-blue-600 text-white' :
                                  school.school_rating === 'Requires Improvement' ? 'bg-yellow-600 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  {school.school_rating}
                                </span>
                              </div>
                            </div>
                            <span className="text-blue-400 text-sm font-medium">
                              {(school.distance_in_metres / 1000).toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      ))}
                      {attributes.education.nursery.length > 3 && (
                        <p className="text-gray-400 text-sm text-center">
                          +{attributes.education.nursery.length - 3} more schools
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === '📈 Market' && attributes.market_statistics && (
        <div className="bg-gray-800 rounded-lg p-8 animate-enter-subtle-delayed-3">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Market</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Outcode Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Properties:</span>
                  <span className="text-white">{attributes.market_statistics.outcode?.count_of_properties?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Properties Sold (12 months):</span>
                  <span className="text-white">{attributes.market_statistics.outcode?.count_total_properties_sold_last_12_months?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Price (12 months):</span>
                  <span className="text-white">£{attributes.market_statistics.outcode?.average_price_properties_sold_last_12_months?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Trend Chart */}
          {attributes.market_statistics.outcode?.sales_yearly && attributes.market_statistics.outcode.sales_yearly.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">Price Trend (Last 10 Years)</h3>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="relative w-full h-64">
                  <svg viewBox="0 0 800 200" className="w-full h-full">
                    {(() => {
                      const data = attributes.market_statistics.outcode.sales_yearly
                        .filter(d => d.year >= 2014)
                        .sort((a, b) => a.year - b.year)
                      
                      if (data.length === 0) return null
                      
                      const prices = data.map(d => d.average_price)
                      const minPrice = Math.min(...prices)
                      const maxPrice = Math.max(...prices)
                      const priceRange = maxPrice - minPrice
                      
                      const width = 760
                      const height = 160
                      const padding = 20
                      
                      const points = data.map((d, i) => {
                        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding
                        const y = height - padding - ((d.average_price - minPrice) / priceRange) * (height - 2 * padding)
                        return { x, y, price: d.average_price, year: d.year }
                      })
                      
                      const pathData = points.map((point, i) => 
                        `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                      ).join(' ')
                      
                      return (
                        <g>
                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                            <line
                              key={i}
                              x1={padding}
                              y1={height - padding - ratio * (height - 2 * padding)}
                              x2={width - padding}
                              y2={height - padding - ratio * (height - 2 * padding)}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="1"
                            />
                          ))}
                          
                          {/* Price line */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="3"
                          />
                          
                          {/* Data points */}
                          {points.map((point, i) => (
                            <g key={i}>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="rgb(59, 130, 246)"
                                stroke="white"
                                strokeWidth="2"
                              />
                              {/* Tooltip on hover */}
                              <text
                                x={point.x}
                                y={point.y - 10}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                className="opacity-0 hover:opacity-100"
                              >
                                £{(point.price / 1000).toFixed(0)}k
                              </text>
                            </g>
                          ))}
                          
                          {/* Y-axis labels */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                            <text
                              key={i}
                              x={5}
                              y={height - padding - ratio * (height - 2 * padding) + 4}
                              fill="white"
                              fontSize="10"
                            >
                              £{((minPrice + ratio * priceRange) / 1000).toFixed(0)}k
                            </text>
                          ))}
                          
                          {/* X-axis labels */}
                          {points.filter((_, i) => i % 2 === 0).map((point, i) => (
                            <text
                              key={i}
                              x={point.x}
                              y={height - 5}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                            >
                              {point.year}
                            </text>
                          ))}
                        </g>
                      )
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List Selection Modal */}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto border border-gray-600">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-600 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add to List</h3>
                <button
                  onClick={closeListModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Create New List Section */}
              {!isCreatingList ? (
                <button
                  onClick={() => setIsCreatingList(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New List
                </button>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">New List</h4>
                    <button
                      onClick={() => {
                        setIsCreatingList(false)
                        setNewListName('')
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateNewList()
                      }
                    }}
                    placeholder="Enter list name..."
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateNewList}
                    disabled={!newListName.trim()}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
                  >
                    Create
                  </button>
                </div>
              )}

              {/* Existing Lists */}
              {allLists.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 uppercase">Existing Lists</h4>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {allLists.map((list) => {
                      const isInList = isPropertyInList(list)
                      return (
                        <button
                          key={list.id}
                          onClick={() => handleTogglePropertyInList(list.id)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors border ${
                            isInList
                              ? 'bg-green-900 border-green-600 text-white hover:bg-green-800'
                              : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{list.name}</p>
                              <p className={`text-xs ${isInList ? 'text-green-300' : 'text-gray-400'}`}>
                                {list.propertyIds.length} {list.propertyIds.length === 1 ? 'property' : 'properties'}
                              </p>
                            </div>
                            {isInList ? (
                              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {allLists.length === 0 && !isCreatingList && (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No lists yet. Create your first list to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparables Modal */}
      {isComparablesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto border border-gray-600">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-600 p-6 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white">🏘️ Sold Comparables</h3>
                <button
                  onClick={() => setIsComparablesModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {comparables.size > 0 && (
                <div className="text-sm text-gray-300">
                  {comparables.size} comparable{comparables.size !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-6">
                Selected comparables are used to calculate the property valuation shown in the Overview section. 
                Add or remove comparables to refine the estimated value based on similar properties sold nearby.
              </p>

              {/* Filters Section */}
              {attributes.nearby_completed_transactions && attributes.nearby_completed_transactions.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Property Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                      <select
                        value={filters.propertyType}
                        onChange={(e) => updateFilter('propertyType', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        {getUniquePropertyTypes(attributes.nearby_completed_transactions).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Beds Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Beds</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.minBeds}
                          onChange={(e) => updateFilter('minBeds', e.target.value)}
                          min={getMinMaxValues(attributes.nearby_completed_transactions).minBeds}
                          max={getMinMaxValues(attributes.nearby_completed_transactions).maxBeds}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.maxBeds}
                          onChange={(e) => updateFilter('maxBeds', e.target.value)}
                          min={getMinMaxValues(attributes.nearby_completed_transactions).minBeds}
                          max={getMinMaxValues(attributes.nearby_completed_transactions).maxBeds}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Baths Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Baths</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.minBaths}
                          onChange={(e) => updateFilter('minBaths', e.target.value)}
                          min={getMinMaxValues(attributes.nearby_completed_transactions).minBaths}
                          max={getMinMaxValues(attributes.nearby_completed_transactions).maxBaths}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.maxBaths}
                          onChange={(e) => updateFilter('maxBaths', e.target.value)}
                          min={getMinMaxValues(attributes.nearby_completed_transactions).minBaths}
                          max={getMinMaxValues(attributes.nearby_completed_transactions).maxBaths}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="lg:col-span-2 flex items-end">
                      <div className="text-sm text-gray-300">
                        {(() => {
                          const filtered = filterTransactions(attributes.nearby_completed_transactions)
                          return `${filtered.length} of ${attributes.nearby_completed_transactions.length} properties`
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                {attributes.nearby_completed_transactions && attributes.nearby_completed_transactions.length > 0 ? (
                  <div className="space-y-2">
                    {/* Sort transactions: comparables first, then by distance */}
                    {(() => {
                      const filteredTransactions = filterTransactions(attributes.nearby_completed_transactions)
                      const sortedTransactions = [...filteredTransactions].sort((a, b) => {
                        const aIsComparable = comparables.has(a.street_group_property_id)
                        const bIsComparable = comparables.has(b.street_group_property_id)
                        
                        // Comparables first
                        if (aIsComparable && !bIsComparable) return -1
                        if (!aIsComparable && bIsComparable) return 1
                        
                        // Then by distance
                        return (a.distance_in_metres || 0) - (b.distance_in_metres || 0)
                      })
                      
                      if (sortedTransactions.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-400 text-lg">No properties match your filters</p>
                            <button
                              onClick={clearFilters}
                              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              Clear Filters
                            </button>
                          </div>
                        )
                      }
                      
                      // Split transactions into selected and others
                      const selectedComparables = sortedTransactions.filter(t => comparables.has(t.street_group_property_id))
                      const otherProperties = sortedTransactions.filter(t => !comparables.has(t.street_group_property_id))
                      
                      return (
                        <>
                          {/* Render selected comparables */}
                          {selectedComparables.map((transaction, index) => {
                        const isComparable = comparables.has(transaction.street_group_property_id)
                        
                        return (
                          <div 
                            key={transaction.street_group_property_id || index} 
                            className="bg-gray-700 rounded-lg p-3 transition-all duration-200 hover:bg-gray-650"
                          >
                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                              {/* Top row: Address, badges, date */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-gray-300 truncate">{transaction.address?.street_group_format?.address_lines}</p>
                                  <span className="inline-flex items-center bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    {formatDistance(transaction.distance_in_metres)} away
                                  </span>
                                  <span className={`inline-flex items-center text-white text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isComparable ? 'bg-green-600' : 'bg-gray-600'
                                  }`}>
                                    {isComparable ? '✓ Comparable' : 'Not selected'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 whitespace-nowrap">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                              </div>
                              
                              {/* Price */}
                              <p className="text-white font-semibold text-base mb-1">£{transaction.price?.toLocaleString()}</p>
                              
                              {/* Property details in compact inline format */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span>{transaction.property_type}</span>
                                  <span>•</span>
                                  <span>{transaction.number_of_bedrooms} bed</span>
                                  <span>•</span>
                                  <span>{transaction.number_of_bathrooms} bath</span>
                                  <span>•</span>
                                  <span>{transaction.internal_area_square_metres}m²</span>
                                </div>
                                
                                {/* Action button bottom right */}
                                <button
                                  onClick={() => toggleComparable(transaction.street_group_property_id)}
                                  className={`px-3 py-1 rounded border text-sm font-medium transition-all whitespace-nowrap ${
                                    isComparable
                                      ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                                      : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                                  }`}
                                >
                                  {isComparable ? 'Remove' : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Heading for other properties */}
                      {otherProperties.length > 0 && (
                        <div className="pt-4 pb-2">
                          <h3 className="text-lg font-semibold text-white">Other properties sold nearby</h3>
                        </div>
                      )}
                      
                      {/* Render other properties */}
                      {otherProperties.map((transaction, index) => {
                        const isComparable = comparables.has(transaction.street_group_property_id)
                        
                        return (
                          <div 
                            key={transaction.street_group_property_id || index} 
                            className="bg-gray-700 rounded-lg p-3 transition-all duration-200 hover:bg-gray-650"
                          >
                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                              {/* Top row: Address, badges, date */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm text-gray-300 truncate">{transaction.address?.street_group_format?.address_lines}</p>
                                  <span className="inline-flex items-center bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    {formatDistance(transaction.distance_in_metres)} away
                                  </span>
                                  <span className={`inline-flex items-center text-white text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isComparable ? 'bg-green-600' : 'bg-gray-600'
                                  }`}>
                                    {isComparable ? '✓ Comparable' : 'Not selected'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 whitespace-nowrap">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                              </div>
                              
                              {/* Price */}
                              <p className="text-white font-semibold text-base mb-1">£{transaction.price?.toLocaleString()}</p>
                              
                              {/* Property details in compact inline format */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span>{transaction.property_type}</span>
                                  <span>•</span>
                                  <span>{transaction.number_of_bedrooms} bed</span>
                                  <span>•</span>
                                  <span>{transaction.number_of_bathrooms} bath</span>
                                  <span>•</span>
                                  <span>{transaction.internal_area_square_metres}m²</span>
                                </div>
                                
                                {/* Action button bottom right */}
                                <button
                                  onClick={() => toggleComparable(transaction.street_group_property_id)}
                                  className={`px-3 py-1 rounded border text-sm font-medium transition-all whitespace-nowrap ${
                                    isComparable
                                      ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                                      : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                                  }`}
                                >
                                  {isComparable ? 'Remove' : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-400">No nearby completed transactions available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            {/* Close button */}
            <button
              onClick={closeImageGallery}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {selectedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main image */}
            <div className="relative">
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Property image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg=='
                }}
              />
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} of {selectedImages.length}
              </div>
            </div>

            {/* Thumbnail strip */}
            {selectedImages.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                {selectedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-600'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlCOUI5QiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5OPC90ZXh0Pgo8L3N2Zz4K'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}


