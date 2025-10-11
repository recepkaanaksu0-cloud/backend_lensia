/**
 * ComfyUI Post-Process İşlem Tipleri
 * Desteklenen tüm işlemler ve parametreleri
 */

export type PostProcessType = 
  // Mevcut İşlemler
  | 'object-delete'           // Obje/Nesne Silme
  | 'background-change'       // Arka Plan Değiştir
  | 'background-remove'       // Arka Plan Kaldır (şeffaf)
  | 'model-change'            // AI Model Değiştir
  | 'noise-fix'               // Rötuş/Gürültü Azaltma
  | 'upscale'                 // Görüntü Büyütme
  
  // Yeni Profesyonel İşlemler
  | 'background-color'        // Arka Plan Renk Değiştirme (solid color)
  | 'rotate'                  // Fotoğraf Döndürme
  | 'perspective-fix'         // Perspektif Düzeltme
  | 'color-grade'             // Renk Düzenleme/Grading
  | 'brightness-contrast'     // Parlaklık/Kontrast
  | 'saturation'              // Doygunluk Ayarı
  | 'sharpen'                 // Keskinleştirme
  | 'blur-background'         // Arka Plan Bulanıklaştır (bokeh)
  | 'face-enhance'            // Yüz İyileştirme
  | 'skin-smooth'             // Cilt Pürüzsüzleştirme
  | 'eye-enhance'             // Göz İyileştirme
  | 'teeth-whiten'            // Diş Beyazlatma
  | 'makeup-apply'            // Makyaj Uygulama
  | 'hair-color'              // Saç Rengi Değiştirme
  | 'body-reshape'            // Vücut Şekillendirme
  | 'clothing-change'         // Kıyafet Değiştirme
  | 'style-transfer'          // Stil Transfer (artistic)
  | 'age-modify'              // Yaş Değiştirme
  | 'gender-swap'             // Cinsiyet Değiştirme
  | 'lighting-adjust'         // Işık Ayarlama
  | 'shadow-remove'           // Gölge Kaldırma
  | 'reflection-add'          // Yansıma Ekleme
  | 'watermark-remove'        // Filigran Kaldırma
  | 'text-add'                // Metin Ekleme
  | 'logo-add'                // Logo Ekleme
  | 'border-add'              // Çerçeve Ekleme
  | 'crop-smart'              // Akıllı Kırpma
  | 'resolution-enhance'      // Çözünürlük İyileştirme
  | 'denoise-advanced'        // Gelişmiş Gürültü Azaltma
  | 'hdr-enhance'             // HDR İyileştirme
  | 'color-pop'               // Renk Vurgulama
  | 'vintage-effect'          // Vintage Efekt
  | 'black-white'             // Siyah Beyaz
  | 'sepia'                   // Sepya Tonu
  | 'film-grain'              // Film Grain Efekti
  | 'vignette'                // Vinyet Efekti
  | 'lens-correction'         // Lens Düzeltme
  | 'chromatic-aberration'    // Renk Sapması Düzeltme
  | 'super-resolution'        // Süper Çözünürlük
  | 'restore-old-photo'       // Eski Fotoğraf Restore

export interface WorkflowParams {
  inputImageName: string
  prompt?: string
  negativePrompt?: string
  seed?: number
  
  // Yeni Parametreler
  backgroundColor?: string    // Hex color (örn: "#FFFFFF")
  rotationAngle?: number      // Derece (0-360)
  perspectivePoints?: number[] // [x1,y1,x2,y2,x3,y3,x4,y4]
  brightness?: number         // -1 to 1
  contrast?: number           // -1 to 1
  saturation?: number         // -1 to 1
  sharpness?: number          // 0 to 2
  blurStrength?: number       // 0 to 10
  faceEnhanceStrength?: number // 0 to 1
  skinSmoothLevel?: number    // 0 to 1
  teethWhitenLevel?: number   // 0 to 1
  makeupStyle?: string        // 'natural', 'glamour', 'dramatic'
  hairColor?: string          // Hex color
  bodyReshape?: {
    waist?: number            // -1 to 1
    legs?: number             // -1 to 1
    arms?: number             // -1 to 1
  }
  styleReference?: string     // Reference image URL
  ageModify?: number          // -30 to +30 years
  lightingDirection?: string  // 'top', 'bottom', 'left', 'right', 'front'
  textContent?: string        // Text to add
  textPosition?: { x: number, y: number }
  textStyle?: {
    font?: string
    size?: number
    color?: string
    bold?: boolean
  }
  logoUrl?: string
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  borderWidth?: number        // pixels
  borderColor?: string        // Hex color
  cropAspectRatio?: string    // '16:9', '1:1', '4:3', etc.
  hdrStrength?: number        // 0 to 1
  vintageIntensity?: number   // 0 to 1
  filmGrainAmount?: number    // 0 to 1
  vignetteStrength?: number   // 0 to 1
  
  [key: string]: any
}

/**
 * İşlem kategorileri
 */
export const PROCESS_CATEGORIES = {
  BASIC: [
    'object-delete',
    'background-change',
    'background-remove',
    'background-color',
    'rotate',
    'crop-smart',
  ],
  ENHANCEMENT: [
    'noise-fix',
    'upscale',
    'sharpen',
    'brightness-contrast',
    'saturation',
    'resolution-enhance',
    'denoise-advanced',
    'hdr-enhance',
    'super-resolution',
  ],
  PORTRAIT: [
    'face-enhance',
    'skin-smooth',
    'eye-enhance',
    'teeth-whiten',
    'makeup-apply',
    'hair-color',
    'age-modify',
    'gender-swap',
  ],
  BODY: [
    'body-reshape',
    'clothing-change',
  ],
  ARTISTIC: [
    'style-transfer',
    'vintage-effect',
    'black-white',
    'sepia',
    'film-grain',
    'color-pop',
  ],
  LIGHTING: [
    'lighting-adjust',
    'shadow-remove',
    'reflection-add',
    'blur-background',
  ],
  PROFESSIONAL: [
    'perspective-fix',
    'color-grade',
    'lens-correction',
    'chromatic-aberration',
    'watermark-remove',
  ],
  BRANDING: [
    'text-add',
    'logo-add',
    'border-add',
  ],
  RESTORATION: [
    'restore-old-photo',
  ],
} as const

/**
 * İşlem açıklamaları ve önerilen parametreler
 */
export const PROCESS_DESCRIPTIONS: Record<PostProcessType, {
  name: string
  description: string
  category: string
  estimatedTime: string
  requiredParams?: string[]
  optionalParams?: string[]
  examples?: any[]
}> = {
  // Temel İşlemler
  'object-delete': {
    name: 'Nesne Silme',
    description: 'Fotoğraftan istenmeyen nesneleri akıllıca kaldırır',
    category: 'BASIC',
    estimatedTime: '20-40s (GPU)',
    requiredParams: ['prompt'],
    examples: [{
      prompt: 'remove person, clean background',
      negativePrompt: 'artifacts, blur'
    }]
  },
  
  'background-change': {
    name: 'Arka Plan Değiştir',
    description: 'Profesyonel stüdyo arka planı ekler',
    category: 'BASIC',
    estimatedTime: '25-45s (GPU)',
    requiredParams: ['prompt'],
    examples: [{
      prompt: 'white studio background, professional lighting',
      negativePrompt: 'busy, cluttered'
    }]
  },
  
  'background-remove': {
    name: 'Arka Plan Kaldır',
    description: 'Arka planı tamamen şeffaf yapar (PNG)',
    category: 'BASIC',
    estimatedTime: '5-10s (GPU)',
    examples: [{}]
  },
  
  'background-color': {
    name: 'Arka Plan Renk Değiştir',
    description: 'Arka planı tek düze renge değiştirir',
    category: 'BASIC',
    estimatedTime: '8-15s (GPU)',
    requiredParams: ['backgroundColor'],
    examples: [{
      backgroundColor: '#FFFFFF'  // Beyaz
    }, {
      backgroundColor: '#F0F0F0'  // Açık gri
    }, {
      backgroundColor: '#000000'  // Siyah
    }]
  },
  
  'rotate': {
    name: 'Fotoğraf Döndür',
    description: 'Fotoğrafı belirtilen açıyla döndürür',
    category: 'BASIC',
    estimatedTime: '2-5s (GPU)',
    requiredParams: ['rotationAngle'],
    examples: [{
      rotationAngle: 90   // 90 derece sağa
    }, {
      rotationAngle: -45  // 45 derece sola
    }]
  },
  
  'perspective-fix': {
    name: 'Perspektif Düzeltme',
    description: 'Çarpık açıları düzeltir (mimari fotoğraflar için)',
    category: 'PROFESSIONAL',
    estimatedTime: '10-20s (GPU)',
    optionalParams: ['perspectivePoints'],
    examples: [{}]
  },
  
  // Renk ve Ton İşlemleri
  'color-grade': {
    name: 'Renk Düzenleme',
    description: 'Profesyonel renk düzenleme (color grading)',
    category: 'PROFESSIONAL',
    estimatedTime: '15-25s (GPU)',
    optionalParams: ['brightness', 'contrast', 'saturation'],
    examples: [{
      brightness: 0.2,
      contrast: 0.1,
      saturation: 0.15
    }]
  },
  
  'brightness-contrast': {
    name: 'Parlaklık/Kontrast',
    description: 'Parlaklık ve kontrast ayarı',
    category: 'ENHANCEMENT',
    estimatedTime: '5-10s (GPU)',
    optionalParams: ['brightness', 'contrast'],
    examples: [{
      brightness: 0.1,
      contrast: 0.15
    }]
  },
  
  'saturation': {
    name: 'Doygunluk',
    description: 'Renk doygunluğunu ayarlar',
    category: 'ENHANCEMENT',
    estimatedTime: '5-10s (GPU)',
    requiredParams: ['saturation'],
    examples: [{
      saturation: 0.3  // %30 daha doygun
    }]
  },
  
  // Kalite İyileştirme
  'noise-fix': {
    name: 'Rötuş/Gürültü Azaltma',
    description: 'Görüntü kalitesini iyileştirir, gürültüyü azaltır',
    category: 'ENHANCEMENT',
    estimatedTime: '15-25s (GPU)',
    examples: [{}]
  },
  
  'upscale': {
    name: 'Görüntü Büyütme',
    description: '2x veya 4x çözünürlük artırma',
    category: 'ENHANCEMENT',
    estimatedTime: '10-30s (GPU)',
    examples: [{}]
  },
  
  'sharpen': {
    name: 'Keskinleştirme',
    description: 'Görüntüyü keskinleştirir',
    category: 'ENHANCEMENT',
    estimatedTime: '5-10s (GPU)',
    optionalParams: ['sharpness'],
    examples: [{
      sharpness: 1.5
    }]
  },
  
  'resolution-enhance': {
    name: 'Çözünürlük İyileştirme',
    description: 'AI ile çözünürlük ve detay artırma',
    category: 'ENHANCEMENT',
    estimatedTime: '20-40s (GPU)',
    examples: [{}]
  },
  
  'super-resolution': {
    name: 'Süper Çözünürlük',
    description: 'En gelişmiş çözünürlük artırma (8x kadar)',
    category: 'ENHANCEMENT',
    estimatedTime: '40-80s (GPU)',
    examples: [{}]
  },
  
  // Portre İyileştirme
  'face-enhance': {
    name: 'Yüz İyileştirme',
    description: 'Yüz detaylarını iyileştirir',
    category: 'PORTRAIT',
    estimatedTime: '20-35s (GPU)',
    optionalParams: ['faceEnhanceStrength'],
    examples: [{
      faceEnhanceStrength: 0.8
    }]
  },
  
  'skin-smooth': {
    name: 'Cilt Pürüzsüzleştirme',
    description: 'Cilt dokusunu pürüzsüzleştirir',
    category: 'PORTRAIT',
    estimatedTime: '15-25s (GPU)',
    optionalParams: ['skinSmoothLevel'],
    examples: [{
      skinSmoothLevel: 0.6
    }]
  },
  
  'eye-enhance': {
    name: 'Göz İyileştirme',
    description: 'Gözleri parlatır ve detaylandırır',
    category: 'PORTRAIT',
    estimatedTime: '15-25s (GPU)',
    examples: [{}]
  },
  
  'teeth-whiten': {
    name: 'Diş Beyazlatma',
    description: 'Dişleri beyazlatır',
    category: 'PORTRAIT',
    estimatedTime: '10-20s (GPU)',
    optionalParams: ['teethWhitenLevel'],
    examples: [{
      teethWhitenLevel: 0.7
    }]
  },
  
  'makeup-apply': {
    name: 'Makyaj Uygulama',
    description: 'AI ile makyaj uygular',
    category: 'PORTRAIT',
    estimatedTime: '25-40s (GPU)',
    optionalParams: ['makeupStyle'],
    examples: [{
      makeupStyle: 'natural'
    }, {
      makeupStyle: 'glamour'
    }]
  },
  
  'hair-color': {
    name: 'Saç Rengi Değiştir',
    description: 'Saç rengini değiştirir',
    category: 'PORTRAIT',
    estimatedTime: '20-35s (GPU)',
    requiredParams: ['hairColor'],
    examples: [{
      hairColor: '#8B4513'  // Kahverengi
    }, {
      hairColor: '#FFD700'  // Sarı
    }]
  },
  
  'age-modify': {
    name: 'Yaş Değiştirme',
    description: 'Görünürdeki yaşı değiştirir',
    category: 'PORTRAIT',
    estimatedTime: '30-50s (GPU)',
    requiredParams: ['ageModify'],
    examples: [{
      ageModify: -10  // 10 yaş genç
    }, {
      ageModify: 20   // 20 yaş yaşlı
    }]
  },
  
  'gender-swap': {
    name: 'Cinsiyet Değiştirme',
    description: 'AI ile cinsiyet değişimi',
    category: 'PORTRAIT',
    estimatedTime: '35-60s (GPU)',
    examples: [{}]
  },
  
  // Vücut İşlemleri
  'body-reshape': {
    name: 'Vücut Şekillendirme',
    description: 'Vücut oranlarını ayarlar',
    category: 'BODY',
    estimatedTime: '25-40s (GPU)',
    optionalParams: ['bodyReshape'],
    examples: [{
      bodyReshape: {
        waist: -0.2,  // %20 daha ince bel
        legs: 0.1     // %10 daha uzun bacak
      }
    }]
  },
  
  'clothing-change': {
    name: 'Kıyafet Değiştirme',
    description: 'AI ile kıyafet değiştirir',
    category: 'BODY',
    estimatedTime: '40-70s (GPU)',
    requiredParams: ['prompt'],
    examples: [{
      prompt: 'wearing business suit, professional attire'
    }]
  },
  
  // Işık ve Efektler
  'lighting-adjust': {
    name: 'Işık Ayarlama',
    description: 'Işık yönü ve yoğunluğunu ayarlar',
    category: 'LIGHTING',
    estimatedTime: '20-35s (GPU)',
    optionalParams: ['lightingDirection'],
    examples: [{
      lightingDirection: 'top'
    }]
  },
  
  'shadow-remove': {
    name: 'Gölge Kaldırma',
    description: 'İstenmeyen gölgeleri kaldırır',
    category: 'LIGHTING',
    estimatedTime: '20-35s (GPU)',
    examples: [{}]
  },
  
  'blur-background': {
    name: 'Arka Plan Bulanıklaştır',
    description: 'Arka plan bokeh efekti',
    category: 'LIGHTING',
    estimatedTime: '15-25s (GPU)',
    optionalParams: ['blurStrength'],
    examples: [{
      blurStrength: 7
    }]
  },
  
  'reflection-add': {
    name: 'Yansıma Ekle',
    description: 'Profesyonel yansıma efekti ekler',
    category: 'LIGHTING',
    estimatedTime: '15-25s (GPU)',
    examples: [{}]
  },
  
  // Artistik Efektler
  'style-transfer': {
    name: 'Stil Transfer',
    description: 'Sanatsal stil uygular',
    category: 'ARTISTIC',
    estimatedTime: '30-50s (GPU)',
    optionalParams: ['styleReference', 'prompt'],
    examples: [{
      prompt: 'oil painting style, impressionist'
    }]
  },
  
  'vintage-effect': {
    name: 'Vintage Efekt',
    description: 'Nostaljik vintage görünüm',
    category: 'ARTISTIC',
    estimatedTime: '10-20s (GPU)',
    optionalParams: ['vintageIntensity'],
    examples: [{
      vintageIntensity: 0.8
    }]
  },
  
  'black-white': {
    name: 'Siyah Beyaz',
    description: 'Profesyonel siyah beyaz dönüşüm',
    category: 'ARTISTIC',
    estimatedTime: '5-10s (GPU)',
    examples: [{}]
  },
  
  'sepia': {
    name: 'Sepya Tonu',
    description: 'Klasik sepya tonu uygular',
    category: 'ARTISTIC',
    estimatedTime: '5-10s (GPU)',
    examples: [{}]
  },
  
  'film-grain': {
    name: 'Film Grain',
    description: 'Film grain efekti ekler',
    category: 'ARTISTIC',
    estimatedTime: '8-15s (GPU)',
    optionalParams: ['filmGrainAmount'],
    examples: [{
      filmGrainAmount: 0.5
    }]
  },
  
  'color-pop': {
    name: 'Renk Vurgulama',
    description: 'Belirli renkleri vurgular',
    category: 'ARTISTIC',
    estimatedTime: '15-25s (GPU)',
    examples: [{}]
  },
  
  'vignette': {
    name: 'Vinyet Efekti',
    description: 'Kenar kararması efekti',
    category: 'ARTISTIC',
    estimatedTime: '5-10s (GPU)',
    optionalParams: ['vignetteStrength'],
    examples: [{
      vignetteStrength: 0.6
    }]
  },
  
  // Profesyonel Düzeltmeler
  'lens-correction': {
    name: 'Lens Düzeltme',
    description: 'Lens distorsiyonunu düzeltir',
    category: 'PROFESSIONAL',
    estimatedTime: '10-20s (GPU)',
    examples: [{}]
  },
  
  'chromatic-aberration': {
    name: 'Renk Sapması Düzeltme',
    description: 'Chromatic aberration düzeltir',
    category: 'PROFESSIONAL',
    estimatedTime: '10-20s (GPU)',
    examples: [{}]
  },
  
  'watermark-remove': {
    name: 'Filigran Kaldırma',
    description: 'Filigran ve watermark kaldırır',
    category: 'PROFESSIONAL',
    estimatedTime: '20-40s (GPU)',
    examples: [{}]
  },
  
  'denoise-advanced': {
    name: 'Gelişmiş Gürültü Azaltma',
    description: 'AI tabanlı gelişmiş gürültü azaltma',
    category: 'ENHANCEMENT',
    estimatedTime: '20-35s (GPU)',
    examples: [{}]
  },
  
  'hdr-enhance': {
    name: 'HDR İyileştirme',
    description: 'HDR görünüm oluşturur',
    category: 'ENHANCEMENT',
    estimatedTime: '20-35s (GPU)',
    optionalParams: ['hdrStrength'],
    examples: [{
      hdrStrength: 0.7
    }]
  },
  
  // Branding
  'text-add': {
    name: 'Metin Ekle',
    description: 'Fotoğrafa metin ekler',
    category: 'BRANDING',
    estimatedTime: '5-10s (GPU)',
    requiredParams: ['textContent'],
    optionalParams: ['textPosition', 'textStyle'],
    examples: [{
      textContent: 'LENSIA.AI',
      textPosition: { x: 100, y: 100 },
      textStyle: {
        font: 'Arial',
        size: 48,
        color: '#FFFFFF',
        bold: true
      }
    }]
  },
  
  'logo-add': {
    name: 'Logo Ekle',
    description: 'Fotoğrafa logo ekler',
    category: 'BRANDING',
    estimatedTime: '8-15s (GPU)',
    requiredParams: ['logoUrl'],
    optionalParams: ['logoPosition'],
    examples: [{
      logoUrl: 'https://example.com/logo.png',
      logoPosition: 'bottom-right'
    }]
  },
  
  'border-add': {
    name: 'Çerçeve Ekle',
    description: 'Fotoğrafa çerçeve ekler',
    category: 'BRANDING',
    estimatedTime: '5-10s (GPU)',
    optionalParams: ['borderWidth', 'borderColor'],
    examples: [{
      borderWidth: 20,
      borderColor: '#FFFFFF'
    }]
  },
  
  // Diğer
  'crop-smart': {
    name: 'Akıllı Kırpma',
    description: 'AI ile akıllı kırpma yapar',
    category: 'BASIC',
    estimatedTime: '10-15s (GPU)',
    optionalParams: ['cropAspectRatio'],
    examples: [{
      cropAspectRatio: '16:9'
    }, {
      cropAspectRatio: '1:1'
    }]
  },
  
  'restore-old-photo': {
    name: 'Eski Fotoğraf Restore',
    description: 'Eski ve hasarlı fotoğrafları restore eder',
    category: 'RESTORATION',
    estimatedTime: '40-80s (GPU)',
    examples: [{}]
  },
  
  'model-change': {
    name: 'AI Model Değiştir',
    description: 'Farklı AI modeli kullanarak yeniden üretir',
    category: 'BASIC',
    estimatedTime: '20-50s (GPU)',
    optionalParams: ['prompt'],
    examples: [{}]
  },
}
