'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '../../../components/Header'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { getFullAnalysisData, loadCalculatorData, saveCalculatorData } from '../../../../lib/persistence'

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

export default function RefurbishmentEstimatorPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [propertyAddress, setPropertyAddress] = useState<string>('')
  const [propertyPostcode, setPropertyPostcode] = useState<string>('')
  
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
  
  // Confirmation dialog state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false)

  // Load property data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (params.id) {
          const fullData = await getFullAnalysisData(params.id as string)
          if (fullData) {
            const address = fullData.propertyData.data.attributes.address.street_group_format.address_lines
            const postcode = fullData.propertyData.data.attributes.address.street_group_format.postcode
            setPropertyAddress(address)
            setPropertyPostcode(postcode)
            
            // Load property details
            const attrs = fullData.propertyData.data.attributes
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
        } else {
          console.error('No property data found')
        }
      }
      } catch (e) {
        console.error('Failed to load property data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl))
    }
  }, [uploadedImages])

  const handleBackClick = () => {
    router.back()
  }

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
    link.setAttribute('download', `refurbishment_estimate_${propertyAddress.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
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
    if (!estimationResult || !params.id) return

    // Load existing calculator data
    const existingData = await loadCalculatorData(params.id as string)
    
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
    
    saveCalculatorData(params.id as string, updatedCalculatorData as any)
    
    // Close dialog and navigate back to calculator
    setShowApplyConfirm(false)
    router.push(`/analyse/${params.id}`)
  }



  const getLevelIcon = (level: RefurbishmentLevel): string => {
    switch (level) {
      case 'basic':
        return '🔧'
      case 'standard':
        return '🏡'
      case 'premium':
        return '✨'
    }
  }

  const handleConfirmDetails = () => {
    setCurrentStep('upload')
  }

  const canProceedToFineTune = uploadedImages.length >= 5
  const canStartAnalysis = canProceedToFineTune

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={handleBackClick}
          backButtonText="Back to Calculator"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-gray-400 animate-enter-subtle">
              Loading...
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!propertyAddress) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={handleBackClick}
          backButtonText="Back to Calculator"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-gray-400 animate-enter-subtle">
              Property not found. Please go back and try again.
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
        backButtonText="Back to Calculator"
        showHomeButton={true}
        onHomeClick={() => router.push('/')}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Title and Property Info */}
          <div className="text-center animate-enter-subtle">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Refurbishment Estimator
            </h1>
            <p className="text-gray-400">
              {propertyAddress}, {propertyPostcode}
            </p>
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
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className={`px-5 py-3 flex items-center justify-between ${
                  currentStep === 'details'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gray-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep === 'details'
                        ? 'bg-white text-blue-600'
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      1
                    </div>
                    <h2 className="text-lg font-bold text-white">Confirm Property Details</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep !== 'details' && (
                      <>
                        <button
                          onClick={() => setCurrentStep('details')}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
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
                  <div className="p-5 space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Review and confirm the property details below (optional fields can be left empty)
                  </p>
                  
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    />
                  </div>

                  {/* Property type */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      Type of Property
                    </label>
                    <input
                      type="text"
                      value={propertyType}
                      disabled={true}
                      placeholder="Not available"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 cursor-not-allowed opacity-75"
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    />
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirmDetails}
                    className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Confirm Details
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                )}
              </div>

              {/* Step 2: Upload Images */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300">
                <div className={`px-5 py-3 flex items-center justify-between ${
                  currentStep === 'upload'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gray-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep === 'upload'
                        ? 'bg-white text-blue-600'
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      2
                    </div>
                    <h2 className="text-lg font-bold text-white">Upload Images</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedImages.length >= 5 && currentStep !== 'details' && currentStep !== 'upload' && (
                      <>
                        <button
                          onClick={() => setCurrentStep('upload')}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
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
                
                {(currentStep === 'upload' || currentStep === 'details') && (
                  <div className="p-5">
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
                        : 'border-gray-600 bg-gray-700/20 hover:border-gray-500'
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
                          className="relative group bg-gray-700 rounded-lg overflow-hidden aspect-square"
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
                    <button
                      onClick={() => setCurrentStep('finetune')}
                      className="w-full mt-4 py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Continue
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* Step 3: Fine-tune Your Estimate */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300">
                <div className={`px-5 py-3 flex items-center justify-between ${
                  currentStep === 'finetune' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                    : 'bg-gray-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep === 'finetune' 
                        ? 'bg-white text-blue-600' 
                        : 'bg-gray-600 text-gray-400'
                    }`}>
                      3
                    </div>
                    <h2 className="text-lg font-bold text-white">Fine-tune estimate</h2>
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
                  <div className="p-5 space-y-4">

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
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addIncludeItem}
                        disabled={!newIncludeItem.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1"
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
                          <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
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
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={addExcludeItem}
                        disabled={!newExcludeItem.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-1"
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
                          <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2">
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
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
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
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center animate-enter-subtle">
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-blue-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI Agent Analyzing</h3>
              <p className="text-gray-400">This may take a few moments...</p>
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      {currentStep === 'results' && estimationResult && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6 animate-enter-subtle">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-700/50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Refurbishment Estimate</h3>
                  <p className="text-gray-300 mb-3">{estimationResult.summary}</p>
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
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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

            {/* Items List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Itemized Breakdown</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {estimationResult.items.map((item, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full">
                            {item.category}
                          </span>
                          <h5 className="text-white font-semibold">{item.item_name}</h5>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                        {item.notes && (
                          <p className="text-gray-500 text-xs italic">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-gray-400 text-sm">
                          {item.quantity} {item.unit} × £{selectedLevel === 'basic' ? item.unit_cost_basic.toLocaleString() :
                            selectedLevel === 'standard' ? item.unit_cost_standard.toLocaleString() :
                            item.unit_cost_premium.toLocaleString()}
                        </p>
                        <p className="text-xl font-bold text-white">
                          £{selectedLevel === 'basic' ? item.total_cost_basic.toLocaleString() :
                            selectedLevel === 'standard' ? item.total_cost_standard.toLocaleString() :
                            item.total_cost_premium.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
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
                className="py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
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
    </main>
  )
}

