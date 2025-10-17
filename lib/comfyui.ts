import axios from 'axios'

const COMFYUI_API_URL = process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'

export interface ComfyUIJobParams {
  inputImageUrl: string
  operation?: string
  filenamePrefix?: string
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
    const imageResponse = await axios.get(params.inputImageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageResponse.data)

    const uploadFormData = new FormData()
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
    uploadFormData.append('image', imageBlob, 'input.png')

    const uploadResponse = await axios.post(`${COMFYUI_API_URL}/upload/image`, uploadFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const uploadedImageName = uploadResponse.data.name

    const workflow = createWorkflow({
      uploadedImageName,
      filenamePrefix: params.filenamePrefix,
      operation: params.operation
    })

    const promptResponse = await axios.post(`${COMFYUI_API_URL}/prompt`, {
      prompt: workflow,
      client_id: `dashboard-${Date.now()}`
    })

    const promptId = promptResponse.data.prompt_id
    const result = await waitForCompletion(promptId)
    return result

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ComfyUI işlemi başarısız oldu'
    }
  }
}

/**
 * Frontend'den gelen işlem türüne göre ComfyUI workflow'u oluşturur
 */
export function createWorkflow({
  uploadedImageName,
  filenamePrefix,
  operation
}: {
  uploadedImageName: string
  filenamePrefix?: string
  operation?: string
}) {
  switch (operation) {
    case "remove_background":
      return {
        prompt: {
          "1": {
            class_type: "LoadImage",
            inputs: { image: uploadedImageName }
          },
          "2": {
            class_type: "BackgroundRemover",
            inputs: { image: ["1", 0] }
          },
          "3": {
            class_type: "SaveImage",
            inputs: {
              images: ["2", 0],
              filename_prefix: filenamePrefix || "bg_removed"
            }
          }
        }
      }
      case "ImageRotate":
  return {
    prompt: {
      "1": {
        class_type: "LoadImage",
        inputs: { 
          image: uploadedImageName 
        }
      },
      "2": {
        class_type: "ImageRotate",
        inputs: {
          image: ["1", 0],
          rotation: 90 // veya frontend'den gelen değer
        }
      },
      "3": {
        class_type: "SaveImage",
        inputs: {
          images: ["2", 0],
          filename_prefix: filenamePrefix || "rotated",
          rotation : 90
        }
      }
    }
  }

    default:
      return {
        prompt: {
          "1": {
            class_type: "LoadImage",
            inputs: { image: uploadedImageName }
          },
          "2": {
            class_type: "SaveImage",
            inputs: {
              images: ["1", 0],
              filename_prefix: filenamePrefix || "output"
            }
          }
        }
      }
  }
}

/**
 * Prompt tamamlanana kadar bekler ve sonucu döndürür
 */
async function waitForCompletion(promptId: string, maxAttempts = 60): Promise<ComfyUIResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const historyResponse = await axios.get(`${COMFYUI_API_URL}/history/${promptId}`)
      const history = historyResponse.data[promptId]

      if (history?.status?.completed) {
        for (const nodeId in history.outputs) {
          const output = history.outputs[nodeId]
          if (output.images?.length > 0) {
            const image = output.images[0]
            const imageUrl = `${COMFYUI_API_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type || 'output'}`
            return { success: true, outputImageUrl: imageUrl }
          }
        }
      }

      if (history?.status?.status_str === 'error') {
        return { success: false, error: 'ComfyUI işlemi hata ile sonuçlandı' }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('History kontrolü hatası:', error)
    }
  }

  return { success: false, error: 'İşlem zaman aşımına uğradı' }
}

/**
 * ComfyUI sunucusunun çalışıp çalışmadığını kontrol eder
 */
export async function checkComfyUIStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${COMFYUI_API_URL}/system_stats`, { timeout: 5000 })
    return response.status === 200
  } catch {
    return false
  }
}
