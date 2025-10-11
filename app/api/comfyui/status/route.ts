/**
 * ComfyUI Status API
 * GET /api/comfyui/status
 * ComfyUI sunucusunun durumunu kontrol eder
 */

import { NextResponse } from 'next/server'
import { checkComfyUIStatus } from '@/lib/post-process/processor'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = await checkComfyUIStatus()
    
    return NextResponse.json({
      success: true,
      comfyui: status
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        comfyui: {
          online: false
        }
      },
      { status: 500 }
    )
  }
}
