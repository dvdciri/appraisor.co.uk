import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { query } from '@/lib/db/client'

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allowed source values
const ALLOWED_SOURCES = ['facebook', 'instagram', 'prosperity', 'linkedin']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = body
    
    // Validate and normalize source
    let normalizedSource = 'unknown'
    if (source && typeof source === 'string') {
      const sourceLower = source.toLowerCase().trim()
      if (ALLOWED_SOURCES.includes(sourceLower)) {
        normalizedSource = sourceLower
      }
    }

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if SendFox API key is available
    const sendFoxApiKey = process.env.SEND_FOX_API_KEY
    if (!sendFoxApiKey) {
      console.error('SEND_FOX_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      )
    }

    // Check if SendFox List ID is available
    const sendFoxListId = process.env.SEND_FOX_LIST_ID
    if (!sendFoxListId) {
      console.error('SEND_FOX_LIST_ID is not configured')
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      )
    }

    // Get current subscriber count from our database to determine if this is one of the first N subscribers
    let isFirstNSubscriber = false
    try {
      const result = await query('SELECT COUNT(*) as total FROM subscriptions')
      const currentCount = parseInt(result.rows[0].total) || 0
      isFirstNSubscriber = currentCount < CONFIG.MAX_FREE_SPOTS
    } catch (error) {
      console.error('Error getting subscriber count from database:', error)
    }

    // Prepare contact fields array
    const contactFields = []
    if (isFirstNSubscriber) {
      contactFields.push({
        name: `first_${CONFIG.MAX_FREE_SPOTS}_subscribers`,
        value: 'true'
      })
    }

    // Prepare the contact data
    const contactData = {
      email: email.toLowerCase().trim(),
      lists: [parseInt(sendFoxListId)],
      contact_fields: contactFields
    }

    // Call SendFox API to create contact
    const sendFoxResponse = await fetch('https://api.sendfox.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendFoxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    })

    if (!sendFoxResponse.ok) {
      const errorData = await sendFoxResponse.json().catch(() => ({}))
      console.error('SendFox API error:', {
        status: sendFoxResponse.status,
        statusText: sendFoxResponse.statusText,
        error: errorData
      })

      // Handle specific error cases
      if (sendFoxResponse.status === 422) {
        // Email already exists or validation error
        return NextResponse.json(
          { error: 'This email is already registered or invalid' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again later.' },
        { status: 500 }
      )
    }

    const sendFoxData = await sendFoxResponse.json()

    // Save subscription to our database
    try {
      await query(
        'INSERT INTO subscriptions (email, is_first_n_subscriber, sendfox_contact_id, source) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
        [email.toLowerCase().trim(), isFirstNSubscriber, sendFoxData.id || null, normalizedSource]
      )
    } catch (dbError) {
      console.error('Error saving subscription to database:', dbError)
      // Don't fail the request if database save fails, but log it
    }

    // Prepare success message based on whether they're in the first N subscribers
    const successMessage = isFirstNSubscriber 
      ? `Congratulations! You're one of our first ${CONFIG.MAX_FREE_SPOTS} subscribers and will receive free credits when we launch! 🎉`
      : 'Thank you! We\'ll be in touch soon with your free credits.'

    return NextResponse.json(
      { 
        success: true, 
        message: successMessage,
        is_first_n: isFirstNSubscriber
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in SendFox API route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
