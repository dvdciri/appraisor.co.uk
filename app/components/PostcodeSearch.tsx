'use client'

import { useState } from 'react'

interface PostcodeSearchProps {
  onPostcodeSubmit: (postcode: string) => void
  loading?: boolean
  error?: string | null
}

export default function PostcodeSearch({ onPostcodeSubmit, loading = false, error }: PostcodeSearchProps) {
  const [postcode, setPostcode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (postcode.trim()) {
      onPostcodeSubmit(postcode.trim())
    }
  }

  const formatPostcode = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Basic UK postcode formatting (not perfect but good enough for display)
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3)
    } else {
      return cleaned.slice(0, -3) + ' ' + cleaned.slice(-3)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostcode(e.target.value)
    setPostcode(formatted)
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="postcode" className="block text-sm font-medium text-fg-primary mb-2">
          UK Postcode
        </label>
        <input
          type="text"
          id="postcode"
          value={postcode}
          onChange={handleInputChange}
          placeholder="e.g., SW1A 1AA"
          className="w-full px-4 py-3 bg-bg-subtle border border-border rounded-lg text-fg-primary placeholder-fg-muted focus:outline-none focus:shadow-focus"
          disabled={loading}
          maxLength={8}
        />
        <p className="mt-1 text-xs text-fg-muted">
          Enter a UK postcode to find available addresses
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={loading || !postcode.trim()}
        className="w-full bg-accent text-accent-fg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-opacity duration-200 focus:outline-none focus:shadow-focus"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-fg"></div>
            Finding Addresses...
          </div>
        ) : (
          'Find Addresses'
        )}
      </button>
    </div>
  )
}
