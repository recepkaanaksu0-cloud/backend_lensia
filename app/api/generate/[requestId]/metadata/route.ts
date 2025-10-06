import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schema
const metadataUpdateSchema = z.object({
  metadata: z.record(z.any())
})

// GET - Retrieve metadata
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

    return NextResponse.json({
      requestId: generation.request_id,
      metadata,
      created: generation.created_at,
      updated: metadata.lastModified || generation.created_at,
      status: generation.status
    })
  } catch (error) {
    console.error('Metadata GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update metadata
export async function PATCH(
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
    const { metadata: updates } = metadataUpdateSchema.parse(body)

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
    const existingMetadata = typeof generation.metadata === 'string'
      ? JSON.parse(generation.metadata)
      : generation.metadata || {}

    // Merge updates
    const updatedMetadata = {
      ...existingMetadata,
      ...updates,
      lastModified: new Date().toISOString()
    }

    // Update database
    const { error: updateError } = await supabase
      .from('generations')
      .update({ metadata: updatedMetadata })
      .eq('request_id', requestId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      metadata: updatedMetadata,
      updated: updatedMetadata.lastModified
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Metadata PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
