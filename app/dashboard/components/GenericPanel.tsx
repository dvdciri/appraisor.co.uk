'use client'

import { ReactNode } from 'react'

interface GenericPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  isLargeScreen: boolean
  className?: string
}

export default function GenericPanel({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  isLargeScreen,
  className = ""
}: GenericPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end items-start animate-[fadeIn_0.15s_ease-out]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      
      {/* Right Panel (Dark Glass) */}
      <div className={`relative w-[720px] bg-black/25 backdrop-blur-2xl border border-gray-500/30 flex flex-col shadow-2xl rounded-2xl mr-6 mt-6 mb-6 animate-[slideInRight_0.3s_cubic-bezier(0.4,0,0.2,1)] h-[calc(100vh-3rem)] ${className}`}>
        <div className="p-6 border-b border-gray-500/30 flex items-center justify-between flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20">
            <span className="text-gray-400 hover:text-gray-100 text-xl">✕</span>
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
