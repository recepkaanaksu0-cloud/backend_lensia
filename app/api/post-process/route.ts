/**
 * Post-Process API Endpoint
 * POST /api/post-process - Fotoğraf post-processing işlemi başlat
 * GET /api/post-process - İşlem durumunu sorgula
 */

import { NextRequest, NextResponse } from 'next/server'
import { startPostProcess, checkComfyUIStatus, getRefinement, getPhotoRefinements } from '@/lib/post-process/processor'
import { PostProcessType, PROCESS_DESCRIPTIONS } from '@/lib/post-process/types'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photoId, processType, params = {} } = body

    console.log('📥 [POST /api/post-process] Request:', { photoId, processType, params })

    if (!photoId || typeof photoId !== 'string') {
      return NextResponse.json({ success: false, error: 'photoId gerekli' }, { status: 400 })
    }

    if (!processType || typeof processType !== 'string') {
      return NextResponse.json({ success: false, error: 'processType gerekli' }, { status: 400 })
    }

    const validProcessTypes = Object.keys(PROCESS_DESCRIPTIONS) as PostProcessType[]
    if (!validProcessTypes.includes(processType as PostProcessType)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz processType', availableTypes: validProcessTypes.length },
        { status: 400 }
      )
    }

    const photo = await prisma.generatedPhoto.findUnique({ where: { id: photoId } })
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Fotoğraf bulunamadı' }, { status: 404 })
    }

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

    const result = await startPostProcess({
      photoId,
      processType: processType as PostProcessType,
      ...params
    })

    console.log('✅ [POST /api/post-process] Result:', { 
      success: result.success, 
      refinementId: result.refinementId,
      outputImageUrl: result.outputImageUrl 
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        refinementId: result.refinementId,
        outputImageUrl: result.outputImageUrl,
        processInfo: PROCESS_DESCRIPTIONS[processType as PostProcessType]
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Post-process API hatası:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')
    const refinementId = searchParams.get('refinementId')

    if (refinementId) {
      const refinement = await getRefinement(refinementId)
      if (!refinement) {
        return NextResponse.json({ success: false, error: 'Refinement bulunamadı' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        refinement,
        processInfo: PROCESS_DESCRIPTIONS[refinement.refinementType as PostProcessType]
      })
    }

    if (photoId) {
      const refinements = await getPhotoRefinements(photoId)
      return NextResponse.json({ success: true, refinements, count: refinements.length })
    }

    return NextResponse.json(
      { success: false, error: 'photoId veya refinementId gerekli' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Post-process GET hatası:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    )
  }
}
