import { NextRequest, NextResponse } from 'next/server'

const TODOIST_API_URL = 'https://api.todoist.com/rest/v2'
const ESTIMO_LABEL = 'estimo'

// Check if estimo label exists, create if it doesn't
async function ensureEstimoLabel() {
  // Get all labels
  const response = await fetch(`${TODOIST_API_URL}/labels`, {
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch labels')
  }
  
  const labels = await response.json()
  const estimoLabel = labels.find((label: any) => label.name === ESTIMO_LABEL)
  
  // If label doesn't exist, create it
  if (!estimoLabel) {
    const createResponse = await fetch(`${TODOIST_API_URL}/labels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: ESTIMO_LABEL,
        color: 'blue'
      }),
    })
    
    if (!createResponse.ok) {
      throw new Error('Failed to create estimo label')
    }
    
    return createResponse.json()
  }
  
  return estimoLabel
}

// Get all tasks with estimo label
async function getTasks() {
  const response = await fetch(`${TODOIST_API_URL}/tasks?label=${ESTIMO_LABEL}`, {
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  
  return response.json()
}

// Create a new task with estimo label
async function createTask(data: {
  content: string
  description?: string
  due_string?: string
  due_date?: string
  due_datetime?: string
  priority?: number
  labels?: string[]
}) {
  // Ensure label exists first
  await ensureEstimoLabel()
  
  // Always add the estimo label
  const taskData = {
    ...data,
    labels: [...(data.labels || []), ESTIMO_LABEL]
  }
  
  const response = await fetch(`${TODOIST_API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create task')
  }
  
  return response.json()
}

// Update a task
async function updateTask(taskId: string, data: any) {
  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update task')
  }
  
  return response.json()
}

// Complete a task
async function completeTask(taskId: string) {
  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}/close`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to complete task')
  }
  
  return { success: true }
}

// Delete a task
async function deleteTask(taskId: string) {
  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.TODOIST_API_KEY}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete task')
  }
  
  return { success: true }
}

export async function GET(request: NextRequest) {
  try {
    const tasks = await getTasks()
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, taskId, ...data } = body
    
    switch (action) {
      case 'create':
        const newTask = await createTask(data)
        return NextResponse.json(newTask)
      
      case 'update':
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required for update' },
            { status: 400 }
          )
        }
        const updatedTask = await updateTask(taskId, data)
        return NextResponse.json(updatedTask)
      
      case 'complete':
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required for complete' },
            { status: 400 }
          )
        }
        const completeResult = await completeTask(taskId)
        return NextResponse.json(completeResult)
      
      case 'delete':
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required for delete' },
            { status: 400 }
          )
        }
        const deleteResult = await deleteTask(taskId)
        return NextResponse.json(deleteResult)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing task request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}


