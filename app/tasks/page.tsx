'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '../components/Header'
import Toast from '../components/Toast'
import Dialog from '../components/Dialog'
import {
  loadTaskAssociations,
  addTaskAssociation,
  removeTaskAssociation,
  type TaskPropertyAssociation
} from '../../lib/tasks'
import {
  loadUserAnalysesStore,
  type UserAnalysesStore,
  getGenericProperty
} from '../../lib/persistence'

interface TodoistTask {
  id: string
  content: string
  description: string
  due?: {
    date: string
    datetime?: string
    string: string
  }
  priority: number
  created_at: string
}

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<TodoistTask[]>([])
  const [associations, setAssociations] = useState<TaskPropertyAssociation[]>([])
  const [properties, setProperties] = useState<UserAnalysesStore>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Filter state - check URL param for property filter
  const propertyFromUrl = searchParams.get('property')
  const [filterPropertyId, setFilterPropertyId] = useState<string>(propertyFromUrl || 'all')

  // Load tasks and associations
  useEffect(() => {
    loadData()
  }, [])

  // Update filter when URL param changes
  useEffect(() => {
    if (propertyFromUrl) {
      setFilterPropertyId(propertyFromUrl)
    }
  }, [propertyFromUrl])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load tasks from Todoist
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasksData = await response.json()
      setTasks(tasksData)

      // Load local associations and properties
      const localAssociations = loadTaskAssociations()
      setAssociations(localAssociations)
      
      const propertiesStore = loadUserAnalysesStore()
      setProperties(propertiesStore)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setErrorMessage('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName || !selectedPropertyId || !dueDate) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      // Get property address for task description
      const userAnalysis = properties[selectedPropertyId]
      const propertyData = userAnalysis ? getGenericProperty(userAnalysis.uprn) : null
      const address = propertyData?.data?.data?.attributes?.address?.street_group_format?.address_lines || 'Property'

      // Combine date and time for Todoist
      let dueDateTimeString = dueDate
      if (dueTime) {
        // Create ISO datetime string
        dueDateTimeString = `${dueDate}T${dueTime}:00`
      }

      // Create task in Todoist
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          content: taskName,
          description: `Property: ${address}`,
          due_datetime: dueTime ? dueDateTimeString : undefined,
          due_date: dueTime ? undefined : dueDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const newTask = await response.json()

      // Save association locally (only the connection, not task details)
      addTaskAssociation({
        taskId: newTask.id,
        propertyId: selectedPropertyId,
        createdAt: Date.now(),
      })

      // Reload data
      await loadData()

      // Reset form
      setTaskName('')
      setSelectedPropertyId('')
      setDueDate('')
      setDueTime('')
      setShowAddForm(false)
      setSuccessMessage('Task created successfully!')
    } catch (error) {
      console.error('Error creating task:', error)
      setErrorMessage('Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          taskId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete task')
      }

      // Remove from local storage
      removeTaskAssociation(taskId)

      // Reload data
      await loadData()
      setSuccessMessage('Task completed!')
    } catch (error) {
      console.error('Error completing task:', error)
      setErrorMessage('Failed to complete task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          taskId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      // Remove from local storage
      removeTaskAssociation(taskId)

      // Reload data
      await loadData()
      setSuccessMessage('Task deleted!')
    } catch (error) {
      console.error('Error deleting task:', error)
      setErrorMessage('Failed to delete task')
    }
  }

  const getPropertyAddress = (propertyId: string): string => {
    const userAnalysis = properties[propertyId]
    if (!userAnalysis) return 'Unknown Property'
    
    const propertyData = getGenericProperty(userAnalysis.uprn)
    return propertyData?.data?.data?.attributes?.address?.street_group_format?.address_lines || 'Unknown Property'
  }

  const getTaskAssociation = (taskId: string): TaskPropertyAssociation | undefined => {
    return associations.find(a => a.taskId === taskId)
  }

  // Filter tasks by property
  const filteredTasks = tasks.filter((task) => {
    if (filterPropertyId === 'all') return true
    const association = getTaskAssociation(task.id)
    return association?.propertyId === filterPropertyId
  })

  // Smart back navigation based on referrer
  const handleBackClick = () => {
    const ref = searchParams.get('ref')
    
    if (ref === 'details') {
      // Use browser back to avoid adding to history and creating loops
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Error Toast */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}
      
      {/* Success Toast */}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      <Header 
        showBackButton={true}
        onBackClick={handleBackClick}
        backButtonText="Back"
        showHomeButton={true}
        onHomeClick={() => router.push('/')}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
                <p className="text-gray-400">Powered by Todoist</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {showAddForm ? 'Cancel' : 'Add Task'}
              </button>
            </div>

            {/* Filter Section */}
            {tasks.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="propertyFilter" className="block text-sm font-medium text-gray-300">
                    Filter by Property
                    {propertyFromUrl && filterPropertyId !== 'all' && (
                      <span className="ml-2 text-xs text-blue-400">(filtered from property page)</span>
                    )}
                  </label>
                  {filterPropertyId !== 'all' && (
                    <button
                      onClick={() => {
                        setFilterPropertyId('all')
                        router.push('/tasks')
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <select
                  id="propertyFilter"
                  value={filterPropertyId}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setFilterPropertyId(newValue)
                    if (newValue === 'all') {
                      router.push('/tasks')
                    } else {
                      router.push(`/tasks?property=${newValue}`)
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Properties ({tasks.length})</option>
                  {Object.entries(properties).map(([id, analysis]) => {
                    const propertyData = getGenericProperty(analysis.uprn)
                    const address = propertyData?.data?.data?.attributes?.address?.street_group_format?.address_lines || 'Unknown Address'
                    const taskCount = tasks.filter(task => {
                      const association = getTaskAssociation(task.id)
                      return association?.propertyId === id
                    }).length
                    
                    if (taskCount === 0) return null
                    
                    return (
                      <option key={id} value={id}>
                        {address} ({taskCount})
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Add Task Dialog */}
          <Dialog
            title="Create New Task"
            isOpen={showAddForm}
            onClose={() => {
              setShowAddForm(false)
              setTaskName('')
              setSelectedPropertyId('')
              setDueDate('')
              setDueTime('')
            }}
            maxWidth="lg"
          >
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-300 mb-2">
                  Task Name *
                </label>
                <input
                  type="text"
                  id="taskName"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task name"
                  required
                />
              </div>

              <div>
                <label htmlFor="property" className="block text-sm font-medium text-gray-300 mb-2">
                  Related Property *
                </label>
                <select
                  id="property"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a property</option>
                  {Object.entries(properties).map(([id, analysis]) => {
                    const propertyData = getGenericProperty(analysis.uprn)
                    const address = propertyData?.data?.data?.attributes?.address?.street_group_format?.address_lines || 'Unknown Address'
                    return (
                      <option key={id} value={id}>
                        {address}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dueTime" className="block text-sm font-medium text-gray-300 mb-2">
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    id="dueTime"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setTaskName('')
                    setSelectedPropertyId('')
                    setDueDate('')
                    setDueTime('')
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !taskName || !selectedPropertyId || !dueDate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </Dialog>

          {/* Tasks List */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {filterPropertyId === 'all' ? 'Your Tasks' : 'Filtered Tasks'}
              {filteredTasks.length > 0 && tasks.length > 0 && (
                <span className="text-gray-400 text-base font-normal ml-2">
                  ({filteredTasks.length} of {tasks.length})
                </span>
              )}
            </h2>
            
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No tasks yet. Create your first task!
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No tasks found for this property.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const association = getTaskAssociation(task.id)
                  
                  return (
                    <div
                      key={task.id}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{task.content}</h3>
                          
                          {association && (
                            <button
                              onClick={() => router.push(`/details/${association.propertyId}`)}
                              className="text-sm text-blue-400 hover:text-blue-300 mb-1"
                            >
                              📍 {getPropertyAddress(association.propertyId)}
                            </button>
                          )}
                          
                          {task.due && (
                            <div className="text-sm text-gray-400 mt-1">
                              📅 Due: {new Date(task.due.date).toLocaleDateString()}
                              {task.due.datetime && (
                                <span className="ml-2">
                                  🕐 {new Date(task.due.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="text-green-500 hover:text-green-400 p-2 rounded transition-colors"
                            title="Complete task"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-400 p-2 rounded transition-colors"
                            title="Delete task"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


