'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RecentSearch {
  uprn: string
  address: string
  searched_at: string
}

interface AllSearchesProps {
  onBack: () => void
}

export default function AllSearches({ onBack }: AllSearchesProps) {
  const [searches, setSearches] = useState<RecentSearch[]>([])
  const [filteredSearches, setFilteredSearches] = useState<RecentSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const response = await fetch('/api/user/search-history')
        if (response.ok) {
          const data = await response.json()
          setSearches(data)
          setFilteredSearches(data)
        }
      } catch (error) {
        console.error('Error fetching recent searches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSearches()
  }, [])

  // Filter searches based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSearches(searches)
    } else {
      const filtered = searches.filter(search => 
        search.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSearches(filtered)
    }
  }, [searchTerm, searches])

  const handleSearchClick = (uprn: string) => {
    router.push(`/dashboard/${uprn}`)
  }

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-800/30 hover:bg-purple-500/10 hover:border hover:border-purple-400/30 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-white font-medium">Previous Searches ({searches.length})</h3>
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter by address or postcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchTerm && (
          <p className="text-gray-400 text-sm mt-2">
            Showing {filteredSearches.length} of {searches.length} searches
          </p>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSearches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              {searchTerm ? 'No searches match your filter' : 'No searches found'}
            </p>
          </div>
        ) : (
          filteredSearches.map((search) => (
            <div
              key={search.uprn}
              onClick={() => handleSearchClick(search.uprn)}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-purple-500/10 hover:border hover:border-purple-400/30 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {search.address}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(search.searched_at).toLocaleDateString()}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
