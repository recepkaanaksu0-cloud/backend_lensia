'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function ComfyUIStatus() {
  const [status, setStatus] = useState<{
    online: boolean
    version?: string
    error?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Her 10 saniyede bir kontrol et
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/comfyui/status')
      const data = await response.json()
      setStatus(data.comfyui)
    } catch (error) {
      setStatus({ online: false, error: 'Bağlantı hatası' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>ComfyUI durumu kontrol ediliyor...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {status?.online ? (
        <>
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            ComfyUI Çalışıyor
          </Badge>
          {status.version && (
            <span className="text-xs text-gray-500">v{status.version}</span>
          )}
        </>
      ) : (
        <>
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            ComfyUI Kapalı
          </Badge>
          {status?.error && (
            <span className="text-xs text-red-500">{status.error}</span>
          )}
        </>
      )}
    </div>
  )
}
