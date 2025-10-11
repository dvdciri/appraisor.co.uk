'use client'

import { ReactNode } from 'react'

export interface DialogProps {
  title: string
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Dialog({
  title,
  children,
  isOpen,
  onClose,
  maxWidth = 'md'
}: DialogProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
      <div className={`bg-gray-800 rounded-lg ${maxWidthClasses[maxWidth]} w-full border border-gray-600 shadow-2xl`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

