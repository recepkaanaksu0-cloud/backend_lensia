import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Middleware - Global CORS ve Security Headers
 * Bu middleware tüm API route'larında otomatik çalışır
 */

const ALLOWED_ORIGINS = [
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

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  
  // Development mode: localhost ve 127.0.0.1 için tüm portları kabul et
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)
  
  // Preflight request (OPTIONS) kontrolü
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    
    // CORS headers
    if (isAllowedOrigin || isLocalhost) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', '*')
    } else {
      response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0])
    }
    
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin'
    )
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 saat
    
    return response
  }
  
  // Normal request için devam et
  const response = NextResponse.next()
  
  // CORS headers ekle
  if (isAllowedOrigin || isLocalhost) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else {
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0])
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

// Middleware'in hangi path'lerde çalışacağını belirt
export const config = {
  matcher: [
    '/api/:path*', // Tüm API route'ları
  ],
}
