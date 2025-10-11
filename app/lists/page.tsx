'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import StreetViewImage from '../components/StreetViewImage'
import {
  getAllPropertyLists,
  createPropertyList,
  deletePropertyList,
  addPropertyToList,
  removePropertyFromList,
  PropertyList
} from '../../lib/persistence'

interface PropertyData {
  data: {
    attributes: {
      address: {
        street_group_format: {
          address_lines: string
          postcode: string
        }
      }
      location?: {
        coordinates?: {
          latitude: number
          longitude: number
        }
      }
      property_type?: {
        value: string
      }
      number_of_bedrooms?: {
        value: number
      }
      number_of_bathrooms?: {
        value: number
      }
      [key: string]: any
    }
  }
}

interface RecentAnalysis {
  id: string
  searchDate: string
  comparables: string[]
  filters: any
}

export default function ListsPage() {
  const router = useRouter()
  const [allLists, setAllLists] = useState<PropertyList[]>([])
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListName, setEditingListName] = useState('')
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{list: PropertyList} | null>(null)
  const [selectedList, setSelectedList] = useState<PropertyList | null>(null)
  const [isAddPropertiesOpen, setIsAddPropertiesOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentAnalysis[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set())
  const [draggedListId, setDraggedListId] = useState<string | null>(null)
  const [movePropertyModal, setMovePropertyModal] = useState<{propertyId: string, fromListId: string} | null>(null)

  // Load lists on mount
  useEffect(() => {
    loadLists()
    loadRecentSearches()
  }, [])

  // Update selected list when lists change
  useEffect(() => {
    if (selectedList) {
      const updated = allLists.find(l => l.id === selectedList.id)
      if (updated) {
        setSelectedList(updated)
      }
    }
  }, [allLists])

  const loadLists = () => {
    const lists = getAllPropertyLists()
    // Sort by a custom order if it exists, otherwise by updatedAt
    const listsWithOrder = lists.map((list, index) => ({
      ...list,
      order: list.order !== undefined ? list.order : index
    }))
    listsWithOrder.sort((a, b) => a.order - b.order)
    setAllLists(listsWithOrder)
    
    // Auto-select the first list if no list is currently selected and lists exist
    if (!selectedList && listsWithOrder.length > 0) {
      setSelectedList(listsWithOrder[0])
    }
  }

  const saveListsOrder = (lists: PropertyList[]) => {
    try {
      const listsObj = lists.reduce((acc, list, index) => {
        acc[list.id] = { ...list, order: index }
        return acc
      }, {} as { [key: string]: PropertyList & { order: number } })
      
      localStorage.setItem('estimo_property_lists', JSON.stringify(listsObj))
    } catch (error) {
      console.error('Failed to save lists order:', error)
    }
  }

  const loadRecentSearches = () => {
    try {
      const savedAnalyses = localStorage.getItem('recentAnalyses')
      if (savedAnalyses) {
        setRecentSearches(JSON.parse(savedAnalyses))
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e)
    }
  }

  const getPropertyData = (propertyId: string): PropertyData | null => {
    try {
      const propertyDataStore = JSON.parse(localStorage.getItem('propertyDataStore') || '{}')
      return propertyDataStore[propertyId] || null
    } catch (e) {
      console.error('Failed to load property data:', e)
      return null
    }
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    
    try {
      createPropertyList(newListName.trim())
      loadLists()
      setNewListName('')
      setIsCreatingList(false)
      setToastMessage({
        type: 'success',
        text: `List "${newListName.trim()}" created successfully`
      })
    } catch (error) {
      console.error('Failed to create list:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to create list'
      })
    }
  }

  const handleDeleteList = (list: PropertyList) => {
    setDeleteConfirm({ list })
  }

  const confirmDeleteList = () => {
    if (!deleteConfirm) return
    
    try {
      const deletedListId = deleteConfirm.list.id
      deletePropertyList(deletedListId)
      
      // If the deleted list was currently selected, clear the selection
      if (selectedList && selectedList.id === deletedListId) {
        setSelectedList(null)
      }
      
      loadLists()
      setToastMessage({
        type: 'success',
        text: `List "${deleteConfirm.list.name}" deleted successfully`
      })
    } catch (error) {
      console.error('Failed to delete list:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to delete list'
      })
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleStartEdit = (list: PropertyList) => {
    setEditingListId(list.id)
    setEditingListName(list.name)
  }

  const handleCancelEdit = () => {
    setEditingListId(null)
    setEditingListName('')
  }

  const handleSaveEdit = (list: PropertyList) => {
    if (!editingListName.trim()) {
      setToastMessage({
        type: 'error',
        text: 'List name cannot be empty'
      })
      return
    }

    try {
      // Update the list name
      const lists = getAllPropertyLists()
      const listIndex = lists.findIndex(l => l.id === list.id)
      if (listIndex !== -1) {
        lists[listIndex].name = editingListName.trim()
        lists[listIndex].updatedAt = Date.now()
        
        // Save back to localStorage
        const listsObj = lists.reduce((acc, l) => {
          acc[l.id] = l
          return acc
        }, {} as { [key: string]: PropertyList })
        
        localStorage.setItem('estimo_property_lists', JSON.stringify(listsObj))
        
        loadLists()
        setEditingListId(null)
        setEditingListName('')
        setToastMessage({
          type: 'success',
          text: `List renamed to "${editingListName.trim()}"`
        })
      }
    } catch (error) {
      console.error('Failed to rename list:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to rename list'
      })
    }
  }

  const handleViewList = (list: PropertyList) => {
    setSelectedList(list)
  }

  const handleOpenAddProperties = () => {
    setSelectedPropertyIds(new Set())
    setIsAddPropertiesOpen(true)
  }

  const handleToggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedPropertyIds)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedPropertyIds(newSelected)
  }

  const handleAddProperties = () => {
    if (!selectedList || selectedPropertyIds.size === 0) return

    try {
      let added = 0
      selectedPropertyIds.forEach(propertyId => {
        const success = addPropertyToList(selectedList.id, propertyId)
        if (success) added++
      })

      loadLists()
      setIsAddPropertiesOpen(false)
      setSelectedPropertyIds(new Set())
      
      setToastMessage({
        type: 'success',
        text: `Added ${added} ${added === 1 ? 'property' : 'properties'} to "${selectedList.name}"`
      })
    } catch (error) {
      console.error('Failed to add properties:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to add properties'
      })
    }
  }

  const handleRemoveProperty = (propertyId: string) => {
    if (!selectedList) return

    try {
      removePropertyFromList(selectedList.id, propertyId)
      loadLists()
      setToastMessage({
        type: 'success',
        text: 'Property removed from list'
      })
    } catch (error) {
      console.error('Failed to remove property:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to remove property'
      })
    }
  }

  const handleDragStart = (listId: string) => {
    setDraggedListId(listId)
  }

  const handleDragOver = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault()
    
    if (!draggedListId || draggedListId === targetListId) return

    const draggedIndex = allLists.findIndex(l => l.id === draggedListId)
    const targetIndex = allLists.findIndex(l => l.id === targetListId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newLists = [...allLists]
    const [draggedItem] = newLists.splice(draggedIndex, 1)
    newLists.splice(targetIndex, 0, draggedItem)

    setAllLists(newLists)
  }

  const handleDragEnd = () => {
    if (draggedListId) {
      saveListsOrder(allLists)
      setToastMessage({
        type: 'success',
        text: 'List order saved'
      })
    }
    setDraggedListId(null)
  }

  const handleOpenMoveProperty = (propertyId: string) => {
    if (!selectedList) return
    // Reload lists to ensure we have the latest data
    loadLists()
    setMovePropertyModal({ propertyId, fromListId: selectedList.id })
  }

  const handleMovePropertyToList = (toListId: string) => {
    if (!movePropertyModal) return

    const fromList = allLists.find(l => l.id === movePropertyModal.fromListId)
    const toList = allLists.find(l => l.id === toListId)

    if (!fromList || !toList) return

    try {
      // Remove from current list
      removePropertyFromList(movePropertyModal.fromListId, movePropertyModal.propertyId)
      // Add to new list
      addPropertyToList(toListId, movePropertyModal.propertyId)
      
      loadLists()
      setMovePropertyModal(null)
      
      setToastMessage({
        type: 'success',
        text: `Property moved from "${fromList.name}" to "${toList.name}"`
      })
    } catch (error) {
      console.error('Failed to move property:', error)
      setToastMessage({
        type: 'error',
        text: 'Failed to move property'
      })
    }
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete List"
          message={`Are you sure you want to delete "${deleteConfirm.list.name}"?\n\nThis will remove ${deleteConfirm.list.propertyIds.length} ${deleteConfirm.list.propertyIds.length === 1 ? 'property' : 'properties'} from the list.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDeleteList}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <main className="min-h-screen bg-gray-900">
        <Header 
          showBackButton={true}
          onBackClick={() => router.push('/')}
          backButtonText="Back"
          showHomeButton={true}
          onHomeClick={() => router.push('/')}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6 animate-enter-subtle">
              <h1 className="text-3xl font-bold text-white mb-2">Manage Lists</h1>
              <p className="text-gray-400">Organize your properties into lists or create a pipeline with custom stages to move properties through your workflow</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN - Lists */}
              <div className="lg:col-span-1 space-y-4">
              {/* Create New List Section */}
              <div className="bg-gray-800 rounded-lg p-4 animate-enter-subtle-delayed">
                {!isCreatingList ? (
                  <button
                    onClick={() => setIsCreatingList(true)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New List
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">New List</h3>
                      <button
                        onClick={() => {
                          setIsCreatingList(false)
                          setNewListName('')
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateList()
                        }
                      }}
                      placeholder="Enter list name..."
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateList}
                        disabled={!newListName.trim()}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingList(false)
                          setNewListName('')
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lists */}
              {allLists.length > 0 ? (
                <div className="space-y-2 animate-enter-subtle-delayed-2">
                  <h3 className="text-sm font-medium text-gray-400 uppercase">Your Lists ({allLists.length})</h3>
                  
                  <div className="space-y-2">
                    {allLists.map((list) => (
                      <div
                        key={list.id}
                        draggable={editingListId !== list.id}
                        onDragStart={() => handleDragStart(list.id)}
                        onDragOver={(e) => handleDragOver(e, list.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-gray-800 rounded-lg p-3 border-2 transition-colors cursor-move ${
                          draggedListId === list.id
                            ? 'opacity-50'
                            : selectedList?.id === list.id 
                            ? 'border-blue-600 bg-blue-900/30' 
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {editingListId === list.id ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingListName}
                              onChange={(e) => setEditingListName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(list)
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(list)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div className="flex items-center gap-2">
                            {/* Drag Handle */}
                            <div className="flex-shrink-0 text-gray-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>

                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => handleViewList(list)}
                            >
                              <h3 className="text-white font-semibold text-base">{list.name}</h3>
                              <p className="text-gray-400 text-xs mt-0.5">
                                {list.propertyIds.length} {list.propertyIds.length === 1 ? 'property' : 'properties'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Edit Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(list)
                                }}
                                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                                title="Rename list"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteList(list)
                                }}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                                title="Delete list"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center animate-enter-subtle-delayed-2">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">No Lists Yet</h3>
                      <p className="text-gray-400 text-sm">Create your first list to organize your properties</p>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* RIGHT COLUMN - Selected List Properties */}
              <div className="lg:col-span-2">
                {selectedList ? (
                  <div className="bg-gray-800 rounded-lg p-6 animate-enter-subtle-delayed-2">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedList.name}</h2>
                        <p className="text-gray-400 text-sm mt-1">
                          {selectedList.propertyIds.length} {selectedList.propertyIds.length === 1 ? 'property' : 'properties'}
                        </p>
                      </div>
                      <button
                        onClick={handleOpenAddProperties}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Properties
                      </button>
                    </div>

                    {/* Properties */}
                    {selectedList.propertyIds.length > 0 ? (
                      <div className="space-y-3">
                        {selectedList.propertyIds.map((propertyId) => {
                          const propertyData = getPropertyData(propertyId)
                          if (!propertyData) return null

                          const attributes = propertyData.data.attributes
                          const address = attributes.address.street_group_format.address_lines
                          const postcode = attributes.address.street_group_format.postcode
                          const propertyType = attributes.property_type?.value || 'Unknown'
                          const bedrooms = attributes.number_of_bedrooms?.value || 0
                          const bathrooms = attributes.number_of_bathrooms?.value || 0
                          const latitude = attributes.location?.coordinates?.latitude || 0
                          const longitude = attributes.location?.coordinates?.longitude || 0

                          return (
                            <div
                              key={propertyId}
                              className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                {/* Street View Image */}
                                <div 
                                  className="flex-shrink-0 cursor-pointer"
                                  onClick={() => router.push(`/details/${propertyId}?ref=lists`)}
                                >
                                  <StreetViewImage
                                    latitude={latitude}
                                    longitude={longitude}
                                    address={address}
                                    className="w-20 h-16"
                                  />
                                </div>
                                
                                {/* Property Details */}
                                <div 
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() => router.push(`/details/${propertyId}?ref=lists`)}
                                >
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-white font-semibold text-sm truncate" title={address}>
                                      {address}
                                    </h3>
                                    <span className="text-gray-400 text-xs whitespace-nowrap">
                                      {postcode}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>{propertyType}</span>
                                    <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
                                    <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Move to List Button */}
                                  <button
                                    onClick={() => handleOpenMoveProperty(propertyId)}
                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                                    title="Move to another list"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  </button>

                                  {/* Remove Button */}
                                  <button
                                    onClick={() => handleRemoveProperty(propertyId)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
                                    title="Remove from list"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Properties Yet</h3>
                        <p className="text-gray-400">Add properties to this list to get started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select a List</h3>
                    <p className="text-gray-400">Choose a list from the left to view and manage its properties</p>
                  </div>
                )}
              </div>
            </div>

            {/* Move Property Modal */}
            {movePropertyModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-lg max-w-md w-full border border-gray-600 shadow-2xl">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Move to List</h3>
                        <p className="text-gray-400 text-sm mt-1">Select a list to move this property to</p>
                      </div>
                      <button
                        onClick={() => setMovePropertyModal(null)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {(() => {
                      // Get fresh list data from storage
                      const freshLists = getAllPropertyLists()
                      
                      return freshLists.length > 0 ? (
                        <div className="space-y-2">
                          {freshLists.map((list) => {
                            const isAlreadyInList = list.propertyIds.includes(movePropertyModal.propertyId)
                            
                            return (
                              <button
                                key={list.id}
                                onClick={() => !isAlreadyInList && handleMovePropertyToList(list.id)}
                                disabled={isAlreadyInList}
                                className={`w-full text-left p-4 rounded-lg transition-colors border-2 ${
                                  isAlreadyInList
                                    ? 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'
                                    : 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-white font-semibold">{list.name}</h4>
                                    <p className="text-gray-400 text-sm mt-1">
                                      {list.propertyIds.length} {list.propertyIds.length === 1 ? 'property' : 'properties'}
                                    </p>
                                  </div>
                                  {isAlreadyInList ? (
                                    <span className="text-xs text-gray-400">Already in list</span>
                                  ) : (
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">No lists available</p>
                          <p className="text-gray-500 text-sm mt-2">Create a list to move properties to</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-700 flex justify-end">
                    <button
                      onClick={() => setMovePropertyModal(null)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Properties Modal */}
            {isAddPropertiesOpen && selectedList && (
              <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-600 shadow-2xl">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Add Properties to "{selectedList.name}"</h3>
                        <p className="text-gray-400 text-sm mt-1">Select properties from your recent searches</p>
                      </div>
                      <button
                        onClick={() => setIsAddPropertiesOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                    {recentSearches.length > 0 ? (
                      <div className="space-y-2">
                        {recentSearches.map((search) => {
                          const propertyData = getPropertyData(search.id)
                          if (!propertyData) return null

                          const attributes = propertyData.data.attributes
                          const address = attributes.address.street_group_format.address_lines
                          const postcode = attributes.address.street_group_format.postcode
                          const propertyType = attributes.property_type?.value || 'Unknown'
                          const bedrooms = attributes.number_of_bedrooms?.value || 0
                          const bathrooms = attributes.number_of_bathrooms?.value || 0
                          const isInList = selectedList.propertyIds.includes(search.id)
                          const isSelected = selectedPropertyIds.has(search.id)

                          return (
                            <button
                              key={search.id}
                              onClick={() => !isInList && handleToggleProperty(search.id)}
                              disabled={isInList}
                              className={`w-full text-left p-4 rounded-lg transition-colors border-2 ${
                                isInList
                                  ? 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-blue-900 border-blue-600'
                                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isInList
                                    ? 'bg-gray-600 border-gray-500'
                                    : isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-500'
                                }`}>
                                  {(isSelected || isInList) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>

                                {/* Property Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-white font-semibold text-sm truncate">{address}</h4>
                                    <span className="text-gray-400 text-xs whitespace-nowrap">{postcode}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span>{propertyType}</span>
                                    <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
                                    <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>

                                {isInList && (
                                  <span className="text-xs text-gray-400 whitespace-nowrap">Already in list</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No recent searches found</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
                    <button
                      onClick={() => setIsAddPropertiesOpen(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddProperties}
                      disabled={selectedPropertyIds.size === 0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      Add {selectedPropertyIds.size > 0 && `(${selectedPropertyIds.size})`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

