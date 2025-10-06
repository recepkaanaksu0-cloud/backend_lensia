import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Query generation from database
    const { data: generation, error } = await supabase
      .from('generations')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Parse metadata
    const metadata = typeof generation.metadata === 'string' 
      ? JSON.parse(generation.metadata) 
      : generation.metadata

    // Calculate progress
    const progress = generation.status === 'completed' ? 100 
      : generation.status === 'processing' ? (metadata?.progress || 50)
      : 0

    // Build response
    const response = {
      requestId: generation.request_id,
      status: generation.status,
      processingStatus: generation.processing_status || '',
      progress,
      currentStep: metadata?.currentStep || '',
      images: metadata?.images || [],
      completedAt: generation.completed_at,
      errorMessage: generation.error_message,
      metadata
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'max-age=5, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Status endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
