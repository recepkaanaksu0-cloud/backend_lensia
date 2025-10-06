import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyCorsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const response = NextResponse.json(jobs)
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('İşleri getirirken hata:', error)
    const response = NextResponse.json(
      { error: 'İşler getirilirken bir hata oluştu' },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Lensia.ai'den gelen istek mi kontrol et
    const apiKey = request.headers.get('x-api-key')
    const isLensiaRequest = apiKey === process.env.LENSIA_API_KEY
    
    const job = await prisma.job.create({
      data: {
        prompt: body.prompt,
        negativePrompt: body.negativePrompt || body.negative_prompt || null,
        inputImageUrl: body.inputImageUrl || body.input_image_url,
        paramsJson: JSON.stringify(body.params || {}),
        lensiaJobId: body.lensia_job_id || body.job_id || null,
        webhookUrl: body.webhook_url || null
      }
    })
    
    console.log(`✅ Yeni iş oluşturuldu: ${job.id}${isLensiaRequest ? ' (Lensia.ai)' : ''}`)
    
    const response = NextResponse.json(job, { status: 201 })
    return applyCorsHeaders(request, response)
  } catch (error) {
    console.error('İş oluşturulurken hata:', error)
    const response = NextResponse.json(
      { error: 'İş oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
    return applyCorsHeaders(request, response)
  }
}
