'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RecentSearch {
  uprn: string
  address: string
  searched_at: string
}

interface RecentSearchesProps {
  onShowAll?: () => void
}

export default function RecentSearches({ onShowAll }: RecentSearchesProps) {
  const [searches, setSearches] = useState<RecentSearch[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const response = await fetch('/api/user/search-history')
        if (response.ok) {
          const data = await response.json()
          setSearches(data)
        }
      } catch (error) {
        console.error('Error fetching recent searches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSearches()
  }, [])

  const handleSearchClick = (uprn: string) => {
    router.push(`/dashboard/${uprn}`)
  }

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 shadow-2xl animate-enter-subtle-delayed flex flex-col overflow-hidden">
        <div className="flex flex-col h-full">
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

  if (searches.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 shadow-2xl animate-enter-subtle-delayed flex flex-col overflow-hidden">
        <div className="flex flex-col h-full">
          <h3 className="text-white font-medium mb-2">Recently Viewed</h3>
          <p className="text-gray-400 text-sm">No recent searches yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-8 shadow-2xl animate-enter-subtle-delayed flex flex-col overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Recently Viewed</h3>
          {searches.length > 3 && onShowAll && (
            <button
              onClick={onShowAll}
              className="text-purple-500 hover:text-purple-400 text-sm font-medium transition-colors"
            >
              See All ({searches.length})
            </button>
          )}
        </div>
        <div className="space-y-2">
          {searches.slice(0, 3).map((search) => (
            <div
              key={search.uprn}
              onClick={() => handleSearchClick(search.uprn)}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-purple-500/10 hover:border hover:border-purple-400/30 cursor-pointer transition-colors"
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
          ))}
        </div>
      </div>
    </div>
  )
}
