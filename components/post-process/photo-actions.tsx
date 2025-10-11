'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Users, 
  Sparkles, 
  ZoomIn 
} from 'lucide-react'

export type PostProcessType = 
  | 'object-delete'
  | 'background-change'
  | 'background-remove'
  | 'model-change'
  | 'noise-fix'
  | 'upscale'

interface PhotoActionsProps {
  photoId: string
  photoUrl: string
  onProcessComplete?: (outputUrl: string) => void
}

interface ProcessButton {
  type: PostProcessType
  label: string
  icon: React.ReactNode
  color: string
  description: string
}

export function PhotoActions({ photoId, photoUrl, onProcessComplete }: PhotoActionsProps) {
  const [processing, setProcessing] = useState(false)
  const [currentProcess, setCurrentProcess] = useState<PostProcessType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const processButtons: ProcessButton[] = [
    {
      type: 'object-delete',
      label: 'Obje Sil',
      icon: <Trash2 className="w-4 h-4" />,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Görüntüden istenmeyen objeleri kaldır'
    },
    {
      type: 'background-change',
      label: 'Arka Plan Değiştir',
      icon: <ImageIcon className="w-4 h-4" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Farklı bir arka plan seç'
    },
    {
      type: 'background-remove',
      label: 'Arka Plan Kaldır',
      icon: <X className="w-4 h-4" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Arka planı tamamen kaldır (PNG)'
    },
    {
      type: 'model-change',
      label: 'Model Değiştir',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Farklı bir model kullan'
    },
    {
      type: 'noise-fix',
      label: 'Rötuş Yap',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Görüntü kalitesini iyileştir'
    },
    {
      type: 'upscale',
      label: 'Upscale',
      icon: <ZoomIn className="w-4 h-4" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Görüntü çözünürlüğünü artır'
    }
  ]

  const handleProcess = async (processType: PostProcessType) => {
    setProcessing(true)
    setCurrentProcess(processType)
    setError(null)
    setResult(null)

    console.log('📤 [Frontend] Starting post-process:', { photoId, processType })

    try {
      const requestBody = {
        photoId,
        processType
      }
      
      console.log('📤 [Frontend] Request body:', requestBody)

      const response = await fetch('/api/post-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 [Frontend] Response status:', response.status)

      const data = await response.json()

      console.log('📥 [Frontend] Response data:', data)

      if (data.success && data.outputImageUrl) {
        console.log('✅ [Frontend] Process completed successfully!')
        setResult(data.outputImageUrl)
        onProcessComplete?.(data.outputImageUrl)
      } else {
        console.error('❌ [Frontend] Process failed:', data.error)
        setError(data.error || 'İşlem başarısız oldu')
      }
    } catch (err) {
      console.error('❌ [Frontend] Request error:', err)
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setProcessing(false)
      setCurrentProcess(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Durum Mesajları */}
      {processing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-700">
              İşlem yapılıyor: {processButtons.find(b => b.type === currentProcess)?.label}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700 font-medium">İşlem tamamlandı!</span>
            </div>
            <img 
              src={result} 
              alt="İşlenmiş fotoğraf" 
              className="w-full h-auto rounded-lg border border-green-200"
            />
          </div>
        </div>
      )}

      {/* İşlem Butonları */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Fotoğraf Düzenleme İşlemleri</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {processButtons.map((button) => (
            <button
              key={button.type}
              onClick={() => handleProcess(button.type)}
              disabled={processing}
              className={`
                ${button.color}
                text-white
                px-4 py-3
                rounded-lg
                flex flex-col items-center gap-2
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-lg
                group
              `}
              title={button.description}
            >
              <div className="flex items-center gap-2">
                {button.icon}
                <span className="text-sm font-medium">{button.label}</span>
              </div>
              
              {currentProcess === button.type && processing && (
                <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">
          💡 İpucu: Her işlem seçilen fotoğrafa otomatik olarak uygulanır
        </p>
      </div>
    </div>
  )
}
