'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '../../components/ConfirmDialog'
import { loadCalculatorData, saveCalculatorData } from '../../../lib/persistence'

type RefurbishmentLevel = 'basic' | 'standard' | 'premium'

interface UploadedImage {
  id: string
  file: File
  previewUrl: string
  name: string
}

interface EstimationItem {
  category: string
  item_name: string
  description: string
  quantity: number
  unit: string
  unit_cost_basic: number
  total_cost_basic: number
  unit_cost_standard: number
  total_cost_standard: number
  unit_cost_premium: number
  total_cost_premium: number
  notes: string
}

interface EstimationResult {
  items: EstimationItem[]
  total_cost_basic: number
  total_cost_standard: number
  total_cost_premium: number
  summary: string
  error: string
}

type Step = 'details' | 'upload' | 'finetune' | 'analyzing' | 'results'

interface RefurbishmentEstimatorProps {
  uprn: string
  onDataUpdate?: () => void
}

export default function RefurbishmentEstimator({ uprn, onDataUpdate }: RefurbishmentEstimatorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [propertyData, setPropertyData] = useState<any>(null)
  const [dataReady, setDataReady] = useState(false)
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('details')
  
  // Property details state
  const [numBeds, setNumBeds] = useState<string>('')
  const [numBaths, setNumBaths] = useState<string>('')
  const [squareMeters, setSquareMeters] = useState<string>('')
  const [propertyType, setPropertyType] = useState<string>('')
  const [outdoorSpaceArea, setOutdoorSpaceArea] = useState<string>('')
  
  // Upload section state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [dragActive, setDragActive] = useState(false)
  
  // Fine-tune section state
  const [itemsToInclude, setItemsToInclude] = useState<string[]>([])
  const [itemsToExclude, setItemsToExclude] = useState<string[]>([])
  const [newIncludeItem, setNewIncludeItem] = useState<string>('')
  const [newExcludeItem, setNewExcludeItem] = useState<string>('')
  
  // Analysis states
  const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<RefurbishmentLevel>('standard')
  const [analyzingMessage, setAnalyzingMessage] = useState<string>('Collecting property details...')
  
  // Edit states
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editAmounts, setEditAmounts] = useState<{[key: number]: {basic: number, standard: number, premium: number}}>({})
  
  // Confirmation dialog state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false)

  // Helper function to safely extract property data (same as dashboard)
  const getPropertyValue = (path: string, fallback: string = 'N/A') => {
    if (!propertyData?.data?.data?.attributes) return fallback
    
    const keys = path.split('.')
    let value = propertyData.data.data.attributes
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return fallback
      }
    }
    
    // Handle object values with meta/value structure
    if (value && typeof value === 'object') {
      // If it has a value property, use that
      if ('value' in value) {
        return value.value !== undefined && value.value !== null ? value.value : fallback
      }
      // If it has meta and value, use value
      if ('meta' in value && 'value' in value) {
        return value.value !== undefined && value.value !== null ? value.value : fallback
      }
      // For other object structures, try to extract meaningful data
      if (value.occupancy_type) {
        return value.occupancy_type
      }
      if (typeof value.owner_occupied === 'boolean') {
        return value.owner_occupied ? 'Owner Occupied' : 'Not Owner Occupied'
      }
      // Fallback to string representation
      return String(value)
    }
    
    return value !== undefined && value !== null ? value : fallback
  }

  // Load property data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (uprn) {
          const response = await fetch(`/api/properties/${uprn}`)
          
          if (!response.ok) {
            throw new Error('Failed to load property data')
          }
          
          const data = await response.json()
          
          // Only set property data and stop loading if we have valid data structure
          if (data?.data?.data?.attributes) {
            setPropertyData(data)
            
            // Populate form fields with property data
            const attrs = data.data.data.attributes
            if (attrs.number_of_bedrooms?.value) {
              setNumBeds(attrs.number_of_bedrooms.value.toString())
            }
            if (attrs.number_of_bathrooms?.value) {
              setNumBaths(attrs.number_of_bathrooms.value.toString())
            }
            if (attrs.internal_area_square_metres) {
              setSquareMeters(attrs.internal_area_square_metres.toString())
            }
            if (attrs.property_type?.value) {
              setPropertyType(attrs.property_type.value)
            }
            if (attrs.outdoor_space?.outdoor_space_area_square_metres) {
              setOutdoorSpaceArea(attrs.outdoor_space.outdoor_space_area_square_metres.toString())
            }
            
            // Only stop loading when we have all the data we need
            setLoading(false)
            setDataReady(true)
          } else {
            // If data structure is invalid, set propertyData to null but stop loading
            setPropertyData(null)
            setLoading(false)
            // Don't set dataReady to true for invalid data
          }
        }
      } catch (e) {
        console.error('Failed to load property data', e)
        setPropertyData(null)
        setLoading(false)
        // Don't set dataReady to true for errors
      }
    }
    loadData()
  }, [uprn])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl))
    }
  }, [])

  // Dynamic analyzing messages
  useEffect(() => {
    if (currentStep !== 'analyzing') return

    const messages = [
      'Collecting property details...',
      'Reviewing images...',
      'Extracting refurbishment items...',
      'Building schedule of work...'
    ]
    
    let messageIndex = 0
    setAnalyzingMessage(messages[0])

    const interval = setInterval(() => {
      messageIndex++
      if (messageIndex < messages.length) {
        setAnalyzingMessage(messages[messageIndex])
      }
    }, 4000 + Math.random() * 3000) // Random delay between 4-7 seconds

    return () => clearInterval(interval)
  }, [currentStep])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    setErrorMessage(null)

    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      setErrorMessage('Some files were skipped because they are not images')
    }

    // Check if adding these files would exceed the maximum
    const totalImages = uploadedImages.length + imageFiles.length
    if (totalImages > 15) {
      setErrorMessage(`You can only upload up to 15 images. You tried to add ${imageFiles.length} images but only have ${15 - uploadedImages.length} slots remaining.`)
      return
    }

    // Create preview URLs and add to state
    const newImages: UploadedImage[] = imageFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name
    }))

    setUploadedImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      // Cleanup the removed image's object URL
      const removed = prev.find(img => img.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return updated
    })
    setErrorMessage(null)
  }

  const clearAllImages = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl))
    setUploadedImages([])
    setErrorMessage(null)
  }

  const exportToCSV = () => {
    if (!estimationResult) return

    // Create CSV header
    const headers = [
      'Category',
      'Item Name',
      'Description',
      'Quantity',
      'Unit',
      'Unit Cost (£)',
      'Total Cost (£)',
      'Notes'
    ]

    // Create CSV rows
    const rows = estimationResult.items.map(item => [
      item.category,
      item.item_name,
      item.description,
      item.quantity.toString(),
      item.unit,
      selectedLevel === 'basic' ? item.unit_cost_basic.toString() :
        selectedLevel === 'standard' ? item.unit_cost_standard.toString() :
        item.unit_cost_premium.toString(),
      selectedLevel === 'basic' ? item.total_cost_basic.toString() :
        selectedLevel === 'standard' ? item.total_cost_standard.toString() :
        item.total_cost_premium.toString(),
      item.notes || ''
    ])

    // Add summary rows
    rows.push([]) // Empty row
    rows.push(['Summary', estimationResult.summary, '', '', '', '', '', ''])
    rows.push(['Quality Level', selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1), '', '', '', '', '', ''])
    rows.push(['Total Cost', '', '', '', '', '', 
      selectedLevel === 'basic' ? estimationResult.total_cost_basic.toString() :
      selectedLevel === 'standard' ? estimationResult.total_cost_standard.toString() :
      estimationResult.total_cost_premium.toString(), ''])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = cell.toString()
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      )
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `refurbishment_estimate_${getPropertyValue('address.street_group_format.address_lines').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleEstimate = async () => {
    if (uploadedImages.length < 5) {
      setErrorMessage('Please upload at least 5 images to continue')
      return
    }

    setCurrentStep('analyzing')
    setErrorMessage(null)

    try {
      // Convert all images to base64
      const base64Images = await Promise.all(
        uploadedImages.map(img => fileToBase64(img.file))
      )

      // Call the API
      const response = await fetch('/api/refurbishment-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          itemsToInclude: itemsToInclude.length > 0 ? itemsToInclude : undefined,
          itemsToExclude: itemsToExclude.length > 0 ? itemsToExclude : undefined,
          propertyDetails: {
            numBeds: numBeds || undefined,
            numBaths: numBaths || undefined,
            squareMeters: squareMeters || undefined,
            propertyType: propertyType || undefined,
            outdoorSpaceArea: outdoorSpaceArea || undefined,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to estimate refurbishment costs')
      }

      // Set the results
      setEstimationResult(result.data)
      setCurrentStep('results')
      
      if (result.data.error) {
        setErrorMessage(`AI reported: ${result.data.error}`)
      }

    } catch (error: any) {
      console.error('Error estimating refurbishment:', error)
      setErrorMessage(error.message || 'Failed to estimate refurbishment costs. Please try again.')
      setCurrentStep('details')
    }
  }

  const handleReset = () => {
    setCurrentStep('details')
    setUploadedImages([])
    setItemsToInclude([])
    setItemsToExclude([])
    setNewIncludeItem('')
    setNewExcludeItem('')
    setEstimationResult(null)
    setErrorMessage(null)
    setEditingItem(null)
    setEditAmounts({})
  }

  // Edit functions
  const startEditingItem = (index: number) => {
    setEditingItem(index)
    if (!editAmounts[index] && estimationResult) {
      const item = estimationResult.items[index]
      setEditAmounts(prev => ({
        ...prev,
        [index]: {
          basic: item.total_cost_basic,
          standard: item.total_cost_standard,
          premium: item.total_cost_premium
        }
      }))
    }
  }

  const saveEditItem = (index: number) => {
    if (!estimationResult) return
    
    const updatedItems = [...estimationResult.items]
    const editedAmounts = editAmounts[index]
    
    if (editedAmounts) {
      updatedItems[index] = {
        ...updatedItems[index],
        total_cost_basic: editedAmounts.basic,
        total_cost_standard: editedAmounts.standard,
        total_cost_premium: editedAmounts.premium
      }
    }
    
    // Recalculate totals
    const total_cost_basic = updatedItems.reduce((sum, item) => sum + item.total_cost_basic, 0)
    const total_cost_standard = updatedItems.reduce((sum, item) => sum + item.total_cost_standard, 0)
    const total_cost_premium = updatedItems.reduce((sum, item) => sum + item.total_cost_premium, 0)
    
    setEstimationResult({
      ...estimationResult,
      items: updatedItems,
      total_cost_basic,
      total_cost_standard,
      total_cost_premium
    })
    
    setEditingItem(null)
  }

  const cancelEditItem = () => {
    setEditingItem(null)
  }

  const deleteItem = (index: number) => {
    if (!estimationResult) return
    
    const updatedItems = estimationResult.items.filter((_, i) => i !== index)
    
    // Recalculate totals
    const total_cost_basic = updatedItems.reduce((sum, item) => sum + item.total_cost_basic, 0)
    const total_cost_standard = updatedItems.reduce((sum, item) => sum + item.total_cost_standard, 0)
    const total_cost_premium = updatedItems.reduce((sum, item) => sum + item.total_cost_premium, 0)
    
    setEstimationResult({
      ...estimationResult,
      items: updatedItems,
      total_cost_basic,
      total_cost_standard,
      total_cost_premium
    })
    
    // Clean up edit amounts
    const newEditAmounts = { ...editAmounts }
    delete newEditAmounts[index]
    setEditAmounts(newEditAmounts)
  }

  const updateEditAmount = (index: number, level: 'basic' | 'standard' | 'premium', value: number) => {
    setEditAmounts(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [level]: value
      }
    }))
  }

  // Debug functions
  const debugShowLoading = () => {
    setCurrentStep('analyzing')
    setErrorMessage(null)
  }

  const debugShowResults = () => {
    const fakeResult: EstimationResult = {
      items: [
        {
          category: 'Kitchen',
          item_name: 'Kitchen Refurbishment',
          description: 'Complete kitchen renovation including cabinets, worktops, and appliances',
          quantity: 1,
          unit: 'kitchen',
          unit_cost_basic: 15000,
          total_cost_basic: 15000,
          unit_cost_standard: 25000,
          total_cost_standard: 25000,
          unit_cost_premium: 40000,
          total_cost_premium: 40000,
          notes: 'Includes all fixtures and fittings'
        },
        {
          category: 'Bathroom',
          item_name: 'Bathroom Refurbishment',
          description: 'Complete bathroom renovation including sanitaryware, tiling, and fixtures',
          quantity: 2,
          unit: 'bathroom',
          unit_cost_basic: 8000,
          total_cost_basic: 16000,
          unit_cost_standard: 12000,
          total_cost_standard: 24000,
          unit_cost_premium: 18000,
          total_cost_premium: 36000,
          notes: 'Per bathroom'
        },
        {
          category: 'Flooring',
          item_name: 'Flooring Installation',
          description: 'New flooring throughout property including preparation and installation',
          quantity: 85,
          unit: 'm²',
          unit_cost_basic: 45,
          total_cost_basic: 3825,
          unit_cost_standard: 75,
          total_cost_standard: 6375,
          unit_cost_premium: 120,
          total_cost_premium: 10200,
          notes: 'Based on property area'
        },
        {
          category: 'Electrical',
          item_name: 'Electrical Rewiring',
          description: 'Complete electrical rewiring including consumer unit, sockets, and lighting',
          quantity: 1,
          unit: 'property',
          unit_cost_basic: 8000,
          total_cost_basic: 8000,
          unit_cost_standard: 12000,
          total_cost_standard: 12000,
          unit_cost_premium: 18000,
          total_cost_premium: 18000,
          notes: 'Includes all electrical work and certification'
        },
        {
          category: 'Plumbing',
          item_name: 'Plumbing Installation',
          description: 'Complete plumbing system including pipework, radiators, and boiler',
          quantity: 1,
          unit: 'property',
          unit_cost_basic: 6000,
          total_cost_basic: 6000,
          unit_cost_standard: 9000,
          total_cost_standard: 9000,
          unit_cost_premium: 14000,
          total_cost_premium: 14000,
          notes: 'Includes new boiler and heating system'
        },
        {
          category: 'Windows',
          item_name: 'Window Replacement',
          description: 'Double glazed window replacement throughout property',
          quantity: 8,
          unit: 'window',
          unit_cost_basic: 400,
          total_cost_basic: 3200,
          unit_cost_standard: 600,
          total_cost_standard: 4800,
          unit_cost_premium: 900,
          total_cost_premium: 7200,
          notes: 'Energy efficient double glazing'
        },
        {
          category: 'Doors',
          item_name: 'Door Replacement',
          description: 'Internal and external door replacement including frames',
          quantity: 6,
          unit: 'door',
          unit_cost_basic: 300,
          total_cost_basic: 1800,
          unit_cost_standard: 500,
          total_cost_standard: 3000,
          unit_cost_premium: 800,
          total_cost_premium: 4800,
          notes: 'Includes front door and internal doors'
        },
        {
          category: 'Painting',
          item_name: 'Interior Painting',
          description: 'Complete interior painting including walls, ceilings, and woodwork',
          quantity: 85,
          unit: 'm²',
          unit_cost_basic: 15,
          total_cost_basic: 1275,
          unit_cost_standard: 25,
          total_cost_standard: 2125,
          unit_cost_premium: 40,
          total_cost_premium: 3400,
          notes: 'High quality paint and preparation'
        },
        {
          category: 'Carpentry',
          item_name: 'Carpentry Work',
          description: 'Skirting boards, architraves, and general carpentry repairs',
          quantity: 1,
          unit: 'property',
          unit_cost_basic: 2000,
          total_cost_basic: 2000,
          unit_cost_standard: 3500,
          total_cost_standard: 3500,
          unit_cost_premium: 5500,
          total_cost_premium: 5500,
          notes: 'Includes all trim work and repairs'
        },
        {
          category: 'Insulation',
          item_name: 'Insulation Installation',
          description: 'Loft and wall insulation to improve energy efficiency',
          quantity: 1,
          unit: 'property',
          unit_cost_basic: 3000,
          total_cost_basic: 3000,
          unit_cost_standard: 4500,
          total_cost_standard: 4500,
          unit_cost_premium: 7000,
          total_cost_premium: 7000,
          notes: 'Energy efficiency improvements'
        }
      ],
      total_cost_basic: 60905,
      total_cost_standard: 91125,
      total_cost_premium: 139500,
      summary: 'Comprehensive refurbishment estimate covering all major renovation work including kitchen, bathrooms, flooring, electrical, plumbing, windows, doors, painting, carpentry, and insulation. This complete renovation will bring the property to modern standards with improved energy efficiency.',
      error: ''
    }
    setEstimationResult(fakeResult)
    setCurrentStep('results')
    setErrorMessage(null)
  }

  const handleApplyToCalculator = () => {
    // Show confirmation dialog
    setShowApplyConfirm(true)
  }

  const addIncludeItem = () => {
    if (newIncludeItem.trim()) {
      setItemsToInclude(prev => [...prev, newIncludeItem.trim()])
      setNewIncludeItem('')
    }
  }

  const removeIncludeItem = (index: number) => {
    setItemsToInclude(prev => prev.filter((_, i) => i !== index))
  }

  const addExcludeItem = () => {
    if (newExcludeItem.trim()) {
      setItemsToExclude(prev => [...prev, newExcludeItem.trim()])
      setNewExcludeItem('')
    }
  }

  const removeExcludeItem = (index: number) => {
    setItemsToExclude(prev => prev.filter((_, i) => i !== index))
  }

  const handleIncludeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIncludeItem()
    }
  }

  const handleExcludeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExcludeItem()
    }
  }

  const confirmApplyToCalculator = async () => {
    if (!estimationResult || !uprn) return

    // Load existing calculator data
    const existingData = await loadCalculatorData(uprn)
    
    // Convert estimation items to calculator refurb items (starting from ID 1)
    // Use selected level costs
    const newRefurbItems = estimationResult.items.map((item, index) => ({
      id: index + 1,
      description: `${item.item_name}: ${item.description}`,
      amount: selectedLevel === 'basic' ? item.total_cost_basic.toString() :
              selectedLevel === 'standard' ? item.total_cost_standard.toString() :
              item.total_cost_premium.toString()
    }))
    
    // Replace existing refurb items with new ones
    const updatedCalculatorData = {
      ...existingData,
      refurbItems: newRefurbItems
    }
    
    await saveCalculatorData(uprn, updatedCalculatorData as any)
    
    // Close dialog and trigger data update callback
    setShowApplyConfirm(false)
    if (onDataUpdate) {
      onDataUpdate()
    }
  }

  const handleConfirmDetails = () => {
    setCurrentStep('upload')
  }

  const canProceedToFineTune = uploadedImages.length >= 5
  const canStartAnalysis = canProceedToFineTune

  if (!dataReady) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
            <h3 className="text-lg font-bold text-white">
              {loading ? '' : 'Property not found. Please try again.'}
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Property Details Skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-700/30 rounded w-3/4 animate-pulse"></div>
            <div className="flex flex-wrap gap-3">
              <div className="h-10 bg-gray-700/30 rounded-lg w-64 animate-pulse"></div>
              <div className="h-8 bg-gray-700/30 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-700/30 rounded w-full animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-700/30 rounded animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-700/30 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Buttons - TEMPORARY */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-yellow-400 text-sm font-medium">DEBUG MODE</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={debugShowLoading}
            className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
          >
            Show Loading State
          </button>
          <button
            onClick={debugShowResults}
            className="px-3 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
          >
            Show Results (Fake Data)
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Reset to Step 1
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && currentStep !== 'analyzing' && currentStep !== 'results' && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 animate-enter-subtle">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-400">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Show step-based UI when not analyzing or showing results */}
      {currentStep !== 'analyzing' && currentStep !== 'results' && (
        <>
          {/* Step 1: Confirm Property Details */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl overflow-hidden shadow-lg">
            <div className={`px-5 py-3 flex items-center justify-between ${
              currentStep === 'details'
                ? 'bg-purple-500/20'
                : 'bg-black/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'details'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  1
                </div>
                <h3 className={`text-lg font-bold ${
                  currentStep === 'details' ? 'text-purple-100' : 'text-white'
                }`}>Confirm Property Details</h3>
              </div>
              <div className="flex items-center gap-2">
                {currentStep !== 'details' && (
                  <>
                    <button
                      onClick={() => setCurrentStep('details')}
                      className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </div>
            </div>
            
            {currentStep === 'details' && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-400 mb-4">
                  We will pass these details as additional context to the AI Agent
                </p>
                

                {/* Two column layout for remaining fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Number of beds */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Number of Bedrooms
                    </label>
                    <input
                      type="text"
                      value={numBeds}
                      onChange={(e) => setNumBeds(e.target.value)}
                      placeholder="e.g., 3"
                      className="w-full bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                  </div>

                  {/* Number of baths */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Number of Bathrooms
                    </label>
                    <input
                      type="text"
                      value={numBaths}
                      onChange={(e) => setNumBaths(e.target.value)}
                      placeholder="e.g., 2"
                      className="w-full bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                  </div>

                  {/* Square meters */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Square Meters (Internal Area)
                    </label>
                    <input
                      type="text"
                      value={squareMeters}
                      onChange={(e) => setSquareMeters(e.target.value)}
                      placeholder="e.g., 85"
                      className="w-full bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                  </div>

                  {/* Outdoor space area */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Outdoor Space Area (m²)
                    </label>
                    <input
                      type="text"
                      value={outdoorSpaceArea}
                      onChange={(e) => setOutdoorSpaceArea(e.target.value)}
                      placeholder="e.g., 50"
                      className="w-full bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Confirm button */}
                <div className="flex justify-start">
                  <button
                    onClick={handleConfirmDetails}
                    className="py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-colors flex items-center gap-2"
                  >
                    Confirm Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Upload Images */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg">
            <div className={`px-5 py-3 flex items-center justify-between ${
              currentStep === 'upload'
                ? 'bg-purple-500/20'
                : currentStep === 'details'
                ? 'bg-gray-500/20 opacity-60'
                : 'bg-black/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'upload'
                    ? 'bg-purple-100 text-purple-600'
                    : currentStep === 'details'
                    ? 'bg-gray-500 text-gray-300'
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  2
                </div>
                <h3 className={`text-lg font-bold ${
                  currentStep === 'details' ? 'text-gray-400' : currentStep === 'upload' ? 'text-purple-100' : 'text-white'
                }`}>Upload Images</h3>
              </div>
              <div className="flex items-center gap-2">
                {uploadedImages.length >= 5 && currentStep !== 'upload' && currentStep !== 'details' && (
                  <>
                    <button
                      onClick={() => setCurrentStep('upload')}
                      className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <svg className="w-6 h-6 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
                {currentStep === 'details' && (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            {currentStep === 'upload' && (
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-4">
                  Upload 5-15 images of the property ({uploadedImages.length}/15)
                </p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        uploadedImages.length < 5
                          ? 'bg-red-500'
                          : uploadedImages.length >= 5 && uploadedImages.length < 15
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(uploadedImages.length / 15) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-500/30 bg-black/20 hover:border-gray-500/50'
                  } ${uploadedImages.length >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInput}
                    disabled={uploadedImages.length >= 15}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="file-upload"
                  />
                  
                  <div className="text-center">
                    <svg
                      className="mx-auto h-10 w-10 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="mt-3">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                          Click to upload
                        </span>
                        <span className="text-gray-400 text-sm"> or drag and drop</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG, WEBP
                    </p>
                  </div>
                </div>

                {/* Image Grid */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group bg-black/20 rounded-lg overflow-hidden aspect-square"
                      >
                        <img
                          src={image.previewUrl}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                          <button
                            onClick={() => removeImage(image.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 bg-red-600 hover:bg-red-700 rounded-full"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <button
                    onClick={clearAllImages}
                    className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear all images
                  </button>
                )}

                {/* Proceed button */}
                {uploadedImages.length >= 5 && (
                  <div className="flex justify-start mt-4">
                    <button
                      onClick={() => setCurrentStep('finetune')}
                      className="py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-colors flex items-center gap-2"
                    >
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Fine-tune Your Estimate */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg">
            <div className={`px-5 py-3 flex items-center justify-between ${
              currentStep === 'finetune' 
                ? 'bg-purple-500/20' 
                : !canProceedToFineTune
                ? 'bg-gray-500/20 opacity-60'
                : 'bg-black/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 'finetune' 
                    ? 'bg-purple-100 text-purple-600' 
                    : !canProceedToFineTune
                    ? 'bg-gray-500 text-gray-300'
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  3
                </div>
                <h3 className={`text-lg font-bold ${
                  !canProceedToFineTune ? 'text-gray-400' : currentStep === 'finetune' ? 'text-purple-100' : 'text-white'
                }`}>Fine-tune estimate</h3>
              </div>
              <div className="flex items-center gap-2">
                {currentStep !== 'finetune' && !canProceedToFineTune && (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            {currentStep === 'finetune' && (
              <div className="p-6 space-y-4">
                {/* Items to Include */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">
                    1. Items to include
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Specify work not directly visible in pictures (e.g., rewiring, plumbing)
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newIncludeItem}
                      onChange={(e) => setNewIncludeItem(e.target.value)}
                      onKeyPress={handleIncludeKeyPress}
                      placeholder="Type item and press Enter or click Add"
                      className="flex-1 bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addIncludeItem}
                      disabled={!newIncludeItem.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  {itemsToInclude.length > 0 && (
                    <div className="space-y-2">
                      {itemsToInclude.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <span className="text-white text-sm">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeIncludeItem(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items to Exclude */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">
                    2. Items to exclude
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Specify work to exclude from estimate, even if visible in pictures
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newExcludeItem}
                      onChange={(e) => setNewExcludeItem(e.target.value)}
                      onKeyPress={handleExcludeKeyPress}
                      placeholder="Type item and press Enter or click Add"
                      className="flex-1 bg-black/20 border border-gray-500/30 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={addExcludeItem}
                      disabled={!newExcludeItem.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  {itemsToExclude.length > 0 && (
                    <div className="space-y-2">
                      {itemsToExclude.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <span className="text-white text-sm">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeExcludeItem(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Analysis Button */}
          <div className="flex justify-center">
            <button
              onClick={handleEstimate}
              disabled={currentStep !== 'finetune'}
              className={`py-3 px-8 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
                currentStep === 'finetune'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Analysis
            </button>
          </div>
        </>
      )}

      {/* Analyzing State */}
      {currentStep === 'analyzing' && (
        <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 text-center animate-enter-subtle shadow-lg">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-blue-500"></div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Our AI Agent is working</h3>
          <p className="text-gray-400 transition-all duration-500">{analyzingMessage}</p>
        </div>
      )}

      {/* Results View */}
      {currentStep === 'results' && estimationResult && (
        <div className="space-y-6 animate-enter-subtle">
          {/* Results Header */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">AI Refurbishment Quote</h3>
                </div>
                <p className="text-gray-300 mb-4">{estimationResult.summary}</p>
              </div>
              <div className="ml-6 text-right">
                {/* Level Selector */}
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Quality Level</label>
                  <div className="flex gap-2">
                    {(['basic', 'standard', 'premium'] as RefurbishmentLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedLevel === level
                            ? 'bg-purple-600 text-white'
                            : 'bg-black/20 text-gray-300 hover:bg-gray-500/20'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1 capitalize">{selectedLevel} Level</p>
                <p className="text-4xl font-bold text-green-400">
                  £{selectedLevel === 'basic' ? estimationResult.total_cost_basic.toLocaleString() :
                    selectedLevel === 'standard' ? estimationResult.total_cost_standard.toLocaleString() :
                    estimationResult.total_cost_premium.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-6 rounded-lg bg-black/20 hover:bg-gray-500/20 text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Do Another Estimate
            </button>
            <button
              onClick={handleApplyToCalculator}
              className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Apply to Calculator
            </button>
            <button
              onClick={exportToCSV}
              className="py-3 px-6 rounded-lg bg-black/20 hover:bg-gray-500/20 text-white font-medium transition-colors flex items-center justify-center gap-2 border border-gray-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Schedule of Work */}
          <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white">Schedule of Work</h4>
            </div>
            <div className="space-y-3">
              {estimationResult.items.map((item, index) => (
                <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-500/30 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full font-medium">
                          {item.category}
                        </span>
                        <h5 className="text-white font-semibold">{item.item_name}</h5>
                        <div className="flex gap-1 ml-auto">
                          {editingItem === index ? (
                            <>
                              <button
                                onClick={() => saveEditItem(index)}
                                className="p-1.5 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                                title="Save changes"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditItem}
                                className="p-1.5 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingItem(index)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                title="Edit amounts"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteItem(index)}
                                className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                title="Delete item"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                      {item.notes && (
                        <div className="bg-gray-800/30 rounded-lg p-2 border border-gray-600/30">
                          <p className="text-gray-300 text-xs">
                            <span className="text-gray-400 font-medium">Note:</span> {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      {editingItem === index ? (
                        <div className="space-y-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Basic</label>
                            <input
                              type="number"
                              value={editAmounts[index]?.basic || 0}
                              onChange={(e) => updateEditAmount(index, 'basic', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-black/20 border border-gray-500/30 rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Standard</label>
                            <input
                              type="number"
                              value={editAmounts[index]?.standard || 0}
                              onChange={(e) => updateEditAmount(index, 'standard', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-black/20 border border-gray-500/30 rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Premium</label>
                            <input
                              type="number"
                              value={editAmounts[index]?.premium || 0}
                              onChange={(e) => updateEditAmount(index, 'premium', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-black/20 border border-gray-500/30 rounded px-2 py-1 text-white text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm mb-1">
                            {item.quantity} {item.unit} × £{selectedLevel === 'basic' ? item.unit_cost_basic.toLocaleString() :
                              selectedLevel === 'standard' ? item.unit_cost_standard.toLocaleString() :
                              item.unit_cost_premium.toLocaleString()}
                          </p>
                          <p className="text-xl font-bold text-purple-400">
                            £{selectedLevel === 'basic' ? item.total_cost_basic.toLocaleString() :
                              selectedLevel === 'standard' ? item.total_cost_standard.toLocaleString() :
                              item.total_cost_premium.toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showApplyConfirm && (
        <ConfirmDialog
          title="Replace Refurbishment Estimate?"
          message="This will replace all existing refurbishment items in the calculator with the new estimate. This action cannot be undone. Are you sure you want to continue?"
          confirmLabel="Yes, Replace"
          cancelLabel="No, Cancel"
          confirmVariant="primary"
          onConfirm={confirmApplyToCalculator}
          onCancel={() => setShowApplyConfirm(false)}
        />
      )}
    </div>
  )
}
