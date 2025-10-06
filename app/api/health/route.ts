import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkComfyUIStatus } from '@/lib/comfyui'
import { applyCorsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request)
}

/**
 * Health Check & Telemetry Endpoint
 * Lensia.ai bu endpoint'i kullanarak sistemin durumunu kontrol edebilir
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Veritabanı durumu
    const dbHealthy = await checkDatabaseHealth()
    
    // 2. ComfyUI durumu
    const comfyUIHealthy = await checkComfyUIStatus()
    
    // 3. İş istatistikleri
    const stats = await getJobStats()
    
    // 4. Sistem bilgileri
    const systemInfo = getSystemInfo()
    
    const responseTime = Date.now() - startTime
    
    const overallStatus = dbHealthy && comfyUIHealthy ? 'healthy' : 'degraded'

    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '1.0.0',
      services: {
        database: {
          status: dbHealthy ? 'up' : 'down',
          type: 'sqlite'
        },
        comfyui: {
          status: comfyUIHealthy ? 'up' : 'down',
          url: process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'
        },
        webhook: {
          status: 'up',
          target: process.env.LENSIA_WEBHOOK_URL || 'not configured'
        }
      },
      statistics: stats,
      system: systemInfo,
      warnings:
        overallStatus === 'healthy'
          ? []
          : [
              !dbHealthy ? 'Veritabanı bağlantısı başarısız.' : null,
              !comfyUIHealthy ? 'ComfyUI servisine ulaşılamıyor.' : null,
            ].filter(Boolean)
    }
    
    const response = NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    })
    return applyCorsHeaders(request, response)
    
  } catch (error) {
    console.error('Health check hatası:', error)
    
    const response = NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`
      },
      { status: 503 }
    )
    return applyCorsHeaders(request, response)
  }
}

/**
 * Ping endpoint - Basit canlılık kontrolü
 */
export async function HEAD(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return applyCorsHeaders(request, response)
}

/**
 * Veritabanı sağlık kontrolü
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * İş istatistiklerini al
 */
async function getJobStats() {
  try {
    const [total, pending, processing, completed, error] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'pending' } }),
      prisma.job.count({ where: { status: 'processing' } }),
      prisma.job.count({ where: { status: { in: ['completed', 'sent'] } } }),
      prisma.job.count({ where: { status: 'error' } })
    ])
    
    // Son 24 saatteki işler
    const last24h = await prisma.job.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    
    // Ortalama işlem süresi (tamamlanan işler için)
    const completedJobs = await prisma.job.findMany({
      where: { status: { in: ['completed', 'sent'] } },
      select: { createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 100
    })
    
    let avgProcessingTime = 0
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum: number, job: { createdAt: Date; updatedAt: Date }) => {
        return sum + (new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime())
      }, 0)
      avgProcessingTime = Math.round(totalTime / completedJobs.length / 1000) // saniye cinsinden
    }
    
    return {
      total,
      pending,
      processing,
      completed,
      failed: error,
      last24Hours: last24h,
      averageProcessingTime: `${avgProcessingTime}s`,
      queueHealth: pending < 10 ? 'good' : pending < 50 ? 'moderate' : 'high'
    }
  } catch (error) {
    console.error('Job stats error:', error)
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      last24Hours: 0,
      averageProcessingTime: '0s',
      queueHealth: 'unknown'
    }
  }
}

/**
 * Sistem bilgilerini al
 */
function getSystemInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: `${Math.floor(process.uptime())}s`,
    memoryUsage: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  }
}
