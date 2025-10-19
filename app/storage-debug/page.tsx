'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { migrateToDatabase } from '../../lib/persistence'

interface StorageItem {
  key: string
  value: any
  size: string
  type: string
}

export default function StorageDebugPage() {
  const router = useRouter()
  const [storageItems, setStorageItems] = useState<StorageItem[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null)
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [deleteKeyConfirm, setDeleteKeyConfirm] = useState<string | null>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{success: boolean, migrated: number, errors: string[]} | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<{success: boolean, message: string} | null>(null)

  useEffect(() => {
    loadStorageData()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const loadStorageData = () => {
    if (typeof window === 'undefined') return

    const items: StorageItem[] = []
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      const value = localStorage.getItem(key)
      if (!value) continue

      const size = new Blob([value]).size
      total += size

      let parsedValue
      let type = 'string'
      try {
        parsedValue = JSON.parse(value)
        type = Array.isArray(parsedValue) ? 'array' : typeof parsedValue
      } catch {
        parsedValue = value
        type = 'string'
      }

      items.push({
        key,
        value: parsedValue,
        size: formatBytes(size),
        type
      })
    }

    // Sort by size (largest first)
    items.sort((a, b) => {
      const sizeA = parseInt(a.size.replace(/[^0-9]/g, ''))
      const sizeB = parseInt(b.size.replace(/[^0-9]/g, ''))
      return sizeB - sizeA
    })

    setStorageItems(items)
    setTotalSize(total)
  }

  const clearStorage = () => {
    setClearAllConfirm(true)
  }

  const confirmClearAll = () => {
    localStorage.clear()
    loadStorageData()
    setClearAllConfirm(false)
    setToastMessage({
      type: 'success',
      text: 'Storage cleared successfully'
    })
  }

  const deleteKey = (key: string) => {
    setDeleteKeyConfirm(key)
  }

  const confirmDeleteKey = () => {
    if (!deleteKeyConfirm) return
    
    localStorage.removeItem(deleteKeyConfirm)
    loadStorageData()
    setSelectedKey(null)
    setToastMessage({
      type: 'success',
      text: `Deleted "${deleteKeyConfirm}"`
    })
    setDeleteKeyConfirm(null)
  }

  const exportStorage = () => {
    const data: Record<string, any> = {}
    storageItems.forEach(item => {
      data[item.key] = item.value
    })
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estimo-storage-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleMigrateToDatabase = async () => {
    setIsMigrating(true)
    setMigrationResult(null)
    
    try {
      const result = await migrateToDatabase()
      setMigrationResult(result)
      
      if (result.success) {
        setToastMessage({
          type: 'success',
          text: `Migration completed successfully! ${result.migrated} items migrated.`
        })
      } else {
        setToastMessage({
          type: 'error',
          text: `Migration failed: ${result.errors.join(', ')}`
        })
      }
    } catch (error) {
      const errorResult = {
        success: false,
        migrated: 0,
        errors: [`Migration failed: ${error}`]
      }
      setMigrationResult(errorResult)
      setToastMessage({
        type: 'error',
        text: `Migration failed: ${error}`
      })
    } finally {
      setIsMigrating(false)
    }
  }

  const handleInitializeDatabase = async () => {
    setIsInitializing(true)
    setInitResult(null)
    
    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      setInitResult(result)
      
      if (result.success) {
        setToastMessage({
          type: 'success',
          text: 'Database initialized successfully'
        })
      } else {
        setToastMessage({
          type: 'error',
          text: 'Database initialization failed: ' + result.error
        })
      }
    } catch (error) {
      console.error('Database initialization error:', error)
      setToastMessage({
        type: 'error',
        text: 'Database initialization failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const getItemCount = (item: StorageItem) => {
    if (item.type === 'array') {
      return `${item.value.length} items`
    } else if (item.type === 'object' && item.value !== null) {
      return `${Object.keys(item.value).length} keys`
    }
    return ''
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Clear All Confirmation Dialog */}
      {clearAllConfirm && (
        <ConfirmDialog
          title="Clear All Storage"
          message="Are you sure you want to clear ALL localStorage data?\n\nThis will delete all property data, lists, and settings. This cannot be undone!"
          confirmLabel="Clear All"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={confirmClearAll}
          onCancel={() => setClearAllConfirm(false)}
        />
      )}

      {/* Delete Key Confirmation Dialog */}
      {deleteKeyConfirm && (
        <ConfirmDialog
          title="Delete Key"
          message={`Are you sure you want to delete the key "${deleteKeyConfirm}"?\n\nThis cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDeleteKey}
          onCancel={() => setDeleteKeyConfirm(null)}
        />
      )}

      <div className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={() => router.push('/')}
          backButtonText="Back"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">LocalStorage Debug</h1>
                <p className="text-gray-400">
                  Total: {storageItems.length} keys • {formatBytes(totalSize)} used
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportStorage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={handleInitializeDatabase}
                  disabled={isInitializing}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isInitializing 
                      ? 'bg-gray-500 cursor-not-allowed text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isInitializing ? 'Initializing...' : 'Initialize Database'}
                </button>
                <button
                  onClick={handleMigrateToDatabase}
                  disabled={isMigrating}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isMigrating 
                      ? 'bg-gray-500 cursor-not-allowed text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isMigrating ? 'Migrating...' : 'Migrate to Database'}
                </button>
                <button
                  onClick={clearStorage}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={loadStorageData}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Storage quota info */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Storage Used</span>
                <span className="text-sm text-gray-300">
                  {formatBytes(totalSize)} / ~5-10 MB (browser limit)
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    totalSize > 5000000 ? 'bg-red-500' : totalSize > 2500000 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((totalSize / 5000000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Storage Items Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keys List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Storage Keys</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {storageItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setSelectedKey(item.key)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedKey === item.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate flex-1">{item.key}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteKey(item.key)
                        }}
                        className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs opacity-75">
                      <span className="bg-gray-900 px-2 py-0.5 rounded">{item.type}</span>
                      <span>{item.size}</span>
                      {getItemCount(item) && <span>{getItemCount(item)}</span>}
                    </div>
                  </div>
                ))}

                {storageItems.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No data in localStorage
                  </div>
                )}
              </div>

              {/* Database Initialization Results */}
              {initResult && (
                <div className="mt-6 bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Database Initialization Results</h3>
                  <div className={`p-4 rounded-lg ${
                    initResult.success 
                      ? 'bg-green-900 border border-green-600' 
                      : 'bg-red-900 border border-red-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {initResult.success ? (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`font-medium ${
                        initResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {initResult.success ? 'Database Initialized' : 'Initialization Failed'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      initResult.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {initResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Migration Results */}
              {migrationResult && (
                <div className="mt-6 bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Migration Results</h3>
                  <div className={`p-4 rounded-lg ${
                    migrationResult.success 
                      ? 'bg-green-900 border border-green-600' 
                      : 'bg-red-900 border border-red-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {migrationResult.success ? (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`font-medium ${
                        migrationResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {migrationResult.success ? 'Migration Successful' : 'Migration Failed'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      migrationResult.success ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {migrationResult.success 
                        ? `${migrationResult.migrated} items migrated successfully`
                        : `Migration failed with ${migrationResult.errors.length} error(s)`
                      }
                    </p>
                    {migrationResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-red-300 font-medium mb-2">Errors:</p>
                        <ul className="text-xs text-red-300 space-y-1 max-h-32 overflow-y-auto">
                          {migrationResult.errors.map((error, index) => (
                            <li key={index} className="bg-red-800 px-2 py-1 rounded">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Value Display */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Value Preview</h2>
              {selectedKey ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Key</h3>
                    <code className="block bg-gray-900 text-blue-300 p-3 rounded text-sm break-all">
                      {selectedKey}
                    </code>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Value</h3>
                    <pre className="bg-gray-900 text-green-300 p-4 rounded text-xs overflow-auto max-h-[500px] whitespace-pre-wrap break-words">
                      {JSON.stringify(
                        storageItems.find((item) => item.key === selectedKey)?.value,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  Select a key to view its value
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

