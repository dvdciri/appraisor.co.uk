// Task-Property associations stored in localStorage
// We only store the connection between tasks and properties
// Task details (name, date, etc.) are always fetched from Todoist

export interface TaskPropertyAssociation {
  taskId: string        // Todoist task ID
  propertyId: string    // analysisId (our internal property ID)
  createdAt: number     // When the association was created
}

const TASKS_STORAGE_KEY = 'estimo_task_associations'

// Load all task-property associations
export function loadTaskAssociations(): TaskPropertyAssociation[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(TASKS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load task associations:', error)
    return []
  }
}

// Save task-property associations
export function saveTaskAssociations(associations: TaskPropertyAssociation[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(associations))
  } catch (error) {
    console.error('Failed to save task associations:', error)
  }
}

// Add a new task-property association
export function addTaskAssociation(association: TaskPropertyAssociation): void {
  const associations = loadTaskAssociations()
  associations.push(association)
  saveTaskAssociations(associations)
}

// Get task association by task ID
export function getTaskAssociation(taskId: string): TaskPropertyAssociation | null {
  const associations = loadTaskAssociations()
  return associations.find(a => a.taskId === taskId) || null
}

// Get all tasks for a property
export function getTasksForProperty(propertyId: string): TaskPropertyAssociation[] {
  const associations = loadTaskAssociations()
  return associations.filter(a => a.propertyId === propertyId)
}

// Remove task association
export function removeTaskAssociation(taskId: string): void {
  const associations = loadTaskAssociations()
  const filtered = associations.filter(a => a.taskId !== taskId)
  saveTaskAssociations(filtered)
}

