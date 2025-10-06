import { NextRequest, NextResponse } from 'next/server'
import { applyCorsHeaders, handleCorsOptions } from '@/lib/cors'

/**
 * Ping Endpoint - Basit canlılık kontrolü
 * Lensia.ai bu endpoint'i kullanarak sistemin çalıştığını hızlıca kontrol edebilir
 */

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    service: 'comfyui-dashboard',
    version: '1.0.0'
  })
  return applyCorsHeaders(request, response)
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
