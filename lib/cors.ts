import { NextRequest, NextResponse } from 'next/server'

/**
 * İzin verilen origin listesi
 * Production ve development ortamları için
 */
export const ALLOWED_ORIGINS = [
  'https://www.lensia.ai',
  'https://lensia.ai',
  'https://api.lensia.ai',
  'https://localhost:3000',
  'http://localhost:3000',
  'https://localhost:3001',
  'http://localhost:3001',
  'http://localhost:51511',
  'https://localhost:51511',
]

/**
 * CORS headers'ı response'a ekler
 * @param request - NextRequest objesi
 * @param response - NextResponse objesi
 * @returns CORS headers eklenmiş NextResponse
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = request.headers.get('origin') ?? ''

  // Development mode: localhost ve 127.0.0.1 için tüm portları kabul et
  const isLocalhost =
    origin.includes('localhost') || origin.includes('127.0.0.1')
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)

  let allowedOrigin: string

  if (isAllowedOrigin || isLocalhost) {
    // Origin izin listesinde veya localhost
    allowedOrigin = origin
  } else if (process.env.NODE_ENV === 'development') {
    // Development modda tüm originlere izin ver
    allowedOrigin = '*'
  } else {
    // Production modda varsayılan origin
    allowedOrigin = ALLOWED_ORIGINS[0]
  }

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 saat cache

  return response
}

/**
 * CORS preflight (OPTIONS) request handler
 * @param request - NextRequest objesi
 * @returns CORS headers ile 204 No Content response
 */
export async function handleCorsOptions(
  request: NextRequest
): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 204 })
  return applyCorsHeaders(request, response)
}

/**
 * CORS ile JSON response oluştur
 * @param data - Response data
 * @param status - HTTP status code
 * @param request - NextRequest objesi
 * @returns CORS headers eklenmiş JSON response
 */
export function corsJsonResponse(
  data: unknown,
  status: number,
  request: NextRequest
): NextResponse {
  const response = NextResponse.json(data, { status })
  return applyCorsHeaders(request, response)
}
