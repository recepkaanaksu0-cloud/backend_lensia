import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test endpoint
export async function GET() {
  try {
    // Basit bir test
    const count = await prisma.generationRequest.count()
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
