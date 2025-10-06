import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validation schemas
const downloadRequestSchema = z.object({
  photoIds: z.array(z.string()),
  format: z.enum(['original', 'png', 'jpg']).optional().default('original'),
  quality: z.enum(['standard', 'high', 'ultra']).optional().default('standard')
})

// POST - Prepare download
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
    const { photoIds, format, quality } = downloadRequestSchema.parse(body)

    // Get generation
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (fetchError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Parse metadata
    const metadata = typeof generation.metadata === 'string'
      ? JSON.parse(generation.metadata)
      : generation.metadata || {}

    const images = metadata.images || []

    // Filter requested photos
    const requestedPhotos = images.filter((img: { id: string; url?: string; thumbnailUrl?: string }) => 
      photoIds.includes(img.id)
    )

    if (requestedPhotos.length === 0) {
      return NextResponse.json({ error: 'No valid photos found' }, { status: 404 })
    }

    // Prepare download URLs
    const downloads = requestedPhotos.map((photo: { id: string; url?: string; thumbnailUrl?: string }) => ({
      id: photo.id,
      url: photo.url || photo.thumbnailUrl,
      thumbnailUrl: photo.thumbnailUrl,
      filename: `lensia-${requestId}-${photo.id}.${format === 'original' ? 'png' : format}`
    }))

    // Track download event in metadata
    metadata.lastDownload = new Date().toISOString()
    const downloadHistory = metadata.downloadHistory || []
    downloadHistory.push({
      timestamp: new Date().toISOString(),
      photoIds,
      format,
      quality,
      count: downloads.length
    })
    metadata.downloadHistory = downloadHistory

    // Update metadata
    await supabase
      .from('generations')
      .update({ metadata })
      .eq('request_id', requestId)

    return NextResponse.json({
      success: true,
      downloads,
      count: downloads.length,
      format,
      quality
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Download POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Download statistics
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

    const downloadHistory = metadata.downloadHistory || []
    const totalDownloads = downloadHistory.reduce(
      (sum: number, dl: { count?: number }) => sum + (dl.count || 0), 
      0
    )

    return NextResponse.json({
      totalDownloads,
      lastDownload: metadata.lastDownload,
      downloadHistory
    })
  } catch (error) {
    console.error('Download GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
