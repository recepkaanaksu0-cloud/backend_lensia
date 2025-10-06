# Post-Generation API Endpoints

## Overview

Bu dokümantasyon, `/generate` sayfasında fotoğraf üretimi tamamlandıktan sonra kullanılabilecek tüm API endpoint'lerini ve geliştirme önerilerini içerir.

## 📊 Mevcut Durum (Before)

### Mevcut API Çağrıları:
1. **POST** `/api/generate` - Ana üretim endpoint'i
2. **POST** `/api/generate/{requestId}/select` - Fotoğraf seçme/reddetme
3. **POST** `/api/generate/{requestId}/refine` - Fotoğraf iyileştirme
4. **POST** `/api/generate/{requestId}/edit` - Fotoğraf düzenleme
5. **GET** `/api/generate/{requestId}/stream` (SSE) - Gerçek zamanlı güncellemeler

### Eksikler:
- ❌ Durum sorgulama endpoint'i (polling için)
- ❌ Analytics/tracking sistemi
- ❌ Kullanıcı feedback mekanizması
- ❌ Download yönetimi
- ❌ Metadata güncellemeleri

---

## ✨ Yeni API Endpoints

### 1. Status Endpoint (Polling)

**Purpose:** Üretim durumunu sorgulamak için lightweight endpoint

**Endpoint:** `GET /api/generate/{requestId}/status`

**Response:**
```typescript
{
  requestId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  processingStatus: string
  progress: number          // 0-100
  currentStep: string
  images: GeneratedImage[]
  completedAt?: string
  errorMessage?: string
  metadata: Record<string, any>
}
```

**Use Cases:**
- SSE bağlantısı koptuğunda fallback polling
- Mobile cihazlarda daha güvenilir takip
- Status dashboard'ları
- Webhook confirmation

**Example:**
```typescript
import { getGenerationStatus } from '@/lib/api/post-generation'

const status = await getGenerationStatus(requestId)
console.log(`Progress: ${status.progress}%`)
```

---

### 2. Analytics Endpoint

**Purpose:** Kullanıcı etkileşimlerini takip etmek

**Endpoints:**
- `POST /api/generate/{requestId}/analytics` - Event tracking
- `GET /api/generate/{requestId}/analytics` - Analytics özeti

**Event Types:**
```typescript
type EventType = 
  | 'view'      // Fotoğraf görüntüleme
  | 'click'     // Fotoğrafa tıklama
  | 'select'    // Fotoğraf seçme
  | 'reject'    // Fotoğraf reddetme
  | 'download'  // Fotoğraf indirme
  | 'refine'    // Fotoğraf iyileştirme
  | 'edit'      // Fotoğraf düzenleme
```

**POST Request:**
```typescript
{
  eventType: 'click',
  photoId: 'img-123',
  action: 'view_details',
  metadata: {
    duration: 5000,  // ms
    source: 'grid'
  }
}
```

**GET Response:**
```typescript
{
  totalEvents: 42,
  byType: {
    view: 15,
    click: 10,
    select: 8,
    download: 5,
    refine: 3,
    edit: 1
  },
  byPhoto: {
    'img-123': 12,
    'img-124': 8
  },
  events: [...]
}
```

**Use Cases:**
- En çok beğenilen fotoğrafları belirleme
- Kullanıcı davranış analizi
- A/B testing için veri toplama
- AI model improvement için feedback

**Example:**
```typescript
import { trackAnalytics } from '@/lib/api/post-generation'

await trackAnalytics(requestId, {
  eventType: 'view',
  photoId: 'img-123',
  metadata: { viewDuration: 3000 }
})
```

---

### 3. Feedback Endpoint

**Purpose:** Kullanıcı memnuniyeti ve kalite değerlendirmesi

**Endpoints:**
- `POST /api/generate/{requestId}/feedback` - Feedback gönderme
- `GET /api/generate/{requestId}/feedback` - Feedback özeti

**POST Request:**
```typescript
{
  photoId?: string,        // Opsiyonel: Spesifik fotoğraf için
  rating: 4,               // 1-5 zorunlu
  quality: 'good',         // poor | fair | good | excellent
  issues?: [               // Opsiyonel: Problemler
    'blurry',
    'wrong_colors',
    'bad_composition'
  ],
  comment?: string         // Opsiyonel: Serbest metin
}
```

**Response:**
```typescript
{
  success: true,
  feedback: {...},
  averageRating: 4.2,
  totalFeedback: 5
}
```

**Use Cases:**
- Kalite metriği toplama
- AI model training data
- Otomatik quality scoring
- Premium feature'lar için threshold

**Example:**
```typescript
import { submitFeedback } from '@/lib/api/post-generation'

await submitFeedback(requestId, {
  rating: 5,
  quality: 'excellent',
  comment: 'Harika sonuç!'
})
```

---

### 4. Download Endpoint

**Purpose:** Fotoğraf indirme ve tracking

**Endpoints:**
- `POST /api/generate/{requestId}/download` - Download hazırlama
- `GET /api/generate/{requestId}/download` - Download istatistikleri

**POST Request:**
```typescript
{
  photoIds: ['img-123', 'img-124'],
  format: 'original' | 'png' | 'jpg',
  quality: 'standard' | 'high' | 'ultra'
}
```

**Response:**
```typescript
{
  success: true,
  downloads: [
    {
      id: 'img-123',
      url: 'https://...',
      thumbnailUrl: 'https://...',
      filename: 'lensia-req-123-img-123.png'
    }
  ],
  count: 2,
  format: 'png',
  quality: 'high'
}
```

**GET Response:**
```typescript
{
  totalDownloads: 8,
  lastDownload: '2025-01-20T10:30:00Z',
  downloadHistory: [...]
}
```

**Use Cases:**
- Download tracking
- Token usage hesaplama
- Kullanım istatistikleri
- Batch download desteği

**Example:**
```typescript
import { downloadPhotos } from '@/lib/api/post-generation'

await downloadPhotos(requestId, ['img-123', 'img-124'], 'png')
```

---

### 5. Metadata Endpoint

**Purpose:** Generation metadata'sını okuma ve güncelleme

**Endpoints:**
- `GET /api/generate/{requestId}/metadata` - Metadata okuma
- `PATCH /api/generate/{requestId}/metadata` - Metadata güncelleme

**GET Response:**
```typescript
{
  requestId: string,
  metadata: {
    images: [...],
    steps: [...],
    analytics: [...],
    feedback: [...],
    customFields: {...}
  },
  created: string,
  updated: string,
  status: string
}
```

**PATCH Request:**
```typescript
{
  metadata: {
    customTag: 'product-shoot',
    campaignId: 'winter-2025',
    notes: 'Client approved'
  }
}
```

**Use Cases:**
- Custom tagging
- Campaign tracking
- Organization/filtering
- Metadata enrichment

**Example:**
```typescript
import { updateMetadata } from '@/lib/api/post-generation'

await updateMetadata(requestId, {
  campaignId: 'spring-2025',
  approved: true
})
```

---

## 🔄 Workflow Örnekleri

### Complete Post-Generation Flow:

```typescript
// 1. Generation tamamlandı
const generation = await createGeneration({...})

// 2. Status kontrolü (SSE yedeği)
const status = await getGenerationStatus(generation.requestId)

// 3. Kullanıcı fotoğrafları görüntülüyor
await trackAnalytics(generation.requestId, {
  eventType: 'view',
  photoId: 'img-123'
})

// 4. Kullanıcı fotoğraf seçiyor
await selectPhoto(generation.requestId, 'img-123')
await trackAnalytics(generation.requestId, {
  eventType: 'select',
  photoId: 'img-123'
})

// 5. Feedback veriyor
await submitFeedback(generation.requestId, {
  photoId: 'img-123',
  rating: 5,
  quality: 'excellent'
})

// 6. İndiriyor
await downloadPhotos(generation.requestId, ['img-123'], 'png')

// 7. Custom metadata ekliyor
await updateMetadata(generation.requestId, {
  projectName: 'E-commerce Shoot',
  approved: true
})

// 8. Analytics özeti
const analytics = await getAnalytics(generation.requestId)
console.log('Total interactions:', analytics.totalEvents)
```

---

## 🚀 Geliştirme Önerileri

### 1. **Batch Operations**
```typescript
// Çoklu fotoğraf için toplu işlemler
POST /api/generate/batch/download
POST /api/generate/batch/feedback
POST /api/generate/batch/analytics
```

### 2. **Webhook Integration**
```typescript
// Generation tamamlandığında otomatik webhook
POST /api/generate/{requestId}/webhooks
{
  url: 'https://your-app.com/webhook',
  events: ['completed', 'failed', 'photo_generated']
}
```

### 3. **Export & Share**
```typescript
// Fotoğrafları paylaşma
POST /api/generate/{requestId}/share
{
  photoIds: [...],
  platform: 'instagram' | 'facebook' | 'email',
  message: 'Check out my AI photos!'
}
```

### 4. **AI-Powered Suggestions**
```typescript
// En iyi fotoğrafı AI ile seç
GET /api/generate/{requestId}/suggestions
{
  bestPhoto: 'img-123',
  confidence: 0.95,
  reasons: ['best_composition', 'highest_quality']
}
```

### 5. **Version Control**
```typescript
// Fotoğraf versiyonları
GET /api/generate/{requestId}/photos/{photoId}/versions
POST /api/generate/{requestId}/photos/{photoId}/restore?version=2
```

### 6. **Comparison View**
```typescript
// Fotoğrafları karşılaştır
POST /api/generate/{requestId}/compare
{
  photoIds: ['img-123', 'img-124'],
  metrics: ['quality', 'composition', 'colors']
}
```

---

## 📈 Performance Optimizations

### 1. **Caching Strategy**
```typescript
// Redis cache for status
GET /api/generate/{requestId}/status
Cache-Control: max-age=5

// CDN for images
GET /api/generate/{requestId}/photos/{photoId}
Cache-Control: public, max-age=31536000
```

### 2. **Pagination**
```typescript
// Analytics pagination
GET /api/generate/{requestId}/analytics?page=1&limit=50
```

### 3. **Compression**
```typescript
// Thumbnail optimization
GET /api/generate/{requestId}/photos/{photoId}/thumbnail
{
  quality: 'low' | 'medium' | 'high',
  format: 'webp' | 'jpg',
  maxWidth: 400
}
```

---

## 🔐 Security Considerations

### Rate Limiting
```typescript
// Per user limits
POST /api/generate/{requestId}/analytics
Rate-Limit: 100 requests/minute

// Per IP limits
POST /api/generate/{requestId}/feedback
Rate-Limit: 50 requests/hour
```

### Authentication
```typescript
// Token-based auth
Authorization: Bearer {token}

// Session-based auth
Cookie: session_id={id}
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Track:
1. **Generation Success Rate** - %completed vs %failed
2. **Average Processing Time** - Süre metriği
3. **User Engagement** - Click/view/download oranları
4. **Quality Score** - Ortalama feedback rating
5. **API Response Times** - Endpoint performance
6. **Error Rates** - Failed requests

### Example Dashboard Query:
```typescript
const metrics = {
  totalGenerations: await db.count('generations'),
  avgRating: await db.avg('quality_score'),
  topPhotos: await getAnalytics().byPhoto,
  conversionRate: (downloads / generations) * 100
}
```

---

## 🧪 Testing

### Unit Tests:
```typescript
describe('Analytics API', () => {
  it('should track view event', async () => {
    const result = await trackAnalytics(requestId, {
      eventType: 'view',
      photoId: 'test-123'
    })
    expect(result.success).toBe(true)
  })
})
```

### Integration Tests:
```typescript
describe('Post-Generation Flow', () => {
  it('should complete full workflow', async () => {
    const status = await getGenerationStatus(requestId)
    await trackAnalytics(requestId, {...})
    await submitFeedback(requestId, {...})
    await downloadPhotos(requestId, [...])
    // Assertions
  })
})
```

---

## 📝 Migration Guide

### Phase 1: Add New Endpoints (Week 1)
- ✅ Implement status, analytics, feedback, download, metadata endpoints
- ✅ Add database migrations for new fields
- ✅ Create hooks for frontend

### Phase 2: Update Frontend (Week 2)
- Update generate page to use new hooks
- Add analytics tracking to all interactions
- Implement feedback UI
- Add download manager

### Phase 3: Analytics Dashboard (Week 3)
- Create admin dashboard
- Add charts and metrics
- Implement export functionality

### Phase 4: Optimization (Week 4)
- Add caching layer
- Implement rate limiting
- Performance tuning
- Load testing

---

## 🎯 Success Criteria

- ✅ All endpoints return < 200ms response time
- ✅ Analytics capture rate > 95%
- ✅ Feedback submission rate > 30%
- ✅ Download success rate > 99%
- ✅ Zero data loss in metadata updates
- ✅ API error rate < 0.1%

---

## 🔗 Related Documentation

- [API_WEBHOOK_GUIDE.md](./API_WEBHOOK_GUIDE.md) - Webhook integration
- [PHOTO_EDIT_FEATURES.md](./docs/PHOTO_EDIT_FEATURES.md) - Edit features
- [GENERATE_PAGE_COMPLETED.md](./GENERATE_PAGE_COMPLETED.md) - Generate page spec
