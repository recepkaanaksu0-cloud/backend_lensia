import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Telemetry Endpoint - Detaylı sistem metrikleri
 * Lensia.ai bu endpoint'i kullanarak detaylı istatistikler ve metrikler alabilir
 */
export async function GET(request: Request) {
  try {
    // API key kontrolü
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.LENSIA_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const metrics = await collectMetrics()
    
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('Telemetry error:', error)
    return NextResponse.json(
      { error: 'Failed to collect telemetry' },
      { status: 500 }
    )
  }
}

/**
 * POST - Lensia.ai'den telemetri verisi alımı (opsiyonel)
 * Lensia.ai kendi metriklerini bu endpoint'e gönderebilir
 */
export async function POST(request: Request) {
  try {
    // API key kontrolü
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.LENSIA_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Lensia.ai'den gelen telemetri verisini logla
    console.log('📊 Lensia.ai Telemetry:', {
      timestamp: new Date().toISOString(),
      data: body
    })
    
    // İsteğe bağlı: Veritabanına kaydet veya başka bir işlem yap
    
    return NextResponse.json({
      status: 'received',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Telemetry POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process telemetry' },
      { status: 500 }
    )
  }
}

/**
 * Detaylı metrikleri topla
 */
async function collectMetrics() {
  const now = new Date()
  const last1h = new Date(now.getTime() - 60 * 60 * 1000)
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // İş durumları
  const [
    totalJobs,
    pendingJobs,
    processingJobs,
    completedJobs,
    errorJobs,
    sentJobs,
    jobsLast1h,
    jobsLast24h,
    jobsLast7d
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: 'pending' } }),
    prisma.job.count({ where: { status: 'processing' } }),
    prisma.job.count({ where: { status: 'completed' } }),
    prisma.job.count({ where: { status: 'error' } }),
    prisma.job.count({ where: { status: 'sent' } }),
    prisma.job.count({ where: { createdAt: { gte: last1h } } }),
    prisma.job.count({ where: { createdAt: { gte: last24h } } }),
    prisma.job.count({ where: { createdAt: { gte: last7d } } })
  ])
  
  // Webhook istatistikleri
  const [webhooksSent, webhooksFailed] = await Promise.all([
    prisma.job.count({ where: { webhookSent: true } }),
    prisma.job.count({
      where: {
        status: { in: ['completed', 'error'] },
        webhookSent: false,
        lensiaJobId: { not: null }
      }
    })
  ])
  
  // En son işler
  const recentJobs = await prisma.job.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      lensiaJobId: true,
      createdAt: true,
      updatedAt: true,
      webhookSent: true
    }
  })
  
  // Ortalama işlem süresi
  const completedJobsWithTime = await prisma.job.findMany({
    where: {
      status: { in: ['completed', 'sent'] },
      updatedAt: { gte: last24h }
    },
    select: { createdAt: true, updatedAt: true }
  })
  
  let avgProcessingTime = 0
  if (completedJobsWithTime.length > 0) {
    const totalTime = completedJobsWithTime.reduce((sum: number, job: { createdAt: Date; updatedAt: Date }) => {
      return sum + (new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime())
    }, 0)
    avgProcessingTime = Math.round(totalTime / completedJobsWithTime.length)
  }
  
  return {
    timestamp: now.toISOString(),
    service: {
      name: 'comfyui-dashboard',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime())
    },
    jobs: {
      total: totalJobs,
      byStatus: {
        pending: pendingJobs,
        processing: processingJobs,
        completed: completedJobs,
        sent: sentJobs,
        error: errorJobs
      },
      timeline: {
        lastHour: jobsLast1h,
        last24Hours: jobsLast24h,
        last7Days: jobsLast7d
      },
      performance: {
        averageProcessingTime: avgProcessingTime,
        averageProcessingTimeFormatted: formatDuration(avgProcessingTime),
        successRate: totalJobs > 0 
          ? `${Math.round(((completedJobs + sentJobs) / totalJobs) * 100)}%`
          : '0%'
      }
    },
    webhooks: {
      sent: webhooksSent,
      failed: webhooksFailed,
      successRate: (webhooksSent + webhooksFailed) > 0
        ? `${Math.round((webhooksSent / (webhooksSent + webhooksFailed)) * 100)}%`
        : '0%'
    },
    queue: {
      size: pendingJobs,
      health: pendingJobs < 10 ? 'healthy' : pendingJobs < 50 ? 'warning' : 'critical',
      processing: processingJobs
    },
    recentJobs: recentJobs.map((job) => ({
      id: job.id,
      lensiaJobId: job.lensiaJobId,
      status: job.status,
      createdAt: job.createdAt,
      processingTime: job.updatedAt.getTime() - job.createdAt.getTime(),
      webhookSent: job.webhookSent
    })),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage()
      }
    }
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60000)}m`
}
