'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UserResponses {
  sector: string
  platform: string
  style: string
  mood: string
  colors: string[]
  additionalDetails: string
  customTags?: string[]
  additionalNotes?: string
}

interface Workflow {
  id: string
  step: string
  stepName: string
  status: string
  progress: number
  generatedPrompt?: string
  requestedPhotoCount: number
  generatedPhotoCount: number
  startedAt: string | null
  completedAt: string | null
}

interface GeneratedPhoto {
  id: string
  photoUrl: string
  thumbnailUrl: string | null
  prompt: string
  aiModel: string
  isSelected: boolean
  generationStep: string
  refinements: unknown[]
}

interface GenerationRequest {
  id: string
  userId: string
  userResponses: UserResponses
  uploadedImageBase64: string
  aspectRatio: string
  negativePrompt: string | null
  currentStep: string
  status: string
  workflows: Workflow[]
  generatedPhotos: GeneratedPhoto[]
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [requests, setRequests] = useState<GenerationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'error'>('all')
  const [selectedRequest, setSelectedRequest] = useState<GenerationRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processingPhotos, setProcessingPhotos] = useState<Set<string>>(new Set())
  const [processLogs, setProcessLogs] = useState<Record<string, string[]>>({})

  // Log ekleyen yardımcı fonksiyon
  const addLog = (photoId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR')
    const logMessage = `[${timestamp}] ${message}`
    console.log(`📝 [Photo ${photoId.slice(0, 8)}]`, message)
    
    setProcessLogs(prev => ({
      ...prev,
      [photoId]: [...(prev[photoId] || []), logMessage]
    }))
  }

  // Post-process işlemi başlat
  const handlePostProcess = async (photoId: string, processType: string, params?: any) => {
    try {
      addLog(photoId, `🚀 ${processType} işlemi başlatılıyor...`)
      setProcessingPhotos(prev => new Set(prev).add(photoId))

      const requestBody = {
        photoId,
        processType,
        params: params || {}
      }

      addLog(photoId, `📤 Request: ${JSON.stringify(requestBody)}`)

      const response = await fetch('/api/post-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      
      addLog(photoId, `📥 Response Status: ${response.status}`)
      addLog(photoId, `📥 Response Data: ${JSON.stringify(data)}`)

      if (data.success) {
        addLog(photoId, `✅ İşlem başarılı! Refinement ID: ${data.refinementId}`)
        
        // Polling ile durum takibi
        pollRefinementStatus(photoId, data.refinementId)
      } else {
        addLog(photoId, `❌ Hata: ${data.error}`)
        setProcessingPhotos(prev => {
          const next = new Set(prev)
          next.delete(photoId)
          return next
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      addLog(photoId, `❌ Exception: ${errorMessage}`)
      console.error('Post-process error:', error)
      setProcessingPhotos(prev => {
        const next = new Set(prev)
        next.delete(photoId)
        return next
      })
    }
  }

  // Refinement durumunu polling ile kontrol et
  const pollRefinementStatus = async (photoId: string, refinementId: string) => {
    let attempts = 0
    const maxAttempts = 60 // 60 saniye (her 1 saniyede bir)

    const checkStatus = async () => {
      try {
        attempts++
        addLog(photoId, `🔍 Durum kontrolü (${attempts}/${maxAttempts})...`)

        const response = await fetch(`/api/post-process?refinementId=${refinementId}`)
        const data = await response.json()

        if (data.success && data.refinement) {
          const status = data.refinement.status
          addLog(photoId, `📊 Durum: ${status}`)

          if (status === 'completed') {
            addLog(photoId, `✅ İşlem tamamlandı! Output: ${data.refinement.outputImageUrl}`)
            setProcessingPhotos(prev => {
              const next = new Set(prev)
              next.delete(photoId)
              return next
            })
            // Listeyi yenile
            fetchRequests()
          } else if (status === 'error') {
            addLog(photoId, `❌ İşlem başarısız: ${data.refinement.error}`)
            setProcessingPhotos(prev => {
              const next = new Set(prev)
              next.delete(photoId)
              return next
            })
          } else if (attempts < maxAttempts) {
            // Hala işleniyor, tekrar kontrol et
            setTimeout(checkStatus, 1000)
          } else {
            addLog(photoId, `⏱️ Zaman aşımı (${maxAttempts} saniye)`)
            setProcessingPhotos(prev => {
              const next = new Set(prev)
              next.delete(photoId)
              return next
            })
          }
        }
      } catch (error) {
        addLog(photoId, `❌ Durum kontrolü hatası: ${error}`)
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000)
        }
      }
    }

    checkStatus()
  }

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/generate')
      const data = await response.json()
      if (data.success) {
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('İstekler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtreleme ve arama
  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'active' && req.status !== 'pending' && req.status !== 'processing') {
      return false
    }
    if (activeTab === 'completed' && req.status !== 'completed') {
      return false
    }
    if (activeTab === 'error' && req.status !== 'error') {
      return false
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        req.id.toLowerCase().includes(search) ||
        req.userId.toLowerCase().includes(search) ||
        req.userResponses.sector.toLowerCase().includes(search) ||
        req.userResponses.style.toLowerCase().includes(search) ||
        req.userResponses.platform.toLowerCase().includes(search)
      )
    }

    return true
  })

  // İstatistikler
  const stats = {
    total: requests.length,
    active: requests.filter((r) => r.status === 'pending' || r.status === 'processing').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    error: requests.filter((r) => r.status === 'error').length,
    photos: requests.reduce((sum, r) => sum + r.generatedPhotos.length, 0),
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      completed: 'bg-green-500',
      error: 'bg-red-500',
      skipped: 'bg-gray-400',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStepIcon = (step: string) => {
    const icons: Record<string, string> = {
      step1_prompt_generation: '✨',
      step2_ai_generation: '🎨',
      step3_user_selection: '👆',
      step4_refinement: '🔧',
    }
    return icons[step] || '📋'
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 Lensia.ai Admin Panel</h1>
        <p className="text-gray-600">
          Fotoğraf üretim isteklerini yönetin ve takip edin
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Toplam İstek</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.active}</div>
              <div className="text-sm text-gray-600 mt-1">Aktif</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600 mt-1">Tamamlandı</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-600 mt-1">Hata</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.photos}</div>
              <div className="text-sm text-gray-600 mt-1">Fotoğraf</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtreler */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="🔍 ID, kullanıcı, sektör, stil veya platform ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setActiveTab('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            Tümü ({stats.total})
          </Button>
          <Button
            onClick={() => setActiveTab('active')}
            variant={activeTab === 'active' ? 'default' : 'outline'}
            size="sm"
          >
            🔄 Aktif ({stats.active})
          </Button>
          <Button
            onClick={() => setActiveTab('completed')}
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            size="sm"
          >
            ✅ Tamamlandı ({stats.completed})
          </Button>
          <Button
            onClick={() => setActiveTab('error')}
            variant={activeTab === 'error' ? 'default' : 'outline'}
            size="sm"
          >
            ❌ Hata ({stats.error})
          </Button>
        </div>
      </div>

      {/* İstek Listesi */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'Arama sonucu bulunamadı' : 'İstek bulunamadı'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader
                className="cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-3 flex-wrap">
                      <span>#{request.id.slice(0, 8)}</span>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.toUpperCase()}
                      </Badge>
                      {request.generatedPhotos.length > 0 && (
                        <Badge variant="outline">
                          🖼️ {request.generatedPhotos.length} fotoğraf
                        </Badge>
                      )}
                    </CardTitle>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Kullanıcı:</span>
                        <div className="font-mono text-xs truncate">{request.userId.slice(0, 12)}...</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Sektör:</span>
                        <div className="font-medium truncate">{request.userResponses.sector}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Stil:</span>
                        <div className="font-medium truncate">{request.userResponses.style}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Platform:</span>
                        <div className="font-medium truncate">{request.userResponses.platform}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      📅 {new Date(request.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRequest(request)
                    }}
                  >
                    Detaylar →
                  </Button>
                </div>

                {/* İlerleme Çubuğu */}
                {request.status === 'processing' && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                      <span>İlerleme</span>
                      <span>
                        {request.workflows.filter((w) => w.status === 'completed').length} /{' '}
                        {request.workflows.length} adım
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {request.workflows.map((workflow) => (
                        <div
                          key={workflow.id}
                          className={`h-1.5 flex-1 rounded-full ${
                            workflow.status === 'completed'
                              ? 'bg-green-500'
                              : workflow.status === 'processing'
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Detay Modal - GENİŞ */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="!max-w-[98vw] w-full !max-h-[98vh] overflow-y-auto p-6">
          {selectedRequest && (
            <>
              <DialogHeader className="pb-3 border-b">
                <DialogTitle className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl font-bold">
                        {selectedRequest.userResponses.sector}
                      </span>
                      <Badge className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status.toUpperCase()}
                      </Badge>
                      {selectedRequest.generatedPhotos.length > 0 && (
                        <Badge variant="outline" className="text-base">
                          🖼️ {selectedRequest.generatedPhotos.length} Fotoğraf
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 font-mono">
                      #{selectedRequest.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span>👤 {selectedRequest.userId.slice(0, 12)}...</span>
                    <span className="hidden md:inline">•</span>
                    <span>🎨 {selectedRequest.userResponses.style}</span>
                    <span className="hidden md:inline">•</span>
                    <span>📱 {selectedRequest.userResponses.platform}</span>
                    <span className="hidden md:inline">•</span>
                    <span>📅 {new Date(selectedRequest.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-3">
                {/* Üretilen Fotoğraflar - EN ÜSTTE VE BÜYÜK */}
                {selectedRequest.generatedPhotos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        🖼️ Üretilen Fotoğraflar ({selectedRequest.generatedPhotos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {selectedRequest.generatedPhotos.map((photo) => (
                          <div key={photo.id} className="space-y-2">
                            <div
                              className="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(photo.photoUrl)
                              }}
                            >
                              <Image
                                src={photo.photoUrl}
                                alt="Generated"
                                width={400}
                                height={300}
                                className="w-full h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="text-white text-center space-y-1 p-2">
                                  <div className="text-xs font-semibold">{photo.aiModel}</div>
                                  <div className="text-xs bg-white/20 px-2 py-1 rounded">
                                    🔍 Büyüt
                                  </div>
                                </div>
                              </div>
                              {photo.isSelected && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                  ✓
                                </div>
                              )}
                              {processingPhotos.has(photo.id) && (
                                <div className="absolute inset-0 bg-blue-500 bg-opacity-80 flex items-center justify-center">
                                  <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <div className="text-xs">İşleniyor...</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Post-process Butonları */}
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs py-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePostProcess(photo.id, 'background-change')
                                }}
                                disabled={processingPhotos.has(photo.id)}
                              >
                                🎨 Arka Plan
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs py-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePostProcess(photo.id, 'upscale')
                                }}
                                disabled={processingPhotos.has(photo.id)}
                              >
                                ⬆️ Upscale
                              </Button>
                            </div>

                            {/* Loglar */}
                            {processLogs[photo.id] && processLogs[photo.id].length > 0 && (
                              <div className="text-xs bg-gray-100 rounded p-2 max-h-32 overflow-y-auto">
                                {processLogs[photo.id].slice(-5).map((log, idx) => (
                                  <div key={idx} className="font-mono text-[10px] text-gray-700">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bilgi Kartları - 3 SÜTUN */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">👤 Kullanıcı Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600 block mb-1">Kullanıcı ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded block">
                          {selectedRequest.userId}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">İstek ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded block">
                          {selectedRequest.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Oluşturulma:</span>
                        <span className="text-xs">
                          {new Date(selectedRequest.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aspect Ratio:</span>
                        <span className="font-medium">{selectedRequest.aspectRatio}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Durum:</span>
                        <Badge className={getStatusColor(selectedRequest.status)}>
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🎨 Tasarım Tercihleri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sektör:</span>
                        <span className="font-medium">{selectedRequest.userResponses.sector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium">{selectedRequest.userResponses.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stil:</span>
                        <span className="font-medium">{selectedRequest.userResponses.style}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ruh Hali:</span>
                        <span className="font-medium">{selectedRequest.userResponses.mood}</span>
                      </div>
                      {selectedRequest.userResponses.additionalDetails && (
                        <div className="pt-2">
                          <span className="text-gray-600 block mb-1">Ek Detaylar:</span>
                          <p className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                            {selectedRequest.userResponses.additionalDetails}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🎨 Renk Paleti</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {selectedRequest.userResponses.colors.map((color, idx) => (
                          <div key={idx} className="text-center">
                            <div
                              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm mb-1"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-xs font-mono text-gray-600 block truncate max-w-[48px]">
                              {color.slice(0, 7)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {selectedRequest.negativePrompt && (
                        <div className="mt-4">
                          <span className="text-gray-600 text-sm block mb-1">Negatif Prompt:</span>
                          <p className="text-xs bg-red-50 p-2 rounded border border-red-200">
                            {selectedRequest.negativePrompt}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* İş Akışı Detayları */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📊 İş Akışı Detayları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedRequest.workflows.map((workflow, index) => (
                        <div
                          key={workflow.id}
                          className={`p-4 rounded-lg border-2 ${
                            workflow.status === 'completed'
                              ? 'bg-green-50 border-green-200'
                              : workflow.status === 'processing'
                              ? 'bg-blue-50 border-blue-200 animate-pulse'
                              : workflow.status === 'error'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getStepIcon(workflow.step)}</span>
                              <div>
                                <div className="font-semibold">
                                  Adım {index + 1}: {workflow.stepName}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {workflow.status === 'completed'
                                    ? '✅ Tamamlandı'
                                    : workflow.status === 'processing'
                                    ? `🔄 İşleniyor (${workflow.progress}%)`
                                    : workflow.status === 'error'
                                    ? '❌ Hata'
                                    : '⏳ Bekliyor'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {workflow.step === 'step1_prompt_generation' && workflow.generatedPrompt && (
                            <div className="mt-3 p-3 bg-white rounded text-sm">
                              <div className="font-semibold mb-1">Oluşturulan Prompt:</div>
                              <div className="text-gray-700">{workflow.generatedPrompt}</div>
                            </div>
                          )}

                          {workflow.step === 'step2_ai_generation' && (
                            <div className="mt-3 text-sm text-gray-600">
                              🎯 {workflow.generatedPhotoCount} / {workflow.requestedPhotoCount} fotoğraf üretildi
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Referans Görsel */}
                {selectedRequest.uploadedImageBase64 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">📸 Yüklenen Referans Görsel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Image
                        src={selectedRequest.uploadedImageBase64}
                        alt="Uploaded"
                        width={800}
                        height={600}
                        className="w-full max-w-2xl mx-auto rounded-lg border"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Fotoğraf Büyütme Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="!max-w-[90vw] !max-h-[90vh] p-4">
          <DialogHeader>
            <DialogTitle>Fotoğraf Önizleme</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-4 flex items-center justify-center">
              <Image
                src={selectedImage}
                alt="Full size"
                width={1600}
                height={1200}
                className="w-full h-auto rounded-lg max-h-[80vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
