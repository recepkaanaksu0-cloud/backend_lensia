import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// SSE için özel response oluşturma
function createSSEResponse() {
  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        if (isClosed) return
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE send error:', error)
        }
      }

      // İlk event gönder
      sendEvent('connected', { message: 'SSE connection established' })

      return { sendEvent, close: () => { isClosed = true; controller.close() } }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const { generationId } = await params
  
  // Auth check - EventSource custom header desteklemediği için query parameter kullan
  const token = request.nextUrl.searchParams.get('token')
  const authHeader = request.headers.get('authorization')
  
  if (!token && !authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Token required' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
  
  // TODO: Token validation burada yapılabilir
  // if (!validateToken(token || authHeader)) { return 401 }

  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('SSE send error:', error)
        }
      }

      // İlk bağlantı mesajı
      sendEvent('connected', { 
        generationId,
        message: 'Connected to generation stream' 
      })

      // Daha önce gönderilen fotoğrafları takip et
      let sentPhotoIds = new Set<string>()

      // Generation durumunu kontrol et
      const checkProgress = async () => {
        try {
          const generation = await prisma.generationRequest.findUnique({
            where: { id: generationId },
            include: {
              workflows: {
                orderBy: { createdAt: 'asc' }
              },
              generatedPhotos: {
                orderBy: { createdAt: 'asc' }
              }
            }
          })

          if (!generation) {
            sendEvent('error', { 
              error: 'Generation not found',
              generationId 
            })
            if (intervalId) clearInterval(intervalId)
            controller.close()
            return
          }

          // Yeni fotoğrafları kontrol et ve gönder
          for (const photo of generation.generatedPhotos) {
            if (!sentPhotoIds.has(photo.id)) {
              // Her fotoğraf hazır olduğunda photo_generated eventi gönder
              sendEvent('photo_generated', {
                url: photo.photoUrl,
                thumbnailUrl: photo.thumbnailUrl || photo.photoUrl,
                model: photo.aiModel,
                prompt: photo.prompt,
                metadata: JSON.parse(photo.metadata || '{}')
              })
              sentPhotoIds.add(photo.id)
            }
          }

          // Progress hesapla
          const totalSteps = generation.workflows.length
          const completedSteps = generation.workflows.filter(w => w.status === 'completed').length
          const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

          // Current workflow
          const currentWorkflow = generation.workflows.find(w => w.status === 'processing') 
            || generation.workflows.find(w => w.status === 'pending')
            || generation.workflows[generation.workflows.length - 1]

          // Progress event gönder
          sendEvent('progress', {
            generationId: generation.id,
            status: generation.status,
            progress: overallProgress,
            currentStep: generation.currentStep,
            currentStepName: currentWorkflow?.stepName || '',
            currentStepProgress: currentWorkflow?.progress || 0,
            photoCount: generation.generatedPhotos.length
          })

          // Eğer tamamlandıysa
          if (generation.status === 'completed') {
            // Tüm fotoğraflar hazır olduğunda completed eventi gönder
            sendEvent('completed', {
              photos: generation.generatedPhotos.map(photo => photo.photoUrl),
              status: 'completed'
            })
            
            // Bağlantıyı kapat
            if (intervalId) clearInterval(intervalId)
            controller.close()
          } else if (generation.status === 'error') {
            sendEvent('error', {
              generationId: generation.id,
              error: generation.errorMessage || 'Unknown error occurred',
              status: 'error'
            })
            
            if (intervalId) clearInterval(intervalId)
            controller.close()
          }
        } catch (error) {
          console.error('Progress check error:', error)
          sendEvent('error', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            generationId 
          })
          if (intervalId) clearInterval(intervalId)
          controller.close()
        }
      }

      // İlk kontrolü hemen yap
      await checkProgress()

      // Her 1 saniyede bir kontrol et
      intervalId = setInterval(checkProgress, 1000)

      // Cleanup when connection closes
      request.signal.addEventListener('abort', () => {
        if (intervalId) clearInterval(intervalId)
        controller.close()
      })
    },
    cancel() {
      if (intervalId) clearInterval(intervalId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
