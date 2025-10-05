import { NextResponse } from 'next/server'

/**
 * Ping Endpoint - Basit canlılık kontrolü
 * Lensia.ai bu endpoint'i kullanarak sistemin çalıştığını hızlıca kontrol edebilir
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
      service: 'comfyui-dashboard',
      version: '1.0.0'
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  )
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
