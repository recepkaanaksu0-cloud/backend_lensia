# ✅ Backend Database Kayıt Sistemi

## 📊 Generation Tamamlandığında Yapılanlar

### 1. Her Fotoğraf Üretildiğinde
```typescript
// GeneratedPhoto tablosuna kaydedilir
await prisma.generatedPhoto.create({
  data: {
    requestId,
    photoUrl: 'https://storage.url/photo.jpg',
    thumbnailUrl: 'https://storage.url/thumb.jpg',
    prompt: 'Generated prompt...',
    negativePrompt: 'low quality, blurry',
    generationStep: 'step2_ai_generation',
    aiModel: 'gemini-2.5-flash',
    metadata: JSON.stringify({
      width: 1024,
      height: 1024,
      seed: 'unique-seed'
    })
  }
})
```

### 2. Tüm Fotoğraflar Tamamlandığında
```typescript
// GenerationRequest tablosunda brandIdentity.metadata güncellenir
await prisma.generationRequest.update({
  where: { id: requestId },
  data: {
    status: 'completed',
    brandIdentity: JSON.stringify({
      ...existingBrandIdentity,
      metadata: {
        images: [
          'https://storage.url/photo1.jpg',
          'https://storage.url/photo2.jpg'
        ],
        photoCount: 2
      }
    })
  }
})
```

## 🗄️ Database Schema

### GenerationRequest
```sql
{
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  brandIdentity: {
    productName: string
    productImages: string[]
    metadata: {
      images: string[]        // ✅ Oluşturulan fotoğraflar
      photoCount: number      // ✅ Toplam fotoğraf sayısı
    }
  }
}
```

### GeneratedPhoto
```sql
{
  id: string
  requestId: string
  photoUrl: string            // ✅ Ana fotoğraf URL'i
  thumbnailUrl: string        // ✅ Thumbnail URL'i
  prompt: string
  negativePrompt: string
  generationStep: string
  aiModel: string
  metadata: {
    width: number
    height: number
    seed: string
  }
}
```

## 📖 API'den Metadata Okuma

### Tüm Generation'ları Listele
```bash
GET /api/generate
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "cmggw5yb6...",
      "userId": "user-123",
      "status": "completed",
      "brandIdentity": {
        "productName": "Test Ürün",
        "metadata": {
          "images": [
            "https://picsum.photos/seed/xxx-0/1024/1024",
            "https://picsum.photos/seed/xxx-1/1024/1024"
          ],
          "photoCount": 2
        }
      },
      "generatedPhotos": [
        {
          "id": "photo-1",
          "photoUrl": "https://picsum.photos/seed/xxx-0/1024/1024",
          "thumbnailUrl": "https://picsum.photos/seed/xxx-0/300/300",
          "aiModel": "gemini-2.5-flash",
          "metadata": {
            "width": 1024,
            "height": 1024,
            "seed": "xxx-0"
          }
        }
      ]
    }
  ]
}
```

### Belirli Bir Generation'ı Getir
```bash
GET /api/generate/[generationId]/photos
```

**Response:**
```json
{
  "generationId": "cmggw5yb6...",
  "status": "completed",
  "photos": [
    "https://picsum.photos/seed/xxx-0/1024/1024",
    "https://picsum.photos/seed/xxx-1/1024/1024"
  ]
}
```

## ✅ Frontend Crash Koruması

Eğer frontend crash olursa:

1. **Fotoğraflar database'de kayıtlı** ✅
   - `GeneratedPhoto` tablosunda her fotoğraf mevcut
   - `GenerationRequest.brandIdentity.metadata.images` array'inde URL'ler mevcut

2. **Frontend tekrar yüklendiğinde:**
   ```javascript
   // Generation ID ile fotoğrafları al
   const response = await fetch(`/api/generate/${generationId}/photos`);
   const { photos } = await response.json();
   
   // photos: ["url1", "url2", ...]
   ```

3. **Veya tüm generation'ları listele:**
   ```javascript
   const response = await fetch('/api/generate');
   const { requests } = await response.json();
   
   // Her request'te metadata.images ve generatedPhotos mevcut
   ```

## 🧪 Test Komutları

### Yeni Generation Oluştur
```bash
curl -X POST "http://localhost:51511/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "userResponses": { ... },
    "productImages": ["..."],
    "photoCount": 2
  }' | jq '.'
```

### Metadata Kontrol Et
```bash
curl -s "http://localhost:51511/api/generate" | \
  jq '.requests[0].brandIdentity.metadata'
```

**Expected Output:**
```json
{
  "images": [
    "https://picsum.photos/seed/xxx-0/1024/1024",
    "https://picsum.photos/seed/xxx-1/1024/1024"
  ],
  "photoCount": 2
}
```

### Fotoğrafları Getir
```bash
curl -s "http://localhost:51511/api/generate/[GENERATION_ID]/photos" | jq '.'
```

## 📝 Özet

✅ **Her fotoğraf `GeneratedPhoto` tablosuna kaydedilir**
✅ **Tamamlandığında `brandIdentity.metadata` güncellenir**
✅ **Frontend crash olsa bile veriler database'de kalır**
✅ **SSE ile `photo_generated` event'i gönderilir**
✅ **Tamamlandığında `completed` event'i gönderilir**

Frontend artık güvenle fotoğrafları alabilir! 🎉
