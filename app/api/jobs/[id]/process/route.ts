import { NextResponse } from 'next/server'
import type { Job } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { processComfyUIJob } from '@/lib/comfyui'
import { sendWebhookToLensia, sendCustomWebhook } from '@/lib/webhook'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const jobId = params.id
  const body = await req.json()

  const result = await processComfyUIJob({
    inputImageUrl: body.inputImageUrl,
    operation: body.operation,
    filenamePrefix: body.filenamePrefix
  })

  if (result.success) {
    // veritabanına outputImageUrl güncelle
    await prisma.job.update({
      where: { id: jobId },
      data: {
        outputImageUrl: result.outputImageUrl,
        status: 'completed',
        updatedAt: new Date()
      }
    })
    return Response.json({ success: true, outputImageUrl: result.outputImageUrl })
  } else {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        updatedAt: new Date()
      }
    })
    return Response.json({ success: false, error: result.error }, { status: 400 })
  }
}

/**
 * İşi asenkron olarak işler ve sonucu Lensia.ai'ye gönderir
 */
async function processJobAsync(jobId: string, job: Job) {
  try {
    const params = JSON.parse(job.paramsJson)
    
    console.log(`🎨 ComfyUI işlemi başlatılıyor: ${jobId}`)
    
    const result = await processComfyUIJob({
      prompt: job.prompt,
      negativePrompt: job.negativePrompt || undefined,
      inputImageUrl: job.inputImageUrl,
      ...params
    })
    
    if (result.success) {
      // İşi tamamlandı olarak işaretle
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          outputImageUrl: result.outputImageUrl
        }
      })
      
      console.log(`✅ İş tamamlandı: ${jobId}`)
      
      // Lensia.ai'ye webhook gönder
      if (job.lensiaJobId || job.webhookUrl) {
        console.log(`📤 Webhook gönderiliyor...`)
        
        let webhookSuccess = false
        
        if (job.webhookUrl) {
          // Özel webhook URL varsa oraya gönder
          webhookSuccess = await sendCustomWebhook(job.webhookUrl, {
            job_id: job.lensiaJobId || jobId,
            status: 'completed',
            output_image_url: result.outputImageUrl,
            processed_at: new Date().toISOString()
          })
        } else {
          // Varsayılan Lensia webhook'una gönder
          webhookSuccess = await sendWebhookToLensia({
            jobId,
            lensiaJobId: job.lensiaJobId ?? undefined,
            status: 'completed',
            outputImageUrl: result.outputImageUrl
          })
        }
        
        // Webhook durumunu güncelle
        await prisma.job.update({
          where: { id: jobId },
          data: {
            webhookSent: webhookSuccess,
            webhookSentAt: webhookSuccess ? new Date() : null,
            status: webhookSuccess ? 'sent' : 'completed'
          }
        })
        
        if (webhookSuccess) {
          console.log(`✅ Webhook başarıyla gönderildi`)
        } else {
          console.error(`❌ Webhook gönderilemedi`)
        }
      }
      
    } else {
      // Hata durumu
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'error',
          errorMessage: result.error
        }
      })
      
      console.error(`❌ İş başarısız: ${jobId} - ${result.error}`)
      
      // Hata durumunda da webhook gönder
      if (job.lensiaJobId || job.webhookUrl) {
        if (job.webhookUrl) {
          await sendCustomWebhook(job.webhookUrl, {
            job_id: job.lensiaJobId || jobId,
            status: 'error',
            error_message: result.error,
            processed_at: new Date().toISOString()
          })
        } else {
          await sendWebhookToLensia({
            jobId,
            lensiaJobId: job.lensiaJobId ?? undefined,
            status: 'error',
            errorMessage: result.error
          })
        }
        
        await prisma.job.update({
          where: { id: jobId },
          data: { webhookSent: true, webhookSentAt: new Date() }
        })
      }
    }
    
  } catch (error) {
    console.error('ComfyUI işlem hatası:', error)
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    })
    
    // Hata durumunda webhook gönder
    if (job.lensiaJobId || job.webhookUrl) {
      if (job.webhookUrl) {
        await sendCustomWebhook(job.webhookUrl, {
          job_id: job.lensiaJobId || jobId,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
      } else {
        await sendWebhookToLensia({
          jobId,
          lensiaJobId: job.lensiaJobId ?? undefined,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
}
