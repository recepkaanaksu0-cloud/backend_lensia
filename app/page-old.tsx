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

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 3000) // Her 3 saniyede bir yenile
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
    // Tab filtrelemesi
    if (activeTab === 'active' && req.status !== 'pending' && req.status !== 'processing') {
      return false
    }
    if (activeTab === 'completed' && req.status !== 'completed') {
      return false
    }
    if (activeTab === 'error' && req.status !== 'error') {
      return false
    }

    // Arama filtrelemesi
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
    <main className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🎨 Lensia.ai Fotoğraf Üretim Sistemi</h1>
        <p className="text-gray-600">
          AI destekli fotoğraf oluşturma ve düzenleme iş akışı yönetimi
        </p>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔄 Aktif İstekler ({activeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-semibold transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Geçmiş ({completedRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : displayRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'active' ? 'Aktif istek yok' : 'Geçmiş istek yok'}
        </div>
      ) : (
        <div className="grid gap-6">
          {displayRequests.map((request) => (
            <Card
              key={request.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() =>
                setSelectedRequest(selectedRequest === request.id ? null : request.id)
              }
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      #{request.id.slice(0, 8)} - {request.userResponses.sector}
                    </CardTitle>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>👤 Kullanıcı: {request.userId.slice(0, 12)}...</div>
                      <div>📅 {new Date(request.createdAt).toLocaleString('tr-TR')}</div>
                      <div>
                        🎨 {request.userResponses.style} | {request.userResponses.platform}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.toUpperCase()}
                  </Badge>
                </div>

                {/* İş Akışı İlerleme Çubuğu */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                    <span>İş Akışı İlerlemesi</span>
                    <span>
                      {request.workflows.filter((w) => w.status === 'completed').length} /{' '}
                      {request.workflows.length} adım tamamlandı
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {request.workflows.map((workflow) => (
                      <div key={workflow.id} className="flex-1">
                        <div
                          className={`h-2 rounded-full ${
                            workflow.status === 'completed'
                              ? 'bg-green-500'
                              : workflow.status === 'processing'
                              ? 'bg-blue-500'
                              : workflow.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-200'
                          }`}
                          style={{
                            width:
                              workflow.status === 'processing'
                                ? `${workflow.progress}%`
                                : '100%',
                          }}
                        />
                        <div className="text-xs text-center mt-1">
                          {getStepIcon(workflow.step)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>

              {selectedRequest === request.id && (
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* İş Akışı Detayları */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">📊 İş Akışı Detayları</h3>
                      <div className="space-y-3">
                        {request.workflows.map((workflow, index) => (
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
                              {workflow.status === 'processing' && (
                                <div className="text-right text-sm">
                                  <div className="font-semibold text-blue-600">
                                    %{workflow.progress}
                                  </div>
                                  <div className="text-gray-500">ilerleme</div>
                                </div>
                              )}
                            </div>

                            {/* Progress bar */}
                            {workflow.status === 'processing' && (
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${workflow.progress}%` }}
                                />
                              </div>
                            )}

                            {/* Adım detayları */}
                            {workflow.step === 'step1_prompt_generation' &&
                              workflow.generatedPrompt && (
                                <div className="mt-3 p-3 bg-white rounded text-sm">
                                  <div className="font-semibold mb-1">Oluşturulan Prompt:</div>
                                  <div className="text-gray-700">{workflow.generatedPrompt}</div>
                                </div>
                              )}

                            {workflow.step === 'step2_ai_generation' && (
                              <div className="mt-3 text-sm text-gray-600">
                                🎯 {workflow.generatedPhotoCount} / {workflow.requestedPhotoCount}{' '}
                                fotoğraf üretildi
                              </div>
                            )}

                            {workflow.completedAt && (
                              <div className="mt-2 text-xs text-gray-500">
                                ⏱️ Tamamlanma:{' '}
                                {new Date(workflow.completedAt).toLocaleTimeString('tr-TR')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Üretilen Fotoğraflar */}
                    {request.generatedPhotos.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">
                          🖼️ Üretilen Fotoğraflar ({request.generatedPhotos.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {request.generatedPhotos.map((photo) => (
                            <div
                              key={photo.id}
                              className={`relative group overflow-hidden rounded-lg border-2 ${
                                photo.isSelected
                                  ? 'border-green-500 ring-2 ring-green-200'
                                  : 'border-gray-200'
                              }`}
                            >
                              <Image
                                src={photo.photoUrl}
                                alt="Generated"
                                width={400}
                                height={300}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="text-white text-center space-y-2">
                                  <div className="text-sm font-semibold">{photo.aiModel}</div>
                                  <Button size="sm" variant="default">
                                    Seç ve Düzenle
                                  </Button>
                                </div>
                              </div>
                              {photo.isSelected && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                  ✓
                                </div>
                              )}
                              {photo.refinements.length > 0 && (
                                <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                                  🔧 {photo.refinements.length} düzenleme
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Kullanıcı Bilgileri */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">📋 Kullanıcı Tercihleri</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">Sektör:</span>
                            <span>{request.userResponses.sector}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">Platform:</span>
                            <span>{request.userResponses.platform}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">Stil:</span>
                            <span>{request.userResponses.style}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">Ruh Hali:</span>
                            <span>{request.userResponses.mood}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-medium min-w-[80px]">Renkler:</span>
                            <div className="flex gap-1 flex-wrap">
                              {request.userResponses.colors.map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.uploadedImageBase64 && (
                        <div>
                          <h3 className="font-semibold mb-3">📸 Yüklenen Referans Görsel</h3>
                          <Image
                            src={request.uploadedImageBase64}
                            alt="Uploaded"
                            width={800}
                            height={600}
                            className="w-full rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
