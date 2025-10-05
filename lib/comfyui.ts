import axios from 'axios'

const COMFYUI_API_URL = process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'

export interface ComfyUIJobParams {
  prompt: string
  negativePrompt?: string
  inputImageUrl: string
  [key: string]: unknown
}

export interface ComfyUIResponse {
  success: boolean
  outputImageUrl?: string
  error?: string
}

/**
 * ComfyUI API'sine iş gönderen ana fonksiyon
 */
export async function processComfyUIJob(params: ComfyUIJobParams): Promise<ComfyUIResponse> {
  try {
    // 1. Giriş görüntüsünü indir ve ComfyUI'a yükle
    const imageResponse = await axios.get(params.inputImageUrl, {
      responseType: 'arraybuffer'
    })
    
    const imageBuffer = Buffer.from(imageResponse.data)
    
    // 2. Görüntüyü ComfyUI'a yükle
    const uploadFormData = new FormData()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    uploadFormData.append('image', imageBlob, 'input.png')
    
    const uploadResponse = await axios.post(
      `${COMFYUI_API_URL}/upload/image`,
      uploadFormData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    
    const uploadedImageName = uploadResponse.data.name
    
    // 3. ComfyUI workflow'unu hazırla
    const workflow = createWorkflow({
      ...params,
      uploadedImageName
    })
    
    // 4. Prompt'u kuyruğa ekle
    const promptResponse = await axios.post(
      `${COMFYUI_API_URL}/prompt`,
      {
        prompt: workflow,
        client_id: `dashboard-${Date.now()}`
      }
    )
    
    const promptId = promptResponse.data.prompt_id
    
    // 5. İşlemin tamamlanmasını bekle ve sonucu al
    const result = await waitForCompletion(promptId)
    
    return result
    
  } catch (error) {
    console.error('ComfyUI işlem hatası:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ComfyUI işlemi başarısız oldu'
    }
  }
}

/**
 * ComfyUI workflow şeması oluşturur
 * Not: Bu, sizin kullandığınız workflow'a göre özelleştirilmeli
 */
function createWorkflow(params: Record<string, unknown>) {
  // Temel bir workflow şeması
  // Gerçek workflow'unuzu buraya eklemelisiniz
  return {
    "3": {
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000000),
        "steps": 20,
        "cfg": 8,
        "sampler_name": "euler",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": "v1-5-pruned-emaonly.ckpt"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": params.prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": params.negativePrompt || "text, watermark",
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * İşlemin tamamlanmasını bekler ve sonucu döndürür
 */
async function waitForCompletion(promptId: string, maxAttempts = 60): Promise<ComfyUIResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const historyResponse = await axios.get(`${COMFYUI_API_URL}/history/${promptId}`)
      const history = historyResponse.data[promptId]
      
      if (history && history.status) {
        if (history.status.completed) {
          // İşlem tamamlandı, sonuç görüntüyü al
          const outputs = history.outputs
          
          // İlk SaveImage node'unu bul
          for (const nodeId in outputs) {
            const output = outputs[nodeId]
            if (output.images && output.images.length > 0) {
              const image = output.images[0]
              const imageUrl = `${COMFYUI_API_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type || 'output'}`
              
              return {
                success: true,
                outputImageUrl: imageUrl
              }
            }
          }
        }
        
        if (history.status.status_str === 'error') {
          return {
            success: false,
            error: 'ComfyUI işlemi hata ile sonuçlandı'
          }
        }
      }
      
      // 2 saniye bekle ve tekrar dene
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error('History kontrolü hatası:', error)
    }
  }
  
  return {
    success: false,
    error: 'İşlem zaman aşımına uğradı'
  }
}

/**
 * ComfyUI sunucusunun çalışıp çalışmadığını kontrol eder
 */
export async function checkComfyUIStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${COMFYUI_API_URL}/system_stats`, {
      timeout: 5000
    })
    return response.status === 200
  } catch {
    return false
  }
}
