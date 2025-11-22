import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '../../../../lib/db/client'
import { ensureAppReady } from '@/lib/db/startup'

// GET - fetch user tabs
export async function GET(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user_id from database
    const userResult = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].user_id

    // Fetch all tabs for the user, ordered by created_at
    const result = await query(
      `SELECT tab_id, title, property_uprn, is_active, last_updated, created_at 
       FROM user_tabs 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default tabs if none exist
      return NextResponse.json({
        tabs: [{ id: 'tab-1', title: 'Search', propertyUPRN: null }],
        activeTabId: 'tab-1',
        lastUpdated: null
      })
    }

    // Convert database rows to tab format
    const tabs = result.rows.map(row => ({
      id: row.tab_id,
      title: row.title,
      propertyUPRN: row.property_uprn || null
    }))

    // Find the active tab
    const activeTab = result.rows.find(row => row.is_active)
    const activeTabId = activeTab ? activeTab.tab_id : (tabs.length > 0 ? tabs[0].id : null)

    return NextResponse.json({
      tabs,
      activeTabId,
      lastUpdated: result.rows[0]?.last_updated || null
    })
  } catch (error) {
    console.error('Error fetching user tabs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - save/update user tabs (syncs all tabs)
export async function POST(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { tabs, activeTabId } = await request.json()

    if (!tabs || !Array.isArray(tabs)) {
      return NextResponse.json(
        { error: 'Tabs array is required' },
        { status: 400 }
      )
    }

    // Get user_id from database
    const userResult = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].user_id

    // Start a transaction to sync all tabs
    await query('BEGIN')

    try {
      // Get existing tab_ids for this user
      const existingTabsResult = await query(
        'SELECT tab_id FROM user_tabs WHERE user_id = $1',
        [userId]
      )
      const existingTabIds = new Set(existingTabsResult.rows.map(row => row.tab_id))
      const newTabIds = new Set(tabs.map(tab => tab.id))

      // Delete tabs that are no longer in the array
      const tabsToDelete = Array.from(existingTabIds).filter(id => !newTabIds.has(id))
      if (tabsToDelete.length > 0) {
        await query(
          'DELETE FROM user_tabs WHERE user_id = $1 AND tab_id = ANY($2::varchar[])',
          [userId, tabsToDelete]
        )
      }

      // First, set all tabs to inactive
      await query(
        'UPDATE user_tabs SET is_active = FALSE WHERE user_id = $1',
        [userId]
      )

      // Upsert each tab
      for (const tab of tabs) {
        const isActive = tab.id === activeTabId

        await query(`
          INSERT INTO user_tabs (user_id, tab_id, title, property_uprn, is_active, last_updated)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (user_id, tab_id) 
          DO UPDATE SET 
            title = EXCLUDED.title,
            property_uprn = EXCLUDED.property_uprn,
            is_active = EXCLUDED.is_active,
            last_updated = NOW()
        `, [
          userId,
          tab.id,
          tab.title || 'Search',
          tab.propertyUPRN || null,
          isActive
        ])
      }

      await query('COMMIT')

      // Fetch updated tabs to return
      const result = await query(
        `SELECT tab_id, title, property_uprn, is_active, last_updated 
         FROM user_tabs 
         WHERE user_id = $1 
         ORDER BY created_at ASC`,
        [userId]
      )

      const updatedTabs = result.rows.map(row => ({
        id: row.tab_id,
        title: row.title,
        propertyUPRN: row.property_uprn || null
      }))

      const activeTab = result.rows.find(row => row.is_active)
      const finalActiveTabId = activeTab ? activeTab.tab_id : (updatedTabs.length > 0 ? updatedTabs[0].id : null)

      return NextResponse.json({
        tabs: updatedTabs,
        activeTabId: finalActiveTabId,
        lastUpdated: result.rows[0]?.last_updated || null
      })
    } catch (error) {
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error saving user tabs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - delete a specific tab
export async function DELETE(request: NextRequest) {
  try {
    // Ensure database is ready before processing
    await ensureAppReady()
    
    // Check authentication
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const tabId = searchParams.get('tabId')

    if (!tabId) {
      return NextResponse.json(
        { error: 'tabId is required' },
        { status: 400 }
      )
    }

    // Get user_id from database
    const userResult = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].user_id

    // Check if this is the last tab
    const countResult = await query(
      'SELECT COUNT(*) as count FROM user_tabs WHERE user_id = $1',
      [userId]
    )

    if (parseInt(countResult.rows[0].count) <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last tab' },
        { status: 400 }
      )
    }

    // Delete the tab
    await query(
      'DELETE FROM user_tabs WHERE user_id = $1 AND tab_id = $2',
      [userId, tabId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tab:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
