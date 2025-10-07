import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyCorsHeaders } from '@/lib/cors'

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn('JSON parse warning:', error)
    return fallback
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  try {
    const { generationId } = await params

    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
      return applyCorsHeaders(request, response)
    }

    // Query generation from database
    const generation = await prisma.generationRequest.findUnique({
      where: { id: generationId },
      include: {
        generatedPhotos: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!generation) {
      const response = NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
      return applyCorsHeaders(request, response)
    }

    // Build response with photos
    const responseData = {
      generationId: generation.id,
      status: generation.status,
      photos: generation.generatedPhotos.map(photo => photo.photoUrl)
    }

    const response = NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'max-age=2, must-revalidate'
      }
    })
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('Photos endpoint error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}
