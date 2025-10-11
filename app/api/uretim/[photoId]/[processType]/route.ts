/**
 * RESTful Post-Process Endpoint (URL-based)
 * GET/POST /api/uretim/{photoId}/{processType}
 * 
 * Örnekler:
 * - POST /api/uretim/abc123/background-color { "backgroundColor": "#FFFFFF" }
 * - POST /api/uretim/abc123/rotate { "rotationAngle": 90 }
 * - POST /api/uretim/abc123/object-delete { "prompt": "remove person" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { startPostProcess, checkComfyUIStatus } from '@/lib/post-process/processor'
import { PostProcessType, PROCESS_DESCRIPTIONS } from '@/lib/post-process/types'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; processType: string }> }
) {
  try {
    const { photoId, processType } = await params
    const body = await request.json().catch(() => ({}))

    // Validasyon
    if (!photoId) {
      return NextResponse.json(
        { success: false, error: 'photoId gerekli' },
        { status: 400 }
      )
    }

    if (!processType || !(processType in PROCESS_DESCRIPTIONS)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Geçersiz processType: ${processType}`,
          availableTypes: Object.keys(PROCESS_DESCRIPTIONS)
        },
        { status: 400 }
      )
    }

    // Fotoğrafı kontrol et
    const photo = await prisma.generatedPhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Fotoğraf bulunamadı' },
        { status: 404 }
      )
    }

    // ComfyUI durumu
    const comfyStatus = await checkComfyUIStatus()
    if (!comfyStatus.online) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ComfyUI çevrimdışı',
          help: 'npm run comfyui komutunu çalıştırın'
        },
        { status: 503 }
      )
    }

    // İşlemi başlat
    const result = await startPostProcess({
      photoId,
      processType: processType as PostProcessType,
      ...body
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        refinementId: result.refinementId,
        outputImageUrl: result.outputImageUrl,
        processInfo: PROCESS_DESCRIPTIONS[processType as PostProcessType]
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('RESTful post-process error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; processType: string }> }
) {
  try {
    const { photoId, processType } = await params

    // İşlem bilgisini göster
    if (processType in PROCESS_DESCRIPTIONS) {
      const processInfo = PROCESS_DESCRIPTIONS[processType as PostProcessType]
      
      return NextResponse.json({
        success: true,
        photoId,
        processType,
        ...processInfo,
        endpoint: `/api/uretim/${photoId}/${processType}`,
        method: 'POST'
      })
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Geçersiz processType',
        availableTypes: Object.keys(PROCESS_DESCRIPTIONS)
      },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Hata oluştu' },
      { status: 500 }
    )
  }
}
