# Post-Generation API - Kullanım Örnekleri

Bu dosya, yeni post-generation API endpoint'lerinin nasıl kullanılacağını gösteren pratik örnekler içerir.

## 📋 Temel Kullanım

### 1. Status Polling (SSE Fallback)

SSE bağlantısı koptuğunda veya mobile cihazlarda kullanmak için:

```typescript
import { useGenerationStatus } from '@/lib/hooks/use-generation-status'

function GenerationStatusChecker({ requestId }: { requestId: string }) {
  const { status, fetchStatus, loading } = useGenerationStatus(requestId)

  useEffect(() => {
    // Poll every 3 seconds
    const interval = setInterval(() => {
      fetchStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) return <div>Yükleniyor...</div>

  return (
    <div>
      <p>Durum: {status?.status}</p>
      <p>İlerleme: {status?.progress}%</p>
      <p>Mevcut Adım: {status?.currentStep}</p>
      <p>Fotoğraflar: {status?.images?.length}</p>
    </div>
  )
}
```

### 2. Analytics Tracking

Tüm kullanıcı etkileşimlerini otomatik takip et:

```typescript
import { useGenerationAnalytics } from '@/lib/hooks/use-generation-analytics'

function PhotoGrid({ requestId, photos }: Props) {
  const { trackEvent } = useGenerationAnalytics(requestId)

  const handlePhotoClick = async (photoId: string) => {
    // Track click event
    await trackEvent({
      eventType: 'click',
      photoId,
      metadata: { source: 'grid', timestamp: Date.now() }
    })

    // Open photo detail
    openPhotoDetail(photoId)
  }

  const handlePhotoView = async (photoId: string) => {
    // Track when photo enters viewport
    await trackEvent({
      eventType: 'view',
      photoId,
      metadata: { viewportPosition: 'visible' }
    })
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <img
          key={photo.id}
          src={photo.url}
          onClick={() => handlePhotoClick(photo.id)}
          onLoad={() => handlePhotoView(photo.id)}
        />
      ))}
    </div>
  )
}
```

### 3. User Feedback Collection

Kullanıcıdan feedback topla:

```typescript
import { useGenerationFeedback } from '@/lib/hooks/use-generation-feedback'
import { useState } from 'react'

function FeedbackForm({ requestId, photoId }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { submitFeedback, submitting } = useGenerationFeedback(requestId)

  const handleSubmit = async () => {
    try {
      const result = await submitFeedback({
        photoId,
        rating,
        quality: rating >= 4 ? 'excellent' : 'good',
        comment: comment || undefined
      })

      console.log('Ortalama puan:', result.averageRating)
      alert('Teşekkürler!')
    } catch (error) {
      alert('Hata oluştu')
    }
  }

  return (
    <div>
      <StarRating value={rating} onChange={setRating} />
      <textarea 
        value={comment} 
        onChange={e => setComment(e.target.value)}
        placeholder="Yorumunuz..."
      />
      <button onClick={handleSubmit} disabled={submitting || rating === 0}>
        Gönder
      </button>
    </div>
  )
}
```

### 4. Download Management

Fotoğrafları indir ve takip et:

```typescript
import { useGenerationDownload } from '@/lib/hooks/use-generation-download'

function DownloadButton({ requestId, photoIds }: Props) {
  const { downloadPhotos, preparing } = useGenerationDownload(requestId)

  const handleDownload = async () => {
    try {
      await downloadPhotos(photoIds, 'png')
      alert('İndirme başladı!')
    } catch (error) {
      alert('İndirme hatası')
    }
  }

  return (
    <button onClick={handleDownload} disabled={preparing}>
      {preparing ? 'Hazırlanıyor...' : 'İndir'}
    </button>
  )
}
```

## 🔥 İleri Seviye Kullanım

### Complete Integration Example

Tüm özellikleri tek sayfada kullan:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useGenerationAnalytics } from '@/lib/hooks/use-generation-analytics'
import { useGenerationFeedback } from '@/lib/hooks/use-generation-feedback'
import { useGenerationDownload } from '@/lib/hooks/use-generation-download'
import { useGenerationStatus } from '@/lib/hooks/use-generation-status'

export default function GenerationResultPage({ requestId }: { requestId: string }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  
  // Hooks
  const { status, fetchStatus } = useGenerationStatus(requestId)
  const { trackEvent } = useGenerationAnalytics(requestId)
  const { submitFeedback } = useGenerationFeedback(requestId)
  const { downloadPhotos } = useGenerationDownload(requestId)

  // Poll status if not completed
  useEffect(() => {
    if (status?.status !== 'completed') {
      const interval = setInterval(fetchStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [status, fetchStatus])

  // Track page view
  useEffect(() => {
    trackEvent({
      eventType: 'view',
      metadata: { page: 'generation-result' }
    })
  }, [trackEvent])

  const handlePhotoSelect = async (photoId: string) => {
    setSelectedPhoto(photoId)
    
    // Track selection
    await trackEvent({
      eventType: 'select',
      photoId,
      metadata: { selectionMethod: 'click' }
    })
  }

  const handleDownload = async (photoId: string) => {
    // Download photo
    await downloadPhotos([photoId], 'png')
    
    // Track download
    await trackEvent({
      eventType: 'download',
      photoId,
      metadata: { format: 'png' }
    })
  }

  const handleFeedback = async (photoId: string, rating: number) => {
    // Submit feedback
    await submitFeedback({
      photoId,
      rating,
      quality: rating >= 4 ? 'excellent' : 'good'
    })

    // Track feedback submission
    await trackEvent({
      eventType: 'select',
      photoId,
      metadata: { action: 'feedback', rating }
    })
  }

  if (status?.status === 'processing') {
    return (
      <div>
        <h2>İşleniyor... {status.progress}%</h2>
        <p>{status.currentStep}</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Üretim Tamamlandı!</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {status?.images?.map(photo => (
          <div key={photo.id} className="relative group">
            <img 
              src={photo.url} 
              alt={photo.id}
              className="w-full cursor-pointer"
              onClick={() => handlePhotoSelect(photo.id)}
            />
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => handleDownload(photo.id)}>
                İndir
              </button>
              <button onClick={() => handleFeedback(photo.id, 5)}>
                Beğendim
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoDetailModal 
          photoId={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  )
}
```

### Analytics Dashboard Integration

Admin panelinde analytics göster:

```typescript
import { GenerationAnalytics } from '@/components/generate/generation-analytics'

export default function AdminDashboard({ requestId }: { requestId: string }) {
  return (
    <div className="container mx-auto p-6">
      <h1>Generation Analytics</h1>
      <GenerationAnalytics requestId={requestId} />
    </div>
  )
}
```

### Batch Download Example

Birden fazla fotoğrafı toplu indir:

```typescript
import { prepareDownload } from '@/lib/api/post-generation'

async function downloadAllSelected(requestId: string, selectedPhotoIds: string[]) {
  try {
    // Prepare downloads
    const result = await prepareDownload(requestId, {
      photoIds: selectedPhotoIds,
      format: 'png',
      quality: 'high'
    })

    // Download each file
    for (const download of result.downloads) {
      const link = document.createElement('a')
      link.href = download.url
      link.download = download.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Wait a bit between downloads
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`${result.count} dosya indirildi`)
  } catch (error) {
    console.error('Batch download error:', error)
  }
}
```

### Real-time Analytics Updates

Gerçek zamanlı analytics güncellemeleri:

```typescript
import { useState, useEffect } from 'react'
import { getAnalytics } from '@/lib/api/post-generation'

function LiveAnalytics({ requestId }: { requestId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    // Initial fetch
    getAnalytics(requestId).then(setAnalytics)

    // Refresh every 10 seconds
    const interval = setInterval(async () => {
      const updated = await getAnalytics(requestId)
      setAnalytics(updated)
    }, 10000)

    return () => clearInterval(interval)
  }, [requestId])

  return (
    <div>
      <h3>Canlı İstatistikler</h3>
      <p>Toplam etkileşim: {analytics?.totalEvents}</p>
      <p>Görüntüleme: {analytics?.byType?.view}</p>
      <p>Tıklama: {analytics?.byType?.click}</p>
      <p>Seçim: {analytics?.byType?.select}</p>
    </div>
  )
}
```

### Conditional Rendering Based on Status

Duruma göre farklı UI göster:

```typescript
import { useGenerationStatus } from '@/lib/hooks/use-generation-status'

function GenerationView({ requestId }: { requestId: string }) {
  const { status, loading } = useGenerationStatus(requestId)

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <LoadingSpinner />

  switch (status?.status) {
    case 'pending':
      return <PendingView message="Sırada bekleniyor..." />
    
    case 'processing':
      return (
        <ProcessingView 
          progress={status.progress}
          currentStep={status.currentStep}
        />
      )
    
    case 'completed':
      return (
        <CompletedView 
          images={status.images}
          requestId={requestId}
        />
      )
    
    case 'failed':
      return (
        <ErrorView 
          message={status.errorMessage}
          onRetry={() => retryGeneration(requestId)}
        />
      )
    
    default:
      return <div>Bilinmeyen durum</div>
  }
}
```

## 🎯 Best Practices

### 1. Error Handling

Her zaman try-catch kullan:

```typescript
async function trackUserAction(requestId: string, photoId: string) {
  try {
    await trackEvent({
      eventType: 'select',
      photoId
    })
  } catch (error) {
    // Silent fail - analytics shouldn't break user experience
    console.error('Analytics tracking failed:', error)
  }
}
```

### 2. Debouncing Analytics

Fazla event göndermemek için debounce kullan:

```typescript
import { debounce } from 'lodash'

const trackViewDebounced = debounce(async (requestId, photoId) => {
  await trackEvent({
    eventType: 'view',
    photoId
  })
}, 1000)
```

### 3. Optimistic Updates

UI'ı hemen güncelle, sonra API'ye gönder:

```typescript
const handleSelect = async (photoId: string) => {
  // Update UI immediately
  setSelectedPhotos(prev => [...prev, photoId])

  // Then track in background
  trackEvent({
    eventType: 'select',
    photoId
  }).catch(console.error)
}
```

### 4. Batch Operations

Tek seferde çoklu işlem yap:

```typescript
async function processMultiplePhotos(requestId: string, photoIds: string[]) {
  // Batch download
  await downloadPhotos(requestId, photoIds, 'png')

  // Track all downloads
  for (const photoId of photoIds) {
    trackEvent({
      eventType: 'download',
      photoId,
      metadata: { batchDownload: true }
    }).catch(console.error)
  }
}
```

## 📱 Mobile Optimization

### Use Status Polling Instead of SSE

Mobile'da SSE yerine polling kullan:

```typescript
import { isMobile } from 'react-device-detect'

function useGenerationTracking(requestId: string) {
  if (isMobile) {
    // Use polling on mobile
    return useGenerationStatus(requestId)
  } else {
    // Use SSE on desktop
    return useSSEProgress({ requestId, enabled: true })
  }
}
```

## 🔍 Debugging

### Log All Events

Development'ta tüm event'leri logla:

```typescript
const { trackEvent } = useGenerationAnalytics(requestId)

const trackEventDebug = async (event: AnalyticsEvent) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Tracking event:', event)
  }
  
  try {
    const result = await trackEvent(event)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Event tracked:', result)
    }
    return result
  } catch (error) {
    console.error('❌ Event tracking failed:', error)
  }
}
```

## 🚀 Performance Tips

1. **Lazy load analytics** - Sadece gerektiğinde yükle
2. **Cache responses** - Status ve metadata'yı cache'le
3. **Debounce events** - Fazla event göndermemek için
4. **Batch operations** - Mümkün olduğunda toplu işlem
5. **Error boundaries** - Analytics hataları UI'ı bozmamalı

---

## 📚 Additional Resources

- [POST_GENERATION_API.md](./POST_GENERATION_API.md) - Complete API documentation
- [API_WEBHOOK_GUIDE.md](../API_WEBHOOK_GUIDE.md) - Webhook integration
- [PHOTO_EDIT_FEATURES.md](./PHOTO_EDIT_FEATURES.md) - Photo editing features
