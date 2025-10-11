'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  showBackButton?: boolean
  onBackClick?: () => void
  backButtonText?: string
  showHomeButton?: boolean
  onHomeClick?: () => void
}

export default function Header({ 
  showBackButton = false, 
  onBackClick, 
  backButtonText = "Back",
  showHomeButton = false,
  onHomeClick
}: HeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-20 animate-enter-subtle">
      <div className="h-20 px-4 flex items-center justify-between">
        {/* Left side - Back button or empty space */}
        <div className="flex items-center min-w-0 flex-1">
          {showBackButton && onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 border border-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M20 12a1 1 0 01-1 1H8.414l3.293 3.293a1 1 0 11-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 11H19a1 1 0 011 1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{backButtonText}</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
        </div>

        {/* Center - Logo and Slogan */}
        <div className="flex flex-col items-center text-center flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white">Estimo</h1>
          <p className="text-xs text-gray-400 mt-1 hidden sm:block">Analyse UK Property Investments</p>
          <p className="text-xs text-gray-400 mt-1 sm:hidden">Property Investment Analysis</p>
        </div>

        {/* Right side - Home button or empty space */}
        <div className="flex items-center justify-end min-w-0 flex-1">
          {showHomeButton && onHomeClick && (
            <button
              type="button"
              onClick={onHomeClick}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 border border-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="border-t border-gray-800 px-4">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive('/') && !pathname.startsWith('/lists') && !pathname.startsWith('/tasks')
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Search
          </Link>
          <Link
            href="/lists"
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive('/lists')
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manage Lists
          </Link>
          <Link
            href="/tasks"
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive('/tasks')
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tasks
          </Link>
        </div>
      </nav>
    </div>
  )
}
