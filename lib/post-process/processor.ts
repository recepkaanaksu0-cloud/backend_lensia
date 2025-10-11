/**
 * ComfyUI Post-Process API Client
 * Fotoğraf post-processing işlemlerini yönetir
 */

import axios from 'axios'
import { prisma } from '@/lib/prisma'
import { PostProcessType, WorkflowParams } from './types'
import { getWorkflowForProcessType } from './workflows'

const COMFYUI_API_URL = process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'

export interface PostProcessRequest {
  photoId: string
  processType: PostProcessType
  prompt?: string
  negativePrompt?: string
  additionalParams?: Record<string, any>
}

export interface PostProcessResult {
  success: boolean
  refinementId?: string
  outputImageUrl?: string
  error?: string
}

/**
 * Fotoğraf üzerinde post-process işlemi başlatır
 */
export async function startPostProcess(
  request: PostProcessRequest
): Promise<PostProcessResult> {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔧 [POST-PROCESS] İşlem başlatılıyor...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📥 Request:', JSON.stringify(request, null, 2))

    // 1. Fotoğrafı veritabanından al
    console.log(`\n🔍 [DB] Fotoğraf aranıyor: ${request.photoId}`)
    const photo = await prisma.generatedPhoto.findUnique({
      where: { id: request.photoId },
      include: { request: true }
    })

    if (!photo) {
      console.log('❌ [DB] Fotoğraf bulunamadı!')
      return {
        success: false,
        error: 'Fotoğraf bulunamadı'
      }
    }

    console.log('✅ [DB] Fotoğraf bulundu:', { 
      id: photo.id, 
      url: photo.photoUrl,
      prompt: photo.prompt.slice(0, 50) + '...'
    })

    // 2. Refinement kaydı oluştur
    console.log(`\n📝 [DB] Refinement kaydı oluşturuluyor...`)
    const refinement = await prisma.refinement.create({
      data: {
        photoId: request.photoId,
        refinementType: request.processType,
        status: 'pending',
        inputImageUrl: photo.photoUrl,
        parameters: JSON.stringify({
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          ...request.additionalParams
        })
      }
    })

    console.log('✅ [DB] Refinement oluşturuldu:', refinement.id)

    // 3. ComfyUI'a gönder
    console.log(`\n🎨 [COMFYUI] İşlem gönderiliyor...`)
    console.log('🎨 [COMFYUI] Process Type:', request.processType)
    console.log('🎨 [COMFYUI] Image URL:', photo.photoUrl)
    
    const result = await processWithComfyUI({
      imageUrl: photo.photoUrl,
      processType: request.processType,
      prompt: request.prompt || photo.prompt,
      negativePrompt: request.negativePrompt || photo.negativePrompt || undefined,
      ...request.additionalParams
    })

    console.log('\n📊 [COMFYUI] Sonuç alındı:')
    console.log('  - Success:', result.success)
    console.log('  - Output URL:', result.outputImageUrl)
    console.log('  - Job ID:', result.jobId)
    console.log('  - Error:', result.error || 'Yok')

    // 4. Sonucu güncelle
    if (result.success && result.outputImageUrl) {
      console.log('\n✅ [DB] Refinement güncelleniyor (completed)...')
      await prisma.refinement.update({
        where: { id: refinement.id },
        data: {
          status: 'completed',
          outputImageUrl: result.outputImageUrl,
          comfyuiJobId: result.jobId
        }
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ [POST-PROCESS] İşlem başarıyla tamamlandı!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      return {
        success: true,
        refinementId: refinement.id,
        outputImageUrl: result.outputImageUrl
      }
    } else {
      console.log('\n❌ [DB] Refinement güncelleniyor (error)...')
      console.log('❌ Hata:', result.error)
      
      await prisma.refinement.update({
        where: { id: refinement.id },
        data: {
          status: 'error',
          errorMessage: result.error
        }
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('❌ [POST-PROCESS] İşlem başarısız!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      return {
        success: false,
        error: result.error
      }
    }

  } catch (error) {
    console.log('\n❌ [POST-PROCESS] Exception oluştu!')
    console.error('Error details:', error)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }
  }
}

/**
 * ComfyUI ile işlem yapar
 */
async function processWithComfyUI(params: {
  imageUrl: string
  processType: PostProcessType
  prompt?: string
  negativePrompt?: string
  [key: string]: any
}): Promise<{
  success: boolean
  outputImageUrl?: string
  jobId?: string
  error?: string
}> {
  try {
    console.log('\n🖼️ [COMFYUI] İşlem başlatılıyor...')
    console.log('  - Process Type:', params.processType)
    console.log('  - Image URL:', params.imageUrl)

    // 1. Görüntüyü indir
    console.log('\n⬇️ [COMFYUI] Görüntü indiriliyor...')
    const imageResponse = await axios.get(params.imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    })

    console.log('✅ [COMFYUI] Görüntü indirildi')
    console.log('  - Size:', (imageResponse.data.byteLength / 1024).toFixed(2), 'KB')

    // 2. ComfyUI'a yükle
    console.log('\n⬆️ [COMFYUI] Görüntü ComfyUI\'a yükleniyor...')
    const formData = new FormData()
    const imageBlob = new Blob([imageResponse.data], { 
      type: 'image/png' 
    })
    formData.append('image', imageBlob, 'input.png')
    formData.append('overwrite', 'true')

    const uploadResponse = await axios.post(
      `${COMFYUI_API_URL}/upload/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    )

    const uploadedImageName = uploadResponse.data.name

    console.log('✅ [COMFYUI] Görüntü yüklendi:', uploadedImageName)

    // 3. Workflow parametrelerini hazırla
    console.log('\n⚙️ [COMFYUI] Workflow parametreleri hazırlanıyor...')
    const workflowParams: WorkflowParams = {
      inputImageName: uploadedImageName,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      seed: params.seed,
      ...params
    }
    console.log('  - Parameters:', JSON.stringify(workflowParams, null, 2))

    // 4. İşlem tipine göre workflow oluştur
    console.log('\n🔨 [COMFYUI] Workflow oluşturuluyor...')
    const workflow = getWorkflowForProcessType(
      params.processType,
      workflowParams
    )
    console.log('✅ [COMFYUI] Workflow hazır')

    // 5. Workflow'u ComfyUI'a gönder
    const clientId = `postprocess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('\n🚀 [COMFYUI] Workflow gönderiliyor...')
    console.log('  - Client ID:', clientId)
    console.log('  - Node Count:', Object.keys(workflow).length)

    const promptResponse = await axios.post(
      `${COMFYUI_API_URL}/prompt`,
      {
        prompt: workflow,
        client_id: clientId
      },
      { timeout: 30000 }
    )

    const promptId = promptResponse.data.prompt_id

    console.log('✅ [COMFYUI] Workflow gönderildi!')
    console.log('  - Prompt ID:', promptId)

    // 6. İşlemin tamamlanmasını bekle
    console.log('\n⏳ [COMFYUI] İşlem tamamlanması bekleniyor...')
    const result = await waitForCompletion(promptId, clientId)

    console.log('✅ [COMFYUI] İşlem tamamlandı!')
    console.log('  - Output URL:', result.imageUrl)

    return {
      success: true,
      outputImageUrl: result.imageUrl,
      jobId: promptId
    }

  } catch (error) {
    console.error('\n❌ [COMFYUI] İşlem hatası:', error)
    if (axios.isAxiosError(error)) {
      console.error('  - Status:', error.response?.status)
      console.error('  - Data:', error.response?.data)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ComfyUI işlemi başarısız'
    }
  }
}

/**
 * ComfyUI işleminin tamamlanmasını bekler
 */
async function waitForCompletion(
  promptId: string,
  clientId: string,
  maxWaitTime = 300000 // 5 dakika
): Promise<{ imageUrl: string }> {
  const startTime = Date.now()
  
  console.log('⏱️ [COMFYUI] Bekleme başladı (max:', maxWaitTime / 1000, 'saniye)')
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      // History'den sonucu kontrol et
      const historyResponse = await axios.get(
        `${COMFYUI_API_URL}/history/${promptId}`,
        { timeout: 10000 }
      )

      const history = historyResponse.data[promptId]
      
      if (history && history.status) {
        if (history.status.completed) {
          // Çıktı görüntüsünü bul
          const outputs = history.outputs
          
          for (const nodeId in outputs) {
            const nodeOutput = outputs[nodeId]
            
            if (nodeOutput.images && nodeOutput.images.length > 0) {
              const image = nodeOutput.images[0]
              const imageUrl = `${COMFYUI_API_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type || 'output'}`
              
              return { imageUrl }
            }
          }
          
          throw new Error('Çıktı görüntüsü bulunamadı')
        }
        
        if (history.status.error) {
          throw new Error(`ComfyUI hatası: ${JSON.stringify(history.status.error)}`)
        }
      }
      
      // 2 saniye bekle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        // Timeout hatası, devam et
        continue
      }
      throw error
    }
  }
  
  throw new Error('İşlem zaman aşımına uğradı')
}

/**
 * ComfyUI sunucusunun durumunu kontrol eder
 */
export async function checkComfyUIStatus(): Promise<{
  online: boolean
  version?: string
  error?: string
}> {
  try {
    const response = await axios.get(
      `${COMFYUI_API_URL}/system_stats`,
      { timeout: 5000 }
    )
    
    return {
      online: true,
      version: response.data.system?.comfyui_version
    }
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : 'Bağlantı kurulamadı'
    }
  }
}

/**
 * Refinement detaylarını getirir
 */
export async function getRefinement(refinementId: string) {
  return await prisma.refinement.findUnique({
    where: { id: refinementId },
    include: {
      photo: {
        include: {
          request: true
        }
      }
    }
  })
}

/**
 * Bir fotoğrafın tüm refinement'larını getirir
 */
export async function getPhotoRefinements(photoId: string) {
  return await prisma.refinement.findMany({
    where: { photoId },
    orderBy: { createdAt: 'desc' }
  })
}
