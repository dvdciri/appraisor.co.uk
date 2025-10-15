import { NextRequest, NextResponse } from 'next/server'
import { Agent, run, tool, user } from '@openai/agents'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Define schemas
// Model output (no pricing fields)
const EstimationModelOutputSchema = z.object({
  items: z.array(z.object({
    category: z.string(),
    item_name: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    notes: z.string()
  })),
  summary: z.string(),
  error: z.string().optional().default('')
})

// Final API output (adds pricing fields for all levels)
const EstimationOutputSchema = z.object({
  items: z.array(z.object({
    category: z.string(),
    item_name: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unit_cost_basic: z.number(),
    total_cost_basic: z.number(),
    unit_cost_standard: z.number(),
    total_cost_standard: z.number(),
    unit_cost_premium: z.number(),
    total_cost_premium: z.number(),
    notes: z.string()
  })),
  total_cost_basic: z.number(),
  total_cost_standard: z.number(),
  total_cost_premium: z.number(),
  summary: z.string(),
  error: z.string()
})

// In-memory cache for costs
let __cachedCosts: any | null = null

function loadCosts(): any {
  if (__cachedCosts) return __cachedCosts
  const filePath = path.join(process.cwd(), 'lib', 'refurbishment-costs.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  __cachedCosts = JSON.parse(fileContent)
  return __cachedCosts
}

type RefurbLevel = 'basic' | 'standard' | 'premium'

// Tool to get minimal refurbishment catalog (no prices)
const getRefurbishmentCatalog = tool({
  name: 'get_refurbishment_catalog',
  description: 'Returns the allowed refurbishment item catalog',
  parameters: z.object({}),
  execute: async () => {
    const costs = loadCosts()
    // Flatten into minimal catalog to guide item selection
    const catalog = (costs.items || []).flatMap((cat: any) => {
      const category = cat.category
      return (cat.items || []).map((it: any) => ({
        category,
        name: it.name,
        unit: it.unit,
        description: it.description
      }))
    })
    return { catalog }
  },
})

function buildUnitCostMap(level: RefurbLevel): Record<string, number> {
  const costs = loadCosts()
  const key = level === 'basic' ? 'cost_basic' : level === 'standard' ? 'cost_standard' : 'cost_premium'
  const map: Record<string, number> = {}
  for (const cat of costs.items || []) {
    for (const it of cat.items || []) {
      const v = it[key]
      if (typeof v === 'number') {
        map[it.name] = v
      }
    }
  }
  return map
}

// Define the refurbishment agent with tightened policy (no pricing in model output)
const refurbishmentAgent = new Agent({
  name: 'Refurbishment Cost Estimator',
  instructions: `You are a property refurbishment expert estimating scope from property images
Rules:
- Only include items that require work based on images and property condition; omit items in good standard.
- Respect include_items (must add even if unseen) and exclude_items (must omit even if visible)
- User input overrides image analysis
- Use get_refurbishment_catalog for allowed items; select item_name exactly as listed
- Use property_details to guide estimates
- Keep summary <= 300 characters
- No contingencies or prices in output`,
  outputType: EstimationModelOutputSchema,
  tools: [getRefurbishmentCatalog],
  model: 'gpt-5-2025-08-07',
})

export async function POST(request: NextRequest) {
  try {
    const { images, itemsToInclude, itemsToExclude, propertyDetails } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    // Prepare the user message as compact JSON
    const payload: any = {
      include_items: itemsToInclude && itemsToInclude.length > 0 ? itemsToInclude.join(', ') : undefined,
      exclude_items: itemsToExclude && itemsToExclude.length > 0 ? itemsToExclude.join(', ') : undefined,
      property_details: propertyDetails || undefined
    }
    const payloadString = JSON.stringify(payload)
    console.log("Payload:", payload);

    const userMessage = user(payloadString)

    // Add images to the message content
    const imageItems = images.map((imageUrl: string) => ({
      type: 'input_image' as const,
      image: imageUrl,
    }))

    // Combine text and images in the message
    userMessage.content = [
      { type: 'input_text' as const, text: payloadString },
      ...imageItems
    ]

    // Run the agent
    const result = await run(refurbishmentAgent, [userMessage])

    // Model-only output (no pricing)
    const modelOutput = EstimationModelOutputSchema.parse(result.finalOutput)

    // Server-side pricing for all levels
    const basicCostMap = buildUnitCostMap('basic')
    const standardCostMap = buildUnitCostMap('standard')
    const premiumCostMap = buildUnitCostMap('premium')

    const pricedItems = modelOutput.items.map(it => {
      const unitCostBasic = basicCostMap[it.item_name] ?? 0
      const totalCostBasic = unitCostBasic * it.quantity
      const unitCostStandard = standardCostMap[it.item_name] ?? 0
      const totalCostStandard = unitCostStandard * it.quantity
      const unitCostPremium = premiumCostMap[it.item_name] ?? 0
      const totalCostPremium = unitCostPremium * it.quantity
      
      const noteSuffix = (unitCostBasic === 0 && unitCostStandard === 0 && unitCostPremium === 0) ? 
        (it.notes ? ' | price unavailable' : 'price unavailable') : ''
      
      return {
        category: it.category,
        item_name: it.item_name,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unit_cost_basic: unitCostBasic,
        total_cost_basic: totalCostBasic,
        unit_cost_standard: unitCostStandard,
        total_cost_standard: totalCostStandard,
        unit_cost_premium: unitCostPremium,
        total_cost_premium: totalCostPremium,
        notes: noteSuffix ? `${it.notes}${it.notes ? '' : ''}${noteSuffix}` : it.notes
      }
    })

    const totalCostBasic = pricedItems.reduce((sum, it) => sum + it.total_cost_basic, 0)
    const totalCostStandard = pricedItems.reduce((sum, it) => sum + it.total_cost_standard, 0)
    const totalCostPremium = pricedItems.reduce((sum, it) => sum + it.total_cost_premium, 0)

    const parsedResult = EstimationOutputSchema.parse({
      items: pricedItems,
      total_cost_basic: totalCostBasic,
      total_cost_standard: totalCostStandard,
      total_cost_premium: totalCostPremium,
      summary: modelOutput.summary,
      error: modelOutput.error || ''
    })

    if (!parsedResult) {
      throw new Error('No output from agent')
    }

    // Log token usage
    const usage = result.state._context.usage
    console.log('[Refurbishment Agent] Usage:', usage)

    // Return the result
    return NextResponse.json({
      success: true,
      data: parsedResult
    })

  } catch (error: any) {
    console.error('Error in refurbishment estimation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to estimate refurbishment costs'
      },
      { status: 500 }
    )
  }
}
