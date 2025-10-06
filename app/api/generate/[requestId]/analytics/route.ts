import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schemas
const analyticsEventSchema = z.object({
  eventType: z.enum(['view', 'click', 'select', 'reject', 'download', 'refine', 'edit']),
  photoId: z.string().optional(),
  action: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

type AnalyticsEvent = z.infer<typeof analyticsEventSchema> & {
  timestamp: string
  id: string
}

// POST - Track analytics event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedEvent = analyticsEventSchema.parse(body)

    // Get generation
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (fetchError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Parse existing metadata
    const metadata = typeof generation.metadata === 'string'
      ? JSON.parse(generation.metadata)
      : generation.metadata || {}

    // Add event to analytics array
    const analytics = metadata.analytics || []
    const newEvent: AnalyticsEvent = {
      ...validatedEvent,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    analytics.push(newEvent)

    // Update metadata
    metadata.analytics = analytics
    metadata.lastModified = new Date().toISOString()

    // Save to database (silent fail for non-critical analytics)
    const { error: updateError } = await supabase
      .from('generations')
      .update({ metadata })
      .eq('request_id', requestId)

    if (updateError) {
      console.error('Analytics update error:', updateError)
      // Don't fail the request for analytics
    }

    return NextResponse.json({
      success: true,
      event: newEvent,
      totalEvents: analytics.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Analytics POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve analytics summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    // Auth check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get generation
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Parse metadata
    const metadata = typeof generation.metadata === 'string'
      ? JSON.parse(generation.metadata)
      : generation.metadata || {}

    const analytics: AnalyticsEvent[] = metadata.analytics || []

    // Calculate statistics
    const byType: Record<string, number> = {}
    const byPhoto: Record<string, number> = {}

    analytics.forEach((event) => {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1
      if (event.photoId) {
        byPhoto[event.photoId] = (byPhoto[event.photoId] || 0) + 1
      }
    })

    return NextResponse.json({
      totalEvents: analytics.length,
      byType,
      byPhoto,
      events: analytics.slice(-50) // Last 50 events
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
