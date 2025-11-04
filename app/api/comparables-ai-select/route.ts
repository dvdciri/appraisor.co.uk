import { NextRequest, NextResponse } from 'next/server'
import { Agent, run, tool, user } from '@openai/agents'
import { z } from 'zod'

// Configuration constants
const SIZE_TOLERANCE_PERCENT = 10 // Size difference tolerance (configurable)
const TARGET_COMPARABLES_COUNT = 10 // Number of comparables to find per bucket (configurable)
const FINAL_COMPARABLES_COUNT = 3 // Number of comparables to return (must have >=80% similarity)
const MIN_SIMILARITY_SCORE = 80 // Minimum similarity score to accept a comparable (configurable)
const CANDIDATES_PER_BUCKET = 5 // Number of candidates to send to AI per bucket assessment (configurable)

// Define schemas
const ComparablesSelectionOutputSchema = z.object({
  comparables: z.array(z.object({
    street_group_property_id: z.string().describe('The street_group_property_id of the candidate comparable'),
    similarity_score: z.number().min(0).max(100).describe('Visual similarity score from 0-100% (0 = very different, 100 = very similar). Only include comparables with score >= 80%'),
    brief_notes: z.string().describe('Brief notes about key visual matches/mismatches for this candidate')
  })).max(3).describe('Top 3 candidates with >=80% similarity, sorted by score (highest first). Stop processing buckets once you have 3 matches.')
})

// Transaction type matching the client structure
interface ComparableTransaction {
  street_group_property_id: string
  address: {
    street_group_format: {
      address_lines: string
      postcode: string
    }
    simplified_format: {
      street: string
    }
  }
  property_type: string
  transaction_date: string
  price: number
  internal_area_square_metres: number
  price_per_square_metre: number
  number_of_bedrooms: number
  number_of_bathrooms: number
  location: {
    coordinates: {
      longitude: number
      latitude: number
    }
  }
  distance_in_metres: number
}

interface TargetPropertyData {
  address: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  internalArea: number
  location?: {
    coordinates: {
      latitude: number
      longitude: number
    }
  }
}

// Helper function to calculate date difference in days
function daysSince(dateString: string): number {
  const transactionDate = new Date(dateString + 'T00:00:00.000Z')
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - transactionDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Helper function to get street view URL
function getStreetViewUrl(latitude: number, longitude: number): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBVYvvxZFPpQpMl9bQ-kFUfgXO0XaeLN3U'
  return `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${latitude},${longitude}&fov=80&pitch=0&key=${apiKey}`
}

// Bucket structure for organizing comparables by relaxation strategy
interface ComparableBucket {
  relaxationStrategy: string
  comparables: ComparableTransaction[]
  maxDistance: number
  maxDays: number
}

// Algorithmic filtering function to create buckets of comparables
function createComparableBuckets(
  transactions: ComparableTransaction[],
  targetProperty: TargetPropertyData,
  targetStreet: string
): { buckets: ComparableBucket[], totalCandidatesConsidered: number } {
  // Step 1: Filter by exact matches (beds, baths, property type) and size within tolerance
  const sizeMin = targetProperty.internalArea * (1 - SIZE_TOLERANCE_PERCENT / 100)
  const sizeMax = targetProperty.internalArea * (1 + SIZE_TOLERANCE_PERCENT / 100)

  console.log('[Comparables Selection] Filtering criteria:', {
    size_min: sizeMin,
    size_max: sizeMax,
    target_beds: targetProperty.bedrooms,
    target_baths: targetProperty.bathrooms,
    target_type: targetProperty.propertyType
  })
  
  // Log before filtering to see raw transaction data
  console.log('[Comparables Selection] Pre-filter transaction analysis:', {
    total_transactions: transactions.length,
    transactions_with_beds: transactions.filter(t => t.number_of_bedrooms !== null && t.number_of_bedrooms !== undefined).length,
    transactions_with_baths: transactions.filter(t => t.number_of_bathrooms !== null && t.number_of_bathrooms !== undefined).length,
    transactions_with_type: transactions.filter(t => t.property_type).length,
    transactions_with_size: transactions.filter(t => t.internal_area_square_metres).length,
    unique_types: [...new Set(transactions.map(t => t.property_type))],
    bed_range: {
      min: Math.min(...transactions.map(t => t.number_of_bedrooms || 0)),
      max: Math.max(...transactions.map(t => t.number_of_bedrooms || 0)),
      target: targetProperty.bedrooms
    },
    bath_range: {
      min: Math.min(...transactions.map(t => t.number_of_bathrooms || 0)),
      max: Math.max(...transactions.map(t => t.number_of_bathrooms || 0)),
      target: targetProperty.bathrooms
    },
    size_range: {
      min: Math.min(...transactions.map(t => t.internal_area_square_metres || 0)),
      max: Math.max(...transactions.map(t => t.internal_area_square_metres || 0)),
      target: targetProperty.internalArea
    }
  })
  
  let candidates = transactions.filter(t => {
    // Match beds, baths, property type exactly
    const bedsMatch = t.number_of_bedrooms === targetProperty.bedrooms
    const bathsMatch = t.number_of_bathrooms === targetProperty.bathrooms
    const typeMatch = t.property_type === targetProperty.propertyType
    const sizeMatch = t.internal_area_square_metres >= sizeMin && t.internal_area_square_metres <= sizeMax

    const matches = bedsMatch && bathsMatch && typeMatch && sizeMatch
    
    // Log why transactions are filtered out (first few only to avoid spam)
    if (!matches && transactions.indexOf(t) < 5) {
      console.log(`[Comparables Selection] Transaction ${t.street_group_property_id} filtered out:`, {
        address: t.address?.street_group_format?.address_lines,
        beds_match: bedsMatch,
        baths_match: bathsMatch,
        type_match: typeMatch,
        size_match: sizeMatch,
        transaction_beds: t.number_of_bedrooms,
        transaction_baths: t.number_of_bathrooms,
        transaction_type: t.property_type,
        transaction_size: t.internal_area_square_metres
      })
    }

    return matches
  })

  const totalCandidatesConsidered = candidates.length
  console.log('[Comparables Selection] After initial filtering:', {
    candidates_found: totalCandidatesConsidered,
    filtered_out: transactions.length - totalCandidatesConsidered,
    filter_breakdown: {
      beds_mismatch: transactions.filter(t => t.number_of_bedrooms !== targetProperty.bedrooms).length,
      baths_mismatch: transactions.filter(t => t.number_of_bathrooms !== targetProperty.bathrooms).length,
      type_mismatch: transactions.filter(t => t.property_type !== targetProperty.propertyType).length,
      size_mismatch: transactions.filter(t => {
        const size = t.internal_area_square_metres
        return !size || size < sizeMin || size > sizeMax
      }).length
    }
  })

  // Progressive relaxation strategies - create a bucket for each
  const relaxationStrategies = [
    { maxDistance: 0, maxDays: 30, description: 'Same street, last 30 days' },
    { maxDistance: 0, maxDays: 90, description: 'Same street, last 3 months' },
    { maxDistance: 402, maxDays: 90, description: '1/4 mile, last 3 months' },
    { maxDistance: 805, maxDays: 180, description: '1/2 mile, last 6 months' },
    { maxDistance: 1609, maxDays: 365, description: '1 mile, last year' },
    { maxDistance: 3218, maxDays: 730, description: '2 miles, last 2 years' },
    { maxDistance: Infinity, maxDays: Infinity, description: 'Any distance, any date' }
  ]

  const buckets: ComparableBucket[] = []

  for (const strategy of relaxationStrategies) {
    let filtered = candidates

    // Apply distance filter
    if (strategy.maxDistance === 0) {
      // Same street only
      filtered = filtered.filter(t => {
        const transactionStreet = t.address?.simplified_format?.street || ''
        return transactionStreet === targetStreet
      })
    } else if (strategy.maxDistance !== Infinity) {
      filtered = filtered.filter(t => t.distance_in_metres <= strategy.maxDistance)
    }

    // Apply date filter
    if (strategy.maxDays !== Infinity) {
      filtered = filtered.filter(t => daysSince(t.transaction_date) <= strategy.maxDays)
    }

    // Sort by priority: same street > closer distance > more recent
    filtered.sort((a, b) => {
      const aSameStreet = (a.address?.simplified_format?.street || '') === targetStreet ? 1 : 0
      const bSameStreet = (b.address?.simplified_format?.street || '') === targetStreet ? 1 : 0
      
      if (aSameStreet !== bSameStreet) {
        return bSameStreet - aSameStreet // Same street first
      }
      
      // Then by distance (closer first)
      if (a.distance_in_metres !== b.distance_in_metres) {
        return a.distance_in_metres - b.distance_in_metres
      }
      
      // Then by recency (more recent first)
      return daysSince(a.transaction_date) - daysSince(b.transaction_date)
    })

    // Create bucket with top candidates (up to TARGET_COMPARABLES_COUNT)
    if (filtered.length > 0) {
      buckets.push({
        relaxationStrategy: strategy.description,
        comparables: filtered.slice(0, TARGET_COMPARABLES_COUNT),
        maxDistance: strategy.maxDistance,
        maxDays: strategy.maxDays
      })
    }
  }

  return {
    buckets,
    totalCandidatesConsidered
  }
}

// Store request data in closure for tools
let requestContext: {
  targetPropertyStreetView: string | null
  buckets: Array<{
    index: number
    relaxationStrategy: string
    comparables: Array<{
      street_group_property_id: string
      street_view_url: string
      address: string
    }>
  }>
} | null = null

// Tool to get target property street view
const getTargetPropertyStreetView = tool({
  name: 'get_target_property_street_view',
  description: 'Returns the street view image URL for the target property',
  parameters: z.object({}),
  execute: async () => {
    if (!requestContext) {
      throw new Error('Request context not initialized')
    }
    return {
      street_view_url: requestContext.targetPropertyStreetView
    }
  }
})

// Tool to get available buckets
const getAvailableBuckets = tool({
  name: 'get_available_buckets',
  description: 'Returns information about available buckets of comparables, ordered from strictest to most relaxed criteria',
  parameters: z.object({}),
  execute: async () => {
    if (!requestContext) {
      throw new Error('Request context not initialized')
    }
    return {
      total_buckets: requestContext.buckets.length,
      buckets: requestContext.buckets.map(b => ({
        index: b.index,
        relaxation_strategy: b.relaxationStrategy,
        comparables_count: b.comparables.length
      }))
    }
  }
})

// Tool to get comparables from a specific bucket
const getBucketComparables = tool({
  name: 'get_bucket_comparables',
  description: 'Returns the comparables from a specific bucket with their street view images for visual comparison. Call this tool to get candidates from a bucket, then assess them. Start with bucket index 0 (strictest criteria) and move to higher indices if needed.',
  parameters: z.object({
    bucket_index: z.number().int().min(0).describe('The index of the bucket to retrieve (0 = strictest criteria, higher = more relaxed)')
  }),
  execute: async ({ bucket_index }) => {
    if (!requestContext) {
      throw new Error('Request context not initialized')
    }
    if (bucket_index < 0 || bucket_index >= requestContext.buckets.length) {
      throw new Error(`Invalid bucket index: ${bucket_index}. Available buckets: 0-${requestContext.buckets.length - 1}`)
    }
    const bucket = requestContext.buckets[bucket_index]
    return {
      bucket_index,
      relaxation_strategy: bucket.relaxationStrategy,
      comparables: bucket.comparables
    }
  }
})

// Define the comparables visual comparison agent
const comparablesAgent = new Agent({
  name: 'Property Visual Similarity Expert',
  instructions: `
    ROLE
    You compare the target property's street-view image with candidate properties to find the 3 most visually similar ones.


    WORKFLOW
    1. Call get_target_property_street_view for the target image.
    2. Call get_available_buckets to list buckets.
    3. Process buckets in order (starting from index 0, strictest first):
        - Call get_bucket_comparables(bucket_index)
        - Score all candidates 0–100 based on visual similarity:
            • Architectural style / era
            • Subtype (mid-/end-terrace, semi, etc.)
            • Materials / build form
        - Keep only those with score ≥80.
        - If ≥3 such comparables exist, stop and return them.
    4. If <3 found, move to the next bucket.


    COMPARISON CRITERIA (for each candidate)
    Compare ONLY what is visible in street view:
    - Architectural era / style (e.g. Victorian terrace vs modern)
    - Subtype (mid-terrace / end-terrace / semi-detached / etc.)
    - Materials and build form

    SCORING GUIDANCE
    Score STRICTLY based on visual differences. Be conservative - only score ≥80% when properties are very similar.
    
    REQUIRED LOW SCORES (0-30) for ANY of these differences:
    - Garage vs no garage (or vice versa) → Score 0-20
    - Different property subtype (mid-terrace vs end-terrace vs semi-detached) → Score 0-20
    - Different brick/cladding materials → Score 0-30
    - Different roof type/style → Score 0-30
        
    Only score ≥80% when:
    - Same property subtype (e.g., both mid-terrace, both end-terrace, both semi-detached)
    - Same garage presence (both have garage OR both don't have garage)
    - Similar materials and roof style
    - Overall architectural style matches
    
    OUTPUT
    Return up to 3 comparables (score ≥80) sorted highest-first:
    Brief notes must mention key visual matches or mismatches.`,
  outputType: ComparablesSelectionOutputSchema,
  tools: [getTargetPropertyStreetView, getAvailableBuckets, getBucketComparables],
  model: 'gpt-5-2025-08-07',
})

export async function POST(request: NextRequest) {
  let requestUprn: string | undefined
  try {
    // Check if SSE is requested
    const useSSE = request.headers.get('x-use-sse') === 'true'
    
    if (useSSE) {
      return handleSSERequest(request)
    }
    
    // Regular request handling
    return handleRegularRequest(request)
  } catch (error: any) {
    console.error('[Comparables AI Agent] ===== TOP LEVEL ERROR =====')
    console.error('[Comparables AI Agent] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      uprn: requestUprn,
      error_type: error.constructor.name,
      error_keys: Object.keys(error)
    })
    if (error.cause) {
      console.error('[Comparables AI Agent] Error cause:', error.cause)
    }
    console.error('[Comparables AI Agent] ===== END TOP LEVEL ERROR =====\n')
    
    requestContext = null

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to select comparables with AI'
      },
      { status: 500 }
    )
  }
}

async function handleRegularRequest(request: NextRequest) {
  const body = await request.json()
  const { uprn, nearbyTransactions, targetProperty } = body
  const requestUprn = uprn

  if (!uprn) {
    return NextResponse.json(
      { error: 'UPRN is required' },
      { status: 400 }
    )
  }

  if (!nearbyTransactions || !Array.isArray(nearbyTransactions)) {
    return NextResponse.json(
      { error: 'nearbyTransactions array is required' },
      { status: 400 }
    )
  }

  if (!targetProperty) {
    return NextResponse.json(
      { error: 'targetProperty is required' },
      { status: 400 }
    )
  }

  // Step 1: Create buckets of comparables by relaxation strategy
  const targetPropertyData = targetProperty as TargetPropertyData
  const targetStreet = body.targetStreet || ''
  const transactions = nearbyTransactions as ComparableTransaction[]

  console.log('[Comparables Selection] ===== STARTING REQUEST =====')
  console.log('[Comparables Selection] Request details:', {
    uprn,
    target_address: targetPropertyData.address,
    target_property_type: targetPropertyData.propertyType,
    target_beds: targetPropertyData.bedrooms,
    target_baths: targetPropertyData.bathrooms,
    target_sqm: targetPropertyData.internalArea,
    target_street: targetStreet,
    target_location: targetPropertyData.location,
    available_transactions: transactions.length
  })
  
  // Log sample transactions to see what data we're working with
  if (transactions.length > 0) {
    console.log('[Comparables Selection] Sample transaction (first):', JSON.stringify(transactions[0], null, 2))
  } else {
    console.warn('[Comparables Selection] WARNING: No transactions provided!')
  }

  const { buckets, totalCandidatesConsidered } = createComparableBuckets(
    transactions,
    targetPropertyData,
    targetStreet
  )

  console.log(`[Comparables Selection] Created ${buckets.length} buckets, total candidates considered: ${totalCandidatesConsidered}`)
  buckets.forEach((bucket, idx) => {
    const withLocation = bucket.comparables.filter(t => t.location?.coordinates).length
    console.log(`  Bucket ${idx + 1}: ${bucket.relaxationStrategy}`)
    console.log(`    - Total comparables: ${bucket.comparables.length}`)
    console.log(`    - With location data: ${withLocation}`)
    if (bucket.comparables.length > 0) {
      console.log(`    - Property IDs: ${bucket.comparables.slice(0, 5).map(t => t.street_group_property_id).join(', ')}${bucket.comparables.length > 5 ? '...' : ''}`)
    }
  })

  if (buckets.length === 0 || totalCandidatesConsidered === 0) {
    console.error('[Comparables Selection] ===== NO COMPARABLES FOUND =====')
    console.error('[Comparables Selection] Failure details:', {
      buckets_created: buckets.length,
      total_candidates: totalCandidatesConsidered,
      transactions_provided: transactions.length,
      target_property: {
        address: targetPropertyData.address,
        type: targetPropertyData.propertyType,
        beds: targetPropertyData.bedrooms,
        baths: targetPropertyData.bathrooms,
        sqm: targetPropertyData.internalArea,
        size_min: sizeMin,
        size_max: sizeMax,
        street: targetStreet
      },
      transaction_analysis: {
        total: transactions.length,
        with_location: transactions.filter(t => t.location?.coordinates).length,
        unique_property_types: [...new Set(transactions.map(t => t.property_type))],
        bed_counts: transactions.reduce((acc, t) => {
          const beds = t.number_of_bedrooms || 0
          acc[beds] = (acc[beds] || 0) + 1
          return acc
        }, {} as Record<number, number>),
        bath_counts: transactions.reduce((acc, t) => {
          const baths = t.number_of_bathrooms || 0
          acc[baths] = (acc[baths] || 0) + 1
          return acc
        }, {} as Record<number, number>),
        size_distribution: {
          min: transactions.length > 0 ? Math.min(...transactions.map(t => t.internal_area_square_metres || 0)) : 0,
          max: transactions.length > 0 ? Math.max(...transactions.map(t => t.internal_area_square_metres || 0)) : 0,
          avg: transactions.length > 0 ? transactions.reduce((sum, t) => sum + (t.internal_area_square_metres || 0), 0) / transactions.length : 0
        }
      }
    })
    console.error('[Comparables Selection] ===== END ERROR LOG =====\n')
    
    return NextResponse.json(
      {
        success: false,
        error: 'No suitable comparables found matching the criteria'
      },
      { status: 200 }
    )
  }

  // Step 2: Get target property street view URL
  const targetStreetViewUrl = targetPropertyData.location?.coordinates
    ? getStreetViewUrl(
        targetPropertyData.location.coordinates.latitude,
        targetPropertyData.location.coordinates.longitude
      )
    : null

  if (!targetStreetViewUrl) {
    return NextResponse.json(
      {
        success: false,
        error: 'Target property location data not available for street view'
      },
      { status: 200 }
    )
  }

  // Step 3: Prepare buckets with street view URLs for all comparables
  const bucketsWithImages = buckets.map((bucket, index) => ({
    index,
    relaxationStrategy: bucket.relaxationStrategy,
    comparables: bucket.comparables
      .filter(t => t.location?.coordinates) // Only those with location data
      .map(t => ({
        street_group_property_id: t.street_group_property_id,
        street_view_url: getStreetViewUrl(
          t.location!.coordinates.latitude,
          t.location!.coordinates.longitude
        ),
        address: t.address?.street_group_format?.address_lines || 'Address not available'
      }))
  })).filter(bucket => bucket.comparables.length > 0) // Only keep buckets with comparables

  console.log(`[Comparables Selection] Prepared ${bucketsWithImages.length} buckets with street view images:`)
  bucketsWithImages.forEach((bucket, idx) => {
    console.log(`  Bucket ${idx}: ${bucket.relaxationStrategy} - ${bucket.comparables.length} comparables`)
  })

  if (bucketsWithImages.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'No comparables with valid location data for street view'
      },
      { status: 200 }
    )
  }

  // Step 4: Initialize request context and call AI agent once
  requestContext = {
    targetPropertyStreetView: targetStreetViewUrl,
    buckets: bucketsWithImages
  }

  console.log(`[Comparables Selection] Calling AI agent once with access to ${bucketsWithImages.length} buckets`)
  console.log(`[Comparables Selection] Agent will process buckets sequentially until it finds ${FINAL_COMPARABLES_COUNT} comparables with >=${MIN_SIMILARITY_SCORE}% similarity`)

  const userMessage = user('Process buckets of comparables sequentially to find the 3 best matches with >=80% visual similarity. Start with bucket 0 (strictest criteria) and stop as soon as you have 3 matches.')
  
  if (targetStreetViewUrl) {
    userMessage.content = [
      { type: 'input_text' as const, text: 'Process buckets of comparables sequentially to find the 3 best matches with >=80% visual similarity. Start with bucket 0 (strictest criteria) and stop as soon as you have 3 matches.' },
      { type: 'input_image' as const, image: targetStreetViewUrl }
    ]
  }

  console.log('[Comparables Selection] Calling AI agent...')
  let result
  try {
    result = await run(comparablesAgent, [userMessage])
    console.log('[Comparables Selection] AI agent completed successfully')
  } catch (error: any) {
    console.error('[Comparables Selection] ===== AI AGENT ERROR =====')
    console.error('[Comparables Selection] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      uprn
    })
    console.error('[Comparables Selection] ===== END AI ERROR =====\n')
    throw error
  }
  
  console.log('[Comparables Selection] Parsing AI output...')
  let modelOutput
  try {
    modelOutput = ComparablesSelectionOutputSchema.parse(result.finalOutput)
    console.log('[Comparables Selection] AI output parsed successfully:', {
      comparables_count: modelOutput.comparables.length,
      comparables: modelOutput.comparables.map(c => ({
        id: c.street_group_property_id,
        score: c.similarity_score
      }))
    })
  } catch (parseError: any) {
    console.error('[Comparables Selection] ===== OUTPUT PARSING ERROR =====')
    console.error('[Comparables Selection] Parse error:', {
      message: parseError.message,
      issues: parseError.issues,
      raw_output: JSON.stringify(result.finalOutput, null, 2)
    })
    console.error('[Comparables Selection] ===== END PARSE ERROR =====\n')
    throw parseError
  }

  // Log token usage
  const usage = result.state._context.usage
  console.log('[Comparables AI Agent] Usage:', JSON.stringify(usage, null, 2))

  // Clear request context
  requestContext = null

  // Validate that we have comparables
  if (!modelOutput.comparables || modelOutput.comparables.length === 0) {
    console.log('[Comparables AI Agent] No comparables returned')
    return NextResponse.json(
      {
        success: false,
        error: 'No comparables found with >=80% similarity'
      },
      { status: 200 }
    )
  }

  // Filter to only comparables with >=80% similarity and limit to FINAL_COMPARABLES_COUNT
  const finalComparables = modelOutput.comparables
    .filter(c => c.similarity_score >= MIN_SIMILARITY_SCORE)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, FINAL_COMPARABLES_COUNT)

  console.log(`[Comparables Selection] ===== FINAL RESULTS =====`)
  console.log(`[Comparables Selection] Total buckets available: ${bucketsWithImages.length}`)
  console.log(`[Comparables Selection] AI returned ${modelOutput.comparables.length} comparables`)
  console.log(`[Comparables Selection] After filtering (>=${MIN_SIMILARITY_SCORE}%): ${finalComparables.length} comparables`)
  finalComparables.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.street_group_property_id} - ${c.similarity_score}% similarity`)
  })
  console.log(`[Comparables Selection] ===== END RESULTS =====\n`)

  if (finalComparables.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No comparables found with similarity >=${MIN_SIMILARITY_SCORE}%`
      },
      { status: 200 }
    )
  }

  // Determine which buckets were used based on the comparables returned
  const bucketsUsed: string[] = []
  for (const bucket of bucketsWithImages) {
    const bucketComparables = bucket.comparables.map(c => c.street_group_property_id)
    const hasMatch = finalComparables.some(c => bucketComparables.includes(c.street_group_property_id))
    if (hasMatch && !bucketsUsed.includes(bucket.relaxationStrategy)) {
      bucketsUsed.push(bucket.relaxationStrategy)
    }
  }

  // Count total candidates that were potentially assessed (all comparables in used buckets)
  let totalCandidatesSentToAI = 0
  for (const bucket of bucketsWithImages) {
    if (bucketsUsed.includes(bucket.relaxationStrategy)) {
      totalCandidatesSentToAI += bucket.comparables.length
    }
  }

  console.log(`[Comparables Selection] Buckets used by agent: ${bucketsUsed.join(' → ')}`)
  console.log(`[Comparables Selection] Total candidates in used buckets: ${totalCandidatesSentToAI}`)

  // Return the result
  return NextResponse.json({
    success: true,
    data: {
      comparables: finalComparables.map(c => c.street_group_property_id),
      similarity_scores: finalComparables.reduce((acc, c) => {
        acc[c.street_group_property_id] = c.similarity_score
        return acc
      }, {} as Record<string, number>),
      brief_notes: finalComparables.reduce((acc, c) => {
        acc[c.street_group_property_id] = c.brief_notes
        return acc
      }, {} as Record<string, string>),
      context: {
        total_candidates_considered: totalCandidatesConsidered,
        relaxation_strategy: bucketsUsed.join(', '),
        buckets_used: bucketsUsed,
        candidates_sent_to_ai: totalCandidatesSentToAI,
        target_comparables_count: FINAL_COMPARABLES_COUNT,
        size_tolerance_percent: SIZE_TOLERANCE_PERCENT,
        min_similarity_score: MIN_SIMILARITY_SCORE
      }
    }
  })
}

async function handleSSERequest(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        const body = await request.json()
        const { uprn, nearbyTransactions, targetProperty } = body
        const requestUprn = uprn

        if (!uprn) {
          send({ type: 'error', message: 'UPRN is required' })
          controller.close()
          return
        }

        if (!nearbyTransactions || !Array.isArray(nearbyTransactions)) {
          send({ type: 'error', message: 'nearbyTransactions array is required' })
          controller.close()
          return
        }

        if (!targetProperty) {
          send({ type: 'error', message: 'targetProperty is required' })
          controller.close()
          return
        }

        // Step 1: Creating buckets
        send({ 
          type: 'status', 
          status: `Analysing ${nearbyTransactions.length} transactions nearby`,
          progress: 10 
        })

        const targetPropertyData = targetProperty as TargetPropertyData
        const targetStreet = body.targetStreet || ''
        const transactions = nearbyTransactions as ComparableTransaction[]

        const { buckets, totalCandidatesConsidered } = createComparableBuckets(
          transactions,
          targetPropertyData,
          targetStreet
        )

        send({ 
          type: 'status', 
          status: `Created ${buckets.length} buckets with ${totalCandidatesConsidered} matching properties`,
          progress: 25 
        })

        if (buckets.length === 0 || totalCandidatesConsidered === 0) {
          console.error('[Comparables Selection SSE] ===== NO COMPARABLES FOUND =====')
          console.error('[Comparables Selection SSE] Failure details:', {
            buckets_created: buckets.length,
            total_candidates: totalCandidatesConsidered,
            transactions_provided: nearbyTransactions.length,
            target_property: {
              address: targetPropertyData.address,
              type: targetPropertyData.propertyType,
              beds: targetPropertyData.bedrooms,
              baths: targetPropertyData.bathrooms,
              sqm: targetPropertyData.internalArea
            }
          })
          console.error('[Comparables Selection SSE] ===== END ERROR LOG =====\n')
          
          send({ type: 'error', message: 'No suitable comparables found matching the criteria' })
          controller.close()
          return
        }

        // Step 2: Get target property street view URL
        const targetStreetViewUrl = targetPropertyData.location?.coordinates
          ? getStreetViewUrl(
              targetPropertyData.location.coordinates.latitude,
              targetPropertyData.location.coordinates.longitude
            )
          : null

        if (!targetStreetViewUrl) {
          send({ type: 'error', message: 'Target property location data not available for street view' })
          controller.close()
          return
        }

        // Step 3: Prepare buckets with street view URLs
        send({ 
          type: 'status', 
          status: 'Preparing property images for comparison',
          progress: 35 
        })

        const bucketsWithImages = buckets.map((bucket, index) => ({
          index,
          relaxationStrategy: bucket.relaxationStrategy,
          comparables: bucket.comparables
            .filter(t => t.location?.coordinates)
            .map(t => ({
              street_group_property_id: t.street_group_property_id,
              street_view_url: getStreetViewUrl(
                t.location!.coordinates.latitude,
                t.location!.coordinates.longitude
              ),
              address: t.address?.street_group_format?.address_lines || 'Address not available'
            }))
        })).filter(bucket => bucket.comparables.length > 0)

        if (bucketsWithImages.length === 0) {
          send({ type: 'error', message: 'No comparables with valid location data for street view' })
          controller.close()
          return
        }

        send({ 
          type: 'status', 
          status: `Identifying similarities from pictures`,
          progress: 50 
        })

        // Step 4: Initialize request context and call AI agent
        requestContext = {
          targetPropertyStreetView: targetStreetViewUrl,
          buckets: bucketsWithImages
        }

        send({ 
          type: 'status', 
          status: `Assessing ${bucketsWithImages.length} search strategies`,
          progress: 60 
        })

        const userMessage = user('Process buckets of comparables sequentially to find the 3 best matches with >=80% visual similarity. Start with bucket 0 (strictest criteria) and stop as soon as you have 3 matches.')
        
        if (targetStreetViewUrl) {
          userMessage.content = [
            { type: 'input_text' as const, text: 'Process buckets of comparables sequentially to find the 3 best matches with >=80% visual similarity. Start with bucket 0 (strictest criteria) and stop as soon as you have 3 matches.' },
            { type: 'input_image' as const, image: targetStreetViewUrl }
          ]
        }

        console.log('[Comparables Selection SSE] Calling AI agent...')
        let result
        try {
          result = await run(comparablesAgent, [userMessage])
          console.log('[Comparables Selection SSE] AI agent completed successfully')
        } catch (error: any) {
          console.error('[Comparables Selection SSE] ===== AI AGENT ERROR =====')
          console.error('[Comparables Selection SSE] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          })
          console.error('[Comparables Selection SSE] ===== END AI ERROR =====\n')
          throw error
        }
        
        let modelOutput
        try {
          modelOutput = ComparablesSelectionOutputSchema.parse(result.finalOutput)
          console.log('[Comparables Selection SSE] AI output parsed successfully')
        } catch (parseError: any) {
          console.error('[Comparables Selection SSE] ===== OUTPUT PARSING ERROR =====')
          console.error('[Comparables Selection SSE] Parse error:', {
            message: parseError.message,
            issues: parseError.issues,
            raw_output: JSON.stringify(result.finalOutput, null, 2)
          })
          console.error('[Comparables Selection SSE] ===== END PARSE ERROR =====\n')
          throw parseError
        }

        send({ 
          type: 'status', 
          status: 'Processing AI results',
          progress: 80 
        })

        requestContext = null

        if (!modelOutput.comparables || modelOutput.comparables.length === 0) {
          send({ type: 'error', message: 'No comparables found with >=80% similarity' })
          controller.close()
          return
        }

        const finalComparables = modelOutput.comparables
          .filter(c => c.similarity_score >= MIN_SIMILARITY_SCORE)
          .sort((a, b) => b.similarity_score - a.similarity_score)
          .slice(0, FINAL_COMPARABLES_COUNT)

        if (finalComparables.length === 0) {
          send({ type: 'error', message: `No comparables found with similarity >=${MIN_SIMILARITY_SCORE}%` })
          controller.close()
          return
        }

        const bucketsUsed: string[] = []
        for (const bucket of bucketsWithImages) {
          const bucketComparables = bucket.comparables.map(c => c.street_group_property_id)
          const hasMatch = finalComparables.some(c => bucketComparables.includes(c.street_group_property_id))
          if (hasMatch && !bucketsUsed.includes(bucket.relaxationStrategy)) {
            bucketsUsed.push(bucket.relaxationStrategy)
          }
        }

        let totalCandidatesSentToAI = 0
        for (const bucket of bucketsWithImages) {
          if (bucketsUsed.includes(bucket.relaxationStrategy)) {
            totalCandidatesSentToAI += bucket.comparables.length
          }
        }

        send({ 
          type: 'status', 
          status: 'Finalizing results',
          progress: 95 
        })

        // Send final result
        send({
          type: 'result',
          data: {
            comparables: finalComparables.map(c => c.street_group_property_id),
            similarity_scores: finalComparables.reduce((acc, c) => {
              acc[c.street_group_property_id] = c.similarity_score
              return acc
            }, {} as Record<string, number>),
            brief_notes: finalComparables.reduce((acc, c) => {
              acc[c.street_group_property_id] = c.brief_notes
              return acc
            }, {} as Record<string, string>),
            context: {
              total_candidates_considered: totalCandidatesConsidered,
              relaxation_strategy: bucketsUsed.join(', '),
              buckets_used: bucketsUsed,
              candidates_sent_to_ai: totalCandidatesSentToAI,
              target_comparables_count: FINAL_COMPARABLES_COUNT,
              size_tolerance_percent: SIZE_TOLERANCE_PERCENT,
              min_similarity_score: MIN_SIMILARITY_SCORE
            }
          }
        })

        send({ type: 'complete', progress: 100 })
        controller.close()
      } catch (error: any) {
        console.error('[Comparables AI Agent SSE] ===== TOP LEVEL ERROR =====')
        console.error('[Comparables AI Agent SSE] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          error_type: error.constructor.name,
          error_keys: Object.keys(error)
        })
        if (error.cause) {
          console.error('[Comparables AI Agent SSE] Error cause:', error.cause)
        }
        console.error('[Comparables AI Agent SSE] ===== END TOP LEVEL ERROR =====\n')
        
        send({ type: 'error', message: error.message || 'Failed to select comparables with AI' })
        requestContext = null
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

