import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyCorsHeaders } from '@/lib/cors'

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
        workflows: {
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

    // Calculate overall progress
    const totalSteps = generation.workflows.length
    const completedSteps = generation.workflows.filter(w => w.status === 'completed').length
    const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    // Build response matching frontend expectations
    const responseData = {
      generationId: generation.id,
      status: generation.status,
      progress: overallProgress
    }

    const response = NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'max-age=2, must-revalidate'
      }
    })
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('Status endpoint error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}
