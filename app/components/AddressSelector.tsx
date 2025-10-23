'use client'

import { useState } from 'react'

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

interface AddressSelectorProps {
  postcode: string
  addresses: Address[]
  onAddressSelect: (address: string, postcode: string) => void
  onBack: () => void
  loading?: boolean
}

export default function AddressSelector({ 
  postcode, 
  addresses, 
  onAddressSelect, 
  onBack, 
  loading = false 
}: AddressSelectorProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAddressId) {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
      if (selectedAddress) {
        onAddressSelect(selectedAddress.address, selectedAddress.postcode)
      }
    }
  }

  const handleAddressClick = (addressId: string) => {
    setSelectedAddressId(addressId)
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-fg-muted hover:text-fg-primary transition-colors duration-200"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          Back to postcode
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-fg-primary mb-2">
          Select Address
        </h3>
        <p className="text-fg-muted mb-4">
          Found {addresses.length} address{addresses.length !== 1 ? 'es' : ''} for postcode <span className="font-medium">{postcode}</span>
        </p>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏠</div>
          <p className="text-fg-muted">No addresses found for this postcode</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedAddressId === address.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50 hover:bg-bg-subtle'
              }`}
              onClick={() => handleAddressClick(address.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                  selectedAddressId === address.id
                    ? 'border-accent bg-accent'
                    : 'border-border'
                }`}>
                  {selectedAddressId === address.id && (
                    <div className="w-full h-full rounded-full bg-accent-fg scale-50"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-fg-primary">
                    {address.address}
                  </div>
                  <div className="text-sm text-fg-muted mt-1">
                    {address.post_town}
                    {address.county && `, ${address.county}`}
                  </div>
                  <div className="text-xs text-fg-muted mt-1">
                    {address.postcode}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !selectedAddressId}
        className="w-full bg-accent text-accent-fg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-opacity duration-200 focus:outline-none focus:shadow-focus"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-fg"></div>
            Analyzing Property...
          </div>
        ) : (
          'Analyze Property'
        )}
      </button>
    </div>
  )
}
