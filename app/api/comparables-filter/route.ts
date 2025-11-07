import {NextRequest, NextResponse} from "next/server";

const SIZE_TOLERANCE_PERCENT = 10 // Size difference tolerance (configurable)
const TARGET_COMPARABLES_COUNT = 5 // Number of comparables to find per bucket (configurable)

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

interface ComparableBucket {
    relaxationStrategy: string
    comparables: ComparableTransaction[]
    maxDistance: number
    maxDays: number
}

function daysSince(dateString: string): number {
    const transactionDate = new Date(dateString + 'T00:00:00.000Z')
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - transactionDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function createBuckets(
    transactions: ComparableTransaction[],
    targetProperty: TargetPropertyData,
    targetStreet: string
): { buckets: ComparableBucket[], totalCandidatesConsidered: number } {

    let buckets: ComparableBucket[] = []

    const sizeMin = targetProperty.internalArea * (1 - SIZE_TOLERANCE_PERCENT / 100)
    const sizeMax = targetProperty.internalArea * (1 + SIZE_TOLERANCE_PERCENT / 100)

    let candidates = transactions.filter(t => {
        // Match beds, baths, property type exactly
        const bedsMatch = t.number_of_bedrooms === targetProperty.bedrooms
        const bathsMatch = t.number_of_bathrooms === targetProperty.bathrooms
        const typeMatch = t.property_type === targetProperty.propertyType
        const sizeMatch = t.internal_area_square_metres >= sizeMin && t.internal_area_square_metres <= sizeMax

        return bedsMatch && bathsMatch && typeMatch && sizeMatch;
    })

    const totalCandidatesConsidered = candidates.length

    const relaxationStrategies = [
        { maxDistance: 0, maxDays: 30, description: 'Same street, last 30 days' },
        { maxDistance: 0, maxDays: 90, description: 'Same street, last 3 months' },
        { maxDistance: 402, maxDays: 90, description: '1/4 mile, last 3 months' },
        { maxDistance: 805, maxDays: 180, description: '1/2 mile, last 6 months' },
        { maxDistance: 1609, maxDays: 365, description: '1 mile, last year' },
        { maxDistance: 3218, maxDays: 730, description: '2 miles, last 2 years' },
        { maxDistance: Infinity, maxDays: Infinity, description: 'Any distance, any date' }
    ]

    const usedPropertyIds = new Set<string>()

    for (const strategy of relaxationStrategies) {
        let filtered = candidates

        if (strategy.maxDistance === 0) {
            filtered = filtered.filter(t => {
                const transactionStreet = t.address?.simplified_format?.street || ''
                return transactionStreet === targetStreet
            })
        } else if (strategy.maxDistance !== Infinity) {
            filtered = filtered.filter(t =>
                t.distance_in_metres <= strategy.maxDistance
            )
        }

        if (strategy.maxDays !== Infinity) {
            filtered = filtered.filter(t =>
                daysSince(t.transaction_date) <= strategy.maxDays
            )
        }

        filtered = filtered.filter(t => !usedPropertyIds.has(t.street_group_property_id))

        filtered.sort((a, b) => {
            const aSameStreet = (a.address?.simplified_format?.street || '') ===
                targetStreet ? 1 : 0
            const bSameStreet = (b.address?.simplified_format?.street || '') ===
                targetStreet ? 1 : 0

            if (aSameStreet !== bSameStreet) {
                return bSameStreet - aSameStreet
            }

            if (a.distance_in_metres !== b.distance_in_metres) {
                return a.distance_in_metres - b.distance_in_metres
            }

            return daysSince(a.transaction_date) - daysSince(b.transaction_date)
        })

        if (filtered.length > 0) {
            const bucketComparables = filtered.slice(0, TARGET_COMPARABLES_COUNT)

            bucketComparables.forEach(t => usedPropertyIds.add(t.street_group_property_id))

            buckets.push({
                relaxationStrategy: strategy.description,
                comparables: bucketComparables,
                maxDistance: strategy.maxDistance,
                maxDays: strategy.maxDays
            })
        }
    }

    return { buckets, totalCandidatesConsidered }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { uprn, nearbyTransactions, targetProperty, targetStreet } = body

        if (!uprn) {
            return NextResponse.json(
                { success: false, error: 'UPRN is required' },
                { status: 400 }
            )
        }

        if (!nearbyTransactions || !Array.isArray(nearbyTransactions)) {
            return NextResponse.json(
                { success: false, error: 'nearbyTransactions array is required' },
                { status: 400 }
            )
        }

        if (!targetProperty) {
            return NextResponse.json(
                { success: false, error: 'targetProperty is required' },
                { status: 400 }
            )
        }

        const targetPropertyData = targetProperty as TargetPropertyData
        const street = targetStreet || ''
        const transactions = nearbyTransactions as ComparableTransaction[]

        const { buckets, totalCandidatesConsidered } = createBuckets(
            transactions,
            targetPropertyData,
            street
        )

        return NextResponse.json({
            success: true,
            data: {
                buckets,
                totalCandidatesConsidered
            }
        })

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to filter comparables'
            },
            { status: 500 }
        )
    }
}