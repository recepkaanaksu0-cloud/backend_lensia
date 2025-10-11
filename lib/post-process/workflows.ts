/**
 * ComfyUI Post-Process Workflow Şablonları
 * Her işlem tipi için özel workflow tanımları
 */

import { PostProcessType, WorkflowParams } from './types'

// Mevcut type ve interface types.ts'den import ediliyor

/**
 * Obje Silme Workflow (Inpainting)
 * Kullanıcının seçtiği alanları akıllıca temizler
 */
export function createObjectDeleteWorkflow(params: WorkflowParams) {
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "3": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "4": {
      "inputs": {
        "text": params.prompt || "clean background, seamless, natural",
        "clip": ["3", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "5": {
      "inputs": {
        "text": params.negativePrompt || "artifacts, noise, blur, watermark",
        "clip": ["3", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "6": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000000),
        "steps": 25,
        "cfg": 7.5,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 0.7,
        "model": ["3", 0],
        "positive": ["4", 0],
        "negative": ["5", 0],
        "latent_image": ["7", 0]
      },
      "class_type": "KSampler"
    },
    "7": {
      "inputs": {
        "pixels": ["1", 0],
        "vae": ["3", 2]
      },
      "class_type": "VAEEncode"
    },
    "8": {
      "inputs": {
        "samples": ["6", 0],
        "vae": ["3", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "object_delete",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Arka Plan Değiştirme Workflow
 * Mevcut objeyi koruyarak arka planı değiştirir
 */
export function createBackgroundChangeWorkflow(params: WorkflowParams) {
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "3": {
      "inputs": {
        "text": params.prompt || "professional studio background, clean, modern",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "text": params.negativePrompt || "busy background, cluttered, distracting",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "5": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000000),
        "steps": 30,
        "cfg": 8.0,
        "sampler_name": "dpmpp_2m_sde",
        "scheduler": "karras",
        "denoise": 0.85,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["6", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "pixels": ["1", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEEncode"
    },
    "7": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEDecode"
    },
    "8": {
      "inputs": {
        "filename_prefix": "background_change",
        "images": ["7", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Arka Plan Kaldırma Workflow
 * Arka planı tamamen şeffaf yapar
 */
export function createBackgroundRemoveWorkflow(params: WorkflowParams) {
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "images": ["1", 0]
      },
      "class_type": "RemoveBackground"
    },
    "3": {
      "inputs": {
        "filename_prefix": "background_remove",
        "images": ["2", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Model Değiştirme Workflow
 * Farklı bir model ile görüntüyü yeniden üretir
 */
export function createModelChangeWorkflow(params: WorkflowParams) {
  const modelName = params.modelName || "sd_xl_base_1.0.safetensors"
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "ckpt_name": modelName
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "3": {
      "inputs": {
        "text": params.prompt || "high quality, professional, detailed",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "text": params.negativePrompt || "low quality, blur, noise",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "5": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000000),
        "steps": 25,
        "cfg": 7.5,
        "sampler_name": "euler_ancestral",
        "scheduler": "normal",
        "denoise": 0.75,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["6", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "pixels": ["1", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEEncode"
    },
    "7": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEDecode"
    },
    "8": {
      "inputs": {
        "filename_prefix": "model_change",
        "images": ["7", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Rötuş/Kalite İyileştirme Workflow
 * Görüntü kalitesini artırır, gürültüyü azaltır
 */
export function createNoiseFixWorkflow(params: WorkflowParams) {
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "3": {
      "inputs": {
        "text": "masterpiece, best quality, highly detailed, sharp, clear, professional photography",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "text": "blur, noise, grain, low quality, artifacts, jpeg artifacts, watermark",
        "clip": ["2", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "5": {
      "inputs": {
        "seed": params.seed || Math.floor(Math.random() * 1000000000),
        "steps": 20,
        "cfg": 6.5,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 0.4,
        "model": ["2", 0],
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["6", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "pixels": ["1", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEEncode"
    },
    "7": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["2", 2]
      },
      "class_type": "VAEDecode"
    },
    "8": {
      "inputs": {
        "filename_prefix": "noise_fix",
        "images": ["7", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Upscale Workflow
 * Görüntü çözünürlüğünü 2x veya 4x artırır
 */
export function createUpscaleWorkflow(params: WorkflowParams) {
  const upscaleModel = params.upscaleModel || "RealESRGAN_x4plus.pth"
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "model_name": upscaleModel
      },
      "class_type": "UpscaleModelLoader"
    },
    "3": {
      "inputs": {
        "upscale_model": ["2", 0],
        "image": ["1", 0]
      },
      "class_type": "ImageUpscaleWithModel"
    },
    "4": {
      "inputs": {
        "filename_prefix": "upscale",
        "images": ["3", 0]
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * Workflow seçici fonksiyonu
 */
export function getWorkflowForProcessType(
  processType: PostProcessType,
  params: WorkflowParams
) {
  switch (processType) {
    case 'object-delete':
      return createObjectDeleteWorkflow(params)
    case 'background-change':
      return createBackgroundChangeWorkflow(params)
    case 'background-remove':
      return createBackgroundRemoveWorkflow(params)
    case 'background-color':
      return createBackgroundColorWorkflow(params)
    case 'model-change':
      return createModelChangeWorkflow(params)
    case 'noise-fix':
      return createNoiseFixWorkflow(params)
    case 'upscale':
      return createUpscaleWorkflow(params)
    case 'rotate':
      return createRotateWorkflow(params)
    case 'brightness-contrast':
      return createBrightnessContrastWorkflow(params)
    case 'sharpen':
      return createSharpenWorkflow(params)
    case 'blur-background':
      return createBlurBackgroundWorkflow(params)
    case 'face-enhance':
      return createFaceEnhanceWorkflow(params)
    case 'skin-smooth':
      return createSkinSmoothWorkflow(params)
    case 'teeth-whiten':
      return createTeethWhitenWorkflow(params)
    default:
      // Henüz implement edilmemiş işlemler için basit upscale döndür
      return createUpscaleWorkflow(params)
  }
}

/**
 * ✨ Arka Plan Renk Değiştirme
 */
export function createBackgroundColorWorkflow(params: WorkflowParams) {
  const backgroundColor = params.backgroundColor || '#FFFFFF'
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "color": backgroundColor,
        "width": 1024,
        "height": 1024
      },
      "class_type": "SolidColor"
    },
    "3": {
      "inputs": {
        "background": ["2", 0],
        "foreground": ["1", 0],
        "method": "normal"
      },
      "class_type": "ImageComposite"
    },
    "4": {
      "inputs": {
        "images": ["3", 0],
        "filename_prefix": "bg_color"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Fotoğraf Döndürme
 */
export function createRotateWorkflow(params: WorkflowParams) {
  const angle = params.rotationAngle || 90
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "angle": angle
      },
      "class_type": "ImageRotate"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "rotated"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Parlaklık/Kontrast Ayarlama
 */
export function createBrightnessContrastWorkflow(params: WorkflowParams) {
  const brightness = params.brightness || 0
  const contrast = params.contrast || 0
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "brightness": brightness,
        "contrast": contrast
      },
      "class_type": "ImageAdjustBrightnessContrast"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "adjusted"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Keskinleştirme
 */
export function createSharpenWorkflow(params: WorkflowParams) {
  const sharpness = params.sharpness || 1.5
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "strength": sharpness
      },
      "class_type": "ImageSharpen"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "sharpened"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Arka Plan Bulanıklaştırma (Bokeh)
 */
export function createBlurBackgroundWorkflow(params: WorkflowParams) {
  const blurStrength = params.blurStrength || 7
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0]
      },
      "class_type": "RemBG"  // Arka plan ayırma
    },
    "3": {
      "inputs": {
        "image": ["1", 0],
        "blur_radius": blurStrength
      },
      "class_type": "ImageBlur"
    },
    "4": {
      "inputs": {
        "background": ["3", 0],
        "foreground": ["2", 0],
        "method": "normal"
      },
      "class_type": "ImageComposite"
    },
    "5": {
      "inputs": {
        "images": ["4", 0],
        "filename_prefix": "blur_bg"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Yüz İyileştirme
 */
export function createFaceEnhanceWorkflow(params: WorkflowParams) {
  const strength = params.faceEnhanceStrength || 0.8
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "strength": strength,
        "model": "GFPGANv1.4"
      },
      "class_type": "FaceRestore"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "face_enhanced"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Cilt Pürüzsüzleştirme
 */
export function createSkinSmoothWorkflow(params: WorkflowParams) {
  const level = params.skinSmoothLevel || 0.6
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "smooth_level": level
      },
      "class_type": "SkinSmooth"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "skin_smooth"
      },
      "class_type": "SaveImage"
    }
  }
}

/**
 * ✨ Diş Beyazlatma
 */
export function createTeethWhitenWorkflow(params: WorkflowParams) {
  const level = params.teethWhitenLevel || 0.7
  
  return {
    "1": {
      "inputs": {
        "image": params.inputImageName,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": ["1", 0],
        "whiten_level": level
      },
      "class_type": "TeethWhiten"
    },
    "3": {
      "inputs": {
        "images": ["2", 0],
        "filename_prefix": "teeth_whitened"
      },
      "class_type": "SaveImage"
    }
  }
}
