import axios from 'axios'

const LENSIA_WEBHOOK_URL = process.env.LENSIA_WEBHOOK_URL || 'https://www.lensia.ai/api/jobs/webhook'
const LENSIA_API_KEY = process.env.LENSIA_API_KEY || ''

export interface WebhookPayload {
  jobId: string
  lensiaJobId?: string
  status: 'completed' | 'error'
  outputImageUrl?: string
  errorMessage?: string
}

/**
 * Lensia.ai'ye sonucu gönderir
 */
export async function sendWebhookToLensia(payload: WebhookPayload): Promise<boolean> {
  try {
    console.log('📤 Webhook gönderiliyor:', payload)
    
    const response = await axios.post(
      LENSIA_WEBHOOK_URL,
      {
        job_id: payload.lensiaJobId || payload.jobId,
        status: payload.status,
        output_image_url: payload.outputImageUrl,
        error_message: payload.errorMessage,
        processed_at: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': LENSIA_API_KEY,
          'User-Agent': 'ComfyUI-Dashboard/1.0'
        },
        timeout: 30000
      }
    )
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Webhook başarıyla gönderildi')
      return true
    }
    
    console.error('❌ Webhook gönderimi başarısız:', response.status)
    return false
    
  } catch (error) {
    console.error('❌ Webhook hatası:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Alternatif webhook URL'ine gönderim
 */
export async function sendCustomWebhook(url: string, payload: unknown): Promise<boolean> {
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LENSIA_API_KEY
      },
      timeout: 30000
    })
    
    return response.status === 200 || response.status === 201
  } catch (error) {
    console.error('Custom webhook hatası:', error)
    return false
  }
}
