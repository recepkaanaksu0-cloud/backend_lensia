import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schemas
const feedbackSchema = z.object({
  photoId: z.string().optional(),
  rating: z.number().min(1).max(5),
  quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  issues: z.array(z.string()).optional(),
  comment: z.string().optional()
})

type FeedbackData = z.infer<typeof feedbackSchema> & {
  id: string
  timestamp: string
}

// POST - Submit feedback
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
    const validatedFeedback = feedbackSchema.parse(body)

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

    // Add feedback to array
    const feedback = metadata.feedback || []
    const newFeedback: FeedbackData = {
      ...validatedFeedback,
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    feedback.push(newFeedback)

    // Calculate average rating
    const totalRating = feedback.reduce((sum: number, fb: FeedbackData) => sum + fb.rating, 0)
    const averageRating = totalRating / feedback.length

    // Update metadata
    metadata.feedback = feedback
    metadata.averageRating = averageRating
    metadata.lastModified = new Date().toISOString()

    // Update database
    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        metadata,
        quality_score: averageRating
      })
      .eq('request_id', requestId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
      averageRating,
      totalFeedback: feedback.length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Feedback POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve feedback summary
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

    const feedback: FeedbackData[] = metadata.feedback || []
    const averageRating = metadata.averageRating || 0

    return NextResponse.json({
      feedback,
      averageRating,
      totalFeedback: feedback.length,
      qualityScore: generation.quality_score
    })
  } catch (error) {
    console.error('Feedback GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
